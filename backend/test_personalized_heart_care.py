"""Automated test suite validating the 15 required scenarios for the Personalized Heart Care Plan
and existing system architecture integration.
"""
import asyncio
import os
import unittest
from datetime import datetime

# Ensure working directory is backend
from app.config import settings
from app.database import db
from app.services.health_plan_service import health_plan_service
from app.recommendations.lifestyle import calculate_lifestyle_score
from app.recommendations.meal_analysis import meal_analyzer
from app.recommendations.exercise import generate_exercise_recommendations
from app.ml.predict import prediction_service
from app.utils.security import verify_password, get_password_hash, create_access_token
from jose import jwt

class TestPersonalizedHeartCarePlan(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)
        cls.loop.run_until_complete(db.connect())

    @classmethod
    def tearDownClass(cls):
        cls.loop.close()

    def run_async(self, coro):
        return self.loop.run_until_complete(coro)

    def test_01_high_risk_generates_care_plan(self):
        """1. HIGH risk generates care plan."""
        async def _test():
            user_id = f"test_user_high_{datetime.utcnow().timestamp()}"
            # Insert High risk prediction
            await db.insert_one("predictions", {
                "user_id": user_id,
                "risk_category": "HIGH",
                "risk_percentage": 68.5,
                "created_at": datetime.utcnow().isoformat()
            })
            plan = await health_plan_service.get_or_create_daily_plan(user_id=user_id, force_regenerate=True)
            self.assertEqual(plan.risk_category, "HIGH")
            self.assertTrue(plan.is_high_risk)
            self.assertEqual(plan.headline, "Personalized Heart Care Plan")
            self.assertIn("Personalized preventive lifestyle guidance", plan.subheading)
            self.assertIsNotNone(plan.nutrition)
            self.assertIsNotNone(plan.activity)
            self.assertIsNotNone(plan.monitoring)
        self.run_async(_test())

    def test_02_low_moderate_risk_does_not_show_high_risk_messaging(self):
        """2. LOW/MODERATE risk does not show high-risk messaging."""
        async def _test():
            user_id = f"test_user_mod_{datetime.utcnow().timestamp()}"
            await db.insert_one("predictions", {
                "user_id": user_id,
                "risk_category": "MODERATE",
                "risk_percentage": 34.0,
                "created_at": datetime.utcnow().isoformat()
            })
            # Profile with normal vitals
            await db.insert_one("profiles", {
                "user_id": user_id,
                "systolic_bp": 122,
                "diastolic_bp": 78,
                "cholesterol": 185,
                "smoking_status": "never",
                "physical_activity": "moderate"
            })
            plan = await health_plan_service.get_or_create_daily_plan(user_id=user_id, force_regenerate=True)
            self.assertIn(plan.risk_category, ["LOW", "MODERATE"])
            self.assertFalse(plan.is_high_risk)
            self.assertEqual(plan.headline, "Personalized Preventive Health Plan")
            self.assertNotIn("treats or cures", plan.subheading.lower())
        self.run_async(_test())

    def test_03_high_bp_produces_bp_monitoring_guidance(self):
        """3. High BP produces BP-monitoring guidance."""
        async def _test():
            user_id = f"test_user_bp_{datetime.utcnow().timestamp()}"
            await db.insert_one("profiles", {
                "user_id": user_id,
                "systolic_bp": 148,
                "diastolic_bp": 92,
                "cholesterol": 190,
                "smoking_status": "never",
                "physical_activity": "moderate"
            })
            plan = await health_plan_service.get_or_create_daily_plan(user_id=user_id, force_regenerate=True)
            # Check adaptations for BP monitoring guidance
            bp_adapt = [a for a in plan.adaptations if a.category == "BP"]
            self.assertTrue(len(bp_adapt) > 0)
            self.assertTrue(any("blood pressure" in a.alert_title.lower() or "bp" in a.alert_title.lower() for a in bp_adapt))
            # Check risk factors contributions contains elevated BP
            bp_factors = [rf for rf in plan.risk_factors if "bp" in rf.name.lower() or "pressure" in rf.display_name.lower()]
            self.assertTrue(len(bp_factors) > 0)
        self.run_async(_test())

    def test_04_high_sodium_produces_food_swap_guidance(self):
        """4. High sodium produces food-swap guidance."""
        async def _test():
            user_id = f"test_user_sod_{datetime.utcnow().timestamp()}"
            await db.insert_one("meal_logs", {
                "user_id": user_id,
                "total_sodium_mg": 2850.0,
                "diet_score": 62,
                "created_at": datetime.utcnow().isoformat()
            })
            plan = await health_plan_service.get_or_create_daily_plan(user_id=user_id, force_regenerate=True)
            self.assertTrue(plan.nutrition.high_sodium_detected)
            self.assertEqual(plan.nutrition.sodium_warning, "High sodium detected")
            self.assertTrue(len(plan.nutrition.suggested_swaps) > 0)
            # Verify Indian food swaps (e.g. pickle / namkeen to fresh side)
            swaps_text = " ".join([s.current_habit + " " + s.suggested_swap for s in plan.nutrition.suggested_swaps]).lower()
            self.assertIn("pickle", swaps_text)
        self.run_async(_test())

    def test_05_low_activity_produces_gradual_activity_guidance(self):
        """5. Low activity produces gradual activity guidance."""
        async def _test():
            user_id = f"test_user_low_act_{datetime.utcnow().timestamp()}"
            await db.insert_one("profiles", {
                "user_id": user_id,
                "physical_activity": "sedentary",
                "systolic_bp": 128,
                "diastolic_bp": 82
            })
            plan = await health_plan_service.get_or_create_daily_plan(user_id=user_id, force_regenerate=True)
            # Check activities are progressive (e.g. 20-25 mins walking / stretching, not intense training)
            self.assertTrue(plan.activity.exercise_allowed)
            self.assertLessEqual(plan.activity.target_minutes, 35)
            # Adaptation present for low activity
            act_adapt = [a for a in plan.adaptations if a.category == "ACTIVITY"]
            self.assertTrue(len(act_adapt) > 0)
            self.assertIn("Activity goal not yet reached", act_adapt[0].alert_title)
        self.run_async(_test())

    def test_06_current_smoker_produces_cessation_support_guidance(self):
        """6. Current smoker produces cessation-support guidance."""
        async def _test():
            user_id = f"test_user_smoke_{datetime.utcnow().timestamp()}"
            await db.insert_one("profiles", {
                "user_id": user_id,
                "smoking_status": "current",
                "systolic_bp": 125,
                "diastolic_bp": 80
            })
            plan = await health_plan_service.get_or_create_daily_plan(user_id=user_id, force_regenerate=True)
            smoke_adapt = [a for a in plan.adaptations if a.category == "SMOKING"]
            self.assertTrue(len(smoke_adapt) > 0)
            self.assertIn("Tobacco cessation support", smoke_adapt[0].alert_title)
            self.assertIn("healthcare provider", smoke_adapt[0].suggested_action.lower())
        self.run_async(_test())

    def test_07_sbp_gte_180_blocks_normal_exercise_recommendations(self):
        """7. SBP >= 180 blocks normal exercise recommendations."""
        async def _test():
            user_id = f"test_user_sbp180_{datetime.utcnow().timestamp()}"
            await db.insert_one("profiles", {
                "user_id": user_id,
                "systolic_bp": 184,
                "diastolic_bp": 92
            })
            plan = await health_plan_service.get_or_create_daily_plan(user_id=user_id, force_regenerate=True)
            self.assertFalse(plan.safety.exercise_allowed)
            self.assertTrue(plan.safety.bp_severely_elevated)
            self.assertEqual(plan.activity.status, "paused")
            self.assertEqual(plan.activity.warning_message, "Exercise plan temporarily paused")
            self.assertIn("Your recorded blood pressure is severely elevated", plan.activity.pause_reason)
            self.assertEqual(len(plan.activity.activities), 0)
        self.run_async(_test())

    def test_08_dbp_gte_110_blocks_normal_exercise_recommendations(self):
        """8. DBP >= 110 blocks normal exercise recommendations."""
        async def _test():
            user_id = f"test_user_dbp110_{datetime.utcnow().timestamp()}"
            await db.insert_one("profiles", {
                "user_id": user_id,
                "systolic_bp": 160,
                "diastolic_bp": 114
            })
            plan = await health_plan_service.get_or_create_daily_plan(user_id=user_id, force_regenerate=True)
            self.assertFalse(plan.safety.exercise_allowed)
            self.assertTrue(plan.safety.bp_severely_elevated)
            self.assertEqual(plan.activity.status, "paused")
            self.assertEqual(plan.activity.warning_message, "Exercise plan temporarily paused")
            self.assertIn("Your recorded blood pressure is severely elevated", plan.activity.pause_reason)
        self.run_async(_test())

    def test_09_emergency_symptoms_trigger_emergency_alert(self):
        """9. Emergency symptoms trigger emergency alert."""
        async def _test():
            user_id = f"test_user_emerg_{datetime.utcnow().timestamp()}"
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            await db.insert_one("emergency_alerts", {
                "user_id": user_id,
                "date": today_str,
                "is_emergency": True,
                "symptoms": {"chest_pain_or_pressure": True}
            })
            plan = await health_plan_service.get_or_create_daily_plan(user_id=user_id, force_regenerate=True)
            self.assertTrue(plan.safety.emergency)
            self.assertFalse(plan.safety.exercise_allowed)
            self.assertEqual(plan.safety.emergency_contacts["emergency"], "112")
            self.assertEqual(plan.safety.emergency_contacts["ambulance"], "108")
        self.run_async(_test())

    def test_10_existing_meal_analysis_values_correctly_reused(self):
        """10. Existing Meal Analysis values are correctly reused."""
        analysis = meal_analyzer.analyze_daily_meals({
            "breakfast": [{"food_name": "Vegetable Oats Upma", "servings": 1.0}],
            "lunch": [{"food_name": "Steamed Brown Rice", "servings": 1.0}, {"food_name": "Yellow Dal Tadka (Low Oil)", "servings": 1.0}],
            "snack": [{"food_name": "Roasted Makhana (Foxnuts)", "servings": 1.0}],
            "dinner": [{"food_name": "Lauki (Bottle Gourd) Sabzi", "servings": 1.0}]
        })
        self.assertIn("total_calories", analysis)
        self.assertIn("total_sodium_mg", analysis)
        self.assertIn("total_fiber_g", analysis)
        self.assertIn("total_protein_g", analysis)
        self.assertIn("diet_score", analysis)
        self.assertGreater(analysis["diet_score"], 0)

    def test_11_existing_lifestyle_score_remains_unchanged(self):
        """11. Existing Lifestyle Score remains unchanged."""
        test_profile = {
            "diet_preference": "vegetarian",
            "physical_activity": "moderate",
            "sleep_duration": 7.5,
            "smoking_status": "never",
            "stress_level": 2,
            "bmi": 23.5
        }
        res = calculate_lifestyle_score(test_profile, logged_diet_score=85)
        self.assertIn("overall_lifestyle_score", res)
        self.assertIn("diet_score", res)
        self.assertIn("activity_score", res)
        self.assertIn("sleep_score", res)
        self.assertIn("smoking_score", res)
        self.assertIn("stress_score", res)
        self.assertIn("bmi_score", res)
        self.assertEqual(res["diet_score"], 85)
        self.assertEqual(res["smoking_score"], 100)
        self.assertGreaterEqual(res["overall_lifestyle_score"], 80)

    def test_12_existing_ml_prediction_remains_unchanged(self):
        """12. Existing ML prediction remains unchanged."""
        test_data = {
            "age": 55,
            "sex": "male",
            "height_cm": 172.0,
            "weight_kg": 76.0,
            "bmi": 25.7,
            "systolic_bp": 135,
            "diastolic_bp": 85,
            "cholesterol": 210,
            "blood_glucose": 105,
            "resting_hr": 72,
            "smoking_status": "never",
            "diabetes_status": "none",
            "family_history": True,
            "physical_activity": "moderate",
            "sleep_duration": 7.0,
            "stress_level": 3,
            "alcohol_status": "none",
            "diet_preference": "vegetarian",
            "allergies": []
        }
        pred = prediction_service.predict_risk(test_data)
        self.assertIn("risk_probability", pred)
        self.assertIn("risk_percentage", pred)
        self.assertIn("risk_category", pred)
        self.assertIn(pred["risk_category"], ["LOW", "MODERATE", "HIGH"])
        self.assertIn("major_risk_factors", pred)
        self.assertIn("protective_factors", pred)

    def test_13_existing_authentication_remains_unchanged(self):
        """13. Existing authentication remains unchanged."""
        raw_pw = "CardioSecure99!"
        h = get_password_hash(raw_pw)
        self.assertTrue(verify_password(raw_pw, h))
        self.assertFalse(verify_password("WrongPassword", h))

        token = create_access_token({"sub": "user_auth_123"})
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        self.assertEqual(payload["sub"], "user_auth_123")

    def test_14_existing_history_remains_unchanged(self):
        """14. Existing history remains unchanged."""
        async def _test():
            user_id = f"test_user_hist_{datetime.utcnow().timestamp()}"
            await db.insert_one("daily_health_plans", {
                "user_id": user_id,
                "date": "2026-09-23",
                "risk_category": "MODERATE",
                "items": []
            })
            await db.insert_one("daily_health_plans", {
                "user_id": user_id,
                "date": "2026-09-24",
                "risk_category": "HIGH",
                "items": []
            })
            history = await health_plan_service.get_plan_history(user_id, limit=5)
            self.assertEqual(len(history), 2)
            self.assertEqual(history[0].date, "2026-09-24")
        self.run_async(_test())

    def test_15_existing_database_fallback_remains_functional(self):
        """15. Existing database fallback remains functional."""
        async def _test():
            test_coll = "test_verification"
            doc_id = await db.insert_one(test_coll, {"field": "value", "created_at": datetime.utcnow().isoformat()})
            self.assertIsNotNone(doc_id)
            found = await db.find_one(test_coll, {"_id": doc_id})
            self.assertIsNotNone(found)
            self.assertEqual(found["field"], "value")
            await db.update_one(test_coll, {"_id": doc_id}, {"field": "updated_value"})
            found2 = await db.find_one(test_coll, {"_id": doc_id})
            self.assertEqual(found2["field"], "updated_value")
            many = await db.find_many(test_coll, {"_id": doc_id})
            self.assertEqual(len(many), 1)
        self.run_async(_test())

if __name__ == "__main__":
    unittest.main()
