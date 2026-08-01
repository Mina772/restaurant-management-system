import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(protect);

// Self-service
router.patch('/me', upload.single('avatar'), ctrl.updateMe);
router.post('/me/addresses', ctrl.addAddress);
router.delete('/me/addresses/:addressId', ctrl.deleteAddress);
router.get('/me/favorites', ctrl.listFavorites);
router.post('/me/favorites/:itemId', ctrl.toggleFavorite);

// Admin
router.get('/', restrictTo('admin'), ctrl.listUsers);
router.patch('/:id/role', restrictTo('admin'), ctrl.updateUserRole);
router.patch('/:id/active', restrictTo('admin'), ctrl.setUserActive);

export default router;
