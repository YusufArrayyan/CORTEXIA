const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

const prisma = new PrismaClient();

/**
 * Parent Dashboard Controller
 * Handles all parent-related operations including child monitoring,
 * assessment insights, communication with teachers, and home practice recommendations
 */

/**
 * Get parent dashboard overview
 * @route GET /api/parent/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const parentId = req.user.id;

    // Get parent profile with children
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentId },
      include: {
        children: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
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
                confidence: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!parentProfile) {
      return errorResponse(res, 'Parent profile not found', 404);
    }

    // Calculate summary statistics
    const totalChildren = parentProfile.children.length;
    const childrenWithActivePath = parentProfile.children.filter(
      child => child.learningPaths.length > 0
    ).length;
    const childrenNeedingAttention = parentProfile.children.filter(
      child => child.learningPaths.some(
        path => ['MODERATE', 'SEVERE'].includes(path.difficultyLevel)
      )
    ).length;

    // Get recent teacher feedback (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const childIds = parentProfile.children.map(child => child.userId);
    const recentFeedback = await prisma.teacherFeedback.count({
      where: {
        studentId: { in: childIds },
        createdAt: { gte: thirtyDaysAgo },
        isPrivate: false // Only count public feedback
      }
    });

    // Get upcoming interventions
    const upcomingInterventions = await prisma.intervention.count({
      where: {
        learningModule: {
          learningPath: {
            studentId: { in: childIds },
            status: 'ACTIVE'
          }
        },
        status: 'PENDING',
        scheduledDate: { gte: new Date() }
      }
    });

    return successResponse(res, {
      summary: {
        totalChildren,
        childrenWithActivePath,
        childrenNeedingAttention,
        recentFeedback,
        upcomingInterventions
      },
      children: parentProfile.children.map(child => ({
        id: child.userId,
        fullName: child.user.fullName,
        class: child.class,
        currentStatus: child.learningPaths[0]?.difficultyLevel || 'NONE',
        progress: child.learningPaths[0]?.currentProgress || 0,
        lastAssessment: child.assessments[0] || null
      }))
    });
  } catch (error) {
    logger.error('Error fetching parent dashboard:', error);
    return errorResponse(res, 'Failed to fetch dashboard data', 500);
  }
};

/**
 * Get detailed information about a specific child
 * @route GET /api/parent/children/:childId
 */
