"""Indian diet recommendation and dynamic meal analysis schemas."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class FoodItem(BaseModel):
    id: str
    name: str
    hindi_name: Optional[str] = None
    category: str  # "breakfast", "lunch", "snack", "dinner"
    cuisine_region: str  # "South Indian", "North Indian", "Pan-Indian"
    serving_size: str
    calories: float
    protein_g: float
    fat_g: float
    sat_fat_g: float
    sodium_mg: float
    fiber_g: float
    carbs_g: float
    glycemic_index: str  # "Low", "Medium", "High"
    cardio_benefits: str
    is_vegetarian: bool = True
    is_vegan: bool = False
    allergens: List[str] = []

class DietPlanResponse(BaseModel):
    risk_tier: str
    diet_type: str
    breakfast: List[FoodItem]
    lunch: List[FoodItem]
    snack: List[FoodItem]
    dinner: List[FoodItem]
    daily_macros: Dict[str, float]
    cardiovascular_guidelines: List[str]
    disclaimer: str = (
        "These dietary recommendations are based on cardiovascular preventive guidelines (DASH/Indian Heart guidelines) "
        "and are for lifestyle wellness support, not clinical medical nutrition therapy."
    )

class MealAnalysisItem(BaseModel):
    food_id: Optional[str] = None
    food_name: str
    servings: float = 1.0

class DynamicMealAnalysisRequest(BaseModel):
    breakfast_items: List[MealAnalysisItem] = []
    lunch_items: List[MealAnalysisItem] = []
    snack_items: List[MealAnalysisItem] = []
    dinner_items: List[MealAnalysisItem] = []

class DynamicMealAnalysisResponse(BaseModel):
    total_calories: float
    total_protein_g: float
    total_fat_g: float
    total_sat_fat_g: float
    total_sodium_mg: float
    total_fiber_g: float
    total_carbs_g: float
    diet_score: int = Field(..., ge=0, le=100)
    potential_issues: List[str]
    improvement_suggestions: List[str]
    cardio_health_rating: str
    logged_at: Optional[str] = None
    disclaimer: str