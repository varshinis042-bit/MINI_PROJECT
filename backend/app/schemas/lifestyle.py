"""Lifestyle risk score breakdown schemas."""
from typing import Dict, Optional
from pydantic import BaseModel, Field

class LifestyleScoreResponse(BaseModel):
    overall_lifestyle_score: int = Field(..., ge=0, le=100)
    diet_score: int = Field(..., ge=0, le=100)
    activity_score: int = Field(..., ge=0, le=100)
    sleep_score: int = Field(..., ge=0, le=100)
    smoking_score: int = Field(..., ge=0, le=100)
    stress_score: int = Field(..., ge=0, le=100)
    bmi_score: int = Field(..., ge=0, le=100)
    category: str
    pillar_interpretations: Dict[str, str]
    scoring_methodology: str = (
        "Composite Lifestyle Score = 0.25*Diet + 0.20*Activity + 0.15*Sleep + "
        "0.20*Smoking + 0.10*Stress + 0.10*BMI. Each dimension is normalized 0-100."
    )