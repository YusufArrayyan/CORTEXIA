"""
CORTEXIA AI Assessment Engine
Main FastAPI application entry point
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.config import settings
from app.routers import assessment, prediction, training
from app.models.ml_models import ModelManager

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)
logger.add(
    settings.LOG_FILE,
    rotation="1 day",
    retention="30 days",
    level=settings.LOG_LEVEL
)

# Global model manager
model_manager = ModelManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Starting CORTEXIA AI Assessment Engine...")
    
    try:
        # Load ML models
        await model_manager.load_models()
        logger.info("✅ ML models loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load ML models: {e}")
        logger.warning("⚠️ Running without pre-trained models")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down CORTEXIA AI Assessment Engine...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered reading difficulty assessment engine using multimodal analysis",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(assessment.router, prefix="/api/assessment", tags=["Assessment"])
app.include_router(prediction.router, prefix="/api/prediction", tags=["Prediction"])
app.include_router(training.router, prefix="/api/training", tags=["Training"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "models_loaded": model_manager.is_loaded()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models": {
            "gaze": model_manager.gaze_model is not None,
            "speech": model_manager.speech_model is not None,
            "multimodal": model_manager.multimodal_model is not None
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
