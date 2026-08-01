import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

/**
 * Runs registered express-validator chains and throws a 400 with the
 * collected errors when validation fails.
 */
export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(AppError.badRequest('Validation failed', details));
}
