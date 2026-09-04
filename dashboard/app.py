import os
import sys
import streamlit as st
import networkx as nx
import plotly.graph_objects as go
import pandas as pd

# Add the project root to Python's path so 'src' can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.ai_engine import GridAI

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="GridX Dashboard",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for dark theme tuning and glowing buttons
st.markdown("""
    <style>
    .stApp {
        background-color: #0E1117;
    }
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #00E5FF;
        margin-bottom: 0;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #A0AAB2;
        margin-bottom: 2rem;
    }
    </style>
""", unsafe_allow_html=True)

# --- LOAD AI ENGINE ---
@st.cache_resource
def load_ai():
    # Streamlit cache ensures this only runs once
    return GridAI(
        model_path="models/trained_cascade_model_GAT.pth",
        mpc_path="data/case39.m"
    )

try:
    ai = load_ai()
    model_loaded = True
except Exception as e:
    st.error(f"Failed to load AI Engine: {e}")
    model_loaded = False

if model_loaded:
    st.markdown('<p class="main-header">⚡ GridX</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Cascading Failure Prediction Platform</p>', unsafe_allow_html=True)

    # --- SIDEBAR CONTROLS ---
    with st.sidebar:
        st.header("🎛️ Simulation Controls")
        st.markdown("Configure the initial disaster state.")

        # Line selection
        all_lines = list(range(ai.num_lines))
        broken_lines = st.multiselect(
            "Initial Broken Lines (Disaster)",
            options=all_lines,
            default=[4, 12],
            help="Select lines that are destroyed to trigger a potential cascade."
        )

        # Demand multiplier
        demand_multiplier = st.slider(
            "Power Demand Multiplier",
            min_value=0.5,
            max_value=2.0,
            value=1.0,
            step=0.1,
            help="1.0 is normal load. >1.0 simulates peak usage / heatwaves."
        )

        run_sim = st.button("🚀 Run AI Simulation", use_container_width=True, type="primary")

    # Run simulation automatically on first load or when button clicked
    if run_sim or 'predictions' not in st.session_state:
        with st.spinner("🧠 AI Engine calculating cascade probabilities..."):
            predictions = ai.predict_cascade(broken_lines=broken_lines, demand_multiplier=demand_multiplier)
            st.session_state['predictions'] = predictions
            st.session_state['broken_lines'] = broken_lines

    predictions = st.session_state['predictions']
    broken_lines = st.session_state['broken_lines']

    # --- BUILD THE GRAPH ---
    # Extract edge topology (only the first 'num_lines' before duplication)
    source_nodes = ai.edge_index[0][:ai.num_lines]
    target_nodes = ai.edge_index[1][:ai.num_lines]

    G = nx.Graph()
    for i in range(ai.num_lines):
        G.add_edge(source_nodes[i], target_nodes[i], line_id=i)

    # Generate layout (Kamada Kawai usually looks good for power grids)
    pos = nx.kamada_kawai_layout(G)

    # --- VISUALIZATION PANEL ---
    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("🌐 Grid Topology & Risk Heatmap")

        edge_traces = []
        for i in range(ai.num_lines):
            src = source_nodes[i]
            tgt = target_nodes[i]
            x0, y0 = pos[src]
            x1, y1 = pos[tgt]

            # Determine color and style based on AI risk
            if i in broken_lines:
                color = "rgba(100, 100, 100, 0.5)" # Grayed out
                width = 2
                dash = "dash"
                risk_text = "Status: BROKEN"
            else:
                risk = predictions.get(i, 0.0)
                dash = "solid"
                if risk > 0.85:
                    color = "#FF3366" # Neon Red
                    width = 4
                elif risk > 0.50:
                    color = "#FF9900" # Orange
                    width = 3
                else:
                    color = "#00E5FF" # Neon Cyan (Safe)
                    width = 2
                risk_text = f"Risk: {risk:.1%}"

            hover_text = f"Line {i}<br>From Bus {src} to Bus {tgt}<br>{risk_text}"

            edge_trace = go.Scatter(
                x=[x0, x1, None],
                y=[y0, y1, None],
                line=dict(width=width, color=color, dash=dash),
                hoverinfo='text',
                text=[hover_text],
                mode='lines'
            )
            edge_traces.append(edge_trace)

        # Node trace
        node_x = []
        node_y = []
        node_text = []
        for node in G.nodes():
            x, y = pos[node]
            node_x.append(x)
            node_y.append(y)
            node_text.append(f"Bus {node}")

        node_trace = go.Scatter(
            x=node_x, y=node_y,
            mode='markers+text',
            hoverinfo='text',
            text=node_text,
            textposition="top center",
            marker=dict(
                showscale=False,
                color='#1E2329',
                size=12,
                line_width=2,
                line_color='#A0AAB2'
            )
        )

        # Assemble figure
        fig = go.Figure(data=edge_traces + [node_trace],
             layout=go.Layout(
                showlegend=False,
                hovermode='closest',
                margin=dict(b=0,l=0,r=0,t=0),
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
             )
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("📊 AI Risk Report")

        # Prepare DataFrame for table
        report_data = []
        for line, risk in predictions.items():
            report_data.append({
                "Line ID": line,
                "Failure Risk": risk
            })

        df = pd.DataFrame(report_data)
        if not df.empty:
            df = df.sort_values(by="Failure Risk", ascending=False).reset_index(drop=True)

            # Format Risk as percentage
            df_display = df.copy()
            df_display["Failure Risk"] = df_display["Failure Risk"].apply(lambda x: f"{x:.1%}")

            # Style function
            def highlight_risk(row):
                risk_val = df.loc[row.name, 'Failure Risk']
                if risk_val > 0.85:
                    return ['background-color: rgba(255, 51, 102, 0.2); color: #FF3366'] * len(row)
                elif risk_val > 0.50:
                    return ['color: #FF9900'] * len(row)
                else:
                    return ['color: #00E5FF'] * len(row)

            st.dataframe(
                df_display.style.apply(highlight_risk, axis=1),
                use_container_width=True,
                height=500
            )

            high_risk_count = sum(df['Failure Risk'] > 0.85)
            if high_risk_count > 0:
                st.error(f"🚨 **WARNING:** {high_risk_count} lines are at critical risk (>85%) of cascading failure.")
            else:
                st.success("✅ **ALL CLEAR:** No remaining lines are at critical risk.")
        else:
            st.info("No active lines remaining to predict.")
