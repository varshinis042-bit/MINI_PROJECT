"""FastAPI routes for AI Symptom-Based Triage, Clinical Rule Engine, and Emergency Response."""
import urllib.parse
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import db
from app.utils.security import get_optional_user
from app.schemas.symptoms import (
    SymptomExtractionRequest,
    SymptomExtractionResponse,
    SymptomTriageRequest,
    TriageAssessmentResponse,
    TrustedContact,
    EmergencySummaryRequest,
    EmergencySummaryResponse
)
from app.services.symptom_nlp import symptom_nlp_service
from app.services.clinical_rule_engine import clinical_rule_engine

router = APIRouter(prefix="/symptoms", tags=["AI Symptom Triage & Clinical Rule Engine"])

@router.post("/extract-nlp", response_model=SymptomExtractionResponse)
async def extract_symptoms_nlp(request: SymptomExtractionRequest):
    """Extract structured clinical symptom entities, onset, duration, and severity from text (English & Tamil)."""
    return symptom_nlp_service.extract_symptoms(request.text, request.language)

@router.post("/triage", response_model=TriageAssessmentResponse)
async def submit_symptom_triage(
    request: SymptomTriageRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Execute the independent Clinical Decision Rule Engine and record assessment in symptom history."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    patient_name = current_user.get("full_name", "Heart Assistant User") if current_user else "Patient"

    # Evaluate triage through clinical rules
    assessment = clinical_rule_engine.evaluate_triage(
        request=request,
        patient_name=patient_name,
        user_id=user_id
    )

    # Persist report to database collection `symptom_reports`
    report_doc = {
        "_id": assessment.report_id,
        "user_id": user_id,
        "patient_name": patient_name,
        "timestamp": assessment.timestamp,
        "urgency_level": assessment.urgency_level,
        "urgency_tier": assessment.urgency_tier,
        "urgency_title": assessment.urgency_title,
        "urgency_title_ta": assessment.urgency_title_ta,
        "urgency_color": assessment.urgency_color,
        "badge_label": assessment.badge_label,
        "badge_label_ta": assessment.badge_label_ta,
        "summary_headline": assessment.summary_headline,
        "summary_headline_ta": assessment.summary_headline_ta,
        "explanation": assessment.explanation,
        "explanation_ta": assessment.explanation_ta,
        "matched_rules": [r.model_dump() for r in assessment.matched_rules],
        "first_response_guidance": assessment.first_response_guidance.model_dump(),
        "reported_symptoms_summary": assessment.reported_symptoms_summary,
        "onset_time_display": assessment.onset_time_display,
        "duration_display": assessment.duration_display,
        "severity_display": assessment.severity_display,
        "has_emergency_alert": assessment.has_emergency_alert,
        "emergency_summary_text": assessment.emergency_summary_text,
        "uncertainty_notice": assessment.uncertainty_notice,
        "uncertainty_notice_ta": assessment.uncertainty_notice_ta,
        "raw_request": request.model_dump(),
        "created_at": assessment.timestamp
    }

    try:
        await db.insert_one("symptom_reports", report_doc)
    except Exception as e:
        # Non-blocking if database write encounters transient error
        pass

    return assessment

@router.get("/history", response_model=List[dict])
async def get_symptom_history(
    limit: int = 50,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Retrieve previous symptom reports for the active user or session."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    reports = await db.find_many(
        "symptom_reports",
        query={"user_id": user_id},
        sort_field="created_at",
        descending=True,
        limit=limit
    )
    return reports



@router.post("/emergency-summary", response_model=EmergencySummaryResponse)
async def generate_emergency_summary(
    req: EmergencySummaryRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Generate concise emergency handoff message with one-click WhatsApp/SMS share intents and optional GPS coordinates."""
    report = await db.find_one("symptom_reports", {"_id": req.report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Symptom report not found.")

    patient_name = report.get("patient_name", "Patient")
    msg_body = report.get("emergency_summary_text", "")

    maps_url = None
    if req.include_location and req.latitude is not None and req.longitude is not None:
        maps_url = f"https://maps.google.com/?q={req.latitude:.5f},{req.longitude:.5f}"
        if "Patient Location (GPS)" not in msg_body:
            msg_body += f"\n📍 Live Location: {maps_url}"

    # Generate URL-encoded intents
    encoded_text = urllib.parse.quote(msg_body)
    whatsapp_url = f"https://wa.me/?text={encoded_text}"
    sms_url = f"sms:?body={encoded_text}"

    return EmergencySummaryResponse(
        report_id=req.report_id,
        patient_name=patient_name,
        urgency_tier=report.get("urgency_tier", "LEVEL_1_EMERGENCY"),
        headline=report.get("summary_headline", "EMERGENCY NOTIFICATION"),
        formatted_message=msg_body,
        whatsapp_share_url=whatsapp_url,
        sms_share_url=sms_url,
        maps_url=maps_url,
        created_at=datetime.utcnow().isoformat()
    )

@router.get("/trusted-contacts", response_model=List[TrustedContact])
async def get_trusted_contacts(current_user: Optional[dict] = Depends(get_optional_user)):
    """Retrieve saved trusted emergency contacts for user."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    contacts = await db.find_many("trusted_contacts", query={"user_id": user_id})
    result = []
    for c in contacts:
        result.append(TrustedContact(
            id=str(c.get("_id", "")),
            user_id=c.get("user_id"),
            name=c.get("name", ""),
            relationship=c.get("relationship", ""),
            phone=c.get("phone", ""),
            email=c.get("email"),
            is_primary=c.get("is_primary", True),
            created_at=c.get("created_at")
        ))
    return result

@router.post("/trusted-contacts", response_model=TrustedContact)
async def add_trusted_contact(
    contact: TrustedContact,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Add or update a trusted emergency contact."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    doc = {
        "user_id": user_id,
        "name": contact.name,
        "relationship": contact.relationship,
        "phone": contact.phone,
        "email": contact.email,
        "is_primary": contact.is_primary,
        "created_at": datetime.utcnow().isoformat()
    }
    contact_id = await db.insert_one("trusted_contacts", doc)
    contact.id = contact_id
    contact.user_id = user_id
    return contact

@router.delete("/trusted-contacts/{contact_id}")
async def delete_trusted_contact(
    contact_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Delete a trusted contact."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    success = await db.delete_one("trusted_contacts", {"_id": contact_id, "user_id": user_id})
    return {"success": success, "deleted_id": contact_id}

@router.get("/{report_id}", response_model=dict)
async def get_symptom_report_by_id(report_id: str):
    """Fetch details of a specific symptom triage report."""
    report = await db.find_one("symptom_reports", {"_id": report_id})
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Symptom evaluation report not found."
        )
    return report
