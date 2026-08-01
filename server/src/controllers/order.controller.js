import mongoose from 'mongoose';
import Order, { ORDER_STATUS } from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Coupon from '../models/Coupon.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import { ok, created, paginated } from '../utils/apiResponse.js';
import { computeOrder } from '../services/pricing.service.js';
import { emitOrderEvent } from '../sockets/index.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';

// Allowed forward transitions to keep the pipeline consistent
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'completed', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
  refunded: [],
};

/* ── POST /orders ─────────────────────────────────────── */
export const createOrder = catchAsync(async (req, res) => {
  const { items, type, couponCode, tip, deliveryAddress, table, notes, paymentMethod } = req.body;

  const pricing = await computeOrder(items, {
    type,
    couponCode,
    tip,
    userId: req.user._id,
  });

  const order = await Order.create({
    customer: req.user._id,
    ...pricing,
    type,
    deliveryAddress: type === 'delivery' ? deliveryAddress : undefined,
    table: type === 'dine_in' ? table : undefined,
    notes,
    payment: { method: paymentMethod || 'card', status: 'unpaid' },
    estimatedReadyAt: new Date(Date.now() + 35 * 60 * 1000),
  });

  // Redeem coupon + increment sold counts (best-effort, non-blocking correctness)
  if (pricing.couponCode) {
    await Coupon.updateOne(
      { code: pricing.couponCode },
      { $inc: { usedCount: 1 }, $addToSet: { usedBy: req.user._id } }
    );
  }
  await Promise.all(
    pricing.items.map((it) =>
      MenuItem.updateOne(
        { _id: it.menuItem, stock: { $ne: null } },
        { $inc: { soldCount: it.quantity, stock: -it.quantity } }
      ).then(() =>
        // Items with unlimited stock (stock === null) still track sold counts
        MenuItem.updateOne({ _id: it.menuItem, stock: null }, { $inc: { soldCount: it.quantity } })
      )
    )
  );

  emitOrderEvent('order:new', order);
  sendOrderConfirmationEmail(req.user, order).catch(() => {});

  return created(res, { message: 'Order placed', data: order });
});

/* ── GET /orders/mine ────────────────────────────────── */
export const myOrders = catchAsync(async (req, res) => {
  const features = new ApiFeatures(Order.find({ customer: req.user._id }), req.query)
    .filter()
    .sort()
    .paginate();
  const [items, total] = await Promise.all([
    features.query,
    Order.countDocuments({ customer: req.user._id }),
  ]);
  return paginated(res, { items, page: features.page, limit: features.limit, total });
});

/* ── GET /orders (staff) ─────────────────────────────── */
export const listOrders = catchAsync(async (req, res) => {
  const features = new ApiFeatures(Order.find(), req.query).filter().sort().paginate();
  const [items, total] = await Promise.all([
    features.query.populate('customer', 'name email'),
    Order.countDocuments(),
  ]);
  return paginated(res, { items, page: features.page, limit: features.limit, total });
});

/* ── GET /orders/:id ─────────────────────────────────── */
export const getOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer', 'name email phone');
  if (!order) throw AppError.notFound('Order not found');

  const isOwner = order.customer._id.toString() === req.user._id.toString();
  const isStaff = ['admin', 'staff', 'kitchen', 'cashier', 'delivery'].includes(req.user.role);
  if (!isOwner && !isStaff) throw AppError.forbidden('Not allowed to view this order');

  return ok(res, { data: order });
});

/* ── GET /orders/track/:orderNumber (public-ish) ──────── */
export const trackOrder = catchAsync(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber }).select(
    'orderNumber status type statusHistory estimatedReadyAt total createdAt'
  );
  if (!order) throw AppError.notFound('Order not found');
  return ok(res, { data: order });
});

/* ── PATCH /orders/:id/status (staff) ───────────────── */
export const updateStatus = catchAsync(async (req, res) => {
  const { status, note } = req.body;
  if (!ORDER_STATUS.includes(status)) throw AppError.badRequest('Invalid status');

  const order = await Order.findById(req.params.id);
  if (!order) throw AppError.notFound('Order not found');

  const allowed = TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw AppError.badRequest(`Cannot move order from "${order.status}" to "${status}"`);
  }

  order.pushStatus(status, req.user._id, note);
  if (status === 'delivered' || status === 'completed') {
    order.payment.status = order.payment.status === 'unpaid' && order.payment.method === 'cash'
      ? 'paid'
      : order.payment.status;
  }
  await order.save();

  await AuditLog.create({
    actor: req.user._id,
    action: 'order.update_status',
    entity: 'Order',
    entityId: order._id,
    meta: { to: status },
    ip: req.ip,
  });

  emitOrderEvent('order:status', order);
  return ok(res, { message: 'Order status updated', data: order });
});

/* ── PATCH /orders/:id/assign-driver (admin/cashier) ──── */
export const assignDriver = catchAsync(async (req, res) => {
  const { driverId } = req.body;
  if (!mongoose.isValidObjectId(driverId)) throw AppError.badRequest('Invalid driver id');
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { assignedDriver: driverId },
    { new: true }
  );
  if (!order) throw AppError.notFound('Order not found');
  emitOrderEvent('order:assigned', order);
  return ok(res, { message: 'Driver assigned', data: order });
});

/* ── PATCH /orders/:id/cancel (owner or staff) ──────── */
export const cancelOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw AppError.notFound('Order not found');

  const isOwner = order.customer.toString() === req.user._id.toString();
  const isStaff = ['admin', 'cashier'].includes(req.user.role);
  if (!isOwner && !isStaff) throw AppError.forbidden('Not allowed to cancel this order');
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw AppError.badRequest('Order can no longer be cancelled');
  }

  order.pushStatus('cancelled', req.user._id, req.body.reason);
  await order.save();
  emitOrderEvent('order:status', order);
  return ok(res, { message: 'Order cancelled', data: order });
});
