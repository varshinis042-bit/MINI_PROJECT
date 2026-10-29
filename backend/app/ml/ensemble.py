"""Stacking ensemble model combining diverse base learners with meta-learner and uncertainty estimation."""
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

class StackingEnsemble(BaseEstimator, ClassifierMixin):
    """Stacking classifier that aggregates base model probabilities using meta-logistic regression."""
    def __init__(self, base_models: Dict[str, BaseEstimator], meta_model: BaseEstimator = None, n_splits: int = 5):
        self.base_models = base_models
        self.meta_model = meta_model or LogisticRegression(C=1.0, max_iter=1000, random_state=42)
        self.n_splits = n_splits
        self.fitted_base_models = {}
        self.classes_ = np.array([0, 1])

    def fit(self, X: np.ndarray, y: np.ndarray):
        cv = StratifiedKFold(n_splits=self.n_splits, shuffle=True, random_state=42)
        meta_features = np.zeros((X.shape[0], len(self.base_models)))

        # 1. Out-of-fold predictions to prevent meta-model data leakage
        for model_idx, (name, model) in enumerate(self.base_models.items()):
            for train_idx, val_idx in cv.split(X, y):
                X_tr, y_tr = X[train_idx], y[train_idx]
                X_val = X[val_idx]
                clone_model = model.__class__(**model.get_params())
                clone_model.fit(X_tr, y_tr)
                meta_features[val_idx, model_idx] = clone_model.predict_proba(X_val)[:, 1]

        # 2. Train meta-learner on out-of-fold probabilities
        self.meta_model.fit(meta_features, y)

        # 3. Fit base models on full training data
        for name, model in self.base_models.items():
            fitted = model.__class__(**model.get_params())
            fitted.fit(X, y)
            self.fitted_base_models[name] = fitted

        return self

    def predict_proba_detailed(self, X: np.ndarray) -> Tuple[np.ndarray, Dict[str, np.ndarray]]:
        """Returns stacked ensemble probabilities and individual base model probabilities."""
        meta_features = np.zeros((X.shape[0], len(self.fitted_base_models)))
        base_probs = {}

        for idx, (name, model) in enumerate(self.fitted_base_models.items()):
            p = model.predict_proba(X)[:, 1]
            meta_features[:, idx] = p
            base_probs[name] = p

        ensemble_probs = self.meta_model.predict_proba(meta_features)[:, 1]
        return ensemble_probs, base_probs

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        ensemble_p, _ = self.predict_proba_detailed(X)
        return np.vstack([1.0 - ensemble_p, ensemble_p]).T

    def predict(self, X: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        ensemble_p, _ = self.predict_proba_detailed(X)
        return (ensemble_p >= threshold).astype(int)

    @staticmethod
    def estimate_uncertainty(base_probs_dict: Dict[str, float], ensemble_prob: float) -> Tuple[float, str, str]:
        """Quantifies prediction uncertainty based on model disagreement and entropy."""
        probs = list(base_probs_dict.values())
        var = float(np.var(probs))
        std = float(np.std(probs))

        # Entropy of final prediction: -p*log(p) - (1-p)*log(1-p)
        p = max(0.001, min(0.999, ensemble_prob))
        entropy = - (p * np.log2(p) + (1.0 - p) * np.log2(1.0 - p))

        # Composite uncertainty index (0.0 to 1.0)
        uncertainty = round(min(1.0, (std * 2.5) * 0.5 + entropy * 0.5), 3)

        if uncertainty < 0.35:
            confidence = "High"
            msg = "High ensemble agreement among predictive models. Risk estimation exhibits low variance."
        elif uncertainty < 0.65:
            confidence = "Moderate"
            msg = "Moderate model agreement. Standard clinical uncertainty observed."
        else:
            confidence = "Low"
            msg = "Prediction uncertainty is relatively high due to conflicting base model signals. Additional clinical diagnostics recommended."

        return uncertainty, confidence, msg