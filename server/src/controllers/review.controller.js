import Review from '../models/Review.js';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import { ok, created, paginated } from '../utils/apiResponse.js';

/* ── GET /menu/:itemId/reviews ───────────────────── */
export const listForItem = catchAsync(async (req, res) => {
  const filter = { menuItem: req.params.itemId };
  const features = new ApiFeatures(Review.find(filter), req.query).sort().paginate();
  const [items, total] = await Promise.all([
    features.query.populate('user', 'name avatar'),
    Review.countDocuments(filter),
  ]);
  return paginated(res, { items, page: features.page, limit: features.limit, total });
});

/* ── POST /menu/:itemId/reviews ──────────────────── */
export const createReview = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const item = await MenuItem.findById(itemId);
  if (!item) throw AppError.notFound('Menu item not found');

  const existing = await Review.findOne({ menuItem: itemId, user: req.user._id });
  if (existing) throw AppError.conflict('You have already reviewed this item');

  // Verified-purchase flag if the user has a delivered/completed order with this item
  const purchased = await Order.exists({
    customer: req.user._id,
    'items.menuItem': itemId,
    status: { $in: ['delivered', 'completed'] },
  });

  const review = await Review.create({
    menuItem: itemId,
    user: req.user._id,
    rating: req.body.rating,
    title: req.body.title,
    comment: req.body.comment,
    isVerifiedPurchase: Boolean(purchased),
  });

  return created(res, { message: 'Review submitted', data: review });
});

/* ── DELETE /reviews/:id (owner or admin) ───────────── */
export const deleteReview = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw AppError.notFound('Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw AppError.forbidden('Not allowed to delete this review');
  }
  await Review.findOneAndDelete({ _id: review._id });
  return ok(res, { message: 'Review deleted' });
});
