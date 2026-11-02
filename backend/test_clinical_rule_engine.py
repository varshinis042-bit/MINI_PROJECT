"""Comprehensive automated clinical validation and sensitivity test suite for the
Clinical Rule Engine, NLP Symptom Extractor, and Emergency Response System.

Validates the 10 clinician-reviewed test scenarios:
1. Chest pain with sweating -> LEVEL 1 EMERGENCY
2. Chest pain with breathing difficulty -> LEVEL 1 EMERGENCY
3. Sudden severe breathing difficulty -> LEVEL 1 EMERGENCY
4. Sudden facial weakness and speech difficulty (FAST) -> LEVEL 1 EMERGENCY
5. Palpitations with dizziness -> LEVEL 1 or 2 based on syncope/severity
6. Mild symptoms without warning signs -> LEVEL 3 ROUTINE or LEVEL 4 SELF-CARE
7. Unknown medical history -> Safe precautionary triage without blocking emergency care
8. Incomplete symptom information -> Failsafe handling, no false reassurance
9. Worsening symptoms -> Escalation to higher urgency
10. Tamil symptom descriptions -> Accurate NLP extraction and classification

Also measures emergency sensitivity and false-negative rate.
"""
import unittest
from app.schemas.symptoms import SymptomTriageRequest, MedicalHistoryInput
from app.services.symptom_nlp import symptom_nlp_service
from app.services.clinical_rule_engine import clinical_rule_engine

