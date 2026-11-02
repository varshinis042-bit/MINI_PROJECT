"""Pydantic schemas for AI Symptom-Based Triage, Clinical Rule Engine, and Emergency Response."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SymptomExtractionRequest(BaseModel):
    text: str = Field(..., description="User's description of symptoms in English or Tamil")
    language: Optional[str] = Field("auto", description="'en', 'ta', or 'auto'")

class ExtractedSymptomItem(BaseModel):
    symptom_id: str
    symptom_name: str
    symptom_name_ta: str
    location: Optional[str] = None
    severity: Optional[str] = "not_sure"  # mild, moderate, severe, not_sure
    onset: Optional[str] = "not_sure"     # sudden, gradual, not_sure
    duration: Optional[str] = None
    is_worsening: Optional[bool] = None
    associated_symptoms: List[str] = Field(default_factory=list)
    confidence: float = 0.95

class SymptomExtractionResponse(BaseModel):
    raw_text: str
    detected_language: str
    extracted_symptoms: List[ExtractedSymptomItem]
    associated_symptoms: List[str] = Field(default_factory=list)
    has_emergency_keywords: bool
    emergency_flags: List[str] = []
    onset_detected: Optional[str] = None
    duration_detected: Optional[str] = None
    severity_detected: Optional[str] = None
    trend_detected: Optional[str] = None  # worsening, improving, stable, not_sure

class MedicalHistoryInput(BaseModel):
    diabetes: str = "no"                # yes, no, not_sure
    high_blood_pressure: str = "no"     # yes, no, not_sure
    high_cholesterol: str = "no"        # yes, no, not_sure
    previous_heart_disease: str = "no"  # yes, no, not_sure
    previous_heart_attack: str = "no"   # yes, no, not_sure
    previous_stroke: str = "no"         # yes, no, not_sure
    current_medications: Optional[str] = ""
    allergies: Optional[str] = ""
    other_conditions: Optional[str] = ""

class SymptomTriageRequest(BaseModel):
    # Free-text or NLP inputs
    symptom_description: Optional[str] = ""
    language: Optional[str] = "en"
    
    # Questionnaire structured inputs
    reported_symptoms: List[str] = Field(default_factory=list, description="List of symptom IDs or names")
    symptom_location: Optional[str] = "chest"
    symptom_onset_datetime: Optional[str] = None
    onset_type: str = "not_sure"   # sudden, gradual, not_sure
    duration: str = "not_sure"     # <15m, 15-30m, 1-2h, >2h, days, not_sure
    severity: str = "not_sure"     # mild, moderate, severe, not_sure
    is_worsening: str = "not_sure" # worsening, same, improving, not_sure
    
    # Medical history (optional, non-blocking for emergency symptoms)
    medical_history: Optional[MedicalHistoryInput] = None
    
    # Optional Geolocation for Emergency Dispatch / Sharing
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    share_location_consent: bool = False

class FirstResponseInstructions(BaseModel):
    do_actions: List[str]
    dont_actions: List[str]
    when_to_call: str
    clinical_rationale: str

class ClinicalRuleMatch(BaseModel):
    rule_id: str
    rule_name: str
    guideline_source: str
    citation: str
    trigger_criteria: str

class EmergencyContactInfo(BaseModel):
    title: str
    number: str
    description: str

class TriageAssessmentResponse(BaseModel):
    report_id: str
    timestamp: str
    urgency_level: int           # 1 (Emergency), 2 (Urgent), 3 (Routine), 4 (Self-Care)
    urgency_tier: str            # "LEVEL_1_EMERGENCY", "LEVEL_2_URGENT", "LEVEL_3_ROUTINE", "LEVEL_4_SELF_CARE"
    urgency_title: str
    urgency_title_ta: str
    urgency_color: str           # "rose", "amber", "teal", "emerald"
    badge_label: str
    badge_label_ta: str
    summary_headline: str
    summary_headline_ta: str
    explanation: str
    explanation_ta: str
    matched_rules: List[ClinicalRuleMatch]
    first_response_guidance: FirstResponseInstructions
    reported_symptoms_summary: List[str]
    onset_time_display: Optional[str] = None
    duration_display: Optional[str] = None
    severity_display: Optional[str] = None
    has_emergency_alert: bool
    emergency_contacts: List[EmergencyContactInfo]
    emergency_summary_text: str  # Pre-formatted text for WhatsApp/SMS/Doctor handoff
    uncertainty_notice: Optional[str] = None
    uncertainty_notice_ta: Optional[str] = None
    disclaimer: str
    disclaimer_ta: str

class TrustedContact(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None
    is_primary: bool = True
    created_at: Optional[str] = None

class EmergencySummaryRequest(BaseModel):
    report_id: str
    contact_name: Optional[str] = None
    include_location: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class EmergencySummaryResponse(BaseModel):
    report_id: str
    patient_name: str
    urgency_tier: str
    headline: str
    formatted_message: str
    whatsapp_share_url: str
    sms_share_url: str
    maps_url: Optional[str] = None
    created_at: str
