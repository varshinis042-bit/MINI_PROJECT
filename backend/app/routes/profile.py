"""User health profile management endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from app.database import db
from app.schemas.profile import HealthProfileInput, HealthProfileResponse
from app.utils.security import get_current_user, get_optional_user

router = APIRouter(prefix="/profile", tags=["User Profile"])

DEFAULT_BASELINE_PROFILE = {
    "age": 48,
    "sex": "male",
    "height_cm": 172.0,
    "weight_kg": 76.0,
    "bmi": 25.7,
    "systolic_bp": 134,
    "diastolic_bp": 86,
    "cholesterol": 215,
    "blood_glucose": 105,
    "resting_hr": 74,
    "smoking_status": "former",
    "diabetes_status": "no",
    "family_history": True,
    "physical_activity": "moderate",
    "sleep_duration": 6.8,
    "stress_level": 3,
    "alcohol_status": "occasional",
    "diet_preference": "vegetarian",
    "allergies": []
}

@router.get("", response_model=HealthProfileResponse)
async def get_profile(current_user: dict = Depends(get_optional_user)):
    if not current_user:
        # Return default demonstration baseline for unauthenticated / guest demo access
        return HealthProfileResponse(**DEFAULT_BASELINE_PROFILE, id="demo_profile", user_id="guest")

    user_id = str(current_user["_id"])
    profile = await db.find_one("profiles", {"user_id": user_id})
    if not profile:
        profile_data = {**DEFAULT_BASELINE_PROFILE, "user_id": user_id}
        pid = await db.insert_one("profiles", profile_data)
        profile_data["_id"] = pid
        profile = profile_data

    return HealthProfileResponse(
        id=str(profile.get("_id", "")),
        user_id=str(profile.get("user_id", "")),
        updated_at=profile.get("updated_at"),
        **{k: v for k, v in profile.items() if k not in ["_id", "user_id", "updated_at"]}
    )

@router.put("", response_model=HealthProfileResponse)
async def update_profile(profile_in: HealthProfileInput, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    data = profile_in.model_dump()
    data["bmi"] = profile_in.calculate_bmi()

    await db.update_one("profiles", {"user_id": user_id}, data, upsert=True)
    profile = await db.find_one("profiles", {"user_id": user_id})

    return HealthProfileResponse(
        id=str(profile.get("_id", "")),
        user_id=user_id,
        updated_at=profile.get("updated_at"),
        **data
    )