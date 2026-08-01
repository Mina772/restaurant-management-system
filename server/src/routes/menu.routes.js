import { Router } from 'express';
import * as menu from '../controllers/menu.controller.js';
import * as review from '../controllers/review.controller.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { createMenuRules, reviewRules } from '../validators/menu.validator.js';

const router = Router();

// Public catalog
router.get('/', optionalAuth, menu.listMenu);
router.get('/featured', menu.featured);
router.get('/popular', menu.popular);
router.get('/:slug', menu.getMenuItem);

// Reviews (nested under item id)
router.get('/:itemId/reviews', review.listForItem);
router.post('/:itemId/reviews', protect, reviewRules, validate, review.createReview);

// Management (admin/staff)
router.post(
  '/',
  protect,
  restrictTo('admin', 'staff'),
  upload.single('image'),
  createMenuRules,
  validate,
  menu.createMenuItem
);
router.patch(
  '/:id',
  protect,
  restrictTo('admin', 'staff'),
  upload.single('image'),
  menu.updateMenuItem
);
router.delete('/:id', protect, restrictTo('admin'), menu.deleteMenuItem);

export default router;
