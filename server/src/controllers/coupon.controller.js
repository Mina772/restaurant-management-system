import Coupon from '../models/Coupon.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { ok, created } from '../utils/apiResponse.js';

/* ── POST /coupons/validate ───────────────────────────── */
export const validateCoupon = catchAsync(async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon) throw AppError.badRequest('Invalid coupon code');
  const result = coupon.evaluate(req.user._id, Number(subtotal) || 0);
  if (!result.valid) throw AppError.badRequest(result.reason);
  return ok(res, {
    message: 'Coupon applied',
    data: { code: coupon.code, discount: result.discount, type: coupon.type, value: coupon.value },
  });
});

/* ── GET /coupons (admin) ─────────────────────────────── */
export const listCoupons = catchAsync(async (_req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  return ok(res, { data: coupons });
});

/* ── POST /coupons (admin) ────────────────────────────── */
export const createCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return created(res, { message: 'Coupon created', data: coupon });
});

/* ── PATCH /coupons/:id (admin) ───────────────────────── */
export const updateCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw AppError.notFound('Coupon not found');
  return ok(res, { message: 'Coupon updated', data: coupon });
});

/* ── DELETE /coupons/:id (admin) ──────────────────────── */
export const deleteCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw AppError.notFound('Coupon not found');
  return ok(res, { message: 'Coupon deleted' });
});
