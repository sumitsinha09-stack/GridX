# ⚡ GridX Sentinel

GridX Sentinel is an AI-powered power grid cascading failure prediction platform. It leverages state-of-the-art Graph Neural Networks (GNNs) to simulate load stresses and physical line trips, predicting catastrophic grid collapses in real-time. 

The application is built on top of the IEEE 39-bus "New England" power grid model and features a blazing-fast Python backend paired with a fully interactive, dark-themed industrial telemetry dashboard.

---

## 🌟 Key Features

*   **Graph Attention Network (GAT):** A custom PyTorch Geometric neural network trained to understand spatial grid relationships and predict power line melting probabilities.
*   **Real-Time Monte Carlo Solver:** A FastAPI backend that ingests physical anomalies (broken transmission lines) and environmental multipliers (heatwaves, load spikes) to compute cascading effects instantly.
*   **Interactive Topology Map:** A WebGL-accelerated 2D force-directed graph built with `react-force-graph` that dynamically updates line colors (Cyan, Orange, Red) based on live AI risk assessments.
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
*   `React 18` (TypeScript)
*   `Vite` (Build Tool)
*   `Tailwind CSS` (Styling)
*   `react-force-graph-2d` (Network Visualization)

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
2. **Trigger Outages:** On the left sidebar, click the **"FORCE TRIP ADDITIONAL BRANCH"** button to physically simulate a transmission line being destroyed. 
3. **Stress the Grid:** Adjust the **Load Multiplier** slider to simulate extreme weather events (e.g., pulling 1.60x nominal power).
4. **Calculate Risk:** Click the cyan **"Run Monte Carlo Solver"** button. The frontend will hit the FastAPI backend, process the grid through the GAT model, and visually update the map and sidebars with the new failure probabilities.
