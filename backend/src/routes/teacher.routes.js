const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { body, param, query } = require('express-validator');

/**
 * Teacher Routes
 * All routes require authentication and TEACHER role
 */

// Apply authentication and role check to all routes
router.use(authenticate);
router.use(requireRole(['TEACHER']));

/**
 * Dashboard & Overview
 */
router.get(
  '/dashboard',
  teacherController.getDashboard
);

/**
 * Class Management
 */
router.get(
  '/classes',
  teacherController.getClasses
);

router.get(
  '/classes/:classId',
  [
    param('classId').isInt().withMessage('Invalid class ID')
  ],
  validate,
  teacherController.getClassDetails
);

router.get(
  '/classes/:classId/analytics',
  [
    param('classId').isInt().withMessage('Invalid class ID'),
    query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days')
  ],
  validate,
  teacherController.getClassAnalytics
);

router.get(
  '/classes/:classId/report',
  [
    param('classId').isInt().withMessage('Invalid class ID'),
    query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Format must be json, csv, or pdf')
  ],
  validate,
  teacherController.exportClassReport
);

/**
 * Student Management
 */
router.get(
  '/students/:studentId',
  [
    param('studentId').isInt().withMessage('Invalid student ID')
  ],
  validate,
  teacherController.getStudentDetails
);

/**
 * Assessment Management
 */
router.get(
  '/assessments/:assessmentId',
  [
    param('assessmentId').isInt().withMessage('Invalid assessment ID')
  ],
  validate,
  teacherController.getAssessmentDetails
);

/**
 * Learning Path Management
 */
router.patch(
  '/learning-paths/:pathId',
  [
    param('pathId').isInt().withMessage('Invalid learning path ID'),
    body('difficultyLevel').optional().isIn(['NONE', 'MILD', 'MODERATE', 'SEVERE'])
      .withMessage('Invalid difficulty level'),
    body('status').optional().isIn(['ACTIVE', 'PAUSED', 'COMPLETED'])
      .withMessage('Invalid status'),
    body('targetDate').optional().isISO8601().withMessage('Invalid target date'),
    body('notes').optional().isString().trim()
  ],
  validate,
  teacherController.updateLearningPath
);

/**
 * Intervention Management
 */
router.post(
  '/interventions',
  [
    body('learningModuleId').isInt().withMessage('Learning module ID is required'),
    body('type').isIn([
      'TARGETED_PRACTICE',
      'GUIDED_READING',
      'PEER_TUTORING',
      'ASSISTIVE_TECHNOLOGY',
      'SMALL_GROUP',
      'ONE_ON_ONE',
      'PARENT_INVOLVEMENT',
      'SPECIALIST_REFERRAL'
    ]).withMessage('Invalid intervention type'),
    body('description').isString().trim().notEmpty().withMessage('Description is required'),
    body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
    body('notes').optional().isString().trim()
  ],
  validate,
  teacherController.scheduleIntervention
);

router.patch(
  '/interventions/:interventionId',
  [
    param('interventionId').isInt().withMessage('Invalid intervention ID'),
    body('status').isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid status'),
    body('completionNotes').optional().isString().trim(),
    body('effectiveness').optional().isInt({ min: 1, max: 5 })
      .withMessage('Effectiveness must be between 1 and 5')
  ],
  validate,
  teacherController.updateIntervention
);

/**
 * Material Assignment
 */
router.post(
  '/materials/assign',
  [
    body('studentId').isInt().withMessage('Student ID is required'),
    body('materialId').isInt().withMessage('Material ID is required'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
    body('notes').optional().isString().trim()
  ],
  validate,
  teacherController.assignMaterial
);

/**
 * Feedback & Communication
 */
router.post(
  '/feedback',
  [
    body('studentId').isInt().withMessage('Student ID is required'),
    body('type').isIn(['PROGRESS', 'CONCERN', 'PRAISE', 'RECOMMENDATION', 'NOTE'])
      .withMessage('Invalid feedback type'),
    body('content').isString().trim().notEmpty()
      .withMessage('Content is required')
      .isLength({ max: 2000 })
      .withMessage('Content too long (max 2000 characters)'),
    body('isPrivate').isBoolean().withMessage('isPrivate must be boolean'),
    body('relatedAssessmentId').optional().isInt().withMessage('Invalid assessment ID')
  ],
  validate,
  teacherController.addFeedback
);

module.exports = router;
