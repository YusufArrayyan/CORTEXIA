"""
Machine Learning Models for Reading Difficulty Assessment
"""

import numpy as np
import joblib
from pathlib import Path
from typing import Dict, Optional, Tuple, List
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from loguru import logger

from app.config import settings
from app.schemas.assessment import DifficultyLevel


class ModelManager:
    """
    Manages ML models for reading difficulty assessment.
    Handles model loading, saving, and prediction.
    """
    
    def __init__(self):
        """Initialize model manager"""
        self.gaze_model: Optional[RandomForestClassifier] = None
        self.speech_model: Optional[RandomForestClassifier] = None
        self.multimodal_model: Optional[GradientBoostingClassifier] = None
        self.scaler: Optional[StandardScaler] = None
        
        self.difficulty_labels = [
            DifficultyLevel.NONE,
            DifficultyLevel.MILD,
            DifficultyLevel.MODERATE,
            DifficultyLevel.SEVERE
        ]
        
        logger.info("ModelManager initialized")
    
    async def load_models(self) -> None:
        """Load pre-trained models from disk"""
        try:
            # Load gaze model
            if Path(settings.GAZE_MODEL_PATH).exists():
                self.gaze_model = joblib.load(settings.GAZE_MODEL_PATH)
                logger.info(f"✅ Loaded gaze model from {settings.GAZE_MODEL_PATH}")
            else:
                logger.warning(f"⚠️ Gaze model not found at {settings.GAZE_MODEL_PATH}")
            
            # Load speech model
            if Path(settings.SPEECH_MODEL_PATH).exists():
                self.speech_model = joblib.load(settings.SPEECH_MODEL_PATH)
                logger.info(f"✅ Loaded speech model from {settings.SPEECH_MODEL_PATH}")
            else:
                logger.warning(f"⚠️ Speech model not found at {settings.SPEECH_MODEL_PATH}")
            
            # Load multimodal model
            if Path(settings.MULTIMODAL_MODEL_PATH).exists():
                self.multimodal_model = joblib.load(settings.MULTIMODAL_MODEL_PATH)
                logger.info(f"✅ Loaded multimodal model from {settings.MULTIMODAL_MODEL_PATH}")
            else:
                logger.warning(f"⚠️ Multimodal model not found at {settings.MULTIMODAL_MODEL_PATH}")
            
            # Load scaler
            if Path(settings.SCALER_PATH).exists():
                self.scaler = joblib.load(settings.SCALER_PATH)
                logger.info(f"✅ Loaded scaler from {settings.SCALER_PATH}")
            else:
                logger.warning(f"⚠️ Scaler not found at {settings.SCALER_PATH}")
            
            # Create default models if none exist
            if not self.is_loaded():
                logger.info("Creating default models...")
                self.create_default_models()
                
        except Exception as e:
            logger.error(f"❌ Failed to load models: {e}")
            raise
    
    def create_default_models(self) -> None:
        """Create default untrained models"""
        self.gaze_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        
        self.speech_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        
        self.multimodal_model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        
        self.scaler = StandardScaler()
        
        logger.info("✅ Created default models")
    
    def is_loaded(self) -> bool:
        """Check if models are loaded"""
        return (
            self.gaze_model is not None and
            self.speech_model is not None and
            self.multimodal_model is not None and
            self.scaler is not None
        )
    
    def predict_difficulty(
        self,
        features: np.ndarray,
        model_type: str = "multimodal"
    ) -> Tuple[DifficultyLevel, float, Dict[str, float]]:
        """
        Predict reading difficulty level
        
        Args:
            features: Feature vector
            model_type: Type of model to use ('gaze', 'speech', 'multimodal')
            
        Returns:
            Tuple of (difficulty_level, confidence, probabilities_dict)
        """
        # Select model
        if model_type == "gaze":
            model = self.gaze_model
        elif model_type == "speech":
            model = self.speech_model
        else:
            model = self.multimodal_model
        
        if model is None:
            raise ValueError(f"Model '{model_type}' is not loaded")
        
        # Scale features
        if self.scaler is not None:
            features_scaled = self.scaler.transform(features.reshape(1, -1))
        else:
            features_scaled = features.reshape(1, -1)
        
        # Predict
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        
        # Convert to difficulty level
        difficulty_level = self.difficulty_labels[prediction]
        confidence = float(np.max(probabilities))
        
        # Create probabilities dict
        prob_dict = {
            label.value: float(prob)
            for label, prob in zip(self.difficulty_labels, probabilities)
        }
        
        logger.info(f"Predicted difficulty: {difficulty_level.value} (confidence: {confidence:.2f})")
        
        return difficulty_level, confidence, prob_dict
    
    def get_feature_importance(
        self,
        feature_names: List[str],
        model_type: str = "multimodal"
    ) -> Dict[str, float]:
        """Get feature importance scores"""
        # Select model
        if model_type == "gaze":
            model = self.gaze_model
        elif model_type == "speech":
            model = self.speech_model
        else:
            model = self.multimodal_model
        
        if model is None or not hasattr(model, 'feature_importances_'):
            return {}
        
        importance = model.feature_importances_
        
        # Sort by importance
        importance_dict = dict(zip(feature_names, importance))
        sorted_importance = dict(
            sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
        )
        
        return sorted_importance
    
    def train_model(
        self,
        X: np.ndarray,
        y: np.ndarray,
        model_type: str = "multimodal",
        save: bool = True
    ) -> Dict[str, any]:
        """
        Train a model
        
        Args:
            X: Feature matrix
            y: Target labels (0=none, 1=mild, 2=moderate, 3=severe)
            model_type: Type of model to train
            save: Whether to save the trained model
            
        Returns:
            Dictionary with training metrics
        """
        logger.info(f"Training {model_type} model with {len(X)} samples...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        if self.scaler is None:
            self.scaler = StandardScaler()
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Select and train model
        if model_type == "gaze":
            if self.gaze_model is None:
                self.gaze_model = RandomForestClassifier(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42,
                    class_weight='balanced'
                )
            model = self.gaze_model
            model_path = settings.GAZE_MODEL_PATH
        elif model_type == "speech":
            if self.speech_model is None:
                self.speech_model = RandomForestClassifier(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42,
                    class_weight='balanced'
                )
            model = self.speech_model
            model_path = settings.SPEECH_MODEL_PATH
        else:
            if self.multimodal_model is None:
                self.multimodal_model = GradientBoostingClassifier(
                    n_estimators=100,
                    max_depth=5,
                    learning_rate=0.1,
                    random_state=42
                )
            model = self.multimodal_model
            model_path = settings.MULTIMODAL_MODEL_PATH
        
        # Train
        import time
        start_time = time.time()
        model.fit(X_train_scaled, y_train)
        training_time = time.time() - start_time
        
        # Evaluate
        y_pred = model.predict(X_test_scaled)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        # Save model
        if save:
            joblib.dump(model, model_path)
            joblib.dump(self.scaler, settings.SCALER_PATH)
            logger.info(f"✅ Saved {model_type} model to {model_path}")
        
        logger.info(f"✅ Training complete. Accuracy: {accuracy:.4f}, F1: {f1:.4f}")
        
        return {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "confusion_matrix": conf_matrix.tolist(),
            "training_time": training_time,
            "model_path": str(model_path) if save else None
        }
