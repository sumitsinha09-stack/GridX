"""
Tests for baseline models and GNN network architectures.
"""

import pytest
import numpy as np
import torch
from src.models.baseline_models import RandomForestCascadeModel, XGBoostCascadeModel
from src.models.gnn_models import GridGNN


def test_random_forest_baseline():
    X = np.random.randn(20, 5)
    y = np.random.randint(0, 2, size=20)
    model = RandomForestCascadeModel(n_estimators=10)
    model.fit(X, y)
    preds = model.predict(X)
    assert len(preds) == 20


def test_gnn_model_forward():
    model = GridGNN(node_in_channels=4, edge_in_channels=4, hidden_channels=16, num_classes=2)
    x = torch.randn(10, 4)
    edge_index = torch.tensor([[0, 1, 2], [1, 2, 0]], dtype=torch.long)
    edge_attr = torch.randn(3, 4)
    out = model(x, edge_index, edge_attr)
    assert out.shape == (1, 2)
