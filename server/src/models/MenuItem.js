import mongoose from 'mongoose';
import slugify from 'slugify';

const optionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Size"
    choices: [
      {
        label: { type: String, required: true }, // e.g. "Large"
        priceDelta: { type: Number, default: 0 },
      },
    ],
    required: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true, maxlength: 1000 },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    compareAtPrice: { type: Number, min: 0 }, // for "was $X" discounts
    image: { type: String, required: true },
    gallery: [String],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },

    tags: { type: [String], index: true, default: [] },
    ingredients: [String],
    allergens: [String],
    options: [optionSchema],

    calories: { type: Number, min: 0 },
    prepTimeMinutes: { type: Number, default: 15, min: 0 },
    spicyLevel: { type: Number, min: 0, max: 3, default: 0 },

    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },

    isAvailable: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isPopular: { type: Boolean, default: false, index: true },

    // Denormalized rating aggregates (kept fresh by Review hooks)
    ratingAverage: { type: Number, default: 0, min: 0, max: 5, set: (v) => Math.round(v * 10) / 10 },
    ratingCount: { type: Number, default: 0 },

    soldCount: { type: Number, default: 0 },
    stock: { type: Number, default: null }, // null = unlimited
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Text index for search + compound index for common menu queries
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });
menuItemSchema.index({ category: 1, isAvailable: 1, price: 1 });

menuItemSchema.virtual('discountPercent').get(function discountPercent() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

menuItemSchema.pre('save', function setSlug(next) {
  if (this.isModified('name')) {
    this.slug = `${slugify(this.name, { lower: true, strict: true })}-${this._id
      .toString()
      .slice(-5)}`;
  }
  next();
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
