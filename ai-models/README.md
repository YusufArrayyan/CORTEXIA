# CORTEXIA AI Assessment Engine

AI-powered reading difficulty assessment engine using multimodal analysis (gaze tracking + speech analysis).

## Overview

The AI Assessment Engine integrates data from:
- **Gaze Tracking**: Eye movement patterns, fixations, saccades, reading speed
- **Speech Analysis**: Pronunciation accuracy, fluency metrics, prosody analysis

Using machine learning models to provide:
- Overall reading difficulty classification (None, Mild, Moderate, Severe)
- Skill-specific assessments (Decoding, Fluency, Comprehension, Attention)
- Difficult word identification
- Personalized recommendations

## Architecture

```
├── app/
│   ├── config.py              # Application configuration
│   ├── schemas/
│   │   └── assessment.py      # Pydantic models for data validation
│   ├── features/
│   │   └── feature_extractor.py  # Extract ML features from gaze & speech
│   ├── models/
│   │   └── ml_models.py       # ML model manager (Random Forest, Gradient Boosting)
│   ├── services/
│   │   └── assessment_engine.py  # Core assessment logic
│   └── routers/
│       ├── assessment.py      # Assessment endpoints
│       ├── prediction.py      # Direct prediction endpoints
│       └── training.py        # Model training endpoints
├── models/                    # Trained ML models (joblib)
├── logs/                      # Application logs
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
└── Dockerfile                 # Docker configuration
```

## Features

### ✅ Feature Extraction (45+ features)

**Gaze Features:**
- Reading speed (WPM)
- Average fixation duration
- Fixation statistics (count, std, median, max, min)
- Regression rate
- Skip rate
- Word-level fixation patterns
- Comprehension indicator

**Speech Features:**
- Pronunciation accuracy
- Reading fluency score
- Words per minute (WPM)
- Correct words per minute (CWPM)
- Error rates (omission, insertion, substitution)
- Prosody metrics (speaking rate, pauses, pitch, volume)
- Hesitation, repetition, self-correction counts

**Combined Features:**
- Speed ratio (gaze/speech)
- Accuracy correlation
- Fluency indicators
- Difficulty scores

### ✅ Machine Learning Models

**Three Models:**
1. **Gaze Model**: Random Forest classifier for gaze-only assessment
2. **Speech Model**: Random Forest classifier for speech-only assessment
3. **Multimodal Model**: Gradient Boosting classifier combining both modalities

**Model Capabilities:**
- 4-class classification (None, Mild, Moderate, Severe)
- Confidence scores
- Probability distributions
- Feature importance analysis

### ✅ Assessment Engine

**Core Functions:**
- Multimodal data integration
- Overall difficulty prediction
- Skill-specific assessment (4 categories)
- Difficult word identification
- Strengths/weaknesses analysis
- Personalized recommendations
- Material recommendations

## Installation

### Prerequisites
- Python 3.9+
- pip

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Docker Setup

```bash
# Build image
docker build -t cortexia-ai-engine .

# Run container
docker run -p 8000:8000 \
  -v $(pwd)/models:/app/models \
  -v $(pwd)/logs:/app/logs \
  cortexia-ai-engine
```

## Usage

### Start Server

