import { Router } from 'express';
import * as ctrl from '../controllers/payment.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/:orderId/intent', protect, ctrl.createIntent);
router.post('/:orderId/refund', protect, restrictTo('admin', 'cashier'), ctrl.refundOrder);

export default router;
