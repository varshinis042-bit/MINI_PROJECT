"""Prediction schemas with risk categorization and uncertainty indicators."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.profile import HealthProfileInput

class RiskFactorImpact(BaseModel):
    name: str
    display_name: str
    value: str
    impact_score: float
    description: str

class PredictionResponse(BaseModel):
    prediction_id: str
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Estimated 10-year cardiovascular risk probability")
    risk_percentage: float = Field(..., ge=0.0, le=100.0, description="Risk score percentage")
    risk_category: str = Field(..., description="LOW, MODERATE, or HIGH")
    model_confidence: str = Field("Moderate", description="High, Moderate, or Low")
    uncertainty_score: float = Field(..., ge=0.0, le=1.0, description="Model prediction uncertainty metric based on ensemble variance")
    uncertainty_message: str
    major_risk_factors: List[RiskFactorImpact]
    protective_factors: List[RiskFactorImpact]
    base_model_predictions: Dict[str, float]
    input_profile: HealthProfileInput
    created_at: Optional[str] = None
    disclaimer: str = (
        "EDUCATIONAL/RESEARCH USE ONLY: This estimate is produced by an ensemble machine learning model "
        "and is not a medical diagnosis, clinical evaluation, or treatment prescription. Always consult a "
        "licensed physician or cardiologist for personalized medical advice."
    )