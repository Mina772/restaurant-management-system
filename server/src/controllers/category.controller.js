import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { ok, created } from '../utils/apiResponse.js';

/* ── GET /categories ──────────────────────────────────── */
export const listCategories = catchAsync(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort('sortOrder name');
  return ok(res, { data: categories });
});

/* ── GET /categories/:slug ────────────────────────────── */
export const getCategory = catchAsync(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) throw AppError.notFound('Category not found');
  const items = await MenuItem.find({ category: category._id, isAvailable: true });
  return ok(res, { data: { category, items } });
});

/* ── POST /categories (admin) ─────────────────────────── */
export const createCategory = catchAsync(async (req, res) => {
  if (req.file?.path) req.body.image = req.file.path;
  const category = await Category.create(req.body);
  return created(res, { message: 'Category created', data: category });
});

/* ── PATCH /categories/:id (admin) ────────────────────── */
export const updateCategory = catchAsync(async (req, res) => {
  if (req.file?.path) req.body.image = req.file.path;
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw AppError.notFound('Category not found');
  return ok(res, { message: 'Category updated', data: category });
});

/* ── DELETE /categories/:id (admin) ───────────────────── */
export const deleteCategory = catchAsync(async (req, res) => {
  const inUse = await MenuItem.countDocuments({ category: req.params.id });
  if (inUse > 0) throw AppError.conflict(`Cannot delete: ${inUse} menu item(s) use this category`);
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw AppError.notFound('Category not found');
  return ok(res, { message: 'Category deleted' });
});
