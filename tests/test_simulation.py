"""
Tests for grid loading and cascade simulation modules.
"""

import pytest
from src.simulation.grid_loader import load_grid, list_available_grids


def test_list_available_grids():
    grids = list_available_grids()
    assert "ieee39" in grids
    assert "ieee118" in grids
    assert "ieee300" in grids


def test_grid_loader_ieee39():
    # Smoke test for loading IEEE 39 bus system
    net = load_grid("ieee39")
    assert len(net.bus) == 39
    assert len(net.line) > 0
    assert hasattr(net, "res_bus")
