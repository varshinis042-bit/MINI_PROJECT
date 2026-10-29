"""Pydantic schemas for Smart Ingredient-Based Meal Suggestions."""
from typing import List, Optional
from pydantic import BaseModel, Field

class MealItemSuggestion(BaseModel):
    name: str
    tamil_name: str
    matched_ingredients: List[str] = []
    missing_or_optional_ingredients: List[str] = []
    meal_type: str = "Breakfast"
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 5.0
    sodium_mg: int
    cardio_benefit: str
    cooking_time_mins: int
    cooking_time_minutes: Optional[int] = None
    preparation_steps: List[str] = []
    cooking_steps: List[str] = []
    healthier_tips: List[str] = []
    heart_tip: Optional[str] = None
    heart_benefit_score: int = 92

class IngredientMealRequest(BaseModel):
    ingredients: Optional[List[str]] = Field(None, description="List of available kitchen ingredients")
    available_ingredients: Optional[List[str]] = Field(None, description="Alias for ingredients")
    diet_preference: Optional[str] = "any"
    dietary_preference: Optional[str] = "any"
    meal_type: Optional[str] = None
    max_cooking_time: Optional[int] = 45
    max_cooking_time_minutes: Optional[int] = None

class IngredientMealResponse(BaseModel):
    input_ingredients: List[str]
    suggested_meals: List[MealItemSuggestion]
    dishes: List[MealItemSuggestion] = []
    total_matches: int = 0
    general_heart_guidance: List[str] = []
