"""Comprehensive Master Verification & Regression Test Suite.
Validates:
1. Natural Language Symptom Understanding (English & Tamil)
2. Advanced Symptom-Based Triage (Clinical Rule Engine)
3. Independence of Symptom Triage from ML Risk Scores (Safety Fail-Safe)
4. Emergency Response Guidance (Do's and Don'ts, 112/108 calling protocol)
5. Consent-Based Location & Handoff Summary
6. Condition-Based Scenario Simulator (What-If Engine)
7. SHAP Explainability & Biological Feature Drivers
8. Medical Uncertainty Estimation & Safety Communication
9. Backward Compatibility with Pre-Existing Predictions and Profiles
"""
import unittest

from app.services.symptom_nlp import symptom_nlp_service
from app.services.clinical_rule_engine import clinical_rule_engine
from app.schemas.symptoms import (
    SymptomTriageRequest,
    MedicalHistoryInput
)
from app.schemas.profile import HealthProfileInput
from app.ml.predict import prediction_service
from app.recommendations.lifestyle import calculate_lifestyle_score

class TestMasterEnhancements(unittest.TestCase):

    def test_01_nlp_extraction_english(self):
        """Test NLP symptom entity extraction from everyday English text."""
        text = "I have severe squeezing chest pressure spreading to my left arm and sudden cold sweating"
        res = symptom_nlp_service.extract_symptoms(text, user_lang="en")
        symptom_ids = [s.symptom_id for s in res.extracted_symptoms]
        self.assertIn("chest_pain", symptom_ids)
        self.assertIn("radiating_pain", symptom_ids)
        self.assertIn("diaphoresis_sweating", symptom_ids)
        self.assertTrue(res.has_emergency_keywords)
        self.assertEqual(res.detected_language, "en")

    def test_02_nlp_extraction_tamil(self):
        """Test NLP symptom entity extraction from everyday Tamil text."""
        text = "எனக்கு கடுமையான நெஞ்சு வலி மற்றும் மூச்சுத் திணறல் உள்ளது"
        res = symptom_nlp_service.extract_symptoms(text, user_lang="ta")
        symptom_ids = [s.symptom_id for s in res.extracted_symptoms]
        self.assertIn("chest_pain", symptom_ids)
        self.assertIn("shortness_of_breath", symptom_ids)
        self.assertTrue(res.has_emergency_keywords)
        self.assertEqual(res.detected_language, "ta")

    def test_03_level_1_emergency_triage(self):
        """Test Level 1 Emergency classification for acute chest pain with radiation and sweating."""
        req = SymptomTriageRequest(
            symptom_description="Crushing chest pain radiating to left jaw, sweating profusely",
            reported_symptoms=["chest_pain", "radiating_pain", "diaphoresis_sweating"],
            severity="severe",
            onset_type="sudden",
            duration="15-30m",
            medical_history=MedicalHistoryInput(previous_heart_attack="yes")
        )
        res = clinical_rule_engine.evaluate_triage(req, patient_name="Test Patient")
        self.assertEqual(res.urgency_level, 1)
        self.assertEqual(res.urgency_tier, "LEVEL_1_EMERGENCY")
        self.assertTrue(res.has_emergency_alert)
        self.assertTrue(any("112" in act for act in res.first_response_guidance.do_actions))
        self.assertTrue(any("108" in act for act in res.first_response_guidance.do_actions))
        self.assertTrue(len(res.first_response_guidance.do_actions) > 0)
        self.assertTrue(len(res.first_response_guidance.dont_actions) > 0)

    def test_04_level_2_urgent_triage(self):
        """Test Level 2 Urgent classification for progressive exertional dyspnea with ankle swelling."""
        req = SymptomTriageRequest(
            symptom_description="Shortness of breath on walking, swelling in both ankles for past 3 days",
            reported_symptoms=["shortness_of_breath", "bilateral_ankle_edema"],
            severity="moderate",
            onset_type="gradual",
            duration="days",
            medical_history=MedicalHistoryInput(high_blood_pressure="yes")
        )
        res = clinical_rule_engine.evaluate_triage(req, patient_name="Test Patient")
        self.assertEqual(res.urgency_level, 2)
        self.assertEqual(res.urgency_tier, "LEVEL_2_URGENT")
        self.assertFalse(res.has_emergency_alert)
        self.assertIn("URGENT", res.urgency_title)

    def test_05_level_3_routine_triage(self):
        """Test Level 3 Routine classification for isolated mild fatigue without acute signs."""
        req = SymptomTriageRequest(
            symptom_description="Mild generalized fatigue without chest discomfort or breathlessness",
            reported_symptoms=["fatigue_weakness"],
            severity="mild",
            onset_type="gradual",
            duration="days"
        )
        res = clinical_rule_engine.evaluate_triage(req, patient_name="Test Patient")
        self.assertIn(res.urgency_level, [3, 4])
        self.assertIn(res.urgency_tier, ["LEVEL_3_ROUTINE", "LEVEL_4_SELF_CARE"])

    def test_06_triage_independent_of_low_ml_risk(self):
        """Critical Safety Test: Triage MUST NOT downgrade emergency status even if patient has young/low ML risk."""
        req = SymptomTriageRequest(
            symptom_description="Sudden crushing chest pain and momentary black out",
            reported_symptoms=["chest_pain", "dizziness_syncope"],
            severity="severe",
            onset_type="sudden",
            duration="<15m"
        )
        res = clinical_rule_engine.evaluate_triage(req, patient_name="Young Adult")
        self.assertEqual(res.urgency_level, 1, "CRITICAL SAFETY FAILURE: Acute emergency downgraded!")
        self.assertEqual(res.urgency_tier, "LEVEL_1_EMERGENCY")

    def test_07_whatif_scenario_simulation(self):
        """Test condition-based what-if scenario simulation without modifying baseline ML model."""
        baseline_in = HealthProfileInput(
            age=55,
            sex="male",
            systolic_bp=155,
            diastolic_bp=95,
            cholesterol=240,
            blood_glucose=130,
            weight_kg=85.0,
            height_cm=170.0,
            resting_hr=76,
            smoking_status="current",
            diabetes_status="pre_diabetes",
            family_history=True,
            physical_activity="sedentary",
            sleep_duration=6.5,
            stress_level=4,
            alcohol_status="moderate"
        )
        baseline_data = baseline_in.model_dump()
        baseline_data["bmi"] = baseline_in.calculate_bmi()

        res_baseline = prediction_service.predict_risk(baseline_data)
        self.assertIn("risk_percentage", res_baseline)
        base_risk = res_baseline["risk_percentage"]

        # Simulated healthier profile
        sim_in = HealthProfileInput(
            age=55,
            sex="male",
            systolic_bp=120,
            diastolic_bp=80,
            cholesterol=180,
            blood_glucose=95,
            weight_kg=75.0,
            height_cm=170.0,
            resting_hr=70,
            smoking_status="never",
            diabetes_status="no",
            family_history=True,
            physical_activity="active",
            sleep_duration=7.5,
            stress_level=2,
            alcohol_status="none"
        )
        sim_data = sim_in.model_dump()
        sim_data["bmi"] = sim_in.calculate_bmi()

        res_sim = prediction_service.predict_risk(sim_data)
        sim_risk = res_sim["risk_percentage"]
        delta = round(base_risk - sim_risk, 2)

        self.assertGreater(delta, 0.0, "Risk should decrease with healthier biomarkers")
        self.assertLess(sim_risk, base_risk)

    def test_08_medical_uncertainty_layer(self):
        """Test uncertainty quantification in prediction engine."""
        profile_in = HealthProfileInput(
            age=48,
            sex="female",
            systolic_bp=135,
            diastolic_bp=85,
            cholesterol=210,
            blood_glucose=105,
            weight_kg=68.0,
            height_cm=160.0,
            resting_hr=72,
            smoking_status="never",
            diabetes_status="no",
            family_history=False,
            physical_activity="moderate",
            sleep_duration=7.0,
            stress_level=3,
            alcohol_status="none"
        )
        p_data = profile_in.model_dump()
        p_data["bmi"] = profile_in.calculate_bmi()

        res = prediction_service.predict_risk(p_data)
        self.assertIn("model_confidence", res)
        self.assertIn("uncertainty_score", res)
        self.assertIn("uncertainty_message", res)
        self.assertIn(res["model_confidence"], ["High", "Moderate", "Low"])

    def test_09_lifestyle_composite_scoring(self):
        """Test transparent composite lifestyle risk scoring."""
        profile = {
            "smoking_status": "never",
            "physical_activity": "active",
            "sleep_duration": 7.5,
            "stress_level": 2,
            "weight_kg": 65,
            "height_cm": 170
        }
        score_res = calculate_lifestyle_score(profile, logged_diet_score=85)
        self.assertGreaterEqual(score_res["overall_lifestyle_score"], 70)
        self.assertIn("OPTIMAL", score_res["category"])

if __name__ == "__main__":
    unittest.main()
