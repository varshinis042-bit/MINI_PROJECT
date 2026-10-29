"""Explainable AI endpoints providing SHAP feature attributions for risk predictions."""
from pathlib import Path
import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from app.config import settings
from app.database import db
from app.ml.explain import explain_prediction
from app.schemas.explain import ShapExplanationResponse

router = APIRouter(prefix="/explain", tags=["Explainable AI"])

_explainer_cache = None

def get_explainer_and_preprocessor():
    global _explainer_cache
    if _explainer_cache is not None:
        return _explainer_cache

    explainer_path = Path(settings.SAVED_MODELS_DIR) / "shap_explainer.joblib"
    pipeline_path = Path(settings.SAVED_MODELS_DIR) / "cardiovascular_stacking_pipeline.joblib"

    if not explainer_path.exists() or not pipeline_path.exists():
        return None, None

    exp_data = joblib.load(explainer_path)
    pipe_data = joblib.load(pipeline_path)

    _explainer_cache = (exp_data["explainer"], pipe_data["preprocessor"])
    return _explainer_cache

@router.get("/{prediction_id}", response_model=ShapExplanationResponse)
async def get_shap_explanation(prediction_id: str):
    pred = await db.find_one("predictions", {"_id": prediction_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    profile_dict = pred.get("input_profile")
    if not profile_dict:
        raise HTTPException(status_code=400, detail="Prediction record lacks patient input profile.")

    explainer, preprocessor = get_explainer_and_preprocessor()
    if explainer is None:
        raise HTTPException(
            status_code=503,
            detail="SHAP explainer model is not available. Please train the ML pipeline first."
        )

    df_single = pd.DataFrame([profile_dict])
    try:
        explanation = explain_prediction(explainer, preprocessor, df_single)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing SHAP attributions: {str(e)}")

    return ShapExplanationResponse(
        prediction_id=prediction_id,
        base_value=explanation["base_value"],
        final_output=pred.get("risk_percentage", 50.0),
        features=explanation["features"],
        top_positive_contributors=explanation["top_positive_contributors"],
        top_negative_contributors=explanation["top_negative_contributors"],
        summary=explanation["summary"]
    )