import { body } from 'express-validator';

export const createMenuRules = [
  body('name').trim().notEmpty().isLength({ max: 120 }),
  body('description').trim().notEmpty().isLength({ max: 1000 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('image').optional().isString(),
];

export const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').optional().isLength({ max: 1000 }),
];

export const couponRules = [
  body('code').trim().notEmpty(),
  body('type').isIn(['percent', 'fixed']),
  body('value').isFloat({ min: 0 }),
  body('expiresAt').isISO8601().withMessage('Valid expiry date required'),
];

export const reservationRules = [
  body('guestName').trim().notEmpty(),
  body('guestPhone').trim().notEmpty(),
  body('partySize').isInt({ min: 1, max: 30 }),
  body('date').isISO8601().withMessage('Valid date required'),
  body('time').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be HH:MM'),
];
