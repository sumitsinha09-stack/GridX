# System Architecture & Component Separation

This project is partitioned into three cleanly separated modules allowing three engineers/researchers to work concurrently without merge conflicts.

```
┌────────────────────────────────────────────────────────┐
│                   Data Pipeline Track                  │
│       pandapower IEEE grids -> N-k cascade sim         │
│          outputs: data/processed/cascade_dataset.csv   │
└──────────────────────────┬─────────────────────────────┘
                           │ produces dataset & graph tensors
                           ▼
┌────────────────────────────────────────────────────────┐
│                      Modeling Track                    │
│   src/features/ -> tabular & PyG graph feature builder │
│   src/models/   -> Baseline ML (RF, XGB) & GNN (PyG)   │
│   src/evaluation/ -> Metrics, ROC, cascade path recall │
└──────────────────────────┬─────────────────────────────┘
                           │ produces serialized checkpoints (.joblib, .pt)
                           ▼
┌────────────────────────────────────────────────────────┐
│                    Dashboard Track                     │
│   dashboard/    -> Streamlit interactive app           │
│   components/   -> Topology visualizer, real-time sim  │
│                    and AI prediction overlay           │
└────────────────────────────────────────────────────────┘
```

## Track Responsibilities & Contracts

### 1. Data Pipeline Track (`src/simulation/`)
- **Owner**: Power Systems / Simulation Engineer
- **Inputs**: Standard IEEE bus cases (IEEE 39, 118, 300).
- **Outputs**: `data/processed/cascade_dataset.csv` with standardized columns (`contingency_id`, `initial_tripped_lines`, `tripped_sequence`, `final_unserved_load_mw`, `blackout_occurred`).
- **Dependencies**: `pandapower`, `pandas`, `numpy`, `networkx`.

### 2. Modeling Track (`src/features/`, `src/models/`, `src/evaluation/`)
- **Owner**: ML / Graph Neural Network Engineer
- **Inputs**: Processed datasets from `data/processed/` or direct pandapower networks.
- **Outputs**: Trained model weights in `models/checkpoints/` (`baseline_rf.joblib`, `gnn_model.pt`) and evaluation summaries.
- **Dependencies**: `scikit-learn`, `xgboost`, `torch`, `torch-geometric`.

### 3. Dashboard Track (`dashboard/`)
- **Owner**: Frontend / Visualization Engineer
- **Inputs**: Calls `src.simulation.grid_loader`, `src.simulation.cascade_simulator`, and loads models via `dashboard/utils.py`.
- **Outputs**: Streamlit UI for grid topology visualization, simulation triggers, and AI forecast overlays.
- **Dependencies**: `streamlit`, `plotly`, `pyvis`.
