"""
Training API Router
Endpoints for model training and evaluation
"""

from fastapi import APIRouter, HTTPException
from loguru import logger

router = APIRouter()


@router.get("/status")
async def training_status():
    """Get training service status"""
    return {
        "status": "available",
        "service": "training",
        "message": "Training service is ready"
    }
