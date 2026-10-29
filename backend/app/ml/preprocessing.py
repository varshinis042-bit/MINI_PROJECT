"""Clinical preprocessing pipeline with domain-specific feature engineering."""
from typing import Tuple
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERICAL_FEATURES = [
    "age", "height_cm", "weight_kg", "bmi",
    "systolic_bp", "diastolic_bp", "cholesterol",
    "blood_glucose", "resting_hr", "sleep_duration",
    "stress_level", "pulse_pressure", "mean_arterial_pressure",
    "chol_glucose_index"
]

CATEGORICAL_FEATURES = [
    "sex", "smoking_status", "diabetes_status",
    "physical_activity", "alcohol_status"
]

BINARY_FEATURES = [
    "family_history", "high_bp_stage2", "obesity_flag"
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes evidence-based cardiovascular physiology metrics."""
    data = df.copy()

    # Calculate BMI if missing or 0
    if "bmi" not in data.columns or data["bmi"].isnull().any() or (data["bmi"] == 0).any():
        h_m = data["height_cm"] / 100.0
        data["bmi"] = (data["weight_kg"] / (h_m ** 2)).round(1)

    # 1. Pulse Pressure (PP) = SBP - DBP (strong vascular stiffness predictor)
    data["pulse_pressure"] = (data["systolic_bp"] - data["diastolic_bp"]).clip(15, 120)

    # 2. Mean Arterial Pressure (MAP) = DBP + 1/3(PP)
    data["mean_arterial_pressure"] = ((2 * data["diastolic_bp"] + data["systolic_bp"]) / 3.0).round(1)

    # 3. Combined cardiometabolic index
    data["chol_glucose_index"] = ((data["cholesterol"] / 200.0) * (data["blood_glucose"] / 100.0)).round(2)

    # 4. Binary clinical thresholds
    data["high_bp_stage2"] = ((data["systolic_bp"] >= 140) | (data["diastolic_bp"] >= 90)).astype(int)
    data["obesity_flag"] = (data["bmi"] >= 30.0).astype(int)

    # Ensure family_history is integer 0 or 1
    if "family_history" in data.columns:
        data["family_history"] = data["family_history"].astype(int)

    return data

def build_preprocessing_pipeline() -> ColumnTransformer:
    """Creates scikit-learn ColumnTransformer for standardizing and encoding features."""
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
            ("bin", "passthrough", BINARY_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor

def get_feature_names(preprocessor: ColumnTransformer) -> list:
    """Extracts output feature names after ColumnTransformer transformation."""
    names = []
    # numerical
    names.extend(NUMERICAL_FEATURES)
    # categorical
    cat_encoder = preprocessor.named_transformers_["cat"]
    cat_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES)
    names.extend(list(cat_names))
    # binary
    names.extend(BINARY_FEATURES)
    return names