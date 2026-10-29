"""Emergency acute symptom safety triage module."""
from fastapi import APIRouter
from app.schemas.emergency import EmergencyCheckRequest, EmergencyCheckResponse, EmergencyContactInfo

router = APIRouter(prefix="/emergency", tags=["Emergency Safety Triage"])

@router.post("/check", response_model=EmergencyCheckResponse)
async def check_emergency_symptoms(symptoms: EmergencyCheckRequest):
    critical_triggers = [
        symptoms.chest_pressure_or_pain,
        symptoms.pain_radiating_arm_jaw_back,
        symptoms.cold_sweating,
        symptoms.shortness_of_breath and symptoms.sudden_onset
    ]

    is_emergency = any(critical_triggers)

    contacts = [
        EmergencyContactInfo(title="National Emergency Number (India)", number="112", description="All-in-one Emergency Response Support System"),
        EmergencyContactInfo(title="National Ambulance Service", number="108", description="Toll-free emergency ambulance dispatch"),
        EmergencyContactInfo(title="Cardiology Rapid Response Helpline", number="102", description="Urgent medical assistance & transit"),
        EmergencyContactInfo(title="US / International Emergency", number="911", description="Emergency Dispatch (International standard)")
    ]

    if is_emergency:
        urgency = "CRITICAL_EMERGENCY"
        headline = "CRITICAL MEDICAL ALERT: IMMEDIATE EMERGENCY EVALUATION REQUIRED"
        instructions = [
            "DO NOT WAIT for an AI prediction or test result. Call 112 / 108 or your local emergency number immediately.",
            "Cease all physical exertion immediately. Sit or lie down in a comfortable position.",
            "Loosen tight clothing around the neck and chest.",
            "If prescribed nitroglycerin by your cardiologist, administer as directed.",
            "Do NOT attempt to drive yourself to the emergency department; dispatch an ambulance with paramedic life support."
        ]
    elif symptoms.shortness_of_breath or symptoms.lightheadedness_syncope or symptoms.nausea_or_vomiting:
        urgency = "URGENT_EVALUATION"
        headline = "URGENT CLINICAL EVALUATION ADVISEMENT"
        instructions = [
            "Your reported symptoms warrant prompt evaluation by a medical professional or urgent care clinician today.",
            "Avoid strenuous activity until you are clinically examined.",
            "If symptoms progress to severe chest tightness or pain radiation, call emergency services (112 / 108) immediately."
        ]
    else:
        urgency = "ROUTINE_PREVENTIVE"
        headline = "NO ACUTE EMERGENCY SYMPTOMS REPORTED"
        instructions = [
            "No acute cardiac red-flag symptoms reported.",
            "You may proceed with preventive cardiovascular risk assessment and lifestyle optimization.",
            "Always seek prompt medical care if you develop unexpected chest pressure, diaphoresis, or breathing distress."
        ]

    return EmergencyCheckResponse(
        is_emergency=is_emergency,
        urgency_tier=urgency,
        headline_warning=headline,
        detailed_instructions=instructions,
        emergency_contacts=contacts
    )