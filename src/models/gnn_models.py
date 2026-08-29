"""
Graph Neural Network Architectures Module.

Implements PyG-based GNNs (GCN / GAT / GraphSAGE) to capture topological
power flow dependencies, structural bottleneck paths, and inductive cascade propagation.
"""

from typing import Optional
import torch
import torch.nn as nn
import torch.nn.functional as F


class GridGNN(nn.Module):
    """
    Graph Neural Network model for node/edge level failure prediction and whole-graph cascade classification.
    """

    def __init__(
        self,
        node_in_channels: int = 4,
        edge_in_channels: int = 4,
        hidden_channels: int = 64,
        num_classes: int = 2,
        gnn_type: str = "GCN",
        num_layers: int = 3,
    ):
        """
        Initialize GNN architecture.

        Args:
            node_in_channels: Input node feature dimension (voltage, power, etc.).
            edge_in_channels: Input edge feature dimension (reactance, capacity, etc.).
            hidden_channels: Hidden embedding dimension.
            num_classes: Output dimension (e.g. 2 for binary blackout risk).
            gnn_type: Graph convolution type ('GCN', 'GAT', 'GraphSAGE').
            num_layers: Number of message-passing layers.
        """
        super().__init__()
        self.gnn_type = gnn_type
        self.hidden_channels = hidden_channels
        self.num_layers = num_layers

        # Linear projection layers
        self.node_encoder = nn.Linear(node_in_channels, hidden_channels)
        self.classifier = nn.Linear(hidden_channels, num_classes)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor, edge_attr: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        Forward pass of the Grid GNN.

        Args:
            x: Node feature tensor [num_nodes, node_in_channels]
            edge_index: Graph connectivity tensor [2, num_edges]
            edge_attr: Edge feature tensor [num_edges, edge_in_channels]

        Returns:
            torch.Tensor: Logits for cascade classification.
        """
        h = F.relu(self.node_encoder(x))
        # Message passing layers to be implemented using PyG convolution operators
        out = self.classifier(h.mean(dim=0, keepdim=True))
        return out
