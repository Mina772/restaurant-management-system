import Order from '../models/Order.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import AuditLog from '../models/AuditLog.js';
import catchAsync from '../utils/catchAsync.js';
import { ok } from '../utils/apiResponse.js';

const PAID = { 'payment.status': 'paid' };

/* ── GET /admin/stats ─────────────────────────────────── */
export const dashboardStats = catchAsync(async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    revenueAgg,
    todayRevenueAgg,
    ordersTotal,
    ordersToday,
    activeOrders,
    customers,
    menuCount,
  ] = await Promise.all([
    Order.aggregate([{ $match: PAID }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: { ...PAID, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] } }),
    User.countDocuments({ role: 'customer' }),
    MenuItem.countDocuments(),
  ]);

  return ok(res, {
    data: {
      revenue: revenueAgg[0]?.total || 0,
      revenueToday: todayRevenueAgg[0]?.total || 0,
      ordersTotal,
      ordersToday,
      activeOrders,
      customers,
      menuItems: menuCount,
    },
  });
});

/* ── GET /admin/stats/sales?days=30 ───────────────────── */
export const salesSeries = catchAsync(async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const series = await Order.aggregate([
    { $match: { ...PAID, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
  ]);

  return ok(res, { data: series });
});

/* ── GET /admin/stats/top-items ───────────────────────── */
export const topItems = catchAsync(async (_req, res) => {
  const items = await Order.aggregate([
    { $match: PAID },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItem',
        name: { $first: '$items.name' },
        qty: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 10 },
  ]);
  return ok(res, { data: items });
});

/* ── GET /admin/audit-logs ────────────────────────────── */
export const auditLogs = catchAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const logs = await AuditLog.find()
    .sort('-createdAt')
    .limit(limit)
    .populate('actor', 'name email role');
  return ok(res, { data: logs });
});
