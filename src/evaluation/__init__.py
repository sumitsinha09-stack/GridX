"""
Evaluation package: Metrics, benchmark comparisons, and validation reports
for evaluating cascade prediction performance across baseline ML and GNN models.
"""

from .metrics import compute_classification_metrics, compute_cascade_error
from .evaluate import evaluate_all_models

__all__ = [
    "compute_classification_metrics",
    "compute_cascade_error",
    "evaluate_all_models",
]
