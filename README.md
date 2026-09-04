# ⚡ GridX

GridX is an AI-powered power grid cascading failure prediction platform. It leverages state-of-the-art Graph Neural Networks (GNNs) to simulate load stresses and physical line trips, predicting catastrophic grid collapses in real-time. 

The application is built on top of the IEEE 39-bus "New England" power grid model and features a blazing-fast Python backend paired with a fully interactive, dark-themed industrial telemetry dashboard.

---

## 🌟 Key Features

*   **Graph Attention Network (GAT):** A custom PyTorch Geometric neural network trained to understand spatial grid relationships and predict power line melting probabilities.
*   **Real-Time Monte Carlo Solver:** A FastAPI backend that ingests physical anomalies (broken transmission lines) and environmental multipliers (heatwaves, load spikes) to compute cascading effects instantly.
*   **Multi-Page Application Architecture:** Seamless React Router integration featuring a cinematic 3D Landing Page, the main Topology Simulator, a dedicated Analytics page, and a System Configuration panel.
*   **Immersive 3D UI & Animations:** Powered by `framer-motion` and custom CSS transforms, featuring parallax glassmorphism cards and a "dive-into-the-grid" page transition.
*   **Native Light/Dark Mode:** Built-in dynamic theme toggling powered by custom semantic CSS variables for perfect contrast in both daylight and low-light environments.
*   **AI Training Analytics:** Track the PyTorch Graph Attention Network's actual convergence metrics and F1 Accuracy score (85.8%) via beautifully animated `recharts` graphs.
*   **Interactive Topology Map:** A WebGL-accelerated 2D force-directed graph built with `react-force-graph` that allows you to click on individual nodes, override their local power demand, and watch the cascading effects ripple through the grid dynamically.
*   **Dynamic Visualizations:** The graph instantly updates based on live AI risk assessments, color-coding the transmission lines: 
    *   🟢 **Green (Safe):** <65% failure risk
    *   🟡 **Yellow (Warning):** 65-85% failure risk
    *   🔴 **Red (Critical):** >85% failure risk
*   **Node Health & Disruption Metrics:** Calculates the health and disruption potential of specific power nodes in real-time based on the strain of their connected transmission lines.
*   **Industrial Telemetry UI:** A custom React + Tailwind dashboard styled precisely for mission-critical monitoring, featuring real-time risk matrices and automated prioritization.

---

## 🛠️ Tech Stack

**Core AI & Simulation:**
*   `Python 3`
*   `PyTorch` & `PyTorch Geometric` (GNN Architecture)
*   `Pandapower` & `matpowercaseframes` (Power Flow Physics)

**Backend API:**
*   `FastAPI` & `Uvicorn` (High-performance REST API)
*   `Pydantic` (Data Validation)

**Frontend Dashboard:**
*   `React 18` (TypeScript) & `React Router`
*   `Vite` (Build Tool)
*   `Tailwind CSS` (Styling)
*   `Framer Motion` (3D Animations & Transitions)
*   `react-force-graph-2d` (Network Visualization)
*   `Recharts` (Analytics Visualization)

---

## 🚀 Installation & Setup

### 1. Backend (AI Engine & API)

Ensure you have Python 3.9+ installed. From the root of the project:

```bash
# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install the required dependencies
pip install fastapi uvicorn pydantic torch torchvision torchaudio torch-geometric pandas scikit-learn pandapower matpowercaseframes

# Start the FastAPI server
uvicorn src.api:app --reload
```
*The backend will now be running at `http://localhost:8000`*

### 2. Frontend (React Dashboard)

Open a **new** terminal window.

```bash
# Navigate to the frontend directory
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
*The dashboard will now be running at `http://localhost:5173`*

---

## 🖥️ Usage

1. Open your browser and navigate to `http://localhost:5173`.
2. **Stress the Grid (Global):** Adjust the **Global Load Multiplier** slider to simulate extreme weather events (e.g., pulling 1.50x nominal power across all cities).
3. **Stress Specific Nodes:** Click on any node on the graph to bring up its **Node Configuration** panel. You can override its specific power demand to see how localized surges affect the grid.
4. **Trigger Outages:** On the left sidebar, click the **"FORCE TRIP RANDOM BRANCH"** button to physically simulate a transmission line being destroyed. You can easily reset outages using the Reset button.
5. **Real-Time AI Processing:** The frontend automatically streams your changes to the FastAPI backend, processes the grid through the GAT model, and updates the map and sidebars in real-time.
