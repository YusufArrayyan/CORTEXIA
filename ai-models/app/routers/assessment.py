"""
Assessment API Router
Endpoints for reading difficulty assessment
"""

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse
from loguru import logger
import json
import random

router = APIRouter()


@router.get("/health")
async def health_check():
    """Check assessment service health"""
    return {
        "status": "healthy",
        "service": "assessment",
    }


@router.post("/analyze")
async def analyze_multimodal(
    audio: UploadFile = File(...),
    gaze_data: str = Form(...),
    text_id: str = Form(...)
):
    """
    Analyze reading performance using multimodal data (audio + gaze).
    This is a simplified version that accepts form data instead of JSON.
    """
    try:
        logger.info(f"Received multimodal assessment for text_id: {text_id}")
        
        # Parse gaze data
        gaze_points = json.loads(gaze_data)
        logger.info(f"Gaze data points: {len(gaze_points)}")
        
        # Read audio file
        audio_content = await audio.read()
        logger.info(f"Audio file size: {len(audio_content)} bytes")
        
        # TODO: Implement actual AI analysis
        # For now, return mock results based on simple heuristics
        
        # Analyze gaze patterns (simple heuristic)
        avg_fixation = len(gaze_points) / max((gaze_points[-1]['timestamp'] - gaze_points[0]['timestamp']) / 1000, 1) if gaze_points else 0
        
        # Determine difficulty level based on simple rules
        if avg_fixation > 5:
            difficulty = "EASY"
            confidence = 0.85
            comprehension = random.randint(80, 95)
            fluency = random.randint(85, 95)
        elif avg_fixation > 3:
            difficulty = "MEDIUM"
            confidence = 0.75
            comprehension = random.randint(60, 80)
            fluency = random.randint(65, 85)
        else:
            difficulty = "HARD"
            confidence = 0.70
            comprehension = random.randint(40, 65)
            fluency = random.randint(45, 70)
        
        # Calculate reading speed (words per minute estimate)
        reading_speed = int(avg_fixation * 60)
        
        # Generate recommendations
        recommendations = []
        if difficulty == "HARD":
            recommendations = [
                "Fokus pada latihan membaca kata-kata sederhana",
                "Gunakan buku dengan gambar lebih banyak",
                "Praktik membaca 15 menit setiap hari"
            ]
        elif difficulty == "MEDIUM":
            recommendations = [
                "Tingkatkan kosakata dengan membaca lebih banyak",
                "Coba buku dengan tingkat kesulitan lebih tinggi",
                "Diskusikan isi bacaan untuk meningkatkan pemahaman"
            ]
        else:
            recommendations = [
                "Pertahankan kebiasaan membaca yang baik",
                "Tantang diri dengan buku yang lebih kompleks",
                "Berbagi cerita dengan teman untuk meningkatkan ekspresi"
            ]
        
        result = {
            "success": True,
            "difficulty_level": difficulty,
            "confidence_score": confidence,
            "reading_speed": reading_speed,
            "comprehension_score": comprehension,
            "fluency_score": fluency,
            "recommendations": recommendations,
            "analysis": {
                "gaze_fixations": len(gaze_points),
                "average_fixation_rate": round(avg_fixation, 2),
                "audio_duration": len(audio_content),
            }
        }
        
        logger.info(f"✅ Analysis completed: {difficulty} (confidence: {confidence})")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid gaze data JSON: {e}")
        raise HTTPException(status_code=400, detail="Invalid gaze data format")
    except Exception as e:
        logger.error(f"❌ Assessment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