exports.getChildDetails = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    // Verify parent-child relationship
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentId },
      include: {
        children: {
          where: { userId: parseInt(childId) }
        }
      }
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return errorResponse(res, 'Child not found or access denied', 404);
    }

    // Get comprehensive child data
    const child = await prisma.studentProfile.findUnique({
      where: { userId: parseInt(childId) },
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
            grade: true,
            teacher: {
              select: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        learningPaths: {
          where: { status: 'ACTIVE' },
          include: {
            modules: {
              include: {
                interventions: {
                  where: {
                    scheduledDate: { gte: new Date() }
                  },
                  orderBy: { scheduledDate: 'asc' },
                  take: 5
                }
              }
            }
          }
        },
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            skillAssessments: true,
            difficultWords: {
              take: 10
            }
          }
        }
      }
    });

    if (!child) {
      return errorResponse(res, 'Child not found', 404);
    }

    // Get teacher feedback (public only)
    const feedback = await prisma.teacherFeedback.findMany({
      where: {
        studentId: parseInt(childId),
        isPrivate: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
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

    // Get learning analytics if available
    let analytics = null;
    if (child.learningPaths.length > 0) {
      const adaptiveLearningService = require('../services/adaptive-learning.service');
      try {
        analytics = await adaptiveLearningService.getLearningAnalytics(
          parseInt(childId),
          child.learningPaths[0].id
        );
      } catch (err) {
        logger.warn('Could not fetch learning analytics:', err);
      }
    }

    return successResponse(res, {
      ...child,
      feedback,
      analytics
    });
  } catch (error) {
    logger.error('Error fetching child details:', error);
    return errorResponse(res, 'Failed to fetch child details', 500);
  }
};

/**
 * Get simplified assessment insights for parents
 * @route GET /api/parent/children/:childId/assessments/:assessmentId
 */
exports.getAssessmentInsights = async (req, res) => {
  try {
    const { childId, assessmentId } = req.params;
    const parentId = req.user.id;

    // Verify parent-child relationship
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentId },
      include: {
        children: {
          where: { userId: parseInt(childId) }
        }
      }
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get assessment with simplified data
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: parseInt(assessmentId),
        studentId: parseInt(childId)
      },
      include: {
        skillAssessments: true,
        difficultWords: {
          take: 10,
          orderBy: { difficulty: 'desc' }
        }
      }
    });

    if (!assessment) {
      return errorResponse(res, 'Assessment not found', 404);
    }

    // Simplify data for parent understanding
    const insights = {
      assessmentDate: assessment.createdAt,
      overallStatus: assessment.overallDifficulty,
      confidence: assessment.confidence,
      
      // Simplified skill breakdown
      skillBreakdown: assessment.skillAssessments.map(skill => ({
        skillName: skill.skillName,
        level: skill.difficulty,
        score: skill.score,
        description: getSkillDescription(skill.skillName, skill.difficulty),
        parentTips: getParentTips(skill.skillName, skill.difficulty)
      })),

      // Top words that need practice
      challengingWords: assessment.difficultWords.map(word => ({
        word: word.word,
        issues: word.issues
      })),

      // Recommendations in parent-friendly language
      recommendations: assessment.recommendations.map(rec => 
        simplifyRecommendation(rec)
      ),

      // What parents can do at home
      homePracticeActivities: getHomePracticeActivities(
        assessment.overallDifficulty,
        assessment.skillAssessments
      )
    };

    return successResponse(res, insights);
  } catch (error) {
    logger.error('Error fetching assessment insights:', error);
    return errorResponse(res, 'Failed to fetch assessment insights', 500);
  }
};

/**
 * Get learning progress over time for a child
 * @route GET /api/parent/children/:childId/progress
 */
exports.getChildProgress = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;
    const { period = '90' } = req.query; // days

    // Verify parent-child relationship
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentId },
      include: {
        children: {
          where: { userId: parseInt(childId) }
        }
      }
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return errorResponse(res, 'Access denied', 403);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get assessments over time
    const assessments = await prisma.assessment.findMany({
      where: {
        studentId: parseInt(childId),
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' },
      include: {
        skillAssessments: true
      }
    });

    // Get progress logs
    const progressLogs = await prisma.progressLog.findMany({
      where: {
        learningModule: {
          learningPath: {
            studentId: parseInt(childId)
          }
        },
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' },
      include: {
        learningModule: {
          select: {
            skillName: true
          }
        }
      }
    });

    // Format progress data
    const progressData = {
      period: parseInt(period),
      assessmentCount: assessments.length,
      
      // Overall trend
      overallTrend: calculateTrend(assessments),
      
      // Skill-specific progress
      skillProgress: calculateSkillProgress(assessments),
      
      // Timeline data for charts
      timeline: assessments.map(a => ({
        date: a.createdAt,
        difficulty: a.overallDifficulty,
        confidence: a.confidence
      })),
      
      // Practice sessions
      practiceSessions: progressLogs.map(log => ({
        date: log.createdAt,
        skill: log.learningModule.skillName,
        performance: log.performanceScore,
        feedback: log.feedback
      }))
    };

    return successResponse(res, progressData);
  } catch (error) {
    logger.error('Error fetching child progress:', error);
    return errorResponse(res, 'Failed to fetch progress data', 500);
  }
};

/**
 * Get home practice recommendations for a child
 * @route GET /api/parent/children/:childId/home-practice
 */
