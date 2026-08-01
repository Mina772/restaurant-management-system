import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOrderRules, updateStatusRules } from '../validators/order.validator.js';

const router = Router();

router.use(protect);

router.post('/', createOrderRules, validate, ctrl.createOrder);
router.get('/mine', ctrl.myOrders);
router.get('/track/:orderNumber', ctrl.trackOrder);

// Staff views
router.get('/', restrictTo('admin', 'staff', 'kitchen', 'cashier', 'delivery'), ctrl.listOrders);
router.get('/:id', ctrl.getOrder);

router.patch(
  '/:id/status',
  restrictTo('admin', 'staff', 'kitchen', 'cashier', 'delivery'),
  updateStatusRules,
  validate,
  ctrl.updateStatus
);
router.patch('/:id/assign-driver', restrictTo('admin', 'cashier'), ctrl.assignDriver);
router.patch('/:id/cancel', ctrl.cancelOrder);

export default router;
