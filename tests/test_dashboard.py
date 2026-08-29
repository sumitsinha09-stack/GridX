"""
Tests for dashboard utilities and components.
"""

import pytest


def test_dashboard_imports():
    # Smoke test checking dashboard components import cleanly
    from dashboard.components import render_grid_topology, render_simulation_controls, render_prediction_results
    assert callable(render_grid_topology)
    assert callable(render_simulation_controls)
    assert callable(render_prediction_results)
