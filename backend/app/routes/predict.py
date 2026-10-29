"""Cardiovascular risk prediction endpoints using Stacking Ensemble."""
from fastapi import APIRouter, Depends, HTTPException
from app.database import db
from app.ml.predict import prediction_service
from app.schemas.prediction import PredictionResponse
from app.schemas.profile import HealthProfileInput
from app.utils.security import get_optional_user

router = APIRouter(prefix="/predict", tags=["Risk Prediction"])

@router.post("", response_model=PredictionResponse)
async def predict_cardiovascular_risk(profile_in: HealthProfileInput, current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest"
    data = profile_in.model_dump()
    data["bmi"] = profile_in.calculate_bmi()

    try:
        result = prediction_service.predict_risk(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML prediction error: {str(e)}")

    pred_doc = {
        "user_id": user_id,
        "input_profile": data,
        **result
    }
    pred_id = await db.insert_one("predictions", pred_doc)
    pred_doc["prediction_id"] = pred_id

    # Automatically save progress record if user is logged in
    if user_id != "guest":
        progress_doc = {
            "user_id": user_id,
            "prediction_id": pred_id,
            "risk_percentage": result["risk_percentage"],
            "risk_category": result["risk_category"],
            "systolic_bp": data.get("systolic_bp"),
            "diastolic_bp": data.get("diastolic_bp"),
            "cholesterol": data.get("cholesterol"),
            "weight_kg": data.get("weight_kg"),
            "bmi": data.get("bmi")
        }
        await db.insert_one("progress_records", progress_doc)

    return PredictionResponse(
        prediction_id=pred_id,
        input_profile=profile_in,
        created_at=pred_doc.get("created_at"),
        **result
    )

@router.get("/history", response_model=list)
async def get_prediction_history(current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest"
    preds = await db.find_many("predictions", {"user_id": user_id}, sort_field="created_at", descending=True, limit=20)
    for p in preds:
        p["prediction_id"] = str(p.get("_id", ""))
    return preds

@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction_by_id(prediction_id: str):
    pred = await db.find_one("predictions", {"_id": prediction_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    pred["prediction_id"] = str(pred.get("_id", prediction_id))
    input_profile = pred.get("input_profile", {})
    return PredictionResponse(
        prediction_id=pred["prediction_id"],
        risk_probability=pred.get("risk_probability", 0.5),
        risk_percentage=pred.get("risk_percentage", 50.0),
        risk_category=pred.get("risk_category", "MODERATE"),
        model_confidence=pred.get("model_confidence", "Moderate"),
        uncertainty_score=pred.get("uncertainty_score", 0.25),
        uncertainty_message=pred.get("uncertainty_message", ""),
        major_risk_factors=pred.get("major_risk_factors", []),
        protective_factors=pred.get("protective_factors", []),
        base_model_predictions=pred.get("base_model_predictions", {}),
        input_profile=HealthProfileInput(**input_profile),
        created_at=pred.get("created_at")
    )