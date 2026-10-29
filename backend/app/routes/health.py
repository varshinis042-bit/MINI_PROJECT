"""System health check endpoint."""
from pathlib import Path
from fastapi import APIRouter
from app.config import settings
from app.database import db

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    model_exists = (Path(settings.SAVED_MODELS_DIR) / "cardiovascular_stacking_pipeline.joblib").exists()
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "database_mode": db.mode,
        "models_trained": model_exists,
        "environment": settings.ENVIRONMENT
    }