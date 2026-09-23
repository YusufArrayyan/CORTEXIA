const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parent.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { param, query } = require('express-validator');

/**
 * Parent Routes
 * All routes require authentication and PARENT role
 */

// Apply authentication and role check to all routes
router.use(authenticate);
router.use(requireRole(['PARENT']));

/**
 * Dashboard & Overview
 */
router.get(
  '/dashboard',
  parentController.getDashboard
);

/**
 * Child Management & Monitoring
 */
router.get(
  '/children/:childId',
  [
    param('childId').isInt().withMessage('Invalid child ID')
  ],
  validate,
  parentController.getChildDetails
);

router.get(
  '/children/:childId/progress',
  [
    param('childId').isInt().withMessage('Invalid child ID'),
    query('period').optional().isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days')
  ],
  validate,
  parentController.getChildProgress
);

/**
 * Assessment Insights
 */
router.get(
  '/children/:childId/assessments/:assessmentId',
  [
    param('childId').isInt().withMessage('Invalid child ID'),
    param('assessmentId').isInt().withMessage('Invalid assessment ID')
  ],
  validate,
  parentController.getAssessmentInsights
);

/**
 * Home Practice & Recommendations
 */
router.get(
  '/children/:childId/home-practice',
  [
    param('childId').isInt().withMessage('Invalid child ID')
  ],
  validate,
  parentController.getHomePractice
);

/**
 * Teacher Communication
 */
router.get(
  '/children/:childId/feedback',
  [
    param('childId').isInt().withMessage('Invalid child ID')
  ],
  validate,
  parentController.getTeacherFeedback
);

/**
 * Interventions & Support
 */
router.get(
  '/children/:childId/interventions',
  [
    param('childId').isInt().withMessage('Invalid child ID')
  ],
  validate,
  parentController.getUpcomingInterventions
);

/**
 * Milestones & Achievements
 */
router.get(
  '/children/:childId/milestones',
  [
    param('childId').isInt().withMessage('Invalid child ID')
  ],
  validate,
  parentController.getChildMilestones
);

module.exports = router;