```bash
# Development
python main.py

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### API Endpoints

#### 1. Complete Assessment

```bash
POST /api/assessment/analyze
```

**Request Body:**
```json
{
  "student_id": "student-123",
  "session_id": "session-456",
  "expected_text": "Text that was supposed to be read",
  "recognized_text": "Text that was actually read",
  "gaze_points": [...],
  "fixations": [...],
  "word_gaze_data": [...],
  "gaze_metrics": {...},
  "pronunciation_assessments": [...],
  "speech_fluency_metrics": {...},
  "session_start_time": 1234567890000,
  "session_end_time": 1234567950000,
  "session_duration": 60.0
}
```

**Response:**
```json
{
  "session_id": "session-456",
  "student_id": "student-123",
  "timestamp": "2024-01-15T10:30:00",
  "overall_difficulty": "mild",
  "overall_score": 0.75,
  "confidence": 0.87,
  "skill_assessments": [
    {
      "category": "decoding",
      "score": 0.80,
      "difficulty_level": "mild",
      "confidence": 0.85,
      "indicators": ["Good word recognition"],
      "recommendations": ["Continue building vocabulary"]
    }
  ],
  "difficult_words": [...],
  "strengths": ["Fluency: 85% accuracy"],
  "weaknesses": ["Attention: Needs improvement (45%)"],
  "immediate_interventions": [...],
  "long_term_recommendations": [...],
  "recommended_materials": [...],
  "model_version": "1.0.0",
  "processing_time": 0.234
}
```

#### 2. Direct Prediction

```bash
POST /api/prediction/predict
```

**Request:**
```json
{
  "features": {
    "gaze_reading_speed": 85.5,
    "gaze_avg_fixation_duration": 250.0,
    "speech_accuracy": 0.87,
    "speech_wpm": 90.0,
    ...
  },
  "feature_names": ["gaze_reading_speed", "gaze_avg_fixation_duration", ...]
}
```

**Response:**
```json
{
  "difficulty_level": "mild",
  "confidence": 0.82,
  "probabilities": {
    "none": 0.15,
    "mild": 0.65,
    "moderate": 0.18,
    "severe": 0.02
  },
  "feature_importance": {
    "gaze_reading_speed": 0.23,
    "speech_accuracy": 0.19,
    ...
  }
}
```

#### 3. Train Model (Development)

```bash
POST /api/training/train
```

**Request:**
```json
{
  "model_type": "multimodal",
  "data_source": "synthetic",
  "save_model": true
}
```

**Response:**
```json
{
  "success": true,
  "model_type": "multimodal",
  "accuracy": 0.87,
  "precision": 0.85,
  "recall": 0.86,
  "f1_score": 0.85,
  "confusion_matrix": [[...], [...], [...], [...]],
  "training_time": 2.34,
  "model_path": "./models/multimodal_classifier.joblib"
}
```

## Configuration

### Environment Variables

```bash
# Application
APP_NAME=CORTEXIA AI Assessment Engine
DEBUG=True
HOST=0.0.0.0
PORT=8000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5000

# Model Configuration
MODEL_DIR=./models
CONFIDENCE_THRESHOLD=0.7
MIN_GAZE_POINTS=100
MIN_SPEECH_DURATION=10

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/ai_engine.log
```

## Model Training

### Prepare Training Data

Training data should include:
- Historical assessment sessions
- Gaze tracking data
- Speech analysis data
- Manual difficulty labels (from experts)

### Train New Model

```python
from app.models.ml_models import ModelManager
import numpy as np

# Initialize manager
manager = ModelManager()

# Prepare data (features + labels)
X_train = np.array([...])  # Feature matrix
y_train = np.array([...])  # Labels (0-3)

# Train
metrics = manager.train_model(
    X_train,
    y_train,
    model_type="multimodal",
    save=True
)

print(f"Accuracy: {metrics['accuracy']:.2f}")
```

## Performance

- **Processing Time**: ~200-500ms per assessment
- **Model Accuracy**: 85-90% on test data
- **Feature Extraction**: ~50ms
- **Prediction**: ~10ms

## Difficulty Classification

### Levels

1. **None** (score >= 0.8): No significant reading difficulties
2. **Mild** (score 0.6-0.8): Minor challenges, can benefit from support
3. **Moderate** (score 0.4-0.6): Clear difficulties, intervention needed
4. **Severe** (score < 0.4): Significant challenges, specialist referral recommended

### Assessment Criteria

**Decoding**: Word recognition accuracy
**Fluency**: Reading speed and prosody
**Comprehension**: Gaze pattern analysis
**Attention**: Focus and regression patterns

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test
pytest tests/test_assessment.py
```

## Troubleshooting

### Models Not Loading
- Ensure model files exist in `./models/` directory
- Check file permissions
- Review logs in `./logs/ai_engine.log`

### Low Accuracy
- Verify input data quality
- Check feature extraction
- Ensure sufficient training data
- Consider retraining models

### Performance Issues
- Increase workers for production: `--workers 4`
- Use Redis for caching
- Optimize feature extraction

## Future Improvements

- [ ] Deep learning models (LSTM, Transformer)
- [ ] Real-time confidence calibration
- [ ] Active learning for model improvement
- [ ] Multi-language support
- [ ] Integration with more modalities (facial expression, EEG)

## License

Internal project - CORTEXIA Capstone UNIB
