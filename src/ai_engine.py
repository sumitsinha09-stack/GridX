import os
import sys
import torch
import numpy as np
from torch_geometric.data import Data
from sklearn.preprocessing import StandardScaler

# Add the project root to Python's path so 'src' can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__init__.__file__), '..')) if '__init__' in locals() else os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import our ML models from the src directory
from src.gnn_model import CascadePredictor
from src.process_dataset import get_base_graph

class GridAI:
    def __init__(self, model_path="models/trained_cascade_model_GAT.pth", mpc_path="data/case39.m"):
        print("Initializing AI Engine...")

        # Convert relative paths to absolute paths based on project root
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        full_model_path = os.path.join(root_dir, model_path)
        full_mpc_path = os.path.join(root_dir, mpc_path)

        # 1. Load the Base Grid Topology
        self.base_node_features, self.base_edge_features, self.edge_index, self.num_lines = get_base_graph(full_mpc_path)

        # 2. Setup Normalizers (Scalers) exactly as done during training
        self.scaler_nodes = StandardScaler().fit(self.base_node_features)
        self.scaler_edges = StandardScaler().fit(self.base_edge_features)

        # 3. Load the Trained GAT Model (The Brain)
        self.model = CascadePredictor(num_node_features=3, num_edge_features=4)
        self.model.load_state_dict(torch.load(full_model_path, map_location=torch.device('cpu'), weights_only=True))
        self.model.eval() # Turn off training mode

        print("AI Engine Ready!")

    def predict_cascade(self, broken_lines: list, demand_multiplier: float = 1.0, node_multipliers: dict = None):
        if node_multipliers is None:
            node_multipliers = {}
        # 1. Simulate Node Changes (Power Demand adjustments)
        sim_node_features = self.base_node_features.copy()
        sim_node_features[:, 0] *= demand_multiplier
        sim_node_features[:, 1] *= demand_multiplier

        # Apply per-node overrides
        for node_id, mult in node_multipliers.items():
            node_id_int = int(node_id)
            if node_id_int < len(sim_node_features):
                sim_node_features[node_id_int, 0] = self.base_node_features[node_id_int, 0] * float(mult)
                sim_node_features[node_id_int, 1] = self.base_node_features[node_id_int, 1] * float(mult)

        x_scaled = self.scaler_nodes.transform(sim_node_features)

        # 2. Simulate Edge Changes (Broken Lines)
        sim_edge_features = self.base_edge_features.copy()
        for line_id in broken_lines:
            if line_id < self.num_lines:
                sim_edge_features[line_id] = 0.0 # Line is dead

        e_scaled = self.scaler_edges.transform(sim_edge_features)

        # 3. Format into PyTorch Tensors
        edge_attr = np.concatenate([e_scaled, e_scaled]) # Duplicate for undirected graph
        x_tensor = torch.tensor(x_scaled, dtype=torch.float)
        edge_index_tensor = torch.tensor(self.edge_index, dtype=torch.long)
        edge_attr_tensor = torch.tensor(edge_attr, dtype=torch.float)

        data = Data(x=x_tensor, edge_index=edge_index_tensor, edge_attr=edge_attr_tensor)

        # 4. Predict!
        with torch.no_grad():
            raw_logits = self.model(data)
            probs = torch.sigmoid(raw_logits).numpy()

        # 5. Extract probabilities for the real lines (first half before duplication)
        final_probs = probs[:self.num_lines]

        # 6. Format a nice output for the Dashboard
        results = {}
        for i in range(self.num_lines):
            if i not in broken_lines: # Don't predict lines that are already broken
                results[i] = float(final_probs[i])

        return results

# Quick test to ensure it works when run directly
if __name__ == "__main__":
    ai = GridAI()

    # Simulate a disaster where Lines 4 and 12 are destroyed
    print("\nSimulating Disaster: Lines 4 and 12 destroyed.")
    predictions = ai.predict_cascade(broken_lines=[4, 12])

    print("\n--- AI Risk Report ---")
    for line, risk in predictions.items():
        if risk > 0.85: # High Risk Threshold
            print(f"⚠️ Line {line}: {risk:.1%} chance of cascading failure!")
