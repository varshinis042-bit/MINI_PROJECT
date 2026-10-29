"""Pydantic schemas for Software-Only ECG Image Analysis."""
from typing import Optional, List
from pydantic import BaseModel, Field

class EcgAnalysisResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    image_preview: Optional[str] = Field(None, description="Data URL or relative path")
    quality_assessment: str = Field(..., description="Good, Fair, or Poor / Unreadable")
    detected_pattern: str = Field(
        ...,
        description="Normal-looking ECG pattern, Irregular pattern detected, Possible abnormal pattern, or Unable to analyze / poor image quality"
    )
    pattern_details: str
    estimated_heart_rate: Optional[int] = Field(None, description="Estimated BPM if waveform grid is clear")
    confidence_score: float = Field(..., description="Confidence of software image assessment (0.0 to 1.0)")
    technical_observations: List[str] = []
    clinical_disclaimer: str = (
        "This ECG analysis is software-based and for research & decision-support purposes only. "
        "It does NOT provide a medical diagnosis. If you experience chest pain, breathlessness, or dizziness, "
        "seek immediate medical care."
    )
    created_at: Optional[str] = None