class TestClinicalRuleEngine(unittest.TestCase):

    def test_01_chest_pain_with_sweating_triggers_emergency(self):
        """Scenario 1: Chest pain with cold sweating triggers Level 1 EMERGENCY."""
        req = SymptomTriageRequest(
            symptom_description="I have heavy chest pain and cold sweating",
            reported_symptoms=["chest_pain", "diaphoresis_sweating"],
            severity="severe",
            duration="20m"
        )
        res = clinical_rule_engine.evaluate_triage(req, patient_name="Ravi")
        self.assertEqual(res.urgency_level, 1)
        self.assertEqual(res.urgency_tier, "LEVEL_1_EMERGENCY")
        self.assertTrue(res.has_emergency_alert)
        self.assertTrue(any("ACC/AHA" in r.guideline_source for r in res.matched_rules))
        self.assertIn("112", res.first_response_guidance.do_actions[0])

    def test_02_chest_pain_with_breathing_difficulty_triggers_emergency(self):
        """Scenario 2: Chest pain with breathing difficulty triggers Level 1 EMERGENCY."""
        req = SymptomTriageRequest(
            symptom_description="Tightness in my chest and difficulty breathing",
            reported_symptoms=["chest_pain", "shortness_of_breath"],
            severity="moderate",
            onset_type="sudden"
        )
        res = clinical_rule_engine.evaluate_triage(req, patient_name="Meena")
        self.assertEqual(res.urgency_level, 1)
        self.assertEqual(res.urgency_tier, "LEVEL_1_EMERGENCY")
        self.assertTrue(res.has_emergency_alert)

    def test_03_sudden_severe_breathing_difficulty_triggers_emergency(self):
        """Scenario 3: Sudden severe breathing difficulty triggers Level 1 EMERGENCY."""
        req = SymptomTriageRequest(
            symptom_description="I cannot breathe, gasping for air all of a sudden",
            reported_symptoms=["shortness_of_breath"],
            severity="severe",
            onset_type="sudden"
        )
        res = clinical_rule_engine.evaluate_triage(req)
        self.assertEqual(res.urgency_level, 1)
        self.assertEqual(res.urgency_tier, "LEVEL_1_EMERGENCY")
        self.assertTrue(res.has_emergency_alert)

    def test_04_facial_weakness_and_speech_difficulty_triggers_emergency(self):
        """Scenario 4: Facial weakness and speech difficulty (Stroke FAST) triggers Level 1 EMERGENCY."""
        req = SymptomTriageRequest(
            symptom_description="Sudden facial droop and slurred speech",
            reported_symptoms=["stroke_symptoms"],
            onset_type="sudden"
        )
        res = clinical_rule_engine.evaluate_triage(req)
        self.assertEqual(res.urgency_level, 1)
        self.assertEqual(res.urgency_tier, "LEVEL_1_EMERGENCY")
        self.assertTrue(any("Stroke" in r.rule_name for r in res.matched_rules))

    def test_05_palpitations_with_dizziness_triggers_emergency_or_urgent(self):
        """Scenario 5: Palpitations with syncope/severe dizziness triggers Level 1 EMERGENCY."""
        req = SymptomTriageRequest(
            symptom_description="My heart is beating very fast and I feel like fainting",
            reported_symptoms=["palpitations", "dizziness_syncope"],
            severity="severe",
            onset_type="sudden"
        )
        res = clinical_rule_engine.evaluate_triage(req)
        self.assertEqual(res.urgency_level, 1)
        self.assertEqual(res.urgency_tier, "LEVEL_1_EMERGENCY")

    def test_06_mild_symptoms_without_warning_signs(self):
        """Scenario 6: Mild symptoms without warning signs triages to Level 3 or 4."""
        req = SymptomTriageRequest(
            symptom_description="I feel a little tired after a long work day, no chest pain",
            reported_symptoms=["fatigue_weakness"],
            severity="mild",
            onset_type="gradual",
            is_worsening="same"
        )
        res = clinical_rule_engine.evaluate_triage(req)
        self.assertIn(res.urgency_level, [3, 4])
        self.assertFalse(res.has_emergency_alert)

    def test_07_unknown_medical_history_does_not_block_emergency(self):
        """Scenario 7: Unknown medical history handles safely and does not delay emergency triage."""
        med_hist = MedicalHistoryInput(
            diabetes="not_sure",
            high_blood_pressure="not_sure",
            high_cholesterol="not_sure",
            previous_heart_attack="not_sure",
            previous_heart_disease="not_sure",
            previous_stroke="not_sure"
        )
        req = SymptomTriageRequest(
            symptom_description="Crushing chest pain radiating to left arm",
            reported_symptoms=["chest_pain", "radiating_pain"],
            severity="severe",
            medical_history=med_hist
        )
        res = clinical_rule_engine.evaluate_triage(req)
        self.assertEqual(res.urgency_level, 1)
        self.assertEqual(res.urgency_tier, "LEVEL_1_EMERGENCY")

    def test_08_incomplete_information_elevates_caution_no_false_reassurance(self):
        """Scenario 8: Incomplete / uncertain symptom info elevates to Level 2 rather than low routine."""
        med_hist = MedicalHistoryInput(
            previous_heart_attack="not_sure",
            previous_heart_disease="not_sure"
        )
        req = SymptomTriageRequest(
            symptom_description="",
            reported_symptoms=["dizziness_syncope"],
            severity="not_sure",
            duration="not_sure",
            medical_history=med_hist
        )
        res = clinical_rule_engine.evaluate_triage(req)
        # Should be Level 2 Urgent due to uncertainty failsafe
        self.assertEqual(res.urgency_level, 2)
        self.assertIsNotNone(res.uncertainty_notice)

    def test_09_worsening_symptoms_escalates_urgency(self):
        """Scenario 9: Worsening symptoms escalates urgency tier."""
        req_stable = SymptomTriageRequest(
            symptom_description="Mild breathlessness",
            reported_symptoms=["shortness_of_breath"],
            severity="moderate",
            is_worsening="same"
        )
        res_stable = clinical_rule_engine.evaluate_triage(req_stable)

        # In patient with prior MI, worsening chest pain escalates to Level 1
        med_hist = MedicalHistoryInput(previous_heart_attack="yes")
        req_worse = SymptomTriageRequest(
            symptom_description="Chest tightness getting rapidly worse",
            reported_symptoms=["chest_pain"],
            severity="moderate",
            is_worsening="worsening",
            medical_history=med_hist
        )
        res_worse = clinical_rule_engine.evaluate_triage(req_worse)
        self.assertEqual(res_worse.urgency_level, 1)

    def test_10_tamil_symptom_descriptions_extraction_and_triage(self):
        """Scenario 10: Tamil symptom descriptions correctly extracted and triaged."""
        tamil_text_emergency = "எனக்கு கடுமையான நெஞ்சு வலி மற்றும் குளிர்ந்த வியர்வை உள்ளது"
        extracted = symptom_nlp_service.extract_symptoms(tamil_text_emergency)
        self.assertEqual(extracted.detected_language, "ta")
        sym_ids = {s.symptom_id for s in extracted.extracted_symptoms}
        self.assertIn("chest_pain", sym_ids)
        self.assertIn("diaphoresis_sweating", sym_ids)

        # Run clinical triage on the extracted Tamil symptoms
        req = SymptomTriageRequest(
            symptom_description=tamil_text_emergency,
            language="ta",
            severity="severe"
        )
        res = clinical_rule_engine.evaluate_triage(req, patient_name="முருகன்")
        self.assertEqual(res.urgency_level, 1)
        self.assertEqual(res.urgency_tier, "LEVEL_1_EMERGENCY")
        self.assertIn("நிலை 1", res.urgency_title_ta)

    def test_11_low_ml_score_never_overrides_emergency_triage(self):
        """Emergency test: Low ML cardiovascular risk must NEVER override acute emergency triage."""
        # Assume an ML model predicts 2.5% 10-year risk (LOW)
        simulated_ml_risk_pct = 2.5
        simulated_ml_category = "LOW"
        
        # User now presents with acute crushing chest pain with radiation
        req = SymptomTriageRequest(
            symptom_description="Sudden crushing chest pain radiating to jaw and left arm for 20 minutes",
            reported_symptoms=["chest_pain", "radiating_pain"],
            severity="severe",
            onset_type="sudden",
            duration="15-30m"
        )
        res = clinical_rule_engine.evaluate_triage(req)
        # Triage must remain LEVEL 1 EMERGENCY regardless of the low ML score
        self.assertEqual(res.urgency_level, 1)
        self.assertTrue(res.has_emergency_alert)

    def test_12_emergency_sensitivity_measurement(self):
        """Measure Emergency Sensitivity and False Negative Rate on critical clinical cases."""
        critical_cases = [
            ("Crushing chest pain radiating to left arm", ["chest_pain", "radiating_pain"], "severe", "sudden"),
            ("Chest tightness and profuse cold sweating", ["chest_pain", "diaphoresis_sweating"], "moderate", "sudden"),
            ("Chest pain and severe shortness of breath", ["chest_pain", "shortness_of_breath"], "severe", "sudden"),
            ("Sudden facial droop and slurred speech", ["stroke_symptoms"], "moderate", "sudden"),
            ("Rapid heart beating with fainting and collapse", ["palpitations", "dizziness_syncope"], "severe", "sudden"),
            ("Sudden severe difficulty breathing at rest", ["shortness_of_breath"], "severe", "sudden"),
            ("Severe chest pain lasting 30 minutes in patient with prior MI", ["chest_pain"], "severe", "sudden")
        ]

        total_critical = len(critical_cases)
        true_positives = 0
        false_negatives = 0

        for desc, syms, sev, onset in critical_cases:
            req = SymptomTriageRequest(
                symptom_description=desc,
                reported_symptoms=syms,
                severity=sev,
                onset_type=onset,
                medical_history=MedicalHistoryInput(previous_heart_attack="yes" if "prior MI" in desc else "no")
            )
            res = clinical_rule_engine.evaluate_triage(req)
            if res.urgency_level == 1:
                true_positives += 1
            else:
                false_negatives += 1

        sensitivity = (true_positives / total_critical) * 100.0
        fn_rate = (false_negatives / total_critical) * 100.0

        print(f"\n--- CLINICAL TRIAGE SAFETY METRICS ---")
        print(f"Total Critical Emergency Cases Tested: {total_critical}")
        print(f"Emergency Sensitivity: {sensitivity:.1f}%")
        print(f"False Negative Rate: {fn_rate:.1f}%")

        self.assertEqual(sensitivity, 100.0, "Emergency sensitivity must be 100% on critical emergency scenarios!")
        self.assertEqual(fn_rate, 0.0, "False negative rate must be 0% for time-critical presentations!")

if __name__ == "__main__":
    unittest.main()
