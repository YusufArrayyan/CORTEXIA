const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiter.middleware');
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  checkAvailabilityValidation,
} = require('../validators/auth.validator');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  registerLimiter,
  registerValidation,
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  validate,
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  refreshTokenValidation,
  validate,
  authController.refresh
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  validate,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Private
 */
router.post(
  '/verify-email',
  authenticate,
  authController.verifyEmail
);

/**
 * @route   POST /api/auth/check-availability
 * @desc    Check if email/username is available
 * @access  Public
 */
router.post(
  '/check-availability',
  checkAvailabilityValidation,
  validate,
  authController.checkAvailability
);

module.exports = router;
