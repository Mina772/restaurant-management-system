import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import { ok, created, paginated } from '../utils/apiResponse.js';

/* ── POST /reservations ────────────────────────────── */
export const createReservation = catchAsync(async (req, res) => {
  const { partySize, date, time } = req.body;

  // Find an available table that fits the party (optional auto-assign)
  const table = await Table.findOne({
    isActive: true,
    capacity: { $gte: partySize },
  }).sort('capacity');

  const reservation = await Reservation.create({
    ...req.body,
    customer: req.user._id,
    table: table?._id,
  });

  return created(res, {
    message: table
      ? 'Reservation requested — awaiting confirmation'
      : 'Reservation requested — no table auto-assigned, staff will follow up',
    data: reservation,
  });
});

/* ── GET /reservations/mine ────────────────────────── */
export const myReservations = catchAsync(async (req, res) => {
  const reservations = await Reservation.find({ customer: req.user._id })
    .sort('-date')
    .populate('table', 'number location');
  return ok(res, { data: reservations });
});

/* ── GET /reservations (staff) ─────────────────────── */
export const listReservations = catchAsync(async (req, res) => {
  const features = new ApiFeatures(Reservation.find(), req.query).filter().sort().paginate();
  const [items, total] = await Promise.all([
    features.query.populate('customer', 'name email').populate('table', 'number'),
    Reservation.countDocuments(),
  ]);
  return paginated(res, { items, page: features.page, limit: features.limit, total });
});

/* ── PATCH /reservations/:id/status (staff) ─────────── */
export const updateReservationStatus = catchAsync(async (req, res) => {
  const reservation = await Reservation.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, ...(req.body.table ? { table: req.body.table } : {}) },
    { new: true, runValidators: true }
  );
  if (!reservation) throw AppError.notFound('Reservation not found');
  return ok(res, { message: 'Reservation updated', data: reservation });
});

/* ── PATCH /reservations/:id/cancel (owner) ─────────── */
export const cancelReservation = catchAsync(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw AppError.notFound('Reservation not found');
  if (reservation.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw AppError.forbidden('Not allowed');
  }
  reservation.status = 'cancelled';
  await reservation.save();
  return ok(res, { message: 'Reservation cancelled', data: reservation });
});
