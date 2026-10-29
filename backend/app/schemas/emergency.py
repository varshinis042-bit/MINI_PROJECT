"""Emergency symptom triage and safety module schemas."""
from typing import List, Optional
from pydantic import BaseModel

class EmergencyCheckRequest(BaseModel):
    chest_pressure_or_pain: bool = False
    pain_radiating_arm_jaw_back: bool = False
    shortness_of_breath: bool = False
    cold_sweating: bool = False
    nausea_or_vomiting: bool = False
    lightheadedness_syncope: bool = False
    sudden_onset: bool = False
    notes: Optional[str] = None

class EmergencyContactInfo(BaseModel):
    title: str
    number: str
    description: str

class EmergencyCheckResponse(BaseModel):
    is_emergency: bool
    urgency_tier: str  # "CRITICAL_EMERGENCY", "URGENT_EVALUATION", "ROUTINE_PREVENTIVE"
    headline_warning: str
    detailed_instructions: List[str]
    emergency_contacts: List[EmergencyContactInfo]
    safety_disclaimer: str = (
        "MEDICAL SAFETY ALERT: This application is NEVER intended to evaluate acute cardiac symptoms, "
        "heart attacks, or medical crises. If you suspect an emergency, call emergency services immediately."
    )