# GridX: Cascading Failure Prediction in Power Grids ⚡

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![pandapower](https://img.shields.io/badge/grid%20sim-pandapower-orange.svg)](https://www.pandapower.org/)
[![PyTorch Geometric](https://img.shields.io/badge/GNN-PyTorch--Geometric-red.svg)](https://pyg.org/)
[![Streamlit](https://img.shields.io/badge/dashboard-Streamlit-FF4B4B.svg)](https://streamlit.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**GridX** is a high-performance Python data science and machine learning platform for simulating, monitoring, and predicting cascading failures and blackout risks in electrical power transmission grids. By combining physics-based AC power flow simulation, graph topological analysis, and AI models (**Random Forest**, **XGBoost**, and **PyTorch Geometric Graph Neural Networks**), GridX empowers power grid operators with sub-second contingency analysis and early warning alarms.

---

## 🌟 Key Features

- 🔌 **Physics-Based Power Flow Simulation**: Seamless integration with `pandapower` supporting standard IEEE benchmark testbeds (**IEEE 39-bus New England**, **IEEE 118-bus**, and **IEEE 300-bus**).
- 🌪️ **Cascading Failure Engine**: Simulates $N-1$ and $N-k$ contingency tripping, thermal line overloads, dynamic power re-dispatch, islanding detection, and frequency-loss load shedding.
- 📊 **Dual Feature Extraction Pipelines**:
  - **Tabular Features**: Global topology metrics (algebraic connectivity, line density, betweenness centrality) and active/reactive loading statistics.
  - **Graph Tensors**: Node features ($P, Q, V, \theta$, generator/load flags) and edge attributes (reactance $X$, resistance $R$, thermal limit $S_{max}$, flow $S$).
- 🧠 **AI & Graph Neural Network (GNN) Zoo**:
  - **Baseline ML**: Random Forest and XGBoost classifiers & regressors for binary blackout risk and cascade magnitude.
  - **GNN Architectures**: Graph Convolutional Networks (GCN), Graph Attention Networks (GAT with multi-head attention), and GraphSAGE for inductive topology representation.
- 🖥️ **"Grid Sentinel" Real-Time SCADA Dashboard**: Streamlit-based interactive operator interface featuring live topological network maps, contingency injection controls, and instant AI blackout probability predictions.

---

## ⚡ System Architecture & Development Tracks

The codebase is organized into **3 decoupled development tracks** for seamless modularity and collaboration across power systems engineers, ML researchers, and frontend developers:

```
┌────────────────────────────────────────────────────────┐
│               Track 1: Data Pipeline                   │
│       pandapower IEEE grids -> N-k cascade sim         │
│          outputs: data/processed/cascade_dataset.csv   │
└──────────────────────────┬─────────────────────────────┘
                           │ produces dataset & graph tensors
                           ▼
┌────────────────────────────────────────────────────────┐
│               Track 2: Modeling & Features             │
│   src/features/   -> Tabular & PyG graph feature builder│
│   src/models/     -> Baseline ML (RF, XGB) & GNN (PyG) │
│   src/evaluation/ -> Metrics, ROC, cascade path recall │
└──────────────────────────┬─────────────────────────────┘
                           │ produces model weights (.joblib, .pt)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Track 3: Dashboard & UI                  │
│   dashboard/app.py -> "Grid Sentinel" Dark UI          │
│   components/      -> Topology visualizer, simulation  │
│                       panel & AI forecast overlay      │
└────────────────────────────────────────────────────────┘
```

1. **Track 1: Simulation & Data Generation (`src/simulation/`)**:
   - `grid_loader.py`: Automated loading and validation of IEEE standard grids.
   - `cascade_simulator.py`: Physics simulation loop for iterative line trip propagation, voltage collapse, and island load balancing.
   - `data_generator.py`: Monte Carlo scenario generation under varying load distributions and random/targeted line contingencies.

2. **Track 2: Feature Engineering & Modeling (`src/features/`, `src/models/`, `src/evaluation/`)**:
   - `tabular_builder.py` & `graph_builder.py`: Extracts bus/line electrical properties and converts network states into PyG `Data` graphs.
   - `baseline_models.py` & `gnn_models.py`: Implementations of Random Forest, XGBoost, GCN, GAT, and GraphSAGE models.
   - `train_baseline.py` & `train_gnn.py`: Training pipelines with stratified splits, cross-validation, and checkpoint management.
   - `metrics.py` & `evaluate.py`: Standard classification/regression metrics alongside power domain metrics (Topological Outage Recall, Line Loading RMSE).

3. **Track 3: Interactive Dashboard (`dashboard/`)**:
   - `app.py`: Streamlit main dashboard in "Grid Sentinel" dark-mode theme.
   - `components/`: Modular UI widgets including interactive network graph visualizers, contingency trip selectors, and AI risk gauge monitors.
   - `stitch_designs/`: High-fidelity HTML mockup templates.

---

## 📁 Repository Structure

```
GridX/
├── data/
│   ├── raw/                 # Raw grid exports and benchmark configurations
│   ├── processed/           # Processed tabular datasets and graph tensors
│   └── README.md            # Data schema documentation
├── src/
│   ├── __init__.py
│   ├── simulation/          # [Track 1] Grid loader & cascade simulation loop
│   │   ├── __init__.py
│   │   ├── grid_loader.py
│   │   ├── cascade_simulator.py
│   │   └── data_generator.py
│   ├── features/            # [Track 2] Feature extraction for ML & GNNs
│   │   ├── __init__.py
│   │   ├── tabular_builder.py
│   │   ├── graph_builder.py
│   │   └── preprocessor.py
│   ├── models/              # [Track 2] ML Baselines & GNN architectures
│   │   ├── __init__.py
│   │   ├── baseline_models.py
│   │   ├── gnn_models.py
│   │   ├── train_baseline.py
│   │   └── train_gnn.py
│   └── evaluation/          # [Track 2] Metrics and benchmark evaluation
│       ├── __init__.py
│       ├── metrics.py
│       └── evaluate.py
├── dashboard/               # [Track 3] Streamlit application
│   ├── app.py               # Main entrypoint ("Grid Sentinel" UI)
│   ├── utils.py             # Caching and model helpers
│   ├── components/          # Modular UI components
│   │   ├── __init__.py
│   │   ├── grid_viewer.py
│   │   ├── simulation_panel.py
│   │   └── prediction_view.py
│   └── stitch_designs/      # Imported Stitch UI screen templates
│       ├── main_dashboard.html
│       └── dataset_model_status.html
├── notebooks/               # Exploratory Jupyter notebooks
│   └── README.md
├── tests/                   # Comprehensive unit & integration tests
│   ├── __init__.py
│   ├── test_simulation.py
│   ├── test_features.py
│   ├── test_models.py
│   └── test_dashboard.py
├── docs/                    # Architecture notes and design specifications
│   └── architecture.md
├── requirements.txt         # Project dependencies
├── README.md                # Project documentation
└── .gitignore               # Git ignore rules
```

---

## 🚀 Getting Started

### 1. Prerequisites & Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/sumitsinha09-stack/GridX.git
cd GridX

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt
```

### 2. Generate Cascading Failure Data (Track 1)

Generate Monte Carlo cascade scenarios across IEEE benchmark grids:

```bash
# Run the simulation data generator
python -m src.simulation.data_generator
```
Output datasets are saved to `data/processed/cascade_dataset.csv`.

### 3. Train Machine Learning & GNN Models (Track 2)

Train both baseline classifiers and Graph Neural Network models:

```bash
# Train Random Forest & XGBoost baselines
python -m src.models.train_baseline

# Train Graph Neural Networks (GCN / GAT / GraphSAGE)
python -m src.models.train_gnn
```
Trained model artifacts are saved to `models/checkpoints/`.

### 4. Launch the "Grid Sentinel" Dashboard (Track 3)

Launch the interactive real-time operator interface:

```bash
streamlit run dashboard/app.py
```
Open your browser at **[http://localhost:8501](http://localhost:8501)**.

### 5. Running the Test Suite

Run the automated test suite covering simulation, feature extraction, models, and UI components:

```bash
pytest tests/ -v
```

---

## 📊 Benchmarks & Supported Grids

| Grid Network | Buses | Lines | Generators | Loads | Typical Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IEEE 39-bus** | 39 | 46 | 10 | 19 | New England power system benchmark for cascade propagation |
| **IEEE 118-bus** | 118 | 186 | 54 | 99 | Mid-scale transmission system for regional stability analysis |
| **IEEE 300-bus** | 300 | 411 | 69 | 201 | Large-scale transmission grid stress testing & GNN scalability |

---

## 🛠️ Technology Stack

- **Power Flow & Physics**: [pandapower](https://www.pandapower.org/), NetworkX, SciPy
- **Data & Feature Engineering**: NumPy, Pandas, Scikit-learn
- **Machine Learning**: XGBoost, Scikit-Learn, Joblib
- **Deep Learning & GNNs**: PyTorch, PyTorch Geometric (`torch-geometric`)
- **Dashboard & Visualization**: Streamlit, Plotly, Pyvis, Matplotlib, Seaborn
- **Testing & Tooling**: Pytest, Black, Flake8

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
