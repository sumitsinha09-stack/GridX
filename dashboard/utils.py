"""
Dashboard Utility Helpers.

Handles caching of loaded pandapower networks, model checkpoints,
and session state management for Streamlit.
"""

import streamlit as st
import pandapower as pp
from src.simulation.grid_loader import load_grid


@st.cache_resource
def get_cached_grid(grid_name: str) -> pp.pandapowerNet:
    """
    Cached grid loader to avoid re-instantiating pandapower networks on every rerun.
    """
    return load_grid(grid_name)


@st.cache_resource
def get_cached_model(model_name: str):
    """
    Cached model weight loader for inference.
    """
    # Placeholder for loading serialized models
    return None
