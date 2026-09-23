const { PrismaClient } = require('@prisma/client');
const adaptiveLearningService = require('../services/adaptive-learning.service');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

const prisma = new PrismaClient();

/**
 * Teacher Dashboard Controller
 * Handles all teacher-related operations including class management,
 * student monitoring, assessment review, and learning path management
 */

/**
 * Get teacher dashboard overview
 * @route GET /api/teacher/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get teacher's classes
    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    // Get total students across all classes
    const totalStudents = await prisma.user.count({
      where: {
        role: 'STUDENT',
        studentProfile: {
          classId: { in: classes.map(c => c.id) }
        }
      }
    });

    // Get recent assessments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAssessments = await prisma.assessment.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        student: {
          studentProfile: {
            classId: { in: classes.map(c => c.id) }
          }
        }
      }
    });

    // Get students requiring intervention
    const studentsNeedingIntervention = await prisma.learningPath.count({
      where: {
        student: {
          studentProfile: {
            classId: { in: classes.map(c => c.id) }
          }
        },
        difficultyLevel: { in: ['MODERATE', 'SEVERE'] },
        status: 'ACTIVE'
      }
    });

    // Get pending interventions
    const pendingInterventions = await prisma.intervention.count({
      where: {
        learningModule: {
          learningPath: {
            student: {
              studentProfile: {
                classId: { in: classes.map(c => c.id) }
              }
            }
          }
        },
        status: 'PENDING',
        scheduledDate: { lte: new Date() }
      }
    });

    // Get difficulty distribution
    const difficultyDistribution = await prisma.learningPath.groupBy({
      by: ['difficultyLevel'],
      where: {
        student: {
          studentProfile: {
            classId: { in: classes.map(c => c.id) }
          }
        },
        status: 'ACTIVE'
      },
      _count: true
    });

    return successResponse(res, {
      summary: {
        totalClasses: classes.length,
        totalStudents,
        recentAssessments,
        studentsNeedingIntervention,
        pendingInterventions
      },
      classes: classes.map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        studentCount: c._count.students
      })),
      difficultyDistribution: difficultyDistribution.reduce((acc, item) => {
        acc[item.difficultyLevel] = item._count;
        return acc;
      }, {})
    });
  } catch (error) {
    logger.error('Error fetching teacher dashboard:', error);
    return errorResponse(res, 'Failed to fetch dashboard data', 500);
  }
};

/**
 * Get all classes for a teacher
 * @route GET /api/teacher/classes
 */
exports.getClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            },
            learningPaths: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                difficultyLevel: true,
                currentProgress: true
              }
            }
          }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return successResponse(res, classes);
  } catch (error) {
    logger.error('Error fetching classes:', error);
    return errorResponse(res, 'Failed to fetch classes', 500);
  }
};

/**
 * Get class details with students
 * @route GET /api/teacher/classes/:classId
 */
exports.getClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    const classData = await prisma.class.findFirst({
      where: {
        id: parseInt(classId),
        teacherId
      },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true
              }
            },
            learningPaths: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                difficultyLevel: true,
                currentProgress: true,
                startDate: true,
                targetDate: true
              }
            },
            assessments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                overallDifficulty: true,
                createdAt: true
              }
            }
          }
        },
        teacher: {
          select: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!classData) {
      return errorResponse(res, 'Class not found', 404);
    }

    return successResponse(res, classData);
  } catch (error) {
    logger.error('Error fetching class details:', error);
    return errorResponse(res, 'Failed to fetch class details', 500);
  }
};

/**
 * Get student details with complete assessment history
 * @route GET /api/teacher/students/:studentId
 */
