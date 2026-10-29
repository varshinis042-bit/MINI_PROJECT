"""Dynamic meal analyzer calculating daily nutrient totals, cardiovascular diet score,
identifying nutritional red flags, and generating cultural Indian food swaps.
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, List
from app.config import settings

logger = logging.getLogger("cardio.meal_analysis")

DEFAULT_FALLBACK_FOODS = {
    "biryani": {"calories": 380, "protein_g": 14, "fat_g": 16, "sat_fat_g": 5.5, "sodium_mg": 720, "fiber_g": 1.8, "carbs_g": 45},
    "samosa": {"calories": 260, "protein_g": 3.5, "fat_g": 16, "sat_fat_g": 4.8, "sodium_mg": 420, "fiber_g": 1.5, "carbs_g": 26},
    "gulab jamun": {"calories": 150, "protein_g": 2.0, "fat_g": 6.5, "sat_fat_g": 3.2, "sodium_mg": 75, "fiber_g": 0.2, "carbs_g": 22},
    "naan": {"calories": 260, "protein_g": 8.0, "fat_g": 5.0, "sat_fat_g": 2.2, "sodium_mg": 430, "fiber_g": 2.0, "carbs_g": 45},
    "puri": {"calories": 140, "protein_g": 2.2, "fat_g": 8.5, "sat_fat_g": 2.4, "sodium_mg": 160, "fiber_g": 1.0, "carbs_g": 14},
    "pakora": {"calories": 210, "protein_g": 4.5, "fat_g": 14, "sat_fat_g": 2.8, "sodium_mg": 380, "fiber_g": 2.2, "carbs_g": 18},
    "paneer butter masala": {"calories": 340, "protein_g": 12, "fat_g": 26, "sat_fat_g": 12.0, "sodium_mg": 680, "fiber_g": 2.5, "carbs_g": 14}
}

class DynamicMealAnalyzer:
    def __init__(self):
        self.db_items = {}
        self._load_food_dict()

    def _load_food_dict(self):
        food_path = Path(settings.FOOD_DB_PATH)
        if food_path.exists():
            with open(food_path, "r", encoding="utf-8") as f:
                items = json.load(f)
                for item in items:
                    self.db_items[item["id"]] = item
                    self.db_items[item["name"].lower()] = item

    def _resolve_food_nutrients(self, name_or_id: str) -> Dict[str, float]:
        query = name_or_id.lower().strip()
        # 1. Direct key match
        if query in self.db_items:
            return self.db_items[query]

        # 2. Substring match in database
        for k, v in self.db_items.items():
            if query in k or k in query:
                return v

        # 3. Known fallback dishes (biryani, samosa, etc.)
        for fallback_k, fallback_v in DEFAULT_FALLBACK_FOODS.items():
            if fallback_k in query:
                return fallback_v

        # 4. Conservative generic estimate
        return {
            "calories": 150.0,
            "protein_g": 4.0,
            "fat_g": 4.0,
            "sat_fat_g": 1.0,
            "sodium_mg": 250.0,
            "fiber_g": 2.0,
            "carbs_g": 25.0
        }

    def analyze_daily_meals(self, meals_dict: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        if not self.db_items:
            self._load_food_dict()

        tot_cal = 0.0
        tot_prot = 0.0
        tot_fat = 0.0
        tot_sat = 0.0
        tot_sod = 0.0
        tot_fib = 0.0
        tot_carb = 0.0

        for meal_type, items in meals_dict.items():
            for item in items:
                name = item.get("food_name", "")
                food_id = item.get("food_id")
                servings = float(item.get("servings", 1.0))

                nutr = self._resolve_food_nutrients(food_id if food_id else name)
                tot_cal += nutr.get("calories", 0.0) * servings
                tot_prot += nutr.get("protein_g", 0.0) * servings
                tot_fat += nutr.get("fat_g", 0.0) * servings
                tot_sat += nutr.get("sat_fat_g", 0.0) * servings
                tot_sod += nutr.get("sodium_mg", 0.0) * servings
                tot_fib += nutr.get("fiber_g", 0.0) * servings
                tot_carb += nutr.get("carbs_g", 0.0) * servings

        # Calculate Diet Score (0 to 100)
        score = 85.0
        potential_issues = []
        suggestions = []

        # Sodium analysis
        if tot_sod > 2800:
            score -= 24.0
            potential_issues.append(f"Excessive daily sodium ({int(tot_sod)} mg): Exceeds maximum 2,300 mg guideline.")
            suggestions.append("Replace high-sodium gravies and table salt with lemon juice, roasted cumin, and fresh coriander.")
        elif tot_sod > 2200:
            score -= 12.0
            potential_issues.append(f"High daily sodium ({int(tot_sod)} mg): Borderline for hypertension prevention.")
            suggestions.append("Cut down on papads, pickles (achaar), and processed spice blends.")

        # Saturated fat analysis
        if tot_sat > 20.0:
            score -= 22.0
            potential_issues.append(f"High saturated fat ({round(tot_sat, 1)} g): Elevated risk of promoting atherogenic LDL elevation.")
            suggestions.append("Substitute full-fat dairy, butter, and vanaspati with double-toned milk, homemade curd, and cold-pressed plant oils.")
        elif tot_sat > 14.0:
            score -= 10.0
            potential_issues.append(f"Moderate-high saturated fat ({round(tot_sat, 1)} g).")

        # Dietary fiber analysis
        if tot_fib < 12.0:
            score -= 25.0
            potential_issues.append(f"Very low dietary fiber ({round(tot_fib, 1)} g): Recommended cardioprotective intake is 25-30 g/day.")
            suggestions.append("Add a serving of sprouted moong, unpeeled cucumber salad, and replace maida/refined rice with whole wheat or oats.")
        elif tot_fib < 22.0:
            score -= 10.0
            potential_issues.append(f"Suboptimal dietary fiber ({round(tot_fib, 1)} g).")
            suggestions.append("Incorporate whole pulses (chana, rajma, toor dal) into lunch and dinner.")
        else:
            score += 8.0  # reward high fiber

        # Protein balance
        if tot_prot >= 50.0:
            score += 5.0
        elif tot_prot < 30.0:
            score -= 10.0
            potential_issues.append(f"Low protein intake ({round(tot_prot, 1)} g): Important for maintaining cardiovascular muscle tone.")
            suggestions.append("Add boiled egg whites, sattu drink, paneer/tofu, or steamed dal to meals.")

        final_score = int(max(15, min(100, round(score))))

        if final_score >= 80:
            rating = "Cardioprotective (Excellent)"
        elif final_score >= 60:
            rating = "Moderate Cardiovascular Alignment"
        else:
            rating = "High Atherogenic Risk (Needs Attention)"

        if not potential_issues:
            potential_issues.append("No critical dietary imbalances detected in today's logged meals.")
            suggestions.append("Maintain this balanced cardiovascular nutritional profile.")

        return {
            "total_calories": round(tot_cal, 1),
            "total_protein_g": round(tot_prot, 1),
            "total_fat_g": round(tot_fat, 1),
            "total_sat_fat_g": round(tot_sat, 1),
            "total_sodium_mg": round(tot_sod, 1),
            "total_fiber_g": round(tot_fib, 1),
            "total_carbs_g": round(tot_carb, 1),
            "diet_score": final_score,
            "potential_issues": potential_issues,
            "improvement_suggestions": suggestions,
            "cardio_health_rating": rating,
            "disclaimer": (
                "Dynamic meal analysis provides educational macronutrient and micronutrient estimates "
                "based on standard Indian food composition data and should not substitute for medical nutrition therapy."
            )
        }

meal_analyzer = DynamicMealAnalyzer()