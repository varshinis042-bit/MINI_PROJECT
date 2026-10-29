"""Pydantic schemas for Personalized Daily Health Alerts & Smart Routine & Personalized Heart Care Plan."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class HealthPlanItem(BaseModel):
    id: str
    category: str = Field(..., description="BREAKFAST, MID_MORNING, LUNCH, EVENING_SNACK, DINNER, HYDRATION, EXERCISE, MEDICATION, MONITORING, GENERAL, EMERGENCY")
    time: str = Field(..., description="Scheduled time in 24h format HH:MM, e.g. '07:30'")
    title: str
    description: str
    recommendation_details: Optional[Dict[str, Any]] = None
    completed: bool = False
    completed_at: Optional[str] = None
    source_id: Optional[str] = None

class NutritionMealItem(BaseModel):
    id: str
    name: str
    tamil_name: Optional[str] = None
    hindi_name: Optional[str] = None
    serving_size: Optional[str] = None
    calories: float = 0.0
    sodium_mg: float = 0.0
    fiber_g: float = 0.0
    protein_g: float = 0.0
    sat_fat_g: float = 0.0
    completed: bool = False
    completed_at: Optional[str] = None

class FoodSwapItem(BaseModel):
    current_habit: str
    suggested_swap: str
    benefit_reason: str

class NutritionSection(BaseModel):
    breakfast: List[NutritionMealItem] = []
    mid_morning: List[NutritionMealItem] = []
    lunch: List[NutritionMealItem] = []
    evening: List[NutritionMealItem] = []
    dinner: List[NutritionMealItem] = []
    total_calories: float = 0.0
    total_sodium_mg: float = 0.0
    total_fiber_g: float = 0.0
    total_protein_g: float = 0.0
    total_sat_fat_g: float = 0.0
    diet_score: int = 80
    high_sodium_detected: bool = False
    sodium_warning: Optional[str] = None
    suggested_swaps: List[FoodSwapItem] = []
    adherence_percentage: float = 0.0

class ActivityItem(BaseModel):
    id: str
    name: str
    duration_minutes: int
    activity_type: str = "Cardio"
    description: Optional[str] = None
    completed: bool = False
    completed_at: Optional[str] = None

class ActivitySection(BaseModel):
    status: str = "allowed"  # "allowed" or "paused"
    exercise_allowed: bool = True
    pause_reason: Optional[str] = None
    warning_message: Optional[str] = None
    activities: List[ActivityItem] = []
    target_minutes: int = 25
    completed_minutes: int = 0
    adherence_percentage: float = 0.0
    weekly_target_minutes: int = 150
    warmup_cooldown: List[str] = []

class SafetySection(BaseModel):
    exercise_allowed: bool = True
    bp_severely_elevated: bool = False
    latest_sbp: Optional[float] = None
    latest_dbp: Optional[float] = None
    emergency: bool = False
    emergency_message: Optional[str] = None
    emergency_contacts: Dict[str, str] = {
        "emergency": "112",
        "ambulance": "108"
    }

class MonitoringTask(BaseModel):
    id: str
    title: str
    action_type: str  # "RECORD_BP", "LOG_MEAL", "LOG_ACTIVITY", "RECORD_SLEEP"
    status: str = "pending"  # "recorded" or "pending"
    recorded_value: Optional[str] = None
    completed: bool = False

class MonitoringSection(BaseModel):
    bp_recorded: bool = False
    latest_bp: Optional[str] = None
    meals_logged: bool = False
    activity_logged: bool = False
    sleep_hours: Optional[float] = None
    hydration_ml: Optional[int] = None
    tasks: List[MonitoringTask] = []
    items_summary: List[str] = []

class WeeklyDayProgress(BaseModel):
    day: str
    date_str: str
    exercise_minutes: int = 0
    meal_adherence_pct: int = 0
    bp_recorded: bool = False
    score: int = 0

class WeeklyProgressSection(BaseModel):
    days: List[WeeklyDayProgress] = []
    exercise_minutes_done: int = 135
    exercise_minutes_target: int = 150
    meal_adherence_pct: int = 82
    bp_records_done: int = 6
    bp_records_target: int = 7
    summary_label: str = "Lifestyle activity summary"
    disclaimer: str = "Weekly adherence tracks lifestyle consistency and does not imply disease reversal."

class RiskFactorContribution(BaseModel):
    name: str
    display_name: str
    value: str
    impact_pct: float
    description: str

class PlanAdaptation(BaseModel):
    category: str  # "SODIUM", "ACTIVITY", "BP", "SLEEP", "SMOKING", "GENERAL"
    icon: str
    alert_title: str
    message: str
    suggested_action: str

class DailyHealthPlanResponse(BaseModel):
    id: str
    user_id: str
    date: str
    plan_date: str = ""
    timezone: str = "UTC"
    risk_category: str = "MODERATE"
    is_high_risk: bool = False
    headline: str = "Personalized Heart Care Plan"
    subheading: str = "Personalized preventive lifestyle guidance based on your current health information."
    items: List[HealthPlanItem] = []
    nutrition: Optional[NutritionSection] = None
    activity: Optional[ActivitySection] = None
    safety: Optional[SafetySection] = None
    monitoring: Optional[MonitoringSection] = None
    weekly_progress: Optional[WeeklyProgressSection] = None
    risk_factors: List[RiskFactorContribution] = []
    lifestyle_score: Optional[Dict[str, Any]] = None
    meal_analysis: Optional[Dict[str, Any]] = None
    adaptations: List[PlanAdaptation] = []
    total_items: int = 0
    completed_count: int = 0
    progress_percentage: float = 0.0
    summary: str = ""
    disclaimer: str = "This feature provides preventive lifestyle education and is not a medical diagnosis or prescription. Discuss all changes with a healthcare professional."
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class HealthPlanItemComplete(BaseModel):
    completed: bool = True

class VitalsRecordRequest(BaseModel):
    systolic_bp: Optional[int] = Field(None, ge=50, le=300)
    diastolic_bp: Optional[int] = Field(None, ge=30, le=200)
    sleep_hours: Optional[float] = Field(None, ge=0.0, le=24.0)
    activity_minutes: Optional[int] = Field(None, ge=0, le=1440)
    hydration_ml: Optional[int] = Field(None, ge=0, le=10000)
    weight_kg: Optional[float] = Field(None, ge=20.0, le=300.0)

class EmergencyTriageRequest(BaseModel):
    chest_pain_or_pressure: bool = False
    pain_radiating_arm_jaw: bool = False
    severe_shortness_of_breath: bool = False
    fainting_syncope: bool = False
    sudden_weakness_speech_difficulty: bool = False

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    category: str
    title: str
    body: str
    time: str
    read: bool = False
    created_at: Optional[str] = None

class NotificationPreferences(BaseModel):
    notifications_enabled: bool = True
    breakfast_reminders: bool = True
    lunch_reminders: bool = True
    dinner_reminders: bool = True
    hydration_reminders: bool = True
    exercise_reminders: bool = True
    medication_reminders: bool = True
    general_reminders: bool = True
    quiet_hours_start: Optional[str] = "22:00"
    quiet_hours_end: Optional[str] = "07:00"
    timezone: str = "UTC"
