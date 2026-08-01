import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { verifyAccessToken } from '../services/token.service.js';

/**
 * Require a valid access token. Attaches the current user to req.user.
 */
export const protect = catchAsync(async (req, _res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) return next(AppError.unauthorized('Authentication required'));

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.sub);
  if (!user) return next(AppError.unauthorized('User no longer exists'));
  if (!user.isActive) return next(AppError.forbidden('Account is deactivated'));
  if (user.passwordChangedAfter(decoded.iat)) {
    return next(AppError.unauthorized('Password recently changed — please log in again'));
  }

  req.user = user;
  next();
});

/**
 * Restrict a route to one or more roles.
 *   router.get('/admin', protect, restrictTo('admin'), handler)
 */
export const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };

/**
 * Optional auth: attaches user when a valid token is present, but never blocks.
 */
export const optionalAuth = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = verifyAccessToken(header.split(' ')[1]);
      const user = await User.findById(decoded.sub);
      if (user && user.isActive) req.user = user;
    } catch {
      /* ignore invalid token for optional auth */
    }
  }
  next();
});
