"""Evaluation metrics calculation and demographic fairness analyzer."""
from typing import Any, Dict, List
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, brier_score_loss, confusion_matrix,
    f1_score, precision_recall_curve, precision_score,
    recall_score, roc_auc_score, roc_curve
)

def evaluate_predictions(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
    """Calculates full diagnostic and calibration metrics."""
    y_pred = (y_prob >= threshold).astype(int)

    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    recall = recall_score(y_true, y_pred, zero_division=0)
    precision = precision_score(y_true, y_pred, zero_division=0)
    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    try:
        auc = roc_auc_score(y_true, y_prob)
    except Exception:
        auc = 0.5

    brier = brier_score_loss(y_true, y_prob)

    # ROC curve points (subsampled to 40 points for JSON serialization)
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    indices = np.linspace(0, len(fpr) - 1, min(40, len(fpr))).astype(int)
    roc_data = {
        "fpr": [round(float(fpr[i]), 4) for i in indices],
        "tpr": [round(float(tpr[i]), 4) for i in indices]
    }

    # PR curve points
    p_pts, r_pts, _ = precision_recall_curve(y_true, y_prob)
    pr_indices = np.linspace(0, len(p_pts) - 1, min(40, len(p_pts))).astype(int)
    pr_data = {
        "precision": [round(float(p_pts[i]), 4) for i in pr_indices],
        "recall": [round(float(r_pts[i]), 4) for i in pr_indices]
    }

    return {
        "accuracy": round(float(acc), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "specificity": round(float(specificity), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(auc), 4),
        "brier_score": round(float(brier), 4),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        },
        "roc_curve": roc_data,
        "pr_curve": pr_data
    }

def perform_fairness_analysis(df_test: pd.DataFrame, y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
    """Evaluates fairness across Sex and Age demographic sub-cohorts."""
    y_pred = (y_prob >= threshold).astype(int)
    results = {"by_sex": {}, "by_age_group": {}}

    # 1. Fairness by Sex
    for sex_val in ["male", "female"]:
        mask = (df_test["sex"] == sex_val).values
        if np.sum(mask) > 0:
            yt = y_true[mask]
            yp = y_pred[mask]
            ypr = y_prob[mask]

            tn, fp, fn, tp = confusion_matrix(yt, yp, labels=[0, 1]).ravel()
            rec = recall_score(yt, yp, zero_division=0)
            prec = precision_score(yt, yp, zero_division=0)
            fpr_val = fp / (fp + tn) if (fp + tn) > 0 else 0.0
            fnr_val = fn / (fn + tp) if (fn + tp) > 0 else 0.0
            pred_rate = float(np.mean(yp))

            results["by_sex"][sex_val] = {
                "sample_size": int(np.sum(mask)),
                "positive_prediction_rate": round(pred_rate, 4),
                "recall": round(float(rec), 4),
                "precision": round(float(prec), 4),
                "fpr": round(float(fpr_val), 4),
                "fnr": round(float(fnr_val), 4),
            }

    # 2. Fairness by Age Group (<45, 45-60, >60)
    age_groups = {
        "<45": (df_test["age"] < 45).values,
        "45-60": ((df_test["age"] >= 45) & (df_test["age"] <= 60)).values,
        ">60": (df_test["age"] > 60).values
    }

    for grp_name, mask in age_groups.items():
        if np.sum(mask) > 0:
            yt = y_true[mask]
            yp = y_pred[mask]

            tn, fp, fn, tp = confusion_matrix(yt, yp, labels=[0, 1]).ravel()
            rec = recall_score(yt, yp, zero_division=0)
            prec = precision_score(yt, yp, zero_division=0)
            fpr_val = fp / (fp + tn) if (fp + tn) > 0 else 0.0
            fnr_val = fn / (fn + tp) if (fn + tp) > 0 else 0.0

            results["by_age_group"][grp_name] = {
                "sample_size": int(np.sum(mask)),
                "positive_prediction_rate": round(float(np.mean(yp)), 4),
                "recall": round(float(rec), 4),
                "precision": round(float(prec), 4),
                "fpr": round(float(fpr_val), 4),
                "fnr": round(float(fnr_val), 4),
            }

    return results