exports.getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher has access to this student
    const student = await prisma.studentProfile.findFirst({
      where: {
        userId: parseInt(studentId),
        class: { teacherId }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
            createdAt: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true
          }
        },
        learningPaths: {
          where: { status: 'ACTIVE' },
          include: {
            modules: {
              include: {
                interventions: {
                  orderBy: { scheduledDate: 'desc' }
                }
              }
            }
          }
        },
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!student) {
      return errorResponse(res, 'Student not found or access denied', 404);
    }

    // Get learning analytics
    let analytics = null;
    if (student.learningPaths.length > 0) {
      analytics = await adaptiveLearningService.getLearningAnalytics(
        parseInt(studentId),
        student.learningPaths[0].id
      );
    }

    return successResponse(res, {
      ...student,
      analytics
    });
  } catch (error) {
    logger.error('Error fetching student details:', error);
    return errorResponse(res, 'Failed to fetch student details', 500);
  }
};

/**
 * Get assessment details
 * @route GET /api/teacher/assessments/:assessmentId
 */
exports.getAssessmentDetails = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const teacherId = req.user.id;

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: parseInt(assessmentId),
        student: {
          studentProfile: {
            class: { teacherId }
          }
        }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        skillAssessments: true,
        difficultWords: true,
        gazeData: {
          include: {
            gazePoints: {
              orderBy: { timestamp: 'asc' },
              take: 100 // Limit for performance
            },
            fixations: {
              orderBy: { startTime: 'asc' }
            }
          }
        },
        speechData: {
          include: {
            pronunciationAssessments: true
          }
        }
      }
    });

    if (!assessment) {
      return errorResponse(res, 'Assessment not found or access denied', 404);
    }

    return successResponse(res, assessment);
  } catch (error) {
    logger.error('Error fetching assessment details:', error);
    return errorResponse(res, 'Failed to fetch assessment details', 500);
  }
};

/**
 * Update learning path for a student
 * @route PATCH /api/teacher/learning-paths/:pathId
 */
exports.updateLearningPath = async (req, res) => {
  try {
    const { pathId } = req.params;
    const teacherId = req.user.id;
    const updates = req.body;

    // Verify teacher has access
    const learningPath = await prisma.learningPath.findFirst({
      where: {
        id: parseInt(pathId),
        student: {
          studentProfile: {
            class: { teacherId }
          }
        }
      }
    });

    if (!learningPath) {
      return errorResponse(res, 'Learning path not found or access denied', 404);
    }

    // Update learning path
    const updatedPath = await prisma.learningPath.update({
      where: { id: parseInt(pathId) },
      data: updates,
      include: {
        modules: true
      }
    });

    logger.info(`Learning path ${pathId} updated by teacher ${teacherId}`);
    return successResponse(res, updatedPath);
  } catch (error) {
    logger.error('Error updating learning path:', error);
    return errorResponse(res, 'Failed to update learning path', 500);
  }
};

/**
 * Schedule or update intervention
 * @route POST /api/teacher/interventions
 */
exports.scheduleIntervention = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const {
      learningModuleId,
      type,
      description,
      scheduledDate,
      duration,
      notes
    } = req.body;

    // Verify teacher has access to this module
    const module = await prisma.learningModule.findFirst({
      where: {
        id: learningModuleId,
        learningPath: {
          student: {
            studentProfile: {
              class: { teacherId }
            }
          }
        }
      }
    });

    if (!module) {
      return errorResponse(res, 'Learning module not found or access denied', 404);
    }

    const intervention = await prisma.intervention.create({
      data: {
        learningModuleId,
        type,
        description,
        scheduledDate: new Date(scheduledDate),
        duration,
        status: 'PENDING',
        notes
      }
    });

    logger.info(`Intervention scheduled by teacher ${teacherId}:`, intervention.id);
    return successResponse(res, intervention, 'Intervention scheduled successfully', 201);
  } catch (error) {
    logger.error('Error scheduling intervention:', error);
    return errorResponse(res, 'Failed to schedule intervention', 500);
  }
};

/**
 * Update intervention status
 * @route PATCH /api/teacher/interventions/:interventionId
 */
