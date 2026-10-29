"""Model diagnostics, academic benchmarks, and demographic fairness analysis endpoints."""
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.config import settings

router = APIRouter(prefix="/model", tags=["Model Performance & Fairness"])

@router.get("/metrics")
async def get_model_metrics():
    metrics_path = Path(settings.SAVED_MODELS_DIR) / "model_metrics.json"
    if not metrics_path.exists():
        raise HTTPException(
            status_code=503,
            detail="Model metrics not found. Please train the ML pipeline first via `python -m app.ml.train`."
        )

    with open(metrics_path, "r") as f:
        data = json.load(f)
    return data

@router.get("/fairness")
async def get_fairness_analysis():
    metrics_path = Path(settings.SAVED_MODELS_DIR) / "model_metrics.json"
    if not metrics_path.exists():
        raise HTTPException(status_code=503, detail="Model metrics not found.")

    with open(metrics_path, "r") as f:
        data = json.load(f)
    return data.get("fairness_analysis", {})