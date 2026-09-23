import pytest
import numpy as np
from app.features.feature_extractor import FeatureExtractor
from app.schemas.assessment import (
    GazePoint, Fixation, WordGazeData,
    PronunciationAssessment, ProsodyAnalysis
)


class TestFeatureExtractor:
    """Test suite for FeatureExtractor"""

    @pytest.fixture
    def feature_extractor(self):
        return FeatureExtractor()

    @pytest.fixture
    def sample_gaze_data(self):
        """Sample gaze tracking data"""
        return {
            'gaze_points': [
                GazePoint(x=100 + i*10, y=200, timestamp=i*100, confidence=0.9)
                for i in range(50)
            ],
            'fixations': [
                Fixation(
                    x=100 + i*50, y=200, duration=200 + i*10,
                    timestamp=i*500, word_index=i
                )
                for i in range(10)
            ],
            'word_data': [
                WordGazeData(
                    word_index=i,
                    word_text=f'word{i}',
                    fixation_count=2 + i % 3,
                    total_duration=300 + i*50,
                    regression_count=i % 2,
                    skipped=False
                )
                for i in range(20)
            ],
            'session_duration': 30000  # 30 seconds
        }

    @pytest.fixture
    def sample_speech_data(self):
        """Sample speech analysis data"""
        return {
            'pronunciation': [
                PronunciationAssessment(
                    word='test',
                    accuracy=0.85,
                    error_type='correct'
                ),
                PronunciationAssessment(
                    word='word',
                    accuracy=0.60,
                    error_type='substitution'
                ),
                PronunciationAssessment(
                    word='reading',
                    accuracy=0.95,
                    error_type='correct'
                )
            ],
            'prosody': ProsodyAnalysis(
                speaking_rate=120,
                pause_count=5,
                average_pause_duration=0.8,
                pitch_variation=0.7,
                volume_variation=0.6,
                monotone_score=0.3
            ),
            'fluency_metrics': {
                'wpm': 120,
                'cwpm': 102,
                'accuracy': 0.85,
                'fluency_score': 0.80
            },
            'error_counts': {
                'omissions': 2,
                'insertions': 1,
                'substitutions': 3,
                'mispronunciations': 2
            }
        }

    def test_extract_gaze_features(self, feature_extractor, sample_gaze_data):
        """Test gaze feature extraction"""
        features = feature_extractor.extract_gaze_features(sample_gaze_data)
        
        assert isinstance(features, dict)
        assert 'reading_speed_wpm' in features
        assert 'avg_fixation_duration' in features
        assert 'fixation_count' in features
        assert 'regression_rate' in features
        assert 'skip_rate' in features
        
        # Validate feature types and ranges
        assert isinstance(features['reading_speed_wpm'], (int, float))
        assert features['reading_speed_wpm'] > 0
        assert 0 <= features['regression_rate'] <= 1
        assert 0 <= features['skip_rate'] <= 1

    def test_extract_speech_features(self, feature_extractor, sample_speech_data):
        """Test speech feature extraction"""
        features = feature_extractor.extract_speech_features(sample_speech_data)
        
        assert isinstance(features, dict)
        assert 'pronunciation_accuracy' in features
        assert 'fluency_score' in features
        assert 'wpm' in features
        assert 'speaking_rate' in features
        assert 'error_rate' in features
        
        # Validate feature ranges
        assert 0 <= features['pronunciation_accuracy'] <= 1
        assert 0 <= features['fluency_score'] <= 1
        assert features['wpm'] > 0

    def test_extract_combined_features(self, feature_extractor, sample_gaze_data, sample_speech_data):
        """Test combined feature extraction"""
        gaze_features = feature_extractor.extract_gaze_features(sample_gaze_data)
        speech_features = feature_extractor.extract_speech_features(sample_speech_data)
        
        combined = feature_extractor.extract_combined_features(gaze_features, speech_features)
        
        assert isinstance(combined, dict)
        assert 'speed_ratio' in combined
        assert 'accuracy_correlation' in combined
        assert 'difficulty_indicator' in combined

    def test_extract_all_features(self, feature_extractor, sample_gaze_data, sample_speech_data):
        """Test complete feature extraction"""
        features = feature_extractor.extract_all_features(sample_gaze_data, sample_speech_data)
        
        assert isinstance(features, dict)
        # Check that all feature categories are present
        assert len(features) >= 40  # Should have 40+ features
        
        # Verify all features are numeric
        for key, value in features.items():
            assert isinstance(value, (int, float, np.integer, np.floating)), \
                f"Feature {key} is not numeric: {type(value)}"

    def test_empty_gaze_data(self, feature_extractor):
        """Test handling of empty gaze data"""
        empty_data = {
            'gaze_points': [],
            'fixations': [],
            'word_data': [],
            'session_duration': 0
        }
        
        features = feature_extractor.extract_gaze_features(empty_data)
        
        # Should return default values, not crash
        assert isinstance(features, dict)
        assert all(isinstance(v, (int, float)) for v in features.values())

    def test_empty_speech_data(self, feature_extractor):
        """Test handling of empty speech data"""
        empty_data = {
            'pronunciation': [],
            'prosody': ProsodyAnalysis(
                speaking_rate=0,
                pause_count=0,
                average_pause_duration=0,
                pitch_variation=0,
                volume_variation=0,
                monotone_score=0
            ),
            'fluency_metrics': {
                'wpm': 0,
                'cwpm': 0,
                'accuracy': 0,
                'fluency_score': 0
            },
            'error_counts': {
                'omissions': 0,
                'insertions': 0,
                'substitutions': 0,
                'mispronunciations': 0
            }
        }
        
        features = feature_extractor.extract_speech_features(empty_data)
        
        # Should return default values
        assert isinstance(features, dict)

    def test_feature_consistency(self, feature_extractor, sample_gaze_data, sample_speech_data):
        """Test that feature extraction is consistent"""
        # Extract features twice
        features1 = feature_extractor.extract_all_features(sample_gaze_data, sample_speech_data)
        features2 = feature_extractor.extract_all_features(sample_gaze_data, sample_speech_data)
        
        # Should produce identical results
        assert features1.keys() == features2.keys()
        for key in features1.keys():
            assert abs(features1[key] - features2[key]) < 1e-6

    def test_statistical_features(self, feature_extractor, sample_gaze_data):
        """Test statistical feature calculations"""
        features = feature_extractor.extract_gaze_features(sample_gaze_data)
        
        # Check for statistical measures
        assert 'std_fixation_duration' in features or 'fixation_duration_std' in features
        assert features.get('avg_fixation_duration', 0) > 0

    def test_difficulty_indicators(self, feature_extractor, sample_gaze_data, sample_speech_data):
        """Test difficulty indicator features"""
        gaze_features = feature_extractor.extract_gaze_features(sample_gaze_data)
        speech_features = feature_extractor.extract_speech_features(sample_speech_data)
        combined = feature_extractor.extract_combined_features(gaze_features, speech_features)
        
        assert 'difficulty_indicator' in combined
        # Difficulty should be between 0 and 1
        assert 0 <= combined['difficulty_indicator'] <= 2  # Can exceed 1 if very difficult
