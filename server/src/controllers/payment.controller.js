import Order from '../models/Order.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { ok } from '../utils/apiResponse.js';
import {
  createPaymentIntent,
  refundPayment,
  constructWebhookEvent,
} from '../services/payment.service.js';
import { emitOrderEvent } from '../sockets/index.js';
import logger from '../utils/logger.js';

/* ── POST /payments/:orderId/intent ────────────────── */
export const createIntent = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw AppError.notFound('Order not found');
  if (order.customer.toString() !== req.user._id.toString()) {
    throw AppError.forbidden('Not your order');
  }
  if (order.payment.status === 'paid') throw AppError.badRequest('Order already paid');

  const intent = await createPaymentIntent(order);
  order.payment.stripePaymentIntentId = intent.id;
  await order.save();

  return ok(res, {
    message: 'Payment intent created',
    data: { clientSecret: intent.client_secret, amount: order.total },
  });
});

/* ── POST /payments/:orderId/refund (admin/cashier) ───── */
export const refundOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw AppError.notFound('Order not found');
  if (order.payment.status !== 'paid') throw AppError.badRequest('Order is not paid');

  const amount = req.body.amount; // partial refund optional
  await refundPayment(order.payment.stripePaymentIntentId, amount);

  order.payment.status = 'refunded';
  order.payment.amountRefunded = amount || order.total;
  order.pushStatus('refunded', req.user._id, 'Refund issued');
  await order.save();
  emitOrderEvent('order:status', order);

  return ok(res, { message: 'Refund processed', data: order });
});

/**
 * POST /payments/webhook — Stripe webhook (raw body).
 * Mounted BEFORE json parser in app.js.
 */
export const webhook = catchAsync(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    logger.error(`Stripe webhook signature failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const order = await Order.findOne({ 'payment.stripePaymentIntentId': intent.id });
    if (order && order.payment.status !== 'paid') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      if (order.status === 'pending') order.pushStatus('confirmed', null, 'Payment received');
      await order.save();
      emitOrderEvent('order:status', order);
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    await Order.updateOne(
      { 'payment.stripePaymentIntentId': intent.id },
      { 'payment.status': 'failed' }
    );
  }

  return res.json({ received: true });
});
