"""
Configuration settings for AI Assessment Engine
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "CORTEXIA AI Assessment Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5000"
    ]
    
    # Database
    DATABASE_URL: str = "postgresql://cortexia_user:cortexia_password@localhost:5432/cortexia_db"
    MONGODB_URL: str = "mongodb://localhost:27017/cortexia_analytics"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Model Paths
    MODEL_DIR: str = "./models"
    GAZE_MODEL_PATH: str = "./models/gaze_classifier.joblib"
    SPEECH_MODEL_PATH: str = "./models/speech_classifier.joblib"
    MULTIMODAL_MODEL_PATH: str = "./models/multimodal_classifier.joblib"
    SCALER_PATH: str = "./models/scaler.joblib"
    
    # Model Configuration
    CONFIDENCE_THRESHOLD: float = 0.7
    MIN_GAZE_POINTS: int = 100
    MIN_SPEECH_DURATION: int = 10  # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/ai_engine.log"
    
    # Backend API
    BACKEND_API_URL: str = "http://localhost:5000/api"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Create directories if they don't exist
os.makedirs(settings.MODEL_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
