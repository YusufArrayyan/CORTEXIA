/**
 * Adaptive Learning Service
 * 
 * Provides personalized learning paths, material recommendations,
 * and progress tracking based on assessment results.
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const httpClient = require('../utils/http-client');

const prisma = new PrismaClient();

/**
 * Difficulty levels mapping
 */
const DIFFICULTY_LEVELS = {
  NONE: 'none',
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe'
};

/**
 * Learning path templates based on difficulty
 */
const LEARNING_PATH_TEMPLATES = {
  [DIFFICULTY_LEVELS.NONE]: {
    duration: 4, // weeks
    sessionsPerWeek: 2,
    materials: ['advanced', 'enrichment'],
    interventions: []
  },
  [DIFFICULTY_LEVELS.MILD]: {
    duration: 8,
    sessionsPerWeek: 3,
    materials: ['grade_level', 'practice'],
    interventions: ['targeted_practice', 'peer_support']
  },
  [DIFFICULTY_LEVELS.MODERATE]: {
    duration: 12,
    sessionsPerWeek: 4,
    materials: ['below_grade', 'scaffolded', 'multisensory'],
    interventions: ['small_group', 'explicit_instruction', 'frequent_monitoring']
  },
  [DIFFICULTY_LEVELS.SEVERE]: {
    duration: 16,
    sessionsPerWeek: 5,
    materials: ['intensive', 'systematic', 'multisensory'],
    interventions: ['one_on_one', 'specialist', 'daily_practice', 'parent_training']
  }
};

/**
 * Generate personalized learning path
 */
async function generateLearningPath(studentId, assessmentResults) {
  try {
    logger.info(`Generating learning path for student: ${studentId}`);

    const { overall_difficulty, skill_assessments, difficult_words } = assessmentResults;

    // Get template based on difficulty
    const template = LEARNING_PATH_TEMPLATES[overall_difficulty] || LEARNING_PATH_TEMPLATES[DIFFICULTY_LEVELS.MODERATE];

    // Identify focus areas from skill assessments
    const focusAreas = skill_assessments
      .filter(skill => skill.difficulty_level !== DIFFICULTY_LEVELS.NONE)
      .map(skill => ({
        skill: skill.category,
        priority: getPriority(skill.difficulty_level),
        currentLevel: skill.score,
        targetLevel: getTargetLevel(skill.score),
        strategies: skill.recommendations
      }))
      .sort((a, b) => b.priority - a.priority);

    // Create learning path
    const learningPath = await prisma.learningPath.create({
      data: {
        studentId,
        difficultyLevel: overall_difficulty,
        duration: template.duration,
        sessionsPerWeek: template.sessionsPerWeek,
        startDate: new Date(),
        endDate: new Date(Date.now() + template.duration * 7 * 24 * 60 * 60 * 1000),
        status: 'active',
        focusAreas: focusAreas,
        difficultWords: difficult_words.map(w => w.word),
        metadata: {
          generatedAt: new Date().toISOString(),
          assessmentId: assessmentResults.session_id
        }
      }
    });

    // Generate learning modules
    const modules = await generateLearningModules(learningPath.id, focusAreas, template);

    // Schedule interventions
    const interventions = await scheduleInterventions(learningPath.id, template.interventions, focusAreas);

    logger.info(`✅ Learning path generated: ${learningPath.id}`);

    return {
      learningPath,
      modules,
      interventions
    };

  } catch (error) {
    logger.error(`❌ Failed to generate learning path: ${error.message}`);
    throw error;
  }
}

/**
 * Generate learning modules for path
 */
async function generateLearningModules(pathId, focusAreas, template) {
  const modules = [];

  for (let i = 0; i < focusAreas.length; i++) {
    const area = focusAreas[i];
    
    const module = await prisma.learningModule.create({
      data: {
        pathId,
        skill: area.skill,
        order: i + 1,
        title: getModuleTitle(area.skill),
        description: getModuleDescription(area.skill, area.currentLevel),
        duration: Math.ceil(template.duration / focusAreas.length),
        difficulty: determineMaterialDifficulty(area.currentLevel),
        objectives: generateObjectives(area.skill, area.currentLevel, area.targetLevel),
        activities: generateActivities(area.skill, area.strategies),
        status: i === 0 ? 'active' : 'pending'
      }
    });

    modules.push(module);
  }

  return modules;
}

/**
 * Schedule interventions
 */
