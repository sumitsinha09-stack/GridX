import torch
import torch.nn.functional as F
from torch_geometric.nn import GATv2Conv
from torch_geometric.loader import DataLoader
from sklearn.metrics import precision_score, recall_score, f1_score
import numpy as np

from src.process_dataset import load_cascading_data

class CascadePredictor(torch.nn.Module):
    def __init__(self, num_node_features, num_edge_features):
        super(CascadePredictor, self).__init__()
        # 1. Message Passing Layers (Now using Graph Attention Networks!)
        # heads=2 means the AI looks at the grid from 2 different perspectives simultaneously.
        self.conv1 = GATv2Conv(num_node_features, 16, heads=2, concat=True) # Output size: 16 * 2 = 32
        self.conv2 = GATv2Conv(32, 32, heads=1, concat=True) # Output size: 32 * 1 = 32

        # 2. Edge Prediction Multi-Layer Perceptron (MLP)
        # We concatenate: Source Node (32) + Target Node (32) + Edge Physics (num_edge_features)
        self.edge_mlp = torch.nn.Sequential(
            torch.nn.Linear(32 + 32 + num_edge_features, 32),
            torch.nn.ReLU(),
            torch.nn.Linear(32, 1)
        )

    def forward(self, data):
        x, edge_index, edge_attr = data.x, data.edge_index, data.edge_attr

        # 1. Update node knowledge based on neighbors using Attention!
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = self.conv2(x, edge_index)
        x = F.relu(x)

        # 2. Extract Source (row) and Target (col) nodes for every edge
        row, col = edge_index

        # 3. COMBINE EVERYTHING: Source Node + Target Node + Physics Edge Data!
        edge_representation = torch.cat([x[row], x[col], edge_attr], dim=-1)

        # 4. Predict failure probability
        edge_predictions = self.edge_mlp(edge_representation)

        return edge_predictions.squeeze()

def train_model():
    print("Loading Real Simulation Data...")
    dataset = load_cascading_data("cascading_failures_dataset.csv", "data/case39.m")

    # Split into Train (80%) and Test (20%)
    train_size = int(0.8 * len(dataset))
    train_dataset = dataset[:train_size]
    test_dataset = dataset[train_size:]

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

    model = CascadePredictor(
        num_node_features=dataset[0].num_node_features,
        num_edge_features=dataset[0].edge_attr.shape[1]
    )
    # Lowered learning rate slightly because GAT is a more complex model and needs careful tuning
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005)

    # Handle Class Imbalance
    total_edges = sum([d.y.shape[0] for d in train_dataset])
    total_failures = sum([d.y.sum().item() for d in train_dataset])
    total_survivals = total_edges - total_failures

    weight = total_survivals / (total_failures + 1e-5)
    pos_weight = torch.tensor([weight])
    loss_function = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    print(f"\nImbalance fixed: Penalty Weight = {weight:.1f}x")
    print("Starting Training (Graph Attention Network) on 80% of data for 50 Epochs...")

    for epoch in range(51):
        model.train()
        total_loss = 0

        for batch in train_loader:
            optimizer.zero_grad()
            predictions = model(batch)
            loss = loss_function(predictions, batch.y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        if epoch % 10 == 0:
            print(f"Epoch {epoch:03d} | Avg Loss: {total_loss/len(train_loader):.4f}")

    print("\nTraining Complete! Evaluating on 20% unseen Test Data...")

    model.eval()
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in test_loader:
            raw_logits = model(batch)
            probs = torch.sigmoid(raw_logits)

            # Thresholding: We only trigger an alarm if the AI is > 85% confident
            binary_preds = (probs > 0.85).float()

            all_preds.extend(binary_preds.numpy())
            all_labels.extend(batch.y.numpy())

    # Calculate Precision and Recall
    precision = precision_score(all_labels, all_preds, zero_division=0)
    recall = recall_score(all_labels, all_preds, zero_division=0)
    f1 = f1_score(all_labels, all_preds, zero_division=0)

    print(f"\n--- Real-World Metrics on Unseen Grid Scenarios (GAT Model) ---")
    print(f"Recall (Did we catch the failures?):                   {recall:.2%}")
    print(f"Precision (When we guessed failure, were we right?):   {precision:.2%}")
    print(f"F1 Score (Overall balance):                            {f1:.2%}")

    torch.save(model.state_dict(), "trained_cascade_model_GAT.pth")
    print("\nModel saved to 'trained_cascade_model_GAT.pth'")

if __name__ == "__main__":
    train_model()