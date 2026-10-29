"""User health profile input schema with strict medical range validation."""
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

class HealthProfileInput(BaseModel):
    age: int = Field(..., ge=18, le=110, description="Age in years")
    sex: str = Field(..., description="Biological sex: male or female")
    height_cm: float = Field(..., ge=90.0, le=250.0, description="Height in cm")
    weight_kg: float = Field(..., ge=30.0, le=300.0, description="Weight in kg")
    bmi: Optional[float] = Field(None, ge=10.0, le=70.0, description="Body Mass Index")

    systolic_bp: int = Field(..., ge=70, le=250, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: int = Field(..., ge=40, le=160, description="Diastolic Blood Pressure (mmHg)")
    cholesterol: int = Field(..., ge=90, le=550, description="Total Cholesterol (mg/dL)")
    blood_glucose: int = Field(..., ge=50, le=450, description="Fasting Blood Glucose (mg/dL)")
    resting_hr: int = Field(..., ge=40, le=180, description="Resting Heart Rate (bpm)")

    smoking_status: str = Field(..., description="never, former, or current")
    diabetes_status: str = Field(..., description="no, pre_diabetes, type1, or type2")
    family_history: bool = Field(False, description="Family history of premature cardiovascular disease")
    physical_activity: str = Field(..., description="sedentary, light, moderate, active, or very_active")
    sleep_duration: float = Field(..., ge=2.0, le=16.0, description="Average daily sleep hours")
    stress_level: int = Field(..., ge=1, le=5, description="Self-reported stress level (1 to 5)")
    alcohol_status: str = Field(..., description="none, occasional, moderate, or heavy")

    diet_preference: str = Field("vegetarian", description="vegetarian, non_vegetarian, vegan, or eggetarian")
    allergies: List[str] = Field(default_factory=list, description="Known food allergies")

    @field_validator("sex")
    def validate_sex(cls, v):
        v_low = v.strip().lower()
        if v_low not in ["male", "female"]:
            raise ValueError("Sex must be 'male' or 'female'")
        return v_low

    @field_validator("smoking_status")
    def validate_smoking(cls, v):
        v_low = v.strip().lower()
        if v_low not in ["never", "former", "current"]:
            raise ValueError("Smoking status must be 'never', 'former', or 'current'")
        return v_low

    @field_validator("diastolic_bp")
    def validate_bp(cls, v, info):
        sbp = info.data.get("systolic_bp")
        if sbp and v >= sbp:
            raise ValueError("Diastolic BP must be strictly less than Systolic BP")
        return v

    def calculate_bmi(self) -> float:
        if self.bmi and self.bmi > 0:
            return round(self.bmi, 1)
        h_m = self.height_cm / 100.0
        return round(self.weight_kg / (h_m * h_m), 1)

class HealthProfileResponse(HealthProfileInput):
    id: Optional[str] = None
    user_id: Optional[str] = None
    updated_at: Optional[str] = None