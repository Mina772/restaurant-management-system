import MenuItem from '../models/MenuItem.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import { ok, created, paginated } from '../utils/apiResponse.js';

/* ── GET /menu ────────────────────────────────────────── */
export const listMenu = catchAsync(async (req, res) => {
  const baseFilter = {};
  // Public consumers only see available items unless explicitly overridden by staff
  if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
    baseFilter.isAvailable = true;
  }

  const features = new ApiFeatures(MenuItem.find(baseFilter), req.query)
    .filter()
    .search(['name', 'description', 'tags'])
    .sort()
    .limitFields()
    .paginate();

  const [items, total] = await Promise.all([
    features.query.populate('category', 'name slug'),
    MenuItem.countDocuments({ ...baseFilter, ...buildCountFilter(req.query) }),
  ]);

  return paginated(res, { items, page: features.page, limit: features.limit, total });
});

// Mirror the ApiFeatures filter for an accurate total count
function buildCountFilter(query) {
  const q = { ...query };
  ['page', 'sort', 'limit', 'fields', 'search'].forEach((k) => delete q[k]);
  const str = JSON.stringify(q).replace(/\b(gte|gt|lte|lt|in)\b/g, (m) => `$${m}`);
  const parsed = JSON.parse(str);
  Object.keys(parsed).forEach((key) => {
    if (parsed[key]?.$in && typeof parsed[key].$in === 'string') {
      parsed[key].$in = parsed[key].$in.split(',');
    }
  });
  if (query.search) {
    const regex = new RegExp(query.search.trim(), 'i');
    parsed.$or = [{ name: regex }, { description: regex }, { tags: regex }];
  }
  return parsed;
}

/* ── GET /menu/featured ───────────────────────────────── */
export const featured = catchAsync(async (_req, res) => {
  const items = await MenuItem.find({ isAvailable: true, isFeatured: true })
    .limit(8)
    .populate('category', 'name slug');
  return ok(res, { data: items });
});

/* ── GET /menu/popular ────────────────────────────────── */
export const popular = catchAsync(async (_req, res) => {
  const items = await MenuItem.find({ isAvailable: true })
    .sort('-soldCount -ratingAverage')
    .limit(8)
    .populate('category', 'name slug');
  return ok(res, { data: items });
});

/* ── GET /menu/:slug ──────────────────────────────────── */
export const getMenuItem = catchAsync(async (req, res) => {
  const item = await MenuItem.findOne({ slug: req.params.slug }).populate('category', 'name slug');
  if (!item) throw AppError.notFound('Menu item not found');
  return ok(res, { data: item });
});

/* ── POST /menu (admin/staff) ─────────────────────────── */
export const createMenuItem = catchAsync(async (req, res) => {
  if (req.file?.path) req.body.image = req.file.path;
  const item = await MenuItem.create(req.body);
  return created(res, { message: 'Menu item created', data: item });
});

/* ── PATCH /menu/:id (admin/staff) ────────────────────── */
export const updateMenuItem = catchAsync(async (req, res) => {
  if (req.file?.path) req.body.image = req.file.path;
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw AppError.notFound('Menu item not found');
  return ok(res, { message: 'Menu item updated', data: item });
});

/* ── DELETE /menu/:id (admin) ─────────────────────────── */
export const deleteMenuItem = catchAsync(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw AppError.notFound('Menu item not found');
  return ok(res, { message: 'Menu item deleted' });
});
