"""SHAP explainability engine for cardiovascular risk predictions."""
import logging
from typing import Any, Dict, List
import numpy as np
import shap
from app.ml.preprocessing import engineer_features, get_feature_names

logger = logging.getLogger("cardio.explain")

FEATURE_DISPLAY_MAPPING = {
    "age": "Age",
    "systolic_bp": "Systolic Blood Pressure",
    "diastolic_bp": "Diastolic Blood Pressure",
    "cholesterol": "Total Serum Cholesterol",
    "blood_glucose": "Fasting Blood Glucose",
    "resting_hr": "Resting Heart Rate",
    "bmi": "Body Mass Index (BMI)",
    "pulse_pressure": "Vascular Pulse Pressure",
    "mean_arterial_pressure": "Mean Arterial Pressure",
    "chol_glucose_index": "Cardiometabolic Index",
    "sleep_duration": "Sleep Duration",
    "stress_level": "Psychological Stress",
    "family_history": "Premature CVD Family History",
    "high_bp_stage2": "Stage 2 Hypertension Flag",
    "obesity_flag": "Clinical Obesity Indicator",
    "sex_male": "Biological Sex: Male",
    "sex_female": "Biological Sex: Female",
    "smoking_status_current": "Active Tobacco Smoking",
    "smoking_status_former": "Former Tobacco Smoking",
    "smoking_status_never": "Non-Smoker Status",
    "diabetes_status_type2": "Type 2 Diabetes Mellitus",
    "diabetes_status_type1": "Type 1 Diabetes Mellitus",
    "diabetes_status_pre_diabetes": "Pre-Diabetes Glycemia",
    "diabetes_status_no": "Normal Glucose Regulation",
    "physical_activity_sedentary": "Sedentary Physical Activity",
    "physical_activity_active": "Regular Aerobic Exercise",
    "physical_activity_very_active": "High Physical Activity",
    "physical_activity_light": "Light Physical Activity",
    "physical_activity_moderate": "Moderate Physical Activity",
    "alcohol_status_heavy": "Heavy Alcohol Consumption",
    "alcohol_status_none": "Alcohol Abstinence",
    "alcohol_status_moderate": "Moderate Alcohol Use"
}

def explain_prediction(explainer, preprocessor, raw_input_df) -> Dict[str, Any]:
    """Computes SHAP feature attribution values for a single patient profile."""
    # 1. Feature engineering and transformation
    eng_df = engineer_features(raw_input_df)
    X_trans = preprocessor.transform(eng_df)
    feature_names = get_feature_names(preprocessor)

    # 2. Compute SHAP values
    shap_vals = explainer.shap_values(X_trans)

    # If binary classification returns list of 2 arrays, take positive class (1)
    if isinstance(shap_vals, list) and len(shap_vals) == 2:
        vals = np.array(shap_vals[1][0])
    elif isinstance(shap_vals, np.ndarray) and shap_vals.ndim == 3:
        vals = shap_vals[0, :, 1]
    else:
        vals = np.array(shap_vals[0])

    base_val = float(explainer.expected_value[1] if isinstance(explainer.expected_value, (list, np.ndarray)) else explainer.expected_value)

    # 3. Format feature impacts
    impacts = []
    for idx, f_name in enumerate(feature_names):
        sv = float(vals[idx])
        raw_val_str = ""
        # match raw column if possible
        clean_key = f_name
        for prefix in ["num__", "cat__", "bin__"]:
            if clean_key.startswith(prefix):
                clean_key = clean_key[len(prefix):]

        display_name = FEATURE_DISPLAY_MAPPING.get(clean_key, clean_key.replace("_", " ").title())

        # Extract actual user value
        if clean_key in eng_df.columns:
            raw_val_str = str(eng_df[clean_key].iloc[0])
        elif f_name in eng_df.columns:
            raw_val_str = str(eng_df[f_name].iloc[0])
        else:
            raw_val_str = f"{X_trans[0, idx]:.2f}"

        direction = "INCREASES_RISK" if sv > 0 else "REDUCES_RISK"

        # Generate clinical note
        if direction == "INCREASES_RISK":
            note = f"Elevated contribution pushing estimated cardiovascular risk higher."
        else:
            note = f"Protective contribution lowering estimated cardiovascular risk."

        impacts.append({
            "feature": clean_key,
            "feature_name": display_name,
            "user_value": raw_val_str,
            "shap_value": round(sv, 4),
            "direction": direction,
            "abs_impact": abs(sv),
            "clinical_note": note
        })

    # Sort by absolute SHAP importance
    impacts.sort(key=lambda x: x["abs_impact"], reverse=True)
    for rank, item in enumerate(impacts, 1):
        item["importance_rank"] = rank

    positive = [i for i in impacts if i["direction"] == "INCREASES_RISK"][:5]
    negative = [i for i in impacts if i["direction"] == "REDUCES_RISK"][:5]

    top_pos_names = [p["feature_name"] for p in positive[:3]]
    pos_str = ", ".join(top_pos_names) if top_pos_names else "None"
    summary = f"The primary physiological drivers elevating your cardiovascular risk are {pos_str}."

    return {
        "base_value": round(base_val, 4),
        "features": impacts,
        "top_positive_contributors": positive,
        "top_negative_contributors": negative,
        "summary": summary
    }