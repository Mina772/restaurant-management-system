import { body } from 'express-validator';
import { ORDER_TYPES } from '../models/Order.js';

export const createOrderRules = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.menuItem').isMongoId().withMessage('Invalid menu item id'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('type').isIn(ORDER_TYPES).withMessage('Invalid order type'),
  body('tip').optional().isFloat({ min: 0 }),
  body('couponCode').optional().isString().trim(),
  body('paymentMethod').optional().isIn(['card', 'cash', 'wallet']),
  body('deliveryAddress')
    .if(body('type').equals('delivery'))
    .notEmpty()
    .withMessage('Delivery address is required for delivery orders'),
];

export const updateStatusRules = [body('status').notEmpty().withMessage('Status is required')];
