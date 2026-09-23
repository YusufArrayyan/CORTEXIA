"""
Prediction API Router
Endpoints for ML model predictions
"""

from fastapi import APIRouter, HTTPException
from loguru import logger

router = APIRouter()


@router.get("/status")
async def prediction_status():
    """Get prediction service status"""
    return {
        "status": "available",
        "service": "prediction",
        "message": "Prediction service is ready"
    }