exports.getHomePractice = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    // Verify parent-child relationship
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentId },
      include: {
        children: {
          where: { userId: parseInt(childId) }
        }
      }
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get latest assessment
    const latestAssessment = await prisma.assessment.findFirst({
      where: { studentId: parseInt(childId) },
      orderBy: { createdAt: 'desc' },
      include: {
        skillAssessments: true,
        difficultWords: {
          take: 10
        }
      }
    });

    // Get active learning path
    const learningPath = await prisma.learningPath.findFirst({
      where: {
        studentId: parseInt(childId),
        status: 'ACTIVE'
      },
      include: {
        modules: {
          where: {
            status: { in: ['ACTIVE', 'IN_PROGRESS'] }
          }
        }
      }
    });

    // Generate home practice recommendations
    const recommendations = {
      daily: generateDailyActivities(latestAssessment, learningPath),
      weekly: generateWeeklyGoals(learningPath),
      resources: getParentResources(latestAssessment?.overallDifficulty || 'NONE'),
      practiceWords: latestAssessment?.difficultWords.map(w => w.word) || [],
      tips: getParentingTips(latestAssessment?.overallDifficulty || 'NONE')
    };

    return successResponse(res, recommendations);
  } catch (error) {
    logger.error('Error fetching home practice recommendations:', error);
    return errorResponse(res, 'Failed to fetch recommendations', 500);
  }
};

/**
 * Get teacher feedback for a child
 * @route GET /api/parent/children/:childId/feedback
 */
exports.getTeacherFeedback = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    // Verify parent-child relationship
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentId },
      include: {
        children: {
          where: { userId: parseInt(childId) }
        }
      }
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get all public feedback
    const feedback = await prisma.teacherFeedback.findMany({
      where: {
        studentId: parseInt(childId),
        isPrivate: false
      },
      orderBy: { createdAt: 'desc' },
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
        relatedAssessment: {
          select: {
            id: true,
            createdAt: true,
            overallDifficulty: true
          }
        }
      }
    });

    return successResponse(res, feedback);
  } catch (error) {
    logger.error('Error fetching teacher feedback:', error);
    return errorResponse(res, 'Failed to fetch feedback', 500);
  }
};

/**
 * Get upcoming interventions for a child
 * @route GET /api/parent/children/:childId/interventions
 */
exports.getUpcomingInterventions = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    // Verify parent-child relationship
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentId },
      include: {
        children: {
          where: { userId: parseInt(childId) }
        }
      }
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get upcoming interventions
    const interventions = await prisma.intervention.findMany({
      where: {
        learningModule: {
          learningPath: {
            studentId: parseInt(childId),
            status: 'ACTIVE'
          }
        },
        scheduledDate: { gte: new Date() }
      },
      orderBy: { scheduledDate: 'asc' },
      include: {
        learningModule: {
          select: {
            skillName: true
          }
        }
      }
    });

    return successResponse(res, interventions);
  } catch (error) {
    logger.error('Error fetching interventions:', error);
    return errorResponse(res, 'Failed to fetch interventions', 500);
  }
};

/**
 * Get milestones and achievements for a child
 * @route GET /api/parent/children/:childId/milestones
 */
exports.getChildMilestones = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    // Verify parent-child relationship
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentId },
      include: {
        children: {
          where: { userId: parseInt(childId) }
        }
      }
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get analytics with milestones
    const learningPath = await prisma.learningPath.findFirst({
      where: {
        studentId: parseInt(childId),
        status: 'ACTIVE'
      }
    });

    if (!learningPath) {
      return successResponse(res, { milestones: [] });
    }

    const adaptiveLearningService = require('../services/adaptive-learning.service');
    const analytics = await adaptiveLearningService.getLearningAnalytics(
      parseInt(childId),
      learningPath.id
    );

    return successResponse(res, {
      milestones: analytics.milestones,
      achievements: generateAchievements(analytics)
    });
  } catch (error) {
    logger.error('Error fetching milestones:', error);
    return errorResponse(res, 'Failed to fetch milestones', 500);
  }
};

// Helper functions

