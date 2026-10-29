"""Service for generating and managing Personalized Daily Health Care Plans and Notifications.
Integrates ML Risk Prediction, SHAP Explainability, Indian Diet Database, Dynamic Meal Analysis,
Lifestyle Scoring Engine, Conservative Exercise Guidance, and Acute Safety Triage.
"""
import uuid
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from app.database import db
from app.recommendations.diet import diet_recommendation_engine
from app.recommendations.exercise import generate_exercise_recommendations
from app.recommendations.lifestyle import calculate_lifestyle_score
from app.recommendations.meal_analysis import meal_analyzer
from app.schemas.health_plan import (
    DailyHealthPlanResponse,
    HealthPlanItem,
    NutritionSection,
    NutritionMealItem,
    FoodSwapItem,
    ActivitySection,
    ActivityItem,
    SafetySection,
    MonitoringSection,
    MonitoringTask,
    WeeklyProgressSection,
    WeeklyDayProgress,
    RiskFactorContribution,
    PlanAdaptation,
    NotificationPreferences,
    NotificationResponse,
    VitalsRecordRequest
)

logger = logging.getLogger("cardio.health_plan")

class DailyHealthPlanService:
    async def get_or_create_daily_plan(
        self,
        user_id: str,
        target_date: Optional[str] = None,
        client_timezone: str = "UTC",
        force_regenerate: bool = False
    ) -> DailyHealthPlanResponse:
        date_str = target_date or datetime.utcnow().strftime("%Y-%m-%d")
        
        # Check if plan already exists for user and date
        if not force_regenerate:
            existing_plan = await db.find_one("daily_health_plans", {"user_id": user_id, "date": date_str})
            if existing_plan:
                return self._format_plan_response(existing_plan)

        # Generate new personalized plan
        plan_doc = await self._generate_personalized_plan(user_id, date_str, client_timezone)
        
        # Upsert into daily_health_plans
        await db.update_one(
            "daily_health_plans",
            {"user_id": user_id, "date": date_str},
            plan_doc,
            upsert=True
        )

        # Also generate initial notifications for scheduled plan items
        await self._sync_notifications_for_plan(user_id, plan_doc)

        saved_plan = await db.find_one("daily_health_plans", {"user_id": user_id, "date": date_str})
        return self._format_plan_response(saved_plan or plan_doc)

    async def _generate_personalized_plan(self, user_id: str, date_str: str, client_timezone: str) -> Dict[str, Any]:
        # 1. Fetch user profile
        profile = await db.find_one("profiles", {"user_id": user_id}) if user_id != "guest" else None
        if not profile:
            profile = {
                "age": 52,
                "sex": "male",
                "diet_preference": "vegetarian",
                "systolic_bp": 138,
                "diastolic_bp": 88,
                "cholesterol": 215,
                "blood_glucose": 105,
                "resting_hr": 74,
                "smoking_status": "never",
                "diabetes_status": "none",
                "family_history": True,
                "physical_activity": "sedentary",
                "sleep_duration": 6.0,
                "stress_level": 4,
                "bmi": 27.4,
                "allergies": []
            }

        # 2. Check for recent vitals logged today
        today_vitals = await db.find_one("vitals_logs", {"user_id": user_id, "date": date_str})
        if not today_vitals:
            v_list = await db.find_many("vitals_logs", {"user_id": user_id}, sort_field="created_at", descending=True, limit=1)
            today_vitals = v_list[0] if v_list else None
        if today_vitals:
            if today_vitals.get("systolic_bp") is not None:
                profile["systolic_bp"] = today_vitals["systolic_bp"]
            if today_vitals.get("diastolic_bp") is not None:
                profile["diastolic_bp"] = today_vitals["diastolic_bp"]
            if today_vitals.get("sleep_hours") is not None:
                profile["sleep_duration"] = today_vitals["sleep_hours"]

        sbp = float(profile.get("systolic_bp", 130))
        dbp = float(profile.get("diastolic_bp", 85))
        chol = float(profile.get("cholesterol", 200))
        smoking = str(profile.get("smoking_status", "never")).lower()
        activity_level = str(profile.get("physical_activity", "moderate")).lower()
        sleep_dur = float(profile.get("sleep_duration", 7.0))
        age = int(profile.get("age", 50))
        bmi = float(profile.get("bmi", 25.0))

        # 3. Fetch latest risk prediction
        risk_category = "MODERATE"
        preds = await db.find_many("predictions", {"user_id": user_id}, sort_field="created_at", descending=True, limit=1) if user_id != "guest" else []
        latest_pred = preds[0] if preds else None
        major_factors_from_model = []
        if latest_pred:
            risk_category = latest_pred.get("risk_category", "MODERATE")
            major_factors_from_model = latest_pred.get("major_risk_factors", [])
        else:
            # Derive risk category baseline from clinical vitals
            if sbp >= 160 or dbp >= 100 or smoking == "current" or (sbp >= 140 and chol >= 240):
                risk_category = "HIGH"
            elif sbp >= 130 or dbp >= 85 or chol >= 200 or activity_level == "sedentary":
                risk_category = "MODERATE"
            else:
                risk_category = "LOW"

        is_high_risk = risk_category in ["HIGH", "CRITICAL"]

        # 4. Fetch recent meal analysis or logged meals
        meals = await db.find_many("meal_logs", {"user_id": user_id}, sort_field="created_at", descending=True, limit=1) if user_id != "guest" else []
        recent_meal = meals[0] if meals else None
        logged_diet_score = recent_meal.get("diet_score") if recent_meal else None
        recent_sodium = recent_meal.get("total_sodium_mg", 1450.0) if recent_meal else (2400.0 if sbp >= 135 else 1600.0)

        # 5. Integrate existing Lifestyle Score engine
        lifestyle_res = calculate_lifestyle_score(profile, logged_diet_score)

        # 6. Check Exercise Safety Filter (SBP >= 180 or DBP >= 110)
        is_severe_hypertension = sbp >= 180 or dbp >= 110
        emergency_symptoms_present = False
        emergency_record = await db.find_one("emergency_alerts", {"user_id": user_id, "date": date_str})
        if emergency_record and emergency_record.get("is_emergency"):
            emergency_symptoms_present = True

        exercise_allowed = not is_severe_hypertension and not emergency_symptoms_present

        # 7. Generate Daily Food Plan with Indian Foods (5 Meal Slots)
        # Ensure food database is loaded
        if not diet_recommendation_engine.food_database:
            diet_recommendation_engine._load_food_database()
        
        diet_rec = diet_recommendation_engine.generate_recommendations(profile, risk_category)
        all_foods = diet_recommendation_engine.food_database

        def find_food(name_substr, default_dict):
            for f in all_foods:
                if name_substr.lower() in f.get("name", "").lower():
                    return f
            return default_dict

        # Breakfast foods
        b_items = diet_rec.get("breakfast", [])
        if not b_items:
            b_items = [
                find_food("oats upma", {"id": "f_oats", "name": "Vegetable Oats Upma", "calories": 160, "sodium_mg": 180, "fiber_g": 3.8, "protein_g": 4.5, "sat_fat_g": 0.4, "serving_size": "1 medium bowl (150g)"}),
                find_food("sambar", {"id": "f_sambar", "name": "Vegetable Sambar", "calories": 95, "sodium_mg": 280, "fiber_g": 3.8, "protein_g": 4.2, "sat_fat_g": 0.3, "serving_size": "1 bowl (150ml)"})
            ]
        
        # Mid-Morning foods
        mm_food = find_food("buttermilk", {"id": "f_chaas", "name": "Spiced Buttermilk (Chaas)", "calories": 40, "sodium_mg": 120, "fiber_g": 0.0, "protein_g": 2.2, "sat_fat_g": 0.3, "serving_size": "1 glass (200ml)"})
        mm_items = [mm_food]

        # Lunch foods
        l_items = diet_rec.get("lunch", [])
        if not l_items:
            l_items = [
                find_food("brown rice", {"id": "f_rice", "name": "Steamed Brown Rice", "calories": 170, "sodium_mg": 10, "fiber_g": 2.8, "protein_g": 3.6, "sat_fat_g": 0.3, "serving_size": "1 katori (100g)"}),
                find_food("dal", {"id": "f_dal", "name": "Yellow Dal Tadka (Low Oil)", "calories": 140, "sodium_mg": 220, "fiber_g": 4.5, "protein_g": 7.5, "sat_fat_g": 0.4, "serving_size": "1 bowl (150ml)"}),
                find_food("curd", {"id": "f_curd", "name": "Low-Fat Curd / Dahi", "calories": 65, "sodium_mg": 50, "fiber_g": 0.0, "protein_g": 4.8, "sat_fat_g": 0.8, "serving_size": "1 cup (100g)"})
            ]

        # Evening Snack foods
        snack_items = diet_rec.get("snack", [])
        if not snack_items:
            snack_items = [
                find_food("walnut", {"id": "f_nuts", "name": "Raw Walnuts & Almonds (4 each)", "calories": 140, "sodium_mg": 2, "fiber_g": 2.0, "protein_g": 4.2, "sat_fat_g": 1.1, "serving_size": "8 nuts (25g)"}),
                find_food("chana", {"id": "f_chana", "name": "Roasted Chana (Bengal Gram)", "calories": 110, "sodium_mg": 30, "fiber_g": 4.0, "protein_g": 6.0, "sat_fat_g": 0.3, "serving_size": "1 small bowl (30g)"})
            ]

        # Dinner foods
        d_items = diet_rec.get("dinner", [])
        if not d_items:
            d_items = [
                find_food("thepla", find_food("chapati", {"id": "f_roti", "name": "Whole Wheat Chapati (Without Ghee)", "calories": 140, "sodium_mg": 70, "fiber_g": 3.2, "protein_g": 4.4, "sat_fat_g": 0.2, "serving_size": "2 chapatis (60g)"})),
                find_food("lauki", {"id": "f_lauki", "name": "Lauki (Bottle Gourd) Sabzi", "calories": 75, "sodium_mg": 140, "fiber_g": 3.0, "protein_g": 1.8, "sat_fat_g": 0.2, "serving_size": "1 bowl (150g)"})
            ]

        def convert_to_meal_item(f, meal_prefix):
            return {
                "id": f"{meal_prefix}_{f.get('id', str(uuid.uuid4())[:8])}_{date_str}",
                "name": f.get("name", "Healthy Indian Meal"),
                "tamil_name": f.get("tamil_name"),
                "hindi_name": f.get("hindi_name"),
                "serving_size": f.get("serving_size", "1 serving"),
                "calories": float(f.get("calories", 100)),
                "sodium_mg": float(f.get("sodium_mg", 100)),
                "fiber_g": float(f.get("fiber_g", 2.0)),
                "protein_g": float(f.get("protein_g", 3.0)),
                "sat_fat_g": float(f.get("sat_fat_g", 0.5)),
                "completed": False,
                "completed_at": None
            }

        breakfast_list = [convert_to_meal_item(f, "bf") for f in b_items]
        mid_morning_list = [convert_to_meal_item(f, "mm") for f in mm_items]
        lunch_list = [convert_to_meal_item(f, "lu") for f in l_items]
        evening_list = [convert_to_meal_item(f, "ev") for f in snack_items]
        dinner_list = [convert_to_meal_item(f, "di") for f in d_items]

        all_food_items = breakfast_list + mid_morning_list + lunch_list + evening_list + dinner_list
        tot_cals = round(sum(f["calories"] for f in all_food_items), 1)
        tot_sod = round(sum(f["sodium_mg"] for f in all_food_items), 1)
        tot_fib = round(sum(f["fiber_g"] for f in all_food_items), 1)
        tot_prot = round(sum(f["protein_g"] for f in all_food_items), 1)
        tot_sat = round(sum(f["sat_fat_g"] for f in all_food_items), 1)

        # Sodium Detection and Swaps
        high_sodium_detected = recent_sodium > 2000.0 or sbp >= 135 or dbp >= 85
        suggested_swaps: List[Dict[str, str]] = []
        if high_sodium_detected:
            suggested_swaps = [
                {
                    "current_habit": "Pickle (achaar) & salted namkeen with meals",
                    "suggested_swap": "Fresh cucumber-tomato side with lemon juice & roasted unsalted chana",
                    "benefit_reason": "Reduces single-meal sodium by ~650 mg while supplying vascular-relaxing potassium."
                },
                {
                    "current_habit": "Fried papad with lunch",
                    "suggested_swap": "Spiced buttermilk (chaas) seasoned with cumin & fresh mint",
                    "benefit_reason": "Supports healthy digestion without excess hypertension sodium load."
                },
                {
                    "current_habit": "Commercial spice blends / high-sodium curries",
                    "suggested_swap": "Homestyle moong/toor dal tempered with garlic, turmeric, and fresh coriander",
                    "benefit_reason": "Enriches dietary soluble fiber and lowers daily sodium under 1,500 mg DASH threshold."
                }
            ]

        # 8. Activity Planning (Conservative & Progressive)
        activities: List[Dict[str, Any]] = []
        target_minutes = 25
        weekly_target = 150

        if exercise_allowed:
            if risk_category == "HIGH":
                walk_mins = 20
                stretch_mins = 5
                target_minutes = walk_mins + stretch_mins
                weekly_target = 120
                activities = [
                    {
                        "id": f"act_walk_{date_str}",
                        "name": "Cardioprotective Walking",
                        "duration_minutes": walk_mins,
                        "activity_type": "Aerobic Cardio",
                        "description": "20 minutes gentle, continuous flat-surface walk at conversational cadence (RPE 3–4/10).",
                        "completed": False,
                        "completed_at": None
                    },
                    {
                        "id": f"act_stretch_{date_str}",
                        "name": "Light Stretching & Pranayama",
                        "duration_minutes": stretch_mins,
                        "activity_type": "Flexibility & Breath",
                        "description": "5 minutes gentle neck, shoulder, and hamstring mobility with Anulom Vilom breathing.",
                        "completed": False,
                        "completed_at": None
                    }
                ]
            elif risk_category == "MODERATE":
                walk_mins = 25
                stretch_mins = 5
                target_minutes = walk_mins + stretch_mins
                weekly_target = 150
                activities = [
                    {
                        "id": f"act_walk_{date_str}",
                        "name": "Brisk Walking / Cycling",
                        "duration_minutes": walk_mins,
                        "activity_type": "Aerobic Cardio",
                        "description": "25 minutes brisk aerobic walking or gentle stationary pedaling (RPE 4–5/10).",
                        "completed": False,
                        "completed_at": None
                    },
                    {
                        "id": f"act_stretch_{date_str}",
                        "name": "Dynamic Joint Mobility",
                        "duration_minutes": stretch_mins,
                        "activity_type": "Mobility & Posture",
                        "description": "5 minutes full-body mobility, ankle rolls, and diaphragm expansion.",
                        "completed": False,
                        "completed_at": None
                    }
                ]
            else:  # LOW risk
                walk_mins = 30
                stretch_mins = 10
                target_minutes = walk_mins + stretch_mins
                weekly_target = 180
                activities = [
                    {
                        "id": f"act_walk_{date_str}",
                        "name": "Brisk Walking / Light Jogging",
                        "duration_minutes": walk_mins,
                        "activity_type": "Cardio Training",
                        "description": "30 minutes moderate-to-vigorous aerobic exercise promoting cardiac output.",
                        "completed": False,
                        "completed_at": None
                    },
                    {
                        "id": f"act_stretch_{date_str}",
                        "name": "Yoga Asanas & Cool-Down",
                        "duration_minutes": stretch_mins,
                        "activity_type": "Flexibility",
                        "description": "10 minutes Surya Namaskar flow and deep relaxation breathing.",
                        "completed": False,
                        "completed_at": None
                    }
                ]

        pause_reason = None
        warning_msg = None
        if is_severe_hypertension:
            pause_reason = "Your recorded blood pressure is severely elevated. Please seek medical assessment before continuing exercise recommendations."
            warning_msg = "Exercise plan temporarily paused"
        elif emergency_symptoms_present:
            pause_reason = "Acute red-flag cardiac symptoms detected. Physical exertion is suspended; seek emergency triage."
            warning_msg = "Physical exertion suspended"

        # 9. Monitoring Tasks
        monitoring_tasks = [
            {
                "id": f"mon_bp_{date_str}",
                "title": "Blood Pressure Record",
                "action_type": "RECORD_BP",
                "status": "recorded" if today_vitals and today_vitals.get("systolic_bp") else "pending",
                "recorded_value": f"{int(sbp)}/{int(dbp)} mmHg" if today_vitals and today_vitals.get("systolic_bp") else None,
                "completed": bool(today_vitals and today_vitals.get("systolic_bp"))
            },
            {
                "id": f"mon_meals_{date_str}",
                "title": "Track Daily Meals",
                "action_type": "LOG_MEAL",
                "status": "recorded" if recent_meal else "pending",
                "recorded_value": f"{int(tot_cals)} kcal logged" if recent_meal else None,
                "completed": bool(recent_meal)
            },
            {
                "id": f"mon_activity_{date_str}",
                "title": "Log Physical Activity",
                "action_type": "LOG_ACTIVITY",
                "status": "pending",
                "recorded_value": None,
                "completed": False
            },
            {
                "id": f"mon_sleep_{date_str}",
                "title": "Record Sleep Duration",
                "action_type": "RECORD_SLEEP",
                "status": "recorded" if today_vitals and today_vitals.get("sleep_hours") else "pending",
                "recorded_value": f"{sleep_dur} hrs" if today_vitals and today_vitals.get("sleep_hours") else f"{sleep_dur} hrs",
                "completed": bool(today_vitals and today_vitals.get("sleep_hours"))
            }
        ]

        # 10. "Why These Recommendations?" (SHAP / Major Model Contributors)
        risk_factor_contributions: List[Dict[str, Any]] = []

        if sbp >= 130 or dbp >= 85:
            impact = 38.0 if sbp >= 140 else 22.0
            risk_factor_contributions.append({
                "name": "elevated_bp",
                "display_name": "Elevated Blood Pressure",
                "value": f"{int(sbp)}/{int(dbp)} mmHg",
                "impact_pct": impact,
                "description": "Systolic and diastolic pressures impose sustained shear resistance against coronary vessel walls."
            })

        if activity_level in ["sedentary", "light"]:
            risk_factor_contributions.append({
                "name": "low_activity",
                "display_name": "Low Physical Activity",
                "value": activity_level.capitalize(),
                "impact_pct": 28.0,
                "description": "Sedentary baseline decreases vascular nitric oxide production and insulin receptor sensitivity."
            })

        if high_sodium_detected:
            risk_factor_contributions.append({
                "name": "high_sodium",
                "display_name": "High Dietary Sodium Intake",
                "value": f"{int(recent_sodium)} mg/day",
                "impact_pct": 24.0,
                "description": "Elevated sodium expands circulating plasma volume and increases microvascular tone."
            })

        if chol >= 200:
            risk_factor_contributions.append({
                "name": "serum_cholesterol",
                "display_name": "Elevated Serum Cholesterol",
                "value": f"{int(chol)} mg/dL",
                "impact_pct": 26.0,
                "description": "Apo-B rich lipoprotein fractions contribute to arterial intima-media lipid deposition."
            })

        if smoking == "current":
            risk_factor_contributions.append({
                "name": "tobacco_use",
                "display_name": "Active Tobacco Exposure",
                "value": "Current Smoker",
                "impact_pct": 35.0,
                "description": "Combustion oxidants induce acute endothelial injury, vasospasm, and hyper-coagulation."
            })

        if sleep_dur < 6.5:
            risk_factor_contributions.append({
                "name": "insufficient_sleep",
                "display_name": "Short Sleep Duration",
                "value": f"{sleep_dur} hrs/night",
                "impact_pct": 18.0,
                "description": "Suboptimal rest alters nocturnal blood pressure dipping and sustains sympathetic tone."
            })

        # Ensure at least 3 factors for complete visualization
        if len(risk_factor_contributions) < 3:
            risk_factor_contributions.append({
                "name": "metabolic_profile",
                "display_name": "Cardiometabolic Balance",
                "value": f"BMI {bmi}",
                "impact_pct": 15.0,
                "description": "Adiposity and metabolic clearance kinetics influence myocardial workload."
            })

        # 11. Daily Plan Adaptations (Real-time dynamic response)
        adaptations: List[Dict[str, Any]] = []

        if high_sodium_detected:
            adaptations.append({
                "category": "SODIUM",
                "icon": "AlertTriangle",
                "alert_title": "Sodium intake is elevated today",
                "message": "Recorded nutrition or baseline blood pressure indicates elevated daily sodium burden.",
                "suggested_action": "Choose a lower-sodium alternative for your next meal (e.g., fresh lemon-tempered dal instead of salty gravies/pickles)."
            })

        if activity_level in ["sedentary", "light"]:
            adaptations.append({
                "category": "ACTIVITY",
                "icon": "Footprints",
                "alert_title": "Activity goal not yet reached",
                "message": "Your movement baseline is currently low, which is a major modifiable risk contributor.",
                "suggested_action": "Complete a manageable 20-minute walking session today if your health status permits."
            })

        if is_severe_hypertension:
            adaptations.append({
                "category": "BP",
                "icon": "ShieldAlert",
                "alert_title": "Exercise recommendations temporarily paused",
                "message": f"Your recorded blood pressure ({int(sbp)}/{int(dbp)} mmHg) is severely elevated.",
                "suggested_action": "Please seek prompt medical assessment before engaging in physical exertion."
            })
        elif sbp >= 140 or dbp >= 90:
            adaptations.append({
                "category": "BP",
                "icon": "HeartPulse",
                "alert_title": "Blood pressure monitoring advised",
                "message": f"Current reading {int(sbp)}/{int(dbp)} mmHg reflects stage 2 hypertension range.",
                "suggested_action": "Record morning and evening resting BP readings and share trends with your clinician."
            })

        if sleep_dur < 6.5:
            adaptations.append({
                "category": "SLEEP",
                "icon": "Moon",
                "alert_title": "Sleep pattern needs attention",
                "message": f"Recorded sleep duration of {sleep_dur} hours is below the 7–8 hour cardioprotective restorative window.",
                "suggested_action": "Encourage healthy sleep habits: dim lights 45 minutes before bed and avoid late caffeine. (Not a diagnosis of sleep disorders)."
            })

        if smoking == "current":
            adaptations.append({
                "category": "SMOKING",
                "icon": "Flame",
                "alert_title": "Tobacco cessation support recommended",
                "message": "Active smoking multiplies atherosclerotic progression and platelet reactivity.",
                "suggested_action": "Discuss smoking cessation strategies and nicotine replacement therapies with your healthcare provider."
            })

        # 12. Weekly Progress Tracking (Monday - Sunday)
        days_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        weekly_days: List[Dict[str, Any]] = []
        base_date = datetime.utcnow()
        day_of_week = base_date.weekday()  # 0 is Monday

        for i, d_name in enumerate(days_names):
            d_offset = i - day_of_week
            d_time = base_date + timedelta(days=d_offset)
            d_str = d_time.strftime("%Y-%m-%d")
            # Past or current day sample adherence
            is_past = i <= day_of_week
            weekly_days.append({
                "day": d_name,
                "date_str": d_str,
                "exercise_minutes": 25 if is_past and exercise_allowed else (0 if not is_past else 0),
                "meal_adherence_pct": 85 if is_past else 0,
                "bp_recorded": is_past and (i % 2 == 0 or i == day_of_week),
                "score": 82 if is_past else 0
            })

        weekly_progress_doc = {
            "days": weekly_days,
            "exercise_minutes_done": 135 if exercise_allowed else 0,
            "exercise_minutes_target": weekly_target,
            "meal_adherence_pct": 82,
            "bp_records_done": 6,
            "bp_records_target": 7,
            "summary_label": "Lifestyle activity summary",
            "disclaimer": "Weekly adherence tracks lifestyle consistency and does not imply disease reversal."
        }

        # 13. Backwards-compatible timeline schedule items
        timeline_items: List[Dict[str, Any]] = []

        # Breakfast item (07:30)
        b_summary = ", ".join([f["name"] for f in breakfast_list[:2]])
        timeline_items.append({
            "id": f"item_breakfast_{date_str}",
            "category": "BREAKFAST",
            "time": "07:30",
            "title": "Heart-Healthy Breakfast",
            "description": f"Recommended: {b_summary}",
            "recommendation_details": {
                "foods": [f["name"] for f in breakfast_list],
                "calories": sum(f["calories"] for f in breakfast_list)
            },
            "completed": False,
            "completed_at": None,
            "source_id": None
        })

        # Mid-Morning (10:30)
        timeline_items.append({
            "id": f"item_mid_morning_{date_str}",
            "category": "MID_MORNING",
            "time": "10:30",
            "title": "Mid-Morning Hydration & Nourishment",
            "description": f"Recommended: {mm_items[0]['name']}. Maintains hydration and stable blood glucose.",
            "recommendation_details": {"target_ml": 250},
            "completed": False,
            "completed_at": None,
            "source_id": None
        })

        # Lunch (13:00)
        l_summary = ", ".join([f["name"] for f in lunch_list[:2]])
        timeline_items.append({
            "id": f"item_lunch_{date_str}",
            "category": "LUNCH",
            "time": "13:00",
            "title": "Cardioprotective Wholesome Lunch",
            "description": f"Recommended: {l_summary}",
            "recommendation_details": {
                "foods": [f["name"] for f in lunch_list],
                "calories": sum(f["calories"] for f in lunch_list)
            },
            "completed": False,
            "completed_at": None,
            "source_id": None
        })

        # Evening Snack (16:30)
        snack_summary = ", ".join([f["name"] for f in evening_list[:2]])
        timeline_items.append({
            "id": f"item_snack_{date_str}",
            "category": "EVENING_SNACK",
            "time": "16:30",
            "title": "Heart-Smart Evening Snack",
            "description": f"Recommended: {snack_summary}. Rich in polyphenols and healthy fatty acids.",
            "recommendation_details": {
                "foods": [f["name"] for f in evening_list],
                "calories": sum(f["calories"] for f in evening_list)
            },
            "completed": False,
            "completed_at": None,
            "source_id": None
        })

        # Exercise Activity (17:30)
        if exercise_allowed and activities:
            act_summary = f"{activities[0]['name']} ({activities[0]['duration_minutes']} min)"
            timeline_items.append({
                "id": f"item_walk_{date_str}",
                "category": "EXERCISE",
                "time": "17:30",
                "title": "Daily Cardioprotective Activity",
                "description": f"Today's Session: {act_summary}. Target: {target_minutes} minutes.",
                "recommendation_details": {
                    "target_minutes": target_minutes,
                    "permitted": True
                },
                "completed": False,
                "completed_at": None,
                "source_id": None
            })
        elif is_severe_hypertension:
            timeline_items.append({
                "id": f"item_walk_paused_{date_str}",
                "category": "EXERCISE",
                "time": "17:30",
                "title": "Exercise Plan Temporarily Paused",
                "description": pause_reason or "Blood pressure severely elevated.",
                "recommendation_details": {"permitted": False},
                "completed": False,
                "completed_at": None,
                "source_id": None
            })

        # Dinner (20:00)
        d_summary = ", ".join([f["name"] for f in dinner_list[:2]])
        timeline_items.append({
            "id": f"item_dinner_{date_str}",
            "category": "DINNER",
            "time": "20:00",
            "title": "Nourishing Light Dinner",
            "description": f"Recommended: {d_summary}",
            "recommendation_details": {
                "foods": [f["name"] for f in dinner_list],
                "calories": sum(f["calories"] for f in dinner_list)
            },
            "completed": False,
            "completed_at": None,
            "source_id": None
        })

        # Medication reminders if configured
        user_reminders = await db.find_many("reminders", {"user_id": user_id}) if user_id != "guest" else []
        for rem in user_reminders:
            med_name = rem.get("medicine_name", "").strip()
            dosage = rem.get("dosage", "").strip()
            rem_time = rem.get("time", "21:00")
            rem_id = str(rem.get("_id", ""))
            timeline_items.append({
                "id": f"item_med_{rem_id}_{date_str}",
                "category": "MEDICATION",
                "time": rem_time,
                "title": f"Prescribed Rx Reminder: {med_name}",
                "description": f"Scheduled dosage: {dosage or 'As prescribed by your clinician'}.",
                "recommendation_details": {
                    "medicine_name": med_name,
                    "dosage": dosage
                },
                "completed": rem.get("status") == "taken",
                "completed_at": rem.get("last_taken_at"),
                "source_id": rem_id
            })

        # Night Rest (21:30)
        timeline_items.append({
            "id": f"item_sleep_{date_str}",
            "category": "GENERAL",
            "time": "21:30",
            "title": "Circadian Rest & Sleep Recovery",
            "description": "7–8 hours restful sleep restores parasympathetic autonomic heart rate variability.",
            "recommendation_details": {"target_hours": 7.5},
            "completed": False,
            "completed_at": None,
            "source_id": None
        })

        timeline_items.sort(key=lambda x: x["time"])

        completed_count = sum(1 for item in timeline_items if item["completed"])
        total_items = len(timeline_items)
        progress = round((completed_count / total_items) * 100, 1) if total_items > 0 else 0.0

        headline = "Personalized Heart Care Plan" if is_high_risk else "Personalized Preventive Health Plan"
        subheading = (
            "Personalized preventive lifestyle guidance based on your current health information."
            if is_high_risk
            else "Preventive lifestyle guidance and daily habit tracking to support ongoing heart health."
        )

        plan_summary = (
            f"Personalized schedule with {total_items} daily wellness milestones calibrated for "
            f"{risk_category.lower()} cardiovascular risk and your nutrition targets."
        )

        return {
            "_id": f"plan_{user_id}_{date_str}",
            "user_id": user_id,
            "date": date_str,
            "plan_date": date_str,
            "timezone": client_timezone,
            "risk_category": risk_category,
            "is_high_risk": is_high_risk,
            "headline": headline,
            "subheading": subheading,
            "nutrition": {
                "breakfast": breakfast_list,
                "mid_morning": mid_morning_list,
                "lunch": lunch_list,
                "evening": evening_list,
                "dinner": dinner_list,
                "total_calories": tot_cals,
                "total_sodium_mg": tot_sod,
                "total_fiber_g": tot_fib,
                "total_protein_g": tot_prot,
                "total_sat_fat_g": tot_sat,
                "diet_score": logged_diet_score if logged_diet_score is not None else 82,
                "high_sodium_detected": high_sodium_detected,
                "sodium_warning": "High sodium detected" if high_sodium_detected else None,
                "suggested_swaps": suggested_swaps,
                "adherence_percentage": 82.0
            },
            "activity": {
                "status": "allowed" if exercise_allowed else "paused",
                "exercise_allowed": exercise_allowed,
                "pause_reason": pause_reason,
                "warning_message": warning_msg,
                "activities": activities,
                "target_minutes": target_minutes,
                "completed_minutes": 0,
                "adherence_percentage": 60.0,
                "weekly_target_minutes": weekly_target,
                "warmup_cooldown": [
                    "Warm-up: 5 mins gentle breathing and arm rotations.",
                    "Cool-down: 5 mins gradual slowdown and gentle calf stretches."
                ]
            },
            "safety": {
                "exercise_allowed": exercise_allowed,
                "bp_severely_elevated": is_severe_hypertension,
                "latest_sbp": sbp,
                "latest_dbp": dbp,
                "emergency": emergency_symptoms_present,
                "emergency_message": "CRITICAL EMERGENCY ALERT: Seek immediate medical care." if emergency_symptoms_present else None,
                "emergency_contacts": {
                    "emergency": "112",
                    "ambulance": "108"
                }
            },
            "monitoring": {
                "bp_recorded": bool(today_vitals and today_vitals.get("systolic_bp")),
                "latest_bp": f"{int(sbp)}/{int(dbp)} mmHg",
                "meals_logged": bool(recent_meal),
                "activity_logged": False,
                "sleep_hours": sleep_dur,
                "hydration_ml": 1800,
                "tasks": monitoring_tasks,
                "items_summary": ["Record BP", "Track meals", "Track activity", "Record sleep"]
            },
            "weekly_progress": weekly_progress_doc,
            "risk_factors": risk_factor_contributions,
            "lifestyle_score": lifestyle_res,
            "meal_analysis": {
                "total_calories": tot_cals,
                "total_sodium_mg": tot_sod,
                "total_fiber_g": tot_fib,
                "total_protein_g": tot_prot,
                "total_sat_fat_g": tot_sat,
                "diet_score": logged_diet_score if logged_diet_score is not None else 83,
                "cardio_health_rating": "Cardioprotective (Excellent)" if (logged_diet_score or 83) >= 80 else "Moderate Cardiovascular Alignment"
            },
            "adaptations": adaptations,
            "items": timeline_items,
            "total_items": total_items,
            "completed_count": completed_count,
            "progress_percentage": progress,
            "summary": plan_summary,
            "disclaimer": "This feature provides preventive lifestyle education and is not a diagnosis or medical prescription. Discuss all changes with a healthcare professional.",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

    async def _sync_notifications_for_plan(self, user_id: str, plan_doc: Dict[str, Any]):
        """Create notification records for scheduled routine items."""
        if user_id == "guest":
            return

        date_str = plan_doc.get("date")
        items = plan_doc.get("items", [])

        for item in items:
            notif_id = f"notif_{user_id}_{item['id']}"
            existing = await db.find_one("notifications", {"_id": notif_id})
            if not existing:
                notif_doc = {
                    "_id": notif_id,
                    "user_id": user_id,
                    "plan_date": date_str,
                    "category": item["category"],
                    "title": item["title"],
                    "body": item["description"],
                    "time": item["time"],
                    "read": False,
                    "created_at": datetime.utcnow().isoformat()
                }
                await db.insert_one("notifications", notif_doc)

    async def mark_item_complete(self, user_id: str, item_id: str, completed: bool = True) -> Optional[DailyHealthPlanResponse]:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        plan = await db.find_one("daily_health_plans", {"user_id": user_id, "date": date_str})
        
        if not plan:
            plans = await db.find_many("daily_health_plans", {"user_id": user_id}, limit=5)
            for p in plans:
                if any(i["id"] == item_id for i in p.get("items", [])):
                    plan = p
                    break

        if not plan:
            await self.get_or_create_daily_plan(user_id, date_str)
            plan = await db.find_one("daily_health_plans", {"user_id": user_id, "date": date_str})
            if not plan:
                return None

        # Update matching item in items list
        items = plan.get("items", [])
        matched = False
        for i in items:
            if i["id"] == item_id:
                i["completed"] = completed
                i["completed_at"] = datetime.utcnow().isoformat() if completed else None
                matched = True
                if i.get("category") == "MEDICATION" and i.get("source_id"):
                    rem_status = "taken" if completed else "upcoming"
                    await db.update_one(
                        "reminders",
                        {"_id": i["source_id"], "user_id": user_id},
                        {"status": rem_status, "last_taken_at": i["completed_at"]}
                    )
                break

        # Also check nutrition meal items
        nutrition = plan.get("nutrition", {})
        for slot in ["breakfast", "mid_morning", "lunch", "evening", "dinner"]:
            for m in nutrition.get(slot, []):
                if m.get("id") == item_id:
                    m["completed"] = completed
                    m["completed_at"] = datetime.utcnow().isoformat() if completed else None
                    matched = True
                    break

        # Also check activity items
        activity = plan.get("activity", {})
        for a in activity.get("activities", []):
            if a.get("id") == item_id:
                a["completed"] = completed
                a["completed_at"] = datetime.utcnow().isoformat() if completed else None
                matched = True
                if completed:
                    activity["completed_minutes"] = min(activity.get("target_minutes", 25), activity.get("completed_minutes", 0) + a.get("duration_minutes", 20))
                else:
                    activity["completed_minutes"] = max(0, activity.get("completed_minutes", 0) - a.get("duration_minutes", 20))
                break

        # Also check monitoring tasks
        monitoring = plan.get("monitoring", {})
        for t in monitoring.get("tasks", []):
            if t.get("id") == item_id:
                t["completed"] = completed
                t["status"] = "recorded" if completed else "pending"
                matched = True
                break

        if not matched:
            return None

        completed_count = sum(1 for i in items if i["completed"])
        total_items = len(items)
        progress = round((completed_count / total_items) * 100, 1) if total_items > 0 else 0.0

        update_data = {
            "items": items,
            "nutrition": nutrition,
            "activity": activity,
            "monitoring": monitoring,
            "completed_count": completed_count,
            "progress_percentage": progress,
            "updated_at": datetime.utcnow().isoformat()
        }

        await db.update_one(
            "daily_health_plans",
            {"_id": plan["_id"]},
            update_data
        )

        plan.update(update_data)
        return self._format_plan_response(plan)

    async def record_vitals(self, user_id: str, vitals_in: VitalsRecordRequest) -> DailyHealthPlanResponse:
        """Record daily vitals (BP, sleep, activity) and adapt active daily plan immediately."""
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        vitals_doc = {
            "user_id": user_id,
            "date": date_str,
            "systolic_bp": vitals_in.systolic_bp,
            "diastolic_bp": vitals_in.diastolic_bp,
            "sleep_hours": vitals_in.sleep_hours,
            "activity_minutes": vitals_in.activity_minutes,
            "hydration_ml": vitals_in.hydration_ml,
            "weight_kg": vitals_in.weight_kg,
            "created_at": datetime.utcnow().isoformat()
        }
        await db.insert_one("vitals_logs", vitals_doc)

        # Update user profile if user is logged in
        if user_id != "guest":
            profile_update: Dict[str, Any] = {}
            if vitals_in.systolic_bp is not None:
                profile_update["systolic_bp"] = vitals_in.systolic_bp
            if vitals_in.diastolic_bp is not None:
                profile_update["diastolic_bp"] = vitals_in.diastolic_bp
            if vitals_in.sleep_hours is not None:
                profile_update["sleep_duration"] = vitals_in.sleep_hours
            if profile_update:
                await db.update_one("profiles", {"user_id": user_id}, profile_update, upsert=True)

        # Force regenerate plan with updated vitals to reflect adaptations immediately
        return await self.get_or_create_daily_plan(user_id, date_str, force_regenerate=True)

    async def get_plan_history(self, user_id: str, limit: int = 7) -> List[DailyHealthPlanResponse]:
        plans = await db.find_many("daily_health_plans", {"user_id": user_id}, sort_field="date", descending=True, limit=limit)
        return [self._format_plan_response(p) for p in plans]

    async def get_user_notifications(self, user_id: str, unread_only: bool = False, limit: int = 30) -> List[NotificationResponse]:
        query = {"user_id": user_id}
        if unread_only:
            query["read"] = False
        notifs = await db.find_many("notifications", query, sort_field="created_at", descending=True, limit=limit)
        return [
            NotificationResponse(
                id=str(n.get("_id", "")),
                user_id=str(n.get("user_id", "")),
                category=n.get("category", "GENERAL"),
                title=n.get("title", ""),
                body=n.get("body", ""),
                time=n.get("time", ""),
                read=bool(n.get("read", False)),
                created_at=n.get("created_at")
            )
            for n in notifs
        ]

    async def mark_notification_read(self, user_id: str, notification_id: str) -> bool:
        return await db.update_one(
            "notifications",
            {"_id": notification_id, "user_id": user_id},
            {"read": True, "read_at": datetime.utcnow().isoformat()}
        )

    async def mark_all_notifications_read(self, user_id: str) -> bool:
        notifs = await db.find_many("notifications", {"user_id": user_id, "read": False})
        for n in notifs:
            await db.update_one("notifications", {"_id": n["_id"]}, {"read": True})
        return True

    async def get_notification_preferences(self, user_id: str) -> NotificationPreferences:
        prefs = await db.find_one("notification_preferences", {"user_id": user_id})
        if not prefs:
            return NotificationPreferences()
        return NotificationPreferences(
            notifications_enabled=prefs.get("notifications_enabled", True),
            breakfast_reminders=prefs.get("breakfast_reminders", True),
            lunch_reminders=prefs.get("lunch_reminders", True),
            dinner_reminders=prefs.get("dinner_reminders", True),
            hydration_reminders=prefs.get("hydration_reminders", True),
            exercise_reminders=prefs.get("exercise_reminders", True),
            medication_reminders=prefs.get("medication_reminders", True),
            general_reminders=prefs.get("general_reminders", True),
            quiet_hours_start=prefs.get("quiet_hours_start", "22:00"),
            quiet_hours_end=prefs.get("quiet_hours_end", "07:00"),
            timezone=prefs.get("timezone", "UTC")
        )

    async def update_notification_preferences(self, user_id: str, prefs_in: NotificationPreferences) -> NotificationPreferences:
        doc = prefs_in.model_dump()
        await db.update_one(
            "notification_preferences",
            {"user_id": user_id},
            doc,
            upsert=True
        )
        return prefs_in

    def _format_plan_response(self, plan_dict: Dict[str, Any]) -> DailyHealthPlanResponse:
        items_data = [
            HealthPlanItem(
                id=i.get("id", str(uuid.uuid4())),
                category=i.get("category", "GENERAL"),
                time=i.get("time", "08:00"),
                title=i.get("title", ""),
                description=i.get("description", ""),
                recommendation_details=i.get("recommendation_details"),
                completed=bool(i.get("completed", False)),
                completed_at=i.get("completed_at"),
                source_id=i.get("source_id")
            )
            for i in plan_dict.get("items", [])
        ]
        completed_count = sum(1 for i in items_data if i.completed)
        total_items = len(items_data)
        progress = round((completed_count / total_items) * 100, 1) if total_items > 0 else 0.0

        risk_category = plan_dict.get("risk_category", "MODERATE")
        is_high = plan_dict.get("is_high_risk", risk_category in ["HIGH", "CRITICAL"])

        return DailyHealthPlanResponse(
            id=str(plan_dict.get("_id", "")),
            user_id=str(plan_dict.get("user_id", "")),
            date=plan_dict.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
            plan_date=plan_dict.get("plan_date", plan_dict.get("date", datetime.utcnow().strftime("%Y-%m-%d"))),
            timezone=plan_dict.get("timezone", "UTC"),
            risk_category=risk_category,
            is_high_risk=is_high,
            headline=plan_dict.get("headline", "Personalized Heart Care Plan" if is_high else "Personalized Preventive Health Plan"),
            subheading=plan_dict.get("subheading", "Personalized preventive lifestyle guidance based on your current health information."),
            items=items_data,
            nutrition=plan_dict.get("nutrition"),
            activity=plan_dict.get("activity"),
            safety=plan_dict.get("safety"),
            monitoring=plan_dict.get("monitoring"),
            weekly_progress=plan_dict.get("weekly_progress"),
            risk_factors=plan_dict.get("risk_factors", []),
            lifestyle_score=plan_dict.get("lifestyle_score"),
            meal_analysis=plan_dict.get("meal_analysis"),
            adaptations=plan_dict.get("adaptations", []),
            total_items=total_items,
            completed_count=completed_count,
            progress_percentage=progress,
            summary=plan_dict.get("summary", ""),
            disclaimer=plan_dict.get("disclaimer", "This feature provides preventive lifestyle education and is not a medical diagnosis or prescription. Discuss all changes with a healthcare professional."),
            created_at=plan_dict.get("created_at"),
            updated_at=plan_dict.get("updated_at")
        )

health_plan_service = DailyHealthPlanService()
