"""Routes for Smart Ingredient-Based Meal Suggestions."""
from typing import List
from fastapi import APIRouter, Depends
from app.schemas.meal_suggest import (
    IngredientMealRequest,
    IngredientMealResponse,
    MealItemSuggestion
)
from app.routes.auth import get_optional_user

router = APIRouter(prefix="/meals", tags=["Smart Meals"])

RECIPES_DATABASE = [
    {
        "name": "Egg Tomato Rice / Bhurji Rice",
        "tamil_name": "à®®à¯à®Ÿà¯à®Ÿà¯ˆ à®¤à®•à¯à®•à®¾à®³à®¿ à®šà®¾à®¤à®®à¯",
        "ingredients": ["egg", "eggs", "tomato", "rice", "onion", "garlic", "curry leaves", "pepper"],
        "meal_type": "Lunch / Dinner",
        "calories": 360,
        "protein_g": 16.5,
        "carbs_g": 48.0,
        "fat_g": 8.0,
        "fiber_g": 4.2,
        "sodium_mg": 210,
        "cardio_benefit": "Lycopene from cooked tomatoes combined with high-biological value protein supports vascular tone.",
        "cooking_time_mins": 20,
        "preparation_steps": [
            "Saute finely chopped onions, garlic, and ripe tomatoes in 1 tsp cold-pressed oil until soft.",
            "Whisk 2 whole eggs with freshly crushed black pepper and a pinch of turmeric, then scramble lightly into the pan.",
            "Fold in cooked brown rice or steamed parboiled rice, toss with fresh coriander and curry leaves."
        ],
        "healthier_tips": [
            "Use minimal salt (under 1/4 tsp); rely on black pepper and lemon for flavor.",
            "Prefer brown rice or millets over polished white rice."
        ],
        "is_veg": False
    },
    {
        "name": "Ragi Porridge / Malt",
        "tamil_name": "à®°à®¾à®•à®¿ à®•à¯‚à®´à¯ (à®•à¯‡à®´à¯à®µà®°à®•à¯)",
        "ingredients": ["ragi", "finger millet", "milk", "water", "almond", "almonds", "jaggery", "curd"],
        "meal_type": "Breakfast",
        "calories": 210,
        "protein_g": 6.5,
        "carbs_g": 38.0,
        "fat_g": 2.5,
        "fiber_g": 6.5,
        "sodium_mg": 65,
        "cardio_benefit": "Finger millet (Ragi) provides slow-release polyphenols and rich dietary fiber that lower postprandial glucose spikes.",
        "cooking_time_mins": 12,
        "preparation_steps": [
            "Dissolve 2 tablespoons of sprouted ragi flour in 1 cup of cold water without lumps.",
            "Simmer on low flame for 6-8 minutes stirring continuously until the mixture thickens and looks glossy.",
            "Stir in low-fat milk or spiced buttermilk (chaas) with a pinch of roasted cumin."
        ],
        "healthier_tips": [
            "Avoid refined white sugar; use buttermilk or a tiny pinch of cardamom for natural flavor."
        ],
        "is_veg": True
    },
    {
        "name": "Moong Dal Spinach Khichdi",
        "tamil_name": "à®•à¯€à®°à¯ˆ à®ªà®¾à®šà®¿à®ªà¯à®ªà®°à¯à®ªà¯à®ªà¯ à®•à®¿à®šà¯à®šà®Ÿà®¿",
        "ingredients": ["moong dal", "dal", "spinach", "palak", "rice", "tomato", "onion", "cumin", "garlic"],
        "meal_type": "Dinner",
        "calories": 310,
        "protein_g": 14.0,
        "carbs_g": 52.0,
        "fat_g": 4.5,
        "fiber_g": 7.0,
        "sodium_mg": 190,
        "cardio_benefit": "Yellow moong lentils and folate-rich spinach support endothelial vasodilation and arterial flexibility.",
        "cooking_time_mins": 25,
        "preparation_steps": [
            "Wash equal portions of split yellow moong dal and rice/millets.",
            "Pressure cook with chopped spinach, tomatoes, turmeric, and cumin for 3-4 whistles.",
            "Season lightly with mustard seeds, curry leaves, and a touch of roasted asafoetida."
        ],
        "healthier_tips": [
            "Do not add excess ghee; 1/2 teaspoon is sufficient for flavor and fat-soluble vitamin absorption."
        ],
        "is_veg": True
    },
    {
        "name": "Sprouted Sundal with Curry Leaves",
        "tamil_name": "à®®à¯à®³à¯ˆà®•à®Ÿà¯à®Ÿà®¿à®¯ à®šà¯à®£à¯à®Ÿà®²à¯",
        "ingredients": ["chana", "chickpeas", "moong", "sprouts", "mustard", "curry leaves", "coconut", "lemon"],
        "meal_type": "Snack",
        "calories": 180,
        "protein_g": 9.5,
        "carbs_g": 26.0,
        "fat_g": 3.0,
        "fiber_g": 8.0,
        "sodium_mg": 110,
        "cardio_benefit": "High prebiotic legume fiber that binds serum bile acids and naturally reduces LDL cholesterol levels.",
        "cooking_time_mins": 15,
        "preparation_steps": [
            "Steam pre-soaked or sprouted green moong or black chana until tender.",
            "In a pan, splutter mustard seeds, green chili, and curry leaves in 1/2 tsp oil.",
            "Add the steamed sprouts, toss for 2 minutes, and finish with a squeeze of fresh lemon juice."
        ],
        "healthier_tips": [
            "Keep grated coconut to 1 teaspoon or omit completely for reduced saturated fat."
        ],
        "is_veg": True
    },
    {
        "name": "Vegetable Oats Upma",
        "tamil_name": "à®•à®¾à®¯à¯à®•à®±à®¿ à®“à®Ÿà¯à®¸à¯ à®‰à®ªà¯à®ªà¯à®®à®¾",
        "ingredients": ["oats", "onion", "tomato", "carrot", "carrots", "beans", "green chili", "mustard", "peas"],
        "meal_type": "Breakfast",
        "calories": 240,
        "protein_g": 8.0,
        "carbs_g": 42.0,
        "fat_g": 4.5,
        "fiber_g": 6.0,
        "sodium_mg": 150,
        "cardio_benefit": "Beta-glucan soluble fiber forms a cardioprotective viscous gel in the intestine, dampening cholesterol absorption.",
        "cooking_time_mins": 15,
        "preparation_steps": [
            "Dry roast rolled oats for 3 minutes and set aside.",
            "Saute mustard seeds, curry leaves, ginger, onions, and finely diced carrots/beans in 1 tsp oil.",
            "Add 1.5 cups of water, bring to a gentle boil, then stir in the oats until thick and fluffy."
        ],
        "healthier_tips": [
            "Load up on vegetables (carrots, beans, peas) so veggies form at least 50% of the volume."
        ],
        "is_veg": True
    },
    {
        "name": "Garlic Pepper Rasam with Steamed Rice",
        "tamil_name": "à®ªà¯‚à®£à¯à®Ÿà¯ à®®à®¿à®³à®•à¯ à®°à®šà®®à¯",
        "ingredients": ["garlic", "pepper", "cumin", "tomato", "tamarind", "coriander", "turmeric", "rice"],
        "meal_type": "Lunch",
        "calories": 220,
        "protein_g": 4.5,
        "carbs_g": 45.0,
        "fat_g": 2.0,
        "fiber_g": 3.5,
        "sodium_mg": 160,
        "cardio_benefit": "Allicin in fresh crushed garlic together with piperine promotes peripheral microvascular circulation.",
        "cooking_time_mins": 15,
        "preparation_steps": [
            "Crush 5 cloves of garlic with black peppercorns and cumin seeds.",
            "Boil ripe chopped tomatoes with tamarind water, turmeric, and the crushed garlic-pepper mix.",
            "Finish with a quick tempering of mustard and fresh curry leaves."
        ],
        "healthier_tips": [
            "Use lemon juice instead of excess tamarind for a fresher flavor with less sodium."
        ],
        "is_veg": True
    }
]