function getSkillDescription(skillName, difficulty) {
  const descriptions = {
    Decoding: {
      NONE: 'Anak Anda mengenali kata-kata dengan sangat baik!',
      MILD: 'Anak Anda cukup baik dalam mengenali kata, tapi perlu latihan lebih.',
      MODERATE: 'Anak Anda membutuhkan bantuan dalam mengenali kata-kata.',
      SEVERE: 'Anak Anda memerlukan perhatian khusus untuk pengenalan kata.'
    },
    Fluency: {
      NONE: 'Anak Anda membaca dengan lancar!',
      MILD: 'Kecepatan membaca anak Anda cukup baik, bisa ditingkatkan.',
      MODERATE: 'Anak Anda perlu berlatih membaca lebih cepat dan lancar.',
      SEVERE: 'Anak Anda memerlukan banyak latihan untuk meningkatkan kelancaran membaca.'
    },
    Comprehension: {
      NONE: 'Anak Anda memahami bacaan dengan sangat baik!',
      MILD: 'Pemahaman bacaan anak Anda cukup baik.',
      MODERATE: 'Anak Anda perlu bantuan untuk memahami bacaan.',
      SEVERE: 'Anak Anda memerlukan bimbingan intensif untuk pemahaman bacaan.'
    },
    Attention: {
      NONE: 'Anak Anda sangat fokus saat membaca!',
      MILD: 'Fokus anak Anda cukup baik, kadang perlu diingatkan.',
      MODERATE: 'Anak Anda mudah teralihkan saat membaca.',
      SEVERE: 'Anak Anda sangat sulit mempertahankan fokus saat membaca.'
    }
  };

  return descriptions[skillName]?.[difficulty] || 'Status tidak tersedia';
}

function getParentTips(skillName, difficulty) {
  const tips = {
    Decoding: {
      MILD: ['Latih membaca kata-kata baru setiap hari', 'Gunakan kartu kata untuk praktek'],
      MODERATE: ['Baca bersama 15 menit per hari', 'Bantu anak mengeja kata dengan suara keras'],
      SEVERE: ['Konsultasi dengan guru untuk materi khusus', 'Gunakan buku bergambar untuk bantuan visual']
    },
    Fluency: {
      MILD: ['Baca cerita favorit berulang kali', 'Dengarkan audiobook bersama'],
      MODERATE: ['Praktek membaca dengan timer', 'Baca bergantian per paragraf'],
      SEVERE: ['Mulai dari buku level lebih mudah', 'Fokus pada kalimat pendek terlebih dahulu']
    },
    Comprehension: {
      MILD: ['Tanyakan tentang cerita setelah membaca', 'Diskusikan karakter dan plot'],
      MODERATE: ['Baca per paragraf dan diskusikan', 'Gunakan gambar untuk membantu pemahaman'],
      SEVERE: ['Baca bersama dengan suara keras', 'Berhenti setiap kalimat untuk diskusi']
    },
    Attention: {
      MILD: ['Buat rutinitas membaca yang konsisten', 'Pilih waktu ketika anak paling fokus'],
      MODERATE: ['Baca di tempat yang tenang', 'Gunakan timer untuk sesi pendek'],
      SEVERE: ['Mulai dengan sesi 5 menit', 'Berikan reward untuk fokus yang baik']
    }
  };

  return tips[skillName]?.[difficulty] || ['Konsultasikan dengan guru untuk panduan spesifik'];
}

function simplifyRecommendation(recommendation) {
  // Convert technical recommendations to parent-friendly language
  return recommendation.replace(/technical terms/g, 'istilah sederhana');
}

function getHomePracticeActivities(difficulty, skillAssessments) {
  const activities = [];
  
  if (difficulty === 'NONE') {
    activities.push({
      title: 'Membaca Mandiri',
      description: 'Biarkan anak memilih dan membaca buku sendiri 20 menit setiap hari',
      frequency: 'Harian'
    });
  } else {
    activities.push({
      title: 'Membaca Bersama',
      description: 'Baca bersama anak 15-20 menit setiap hari, bergantian per paragraf',
      frequency: 'Harian'
    });
  }

  // Add skill-specific activities
  skillAssessments?.forEach(skill => {
    if (['MODERATE', 'SEVERE'].includes(skill.difficulty)) {
      activities.push({
        title: `Latihan ${skill.skillName}`,
        description: `Fokus pada ${skill.skillName.toLowerCase()} dengan aktivitas menyenangkan`,
        frequency: '3x per minggu'
      });
    }
  });

  return activities;
}