exports.updateIntervention = async (req, res) => {
  try {
    const { interventionId } = req.params;
    const teacherId = req.user.id;
    const { status, completionNotes, effectiveness } = req.body;

    // Verify teacher has access
    const intervention = await prisma.intervention.findFirst({
      where: {
        id: parseInt(interventionId),
        learningModule: {
          learningPath: {
            student: {
              studentProfile: {
                class: { teacherId }
              }
            }
          }
        }
      }
    });

    if (!intervention) {
      return errorResponse(res, 'Intervention not found or access denied', 404);
    }

    const updated = await prisma.intervention.update({
      where: { id: parseInt(interventionId) },
      data: {
        status,
        completionNotes,
        effectiveness,
        completedAt: status === 'COMPLETED' ? new Date() : null
      }
    });

    return successResponse(res, updated);
  } catch (error) {
    logger.error('Error updating intervention:', error);
    return errorResponse(res, 'Failed to update intervention', 500);
  }
};

/**
 * Assign reading material to student
 * @route POST /api/teacher/materials/assign
 */
exports.assignMaterial = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const {
      studentId,
      materialId,
      dueDate,
      notes
    } = req.body;

    // Verify teacher has access to student
    const student = await prisma.studentProfile.findFirst({
      where: {
        userId: studentId,
        class: { teacherId }
      }
    });

    if (!student) {
      return errorResponse(res, 'Student not found or access denied', 404);
    }

    // Check if material exists
    const material = await prisma.readingMaterial.findUnique({
      where: { id: materialId }
    });

    if (!material) {
      return errorResponse(res, 'Reading material not found', 404);
    }

    // Create assignment
    const assignment = await prisma.materialAssignment.create({
      data: {
        studentId,
        materialId,
        assignedById: teacherId,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'ASSIGNED',
        notes
      },
      include: {
        material: true,
        student: {
          select: {
            fullName: true
          }
        }
      }
    });

    logger.info(`Material ${materialId} assigned to student ${studentId} by teacher ${teacherId}`);
    return successResponse(res, assignment, 'Material assigned successfully', 201);
  } catch (error) {
    logger.error('Error assigning material:', error);
    return errorResponse(res, 'Failed to assign material', 500);
  }
};

/**
 * Add feedback/notes for student
 * @route POST /api/teacher/feedback
 */
