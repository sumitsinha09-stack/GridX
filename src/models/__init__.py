"""
Models package: Classical ML models (Random Forest, XGBoost) and
Graph Neural Network architectures (PyG GCN/GAT/GraphSAGE) for cascade prediction.
"""

from .baseline_models import RandomForestCascadeModel, XGBoostCascadeModel
from .gnn_models import GridGNN

__all__ = [
    "RandomForestCascadeModel",
    "XGBoostCascadeModel",
    "GridGNN",
]
