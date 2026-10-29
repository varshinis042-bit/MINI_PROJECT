"""Routes for Personalized Daily Health Plan and Smart Routine Notifications."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.database import db
from app.schemas.health_plan import (
    DailyHealthPlanResponse,
    HealthPlanItemComplete,
    VitalsRecordRequest,
    EmergencyTriageRequest,
    NotificationPreferences,
    NotificationResponse
)
from app.services.health_plan_service import health_plan_service
from app.utils.security import get_optional_user, get_current_user

router = APIRouter(tags=["Daily Health Plan & Smart Routine"])

@router.get("/health-plan/care-plan", response_model=DailyHealthPlanResponse)
async def get_personalized_care_plan(
    timezone: Optional[str] = Query("UTC"),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    return await health_plan_service.get_or_create_daily_plan(
        user_id=user_id,
        client_timezone=timezone or "UTC",
        force_regenerate=False
    )

@router.get("/health-plan/today", response_model=DailyHealthPlanResponse)
async def get_today_health_plan(
    timezone: Optional[str] = Query("UTC"),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    return await health_plan_service.get_or_create_daily_plan(
        user_id=user_id,
        client_timezone=timezone or "UTC",
        force_regenerate=False
    )

@router.post("/health-plan/generate", response_model=DailyHealthPlanResponse)
async def regenerate_today_health_plan(
    timezone: Optional[str] = Query("UTC"),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    return await health_plan_service.get_or_create_daily_plan(
        user_id=user_id,
        client_timezone=timezone or "UTC",
        force_regenerate=True
    )

@router.post("/health-plan/record-vitals", response_model=DailyHealthPlanResponse)
async def record_patient_vitals(
    vitals_in: VitalsRecordRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    return await health_plan_service.record_vitals(user_id, vitals_in)

@router.post("/health-plan/{item_id}/complete", response_model=DailyHealthPlanResponse)
async def complete_health_plan_item(
    item_id: str,
    payload: Optional[HealthPlanItemComplete] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    is_completed = payload.completed if payload else True
    res = await health_plan_service.mark_item_complete(user_id, item_id, is_completed)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health plan item not found or does not belong to active plan."
        )
    return res

@router.post("/health-plan/emergency-triage")
async def report_emergency_triage(
    symptoms: EmergencyTriageRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    is_emergency = (
        symptoms.chest_pain_or_pressure
        or symptoms.pain_radiating_arm_jaw
        or symptoms.severe_shortness_of_breath
        or symptoms.fainting_syncope
        or symptoms.sudden_weakness_speech_difficulty
    )
    
    today_str = ""
    from datetime import datetime
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    alert_doc = {
        "user_id": user_id,
        "date": today_str,
        "is_emergency": is_emergency,
        "symptoms": symptoms.model_dump(),
        "created_at": datetime.utcnow().isoformat()
    }
    await db.insert_one("emergency_alerts", alert_doc)

    # Re-evaluate daily plan with emergency state
    updated_plan = await health_plan_service.get_or_create_daily_plan(user_id, force_regenerate=True)

    return {
        "is_emergency": is_emergency,
        "emergency_contacts": {
            "emergency": "112",
            "ambulance": "108"
        },
        "instructions": [
            "DO NOT WAIT: Call 112 / 108 or your regional emergency ambulance service immediately.",
            "Stop all physical exertion immediately. Sit or recline comfortably.",
            "Loosen tight clothing around your collar and chest.",
            "Do not drive yourself to hospital; request trained emergency paramedic transit."
        ] if is_emergency else [
            "No acute red-flag symptoms reported.",
            "Continue standard preventive lifestyle plan and monitor vitals."
        ],
        "plan": updated_plan
    }

@router.get("/health-plan/history", response_model=List[DailyHealthPlanResponse])
async def get_health_plan_history(
    limit: int = Query(7, ge=1, le=30),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    return await health_plan_service.get_plan_history(user_id, limit=limit)

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(30, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    return await health_plan_service.get_user_notifications(user_id, unread_only=unread_only, limit=limit)

@router.post("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    success = await health_plan_service.mark_notification_read(user_id, notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )
    return {"status": "success", "id": notification_id, "read": True}

@router.post("/notifications/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    await health_plan_service.mark_all_notifications_read(user_id)
    return {"status": "success", "message": "All notifications marked as read."}

@router.get("/notifications/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    return await health_plan_service.get_notification_preferences(user_id)

@router.put("/notifications/preferences", response_model=NotificationPreferences)
async def update_notification_preferences(
    preferences_in: NotificationPreferences,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = str(current_user["_id"]) if current_user else "guest"
    return await health_plan_service.update_notification_preferences(user_id, preferences_in)
