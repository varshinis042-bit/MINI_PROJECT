"""FastAPI Application Main Entry Point."""
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db
from app.ml.predict import prediction_service
from app.routes.auth import router as auth_router
from app.routes.diet import router as diet_router
from app.routes.ecg import router as ecg_router
from app.routes.emergency import router as emergency_router
from app.routes.exercise import router as exercise_router
from app.routes.explain import router as explain_router
from app.routes.health import router as health_router
from app.routes.health_plan import router as health_plan_router
from app.routes.lifestyle import router as lifestyle_router
from app.routes.meal_suggest import router as meal_suggest_router
from app.routes.model import router as model_router
from app.routes.predict import router as predict_router
from app.routes.profile import router as profile_router
from app.routes.progress import router as progress_router
from app.routes.reminders import router as reminders_router
from app.routes.whatif import router as whatif_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("cardio.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Cardiovascular Risk AI Backend Engine...")
    await db.connect()

    # Load ML Model Pipeline
    model_path = Path(settings.SAVED_MODELS_DIR) / "cardiovascular_stacking_pipeline.joblib"
    if model_path.exists():
        prediction_service.load_model()
        logger.info("Cardiovascular stacking ensemble pipeline loaded.")
    else:
        logger.warning("ML models not yet trained. Run `python -m app.ml.train` to train models.")

    yield
    # Shutdown
    logger.info("Shutting down Cardiovascular Risk AI Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Production-grade cardiovascular risk prediction and preventive lifestyle recommendation system. "
        "Integrates stacking ensemble ML, SHAP explainable AI, Indian diet planning, dynamic meal analysis, "
        "lifestyle scoring, counterfactual what-if simulation, emergency symptom triage, medication reminders, "
        "software-only ECG image monitoring, and smart ingredient meal suggestions. "
        "FOR EDUCATIONAL AND RESEARCH PURPOSES ONLY."
    ),
    version="1.1.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Route Registrations
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(profile_router, prefix=api_prefix)
app.include_router(predict_router, prefix=api_prefix)
app.include_router(explain_router, prefix=api_prefix)
app.include_router(diet_router, prefix=api_prefix)
app.include_router(lifestyle_router, prefix=api_prefix)
app.include_router(exercise_router, prefix=api_prefix)
app.include_router(whatif_router, prefix=api_prefix)
app.include_router(progress_router, prefix=api_prefix)
app.include_router(emergency_router, prefix=api_prefix)
app.include_router(model_router, prefix=api_prefix)
app.include_router(reminders_router, prefix=api_prefix)
app.include_router(ecg_router, prefix=api_prefix)
app.include_router(meal_suggest_router, prefix=api_prefix)
app.include_router(health_plan_router, prefix=api_prefix)
app.include_router(health_router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "message": "AI-Based Personalized Cardiovascular Risk Prediction API is running.",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "disclaimer": "This system is a research & decision-support prototype, not a medical diagnosis device."
    }