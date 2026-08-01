import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // cap for percent coupons
    usageLimit: { type: Number, default: null }, // total redemptions allowed
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * Validate a coupon for a given user + subtotal and return discount amount.
 * Throws nothing — returns { valid, reason, discount }.
 */
couponSchema.methods.evaluate = function evaluate(userId, subtotal) {
  const now = Date.now();
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive', discount: 0 };
  if (this.startsAt && this.startsAt.getTime() > now)
    return { valid: false, reason: 'Coupon not yet active', discount: 0 };
  if (this.expiresAt && this.expiresAt.getTime() < now)
    return { valid: false, reason: 'Coupon has expired', discount: 0 };
  if (this.usageLimit != null && this.usedCount >= this.usageLimit)
    return { valid: false, reason: 'Coupon usage limit reached', discount: 0 };
  if (subtotal < this.minOrder)
    return { valid: false, reason: `Minimum order of ${this.minOrder} required`, discount: 0 };

  const usedByUser = this.usedBy.filter((id) => id.toString() === String(userId)).length;
  if (usedByUser >= this.perUserLimit)
    return { valid: false, reason: 'Coupon already used', discount: 0 };

  let discount =
    this.type === 'percent' ? (subtotal * this.value) / 100 : Math.min(this.value, subtotal);
  if (this.maxDiscount != null) discount = Math.min(discount, this.maxDiscount);
  discount = Math.round(discount * 100) / 100;

  return { valid: true, reason: 'OK', discount };
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
