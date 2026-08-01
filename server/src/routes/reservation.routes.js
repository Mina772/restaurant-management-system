import { Router } from 'express';
import * as ctrl from '../controllers/reservation.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { reservationRules } from '../validators/menu.validator.js';

const router = Router();

router.use(protect);

router.post('/', reservationRules, validate, ctrl.createReservation);
router.get('/mine', ctrl.myReservations);
router.patch('/:id/cancel', ctrl.cancelReservation);

router.get('/', restrictTo('admin', 'staff'), ctrl.listReservations);
router.patch('/:id/status', restrictTo('admin', 'staff'), ctrl.updateReservationStatus);

export default router;