async function scheduleInterventions(pathId, interventionTypes, focusAreas) {
  const interventions = [];
  const now = new Date();

  for (const type of interventionTypes) {
    const intervention = await prisma.intervention.create({
      data: {
        pathId,
        type,
        title: getInterventionTitle(type),
        description: getInterventionDescription(type),
        frequency: getInterventionFrequency(type),
        duration: getInterventionDuration(type),
        scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        status: 'scheduled',
        priority: getInterventionPriority(type),
        targetSkills: focusAreas.map(a => a.skill)
      }
    });

    interventions.push(intervention);
  }

  return interventions;
}

/**
 * Recommend learning materials
 */
async function recommendMaterials(studentId, skill = null, difficulty = null) {
  try {
    logger.info(`Recommending materials for student: ${studentId}`);

    // Get student's learning path
    const learningPath = await prisma.learningPath.findFirst({
      where: { studentId, status: 'active' },
      include: { modules: true }
    });

    if (!learningPath) {
      throw new Error('No active learning path found');
    }

    // Get difficulty level
    const targetDifficulty = difficulty || learningPath.difficultyLevel;

    // Get target skills
    const targetSkills = skill ? [skill] : learningPath.focusAreas.map(a => a.skill);

    // Query materials from database
    const materials = await prisma.material.findMany({
      where: {
        difficulty: {
          in: getMaterialDifficultyRange(targetDifficulty)
        },
        skills: {
          hasSome: targetSkills
        },
        isActive: true
      },
      orderBy: [
        { rating: 'desc' },
        { usageCount: 'desc' }
      ],
      take: 10
    });

    // Get student's completed materials to avoid repetition
    const completedMaterials = await prisma.progress.findMany({
      where: { studentId, status: 'completed' },
      select: { materialId: true }
    });

    const completedIds = completedMaterials.map(p => p.materialId);

    // Filter out completed materials
    const recommendedMaterials = materials
      .filter(m => !completedIds.includes(m.id))
      .map(m => ({
        ...m,
        relevanceScore: calculateRelevanceScore(m, targetSkills, learningPath)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    logger.info(`✅ Recommended ${recommendedMaterials.length} materials`);

    return recommendedMaterials;

  } catch (error) {
    logger.error(`❌ Failed to recommend materials: ${error.message}`);
    throw error;
  }
}

/**
 * Adjust difficulty dynamically
 */
async function adjustDifficulty(studentId, performanceData) {
  try {
    logger.info(`Adjusting difficulty for student: ${studentId}`);

    const { accuracy, speed, consistency, recentScores } = performanceData;

    // Get current learning path
    const learningPath = await prisma.learningPath.findFirst({
      where: { studentId, status: 'active' },
      include: { modules: { where: { status: 'active' } } }
    });

    if (!learningPath || !learningPath.modules.length) {
      throw new Error('No active learning module found');
    }

    const currentModule = learningPath.modules[0];

    // Calculate performance score
    const performanceScore = (accuracy * 0.4 + speed * 0.3 + consistency * 0.3);

    let adjustment = null;

    // Increase difficulty if performing well consistently
    if (performanceScore > 0.85 && recentScores.every(s => s > 0.8)) {
      adjustment = {
        action: 'increase',
        reason: 'Consistent high performance',
        newDifficulty: getNextDifficulty(currentModule.difficulty, 'up')
      };
    }
    // Decrease difficulty if struggling
    else if (performanceScore < 0.5 && recentScores.filter(s => s < 0.6).length >= 3) {
      adjustment = {
        action: 'decrease',
        reason: 'Struggling with current level',
        newDifficulty: getNextDifficulty(currentModule.difficulty, 'down')
      };
    }
    // Maintain current difficulty
    else {
      adjustment = {
        action: 'maintain',
        reason: 'Performance within expected range',
        newDifficulty: currentModule.difficulty
      };
    }

    // Update module if adjustment needed
    if (adjustment.action !== 'maintain') {
      await prisma.learningModule.update({
        where: { id: currentModule.id },
        data: { 
          difficulty: adjustment.newDifficulty,
          metadata: {
            ...currentModule.metadata,
            difficultyAdjusted: true,
            adjustmentDate: new Date().toISOString(),
            previousDifficulty: currentModule.difficulty,
            adjustmentReason: adjustment.reason
          }
        }
      });

      logger.info(`✅ Difficulty adjusted: ${adjustment.action} to ${adjustment.newDifficulty}`);
    }

    return adjustment;

  } catch (error) {
    logger.error(`❌ Failed to adjust difficulty: ${error.message}`);
    throw error;
  }
}

/**
 * Track progress
 */
async function trackProgress(studentId, activityId, performanceData) {
  try {
    logger.info(`Tracking progress for student: ${studentId}, activity: ${activityId}`);

    const progress = await prisma.progress.create({
      data: {
        studentId,
        activityId,
        score: performanceData.score,
        accuracy: performanceData.accuracy,
        timeSpent: performanceData.timeSpent,
        completedAt: new Date(),
        status: performanceData.score >= 0.7 ? 'completed' : 'needs_review',
        metrics: performanceData.metrics,
        feedback: generateFeedback(performanceData)
      }
    });

    // Check if module should be completed
    await checkModuleCompletion(studentId);

    // Check if difficulty adjustment needed
    const recentProgress = await getRecentProgress(studentId, 5);
    if (recentProgress.length >= 5) {
      await adjustDifficulty(studentId, {
        accuracy: average(recentProgress.map(p => p.accuracy)),
        speed: average(recentProgress.map(p => 1 / p.timeSpent)),
        consistency: 1 - standardDeviation(recentProgress.map(p => p.score)),
        recentScores: recentProgress.map(p => p.score)
      });
    }

    logger.info(`✅ Progress tracked: ${progress.id}`);

    return progress;

  } catch (error) {
    logger.error(`❌ Failed to track progress: ${error.message}`);
    throw error;
  }
}

/**
 * Get learning analytics
 */
async function getLearningAnalytics(studentId, timeRange = '30d') {
  try {
    const startDate = getStartDate(timeRange);

    // Get all progress entries
    const progressEntries = await prisma.progress.findMany({
      where: {
        studentId,
        completedAt: { gte: startDate }
      },
      orderBy: { completedAt: 'asc' }
    });

    // Get learning path
    const learningPath = await prisma.learningPath.findFirst({
      where: { studentId, status: 'active' },
      include: { modules: true, interventions: true }
    });

    // Calculate analytics
    const analytics = {
      overview: {
        totalActivities: progressEntries.length,
        averageScore: average(progressEntries.map(p => p.score)),
        averageAccuracy: average(progressEntries.map(p => p.accuracy)),
        totalTimeSpent: sum(progressEntries.map(p => p.timeSpent)),
        completionRate: progressEntries.filter(p => p.status === 'completed').length / progressEntries.length
      },
      skillProgress: calculateSkillProgress(progressEntries, learningPath),
      trends: calculateTrends(progressEntries),
      strengths: identifyStrengths(progressEntries),
      challenges: identifyChallenges(progressEntries),
      recommendations: generateAnalyticsRecommendations(progressEntries, learningPath),
      milestones: getMilestones(studentId, learningPath)
    };

    return analytics;

  } catch (error) {
    logger.error(`❌ Failed to get learning analytics: ${error.message}`);
    throw error;
  }
}

// Helper functions

function getPriority(difficultyLevel) {
  const priorities = {
    [DIFFICULTY_LEVELS.SEVERE]: 5,
    [DIFFICULTY_LEVELS.MODERATE]: 4,
    [DIFFICULTY_LEVELS.MILD]: 3,
    [DIFFICULTY_LEVELS.NONE]: 1
  };
  return priorities[difficultyLevel] || 3;
}

function getTargetLevel(currentLevel) {
  return Math.min(1.0, currentLevel + 0.2);
}

function getModuleTitle(skill) {
  const titles = {
    decoding: 'Pengenalan Kata dan Phonics',
    fluency: 'Kelancaran Membaca',
    comprehension: 'Pemahaman Bacaan',
    attention: 'Fokus dan Konsentrasi',
    vocabulary: 'Pengembangan Kosakata'
  };
  return titles[skill] || 'Modul Pembelajaran';
}

function getModuleDescription(skill, currentLevel) {
  return `Modul untuk meningkatkan ${skill} dari level ${(currentLevel * 100).toFixed(0)}%`;
}

function determineMaterialDifficulty(currentLevel) {
  if (currentLevel >= 0.8) return 'advanced';
  if (currentLevel >= 0.6) return 'intermediate';
  if (currentLevel >= 0.4) return 'basic';
  return 'foundation';
}

function generateObjectives(skill, currentLevel, targetLevel) {
  return [
    `Meningkatkan ${skill} dari ${(currentLevel * 100).toFixed(0)}% ke ${(targetLevel * 100).toFixed(0)}%`,
    `Menguasai strategi-strategi ${skill}`,
    `Menerapkan keterampilan dalam konteks yang beragam`
  ];
}

function generateActivities(skill, strategies) {
  return strategies.map((strategy, index) => ({
    order: index + 1,
    type: 'practice',
    title: strategy,
    duration: 15,
    materials: []
  }));
}

function getInterventionTitle(type) {
  const titles = {
    targeted_practice: 'Latihan Terfokus',
    peer_support: 'Dukungan Teman Sebaya',
    small_group: 'Kelompok Kecil',
    explicit_instruction: 'Instruksi Eksplisit',
    one_on_one: 'Bimbingan Individual',
    specialist: 'Konsultasi Spesialis',
    daily_practice: 'Latihan Harian',
    parent_training: 'Pelatihan Orang Tua'
  };
  return titles[type] || type;
}

function getInterventionDescription(type) {
  return `Intervensi ${getInterventionTitle(type)} untuk mendukung pembelajaran`;
}

function getInterventionFrequency(type) {
  const frequencies = {
    daily_practice: 'daily',
    one_on_one: 'twice_weekly',
    small_group: 'weekly',
    specialist: 'monthly'
  };
  return frequencies[type] || 'weekly';
}

function getInterventionDuration(type) {
  return type === 'specialist' ? 60 : 30; // minutes
}

function getInterventionPriority(type) {
  const priorities = {
    specialist: 5,
    one_on_one: 4,
    daily_practice: 4,
    explicit_instruction: 3,
    small_group: 3,
    targeted_practice: 2,
    peer_support: 1,
    parent_training: 2
  };
  return priorities[type] || 2;
}

function getMaterialDifficultyRange(difficulty) {
  const ranges = {
    none: ['intermediate', 'advanced'],
    mild: ['basic', 'intermediate'],
    moderate: ['foundation', 'basic'],
    severe: ['foundation']
  };
  return ranges[difficulty] || ['basic', 'intermediate'];
}

function calculateRelevanceScore(material, targetSkills, learningPath) {
  let score = 0;
  
  // Skill match
  const matchingSkills = material.skills.filter(s => targetSkills.includes(s));
  score += matchingSkills.length * 20;
  
  // Difficulty appropriateness
  if (material.difficulty === learningPath.difficultyLevel) score += 30;
  
  // Rating
  score += material.rating * 10;
  
  // Usage count (popularity)
  score += Math.log(material.usageCount + 1) * 5;
  
  return score;
}

function getNextDifficulty(current, direction) {
  const levels = ['foundation', 'basic', 'intermediate', 'advanced'];
  const index = levels.indexOf(current);
  
  if (direction === 'up' && index < levels.length - 1) {
    return levels[index + 1];
  } else if (direction === 'down' && index > 0) {
    return levels[index - 1];
  }
  
  return current;
}

async function checkModuleCompletion(studentId) {
  // Implementation for checking if current module is complete
  // and activating next module
}

async function getRecentProgress(studentId, limit) {
  return await prisma.progress.findMany({
    where: { studentId },
    orderBy: { completedAt: 'desc' },
    take: limit
  });
}

function generateFeedback(performanceData) {
  const { score, accuracy } = performanceData;
  
  if (score >= 0.9) return 'Excellent! Kerja yang sangat baik!';
  if (score >= 0.7) return 'Good job! Terus tingkatkan!';
  if (score >= 0.5) return 'Keep practicing! Kamu bisa lebih baik!';
  return 'Butuh latihan lebih banyak. Jangan menyerah!';
}

function average(arr) {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function standardDeviation(arr) {
  const avg = average(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

function getStartDate(timeRange) {
  const now = new Date();
  const days = parseInt(timeRange) || 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function calculateSkillProgress(progressEntries, learningPath) {
  // Calculate progress per skill
  return {};
}

function calculateTrends(progressEntries) {
  // Calculate performance trends over time
  return {};
}

function identifyStrengths(progressEntries) {
  // Identify student's strengths
  return [];
}

function identifyChallenges(progressEntries) {
  // Identify areas of challenge
  return [];
}

function generateAnalyticsRecommendations(progressEntries, learningPath) {
  // Generate recommendations based on analytics
  return [];
}

function getMilestones(studentId, learningPath) {
  // Get achieved and upcoming milestones
  return [];
}

module.exports = {
  generateLearningPath,
  recommendMaterials,
  adjustDifficulty,
  trackProgress,
  getLearningAnalytics
};
