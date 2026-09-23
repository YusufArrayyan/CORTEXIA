import pytest
from app.services.assessment_engine import AssessmentEngine
from app.schemas.assessment import AssessmentInput, DifficultyLevel, ReadingSkillCategory
from app.features.feature_extractor import FeatureExtractor
from app.models.ml_models import ModelManager


class TestAssessmentEngine:
    """Test suite for AssessmentEngine"""

    @pytest.fixture
    def assessment_engine(self):
        feature_extractor = FeatureExtractor()
        model_manager = ModelManager()
        return AssessmentEngine(feature_extractor, model_manager)

    @pytest.fixture
    def sample_assessment_input(self):
        """Sample assessment input data"""
        from app.schemas.assessment import (
            GazeData, SpeechData, GazePoint, Fixation,
            WordGazeData, PronunciationAssessment, ProsodyAnalysis
        )
        
        return AssessmentInput(
            student_id='student_123',
            assessment_id='assessment_456',
            gaze_data=GazeData(
                gaze_points=[
                    GazePoint(x=100+i*10, y=200, timestamp=i*100, confidence=0.9)
                    for i in range(50)
                ],
                fixations=[
                    Fixation(
                        x=100+i*50, y=200, duration=200+i*10,
                        timestamp=i*500, word_index=i
                    )
                    for i in range(10)
                ],
                word_data=[
                    WordGazeData(
                        word_index=i,
                        word_text=f'word{i}',
                        fixation_count=2,
                        total_duration=300,
                        regression_count=0,
                        skipped=False
                    )
                    for i in range(20)
                ],
                session_duration=30000
            ),
            speech_data=SpeechData(
                pronunciation=[
                    PronunciationAssessment(
                        word=f'word{i}',
                        accuracy=0.85 - i*0.05,
                        error_type='correct' if i < 2 else 'substitution'
                    )
                    for i in range(5)
                ],
                prosody=ProsodyAnalysis(
                    speaking_rate=120,
                    pause_count=5,
                    average_pause_duration=0.8,
                    pitch_variation=0.7,
                    volume_variation=0.6,
                    monotone_score=0.3
                ),
                fluency_metrics={
                    'wpm': 120,
                    'cwpm': 102,
                    'accuracy': 0.85,
                    'fluency_score': 0.80
                },
                error_counts={
                    'omissions': 2,
                    'insertions': 1,
                    'substitutions': 3,
                    'mispronunciations': 2
                }
            ),
            reading_text='Sample reading text for assessment purposes.',
            expected_duration=60
        )

    def test_assess_complete_workflow(self, assessment_engine, sample_assessment_input):
        """Test complete assessment workflow"""
        result = assessment_engine.assess(sample_assessment_input)
        
        # Verify result structure
        assert hasattr(result, 'student_id')
        assert hasattr(result, 'assessment_id')
        assert hasattr(result, 'overall_difficulty')
        assert hasattr(result, 'confidence_score')
        assert hasattr(result, 'skill_assessments')
        assert hasattr(result, 'difficult_words')
        assert hasattr(result, 'recommendations')
        
        # Verify difficulty level is valid
        assert result.overall_difficulty in [level.value for level in DifficultyLevel]
        
        # Verify confidence score range
        assert 0 <= result.confidence_score <= 1

    def test_skill_assessments(self, assessment_engine, sample_assessment_input):
        """Test skill-specific assessments"""
        result = assessment_engine.assess(sample_assessment_input)
        
        # Should have assessments for all skills
        expected_skills = [
            ReadingSkillCategory.DECODING,
            ReadingSkillCategory.FLUENCY,
            ReadingSkillCategory.COMPREHENSION,
            ReadingSkillCategory.ATTENTION
        ]
        
        assert len(result.skill_assessments) >= 4
        
        for skill_assessment in result.skill_assessments:
            assert skill_assessment.skill in [s.value for s in expected_skills]
            assert skill_assessment.difficulty in [d.value for d in DifficultyLevel]
            assert 0 <= skill_assessment.score <= 1
            assert len(skill_assessment.indicators) > 0

    def test_difficult_words_identification(self, assessment_engine, sample_assessment_input):
        """Test difficult word identification"""
        result = assessment_engine.assess(sample_assessment_input)
        
        # Should identify some difficult words
        assert isinstance(result.difficult_words, list)
        
        if len(result.difficult_words) > 0:
            for word in result.difficult_words:
                assert hasattr(word, 'word')
                assert hasattr(word, 'difficulty_score')
                assert hasattr(word, 'issues')
                assert 0 <= word.difficulty_score <= 1

    def test_recommendations_generation(self, assessment_engine, sample_assessment_input):
        """Test recommendations generation"""
        result = assessment_engine.assess(sample_assessment_input)
        
        # Should have immediate and long-term recommendations
        assert len(result.recommendations.immediate) > 0
        assert len(result.recommendations.long_term) > 0
        
        # Should have material recommendations
        assert len(result.recommendations.materials) > 0

    def test_different_difficulty_levels(self, assessment_engine):
        """Test assessment with different difficulty levels"""
        from app.schemas.assessment import (
            AssessmentInput, GazeData, SpeechData, GazePoint,
            Fixation, WordGazeData, PronunciationAssessment,
            ProsodyAnalysis
        )
        
        # Create high-performing input (should be NONE or MILD)
        high_perf_input = AssessmentInput(
            student_id='student_high',
            assessment_id='assessment_high',
            gaze_data=GazeData(
                gaze_points=[GazePoint(x=100, y=200, timestamp=i*50, confidence=0.95) for i in range(100)],
                fixations=[Fixation(x=100, y=200, duration=150, timestamp=i*300, word_index=i) for i in range(30)],
                word_data=[WordGazeData(
                    word_index=i, word_text=f'word{i}',
                    fixation_count=1, total_duration=150,
                    regression_count=0, skipped=False
                ) for i in range(30)],
                session_duration=15000
            ),
            speech_data=SpeechData(
                pronunciation=[PronunciationAssessment(word=f'word{i}', accuracy=0.95, error_type='correct') for i in range(10)],
                prosody=ProsodyAnalysis(
                    speaking_rate=150, pause_count=2,
                    average_pause_duration=0.5, pitch_variation=0.8,
                    volume_variation=0.7, monotone_score=0.2
                ),
                fluency_metrics={'wpm': 150, 'cwpm': 145, 'accuracy': 0.95, 'fluency_score': 0.92},
                error_counts={'omissions': 0, 'insertions': 0, 'substitutions': 1, 'mispronunciations': 0}
            ),
            reading_text='Sample text',
            expected_duration=30
        )
        
        result_high = assessment_engine.assess(high_perf_input)
        
        # Should indicate low difficulty
        assert result_high.overall_difficulty in [DifficultyLevel.NONE.value, DifficultyLevel.MILD.value]

    def test_confidence_score_calculation(self, assessment_engine, sample_assessment_input):
        """Test confidence score is properly calculated"""
        result = assessment_engine.assess(sample_assessment_input)
        
        # Confidence should be reasonable
        assert 0.5 <= result.confidence_score <= 1.0

    def test_strengths_and_weaknesses(self, assessment_engine, sample_assessment_input):
        """Test strengths and weaknesses identification"""
        result = assessment_engine.assess(sample_assessment_input)
        
        # Should have at least one strength or weakness
        assert len(result.strengths) > 0 or len(result.weaknesses) > 0

    def test_empty_input_handling(self, assessment_engine):
        """Test handling of minimal input data"""
        from app.schemas.assessment import (
            AssessmentInput, GazeData, SpeechData, ProsodyAnalysis
        )
        
        minimal_input = AssessmentInput(
            student_id='student_min',
            assessment_id='assessment_min',
            gaze_data=GazeData(
                gaze_points=[], fixations=[], word_data=[],
                session_duration=0
            ),
            speech_data=SpeechData(
                pronunciation=[],
                prosody=ProsodyAnalysis(
                    speaking_rate=0, pause_count=0,
                    average_pause_duration=0, pitch_variation=0,
                    volume_variation=0, monotone_score=0
                ),
                fluency_metrics={'wpm': 0, 'cwpm': 0, 'accuracy': 0, 'fluency_score': 0},
                error_counts={'omissions': 0, 'insertions': 0, 'substitutions': 0, 'mispronunciations': 0}
            ),
            reading_text='',
            expected_duration=0
        )
        
        # Should not crash, even with minimal data
        result = assessment_engine.assess(minimal_input)
        assert result is not None

    def test_consistency_across_calls(self, assessment_engine, sample_assessment_input):
        """Test that assessment is consistent"""
        result1 = assessment_engine.assess(sample_assessment_input)
        result2 = assessment_engine.assess(sample_assessment_input)
        
        # Should produce same overall difficulty
        assert result1.overall_difficulty == result2.overall_difficulty
        
        # Confidence scores should be very close
        assert abs(result1.confidence_score - result2.confidence_score) < 0.01
