"""Personalized Indian diet recommendation engine based on cardiovascular risk, hypertension,
dyslipidemia, diabetes status, and cultural food preferences.
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, List
from app.config import settings

logger = logging.getLogger("cardio.diet")

class DietRecommendationEngine:
    def __init__(self):
        self.food_database = []
        self._load_food_database()

    def _load_food_database(self):
        food_path = Path(settings.FOOD_DB_PATH)
        if food_path.exists():
            with open(food_path, "r", encoding="utf-8") as f:
                self.food_database = json.load(f)
            logger.info(f"Loaded {len(self.food_database)} Indian food items.")
        else:
            logger.warning(f"Food database not found at {food_path}")

    def generate_recommendations(self, profile: Dict[str, Any], risk_category: str = "MODERATE") -> Dict[str, Any]:
        if not self.food_database:
            self._load_food_database()

        pref = profile.get("diet_preference", "vegetarian").lower()
        allergies = [a.lower() for a in profile.get("allergies", [])]
        sbp = profile.get("systolic_bp", 120)
        dbp = profile.get("diastolic_bp", 80)
        chol = profile.get("cholesterol", 180)
        gluc = profile.get("blood_glucose", 90)

        is_hypertensive = sbp >= 130 or dbp >= 85
        is_hyperlipidemic = chol >= 200
        is_diabetic = gluc >= 126 or profile.get("diabetes_status") in ["type1", "type2", "pre_diabetes"]

        # Filter candidate foods
        candidates = []
        for food in self.food_database:
            # 1. Preference filtering
            if pref == "vegan" and not food.get("is_vegan", False):
                continue
            if pref == "vegetarian" and not food.get("is_vegetarian", True):
                continue
            if pref == "eggetarian":
                if not food.get("is_vegetarian", True) and "egg" not in food.get("allergens", []):
                    continue

            # 2. Allergy filtering
            food_allergens = [al.lower() for al in food.get("allergens", [])]
            if any(al in food_allergens for al in allergies):
                continue

            # 3. Clinical scoring
            score = 10.0
            # Hypertension: prioritize low sodium
            if is_hypertensive:
                if food.get("sodium_mg", 0) < 150:
                    score += 5.0
                elif food.get("sodium_mg", 0) > 250:
                    score -= 4.0

            # Dyslipidemia: prioritize high fiber, very low saturated fat
            if is_hyperlipidemic:
                if food.get("fiber_g", 0) >= 4.0:
                    score += 5.0
                if food.get("sat_fat_g", 0) <= 0.5:
                    score += 4.0
                elif food.get("sat_fat_g", 0) > 1.5:
                    score -= 5.0

            # Diabetes: prioritize low GI, complex carbs
            if is_diabetic:
                if food.get("glycemic_index") == "Low":
                    score += 5.0
                elif food.get("glycemic_index") == "High":
                    score -= 6.0

            candidates.append({**food, "_score": score})

        # Organize by meal category
        def pick_top(category_name: str, count: int) -> List[Dict[str, Any]]:
            items = [c for c in candidates if c.get("category") == category_name]
            items.sort(key=lambda x: x["_score"], reverse=True)
            res = []
            for item in items[:count]:
                c_copy = dict(item)
                c_copy.pop("_score", None)
                res.append(c_copy)
            return res

        breakfast = pick_top("breakfast", 2)
        lunch = pick_top("lunch", 3)
        snack = pick_top("snack", 2)
        dinner = pick_top("dinner", 2)

        # Aggregate Macros
        all_selected = breakfast + lunch + snack + dinner
        tot_cals = sum(f.get("calories", 0) for f in all_selected)
        tot_prot = sum(f.get("protein_g", 0) for f in all_selected)
        tot_fat = sum(f.get("fat_g", 0) for f in all_selected)
        tot_sat = sum(f.get("sat_fat_g", 0) for f in all_selected)
        tot_sod = sum(f.get("sodium_mg", 0) for f in all_selected)
        tot_fib = sum(f.get("fiber_g", 0) for f in all_selected)
        tot_carb = sum(f.get("carbs_g", 0) for f in all_selected)

        guidelines = [
            "Emphasize whole millets (Ragi, Jowar, Bajra) and brown rice over refined white polished rice.",
            "Limit added table salt and pickles/papads to maintain sodium intake below 2,000 mg/day (DASH principle).",
            "Use heart-healthy cooking oils (mustard oil, sesame oil, or groundnut oil) in rotation; limit total oil to 3-4 teaspoons daily.",
            "Avoid ghee re-heating and eliminate vanaspati/trans-fat loaded bakery snacks.",
            "Incorporate soluble fiber legumes (Moong dal, Bengal gram, Rajma) daily to lower circulating apo-B lipoproteins."
        ]

        if is_hypertensive:
            guidelines.append("Hypertension Focus: Incorporate potassium-rich foods (drumstick, bottle gourd, spinach) and avoid salted namkeens.")
        if is_hyperlipidemic:
            guidelines.append("Cholesterol Focus: Snack on raw walnuts (ALA omega-3) and roasted makhana instead of deep-fried samosas/kachoris.")
        if is_diabetic:
            guidelines.append("Glycemic Focus: Prefer steel-cut oats upma or sprouted moong salads to avoid high postprandial glucose excursions.")

        return {
            "risk_tier": risk_category,
            "diet_type": pref.replace("_", " ").title(),
            "breakfast": breakfast,
            "lunch": lunch,
            "snack": snack,
            "dinner": dinner,
            "daily_macros": {
                "calories": round(tot_cals, 1),
                "protein_g": round(tot_prot, 1),
                "fat_g": round(tot_fat, 1),
                "sat_fat_g": round(tot_sat, 1),
                "sodium_mg": round(tot_sod, 1),
                "fiber_g": round(tot_fib, 1),
                "carbs_g": round(tot_carb, 1)
            },
            "cardiovascular_guidelines": guidelines
        }

diet_recommendation_engine = DietRecommendationEngine()