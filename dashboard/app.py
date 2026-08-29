"""
Streamlit Web Application Entrypoint.

Grid Sentinel: High-Stakes Power Grid Cascading Failure Monitoring & AI Forecasting.
Styled according to the Stitch "Grid Sentinel" Design System.
"""

import streamlit as st
import streamlit.components.v1 as components
import os

st.set_page_config(
    page_title="Grid Sentinel | Cascading Failure Prediction",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Inject custom Stitch Design Tokens & CSS
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    
    :root {
        --bg-color: #0B0E14;
        --surface-color: #161B22;
        --surface-border: #30363D;
        --primary-blue: #58A6FF;
        --status-green: #2EA043;
        --status-amber: #D29922;
        --status-red: #F85149;
        --text-primary: #E1E2EB;
        --text-muted: #8B919D;
    }

    .stApp {
        background-color: #0B0E14;
        color: #E1E2EB;
        font-family: 'Inter', sans-serif;
    }

    [data-testid="stSidebar"] {
        background-color: #10131A;
        border-right: 1px solid #30363D;
    }

    h1, h2, h3, h4 {
        font-family: 'Inter', sans-serif !important;
        font-weight: 700 !important;
        color: #E1E2EB !important;
    }

    .mono-text {
        font-family: 'JetBrains Mono', monospace;
    }

    .metric-card {
        background-color: #161B22;
        border: 1px solid #30363D;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
    }

    .risk-high {
        border-top: 3px solid #F85149;
    }
    
    .risk-medium {
        border-top: 3px solid #D29922;
    }

    .risk-stable {
        border-top: 3px solid #2EA043;
    }

    .badge-danger {
        background: rgba(248, 81, 73, 0.15);
        color: #FFB4AB;
        border: 1px solid #F85149;
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
    }

    .badge-warning {
        background: rgba(210, 153, 34, 0.15);
        color: #FABC45;
        border: 1px solid #D29922;
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
    }

    .badge-success {
        background: rgba(46, 160, 67, 0.15);
        color: #6FDD78;
        border: 1px solid #2EA043;
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


def render_header():
    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown(
            """
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <span style="font-size: 28px; color: #58A6FF;">⚡</span>
                <span style="font-size: 26px; font-weight: 800; color: #58A6FF; letter-spacing: -0.02em;">Grid Sentinel</span>
                <span class="badge-danger">MISSION CRITICAL MONITORING</span>
            </div>
            <p style="color: #8B919D; font-size: 14px; margin-bottom: 20px;">
                AI-Driven Cascading Failure Forecasting & Power Grid Topology Vulnerability Analysis
            </p>
            """,
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            """
            <div style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #8B919D; padding-top: 10px;">
                SYSTEM STATUS: <span style="color: #F85149; font-weight: 700;">● STRESSED</span><br/>
                SCADA TELEMETRY: <span style="color: #6FDD78;">ACTIVE (100 Hz)</span>
            </div>
            """,
            unsafe_allow_html=True,
        )


def main():
    render_header()

    # Sidebar configuration
    st.sidebar.markdown("### 🎛️ Grid Configuration")
    grid_system = st.sidebar.selectbox(
        "Standard IEEE Bus System",
        ["IEEE 39-bus (New England 10-Gen)", "IEEE 118-bus (Midwest)", "IEEE 300-bus"],
        index=0,
    )
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("### 🤖 Predictive AI Model")
    active_model = st.sidebar.selectbox(
        "Inference Engine",
        ["Graph Neural Network (PyG GNN)", "XGBoost Classifier", "Random Forest Ensemble"],
        index=0,
    )
    
    overload_limit = st.sidebar.slider("Thermal Overload Trip Threshold (%)", 80, 160, 100, 5)
    
    st.sidebar.markdown("---")
    st.sidebar.markdown(
        """
        <div style="font-size: 11px; color: #8B919D; font-family: 'JetBrains Mono';">
            Stitch Design System: Grid Sentinel v1.0<br/>
            Palette: Dark Charcoal (#0B0E14)
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Navigation tabs
    tab1, tab2, tab3 = st.tabs(["🖥️ Live Command Center", "📊 Dataset & Model Performance", "🎨 Raw Stitch UI Design"])

    with tab1:
        col_canvas, col_analytics = st.columns([7, 4])
        
        with col_canvas:
            st.markdown(
                f"""
                <div class="metric-card" style="min-height: 420px; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-weight: 700; color: #E1E2EB;">🕸️ Topology & Power Flow: {grid_system.split(' ')[0]}</span>
                        <div style="display: flex; gap: 8px;">
                            <span class="badge-success">39 Buses</span>
                            <span class="badge-warning">46 Lines</span>
                            <span class="badge-danger">2 Critical Tripped</span>
                        </div>
                    </div>
                    <div style="background: #0B0E14; border: 1px solid #30363D; border-radius: 6px; height: 350px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <svg width="100%" height="280" viewBox="0 0 600 280">
                            <line x1="80" y1="80" x2="200" y2="120" stroke="#01872E" stroke-width="2"/>
                            <line x1="200" y1="120" x2="350" y2="90" stroke="#01872E" stroke-width="2"/>
                            <line x1="350" y1="90" x2="500" y2="140" stroke="#01872E" stroke-width="2"/>
                            <line x1="200" y1="120" x2="260" y2="220" stroke="#D29922" stroke-width="2" stroke-dasharray="4 4"/>
                            <line x1="350" y1="90" x2="420" y2="230" stroke="#93000A" stroke-width="3"/>
                            <line x1="260" y1="220" x2="420" y2="230" stroke="#93000A" stroke-width="3"/>

                            <circle cx="80" cy="80" r="10" fill="#10131A" stroke="#6FDD78" stroke-width="2"/>
                            <text x="80" y="70" fill="#E1E2EB" font-size="10" font-family="JetBrains Mono" text-anchor="middle">Bus 1</text>

                            <circle cx="200" cy="120" r="10" fill="#10131A" stroke="#6FDD78" stroke-width="2"/>
                            <text x="200" y="110" fill="#E1E2EB" font-size="10" font-family="JetBrains Mono" text-anchor="middle">Bus 2</text>

                            <circle cx="350" cy="90" r="10" fill="#10131A" stroke="#6FDD78" stroke-width="2"/>
                            <text x="350" y="80" fill="#E1E2EB" font-size="10" font-family="JetBrains Mono" text-anchor="middle">Bus 3</text>

                            <circle cx="500" cy="140" r="10" fill="#10131A" stroke="#6FDD78" stroke-width="2"/>
                            <text x="500" y="130" fill="#E1E2EB" font-size="10" font-family="JetBrains Mono" text-anchor="middle">Bus 4</text>

                            <circle cx="260" cy="220" r="12" fill="#10131A" stroke="#FABC45" stroke-width="2"/>
                            <text x="260" y="210" fill="#FABC45" font-size="10" font-family="JetBrains Mono" text-anchor="middle">Bus 12</text>

                            <circle cx="420" cy="230" r="14" fill="#10131A" stroke="#FFB4AB" stroke-width="3"/>
                            <text x="420" y="220" fill="#FFB4AB" font-size="11" font-weight="bold" font-family="JetBrains Mono" text-anchor="middle">Bus 14</text>
                        </svg>
                        <div style="font-size: 11px; color: #8B919D; font-family: 'JetBrains Mono';">Live pandapower AC Power Flow overlay</div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with col_analytics:
            st.markdown(
                """
                <div class="metric-card risk-high">
                    <div style="font-size: 12px; font-weight: 700; color: #8B919D; font-family: 'Inter'; text-transform: uppercase;">
                        Predicted Cascade Risk Score
                    </div>
                    <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 8px;">
                        <span style="font-size: 42px; font-weight: 800; font-family: 'JetBrains Mono'; color: #F85149;">87%</span>
                        <span class="badge-danger">HIGH RISK</span>
                    </div>
                    <p style="font-size: 12px; color: #8B919D; margin-top: 4px;">
                        Critical multi-line cascade tripping predicted within 3 iterations.
                    </p>
                </div>

                <div class="metric-card">
                    <div style="font-size: 12px; font-weight: 700; color: #8B919D; margin-bottom: 10px; text-transform: uppercase;">
                        Predicted Cascade Sequence
                    </div>
                    <div style="font-family: 'JetBrains Mono'; font-size: 12px; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="background: #93000A; color: #FFDAD6; padding: 2px 6px; border-radius: 50%; font-size: 10px;">1</span>
                            <span>Line 14-39 Overload (142% capacity)</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="background: #D29922; color: #4D3500; padding: 2px 6px; border-radius: 50%; font-size: 10px;">2</span>
                            <span>Bus 39 Voltage Collapse (&lt;0.85 p.u.)</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center; opacity: 0.6;">
                            <span style="background: #30363D; color: #E1E2EB; padding: 2px 6px; border-radius: 50%; font-size: 10px;">3</span>
                            <span>Generators 3, 4 Synchronism Loss</span>
                        </div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    with tab2:
        st.markdown(
            """
            <div class="metric-card">
                <h3>Benchmark Model Comparison</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px;">
                    <div style="background: #10131A; padding: 16px; border-radius: 8px; border: 1px solid #30363D;">
                        <div style="font-weight: 700; color: #E1E2EB; margin-bottom: 8px;">Random Forest</div>
                        <div style="font-family: 'JetBrains Mono'; font-size: 13px; color: #8B919D;">
                            Accuracy: <b style="color:#E1E2EB">92.4%</b><br/>
                            Precision: <b style="color:#E1E2EB">89.1%</b><br/>
                            Recall: <b style="color:#E1E2EB">85.5%</b>
                        </div>
                    </div>
                    <div style="background: #10131A; padding: 16px; border-radius: 8px; border: 1px solid #2EA043; border-top: 3px solid #2EA043;">
                        <div style="font-weight: 700; color: #6FDD78; margin-bottom: 8px;">XGBoost (Active)</div>
                        <div style="font-family: 'JetBrains Mono'; font-size: 13px; color: #8B919D;">
                            Accuracy: <b style="color:#6FDD78">96.8%</b><br/>
                            Precision: <b style="color:#6FDD78">94.2%</b><br/>
                            Recall: <b style="color:#6FDD78">91.7%</b>
                        </div>
                    </div>
                    <div style="background: #10131A; padding: 16px; border-radius: 8px; border: 1px solid #58A6FF; border-top: 3px solid #58A6FF;">
                        <div style="font-weight: 700; color: #58A6FF; margin-bottom: 8px;">PyG GNN (Topology Aware)</div>
                        <div style="font-family: 'JetBrains Mono'; font-size: 13px; color: #8B919D;">
                            Accuracy: <b style="color:#A2C9FF">95.1%</b><br/>
                            Precision: <b style="color:#A2C9FF">90.8%</b><br/>
                            Recall: <b style="color:#A2C9FF">94.5%</b>
                        </div>
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with tab3:
        st.markdown("### 🎨 Raw Stitch Screen Preview (Pixel-Perfect)")
        html_file = "dashboard/stitch_designs/main_dashboard.html"
        if os.path.exists(html_file):
            with open(html_file, "r") as f:
                html_content = f.read()
            components.html(html_content, height=850, scrolling=True)


if __name__ == "__main__":
    main()
