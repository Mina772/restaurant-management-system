import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

/** 404 handler for unknown routes. */
export function notFound(req, _res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Normalize known Mongo/JWT errors into AppError instances. */
function normalize(err) {
  if (err.name === 'CastError') {
    return AppError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return AppError.conflict(`Duplicate value for "${field}"`);
  }
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return AppError.badRequest('Validation failed', details);
  }
  if (err.name === 'JsonWebTokenError') return AppError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError') return AppError.unauthorized('Token expired');
  return err;
}

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, next) {
  let error = normalize(err);
  if (!(error instanceof AppError)) {
    error = new AppError(error.message || 'Internal server error', error.statusCode || 500);
    error.isOperational = false;
  }

  if (!error.isOperational || error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${error.statusCode}`, err.stack || err.message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
    ...(env.nodeEnv === 'development' ? { stack: error.stack } : {}),
  });
}
