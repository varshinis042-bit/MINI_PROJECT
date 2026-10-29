"""Model evaluation metrics and demographic fairness analysis schemas."""
from typing import Any, Dict, List
from pydantic import BaseModel

class ModelPerformanceMetrics(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    specificity: float
    f1_score: float
    roc_auc: float
    brier_score: float

class ModelMetricsResponse(BaseModel):
    models_comparison: List[ModelPerformanceMetrics]
    best_model_name: str
    stacking_ensemble: ModelPerformanceMetrics
    confusion_matrix: Dict[str, Any]
    roc_curve_data: Dict[str, List[float]]
    pr_curve_data: Dict[str, List[float]]
    feature_importances: Dict[str, float]
    fairness_analysis: Dict[str, Any]
    dataset_metadata: Dict[str, Any]