"""End-to-end automated validation script testing all 16 core API endpoints."""
import json
import requests

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== STARTING END-TO-END VALIDATION TESTS ===")

    # 1. Health check
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    health = r.json()
    print("1. [PASS] Health Check:", health["status"], "| Database Mode:", health["database_mode"])

    # 2. Auth: Register
    reg_payload = {"email": "test.cardiologist@hospital.org", "full_name": "Dr. Ananya Sen", "password": "SecurePassword123!"}
    r = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if r.status_code == 400:
        # Already registered, log in
        r = requests.post(f"{BASE_URL}/auth/login", json={"email": reg_payload["email"], "password": reg_payload["password"]})
    assert r.status_code in [200, 201], f"Auth register/login failed: {r.text}"
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("2. [PASS] Auth Registration/Login: Token acquired successfully.")

    # 3. Auth: Current User Me
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert r.status_code == 200
    print("3. [PASS] Auth Me:", r.json()["full_name"])

    # 4. Profile
    r = requests.get(f"{BASE_URL}/profile", headers=headers)
    assert r.status_code == 200
    print("4. [PASS] User Profile Retrieval: Age", r.json()["age"])

    # 5. Prediction with Stacking Ensemble
    test_patient = {
        "age": 58,
        "sex": "male",
        "height_cm": 172.0,
        "weight_kg": 84.0,
        "bmi": 28.4,
        "systolic_bp": 148,
        "diastolic_bp": 94,
        "cholesterol": 245,
        "blood_glucose": 132,
        "resting_hr": 78,
        "smoking_status": "current",
        "diabetes_status": "type2",
        "family_history": True,
        "physical_activity": "sedentary",
        "sleep_duration": 5.5,
        "stress_level": 4,
        "alcohol_status": "moderate",
        "diet_preference": "vegetarian",
        "allergies": []
    }
    r = requests.post(f"{BASE_URL}/predict", json=test_patient, headers=headers)
    assert r.status_code == 200, f"Prediction failed: {r.text}"
    pred = r.json()
    pred_id = pred["prediction_id"]
    print(f"5. [PASS] Risk Prediction: {pred['risk_percentage']}% | Category: {pred['risk_category']} | Uncertainty: {pred['model_confidence']} | ID: {pred_id}")

    # 6. SHAP Explainability
    r = requests.get(f"{BASE_URL}/explain/{pred_id}", headers=headers)
    assert r.status_code == 200, f"SHAP failed: {r.text}"
    shap_res = r.json()
    top_pos = [f["feature_name"] for f in shap_res["top_positive_contributors"][:3]]
    print(f"6. [PASS] SHAP Attributions: Base Value: {shap_res['base_value']} | Top Risk Drivers: {top_pos}")

    # 7. Indian Diet Recommendation
    r = requests.get(f"{BASE_URL}/diet/recommendations?prediction_id={pred_id}", headers=headers)
    assert r.status_code == 200
    diet = r.json()
    b_items = [f["name"] for f in diet["breakfast"]]
    print(f"7. [PASS] Indian Diet Plan: Breakfast items: {b_items} | Total Calories: {diet['daily_macros']['calories']} kcal")

    # 8. Dynamic Meal Analysis
    meal_log = {
        "breakfast_items": [{"food_name": "Steamed Idli (2 pieces)", "servings": 2}],
        "lunch_items": [{"food_name": "Yellow Dal Tadka (Low Oil)", "servings": 1}, {"food_name": "Biryani", "servings": 1}],
        "snack_items": [{"food_name": "Roasted Makhana (Foxnuts)", "servings": 1}],
        "dinner_items": [{"food_name": "Moong Dal Khichdi with Vegetables", "servings": 1}]
    }
    r = requests.post(f"{BASE_URL}/diet/analyze-meal", json=meal_log, headers=headers)
    assert r.status_code == 200
    analysis = r.json()
    print(f"8. [PASS] Dynamic Meal Analysis: Diet Score: {analysis['diet_score']}/100 | Sodium: {analysis['total_sodium_mg']} mg | Flagged Issues: {len(analysis['potential_issues'])}")

    # 9. Lifestyle Score
    r = requests.get(f"{BASE_URL}/lifestyle/score", headers=headers)
    assert r.status_code == 200
    life = r.json()
    print(f"9. [PASS] Lifestyle Score: {life['overall_lifestyle_score']}/100 | Category: {life['category']}")

    # 10. Exercise Recommendations
    r = requests.get(f"{BASE_URL}/exercise/recommendations?prediction_id={pred_id}", headers=headers)
    assert r.status_code == 200
    ex = r.json()
    print(f"10. [PASS] Exercise Guidance: Permitted: {ex['exercise_permitted']} | Weekly Target: {ex['weekly_target']}")

    # 11. What-If Counterfactual Simulator
    whatif_req = {
        "prediction_id": pred_id,
        "target_systolic_bp": 122,
        "target_diastolic_bp": 80,
        "target_cholesterol": 185,
        "target_blood_glucose": 95,
        "target_smoking_status": "never",
        "target_physical_activity": "active"
    }
    r = requests.post(f"{BASE_URL}/what-if", json=whatif_req)
    assert r.status_code == 200
    whatif = r.json()
    print(f"11. [PASS] What-If Simulation: Baseline: {whatif['baseline_risk_percentage']}% -> Simulated: {whatif['simulated_risk_percentage']}% (Delta: {whatif['risk_delta_percentage']}%)")

    # 12. Progress Tracking
    r = requests.get(f"{BASE_URL}/progress", headers=headers)
    assert r.status_code == 200
    records = r.json()
    print(f"12. [PASS] Progress Records: Retrieved {len(records)} historical tracking points.")

    # 13. Emergency Symptom Check (Trigger Red-Flag)
    emergency_req = {
        "chest_pressure_or_pain": True,
        "pain_radiating_arm_jaw_back": True,
        "cold_sweating": True,
        "shortness_of_breath": True,
        "sudden_onset": True
    }
    r = requests.post(f"{BASE_URL}/emergency/check", json=emergency_req)
    assert r.status_code == 200
    em = r.json()
    assert em["is_emergency"] == True
    print(f"13. [PASS] Emergency Triage: Triggered Critical Alert: '{em['headline_warning']}'")

    # 14. Academic Model Metrics
    r = requests.get(f"{BASE_URL}/model/metrics")
    assert r.status_code == 200
    metrics = r.json()
    best = metrics["best_model_name"]
    stacking_acc = metrics["stacking_ensemble"]["accuracy"]
    stacking_recall = metrics["stacking_ensemble"]["recall"]
    print(f"14. [PASS] Model Metrics: Best Model: {best} | Stacking Accuracy: {stacking_acc*100:.1f}% | Stacking Recall: {stacking_recall*100:.1f}%")

    # 15. Demographic Fairness
    r = requests.get(f"{BASE_URL}/model/fairness")
    assert r.status_code == 200
    fairness = r.json()
    sex_groups = list(fairness.get("by_sex", {}).keys())
    age_groups = list(fairness.get("by_age_group", {}).keys())
    print(f"15. [PASS] Demographic Fairness: Evaluated cohorts across Sex {sex_groups} and Age brackets {age_groups}")

    # 16. Medication Reminders System
    new_rem = {
        "medicine_name": "Atorvastatin 10mg",
        "dosage": "1 tablet at night",
        "time": "21:00",
        "frequency": "Daily",
        "notes": "Take with water after dinner"
    }
    r = requests.post(f"{BASE_URL}/reminders", json=new_rem, headers=headers)
    assert r.status_code == 201
    rem_created = r.json()
    rem_id = rem_created["id"]

    # Mark taken
    r = requests.post(f"{BASE_URL}/reminders/{rem_id}/taken", headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "taken"

    # List reminders
    r = requests.get(f"{BASE_URL}/reminders", headers=headers)
    assert r.status_code == 200
    all_rems = r.json()
    assert len(all_rems) > 0
    print(f"16. [PASS] Medication Reminders: Created '{new_rem['medicine_name']}' (ID: {rem_id}), marked taken, retrieved {len(all_rems)} reminders.")

    # 17. Personalized Daily Health Alerts & Smart Routine
    # 17a. Unauthorized check
    unauth_r = requests.get(f"{BASE_URL}/health-plan/today")
    assert unauth_r.status_code == 401, f"Unauthorized protection failed: {unauth_r.status_code}"

    # 17b. Get today's plan
    r = requests.get(f"{BASE_URL}/health-plan/today?timezone=Asia/Kolkata", headers=headers)
    assert r.status_code == 200, f"Health plan retrieval failed: {r.text}"
    plan = r.json()
    assert len(plan["items"]) > 0, "Daily health plan items empty"
    plan_cats = {i["category"] for i in plan["items"]}
    assert "BREAKFAST" in plan_cats and "LUNCH" in plan_cats and "DINNER" in plan_cats

    # 17c. Medication reminders integration verification
    med_items = [i for i in plan["items"] if i["category"] == "MEDICATION"]
    assert len(med_items) > 0, "User medication reminders not integrated into daily plan"

    # 17d. Item completion
    target_item = plan["items"][0]
    r = requests.post(f"{BASE_URL}/health-plan/{target_item['id']}/complete", json={"completed": True}, headers=headers)
    assert r.status_code == 200
    assert r.json()["completed_count"] >= 1

    # 17e. Notifications and preferences
    r = requests.get(f"{BASE_URL}/notifications", headers=headers)
    assert r.status_code == 200
    notifs = r.json()
    if notifs:
        r = requests.post(f"{BASE_URL}/notifications/{notifs[0]['id']}/read", headers=headers)
        assert r.status_code == 200

    r = requests.get(f"{BASE_URL}/notifications/preferences", headers=headers)
    assert r.status_code == 200
    r = requests.put(f"{BASE_URL}/notifications/preferences", json={**r.json(), "timezone": "Asia/Kolkata"}, headers=headers)
    assert r.status_code == 200 and r.json()["timezone"] == "Asia/Kolkata"

    print(f"17. [PASS] Daily Health Plan & Smart Routine: Generated {len(plan['items'])} milestones ({len(med_items)} meds integrated), completed items, managed notifications and preferences.")

    print("\n=======================================================")
    print("ALL 17 END-TO-END TEST SUITES PASSED WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()