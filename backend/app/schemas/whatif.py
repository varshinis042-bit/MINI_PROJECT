"""What-if counterfactual scenario simulation schemas."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.profile import HealthProfileInput

class WhatIfSimulationRequest(BaseModel):
    prediction_id: Optional[str] = None
    baseline_profile: Optional[HealthProfileInput] = None
    target_systolic_bp: Optional[int] = Field(None, ge=80, le=220)
    target_diastolic_bp: Optional[int] = Field(None, ge=50, le=140)
    target_cholesterol: Optional[int] = Field(None, ge=100, le=450)
    target_blood_glucose: Optional[int] = Field(None, ge=60, le=350)
    target_weight_kg: Optional[float] = Field(None, ge=35.0, le=250.0)
    target_smoking_status: Optional[str] = None
    target_physical_activity: Optional[str] = None

class WhatIfSimulationResponse(BaseModel):
    baseline_risk_percentage: float
    simulated_risk_percentage: float
    risk_delta_percentage: float  # e.g., -18.2%
    relative_risk_reduction_pct: float
    baseline_category: str
    simulated_category: str
    top_intervention_drivers: List[str]
    model_predictions_comparison: Dict[str, Dict[str, float]]
    disclaimer: str = (
        "WHAT-IF SCENARIO: This simulation reflects mathematical predictions from the machine learning model "
        "under modified input assumptions. It is NOT a clinical guarantee of actual medical risk reduction. "
        "Consult medical professionals before undertaking clinical lifestyle changes."
    )