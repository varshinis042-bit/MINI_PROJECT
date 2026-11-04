"""FastAPI routes for AI Symptom-Based Triage, Clinical Rule Engine, and Emergency Response."""
import os
import json
import re
import urllib.parse
import urllib.request
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
    EmergencySummaryResponse,
    ReverseGeocodeRequest,
    ReverseGeocodeResponse,
    SendEmergencyAlertRequest,
    SendEmergencyAlertResponse
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
            relationship=c.get("relationship", "Family"),
            phone=c.get("phone", ""),
            email=c.get("email"),
            is_primary=bool(c.get("is_primary", False)),
            created_at=c.get("created_at")
        ))
    return result

@router.post("/trusted-contacts", response_model=TrustedContact)
async def add_trusted_contact(
    contact: TrustedContact,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Add a new trusted emergency contact with validation."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    
    # If this is set as primary, unset other contacts as primary for this user
    if contact.is_primary:
        try:
            existing = await db.find_many("trusted_contacts", query={"user_id": user_id})
            for ex in existing:
                if ex.get("is_primary"):
                    await db.update_one("trusted_contacts", {"_id": ex["_id"]}, {"is_primary": False})
        except Exception:
            pass

    doc = {
        "user_id": user_id,
        "name": contact.name.strip(),
        "relationship": contact.relationship.strip(),
        "phone": contact.phone.strip(),
        "email": contact.email.strip() if contact.email else None,
        "is_primary": contact.is_primary,
        "created_at": datetime.utcnow().isoformat()
    }
    contact_id = await db.insert_one("trusted_contacts", doc)
    contact.id = contact_id
    contact.user_id = user_id
    return contact

@router.put("/trusted-contacts/{contact_id}", response_model=TrustedContact)
async def update_trusted_contact(
    contact_id: str,
    contact_in: TrustedContact,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Update an existing trusted contact."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    existing = await db.find_one("trusted_contacts", {"_id": contact_id, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Trusted contact not found.")

    if contact_in.is_primary:
        try:
            all_contacts = await db.find_many("trusted_contacts", query={"user_id": user_id})
            for ex in all_contacts:
                if ex["_id"] != contact_id and ex.get("is_primary"):
                    await db.update_one("trusted_contacts", {"_id": ex["_id"]}, {"is_primary": False})
        except Exception:
            pass

    update_doc = {
        "name": contact_in.name.strip(),
        "relationship": contact_in.relationship.strip(),
        "phone": contact_in.phone.strip(),
        "email": contact_in.email.strip() if contact_in.email else None,
        "is_primary": contact_in.is_primary,
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.update_one("trusted_contacts", {"_id": contact_id}, update_doc)
    contact_in.id = contact_id
    contact_in.user_id = user_id
    return contact_in

@router.post("/trusted-contacts/{contact_id}/primary")
async def set_primary_contact(
    contact_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Designate this contact as the primary emergency contact."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    existing = await db.find_one("trusted_contacts", {"_id": contact_id, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Trusted contact not found.")

    all_contacts = await db.find_many("trusted_contacts", query={"user_id": user_id})
    for c in all_contacts:
        is_p = (c["_id"] == contact_id)
        await db.update_one("trusted_contacts", {"_id": c["_id"]}, {"is_primary": is_p})

    return {"success": True, "primary_contact_id": contact_id}

@router.delete("/trusted-contacts/{contact_id}")
async def delete_trusted_contact(
    contact_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Delete a trusted contact."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    success = await db.delete_one("trusted_contacts", {"_id": contact_id, "user_id": user_id})
    return {"success": success, "deleted_id": contact_id}

@router.post("/reverse-geocode", response_model=ReverseGeocodeResponse)
async def reverse_geocode_location(req: ReverseGeocodeRequest):
    """Convert browser GPS coordinates to readable address with map preview link."""
    lat = req.latitude
    lng = req.longitude
    maps_url = f"https://maps.google.com/?q={lat:.5f},{lng:.5f}"
    formatted = f"GPS Coordinates: {lat:.4f}° N, {lng:.4f}° E"
    city = None
    state = None
    country = None

    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom=16&addressdetails=1"
        req_obj = urllib.request.Request(url, headers={"User-Agent": "CardioRiskAI-EmergencyService/1.0"})
        with urllib.request.urlopen(req_obj, timeout=2.5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                display_name = data.get("display_name")
                if display_name:
                    formatted = display_name
                addr = data.get("address", {})
                city = addr.get("city") or addr.get("town") or addr.get("suburb") or addr.get("village")
                state = addr.get("state")
                country = addr.get("country")
    except Exception:
        formatted = f"Near coordinates {lat:.4f}, {lng:.4f}"

    return ReverseGeocodeResponse(
        latitude=lat,
        longitude=lng,
        formatted_address=formatted,
        maps_url=maps_url,
        city=city,
        state=state,
        country=country
    )

@router.post("/send-emergency-alert", response_model=SendEmergencyAlertResponse)
async def send_emergency_alert(
    req: SendEmergencyAlertRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Prepare and dispatch emergency summary to trusted contact with location map and SMS/WhatsApp fallbacks."""
    user_id = str(current_user["_id"]) if current_user else "guest_session"
    patient_name = current_user.get("full_name", "Heart Assistant User") if current_user else "Patient"

    report = await db.find_one("symptom_reports", {"_id": req.report_id}) if req.report_id else None
    
    urgency_tag = "CRITICAL EMERGENCY (Level 1)"
    symptoms_text = "Acute Cardiovascular Symptoms"
    onset_text = "Recently"
    severity_text = "Severe"
    
    if report:
        patient_name = report.get("patient_name", patient_name)
        urgency_tag = report.get("urgency_title", urgency_tag)
        symptoms_text = ", ".join(report.get("reported_symptoms_summary", [])) or symptoms_text
        onset_text = report.get("onset_time_display", onset_text)
        severity_text = f"{report.get('severity_display', severity_text)} ({report.get('duration_display', '')})"

    msg_lines = [
        f"🚨 EMERGENCY ALERT: {patient_name} needs urgent medical help!",
        f"Status: {urgency_tag}",
        f"Symptoms: {symptoms_text}",
        f"Onset: {onset_text} | Severity: {severity_text}",
    ]

    maps_url = None
    if req.include_location and req.latitude is not None and req.longitude is not None:
        maps_url = f"https://maps.google.com/?q={req.latitude:.5f},{req.longitude:.5f}"
        if req.readable_address:
            msg_lines.append(f"📍 Address: {req.readable_address}")
        msg_lines.append(f"🗺️ Live Location Map: {maps_url}")

    if req.custom_notes:
        msg_lines.append(f"Note: {req.custom_notes.strip()}")

    msg_lines.append("⚠️ Sent via Heart Assistant AI Emergency Protocol. Please call 112 / 108 or check on them immediately.")
    full_message = "\n".join(msg_lines)

    phone = req.contact_phone.strip()
    digits_only = re.sub(r"\D", "", phone)
    encoded_body = urllib.parse.quote(full_message)

    sms_fallback = f"sms:{phone}?body={encoded_body}"
    whatsapp_fallback = f"https://wa.me/{digits_only}?text={encoded_body}"

    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER")

    provider_configured = bool(twilio_sid and twilio_token and twilio_from)
    sms_sent = False

    if provider_configured:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            message = client.messages.create(
                body=full_message,
                from_=twilio_from,
                to=phone if phone.startswith("+") else f"+91{phone}"
            )
            sms_sent = True
            status_msg = f"SMS successfully dispatched via Twilio (Message SID: {message.sid})."
        except Exception as e:
            sms_sent = False
            status_msg = f"SMS provider error: {str(e)}. Use the 1-click SMS or WhatsApp button below to send immediately."
    else:
        status_msg = "Automated SMS gateway is not configured on server. Use the pre-filled 1-Click SMS or WhatsApp buttons below to send to your emergency contact instantly."

    alert_record = {
        "user_id": user_id,
        "patient_name": patient_name,
        "contact_name": req.contact_name,
        "contact_phone": phone,
        "report_id": req.report_id,
        "provider_configured": provider_configured,
        "sms_sent": sms_sent,
        "message_body": full_message,
        "maps_url": maps_url,
        "created_at": datetime.utcnow().isoformat()
    }
    try:
        await db.insert_one("emergency_alert_logs", alert_record)
    except Exception:
        pass

    return SendEmergencyAlertResponse(
        success=sms_sent,
        provider_configured=provider_configured,
        status_message=status_msg,
        recipient_phone=phone,
        recipient_name=req.contact_name,
        emergency_message=full_message,
        sms_fallback_url=sms_fallback,
        whatsapp_fallback_url=whatsapp_fallback,
        maps_url=maps_url,
        sent_at=datetime.utcnow().isoformat()
    )

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
