"""Conservative, safety-focused cardiovascular exercise recommendations."""
from typing import Any, Dict, List

def generate_exercise_recommendations(profile: Dict[str, Any], risk_category: str = "MODERATE") -> Dict[str, Any]:
    sbp = profile.get("systolic_bp", 120)
    dbp = profile.get("diastolic_bp", 80)
    act = profile.get("physical_activity", "moderate").lower()
    age = profile.get("age", 45)

    # 1. Critical Red Flag Safety Contraindication Check
    is_severe_hypertension = sbp >= 180 or dbp >= 110
    if is_severe_hypertension:
        return {
            "exercise_permitted": False,
            "safety_status": "CONTRAINDICATED_SEVERE_BP",
            "warning_message": (
                f"SAFETY ADVISORY: Blood pressure ({sbp}/{dbp} mmHg) indicates severe hypertension. "
                "Unsupervised cardiovascular exertion is strictly contraindicated. "
                "Consult a licensed physician for clinical stabilization before initiating any exercise."
            ),
            "weekly_routine": [],
            "warmup_cooldown": [],
            "safety_guidelines": [
                "Do not engage in aerobic training or resistance lifting until cleared by a physician.",
                "Avoid holding your breath (Valsalva maneuver).",
                "Rest quietly and monitor vital signs."
            ]
        }

    # 2. Conservative Tiered Activity Planning
    if risk_category == "HIGH":
        aerobic_desc = "Gentle, low-impact walking on flat terrain (20-25 mins at conversational pace, RPE 3-4/10)."
        weekly_target = "100-120 minutes weekly, divided into 15-20 minute intervals."
        yoga_asanas = ["Anulom Vilom (Gentle alternate nostril breathing)", "Shavasana (Relaxation posture)", "Tadasana (Mountain pose)"]
    elif risk_category == "MODERATE":
        aerobic_desc = "Brisk walking, light stationary cycling, or gentle swimming (30 mins at RPE 4-5/10)."
        weekly_target = "150 minutes weekly of moderate-intensity aerobic physical activity."
        yoga_asanas = ["Vrikshasana (Tree pose)", "Bhujangasana (Gentle cobra pose)", "Pranayama (Deep diaphragmatic breathing)"]
    else:  # LOW risk
        aerobic_desc = "Brisk walking, jogging, cycling, or recreational sports (30-45 mins, RPE 5-6/10)."
        weekly_target = "150-200 minutes weekly of moderate-to-vigorous cardiovascular activity."
        yoga_asanas = ["Surya Namaskar (Slow paced)", "Veerabhadrasana (Warrior pose)", "Pawanmuktasana"]

    weekly_routine = [
        {"day": "Monday", "type": "Aerobic Cardio", "activity": aerobic_desc, "duration": "25-30 mins"},
        {"day": "Tuesday", "type": "Flexibility & Breath", "activity": "Gentle stretching and yoga postures: " + ", ".join(yoga_asanas[:2]), "duration": "20 mins"},
        {"day": "Wednesday", "type": "Aerobic Cardio", "activity": "Walking or light cycling at steady cadence", "duration": "25-30 mins"},
        {"day": "Thursday", "type": "Active Recovery", "activity": "Leisure stroll and deep diaphragmatic breathing", "duration": "20 mins"},
        {"day": "Friday", "type": "Aerobic Cardio", "activity": aerobic_desc, "duration": "25-30 mins"},
        {"day": "Saturday", "type": "Gentle Mobility", "activity": "Full-body joint mobility, calf raises, and posture training", "duration": "25 mins"},
        {"day": "Sunday", "type": "Rest & Recuperation", "activity": "Complete rest, relaxation, and adequate sleep", "duration": "Rest"}
    ]

    warmup_cooldown = [
        "Warm-up (5-8 mins): Gentle neck rolls, shoulder shrugs, ankle rotations, and slow indoor pacing.",
        "Cool-down (5 mins): Gradual deceleration to resting heart rate, followed by hamstring and calf stretches."
    ]

    safety_rules = [
        "STOP EXERCISING IMMEDIATELY and seek emergency evaluation if you experience chest tightness, pain radiating to the jaw/arm, sudden dizziness, or excessive shortness of breath.",
        "Stay adequately hydrated before, during, and after exercise.",
        "Never exercise immediately after a heavy meal; wait at least 90 minutes.",
        "Check with your cardiologist before increasing exercise intensity if you are taking beta-blockers or anti-hypertensives."
    ]

    return {
        "exercise_permitted": True,
        "risk_tier": risk_category,
        "weekly_target": weekly_target,
        "recommended_aerobic": aerobic_desc,
        "weekly_routine": weekly_routine,
        "warmup_cooldown": warmup_cooldown,
        "safety_guidelines": safety_rules,
        "disclaimer": (
            "These activity recommendations are general preventive wellness guidelines for educational purposes. "
            "Patients with known cardiovascular disease, arrhythmias, or symptoms should undergo clinical exercise stress testing."
        )
    }