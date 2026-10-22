# ⚡ GridX: Multi-Infrastructure Cascading Failure System

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Apache Spark](https://img.shields.io/badge/Apache%20Spark-4.0%2B-E25A1C.svg?logo=apachespark&logoColor=white)](https://spark.apache.org/)
[![Tableau](https://img.shields.io/badge/Tableau-Desktop%20%26%20Public-E97627.svg?logo=tableau&logoColor=white)](https://www.tableau.com/)
[![PyTorch Geometric](https://img.shields.io/badge/PyTorch%20Geometric-2.4%2B-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch-geometric.readthedocs.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

**GridX** is a unified, Big Data-powered **Multi-Infrastructure Cascading Failure Prediction & Simulation Platform**. It leverages **Apache Spark** for high-volume data preprocessing, distributed geospatial joins, and parallel Monte Carlo simulations, coupled with **PyTorch Graph Neural Networks (GNNs)** and an enterprise **Tableau Business Intelligence & Geospatial Analytics Suite** as its **sole, dedicated visualization and reporting platform** to model and visualize how catastrophic electrical failures ripple across interconnected critical infrastructure systems.

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
*   **Tableau Master Visualization Suite (Dedicated Visualization Engine):**
    *   **Multi-Sector Infrastructure GIS Topology:** Geospatially plots **63,949 critical facilities** across Power, Water, Telecom, and Healthcare with sector-specific symbology and vulnerability tiers.
    *   **Dual-Axis Transmission Corridors:** Utilizes Tableau's **Line / Path mark types** across **5,000 transmission circuits** (10,000 waypoints) to visualize electric power flow corridors and thermal ratings.
    *   **Cascading Contingency & Overload Risk Heatmap:** Cross-tabulates **70,000 power flow scenarios**, line loadings ($>100\%$ trip threshold), and secondary cascading probabilities.
    *   **NOAA Severe Weather & Storm Corpus:** Maps **15,000 extreme weather events** (2015–2024) to evaluate weather hazard exposure against regional grid infrastructure.
*   **AI Graph Attention Network (GAT):**
    *   A custom PyTorch Geometric neural network trained to understand spatial electrical relationships and predict branch tripping probabilities (85.8% F1 benchmark).

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│             TABLEAU BUSINESS INTELLIGENCE & VISUALIZATION              │
│    • Multi-Sector Infrastructure GIS Topology (63,949 assets)         │
│    • Dual-Axis Transmission Line Corridors & Path Mark Mapping        │
│    • AI Contingency Risk Heatmap & Cascading Failure Matrix           │
│    • 10-Year NOAA Severe Weather Hazard & Grid Disruption Overlays    │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Automated Data Marts (tableau/*.csv)
┌───────────────────────────────────┴────────────────────────────────────┐
│                AUTOMATED TABLEAU EXPORT PIPELINE                       │
│                (src/visualization/export_for_tableau.py)               │
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
* **Tableau Desktop** or **Tableau Public** (Free)

### 1. PySpark Big Data Lakehouse & AI Engine Setup
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
```

### 2. Generate Tableau Data Marts (Sole Visualization Tier)
Extract the multi-sector lakehouse into curated, Tableau-optimized schemas:

```bash
python src/visualization/export_for_tableau.py
```
This generates 4 standardized CSV data marts in `tableau/`:
* `tableau/tableau_national_infrastructure.csv` (63,949 facilities across Power, Water, Telecom, Healthcare)
* `tableau/tableau_transmission_line_paths.csv` (10,000 corridor waypoints with point-order indexing)
* `tableau/tableau_cascading_risk.csv` (70,000 power flow contingency scenarios)
* `tableau/tableau_severe_weather_hazards.csv` (15,000 NOAA storm hazard records)

*(Optional / Supplementary: Developer headless test harness API can be launched via `uvicorn src.api:app --port 8000`)*

---

## 📊 Tableau Visualization Guide

Tableau serves as the **sole, dedicated visualization and analytics platform** for GridX. Follow the complete step-by-step tutorial in [`tableau/TABLEAU_TUTORIAL.md`](file:///Users/sumitsinha/Documents/GridX/tableau/TABLEAU_TUTORIAL.md) to explore the 4 core dashboards:

### 1. Multi-Sector Infrastructure Geospatial Topology
* **Source:** `tableau/tableau_national_infrastructure.csv`
* **Visual Mark:** Shape / Circle mark on geographic Latitude / Longitude.
* **Layers:** Differentiates **⚡ Power Grid**, **💧 Water Supply**, **📡 Telecom**, and **🏥 Healthcare** across North America with interactive filters for `Sector`, `Vulnerability Tier`, and `Region`.

### 2. Transmission Line Geographic Corridors (Path Marks)
* **Source:** `tableau/tableau_transmission_line_paths.csv`
* **Visual Mark:** **Line** mark with `line_id` on **Detail** and `point_order` on **Path**.
* **Analysis:** Color-codes corridors by voltage ($kV$) and thermal loading percentage ($<80\%$ Safe, $80-99\%$ Stressed, $\ge 100\%$ Critical Overload).

### 3. Cascading Failure & GNN Prediction Risk Matrix
* **Source:** `tableau/tableau_cascading_risk.csv`
* **Visual Mark:** Heatmap / Diverging Color Grid.
* **Analysis:** Cross-references transmission line IDs against heatwave stress conditions to visualize thermal overloads and GNN secondary failure probabilities.

### 4. NOAA Severe Weather & Extreme Grid Hazard Impact
* **Source:** `tableau/tableau_severe_weather_hazards.csv`
* **Visual Mark:** Spatial Density / Heatmap mark.
* **Analysis:** Correlates 10 years of NOAA severe storms (hurricanes, tornadoes, winter storms) against vulnerable power lines and regional infrastructure with an interactive yearly time slider.

---

## 📁 Repository Structure

```text
GridX/
├── data/
│   ├── case39.m                        # IEEE 39-bus power grid benchmark
│   ├── raw/                            # Raw benchmark datasets (EPA Net3, FCC, HIFLD)
│   ├── raw_large/                      # National-scale infrastructure corpus
│   └── processed/                      # Parquet Lakehouse & dependency tables
├── src/
│   ├── ai_engine.py                    # PyTorch Geometric GAT model loader & inference
│   ├── gnn_model.py                    # Graph Attention Network (GAT) architecture
│   ├── api.py                          # Auxiliary simulation endpoints (Spark SQL & cascade serving)
│   ├── simulation/
│   │   └── hetero_cascade.py           # Multi-layer temporal cascade physics engine
│   ├── spark/
│   │   ├── preprocess_and_clean.py     # PySpark schema normalization & cleaning
│   │   ├── spatial_join.py             # PySpark Haversine broadcast join & Spark SQL rankings
│   │   ├── distributed_simulator.py    # PySpark parallel Monte Carlo simulator
│   │   └── expand_lakehouse.py         # Multi-grid expansion and synthetic scaling
│   ├── visualization/
│   │   └── export_for_tableau.py       # Automated Tableau data mart export pipeline
│   └── data_expansion/
│       ├── generate_multigrid_corpus.py# Regional synthetic multi-grid generator
│       └── generate_national_infra.py  # National-scale infrastructure dataset generator
├── tableau/                            # Sole Official Visualization Tier
│   ├── TABLEAU_TUTORIAL.md             # Complete step-by-step Tableau dashboard master guide
│   ├── tableau_national_infrastructure.csv   # 63,949 critical facilities across 4 sectors
│   ├── tableau_transmission_line_paths.csv   # 5,000 corridors with point-order for line mapping
│   ├── tableau_cascading_risk.csv            # 70,000 power flow contingency scenarios
│   └── tableau_severe_weather_hazards.csv    # 15,000 NOAA extreme hazard records
├── frontend/                           # (Archived / supplementary interactive telemetry harness)
└── README.md                           # Master project documentation
```

---

## 📝 Academic Defense: Physical Co-Simulation Standard
Under US federal law (Critical Energy/Electric Infrastructure Information - CEII regulations), utilities are legally prohibited from releasing minute-by-minute substation SCADA logs and pump telemetry due to national security. 

In accordance with standard literature from **Sandia National Laboratories**, **PNNL**, and the **US EPA (WNTR framework)**, GridX couples **validated domain physics** (MATPOWER AC power flow + EPANET hydraulic equations + FEMA/FCC operational buffer standards). **Apache Spark** eliminates the computational bottleneck of this methodology by scaling contingency generation from single manual runs to **massively parallel distributed Monte Carlo batches**.

---

## 📜 License
This project is licensed under the MIT License.