function generateDailyActivities(assessment, learningPath) {
  return [
    {
      activity: 'Membaca bersama',
      duration: '15-20 menit',
      tips: 'Pilih buku yang menarik untuk anak'
    },
    {
      activity: 'Latihan kata',
      duration: '10 menit',
      tips: 'Gunakan kata-kata dari daftar yang sulit'
    }
  ];
}

function generateWeeklyGoals(learningPath) {
  if (!learningPath) return [];
  
  return learningPath.modules.slice(0, 3).map(module => ({
    skill: module.skillName,
    goal: `Tingkatkan ${module.skillName} sebesar 10%`,
    activities: module.activities.slice(0, 2)
  }));
}

function getParentResources(difficulty) {
  return [
    {
      title: 'Panduan Orang Tua: Mendukung Anak Belajar Membaca',
      type: 'PDF',
      url: '/resources/parent-guide.pdf'
    },
    {
      title: 'Video: Tips Membaca Bersama Anak',
      type: 'Video',
      url: '/resources/reading-tips-video'
    },
    {
      title: 'Daftar Buku Rekomendasi',
      type: 'List',
      url: '/resources/book-recommendations'
    }
  ];
}

function getParentingTips(difficulty) {
  const tips = {
    NONE: [
      'Terus berikan tantangan membaca yang lebih sulit',
      'Dorong anak untuk membaca berbagai jenis buku',
      'Diskusikan buku yang dibaca untuk meningkatkan pemahaman'
    ],
    MILD: [
      'Buat rutinitas membaca yang konsisten',
      'Berikan pujian untuk setiap kemajuan',
      'Pilih buku yang sesuai minat anak'
    ],
    MODERATE: [
      'Bersabar dan berikan dukungan positif',
      'Jangan memaksakan jika anak lelah',
      'Rayakan pencapaian kecil',
      'Komunikasi rutin dengan guru'
    ],
    SEVERE: [
      'Fokus pada progress, bukan kesempurnaan',
      'Ciptakan pengalaman membaca yang menyenangkan',
      'Kerja sama erat dengan guru dan spesialis',
      'Konsisten dengan program yang diberikan'
    ]
  };

  return tips[difficulty] || tips.MILD;
}

function calculateTrend(assessments) {
  if (assessments.length < 2) return 'insufficient_data';
  
  const difficultyMap = { NONE: 4, MILD: 3, MODERATE: 2, SEVERE: 1 };
  const scores = assessments.map(a => difficultyMap[a.overallDifficulty] || 2);
  
  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 0.3) return 'improving';
  if (secondAvg < firstAvg - 0.3) return 'declining';
  return 'stable';
}

function calculateSkillProgress(assessments) {
  const skillData = {};
  
  assessments.forEach(assessment => {
    assessment.skillAssessments?.forEach(skill => {
      if (!skillData[skill.skillName]) {
        skillData[skill.skillName] = [];
      }
      skillData[skill.skillName].push(skill.score);
    });
  });
  
  return Object.entries(skillData).map(([skillName, scores]) => ({
    skillName,
    averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    trend: scores.length > 1 && scores[scores.length - 1] > scores[0] ? 'improving' : 'stable',
    latestScore: scores[scores.length - 1]
  }));
}

function generateAchievements(analytics) {
  const achievements = [];
  
  // Check for milestones
  if (analytics.milestones.filter(m => m.achieved).length >= 5) {
    achievements.push({
      title: 'Pencapaian 5 Milestone',
      icon: '🏆',
      date: new Date()
    });
  }
  
  // Check for progress
  if (analytics.overallProgress >= 50) {
    achievements.push({
      title: 'Setengah Perjalanan',
      icon: '⭐',
      description: 'Menyelesaikan 50% learning path'
    });
  }
  
  // Check for strengths
  if (analytics.strengths.length > analytics.weaknesses.length) {
    achievements.push({
      title: 'Kekuatan Berlimpah',
      icon: '💪',
      description: `${analytics.strengths.length} kekuatan teridentifikasi`
    });
  }
  
  return achievements;
}

module.exports = exports;
