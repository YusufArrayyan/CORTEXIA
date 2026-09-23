const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { body, param, query } = require('express-validator');

/**
 * Admin Routes
 * All routes require authentication and ADMIN role
 */

// Apply authentication and role check to all routes
router.use(authenticate);
router.use(requireRole(['ADMIN']));

/**
 * Dashboard & Overview
 */
router.get(
  '/dashboard',
  adminController.getDashboard
);

router.get(
  '/statistics',
  [
    query('period').optional().isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days')
  ],
  validate,
  adminController.getStatistics
);

/**
 * User Management
 */
router.get(
  '/users',
  [
    query('role').optional().isIn(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN'])
      .withMessage('Invalid role'),
    query('search').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],
  validate,
  adminController.getUsers
);

router.get(
  '/users/:userId',
  [
    param('userId').isInt().withMessage('Invalid user ID')
  ],
  validate,
  adminController.getUserDetails
);

router.post(
  '/users',
  [
    body('username').isString().trim().isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isString().isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('fullName').isString().trim().notEmpty().withMessage('Full name required'),
    body('role').isIn(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN'])
      .withMessage('Invalid role'),
    body('profileData').optional().isObject()
  ],
  validate,
  adminController.createUser
);

router.patch(
  '/users/:userId',
  [
    param('userId').isInt().withMessage('Invalid user ID'),
    body('username').optional().isString().trim().isLength({ min: 3, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('fullName').optional().isString().trim().notEmpty(),
    body('isActive').optional().isBoolean()
  ],
  validate,
  adminController.updateUser
);

router.patch(
  '/users/:userId/status',
  [
    param('userId').isInt().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be boolean')
  ],
  validate,
  adminController.toggleUserStatus
);

router.delete(
  '/users/:userId',
  [
    param('userId').isInt().withMessage('Invalid user ID')
  ],
  validate,
  adminController.deleteUser
);

router.post(
  '/users/bulk-import',
  [
    body('users').isArray({ min: 1 }).withMessage('Users array required')
  ],
  validate,
  adminController.bulkImportUsers
);

/**
 * Class Management
 */
router.get(
  '/classes',
  adminController.getClasses
);

router.post(
  '/classes',
  [
    body('name').isString().trim().notEmpty().withMessage('Class name required'),
    body('grade').isString().trim().notEmpty().withMessage('Grade required'),
    body('teacherId').isInt().withMessage('Valid teacher ID required'),
    body('academicYear').isString().trim().notEmpty().withMessage('Academic year required'),
    body('description').optional().isString().trim()
  ],
  validate,
  adminController.createClass
);

router.patch(
  '/classes/:classId',
  [
    param('classId').isInt().withMessage('Invalid class ID'),
    body('name').optional().isString().trim().notEmpty(),
    body('grade').optional().isString().trim().notEmpty(),
    body('teacherId').optional().isInt(),
    body('academicYear').optional().isString().trim(),
    body('description').optional().isString().trim()
  ],
  validate,
  adminController.updateClass
);

router.delete(
  '/classes/:classId',
  [
    param('classId').isInt().withMessage('Invalid class ID')
  ],
  validate,
  adminController.deleteClass
);

/**
 * System Monitoring
 */
router.get(
  '/logs',
  [
    query('level').optional().isIn(['ERROR', 'WARN', 'INFO', 'DEBUG']),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be 1-1000')
  ],
  validate,
  adminController.getSystemLogs
);

router.get(
  '/health',
  adminController.getSystemHealth
);

module.exports = router;
