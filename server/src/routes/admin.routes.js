import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', ctrl.dashboardStats);
router.get('/stats/sales', ctrl.salesSeries);
router.get('/stats/top-items', ctrl.topItems);
router.get('/audit-logs', ctrl.auditLogs);

export default router;
