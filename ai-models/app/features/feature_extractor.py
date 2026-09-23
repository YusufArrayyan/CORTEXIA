"""
Feature Extraction for AI Assessment Engine
Extracts features from gaze and speech data for ML models
"""

import numpy as np
from typing import Dict, List, Tuple
from loguru import logger

from app.schemas.assessment import (
    AssessmentInput,
    GazeMetrics,
    SpeechFluencyMetrics,
    WordGazeData,
    PronunciationAssessment,
    Fixation
)


class FeatureExtractor:
    """
    Feature extractor for multimodal reading assessment.
    Extracts statistical and behavioral features from gaze and speech data.
    """
    
    def __init__(self):
        """Initialize feature extractor"""
        self.feature_names = []
        logger.info("FeatureExtractor initialized")
    
    def extract_all_features(
        self,
        assessment_data: AssessmentInput
    ) -> Tuple[np.ndarray, List[str]]:
        """
        Extract all features from assessment data
        
        Args:
            assessment_data: Complete assessment input
            
        Returns:
            Tuple of (feature_vector, feature_names)
        """
        features = {}
        
        # Extract gaze features
        gaze_features = self.extract_gaze_features(
            assessment_data.gaze_metrics,
            assessment_data.word_gaze_data,
            assessment_data.fixations
        )
        features.update(gaze_features)
        
        # Extract speech features
        speech_features = self.extract_speech_features(
            assessment_data.speech_fluency_metrics,
            assessment_data.pronunciation_assessments
        )
        features.update(speech_features)
        
        # Extract combined features
        combined_features = self.extract_combined_features(
            assessment_data
        )
        features.update(combined_features)
        
        # Convert to numpy array
        feature_names = sorted(features.keys())
        feature_vector = np.array([features[name] for name in feature_names])
        
        self.feature_names = feature_names
        
        logger.info(f"Extracted {len(feature_vector)} features")
        return feature_vector, feature_names
    
    def extract_gaze_features(
        self,
        gaze_metrics: GazeMetrics,
        word_gaze_data: List[WordGazeData],
        fixations: List[Fixation]
    ) -> Dict[str, float]:
        """Extract features from gaze tracking data"""
        features = {}
        
        # Basic gaze metrics
        features['gaze_reading_speed'] = gaze_metrics.reading_speed
        features['gaze_avg_fixation_duration'] = gaze_metrics.average_fixation_duration
        features['gaze_regression_rate'] = gaze_metrics.regression_rate
        features['gaze_comprehension_indicator'] = gaze_metrics.comprehension_indicator
        features['gaze_skip_rate'] = gaze_metrics.words_skipped / max(gaze_metrics.total_words, 1)
        
        # Fixation statistics
        if fixations:
            fixation_durations = [f.duration for f in fixations]
            features['gaze_fixation_count'] = len(fixations)
            features['gaze_fixation_std'] = float(np.std(fixation_durations))
            features['gaze_fixation_median'] = float(np.median(fixation_durations))
            features['gaze_fixation_max'] = float(np.max(fixation_durations))
            features['gaze_fixation_min'] = float(np.min(fixation_durations))
        else:
            features['gaze_fixation_count'] = 0
            features['gaze_fixation_std'] = 0
            features['gaze_fixation_median'] = 0
            features['gaze_fixation_max'] = 0
            features['gaze_fixation_min'] = 0
        
        # Word-level gaze analysis
        if word_gaze_data:
            word_fixations = [w.fixation_count for w in word_gaze_data if not w.skipped]
            word_durations = [w.total_duration for w in word_gaze_data if not w.skipped]
            word_regressions = [w.regression_count for w in word_gaze_data]
            
            if word_fixations:
                features['gaze_word_fixation_mean'] = float(np.mean(word_fixations))
                features['gaze_word_fixation_std'] = float(np.std(word_fixations))
                features['gaze_word_duration_mean'] = float(np.mean(word_durations))
                features['gaze_word_duration_std'] = float(np.std(word_durations))
                features['gaze_word_regression_mean'] = float(np.mean(word_regressions))
                
                # Difficult word indicators
                features['gaze_high_fixation_words'] = sum(1 for f in word_fixations if f > np.mean(word_fixations) + np.std(word_fixations))
                features['gaze_long_duration_words'] = sum(1 for d in word_durations if d > np.mean(word_durations) + np.std(word_durations))
            else:
                features['gaze_word_fixation_mean'] = 0
                features['gaze_word_fixation_std'] = 0
                features['gaze_word_duration_mean'] = 0
                features['gaze_word_duration_std'] = 0
                features['gaze_word_regression_mean'] = 0
                features['gaze_high_fixation_words'] = 0
                features['gaze_long_duration_words'] = 0
        else:
            for key in ['word_fixation_mean', 'word_fixation_std', 'word_duration_mean', 
                       'word_duration_std', 'word_regression_mean', 'high_fixation_words', 
                       'long_duration_words']:
                features[f'gaze_{key}'] = 0
        
        return features
    
    def extract_speech_features(
        self,
        speech_metrics: SpeechFluencyMetrics,
        pronunciation_assessments: List[PronunciationAssessment]
    ) -> Dict[str, float]:
        """Extract features from speech analysis data"""
        features = {}
        
        # Basic speech metrics
        features['speech_accuracy'] = speech_metrics.accuracy
        features['speech_wpm'] = speech_metrics.words_per_minute
        features['speech_cwpm'] = speech_metrics.correct_words_per_minute
        features['speech_fluency_score'] = speech_metrics.overall_fluency_score
        features['speech_error_rate'] = speech_metrics.incorrect_words / max(speech_metrics.total_words, 1)
        
        # Error breakdown
        features['speech_omission_rate'] = speech_metrics.omitted_words / max(speech_metrics.total_words, 1)
        features['speech_insertion_rate'] = speech_metrics.inserted_words / max(speech_metrics.total_words, 1)
        features['speech_substitution_rate'] = speech_metrics.substituted_words / max(speech_metrics.total_words, 1)
        
        # Prosody features
        prosody = speech_metrics.prosody
        features['speech_speaking_rate'] = prosody.speaking_rate
        features['speech_pause_count'] = prosody.pause_count
        features['speech_avg_pause_duration'] = prosody.average_pause_duration
        features['speech_longest_pause'] = prosody.longest_pause_duration
        features['speech_pitch_variation'] = prosody.pitch_variation
        features['speech_volume_variation'] = prosody.volume_variation
        features['speech_prosody_score'] = prosody.fluency_score
        features['speech_monotone_indicator'] = prosody.monotone_indicator
        
        # Hesitation and corrections
        features['speech_hesitation_count'] = speech_metrics.hesitation_count
        features['speech_repetition_count'] = speech_metrics.repetition_count
        features['speech_self_correction_count'] = speech_metrics.self_correction_count
        features['speech_hesitation_rate'] = speech_metrics.hesitation_count / max(speech_metrics.total_words, 1)
        
        # Pronunciation accuracy statistics
        if pronunciation_assessments:
            accuracies = [p.accuracy for p in pronunciation_assessments if not p.is_inserted]
            features['speech_pronunciation_mean'] = float(np.mean(accuracies))
            features['speech_pronunciation_std'] = float(np.std(accuracies))
            features['speech_pronunciation_min'] = float(np.min(accuracies))
            
            # Count error types
            features['speech_mispronunciation_count'] = sum(1 for p in pronunciation_assessments if p.is_mispronounced)
            features['speech_omission_count'] = sum(1 for p in pronunciation_assessments if p.is_omitted)
        else:
            features['speech_pronunciation_mean'] = 0
            features['speech_pronunciation_std'] = 0
            features['speech_pronunciation_min'] = 0
            features['speech_mispronunciation_count'] = 0
            features['speech_omission_count'] = 0
        
        return features
    
    def extract_combined_features(
        self,
        assessment_data: AssessmentInput
    ) -> Dict[str, float]:
        """Extract combined/interaction features from both modalities"""
        features = {}
        
        # Consistency between gaze and speech
        gaze_speed = assessment_data.gaze_metrics.reading_speed
        speech_speed = assessment_data.speech_fluency_metrics.words_per_minute
        
        if speech_speed > 0:
            features['combined_speed_ratio'] = gaze_speed / speech_speed
            features['combined_speed_diff'] = abs(gaze_speed - speech_speed)
        else:
            features['combined_speed_ratio'] = 0
            features['combined_speed_diff'] = 0
        
        # Accuracy correlation
        gaze_comprehension = assessment_data.gaze_metrics.comprehension_indicator
        speech_accuracy = assessment_data.speech_fluency_metrics.accuracy
        features['combined_accuracy_product'] = gaze_comprehension * speech_accuracy
        features['combined_accuracy_diff'] = abs(gaze_comprehension - speech_accuracy)
        
        # Overall fluency indicator
        gaze_fluency = 1 - assessment_data.gaze_metrics.regression_rate / 100
        speech_fluency = assessment_data.speech_fluency_metrics.overall_fluency_score
        features['combined_fluency_mean'] = (gaze_fluency + speech_fluency) / 2
        
        # Difficulty indicators
        gaze_difficulty = (
            assessment_data.gaze_metrics.regression_rate / 100 * 0.4 +
            (1 - assessment_data.gaze_metrics.comprehension_indicator) * 0.6
        )
        speech_difficulty = 1 - assessment_data.speech_fluency_metrics.overall_fluency_score
        features['combined_difficulty_mean'] = (gaze_difficulty + speech_difficulty) / 2
        features['combined_difficulty_max'] = max(gaze_difficulty, speech_difficulty)
        
        # Session characteristics
        features['session_duration'] = assessment_data.session_duration
        features['session_text_length'] = len(assessment_data.expected_text.split())
        features['session_gaze_points_count'] = len(assessment_data.gaze_points)
        features['session_fixations_count'] = len(assessment_data.fixations)
        
        return features
    
    def get_feature_names(self) -> List[str]:
        """Get list of feature names"""
        return self.feature_names
    
    def extract_features_dict(
        self,
        assessment_data: AssessmentInput
    ) -> Dict[str, float]:
        """Extract features as dictionary"""
        feature_vector, feature_names = self.extract_all_features(assessment_data)
        return dict(zip(feature_names, feature_vector))
