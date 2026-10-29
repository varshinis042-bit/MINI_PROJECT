"""Pydantic schemas for Medication and Health Reminders."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field	
class ReminderCreate(BaseModel):
    medicine_name: str = Field(..., min_length=1, max_length=150)
    dosage: Optional[str] = Field(None, max_length=100)
    time: str = Field(..., description="Scheduled time in 24h format (e.g. 08:00)")
    frequency: str = Field("Daily")
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)

class ReminderUpdate(BaseModel):
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    time: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class ReminderResponse(BaseModel):
    id: str
    user_id: str
    medicine_name: str
    dosage: Optional[str] = None
    time: str
    frequency: str = "Daily"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None
    status: str = "upcoming"
    last_taken_at: Optional[str] = None
    snoozed_until: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
