import { Router } from 'express';
import * as ctrl from '../controllers/coupon.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { couponRules } from '../validators/menu.validator.js';

const router = Router();

router.use(protect);

router.post('/validate', ctrl.validateCoupon);

router.get('/', restrictTo('admin'), ctrl.listCoupons);
router.post('/', restrictTo('admin'), couponRules, validate, ctrl.createCoupon);
router.patch('/:id', restrictTo('admin'), ctrl.updateCoupon);
router.delete('/:id', restrictTo('admin'), ctrl.deleteCoupon);

export default router;