exports.addFeedback = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const {
      studentId,
      type,
      content,
      isPrivate,
      relatedAssessmentId
    } = req.body;

    // Verify teacher has access to student
    const student = await prisma.studentProfile.findFirst({
      where: {
        userId: studentId,
        class: { teacherId }
      }
    });

    if (!student) {
      return errorResponse(res, 'Student not found or access denied', 404);
    }

    const feedback = await prisma.teacherFeedback.create({
      data: {
        teacherId,
        studentId,
        type,
        content,
        isPrivate,
        relatedAssessmentId: relatedAssessmentId || null
      },
      include: {
        teacher: {
          select: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    logger.info(`Feedback added by teacher ${teacherId} for student ${studentId}`);
    return successResponse(res, feedback, 'Feedback added successfully', 201);
  } catch (error) {
    logger.error('Error adding feedback:', error);
    return errorResponse(res, 'Failed to add feedback', 500);
  }
};

/**
 * Get class analytics
 * @route GET /api/teacher/classes/:classId/analytics
 */
exports.getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    const { period = '30' } = req.query; // days

    // Verify access
    const classData = await prisma.class.findFirst({
      where: {
        id: parseInt(classId),
        teacherId
      }
    });

    if (!classData) {
      return errorResponse(res, 'Class not found or access denied', 404);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get all students in class
    const students = await prisma.studentProfile.findMany({
      where: { classId: parseInt(classId) },
      select: { userId: true }
    });

    const studentIds = students.map(s => s.userId);

    // Assessment statistics
    const assessments = await prisma.assessment.findMany({
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: startDate }
      },
      include: {
        student: {
          select: { fullName: true }
        }
      }
    });

    // Difficulty distribution
    const difficultyDistribution = assessments.reduce((acc, a) => {
      acc[a.overallDifficulty] = (acc[a.overallDifficulty] || 0) + 1;
      return acc;
    }, {});

    // Average scores by skill
    const skillAverages = await prisma.skillAssessment.groupBy({
      by: ['skillName'],
      where: {
        assessment: {
          studentId: { in: studentIds },
          createdAt: { gte: startDate }
        }
      },
      _avg: {
        score: true,
        confidence: true
      }
    });

    // Progress over time (weekly)
    const weeklyProgress = await prisma.progressLog.groupBy({
      by: ['performanceScore'],
      where: {
        learningModule: {
          learningPath: {
            studentId: { in: studentIds }
          }
        },
        createdAt: { gte: startDate }
      },
      _avg: {
        performanceScore: true
      }
    });

    // Active learning paths by difficulty
    const activePaths = await prisma.learningPath.groupBy({
      by: ['difficultyLevel'],
      where: {
        studentId: { in: studentIds },
        status: 'ACTIVE'
      },
      _count: true
    });

    // Intervention statistics
    const interventionStats = await prisma.intervention.groupBy({
      by: ['status', 'type'],
      where: {
        learningModule: {
          learningPath: {
            studentId: { in: studentIds }
          }
        },
        scheduledDate: { gte: startDate }
      },
      _count: true
    });

    return successResponse(res, {
      period: parseInt(period),
      studentCount: studentIds.length,
      assessmentCount: assessments.length,
      difficultyDistribution,
      skillAverages: skillAverages.reduce((acc, skill) => {
        acc[skill.skillName] = {
          score: skill._avg.score,
          confidence: skill._avg.confidence
        };
        return acc;
      }, {}),
      activePaths: activePaths.reduce((acc, path) => {
        acc[path.difficultyLevel] = path._count;
        return acc;
      }, {}),
      interventionStats: interventionStats.map(stat => ({
        status: stat.status,
        type: stat.type,
        count: stat._count
      })),
      averagePerformance: weeklyProgress.length > 0
        ? weeklyProgress.reduce((sum, w) => sum + (w._avg.performanceScore || 0), 0) / weeklyProgress.length
        : 0
    });
  } catch (error) {
    logger.error('Error fetching class analytics:', error);
    return errorResponse(res, 'Failed to fetch class analytics', 500);
  }
};

/**
 * Export class report
 * @route GET /api/teacher/classes/:classId/report
 */
exports.exportClassReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    const { format = 'json' } = req.query;

    // Get comprehensive class data
    const classData = await prisma.class.findFirst({
      where: {
        id: parseInt(classId),
        teacherId
      },
      include: {
        students: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            },
            learningPaths: {
              where: { status: 'ACTIVE' },
              include: {
                modules: {
                  include: {
                    interventions: true
                  }
                }
              }
            },
            assessments: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: {
                skillAssessments: true
              }
            }
          }
        }
      }
    });

    if (!classData) {
      return errorResponse(res, 'Class not found or access denied', 404);
    }

    // Format report data
    const report = {
      class: {
        name: classData.name,
        grade: classData.grade,
        academicYear: classData.academicYear
      },
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents: classData.students.length,
        withActivePath: classData.students.filter(s => s.learningPaths.length > 0).length,
        needingIntervention: classData.students.filter(s =>
          s.learningPaths.some(p => ['MODERATE', 'SEVERE'].includes(p.difficultyLevel))
        ).length
      },
      students: classData.students.map(student => ({
        name: student.user.fullName,
        email: student.user.email,
        currentDifficulty: student.learningPaths[0]?.difficultyLevel || 'NONE',
        progress: student.learningPaths[0]?.currentProgress || 0,
        recentAssessments: student.assessments.length,
        lastAssessmentDate: student.assessments[0]?.createdAt,
        skillScores: student.assessments[0]?.skillAssessments.reduce((acc, skill) => {
          acc[skill.skillName] = skill.score;
          return acc;
        }, {})
      }))
    };

    if (format === 'json') {
      return successResponse(res, report);
    } else {
      // TODO: Implement CSV/PDF export
      return errorResponse(res, 'Format not supported yet', 400);
    }
  } catch (error) {
    logger.error('Error exporting class report:', error);
    return errorResponse(res, 'Failed to export class report', 500);
  }
};

module.exports = exports;
