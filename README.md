# ⚡ GridX: Multi-Infrastructure Cascading Failure System

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Apache Spark](https://img.shields.io/badge/Apache%20Spark-4.0%2B-E25A1C.svg?logo=apachespark&logoColor=white)](https://spark.apache.org/)
[![PyTorch Geometric](https://img.shields.io/badge/PyTorch%20Geometric-2.4%2B-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch-geometric.readthedocs.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**GridX** is a unified, Big Data-powered **Multi-Infrastructure Cascading Failure Prediction & Simulation Platform**. It leverages **Apache Spark** for high-volume data preprocessing, distributed geospatial joins, and parallel Monte Carlo simulations, coupled with **PyTorch Graph Neural Networks (GNNs)** and a real-time **React + Tailwind telemetry dashboard** to model how catastrophic failures ripple across interconnected critical infrastructure systems.

---

## 🌟 Key Features

*   **Multi-Sector Interdependency Modeling (4 Layers):**
    *   ⚡ **Layer 0 — Power Grid:** IEEE 39-bus "New England" high-voltage transmission backbone ($345\text{ kV}$).
    *   💧 **Layer 1 — Water Supply:** EPA EPANET benchmark network (Net3) modeling booster pumps, pressure zones, and water deficits.
    *   📡 **Layer 2 — Telecommunications:** Real-world cellular macro-towers (FCC / HIFLD) with battery buffer decay dynamics and wireless SCADA feedback loops.
    *   🏥 **Layer 3 — Healthcare:** Critical acute-care hospital facilities (COVID Care Map / HIFLD) tracking ICU capacities and diesel generator fuel reserves.
*   **Apache Spark (PySpark) Distributed Engine:**
    *   **Spark Ingestion & Cleaning:** Standardizes raw MATPOWER `.m`, EPA EPANET `.inp`, and federal GIS CSVs into an optimized Parquet Lakehouse.
    *   **Distributed Geospatial Broadcast Join:** Uses spherical Haversine distance in Spark SQL to map **1,634 cross-sector dependencies** from power substations to non-power assets.
    *   **Spark Distributed Monte Carlo Simulator:** Parallelizes hundreds of $N-1$ and $N-2$ line trip scenarios across worker cores (`rdd.mapPartitions`), outputting global vulnerability distributions.
    *   **Spark SQL Criticality Rankings:** Ranks substations by cross-sector disruption potential (e.g., *Cambridge Hub: 465 ICU beds at risk*).
*   **Physics-Grounded Temporal Cascade Dynamics:**
    *   ⏱️ **$t = 0\text{h}$ (Initial Shock):** Power bus drops $\rightarrow$ Connected water booster pumps cut off immediately ($0\text{h}$ buffer) $\rightarrow$ Water pressure deficits occur.
    *   ⏱️ **$t = 4\text{ to }8\text{h}$ (Communications Drop):** Cell towers exhaust backup batteries and go dark $\rightarrow$ Loss of wireless SCADA telemetry hinders grid reclosers.
    *   ⏱️ **$t = 72\text{h}$ (Healthcare Crisis):** Hospitals on isolated buses exhaust on-site diesel fuel reserves $\rightarrow$ Critical ICU alarms triggered.
*   **Interactive 4-Sector Telemetry Dashboard:**
    *   **Layer Selector:** Checkbox controls to toggle **⚡ Power**, **💧 Water**, **📡 Telecom**, and **🏥 Healthcare** graph overlays on/off.
    *   **Cascade Time Horizon Slider ($0\text{h} \rightarrow 72\text{h}$):** Interactively step through the cascade timeline to watch failures ripple.
    *   **Custom Force-Directed Canvas:** Visually differentiates Power (blue/red glowing circles), Water (cyan squares), Telecom (purple diamonds), and Hospitals (emerald/crimson crosses).
    *   **Multi-Sector Crisis Meter:** Live telemetry counters tracking water loss ($\text{GPM}$), depleted cell towers, and critical ICU beds.
*   **AI Graph Attention Network (GAT):**
    *   A custom PyTorch Geometric neural network trained to understand spatial electrical relationships and predict branch tripping probabilities (85.8% F1 benchmark).

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT TELEMETRY DASHBOARD                       │
│    • 4-Layer Selector (⚡ Power, 💧 Water, 📡 Telecom, 🏥 Healthcare) │
│    • Cascade Time Horizon Slider (0h ──► 4h ──► 12h ──► 24h ──► 72h)    │
│    • Multi-Sector Crisis Meter & Force-Directed Canvas Visualizer      │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ HTTP / REST
┌───────────────────────────────────┴────────────────────────────────────┐
│                         FASTAPI BACKEND ENGINE                         │
│    • POST /api/hetero/simulate  (Real-time multi-sector graph serving) │
│    • GET  /api/spark/rankings   (Spark SQL Substation Criticality)     │
│    • GET  /api/spark/monte-carlo(Monte Carlo temporal decay telemetry) │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │                                │
┌───────────────────┴──────────────┐   ┌─────────────┴──────────────────┐
│ MULTI-SECTOR CASCADE ENGINE      │   │     APACHE SPARK LAKEHOUSE     │
│ (src/simulation/hetero_cascade)  │   │     (data/processed/*.parquet) │
│ • 0h: Immediate Water Pump Drops │   │ • clean_power_buses.parquet    │
│ • 4-8h: Telecom Battery Drain    │   │ • clean_water_nodes.parquet    │
│ • 72h: Hospital Fuel Exhaustion  │   │ • clean_telecom_towers.parquet │
│ • SCADA Telemetry Feedback Loop  │   │ • clean_hospitals.parquet      │
└───────────────────▲──────────────┘   │ • interdependent_edges.parquet │
                    │                  └─────────────▲──────────────────┘
┌───────────────────┴────────────────────────────────┴──────────────────┐
│                   APACHE SPARK DISTRIBUTED COMPUTATION                 │
│ • src/spark/preprocess_and_clean.py: Cleans raw EPA, FCC, HIFLD data  │
│ • src/spark/spatial_join.py: Distributed Haversine broadcast join     │
│ • src/spark/distributed_simulator.py: Parallel Monte Carlo (250 runs)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Datasets & Schema Standards

| Sector | Source & Benchmark | Format & Size | Cleaned Attributes / Role |
| :--- | :--- | :---: | :--- |
| **⚡ Power Grid ($L_0$)** | **IEEE 39-Bus (New England)**<br>MATPOWER / PandaPower | `.m` / Parquet<br>($39\text{ rows}$) | Bus ID, coordinates, active power ($P_d\text{ MW}$), reactive power ($Q_d\text{ MVAr}$), $345\text{ kV}$. |
| **💧 Water Supply ($L_1$)** | **EPA EPANET Net3**<br>US Environmental Protection Agency | `.inp` / Parquet<br>($97\text{ rows}$) | Booster pumps ($250\text{ kW}$, $0\text{h}$ backup), junctions, elevation ($m$), base flow ($\text{GPM}$). |
| **📡 Telecom ($L_2$)** | **FCC / HIFLD Base Stations**<br>Antenna Structure Registry | `.csv` / Parquet<br>($624\text{ rows}$) | Base stations, licensee, decimal coordinates, $6.0\text{h}$ battery buffer, SCADA feedback edge. |
| **🏥 Healthcare ($L_3$)** | **COVID Care Map / HIFLD**<br>US Health Facilities | `.csv` / Parquet<br>($289\text{ rows}$) | Acute care hospitals, staffed beds, ICU capacity, $72.0\text{h}$ emergency diesel generator buffer. |

---

## 📈 Apache Spark Analytical Findings

### 1. Substation Criticality Rankings (Spark SQL)
Computed via PySpark Broadcast Spatial Joins across New England:

| Bus ID | Substation Name | Dependent Hospitals | ICU Beds at Risk | Dependent Cell Towers | Dependent Water Pumps |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **1** | **Cambridge Hub** | **25** | **465** | 2 | 0 |
| **29** | **Portland Maine Coastal** | **41** | **401** | **119** | 0 |
| **24** | **Providence Primary** | **16** | **311** | 19 | 0 |
| **0** | **Boston Substation 1** | **10** | **262** | 0 | 0 |
| **17** | **Hartford Metro Central** | **13** | **243** | 7 | 0 |
| **10** | **Worcester Main** | **9** | **174** | 3 | 0 |

### 2. Multi-Sector Horizon Decay Profile (Distributed Monte Carlo)
Aggregated across 250 parallel contingency runs:

| Horizon | Avg Buses Down | Avg Water Pumps Tripped | Avg Cell Towers Down | Avg Hospitals on Generator | Avg Hospitals Critical | Avg ICU Beds Lost |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **$0\text{h}$** | 9.0 | **2.5 (Immediate)** | 0.0 (On Battery) | 53.0 (On Diesel Gen) | 0.0 | 0.0 |
| **$4\text{h}$** | 9.5 | 2.7 | 0.0 (On Battery) | 55.4 | 0.0 | 0.0 |
| **$12\text{h}$** | 9.1 | 2.4 | **71.8 (Depleted)** | 54.2 | 0.0 | 0.0 |
| **$24\text{h}$** | 9.8 | 3.2 | 75.2 | 57.9 | 0.0 | 0.0 |
| **$72\text{h}$** | 9.4 | 2.8 | 71.2 | 0.0 | **54.9 (Fuel Exhausted)** | **758.7** |

---

## 🚀 Installation & Quickstart

### Prerequisites
* **Python 3.9+**
* **Java 17 (LTS)** (Required for Apache Spark / PySpark 4.0)
* **Node.js 18+** & `npm`

### 1. Backend & PySpark Pipelines Setup
From the repository root:

```bash
# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install core dependencies
pip install fastapi uvicorn pydantic torch torch-geometric pandas scikit-learn pandapower pyspark pyarrow

# Set Java 17 for PySpark (adjust path if needed)
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"

# Step 1: Run PySpark Preprocessing Pipeline (cleans raw datasets -> Parquet lakehouse)
python src/spark/preprocess_and_clean.py

# Step 2: Run PySpark Spatial Dependency Join (maps 1,634 cross-sector dependencies)
python src/spark/spatial_join.py

# Step 3: Run PySpark Distributed Monte Carlo Simulation
python src/spark/distributed_simulator.py

# Step 4: Launch the FastAPI Backend
uvicorn src.api:app --host 0.0.0.0 --port 8000 --reload
```
*The backend API will be running at `http://localhost:8000`*

### 2. Frontend React Dashboard Setup
Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```
*The interactive dashboard will be running at `http://localhost:5173`*

---

## 🖥️ Usage Guide

1. Open **`http://localhost:5173`** in your browser.
2. **Toggle Infrastructure Layers:** On the left sidebar, toggle **⚡ Power**, **💧 Water**, **📡 Telecom**, and **🏥 Healthcare** overlays on the force graph.
3. **Simulate Disaster Shocks:**
   * Adjust the **Heatwave Load Multiplier** slider ($0.8\times \dots 2.2\times$).
   * Click **"⚡ Force Trip Random Line"** or select specific transmission lines to cut.
4. **Step Through the Cascade Timeline:**
   * Drag the **Cascade Horizon Slider** ($0\text{h} \rightarrow 4\text{h} \rightarrow 12\text{h} \rightarrow 24\text{h} \rightarrow 72\text{h}$).
   * Watch water pumps trip immediately at $0\text{h}$.
   * Watch cell towers deplete batteries and drop at $12\text{h}$.
   * Watch hospitals exhaust generator diesel at $72\text{h}$, triggering critical ICU alarms.
5. **View Spark Analytics:** Navigate to the **Analytics** page in the top menu to view the **Spark SQL Substation Criticality Rankings** and **Temporal Decay Charts**.

---

## 📁 Repository Structure

```text
GridX/
├── data/
│   ├── case39.m                 # IEEE 39-bus power grid benchmark
│   ├── raw/                     # Raw datasets (Net3.inp, cell_towers.csv, hospitals.csv)
│   └── processed/               # Clean Parquet Lakehouse & dependency tables
├── src/
│   ├── ai_engine.py             # PyTorch Geometric GAT model loader & inference
│   ├── api.py                   # FastAPI multi-infrastructure REST endpoints
│   ├── gnn_model.py             # Graph Attention Network (GAT) architecture
│   ├── simulation/
│   │   └── hetero_cascade.py    # Multi-layer temporal cascade physics engine
│   └── spark/
│       ├── preprocess_and_clean.py   # PySpark schema normalization & cleaning
│       ├── spatial_join.py           # PySpark Haversine broadcast join & Spark SQL rankings
│       └── distributed_simulator.py  # PySpark parallel Monte Carlo simulator
├── frontend/                    # Vite + React 18 + Tailwind telemetry dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TopologyPage.tsx # 4-sector force-directed graph & cascade controls
│   │   │   └── AnalyticsPage.tsx# Spark SQL rankings table & decay charts
│   │   └── App.tsx
│   └── package.json
└── README.md                    # Project documentation
```

---

## 📝 Academic Defense: Physical Co-Simulation Standard
Under US federal law (Critical Energy/Electric Infrastructure Information - CEII regulations), utilities are legally prohibited from releasing minute-by-minute substation SCADA logs and pump telemetry due to national security. 

In accordance with standard literature from **Sandia National Laboratories**, **PNNL**, and the **US EPA (WNTR framework)**, GridX couples **validated domain physics** (MATPOWER AC power flow + EPANET hydraulic equations + FEMA/FCC operational buffer standards). **Apache Spark** eliminates the computational bottleneck of this methodology by scaling contingency generation from single manual runs to **massively parallel distributed Monte Carlo batches**.

---

## 📜 License
This project is licensed under the MIT License.
