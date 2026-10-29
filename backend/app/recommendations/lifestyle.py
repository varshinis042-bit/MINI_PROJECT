"""Transparent multi-pillar cardiovascular lifestyle risk scoring engine."""
from typing import Any, Dict, Optional

def calculate_lifestyle_score(profile: Dict[str, Any], logged_diet_score: Optional[int] = None) -> Dict[str, Any]:
    # 1. Diet Pillar (0 - 100)
    if logged_diet_score is not None and 0 <= logged_diet_score <= 100:
        diet_score = logged_diet_score
    else:
        pref = profile.get("diet_preference", "vegetarian")
        diet_score = 75 if pref in ["vegetarian", "vegan"] else 65

    # 2. Physical Activity Pillar (0 - 100)
    act = profile.get("physical_activity", "moderate").lower()
    activity_map = {
        "very_active": 100,
        "active": 85,
        "moderate": 70,
        "light": 45,
        "sedentary": 20
    }
    activity_score = activity_map.get(act, 60)

    # 3. Sleep Pillar (0 - 100)
    sleep = float(profile.get("sleep_duration", 7.0))
    if 7.0 <= sleep <= 8.5:
        sleep_score = 100
    elif (6.0 <= sleep < 7.0) or (8.5 < sleep <= 9.5):
        sleep_score = 80
    elif 5.0 <= sleep < 6.0:
        sleep_score = 55
    else:
        sleep_score = 30

    # 4. Smoking Pillar (0 - 100)
    smoke = profile.get("smoking_status", "never").lower()
    if smoke == "never":
        smoking_score = 100
    elif smoke == "former":
        smoking_score = 65
    else:
        smoking_score = 15

    # 5. Stress Pillar (0 - 100)
    stress = int(profile.get("stress_level", 3))
    stress_map = {1: 100, 2: 85, 3: 65, 4: 40, 5: 20}
    stress_score = stress_map.get(stress, 65)

    # 6. BMI Pillar (0 - 100)
    bmi = float(profile.get("bmi", 24.0))
    if 18.5 <= bmi <= 24.9:
        bmi_score = 100
    elif 25.0 <= bmi <= 27.9:
        bmi_score = 80
    elif 28.0 <= bmi <= 29.9:
        bmi_score = 60
    elif 30.0 <= bmi <= 34.9:
        bmi_score = 40
    else:
        bmi_score = 25

    # Weighted Overall Composite Score
    # Weights: Diet (0.25), Activity (0.20), Sleep (0.15), Smoking (0.20), Stress (0.10), BMI (0.10)
    overall = (
        0.25 * diet_score +
        0.20 * activity_score +
        0.15 * sleep_score +
        0.20 * smoking_score +
        0.10 * stress_score +
        0.10 * bmi_score
    )
    overall_score = int(round(overall))

    if overall_score >= 80:
        category = "OPTIMAL_LIFESTYLE"
    elif overall_score >= 60:
        category = "MODERATE_LIFESTYLE"
    else:
        category = "HIGH_RISK_LIFESTYLE"

    interpretations = {
        "diet": f"{diet_score}/100 - " + ("Heart-protective dietary habits." if diet_score >= 75 else "Room to improve sodium, fiber, and saturated fat balance."),
        "activity": f"{activity_score}/100 - " + ("Cardiorespiratory fitness supported." if activity_score >= 70 else "Increase moderate-intensity aerobic movement."),
        "sleep": f"{sleep_score}/100 - " + (f"{sleep}h per night supports circadian cardiac recovery." if sleep_score >= 80 else f"{sleep}h sleep alters autonomic tone."),
        "smoking": f"{smoking_score}/100 - " + ("Non-smoker: Zero direct tobacco vascular toxin exposure." if smoking_score == 100 else "Active or former smoke exposure degrades endothelial integrity."),
        "stress": f"{stress_score}/100 - " + ("Manageable autonomic stress levels." if stress_score >= 65 else "Elevated chronic stress stimulates sympathetic cortisol axis."),
        "bmi": f"{bmi_score}/100 - " + (f"BMI {bmi} is in the normal cardiometabolic range." if bmi_score >= 80 else f"BMI {bmi} contributes to excess cardiac workload.")
    }

    return {
        "overall_lifestyle_score": overall_score,
        "diet_score": diet_score,
        "activity_score": activity_score,
        "sleep_score": sleep_score,
        "smoking_score": smoking_score,
        "stress_score": stress_score,
        "bmi_score": bmi_score,
        "category": category,
        "pillar_interpretations": interpretations
    }