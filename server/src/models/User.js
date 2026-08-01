import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const ROLES = ['customer', 'staff', 'kitchen', 'cashier', 'delivery', 'admin'];

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    street: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: 'US' },
    isDefault: { type: Boolean, default: false },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: { type: String, trim: true },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
    avatar: { type: String, default: '' },
    addresses: [addressSchema],

    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // 2FA-ready
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],

    // Security tokens (hashed at rest)
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: Date,

    // Refresh-token rotation: store hashes of valid refresh tokens
    refreshTokens: { type: [String], select: false, default: [] },

    lastLoginAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.index({ 'addresses.location': '2dsphere' });

/* ── Password hashing ─────────────────────────────────── */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

/* ── Instance methods ─────────────────────────────────── */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.passwordChangedAfter = function passwordChangedAfter(jwtIat) {
  if (!this.passwordChangedAt) return false;
  return jwtIat * 1000 < this.passwordChangedAt.getTime();
};

userSchema.methods.createEmailVerifyToken = function createEmailVerifyToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
  return raw;
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;
  return raw;
};

export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

const User = mongoose.model('User', userSchema);
export default User;
