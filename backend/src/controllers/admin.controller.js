const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

const prisma = new PrismaClient();

/**
 * Admin Dashboard Controller
 * Handles system administration including user management,
 * class management, system monitoring, and reporting
 */

/**
 * Get admin dashboard overview with system metrics
 * @route GET /api/admin/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    // Get user statistics
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    const totalUsers = userStats.reduce((sum, stat) => sum + stat._count, 0);

    // Get active users (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: { gte: thirtyDaysAgo }
      }
    });

    // Get total classes
    const totalClasses = await prisma.class.count();

    // Get total assessments (all time)
    const totalAssessments = await prisma.assessment.count();

    // Get recent assessments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAssessments = await prisma.assessment.count({
      where: {
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Get active learning paths
    const activeLearningPaths = await prisma.learningPath.count({
      where: { status: 'ACTIVE' }
    });

    // Get difficulty distribution
    const difficultyDistribution = await prisma.learningPath.groupBy({
      by: ['difficultyLevel'],
      where: { status: 'ACTIVE' },
      _count: true
    });

    // Get recent system activities
    const recentActivities = await prisma.user.findMany({
      orderBy: { lastLoginAt: 'desc' },
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        lastLoginAt: true
      }
    });

    return successResponse(res, {
      summary: {
        totalUsers,
        activeUsers,
        totalClasses,
        totalAssessments,
        recentAssessments,
        activeLearningPaths
      },
      userStats: userStats.reduce((acc, stat) => {
        acc[stat.role] = stat._count;
        return acc;
      }, {}),
      difficultyDistribution: difficultyDistribution.reduce((acc, item) => {
        acc[item.difficultyLevel] = item._count;
        return acc;
      }, {}),
      recentActivities
    });
  } catch (error) {
    logger.error('Error fetching admin dashboard:', error);
    return errorResponse(res, 'Failed to fetch dashboard data', 500);
  }
};

/**
 * Get all users with filters
 * @route GET /api/admin/users
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    return successResponse(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    return errorResponse(res, 'Failed to fetch users', 500);
  }
};

/**
 * Get user details by ID
 * @route GET /api/admin/users/:userId
 */
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        studentProfile: {
          include: {
            class: true,
            learningPaths: {
              where: { status: 'ACTIVE' },
              take: 1
            }
          }
        },
        teacherProfile: {
          include: {
            classes: {
              include: {
                _count: {
                  select: { students: true }
                }
              }
            }
          }
        },
        parentProfile: {
          include: {
            children: {
              include: {
                user: {
                  select: {
                    fullName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Remove password from response
    delete user.password;

    return successResponse(res, user);
  } catch (error) {
    logger.error('Error fetching user details:', error);
    return errorResponse(res, 'Failed to fetch user details', 500);
  }
};

/**
 * Create new user
 * @route POST /api/admin/users
 */
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role, profileData } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return errorResponse(res, 'User with this email or username already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with role-specific profile
    const userData = {
      username,
      email,
      password: hashedPassword,
      fullName,
      role,
      isActive: true
    };

    let user;

    if (role === 'STUDENT' && profileData) {
      user = await prisma.user.create({
        data: {
          ...userData,
          studentProfile: {
            create: {
              classId: profileData.classId,
              enrollmentDate: new Date()
            }
          }
        },
        include: {
          studentProfile: true
        }
      });
    } else if (role === 'TEACHER' && profileData) {
      user = await prisma.user.create({
        data: {
          ...userData,
          teacherProfile: {
            create: {
              specialization: profileData.specialization,
              yearsOfExperience: profileData.yearsOfExperience
            }
          }
        },
        include: {
          teacherProfile: true
        }
      });
    } else if (role === 'PARENT') {
      user = await prisma.user.create({
        data: {
          ...userData,
          parentProfile: {
            create: {}
          }
        },
        include: {
          parentProfile: true
        }
      });
    } else {
      user = await prisma.user.create({
        data: userData
      });
    }

    // Remove password from response
    delete user.password;

    logger.info(`New user created by admin: ${user.id} (${user.role})`);
    return successResponse(res, user, 'User created successfully', 201);
  } catch (error) {
    logger.error('Error creating user:', error);
    return errorResponse(res, 'Failed to create user', 500);
  }
};

/**
 * Update user
 * @route PATCH /api/admin/users/:userId
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Don't allow password updates through this endpoint
    delete updates.password;
    delete updates.role; // Role changes require special handling

    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updates,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    logger.info(`User ${userId} updated by admin`);
    return successResponse(res, user);
  } catch (error) {
    logger.error('Error updating user:', error);
    return errorResponse(res, 'Failed to update user', 500);
  }
};

/**
 * Deactivate/Activate user
 * @route PATCH /api/admin/users/:userId/status
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { isActive },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true
      }
    });

    logger.info(`User ${userId} ${isActive ? 'activated' : 'deactivated'} by admin`);
    return successResponse(res, user);
  } catch (error) {
    logger.error('Error toggling user status:', error);
    return errorResponse(res, 'Failed to update user status', 500);
  }
};

/**
 * Delete user
 * @route DELETE /api/admin/users/:userId
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Don't allow deleting admins
    if (user.role === 'ADMIN') {
      return errorResponse(res, 'Cannot delete admin users', 403);
    }

    await prisma.user.delete({
      where: { id: parseInt(userId) }
    });

    logger.warn(`User ${userId} deleted by admin`);
    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    logger.error('Error deleting user:', error);
    return errorResponse(res, 'Failed to delete user', 500);
  }
};

/**
 * Get all classes
 * @route GET /api/admin/classes
 */
exports.getClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        teacher: {
          select: {
            user: {
              select: {
                fullName: true,
                email: true
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
 * Create new class
 * @route POST /api/admin/classes
 */
exports.createClass = async (req, res) => {
  try {
    const { name, grade, teacherId, academicYear, description } = req.body;

    // Verify teacher exists
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: teacherId }
    });

    if (!teacher) {
      return errorResponse(res, 'Teacher not found', 404);
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        grade,
        teacherId,
        academicYear,
        description
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

    logger.info(`New class created: ${newClass.id}`);
    return successResponse(res, newClass, 'Class created successfully', 201);
  } catch (error) {
    logger.error('Error creating class:', error);
    return errorResponse(res, 'Failed to create class', 500);
  }
};

/**
 * Update class
 * @route PATCH /api/admin/classes/:classId
 */
exports.updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const updates = req.body;

    const updatedClass = await prisma.class.update({
      where: { id: parseInt(classId) },
      data: updates,
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

    return successResponse(res, updatedClass);
  } catch (error) {
    logger.error('Error updating class:', error);
    return errorResponse(res, 'Failed to update class', 500);
  }
};

/**
 * Delete class
 * @route DELETE /api/admin/classes/:classId
 */
exports.deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check if class has students
    const studentCount = await prisma.studentProfile.count({
      where: { classId: parseInt(classId) }
    });

    if (studentCount > 0) {
      return errorResponse(res, 'Cannot delete class with students. Reassign students first.', 400);
    }

    await prisma.class.delete({
      where: { id: parseInt(classId) }
    });

    logger.info(`Class ${classId} deleted`);
    return successResponse(res, null, 'Class deleted successfully');
  } catch (error) {
    logger.error('Error deleting class:', error);
    return errorResponse(res, 'Failed to delete class', 500);
  }
};

/**
 * Get system statistics
 * @route GET /api/admin/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get assessment statistics
    const assessmentStats = await prisma.assessment.groupBy({
      by: ['overallDifficulty'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    });

    // Get daily assessment counts
    const dailyAssessments = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "Assessment"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get user growth
    const userGrowth = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "User"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get intervention statistics
    const interventionStats = await prisma.intervention.groupBy({
      by: ['status', 'type'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    });

    // Get top performing students
    const topStudents = await prisma.learningPath.findMany({
      where: {
        status: 'ACTIVE',
        currentProgress: { gte: 80 }
      },
      take: 10,
      orderBy: {
        currentProgress: 'desc'
      },
      include: {
        student: {
          select: {
            fullName: true
          }
        }
      }
    });

    return successResponse(res, {
      period: parseInt(period),
      assessmentStats: assessmentStats.reduce((acc, stat) => {
        acc[stat.overallDifficulty] = stat._count;
        return acc;
      }, {}),
      dailyAssessments,
      userGrowth,
      interventionStats,
      topStudents: topStudents.map(path => ({
        studentName: path.student.fullName,
        progress: path.currentProgress,
        difficultyLevel: path.difficultyLevel
      }))
    });
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

/**
 * Get system logs
 * @route GET /api/admin/logs
 */
exports.getSystemLogs = async (req, res) => {
  try {
    const { level, limit = 100 } = req.query;

    // This would typically read from log files
    // For now, return recent user activities as example
    const activities = await prisma.user.findMany({
      orderBy: { lastLoginAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    return successResponse(res, {
      logs: activities.map(user => ({
        timestamp: user.lastLoginAt || user.createdAt,
        level: 'INFO',
        action: user.lastLoginAt ? 'USER_LOGIN' : 'USER_CREATED',
        userId: user.id,
        userName: user.fullName,
        role: user.role
      }))
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    return errorResponse(res, 'Failed to fetch logs', 500);
  }
};

/**
 * Get system health status
 * @route GET /api/admin/health
 */
exports.getSystemHealth = async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get database size (approximate)
    const userCount = await prisma.user.count();
    const assessmentCount = await prisma.assessment.count();
    const learningPathCount = await prisma.learningPath.count();

    return successResponse(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        users: userCount,
        assessments: assessmentCount,
        learningPaths: learningPathCount
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    logger.error('Error checking system health:', error);
    return errorResponse(res, 'System health check failed', 500);
  }
};

/**
 * Bulk user import
 * @route POST /api/admin/users/bulk-import
 */
exports.bulkImportUsers = async (req, res) => {
  try {
    const { users } = req.body; // Array of user data

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const userData of users) {
      try {
        // Check if user exists
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { email: userData.email },
              { username: userData.username }
            ]
          }
        });

        if (existing) {
          results.failed++;
          results.errors.push({
            email: userData.email,
            error: 'User already exists'
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password || 'DefaultPass123', 12);

        // Create user
        await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            fullName: userData.fullName,
            role: userData.role,
            isActive: true
          }
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          email: userData.email,
          error: err.message
        });
      }
    }

    logger.info(`Bulk import completed: ${results.success} success, ${results.failed} failed`);
    return successResponse(res, results);
  } catch (error) {
    logger.error('Error bulk importing users:', error);
    return errorResponse(res, 'Failed to bulk import users', 500);
  }
};

module.exports = exports;
