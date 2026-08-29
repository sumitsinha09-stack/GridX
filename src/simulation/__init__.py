"""
Simulation package: Handles power grid loading, contingency injection,
cascading failure simulation loops, and dataset generation.
"""

from .grid_loader import load_grid, list_available_grids
from .cascade_simulator import CascadeSimulator
from .data_generator import generate_cascade_dataset

__all__ = [
    "load_grid",
    "list_available_grids",
    "CascadeSimulator",
    "generate_cascade_dataset",
]
