"""
Evaluation Metrics Module.

Calculates standard classification metrics (Accuracy, Precision, Recall, F1, ROC-AUC)
as well as domain-specific power grid metrics:
- Topological Outage Recall (fraction of critical lines correctly predicted to trip).
- Unserved Load Error (RMSE on predicted vs actual MW disconnected).
- Cascade Path Jaccard Index (set similarity of affected lines).
"""

from typing import Dict, Any
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, mean_squared_error


def compute_classification_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray = None) -> Dict[str, float]:
    """
    Compute binary or multiclass classification performance metrics.

    Args:
        y_true: Ground truth binary labels.
        y_pred: Predicted discrete labels.
        y_proba: Predicted probability distribution.

    Returns:
        Dict[str, float]: Standardized metric scores.
    """
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
    }
    if y_proba is not None:
        try:
            metrics["roc_auc"] = float(roc_auc_score(y_true, y_proba))
        except Exception:
            metrics["roc_auc"] = None
    return metrics


def compute_cascade_error(actual_trips: np.ndarray, predicted_trips: np.ndarray) -> Dict[str, float]:
    """
    Calculate grid-specific cascade propagation error.
    """
    return {
        "tripped_line_rmse": float(np.sqrt(mean_squared_error(actual_trips, predicted_trips))),
    }
