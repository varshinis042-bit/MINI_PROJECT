"""Progress monitoring and historical tracking endpoints."""
from typing import List
from fastapi import APIRouter, Depends
from app.database import db
from app.utils.security import get_optional_user

router = APIRouter(prefix="/progress", tags=["Progress Monitoring"])

@router.get("", response_model=List[dict])
async def get_progress_records(current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest"
    records = await db.find_many("progress_records", {"user_id": user_id}, sort_field="created_at", descending=False, limit=50)

    # If no records exist, provide sample demonstration tracking trend
    if not records:
        return [
            {"date": "Day -60", "risk_percentage": 68.5, "lifestyle_score": 52, "diet_score": 55, "systolic_bp": 146, "cholesterol": 242, "weight_kg": 82.0},
            {"date": "Day -45", "risk_percentage": 62.0, "lifestyle_score": 60, "diet_score": 62, "systolic_bp": 140, "cholesterol": 230, "weight_kg": 80.5},
            {"date": "Day -30", "risk_percentage": 56.4, "lifestyle_score": 68, "diet_score": 70, "systolic_bp": 136, "cholesterol": 218, "weight_kg": 78.8},
            {"date": "Day -15", "risk_percentage": 51.2, "lifestyle_score": 74, "diet_score": 76, "systolic_bp": 132, "cholesterol": 210, "weight_kg": 77.5},
            {"date": "Current", "risk_percentage": 44.8, "lifestyle_score": 81, "diet_score": 82, "systolic_bp": 126, "cholesterol": 198, "weight_kg": 76.0}
        ]

    formatted = []
    for r in records:
        dt = r.get("created_at", "")[:10] if r.get("created_at") else "Recorded"
        formatted.append({
            "date": dt,
            "risk_percentage": r.get("risk_percentage", 50.0),
            "lifestyle_score": r.get("lifestyle_score", 70),
            "diet_score": r.get("diet_score", 70),
            "systolic_bp": r.get("systolic_bp", 130),
            "cholesterol": r.get("cholesterol", 200),
            "weight_kg": r.get("weight_kg", 75.0)
        })
    return formatted

@router.post("")
async def record_progress_checkin(data: dict, current_user: dict = Depends(get_optional_user)):
    user_id = str(current_user["_id"]) if current_user else "guest"
    data["user_id"] = user_id
    rec_id = await db.insert_one("progress_records", data)
    return {"status": "success", "record_id": rec_id}