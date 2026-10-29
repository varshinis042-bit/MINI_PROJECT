"""Prediction inference engine with Stacking Ensemble and uncertainty estimation."""
import logging
from pathlib import Path
from typing import Any, Dict, Tuple
import joblib
import pandas as pd
from app.config import settings
from app.ml.preprocessing import engineer_features

logger = logging.getLogger("cardio.predict")

class PredictionService:
    def __init__(self):
        self.pipeline_data = None
        self.preprocessor = None
        self.ensemble = None
        self.feature_names = None

    def load_model(self):
        pipeline_path = Path(settings.SAVED_MODELS_DIR) / "cardiovascular_stacking_pipeline.joblib"
        if not pipeline_path.exists():
            logger.warning(f"Pipeline model not found at {pipeline_path}. Model must be trained.")
            return False

        self.pipeline_data = joblib.load(pipeline_path)
        self.preprocessor = self.pipeline_data["preprocessor"]
        self.ensemble = self.pipeline_data["ensemble"]
        self.feature_names = self.pipeline_data["feature_names"]
        logger.info("Stacking ensemble pipeline loaded successfully.")
        return True

    def predict_risk(self, profile_dict: Dict[str, Any]) -> Dict[str, Any]:
        if self.ensemble is None:
            loaded = self.load_model()
            if not loaded:
                raise RuntimeError("Model pipeline not available. Please run model training first.")

        # Convert input dictionary to single-row DataFrame
        df = pd.DataFrame([profile_dict])

        # Feature engineering
        eng_df = engineer_features(df)
        X_trans = self.preprocessor.transform(eng_df)

        # Detailed ensemble prediction
        ens_prob_arr, base_probs_raw = self.ensemble.predict_proba_detailed(X_trans)
        prob = float(ens_prob_arr[0])
        pct = round(prob * 100.0, 1)

        # Base model probabilities mapping
        base_probs = {name: round(float(arr[0]), 4) for name, arr in base_probs_raw.items()}

        # Uncertainty estimation
        uncertainty, confidence, unc_msg = self.ensemble.estimate_uncertainty(base_probs, prob)

        # Risk tier
        if pct < 20.0:
            category = "LOW"
        elif pct < 50.0:
            category = "MODERATE"
        else:
            category = "HIGH"

        # Major Risk & Protective Factors based on physiological cutoffs
        major_risk_factors = []
        protective_factors = []

        sbp = profile_dict.get("systolic_bp", 120)
        dbp = profile_dict.get("diastolic_bp", 80)
        if sbp >= 140 or dbp >= 90:
            major_risk_factors.append({
                "name": "hypertension",
                "display_name": "Elevated Blood Pressure",
                "value": f"{sbp}/{dbp} mmHg",
                "impact_score": 0.85,
                "description": "Stage 2 hypertension places heightened mechanical stress on coronary arteries."
            })
        elif sbp < 120 and dbp < 80:
            protective_factors.append({
                "name": "optimal_bp",
                "display_name": "Optimal Blood Pressure",
                "value": f"{sbp}/{dbp} mmHg",
                "impact_score": -0.40,
                "description": "Normotensive blood pressure preserves vascular compliance."
            })

        chol = profile_dict.get("cholesterol", 180)
        if chol >= 240:
            major_risk_factors.append({
                "name": "high_cholesterol",
                "display_name": "High Serum Cholesterol",
                "value": f"{chol} mg/dL",
                "impact_score": 0.75,
                "description": "Hypercholesterolemia accelerates coronary atheroma plaque deposition."
            })
        elif chol < 200:
            protective_factors.append({
                "name": "desirable_cholesterol",
                "display_name": "Desirable Cholesterol",
                "value": f"{chol} mg/dL",
                "impact_score": -0.35,
                "description": "Normal total cholesterol maintains low atherogenic particle burden."
            })

        smoke = profile_dict.get("smoking_status", "never")
        if smoke == "current":
            major_risk_factors.append({
                "name": "tobacco_smoking",
                "display_name": "Current Tobacco Smoking",
                "value": "Active Smoker",
                "impact_score": 0.90,
                "description": "Tobacco accelerates endothelial oxidation and platelet hyper-reactivity."
            })
        elif smoke == "never":
            protective_factors.append({
                "name": "non_smoker",
                "display_name": "Tobacco Abstinence",
                "value": "Non-Smoker",
                "impact_score": -0.50,
                "description": "Absence of tobacco toxins preserves nitric oxide bioavailability."
            })

        gluc = profile_dict.get("blood_glucose", 90)
        if gluc >= 126 or profile_dict.get("diabetes_status") in ["type1", "type2"]:
            major_risk_factors.append({
                "name": "hyperglycemia",
                "display_name": "Elevated Blood Glucose",
                "value": f"{gluc} mg/dL",
                "impact_score": 0.80,
                "description": "Chronic hyperglycemia triggers microvascular and macrovascular injury."
            })

        act = profile_dict.get("physical_activity", "moderate")
        if act in ["active", "very_active"]:
            protective_factors.append({
                "name": "physical_fitness",
                "display_name": "Active Exercise Habits",
                "value": act.replace("_", " ").title(),
                "impact_score": -0.45,
                "description": "Regular physical training enhances myocardial efficiency and collateral flow."
            })
        elif act == "sedentary":
            major_risk_factors.append({
                "name": "sedentary_lifestyle",
                "display_name": "Sedentary Behavior",
                "value": "Sedentary",
                "impact_score": 0.55,
                "description": "Physical inactivity reduces vascular endothelial shear stress."
            })

        return {
            "risk_probability": round(prob, 4),
            "risk_percentage": pct,
            "risk_category": category,
            "model_confidence": confidence,
            "uncertainty_score": uncertainty,
            "uncertainty_message": unc_msg,
            "major_risk_factors": major_risk_factors,
            "protective_factors": protective_factors,
            "base_model_predictions": base_probs
        }

prediction_service = PredictionService()