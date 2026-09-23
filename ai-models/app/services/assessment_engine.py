"""
Assessment Engine
Core logic for reading difficulty assessment using multimodal AI
"""

import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime
from loguru import logger

from app.schemas.assessment import (
    AssessmentInput,
    AssessmentResult,
    SkillAssessment,
    DifficultWord,
    DifficultyLevel,
    ReadingSkillCategory
)
from app.features.feature_extractor import FeatureExtractor
from app.models.ml_models import ModelManager


class AssessmentEngine:
    """
    Core assessment engine that integrates gaze tracking, speech analysis,
    and machine learning to assess reading difficulties.
    """
    
    def __init__(self, model_manager: ModelManager):
        """Initialize assessment engine"""
        self.model_manager = model_manager
        self.feature_extractor = FeatureExtractor()
        logger.info("AssessmentEngine initialized")
    
    async def assess(
        self,
        assessment_data: AssessmentInput
    ) -> AssessmentResult:
        """
        Perform complete reading difficulty assessment
        
        Args:
            assessment_data: Complete assessment input data
            
        Returns:
            Comprehensive assessment result
        """
        import time
        start_time = time.time()
        
        logger.info(f"Starting assessment for session {assessment_data.session_id}")
        
        # Extract features
        features, feature_names = self.feature_extractor.extract_all_features(assessment_data)
        
        # Predict overall difficulty
        difficulty, confidence, probabilities = self.model_manager.predict_difficulty(
            features,
            model_type="multimodal"
        )
        
        # Calculate overall score (inverse of difficulty)
        score_mapping = {
            DifficultyLevel.NONE: 1.0,
            DifficultyLevel.MILD: 0.75,
            DifficultyLevel.MODERATE: 0.5,
            DifficultyLevel.SEVERE: 0.25
        }
        overall_score = score_mapping.get(difficulty, 0.5)
        
        # Assess individual skills
        skill_assessments = self._assess_skills(assessment_data, features, feature_names)
        
        # Identify difficult words
        difficult_words = self._identify_difficult_words(assessment_data)
        
        # Determine strengths and weaknesses
        strengths, weaknesses = self._analyze_strengths_weaknesses(skill_assessments)
        
        # Generate recommendations
        immediate_interventions = self._generate_immediate_interventions(
            difficulty,
            skill_assessments,
            assessment_data
        )
        
        long_term_recommendations = self._generate_long_term_recommendations(
            difficulty,
            skill_assessments
        )
        
        recommended_materials = self._recommend_materials(difficulty, skill_assessments)
        
        processing_time = time.time() - start_time
        
        result = AssessmentResult(
            session_id=assessment_data.session_id,
            student_id=assessment_data.student_id,
            timestamp=datetime.now(),
            overall_difficulty=difficulty,
            overall_score=overall_score,
            confidence=confidence,
            skill_assessments=skill_assessments,
            difficult_words=difficult_words[:20],  # Top 20
            strengths=strengths,
            weaknesses=weaknesses,
            immediate_interventions=immediate_interventions,
            long_term_recommendations=long_term_recommendations,
            recommended_materials=recommended_materials,
            model_version="1.0.0",
            processing_time=processing_time
        )
        
        logger.info(f"✅ Assessment complete in {processing_time:.2f}s: {difficulty.value} (confidence: {confidence:.2f})")
        
        return result
    
    def _assess_skills(
        self,
        assessment_data: AssessmentInput,
        features: np.ndarray,
        feature_names: List[str]
    ) -> List[SkillAssessment]:
        """Assess individual reading skills"""
        skill_assessments = []
        
        # Decoding (word recognition) - based on gaze fixations and speech accuracy
        decoding_score = self._calculate_decoding_score(assessment_data)
        skill_assessments.append(SkillAssessment(
            category=ReadingSkillCategory.DECODING,
            score=decoding_score,
            difficulty_level=self._score_to_difficulty(decoding_score),
            confidence=0.8,
            indicators=self._get_decoding_indicators(assessment_data),
            recommendations=self._get_decoding_recommendations(decoding_score)
        ))
        
        # Fluency - based on reading speed and prosody
        fluency_score = self._calculate_fluency_score(assessment_data)
        skill_assessments.append(SkillAssessment(
            category=ReadingSkillCategory.FLUENCY,
            score=fluency_score,
            difficulty_level=self._score_to_difficulty(fluency_score),
            confidence=0.85,
            indicators=self._get_fluency_indicators(assessment_data),
            recommendations=self._get_fluency_recommendations(fluency_score)
        ))
        
        # Comprehension - based on gaze patterns
        comprehension_score = assessment_data.gaze_metrics.comprehension_indicator
        skill_assessments.append(SkillAssessment(
            category=ReadingSkillCategory.COMPREHENSION,
            score=comprehension_score,
            difficulty_level=self._score_to_difficulty(comprehension_score),
            confidence=0.7,
            indicators=self._get_comprehension_indicators(assessment_data),
            recommendations=self._get_comprehension_recommendations(comprehension_score)
        ))
        
        # Attention - based on fixation patterns and regressions
        attention_score = self._calculate_attention_score(assessment_data)
        skill_assessments.append(SkillAssessment(
            category=ReadingSkillCategory.ATTENTION,
            score=attention_score,
            difficulty_level=self._score_to_difficulty(attention_score),
            confidence=0.75,
            indicators=self._get_attention_indicators(assessment_data),
            recommendations=self._get_attention_recommendations(attention_score)
        ))
        
        return skill_assessments
    
    def _calculate_decoding_score(self, data: AssessmentInput) -> float:
        """Calculate word decoding/recognition score"""
        # Combine speech accuracy and gaze patterns
        speech_accuracy = data.speech_fluency_metrics.accuracy
        gaze_skip_rate = data.gaze_metrics.words_skipped / max(data.gaze_metrics.total_words, 1)
        
        # Lower skip rate and higher speech accuracy = better decoding
        score = (speech_accuracy * 0.7 + (1 - gaze_skip_rate) * 0.3)
        return min(1.0, max(0.0, score))
    
    def _calculate_fluency_score(self, data: AssessmentInput) -> float:
        """Calculate reading fluency score"""
        return data.speech_fluency_metrics.overall_fluency_score
    
    def _calculate_attention_score(self, data: AssessmentInput) -> float:
        """Calculate attention/focus score"""
        # Lower regression rate = better attention
        regression_factor = 1 - (data.gaze_metrics.regression_rate / 100)
        
        # Fewer hesitations = better attention
        hesitation_rate = data.speech_fluency_metrics.hesitation_count / max(data.speech_fluency_metrics.total_words, 1)
        hesitation_factor = 1 - min(1.0, hesitation_rate * 2)
        
        score = (regression_factor * 0.6 + hesitation_factor * 0.4)
        return min(1.0, max(0.0, score))
    
    def _score_to_difficulty(self, score: float) -> DifficultyLevel:
        """Convert score to difficulty level"""
        if score >= 0.8:
            return DifficultyLevel.NONE
        elif score >= 0.6:
            return DifficultyLevel.MILD
        elif score >= 0.4:
            return DifficultyLevel.MODERATE
        else:
            return DifficultyLevel.SEVERE
    
    def _identify_difficult_words(self, data: AssessmentInput) -> List[DifficultWord]:
        """Identify words that caused difficulty"""
        difficult_words = []
        
        # Combine gaze and speech data for each word
        for word_gaze in data.word_gaze_data:
            # Find corresponding pronunciation
            pronunciation = next(
                (p for p in data.pronunciation_assessments if p.expected_word.lower() == word_gaze.word.lower()),
                None
            )
            
            # Calculate difficulty score
            gaze_difficulty = (
                word_gaze.fixation_count * 0.3 +
                (word_gaze.total_duration / 1000) * 0.3 +  # Convert to seconds
                word_gaze.regression_count * 0.2 +
                (1 if word_gaze.skipped else 0) * 0.2
            )
            
            speech_difficulty = 0 if pronunciation is None else (1 - pronunciation.accuracy)
            
            combined_difficulty = (gaze_difficulty * 0.5 + speech_difficulty * 0.5)
            
            # Identify issues
            issues = []
            if word_gaze.fixation_count > 3:
                issues.append("High fixation count")
            if word_gaze.regression_count > 0:
                issues.append("Regression detected")
            if pronunciation and pronunciation.is_mispronounced:
                issues.append("Mispronounced")
            if pronunciation and pronunciation.is_omitted:
                issues.append("Omitted")
            if word_gaze.skipped:
                issues.append("Skipped during reading")
            
            if combined_difficulty > 0.3 or len(issues) > 0:
                difficult_words.append(DifficultWord(
                    word=word_gaze.word,
                    index=word_gaze.index,
                    gaze_fixations=word_gaze.fixation_count,
                    gaze_duration=word_gaze.total_duration,
                    pronunciation_accuracy=pronunciation.accuracy if pronunciation else 0.0,
                    difficulty_score=combined_difficulty,
                    issues=issues
                ))
        
        # Sort by difficulty score
        difficult_words.sort(key=lambda x: x.difficulty_score, reverse=True)
        
        return difficult_words
    
    def _analyze_strengths_weaknesses(
        self,
        skill_assessments: List[SkillAssessment]
    ) -> Tuple[List[str], List[str]]:
        """Analyze strengths and weaknesses"""
        strengths = []
        weaknesses = []
        
        for skill in skill_assessments:
            if skill.score >= 0.75:
                strengths.append(f"{skill.category.value.title()}: {skill.score:.0%} accuracy")
            elif skill.score < 0.5:
                weaknesses.append(f"{skill.category.value.title()}: Needs improvement ({skill.score:.0%})")
        
        if not strengths:
            strengths.append("Menunjukkan usaha yang baik dalam menyelesaikan assessment")
        
        return strengths, weaknesses
    
    def _get_decoding_indicators(self, data: AssessmentInput) -> List[str]:
        """Get indicators for decoding skill"""
        indicators = []
        accuracy = data.speech_fluency_metrics.accuracy
        
        if accuracy >= 0.9:
            indicators.append("Excellent word recognition")
        elif accuracy >= 0.75:
            indicators.append("Good word recognition with minor errors")
        else:
            indicators.append("Struggles with word recognition")
        
        if data.speech_fluency_metrics.omitted_words > 5:
            indicators.append(f"Omitted {data.speech_fluency_metrics.omitted_words} words")
        
        return indicators
    
    def _get_fluency_indicators(self, data: AssessmentInput) -> List[str]:
        """Get indicators for fluency skill"""
        indicators = []
        wpm = data.speech_fluency_metrics.words_per_minute
        
        if wpm >= 120:
            indicators.append("Reading speed above average")
        elif wpm >= 80:
            indicators.append("Reading speed within normal range")
        else:
            indicators.append("Reading speed below expected level")
        
        if data.speech_fluency_metrics.prosody.prosody_score < 0.5:
            indicators.append("Limited expression in reading")
        
        return indicators
    
    def _get_comprehension_indicators(self, data: AssessmentInput) -> List[str]:
        """Get indicators for comprehension skill"""
        indicators = []
        comp_score = data.gaze_metrics.comprehension_indicator
        
        if comp_score >= 0.7:
            indicators.append("Good reading comprehension patterns")
        else:
            indicators.append("May struggle with comprehension")
        
        if data.gaze_metrics.regression_rate > 20:
            indicators.append("High regression rate may indicate comprehension difficulties")
        
        return indicators
    
    def _get_attention_indicators(self, data: AssessmentInput) -> List[str]:
        """Get indicators for attention skill"""
        indicators = []
        
        if data.gaze_metrics.regression_rate < 10:
            indicators.append("Maintains good focus while reading")
        elif data.gaze_metrics.regression_rate > 20:
            indicators.append("Frequent re-reading suggests attention challenges")
        
        if data.speech_fluency_metrics.hesitation_count > 10:
            indicators.append("Multiple hesitations during reading")
        
        return indicators
    
    def _get_decoding_recommendations(self, score: float) -> List[str]:
        """Get recommendations for decoding skill"""
        if score >= 0.75:
            return ["Continue building vocabulary through reading"]
        elif score >= 0.5:
            return ["Practice with phonics-based activities", "Focus on sight word recognition"]
        else:
            return [
                "Intensive phonics instruction needed",
                "Work with word families and patterns",
                "One-on-one reading support recommended"
            ]
    
    def _get_fluency_recommendations(self, score: float) -> List[str]:
        """Get recommendations for fluency skill"""
        if score >= 0.75:
            return ["Encourage expressive reading practice"]
        elif score >= 0.5:
            return ["Repeated reading of familiar texts", "Model fluent reading"]
        else:
            return [
                "Focus on reading speed and accuracy",
                "Practice with audio-assisted reading",
                "Work on prosody and expression"
            ]
    
    def _get_comprehension_recommendations(self, score: float) -> List[str]:
        """Get recommendations for comprehension skill"""
        if score >= 0.7:
            return ["Challenge with more complex texts"]
        elif score >= 0.5:
            return ["Practice comprehension strategies", "Summarization activities"]
        else:
            return [
                "Pre-reading vocabulary instruction",
                "Guided reading with comprehension checks",
                "Visual organizers and graphic aids"
            ]
    
    def _get_attention_recommendations(self, score: float) -> List[str]:
        """Get recommendations for attention skill"""
        if score >= 0.75:
            return ["Maintain current reading habits"]
        else:
            return [
                "Shorter reading sessions with breaks",
                "Minimize distractions during reading",
                "Use tracking tools (finger, bookmark)"
            ]
    
    def _generate_immediate_interventions(
        self,
        difficulty: DifficultyLevel,
        skill_assessments: List[SkillAssessment],
        data: AssessmentInput
    ) -> List[str]:
        """Generate immediate intervention recommendations"""
        interventions = []
        
        if difficulty == DifficultyLevel.SEVERE:
            interventions.append("Rujuk ke spesialis kesulitan belajar membaca")
            interventions.append("Asesmen diagnostik mendalam diperlukan")
        
        # Skill-specific interventions
        for skill in skill_assessments:
            if skill.difficulty_level in [DifficultyLevel.MODERATE, DifficultyLevel.SEVERE]:
                interventions.extend(skill.recommendations[:2])
        
        return list(set(interventions))[:5]  # Top 5 unique
    
    def _generate_long_term_recommendations(
        self,
        difficulty: DifficultyLevel,
        skill_assessments: List[SkillAssessment]
    ) -> List[str]:
        """Generate long-term recommendations"""
        recommendations = []
        
        recommendations.append("Regular reading practice (15-20 menit per hari)")
        recommendations.append("Progress monitoring setiap 2-3 bulan")
        
        if difficulty != DifficultyLevel.NONE:
            recommendations.append("Kolaborasi guru-orang tua untuk dukungan membaca")
        
        return recommendations
    
    def _recommend_materials(
        self,
        difficulty: DifficultyLevel,
        skill_assessments: List[SkillAssessment]
    ) -> List[Dict]:
        """Recommend appropriate reading materials"""
        materials = []
        
        # Difficulty-based recommendations
        if difficulty == DifficultyLevel.NONE:
            materials.append({
                "type": "text",
                "level": "grade_appropriate",
                "description": "Teks sesuai tingkat kelas"
            })
        elif difficulty == DifficultyLevel.MILD:
            materials.append({
                "type": "text",
                "level": "slightly_below",
                "description": "Teks sedikit di bawah tingkat kelas untuk membangun kepercayaan diri"
            })
        else:
            materials.append({
                "type": "text",
                "level": "below",
                "description": "Teks di bawah tingkat kelas dengan dukungan visual"
            })
        
        # Skill-specific materials
        for skill in skill_assessments:
            if skill.category == ReadingSkillCategory.DECODING and skill.score < 0.6:
                materials.append({
                    "type": "phonics",
                    "description": "Materi phonics dan word families"
                })
        
        return materials
