"""What-If counterfactual scenario simulation endpoint."""
from fastapi import APIRouter, HTTPException
from app.database import db
from app.ml.predict import prediction_service
from app.schemas.whatif import WhatIfSimulationRequest, WhatIfSimulationResponse

router = APIRouter(prefix="/what-if", tags=["What-If Lifestyle Simulator"])

@router.post("", response_model=WhatIfSimulationResponse)
async def simulate_what_if_scenario(sim_req: WhatIfSimulationRequest):
    baseline_profile = None
    baseline_pct = 50.0
    baseline_cat = "MODERATE"

    if sim_req.prediction_id:
        pred = await db.find_one("predictions", {"_id": sim_req.prediction_id})
        if pred:
            baseline_profile = pred.get("input_profile")
            baseline_pct = pred.get("risk_percentage", 50.0)
            baseline_cat = pred.get("risk_category", "MODERATE")

    if not baseline_profile and sim_req.baseline_profile:
        baseline_profile = sim_req.baseline_profile.model_dump()
        baseline_profile["bmi"] = sim_req.baseline_profile.calculate_bmi()
        base_res = prediction_service.predict_risk(baseline_profile)
        baseline_pct = base_res["risk_percentage"]
        baseline_cat = base_res["risk_category"]

    if not baseline_profile:
        raise HTTPException(
            status_code=400,
            detail="Either prediction_id or baseline_profile must be provided."
        )

    # Clone and modify profile
    sim_profile = dict(baseline_profile)
    changes = []

    if sim_req.target_systolic_bp is not None:
        delta_sbp = sim_req.target_systolic_bp - sim_profile["systolic_bp"]
        sim_profile["systolic_bp"] = sim_req.target_systolic_bp
        changes.append(f"Systolic BP {'reduced' if delta_sbp < 0 else 'increased'} by {abs(delta_sbp)} mmHg")

    if sim_req.target_diastolic_bp is not None:
        sim_profile["diastolic_bp"] = sim_req.target_diastolic_bp

    if sim_req.target_cholesterol is not None:
        delta_chol = sim_req.target_cholesterol - sim_profile["cholesterol"]
        sim_profile["cholesterol"] = sim_req.target_cholesterol
        changes.append(f"Cholesterol {'reduced' if delta_chol < 0 else 'increased'} by {abs(delta_chol)} mg/dL")

    if sim_req.target_blood_glucose is not None:
        delta_gluc = sim_req.target_blood_glucose - sim_profile["blood_glucose"]
        sim_profile["blood_glucose"] = sim_req.target_blood_glucose
        changes.append(f"Blood glucose {'reduced' if delta_gluc < 0 else 'increased'} by {abs(delta_gluc)} mg/dL")

    if sim_req.target_weight_kg is not None:
        sim_profile["weight_kg"] = sim_req.target_weight_kg
        h_m = sim_profile.get("height_cm", 170.0) / 100.0
        sim_profile["bmi"] = round(sim_profile["weight_kg"] / (h_m * h_m), 1)
        changes.append(f"Weight adjusted to {sim_req.target_weight_kg} kg (BMI: {sim_profile['bmi']})")

    if sim_req.target_smoking_status is not None:
        sim_profile["smoking_status"] = sim_req.target_smoking_status
        changes.append(f"Smoking status transitioned to {sim_req.target_smoking_status}")

    if sim_req.target_physical_activity is not None:
        sim_profile["physical_activity"] = sim_req.target_physical_activity
        changes.append(f"Physical activity level raised to {sim_req.target_physical_activity}")

    # Predict modified scenario
    sim_res = prediction_service.predict_risk(sim_profile)
    sim_pct = sim_res["risk_percentage"]
    sim_cat = sim_res["risk_category"]

    abs_delta = round(sim_pct - baseline_pct, 1)
    rel_reduction = round(((baseline_pct - sim_pct) / baseline_pct) * 100.0, 1) if baseline_pct > 0 else 0.0

    return WhatIfSimulationResponse(
        baseline_risk_percentage=baseline_pct,
        simulated_risk_percentage=sim_pct,
        risk_delta_percentage=abs_delta,
        relative_risk_reduction_pct=rel_reduction,
        baseline_category=baseline_cat,
        simulated_category=sim_cat,
        top_intervention_drivers=changes if changes else ["No modifiable parameters altered."],
        model_predictions_comparison={
            "baseline": {"risk_percentage": baseline_pct},
            "simulated": sim_res["base_model_predictions"]
        }
    )