"""Exercise and physical activity recommendation endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.database import db
from app.recommendations.exercise import generate_exercise_recommendations
from app.utils.security import get_optional_user

router = APIRouter(prefix="/exercise", tags=["Exercise Recommendations"])

@router.get("/recommendations")
async def get_exercise_recommendations(prediction_id: Optional[str] = Query(None), current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest"
    risk_cat = "MODERATE"
    profile_dict = {}

    if prediction_id:
        pred = await db.find_one("predictions", {"_id": prediction_id})
        if pred:
            risk_cat = pred.get("risk_category", "MODERATE")
            profile_dict = pred.get("input_profile", {})

    if not profile_dict and user_id != "guest":
        user_prof = await db.find_one("profiles", {"user_id": user_id})
        if user_prof:
            profile_dict = user_prof

    if not profile_dict:
        profile_dict = {
            "systolic_bp": 130,
            "diastolic_bp": 84,
            "physical_activity": "moderate",
            "age": 48
        }

    return generate_exercise_recommendations(profile_dict, risk_cat)