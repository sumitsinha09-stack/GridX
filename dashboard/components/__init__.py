"""
Dashboard modular UI components:
- grid_viewer: Visualizes topological network and line loadings.
- simulation_panel: User controls to trip lines and run pandapower simulation.
- prediction_view: Displays AI model cascade forecasts and risk metrics.
"""

from .grid_viewer import render_grid_topology
from .simulation_panel import render_simulation_controls
from .prediction_view import render_prediction_results

__all__ = [
    "render_grid_topology",
    "render_simulation_controls",
    "render_prediction_results",
]
