import crypto from 'crypto';
import User, { hashToken } from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { ok, created } from '../utils/apiResponse.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  refreshCookieOptions,
} from '../services/token.service.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/email.service.js';

function sanitize(user) {
  const obj = user.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.emailVerifyToken;
  delete obj.passwordResetToken;
  delete obj.twoFactorSecret;
  return obj;
}

async function issueTokens(user, res) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = signRefreshToken(user);

  // Persist hash for rotation/revocation; cap stored tokens to last 5 devices
  user.refreshTokens = [...(user.refreshTokens || []), hashRefreshToken(refreshToken)].slice(-5);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return accessToken;
}

/* ── POST /auth/register ──────────────────────────────── */
export const register = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw AppError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password, phone });
  const verifyToken = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationEmail(user, verifyToken);
  } catch {
    /* non-fatal — user can request resend */
  }

  const accessToken = await issueTokens(user, res);
  return created(res, {
    message: 'Registration successful. Please verify your email.',
    data: { user: sanitize(user), accessToken },
  });
});

/* ── POST /auth/login ─────────────────────────────────── */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw AppError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw AppError.forbidden('Account is deactivated');

  const accessToken = await issueTokens(user, res);
  return ok(res, { message: 'Login successful', data: { user: sanitize(user), accessToken } });
});

/* ── POST /auth/refresh ───────────────────────────────── */
export const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw AppError.unauthorized('No refresh token provided');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user) throw AppError.unauthorized('User no longer exists');

  const tokenHash = hashRefreshToken(token);
  if (!user.refreshTokens.includes(tokenHash)) {
    // Token reuse / theft detection: nuke all sessions
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    throw AppError.unauthorized('Refresh token no longer valid');
  }

  // Rotate: remove old hash, issue a fresh pair
  user.refreshTokens = user.refreshTokens.filter((h) => h !== tokenHash);
  const accessToken = await issueTokens(user, res);
  return ok(res, { message: 'Token refreshed', data: { accessToken } });
});

/* ── POST /auth/logout ────────────────────────────────── */
export const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    const decoded = (() => {
      try {
        return verifyRefreshToken(token);
      } catch {
        return null;
      }
    })();
    if (decoded) {
      const user = await User.findById(decoded.sub).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((h) => h !== hashRefreshToken(token));
        await user.save({ validateBeforeSave: false });
      }
    }
  }
  res.clearCookie('refreshToken', { ...refreshCookieOptions(), maxAge: 0 });
  return ok(res, { message: 'Logged out' });
});

/* ── GET /auth/me ─────────────────────────────────────── */
export const me = catchAsync(async (req, res) => ok(res, { data: { user: sanitize(req.user) } }));

/* ── POST /auth/verify-email ──────────────────────────── */
export const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({
    emailVerifyToken: hashToken(token),
    emailVerifyExpires: { $gt: Date.now() },
  }).select('+emailVerifyToken +emailVerifyExpires');

  if (!user) throw AppError.badRequest('Invalid or expired verification token');

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });
  return ok(res, { message: 'Email verified successfully' });
});

/* ── POST /auth/resend-verification ───────────────────── */
export const resendVerification = catchAsync(async (req, res) => {
  const user = req.user;
  if (user.isEmailVerified) return ok(res, { message: 'Email already verified' });
  const verifyToken = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });
  await sendVerificationEmail(user, verifyToken);
  return ok(res, { message: 'Verification email sent' });
});

/* ── POST /auth/forgot-password ───────────────────────── */
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond success to avoid account enumeration
  if (user) {
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }
  return ok(res, { message: 'If that email exists, a reset link has been sent.' });
});

/* ── POST /auth/reset-password ────────────────────────── */
export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    passwordResetToken: crypto.createHash('sha256').update(token).digest('hex'),
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw AppError.badRequest('Invalid or expired reset token');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // force re-login everywhere
  await user.save();

  return ok(res, { message: 'Password reset successful. Please log in.' });
});

/* ── PATCH /auth/update-password ──────────────────────── */
export const updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +refreshTokens');
  if (!(await user.comparePassword(currentPassword))) {
    throw AppError.unauthorized('Current password is incorrect');
  }
  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();
  const accessToken = await issueTokens(user, res);
  return ok(res, { message: 'Password updated', data: { accessToken } });
});
