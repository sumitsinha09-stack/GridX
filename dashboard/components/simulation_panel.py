"""
Simulation Control Panel Component.

Provides interactive input controls allowing users to select initial contingency lines,
set overload tripping criteria, and run physics-based cascading simulation.
"""

import streamlit as st
import pandapower as pp


def render_simulation_controls(net: pp.pandapowerNet):
    """
    Render simulation trigger controls.

    Args:
        net: pandapower network instance.

    Returns:
        tuple: (selected_contingency_lines, overload_threshold, run_clicked)
    """
    st.subheader("⚙️ Contingency Simulation Controls")
    all_lines = list(net.line.index)
    selected_lines = st.multiselect("Select Initial Lines to Trip (N-k)", all_lines, default=[all_lines[0]] if all_lines else [])
    overload_threshold = st.slider("Line Overload Trip Threshold (%)", min_value=80, max_value=150, value=100, step=5)
    run_simulation = st.button("🚀 Run Physics Simulation", use_container_width=True)

    return selected_lines, overload_threshold, run_simulation
