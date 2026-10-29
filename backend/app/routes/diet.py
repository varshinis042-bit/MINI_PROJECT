"""Indian diet recommendation and dynamic meal analysis endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.database import db
from app.recommendations.diet import diet_recommendation_engine
from app.recommendations.meal_analysis import meal_analyzer
from app.schemas.diet import DietPlanResponse, DynamicMealAnalysisRequest, DynamicMealAnalysisResponse, FoodItem
from app.utils.security import get_optional_user

router = APIRouter(prefix="/diet", tags=["Diet Recommendation & Meal Analysis"])

@router.get("/recommendations", response_model=DietPlanResponse)
async def get_diet_recommendations(prediction_id: Optional[str] = Query(None), current_user: dict = Depends(get_optional_user)):
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
        # Default baseline profile
        profile_dict = {
            "diet_preference": "vegetarian",
            "systolic_bp": 130,
            "diastolic_bp": 85,
            "cholesterol": 210,
            "blood_glucose": 100,
            "allergies": []
        }

    plan = diet_recommendation_engine.generate_recommendations(profile_dict, risk_cat)
    return DietPlanResponse(**plan)

@router.post("/analyze-meal", response_model=DynamicMealAnalysisResponse)
async def analyze_dynamic_meal(meal_req: DynamicMealAnalysisRequest, current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest"
    meals_dict = {
        "breakfast": [item.model_dump() for item in meal_req.breakfast_items],
        "lunch": [item.model_dump() for item in meal_req.lunch_items],
        "snack": [item.model_dump() for item in meal_req.snack_items],
        "dinner": [item.model_dump() for item in meal_req.dinner_items]
    }

    result = meal_analyzer.analyze_daily_meals(meals_dict)

    if user_id != "guest":
        log_doc = {
            "user_id": user_id,
            "meals": meals_dict,
            **result
        }
        await db.insert_one("meal_logs", log_doc)

    return DynamicMealAnalysisResponse(**result)

@router.get("/foods", response_model=List[FoodItem])
async def list_indian_foods():
    if not diet_recommendation_engine.food_database:
        diet_recommendation_engine._load_food_database()
    return [FoodItem(**f) for f in diet_recommendation_engine.food_database]

@router.get("/recent-analysis", response_model=Optional[DynamicMealAnalysisResponse])
async def get_recent_meal_analysis(current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest"
    recent = await db.find_one("meal_logs", {"user_id": user_id})
    if not recent:
        return None
    return DynamicMealAnalysisResponse(**recent)