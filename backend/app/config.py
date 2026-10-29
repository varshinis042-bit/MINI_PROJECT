"""Application configuration settings."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Personalized Cardiovascular Risk Prediction and Preventive Lifestyle Recommendation System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "cardio_secret_key_super_secure_984729487293847298374928374"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "cardio_risk_db"
    USE_SQLITE_FALLBACK: bool = True
    DATASET_PATH: str = str(BASE_DIR / "data" / "cardiovascular_risk_dataset.csv")
    SAVED_MODELS_DIR: str = str(BASE_DIR / "models" / "saved_models")
    FOOD_DB_PATH: str = str(BASE_DIR / "data" / "food_database.json")
    SQLITE_DB_PATH: str = str(BASE_DIR / "cardio_risk.sqlite3")
    ENVIRONMENT: str = "development"

    class Config:
        env_file = str(BASE_DIR / ".env")
        case_sensitive = True

settings = Settings()
os.makedirs(settings.SAVED_MODELS_DIR, exist_ok=True)
os.makedirs(str(BASE_DIR / "data"), exist_ok=True)