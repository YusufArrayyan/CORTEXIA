const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const axios = require('axios');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.wav')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// POST /api/assessments - Submit new assessment
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    const { user_id, text_id, gaze_data, gaze_stats, duration } = req.body;
    const audioFile = req.file;

    // Validate required fields
    if (!user_id || !text_id || !gaze_data || !audioFile) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, text_id, gaze_data, audio',
      });
    }

    // Parse JSON fields
    const gazeDataParsed = JSON.parse(gaze_data);
    const gazeStatsParsed = gaze_stats ? JSON.parse(gaze_stats) : null;

    console.log('Received assessment submission:', {
      user_id,
      text_id,
      gazeDataPoints: gazeDataParsed.length,
      audioSize: audioFile.size,
      duration,
    });

    // Save audio file temporarily
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const audioFileName = `${user_id}_${Date.now()}.wav`;
    const audioPath = path.join(uploadDir, audioFileName);
    await fs.writeFile(audioPath, audioFile.buffer);

    // Call AI engine for analysis
    let aiAnalysis = null;
    try {
      const aiFormData = new FormData();
      aiFormData.append('audio', audioFile.buffer, {
        filename: audioFileName,
        contentType: audioFile.mimetype,
      });
      aiFormData.append('gaze_data', JSON.stringify(gazeDataParsed));
      aiFormData.append('text_id', text_id);

      const aiResponse = await axios.post(
        'http://localhost:8000/api/analyze',
        aiFormData,
        {
          headers: aiFormData.getHeaders(),
          timeout: 120000, // 2 minutes timeout
        }
      );

      aiAnalysis = aiResponse.data;
      console.log('AI analysis completed:', aiAnalysis);
    } catch (aiError) {
      console.error('AI engine error:', aiError.message);
      // Continue without AI analysis for now
      aiAnalysis = {
        difficulty_level: 'MEDIUM',
        confidence_score: 0.5,
        reading_speed: gazeStatsParsed?.totalPoints || 0,
        comprehension_score: 50,
        fluency_score: 50,
        recommendations: ['AI engine unavailable - manual review required'],
      };
    }

    // Save assessment to Supabase
    const { data: assessment, error: dbError } = await supabase
      .from('assessments')
      .insert({
        user_id,
        text_id: parseInt(text_id),
        gaze_data: gazeDataParsed,
        gaze_statistics: gazeStatsParsed,
        audio_url: audioPath,
        duration_seconds: parseInt(duration) || 0,
        difficulty_level: aiAnalysis.difficulty_level,
        confidence_score: aiAnalysis.confidence_score,
        reading_speed: aiAnalysis.reading_speed,
        comprehension_score: aiAnalysis.comprehension_score,
        fluency_score: aiAnalysis.fluency_score,
        recommendations: aiAnalysis.recommendations,
        status: 'COMPLETED',
        assessed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save assessment to database');
    }

    // Update user progress
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existingProgress) {
      const newAvgScore = (
        (existingProgress.average_score * existingProgress.total_assessments + aiAnalysis.comprehension_score) /
        (existingProgress.total_assessments + 1)
      );

      await supabase
        .from('user_progress')
        .update({
          total_assessments: existingProgress.total_assessments + 1,
          average_score: newAvgScore,
          last_assessment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id);
    } else {
      await supabase
        .from('user_progress')
        .insert({
          user_id,
          total_assessments: 1,
          average_score: aiAnalysis.comprehension_score,
          last_assessment_date: new Date().toISOString(),
        });
    }

    // Clean up temporary audio file
    try {
      await fs.unlink(audioPath);
    } catch (cleanupError) {
      console.error('Failed to cleanup audio file:', cleanupError);
    }

    res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: {
        assessment_id: assessment.id,
        difficulty_level: assessment.difficulty_level,
        confidence_score: assessment.confidence_score,
        comprehension_score: assessment.comprehension_score,
        fluency_score: assessment.fluency_score,
        recommendations: assessment.recommendations,
      },
    });

  } catch (error) {
    console.error('Assessment submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process assessment',
      message: error.message,
    });
  }
});

// GET /api/assessments - Get all assessments (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { user_id, text_id, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('assessments')
      .select(`
        *,
        reading_texts (
          title,
          difficulty_level
        ),
        users (
          username,
          full_name
        )
      `)
      .order('assessed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (text_id) {
      query = query.eq('text_id', text_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assessments',
    });
  }
});

// GET /api/assessments/:id - Get single assessment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        reading_texts (
          title,
          content,
          difficulty_level
        ),
        users (
          username,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found',
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assessment',
    });
  }
});

// DELETE /api/assessments/:id - Delete assessment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Assessment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete assessment',
    });
  }
});

module.exports = router;
