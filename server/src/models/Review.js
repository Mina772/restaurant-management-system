import mongoose from 'mongoose';
import MenuItem from './MenuItem.js';

const reviewSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 120 },
    comment: { type: String, maxlength: 1000 },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per item
reviewSchema.index({ menuItem: 1, user: 1 }, { unique: true });

/**
 * Recompute denormalized rating aggregates on the MenuItem.
 */
reviewSchema.statics.recalculate = async function recalculate(menuItemId) {
  const [stats] = await this.aggregate([
    { $match: { menuItem: menuItemId } },
    {
      $group: {
        _id: '$menuItem',
        ratingCount: { $sum: 1 },
        ratingAverage: { $avg: '$rating' },
      },
    },
  ]);

  await MenuItem.findByIdAndUpdate(menuItemId, {
    ratingCount: stats ? stats.ratingCount : 0,
    ratingAverage: stats ? stats.ratingAverage : 0,
  });
};

reviewSchema.post('save', function afterSave(doc) {
  doc.constructor.recalculate(doc.menuItem);
});

reviewSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) doc.constructor.recalculate(doc.menuItem);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
