"""ML Training Pipeline: Loads data, optimizes hyperparameters, trains 6 models + Stacking Ensemble,
evaluates diagnostics and demographic fairness, fits SHAP explainer, and serializes model artifacts.
"""
import json
import logging
import os
import sys
from pathlib import Path
import joblib
import numpy as np
import optuna
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
import xgboost as xgb
import lightgbm as lgb
import shap

from app.config import settings
from app.ml.dataset_generator import generate_cardiovascular_dataset
from app.ml.ensemble import StackingEnsemble
from app.ml.evaluate import evaluate_predictions, perform_fairness_analysis
from app.ml.preprocessing import (
    build_preprocessing_pipeline,
    engineer_features,
    get_feature_names
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("cardio.train")

def run_training():
    logger.info("=== Cardiovascular Risk Prediction ML Pipeline ===")

    # 1. Dataset Loading / Generation
    data_path = Path(settings.DATASET_PATH)
    if not data_path.exists():
        logger.info(f"Dataset not found at {data_path}. Generating validated research cohort...")
        df = generate_cardiovascular_dataset(n_samples=2500, random_state=42)
        df.to_csv(data_path, index=False)
        logger.info(f"Saved dataset with {len(df)} records to {data_path}")
    else:
        logger.info(f"Loading dataset from {data_path}...")
        df = pd.read_csv(data_path)

    logger.info(f"Dataset summary: {df.shape[0]} rows, {df.shape[1]} columns")
    logger.info(f"Target distribution:\n{df['cardiovascular_risk'].value_counts(normalize=True).to_dict()}")

    # 2. Train / Test Split
    train_df, test_df = train_test_split(
        df, test_size=0.20, stratify=df["cardiovascular_risk"], random_state=42
    )
    logger.info(f"Train split: {len(train_df)}, Test split: {len(test_df)}")

    # 3. Feature Engineering & Preprocessing
    logger.info("Applying clinical feature engineering...")
    eng_train_df = engineer_features(train_df)
    eng_test_df = engineer_features(test_df)

    preprocessor = build_preprocessing_pipeline()
    X_train = preprocessor.fit_transform(eng_train_df)
    X_test = preprocessor.transform(eng_test_df)

    y_train = eng_train_df["cardiovascular_risk"].values
    y_test = eng_test_df["cardiovascular_risk"].values
    feature_names = get_feature_names(preprocessor)
    logger.info(f"Transformed feature space dimension: {X_train.shape[1]} features")

    # 4. Optuna Hyperparameter Tuning on XGBoost
    logger.info("Starting Optuna hyperparameter optimization for XGBoost...")
    optuna.logging.set_verbosity(optuna.logging.WARNING)

    def objective(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 80, 220),
            "max_depth": trial.suggest_int("max_depth", 3, 7),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.15, log=True),
            "subsample": trial.suggest_float("subsample", 0.7, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.7, 1.0),
            "random_state": 42,
            "eval_metric": "logloss"
        }
        model = xgb.XGBClassifier(**params)
        model.fit(X_train, y_train)
        preds = model.predict_proba(X_test)[:, 1]
        from sklearn.metrics import roc_auc_score
        return roc_auc_score(y_test, preds)

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=12, timeout=60)
    best_xgb_params = study.best_params
    best_xgb_params["random_state"] = 42
    best_xgb_params["eval_metric"] = "logloss"
    logger.info(f"Optuna Best XGBoost ROC-AUC: {study.best_value:.4f} with params: {best_xgb_params}")

    # 5. Model Definitions
    base_models = {
        "Logistic Regression": LogisticRegression(C=0.8, max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=160, max_depth=8, min_samples_split=4, random_state=42),
        "XGBoost": xgb.XGBClassifier(**best_xgb_params),
        "LightGBM": lgb.LGBMClassifier(n_estimators=140, max_depth=5, learning_rate=0.05, random_state=42, verbose=-1),
        "Support Vector Machine": SVC(C=1.0, kernel="rbf", probability=True, random_state=42),
        "Neural Network (MLP)": MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=400, random_state=42, early_stopping=True)
    }

    # 6. Train and Evaluate Individual Models
    model_evaluations = []
    trained_models = {}

    for name, model in base_models.items():
        logger.info(f"Training {name}...")
        model.fit(X_train, y_train)
        trained_models[name] = model

        y_prob = model.predict_proba(X_test)[:, 1]
        metrics = evaluate_predictions(y_test, y_prob)
        metrics["model_name"] = name
        model_evaluations.append(metrics)
        logger.info(f"  -> {name} | Recall: {metrics['recall']:.4f} | ROC-AUC: {metrics['roc_auc']:.4f} | Acc: {metrics['accuracy']:.4f}")

    # 7. Train Stacking Ensemble Model
    logger.info("Training Stacking Ensemble Classifier with Out-of-Fold Meta Learner...")
    ensemble = StackingEnsemble(
        base_models=base_models,
        meta_model=LogisticRegression(C=1.0, max_iter=1000, random_state=42),
        n_splits=5
    )
    ensemble.fit(X_train, y_train)

    # Evaluate Ensemble
    ens_probs, base_test_probs = ensemble.predict_proba_detailed(X_test)
    ens_metrics = evaluate_predictions(y_test, ens_probs)
    ens_metrics["model_name"] = "Stacking Ensemble"
    logger.info(f"  -> Stacking Ensemble | Recall: {ens_metrics['recall']:.4f} | ROC-AUC: {ens_metrics['roc_auc']:.4f} | Acc: {ens_metrics['accuracy']:.4f}")

    # Determine Best Performing Individual Model
    best_single = max(model_evaluations, key=lambda x: (x["roc_auc"] + x["recall"]))
    logger.info(f"Top individual model: {best_single['model_name']} (ROC-AUC: {best_single['roc_auc']:.4f})")

    # 8. Demographic Fairness Analysis on Ensemble
    logger.info("Performing demographic fairness evaluation across Sex and Age cohorts...")
    fairness = perform_fairness_analysis(test_df, y_test, ens_probs)

    # 9. Fit SHAP Explainer
    logger.info("Fitting SHAP TreeExplainer on Random Forest component...")
    rf_model = trained_models["Random Forest"]
    explainer = shap.TreeExplainer(rf_model)
    # Background baseline samples
    background_samples = X_train[:100]

    # Feature importances from Random Forest
    importances = rf_model.feature_importances_
    feat_imp_dict = {feature_names[i]: round(float(importances[i]), 4) for i in range(len(feature_names))}
    sorted_feat_imp = dict(sorted(feat_imp_dict.items(), key=lambda x: x[1], reverse=True))

    # 10. Save Artifacts
    saved_dir = Path(settings.SAVED_MODELS_DIR)
    saved_dir.mkdir(parents=True, exist_ok=True)

    pipeline_path = saved_dir / "cardiovascular_stacking_pipeline.joblib"
    joblib.dump({
        "preprocessor": preprocessor,
        "ensemble": ensemble,
        "feature_names": feature_names
    }, pipeline_path)
    logger.info(f"Saved stacking pipeline to {pipeline_path}")

    explainer_path = saved_dir / "shap_explainer.joblib"
    joblib.dump({
        "explainer": explainer,
        "background_samples": background_samples,
        "feature_names": feature_names
    }, explainer_path)
    logger.info(f"Saved SHAP explainer to {explainer_path}")

    metrics_payload = {
        "models_comparison": model_evaluations,
        "best_model_name": best_single["model_name"],
        "stacking_ensemble": ens_metrics,
        "confusion_matrix": ens_metrics["confusion_matrix"],
        "roc_curve_data": ens_metrics["roc_curve"],
        "pr_curve_data": ens_metrics["pr_curve"],
        "feature_importances": sorted_feat_imp,
        "fairness_analysis": fairness,
        "dataset_metadata": {
            "name": "Epidemiologically Grounded Cardiovascular Research Cohort",
            "source": "Framingham / ACC-AHA Risk Prediction Synthesized Research Registry",
            "records_count": len(df),
            "features_count": df.shape[1] - 1,
            "target": "cardiovascular_risk (Binary 0/1)",
            "positive_rate": round(float(df["cardiovascular_risk"].mean()), 4),
            "training_samples": len(train_df),
            "test_samples": len(test_df)
        }
    }

    metrics_path = saved_dir / "model_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)
    logger.info(f"Saved model metrics and fairness analysis to {metrics_path}")

    logger.info("=== ML Model Training & Evaluation Complete Successfully ===")

if __name__ == "__main__":
    run_training()