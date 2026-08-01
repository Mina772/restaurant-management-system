import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import { ok, paginated } from '../utils/apiResponse.js';

/* ── PATCH /users/me ────────────────────────────────── */
export const updateMe = catchAsync(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar'];
  const updates = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  if (req.file?.path) updates.avatar = req.file.path;
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  return ok(res, { message: 'Profile updated', data: { user } });
});

/* ── Addresses ────────────────────────────────────── */
export const addAddress = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  return ok(res, { message: 'Address added', data: { addresses: user.addresses } });
});

export const deleteAddress = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) throw AppError.notFound('Address not found');
  addr.deleteOne();
  await user.save();
  return ok(res, { message: 'Address removed', data: { addresses: user.addresses } });
});

/* ── Favorites / wishlist ──────────────────────────── */
export const toggleFavorite = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const item = await MenuItem.findById(itemId);
  if (!item) throw AppError.notFound('Menu item not found');

  const user = await User.findById(req.user._id);
  const idx = user.favorites.findIndex((f) => f.toString() === itemId);
  let favorited;
  if (idx >= 0) {
    user.favorites.splice(idx, 1);
    favorited = false;
  } else {
    user.favorites.push(itemId);
    favorited = true;
  }
  await user.save({ validateBeforeSave: false });
  return ok(res, { message: favorited ? 'Added to favorites' : 'Removed from favorites', data: { favorited } });
});

export const listFavorites = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');
  return ok(res, { data: user.favorites });
});

/* ── Admin: user management ────────────────────────── */
export const listUsers = catchAsync(async (req, res) => {
  const features = new ApiFeatures(User.find(), req.query)
    .filter()
    .search(['name', 'email'])
    .sort()
    .paginate();
  const [items, total] = await Promise.all([features.query, User.countDocuments()]);
  return paginated(res, { items, page: features.page, limit: features.limit, total });
});

export const updateUserRole = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  );
  if (!user) throw AppError.notFound('User not found');
  return ok(res, { message: 'Role updated', data: { user } });
});

export const setUserActive = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  );
  if (!user) throw AppError.notFound('User not found');
  return ok(res, { message: 'User status updated', data: { user } });
});
