import pandas as pd
import numpy as np
import torch
from torch_geometric.data import Data
from sklearn.preprocessing import StandardScaler
import pandapower as pp
import pandapower.converter as pc
import ast

def get_base_graph(mpc_file):
    """Loads the static structure of the grid from the .m file"""
    net = pc.from_mpc(mpc_file, f_hz=60)

    # Node features
    num_nodes = len(net.bus)
    node_features = np.zeros((num_nodes, 3))
    node_features[:, 2] = net.bus['vn_kv'].values
    for _, load in net.load.iterrows():
        bus_idx = int(load['bus'])
        node_features[bus_idx, 0] += load['p_mw']
        node_features[bus_idx, 1] += load['q_mvar']

    # Edge features
    num_edges = len(net.line)
    # We are upgrading from 3 features to 4 features: [R, X, Thermal Limit, Current_Flow_MW]
    edge_features = np.zeros((num_edges, 4))
    edge_features[:, 0] = net.line['r_ohm_per_km'].values * net.line['length_km'].values
    edge_features[:, 1] = net.line['x_ohm_per_km'].values * net.line['length_km'].values
    edge_features[:, 2] = net.line['max_i_ka'].fillna(9999).values
    # Base active power flow through the line in a healthy state (will be adjusted per simulation)
    pp.runpp(net, enforce_q_lims=False) # Run a baseline power flow
    edge_features[:, 3] = net.res_line['p_from_mw'].values

    source_nodes = net.line['from_bus'].values.astype(np.int64)
    target_nodes = net.line['to_bus'].values.astype(np.int64)
    edge_index = np.array([
        np.concatenate([source_nodes, target_nodes]),
        np.concatenate([target_nodes, source_nodes])
    ])

    return node_features, edge_features, edge_index, num_edges

def load_cascading_data(csv_file, mpc_file):
    """Converts the CSV simulations into hundreds of PyTorch Graph objects"""
    print("Loading base MATPOWER grid...")
    base_node_features, base_edge_features, edge_index, num_lines = get_base_graph(mpc_file)

    print(f"Loading cascading simulations from {csv_file}...")
    df = pd.read_csv(csv_file)

    # Normalize features globally so the neural network gets numbers near 0
    scaler_nodes = StandardScaler().fit(base_node_features)
    scaler_edges = StandardScaler().fit(base_edge_features)

    dataset = []
    grouped = df.groupby('simulation_id')

    for sim_id, group in grouped:
        # 1. Adjust node features based on the demand multiplier for this simulation
        demand_mult = group['demand_multiplier'].iloc[0]
        sim_node_features = base_node_features.copy()
        sim_node_features[:, 0] *= demand_mult # Scale Active Power
        sim_node_features[:, 1] *= demand_mult # Scale Reactive Power
        x_scaled = scaler_nodes.transform(sim_node_features)

        # 2. Create labels for all 35 lines
        y_lines = np.zeros(num_lines)
        sim_edge_features = base_edge_features.copy()

        for _, row in group.iterrows():
            line_id = int(row['line_id'])
            if row['label_failed'] == 1:
                y_lines[line_id] = 1.0 # This line triggered a cascade!
            # REMOVED DATA LEAK: We no longer give the AI the post-disaster physics.
            # It only gets the base, healthy power flow from get_base_graph().

        # 3. Handle the lines that were broken to start the disaster
        init_fails = ast.literal_eval(group['initial_failures'].iloc[0])
        for broken_line in init_fails:
            sim_edge_features[broken_line] = 0.0 # Tell the AI this line is dead

        e_scaled = scaler_edges.transform(sim_edge_features)

        # Duplicate for undirected graph (power flows both ways)
        edge_attr = np.concatenate([e_scaled, e_scaled])
        y = np.concatenate([y_lines, y_lines])

        x_tensor = torch.tensor(x_scaled, dtype=torch.float)
        edge_index_tensor = torch.tensor(edge_index, dtype=torch.long)
        edge_attr_tensor = torch.tensor(edge_attr, dtype=torch.float)
        y_tensor = torch.tensor(y, dtype=torch.float)

        # Pack into a PyTorch Geometric Data object
        data = Data(x=x_tensor, edge_index=edge_index_tensor, edge_attr=edge_attr_tensor, y=y_tensor)
        dataset.append(data)

    print(f"Successfully processed {len(dataset)} grid disaster scenarios into graphs!")
    return dataset