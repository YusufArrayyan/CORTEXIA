"""
Assessment data schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    """Reading difficulty levels"""
    NONE = "none"  # No difficulty
    MILD = "mild"  # Mild difficulty
    MODERATE = "moderate"  # Moderate difficulty
    SEVERE = "severe"  # Severe difficulty


class ReadingSkillCategory(str, Enum):
    """Reading skill categories"""
    DECODING = "decoding"  # Word recognition
    FLUENCY = "fluency"  # Reading speed and prosody
    COMPREHENSION = "comprehension"  # Understanding
    VOCABULARY = "vocabulary"  # Word knowledge
    ATTENTION = "attention"  # Focus and concentration


# Gaze Data Schemas
class GazePoint(BaseModel):
    """Single gaze point"""
    x: float
    y: float
    timestamp: int
    confidence: float


class Fixation(BaseModel):
    """Gaze fixation"""
    x: float
    y: float
    duration: float
    timestamp: int


class WordGazeData(BaseModel):
    """Gaze data for a single word"""
    word: str
    index: int
    fixation_count: int
    total_duration: float
    average_fixation_duration: float
    regression_count: int
    skipped: bool


class GazeMetrics(BaseModel):
    """Reading metrics from gaze tracking"""
    total_words: int
    words_read: int
    words_skipped: int
    total_reading_time: float
    average_fixation_duration: float
    regression_rate: float
    reading_speed: float  # WPM
    comprehension_indicator: float


# Speech Data Schemas
class PronunciationAssessment(BaseModel):
    """Pronunciation assessment for a word"""
    word: str
    expected_word: str
    accuracy: float
    is_correct: bool
    is_mispronounced: bool
    is_omitted: bool
    is_inserted: bool


class ProsodyAnalysis(BaseModel):
    """Prosody analysis from speech"""
    speaking_rate: float  # WPM
    pause_count: int
    average_pause_duration: float
    longest_pause_duration: float
    pitch_variation: float
    volume_variation: float
    fluency_score: float
    monotone_indicator: float


class SpeechFluencyMetrics(BaseModel):
    """Speech fluency metrics"""
    total_words: int
    correct_words: int
    incorrect_words: int
    omitted_words: int
    inserted_words: int
    substituted_words: int
    accuracy: float
    words_per_minute: float
    correct_words_per_minute: float
    prosody: ProsodyAnalysis
    hesitation_count: int
    repetition_count: int
    self_correction_count: int
    overall_fluency_score: float


# Combined Assessment Input
class AssessmentInput(BaseModel):
    """Input data for AI assessment"""
    student_id: str
    session_id: str
    assessment_id: Optional[str] = None
    material_id: Optional[str] = None
    expected_text: str
    recognized_text: str
    
    # Gaze data
    gaze_points: List[GazePoint]
    fixations: List[Fixation]
    word_gaze_data: List[WordGazeData]
    gaze_metrics: GazeMetrics
    
    # Speech data
    pronunciation_assessments: List[PronunciationAssessment]
    speech_fluency_metrics: SpeechFluencyMetrics
    
    # Session metadata
    session_start_time: int
    session_end_time: int
    session_duration: float


# Assessment Output
class SkillAssessment(BaseModel):
    """Assessment for a specific skill"""
    category: ReadingSkillCategory
    score: float = Field(..., ge=0.0, le=1.0)
    difficulty_level: DifficultyLevel
    confidence: float = Field(..., ge=0.0, le=1.0)
    indicators: List[str]
    recommendations: List[str]


class DifficultWord(BaseModel):
    """Information about a difficult word"""
    word: str
    index: int
    gaze_fixations: int
    gaze_duration: float
    pronunciation_accuracy: float
    difficulty_score: float
    issues: List[str]


class AssessmentResult(BaseModel):
    """Complete assessment result"""
    session_id: str
    student_id: str
    timestamp: datetime
    
    # Overall assessment
    overall_difficulty: DifficultyLevel
    overall_score: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    
    # Skill-specific assessments
    skill_assessments: List[SkillAssessment]
    
    # Detailed findings
    difficult_words: List[DifficultWord]
    strengths: List[str]
    weaknesses: List[str]
    
    # Recommendations
    immediate_interventions: List[str]
    long_term_recommendations: List[str]
    recommended_materials: List[Dict[str, Any]]
    
    # Metadata
    model_version: str
    processing_time: float


class PredictionInput(BaseModel):
    """Input for prediction endpoint"""
    features: Dict[str, float]
    feature_names: Optional[List[str]] = None


class PredictionOutput(BaseModel):
    """Output from prediction endpoint"""
    difficulty_level: DifficultyLevel
    confidence: float
    probabilities: Dict[str, float]
    feature_importance: Optional[Dict[str, float]] = None


class TrainingRequest(BaseModel):
    """Request for model training"""
    model_type: str = Field(..., description="Type of model to train: 'gaze', 'speech', or 'multimodal'")
    data_source: str = Field(..., description="Data source: 'database', 'file', or 'synthetic'")
    hyperparameters: Optional[Dict[str, Any]] = None
    save_model: bool = True


class TrainingResponse(BaseModel):
    """Response from model training"""
    success: bool
    model_type: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    training_time: float
    model_path: Optional[str] = None
