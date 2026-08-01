import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/security.middleware.js';
import {
  registerRules,
  loginRules,
  forgotRules,
  resetRules,
  updatePasswordRules,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/login', authLimiter, loginRules, validate, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/forgot-password', authLimiter, forgotRules, validate, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, resetRules, validate, ctrl.resetPassword);

router.use(protect);
router.get('/me', ctrl.me);
router.post('/resend-verification', ctrl.resendVerification);
router.patch('/update-password', updatePasswordRules, validate, ctrl.updatePassword);

export default router;
