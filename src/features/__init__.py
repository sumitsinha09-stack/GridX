"""
Features package: Converts simulated power grid states and cascade sequences
into tabular feature matrices (for ML) and PyTorch Geometric graph data (for GNNs).
"""

from .tabular_builder import build_tabular_features
from .graph_builder import build_pyg_graph
from .preprocessor import FeaturePreprocessor

__all__ = [
    "build_tabular_features",
    "build_pyg_graph",
    "FeaturePreprocessor",
]
