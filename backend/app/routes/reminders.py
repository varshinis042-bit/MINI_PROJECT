"""Medication and health reminders management endpoints."""
import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import db
from app.schemas.reminder import ReminderCreate, ReminderResponse, ReminderUpdate
from app.utils.security import get_optional_user

router = APIRouter(prefix="/reminders", tags=["Medication Reminders"])

DEMO_DEFAULT_REMINDERS = [
    {
        "medicine_name": "Atorvastatin (Cholesterol)",
        "dosage": "10 mg, 1 tablet",
        "time": "21:00",
        "frequency": "Daily (Night)",
        "start_date": "2026-01-01",
        "notes": "Take after dinner with a full glass of water.",
        "status": "upcoming"
    },
    {
        "medicine_name": "Telmisartan (Blood Pressure)",
        "dosage": "40 mg, 1 tablet",
        "time": "08:00",
        "frequency": "Daily (Morning)",
        "start_date": "2026-01-01",
        "notes": "Take early morning after breakfast.",
        "status": "taken",
        "last_taken_at": datetime.utcnow().isoformat()
    },
    {
        "medicine_name": "Evening 20-Min Brisk Walk",
        "dosage": "Physical activity",
        "time": "18:00",
        "frequency": "Daily",
        "start_date": "2026-01-01",
        "notes": "Moderate walking around the park.",
        "status": "upcoming"
    }
]

@router.get("", response_model=List[ReminderResponse])
async def get_reminders(current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest_user"
    reminders = await db.find_many("reminders", {"user_id": user_id}, sort_field="time", descending=False)
    
    if not reminders:
        created = []
        for item in DEMO_DEFAULT_REMINDERS:
            doc = {
                **item,
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "created_at": datetime.utcnow().isoformat()
            }
            await db.insert_one("reminders", doc)
            created.append(ReminderResponse(
                id=doc["_id"],
                user_id=user_id,
                **{k: v for k, v in doc.items() if k not in ["_id", "user_id"]}
            ))
        return created

    return [
        ReminderResponse(
            id=str(r.get("_id", "")),
            user_id=str(r.get("user_id", user_id)),
            medicine_name=r.get("medicine_name", ""),
            dosage=r.get("dosage"),
            time=r.get("time", "08:00"),
            frequency=r.get("frequency", "Daily"),
            start_date=r.get("start_date"),
            end_date=r.get("end_date"),
            notes=r.get("notes"),
            status=r.get("status", "upcoming"),
            last_taken_at=r.get("last_taken_at"),
            snoozed_until=r.get("snoozed_until"),
            created_at=r.get("created_at"),
            updated_at=r.get("updated_at")
        )
        for r in reminders
    ]

@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(reminder_in: ReminderCreate, current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest_user"
    doc = {
        **reminder_in.model_dump(),
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "status": "upcoming",
        "created_at": datetime.utcnow().isoformat()
    }
    await db.insert_one("reminders", doc)
    return ReminderResponse(
        id=doc["_id"],
        user_id=user_id,
        **{k: v for k, v in doc.items() if k not in ["_id", "user_id"]}
    )

@router.put("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(reminder_id: str, reminder_in: ReminderUpdate, current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest_user"
    existing = await db.find_one("reminders", {"_id": reminder_id, "user_id": user_id})
    if not existing:
        existing = await db.find_one("reminders", {"_id": reminder_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    update_data = {k: v for k, v in reminder_in.model_dump(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    await db.update_one("reminders", {"_id": reminder_id}, update_data)
    updated = await db.find_one("reminders", {"_id": reminder_id})

    return ReminderResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        medicine_name=updated.get("medicine_name", ""),
        dosage=updated.get("dosage"),
        time=updated.get("time", "08:00"),
        frequency=updated.get("frequency", "Daily"),
        start_date=updated.get("start_date"),
        end_date=updated.get("end_date"),
        notes=updated.get("notes"),
        status=updated.get("status", "upcoming"),
        last_taken_at=updated.get("last_taken_at"),
        snoozed_until=updated.get("snoozed_until"),
        created_at=updated.get("created_at"),
        updated_at=updated.get("updated_at")
    )

@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: str, current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest_user"
    existing = await db.find_one("reminders", {"_id": reminder_id, "user_id": user_id})
    if not existing:
        existing = await db.find_one("reminders", {"_id": reminder_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    await db.delete_one("reminders", {"_id": reminder_id})
    return {"message": "Reminder deleted successfully."}

@router.post("/{reminder_id}/taken", response_model=ReminderResponse)
async def mark_reminder_taken(reminder_id: str, current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest_user"
    existing = await db.find_one("reminders", {"_id": reminder_id, "user_id": user_id})
    if not existing:
        existing = await db.find_one("reminders", {"_id": reminder_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    now = datetime.utcnow().isoformat()
    update_data = {
        "status": "taken",
        "last_taken_at": now,
        "updated_at": now
    }
    await db.update_one("reminders", {"_id": reminder_id}, update_data)
    updated = await db.find_one("reminders", {"_id": reminder_id})

    return ReminderResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        medicine_name=updated.get("medicine_name", ""),
        dosage=updated.get("dosage"),
        time=updated.get("time", "08:00"),
        frequency=updated.get("frequency", "Daily"),
        start_date=updated.get("start_date"),
        end_date=updated.get("end_date"),
        notes=updated.get("notes"),
        status="taken",
        last_taken_at=now,
        snoozed_until=None,
        created_at=updated.get("created_at"),
        updated_at=now
    )

@router.post("/{reminder_id}/snooze", response_model=ReminderResponse)
async def snooze_reminder(reminder_id: str, minutes: int = 15, current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest_user"
    existing = await db.find_one("reminders", {"_id": reminder_id, "user_id": user_id})
    if not existing:
        existing = await db.find_one("reminders", {"_id": reminder_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    snooze_time = (datetime.utcnow() + timedelta(minutes=minutes)).isoformat()
    update_data = {
        "status": "snoozed",
        "snoozed_until": snooze_time,
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.update_one("reminders", {"_id": reminder_id}, update_data)
    updated = await db.find_one("reminders", {"_id": reminder_id})

    return ReminderResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        medicine_name=updated.get("medicine_name", ""),
        dosage=updated.get("dosage"),
        time=updated.get("time", "08:00"),
        frequency=updated.get("frequency", "Daily"),
        start_date=updated.get("start_date"),
        end_date=updated.get("end_date"),
        notes=updated.get("notes"),
        status="snoozed",
        last_taken_at=updated.get("last_taken_at"),
        snoozed_until=snooze_time,
        created_at=updated.get("created_at"),
        updated_at=updated.get("updated_at")
    )