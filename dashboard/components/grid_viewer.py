"""
Grid Viewer Component.

Renders interactive graph topology of the selected power system
with node voltages, line loading percentages, and visual alerts for overloaded/tripped lines.
"""

import streamlit as st
import pandapower as pp


def render_grid_topology(net: pp.pandapowerNet, highlighted_lines: list = None):
    """
    Render interactive power grid network visualization.

    Args:
        net: pandapower network instance.
        highlighted_lines: List of line indices to highlight (e.g. failed or overloaded).
    """
    st.subheader("🕸️ Power Grid Topology")
    st.write(f"Buses: {len(net.bus)} | Lines: {len(net.line)} | Generators: {len(net.gen) + len(net.ext_grid)}")
    # Placeholder for NetworkX / PyVis / Plotly interactive graph view
    st.info("Interactive grid topology map will be rendered here.")
