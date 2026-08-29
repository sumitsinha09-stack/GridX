# Data Directory Structure

This directory stores raw grid topologies, simulated cascade event logs, and processed tabular/graph datasets.

## Directory Layout
- `raw/`: Raw pandapower grid exports, benchmark IEEE system network definitions, and initial contingency definitions.
- `processed/`: Formatted feature tables and graph tensors ready for ML and GNN training.
  - `cascade_dataset.csv`: Tabular sequence dataset containing pre-contingency line loads, node voltages, initial tripped lines, and final cascade labels (binary line outage / cascade size).
  - `graph_snapshots/`: Serialized PyTorch Geometric `.pt` graph tensors containing node features (voltage, active/reactive power), edge features (reactance, thermal capacity, current loading), and edge outage target labels.
