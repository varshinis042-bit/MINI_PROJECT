"""Explainable AI (SHAP) schemas."""
from typing import List, Optional
from pydantic import BaseModel

class FeatureShapImpact(BaseModel):
    feature: str
    feature_name: str
    user_value: str
    shap_value: float
    direction: str  # "INCREASES_RISK" or "REDUCES_RISK"
    importance_rank: int
    clinical_note: str

class ShapExplanationResponse(BaseModel):
    prediction_id: str
    base_value: float
    final_output: float
    features: List[FeatureShapImpact]
    top_positive_contributors: List[FeatureShapImpact]
    top_negative_contributors: List[FeatureShapImpact]
    summary: str
    disclaimer: str = (
        "SHAP values quantify the contribution of each clinical and lifestyle factor to this individual model "
        "prediction relative to the average baseline in the research cohort."
    )