const authService = require('../services/auth.service');
const { success, error, created } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { email, username, password, role, profile } = req.body;

  // Validate required fields
  if (!email || !username || !password || !role || !profile) {
    return error(res, 'Missing required fields', 400);
  }

  // Validate role
  const validRoles = ['siswa', 'guru', 'orang_tua', 'admin'];
  if (!validRoles.includes(role)) {
    return error(res, 'Invalid role', 400);
  }

  // Validate password strength
  if (password.length < 8) {
    return error(res, 'Password must be at least 8 characters long', 400);
  }

  const result = await authService.register({
    email,
    username,
    password,
    role,
    profile,
  });

  return created(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
  }, 'User registered successfully');
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return error(res, 'Email/username and password are required', 400);
  }

  try {
    const result = await authService.login(emailOrUsername, password);

    // Log audit
    logger.info(`Login successful: ${result.user.email}`, {
      userId: result.user.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    return success(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    }, 'Login successful');
  } catch (err) {
    logger.warn(`Login failed: ${emailOrUsername}`, {
      ip: req.ip,
      error: err.message,
    });
    return error(res, 'Invalid credentials', 401);
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return error(res, 'Refresh token is required', 400);
  }

  await authService.logout(req.userId, refreshToken);

  logger.info(`Logout successful: ${req.user.email}`);

  return success(res, null, 'Logout successful');
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return error(res, 'Refresh token is required', 400);
  }

  try {
    const tokens = await authService.refreshAccessToken(refreshToken);

    return success(res, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }, 'Token refreshed successfully');
  } catch (err) {
    logger.warn('Token refresh failed', { error: err.message });
    return error(res, err.message, 401);
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.userId);

  return success(res, { user }, 'User profile retrieved');
});

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return error(res, 'Current password and new password are required', 400);
  }

  if (newPassword.length < 8) {
    return error(res, 'New password must be at least 8 characters long', 400);
  }

  try {
    await authService.changePassword(req.userId, currentPassword, newPassword);

    logger.info(`Password changed: ${req.user.email}`);

    return success(res, null, 'Password changed successfully');
  } catch (err) {
    return error(res, err.message, 400);
  }
});

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return error(res, 'Email is required', 400);
  }

  await authService.requestPasswordReset(email);

  // Always return success to prevent email enumeration
  return success(res, null, 'If the email exists, a password reset link will be sent');
});

/**
 * Verify email
 * POST /api/auth/verify-email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return error(res, 'Verification token is required', 400);
  }

  // Verify token and get user ID (simplified)
  // In production, implement proper token verification

  await authService.verifyEmail(req.userId);

  return success(res, null, 'Email verified successfully');
});

/**
 * Check if email/username is available
 * POST /api/auth/check-availability
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { email, username } = req.body;

  const { prisma } = require('../config/database.config');

  const results = {
    emailAvailable: true,
    usernameAvailable: true,
  };

  if (email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });
    results.emailAvailable = !existingEmail;
  }

  if (username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });
    results.usernameAvailable = !existingUsername;
  }

  return success(res, results, 'Availability checked');
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  getCurrentUser,
  changePassword,
  forgotPassword,
  verifyEmail,
  checkAvailability,
};
