"""Lifestyle risk scoring endpoints."""
from fastapi import APIRouter, Depends
from app.database import db
from app.recommendations.lifestyle import calculate_lifestyle_score
from app.schemas.lifestyle import LifestyleScoreResponse
from app.schemas.profile import HealthProfileInput
from app.utils.security import get_optional_user

router = APIRouter(prefix="/lifestyle", tags=["Lifestyle Risk Score"])

@router.get("/score", response_model=LifestyleScoreResponse)
async def get_lifestyle_score(current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest"
    profile = {}
    logged_diet_score = None

    if user_id != "guest":
        user_prof = await db.find_one("profiles", {"user_id": user_id})
        if user_prof:
            profile = user_prof

        recent_meal = await db.find_one("meal_logs", {"user_id": user_id})
        if recent_meal:
            logged_diet_score = recent_meal.get("diet_score")

    if not profile:
        profile = {
            "diet_preference": "vegetarian",
            "physical_activity": "moderate",
            "sleep_duration": 7.2,
            "smoking_status": "never",
            "stress_level": 3,
            "bmi": 24.5
        }

    score_res = calculate_lifestyle_score(profile, logged_diet_score)
    return LifestyleScoreResponse(**score_res)

@router.post("/score", response_model=LifestyleScoreResponse)
async def calculate_custom_lifestyle_score(profile_in: HealthProfileInput):
    profile_dict = profile_in.model_dump()
    profile_dict["bmi"] = profile_in.calculate_bmi()
    score_res = calculate_lifestyle_score(profile_dict)
    return LifestyleScoreResponse(**score_res)

@router.get("/care-plan")
async def get_lifestyle_care_plan(current_user: dict = Depends(get_optional_user)):
    from app.services.health_plan_service import health_plan_service
    user_id = str(current_user["_id"]) if current_user else "guest"
    return await health_plan_service.get_or_create_daily_plan(user_id=user_id)