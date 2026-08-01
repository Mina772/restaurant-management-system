import { Router } from 'express';
import * as ctrl from '../controllers/category.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', ctrl.listCategories);
router.get('/:slug', ctrl.getCategory);

router.post('/', protect, restrictTo('admin'), upload.single('image'), ctrl.createCategory);
router.patch('/:id', protect, restrictTo('admin'), upload.single('image'), ctrl.updateCategory);
router.delete('/:id', protect, restrictTo('admin'), ctrl.deleteCategory);

export default router;