@router.post("/suggest", response_model=IngredientMealResponse)
def suggest_meals(request: IngredientMealRequest, current_user: dict = Depends(get_optional_user)):
    raw_ingredients = request.ingredients or request.available_ingredients or []
    user_inputs = [ing.strip().lower() for ing in raw_ingredients if ing.strip()]
    diet_pref = (request.diet_preference or request.dietary_preference or "any").lower()
    req_meal_type = (request.meal_type or "").lower()

    scored_meals = []
    for recipe in RECIPES_DATABASE:
        if diet_pref == "vegetarian" and not recipe["is_veg"]:
            continue
        if diet_pref == "vegan" and "milk" in recipe["ingredients"]:
            continue
        if req_meal_type and req_meal_type not in ["all", "any"]:
            if req_meal_type not in recipe["meal_type"].lower():
                continue

        matched = []
        for inp in user_inputs:
            for r_ing in recipe["ingredients"]:
                if r_ing in inp or inp in r_ing:
                    matched.append(inp)
                    break

        if matched or len(user_inputs) == 0:
            scored_meals.append({
                "recipe": recipe,
                "matched": list(set(matched)),
                "score": len(matched)
            })

    scored_meals.sort(key=lambda x: x["score"], reverse=True)
    if not scored_meals:
        scored_meals = [{"recipe": r, "matched": [], "score": 0} for r in RECIPES_DATABASE[:3]]

    suggestions = []
    for item in scored_meals[:5]:
        r = item["recipe"]
        matched_items = item["matched"]
        missing = [ing for ing in r["ingredients"][:4] if not any(m in ing or ing in m for m in matched_items)]
        
        step_list = r["preparation_steps"]
        tip_text = r["healthier_tips"][0] if r.get("healthier_tips") else "Use minimal oil and keep salt modest."

        suggestions.append(MealItemSuggestion(
            name=r["name"],
            tamil_name=r["tamil_name"],
            matched_ingredients=matched_items if matched_items else ["Staple pantry items"],
            missing_or_optional_ingredients=missing[:3],
            meal_type=r["meal_type"],
            calories=r["calories"],
            protein_g=r["protein_g"],
            carbs_g=r["carbs_g"],
            fat_g=r["fat_g"],
            fiber_g=r.get("fiber_g", 5.0),
            sodium_mg=r["sodium_mg"],
            cardio_benefit=r["cardio_benefit"],
            cooking_time_mins=r["cooking_time_mins"],
            cooking_time_minutes=r["cooking_time_mins"],
            preparation_steps=step_list,
            cooking_steps=step_list,
            healthier_tips=r["healthier_tips"],
            heart_tip=tip_text,
            heart_benefit_score=min(98, 80 + len(matched_items) * 6)
        ))

    guidelines = [
        "Use cold-pressed mustard, sesame, or groundnut oil in moderation; avoid trans fats and vanaspati.",
        "Keep sodium under 1/2 teaspoon per day; season generously with black pepper, lemon, and curry leaves.",
        "Incorporate whole grains (Ragi, Millets, Brown Rice) to support healthy lipid profiles."
    ]

    return IngredientMealResponse(
        input_ingredients=raw_ingredients,
        suggested_meals=suggestions,
        dishes=suggestions,
        total_matches=len(suggestions),
        general_heart_guidance=guidelines
    )
