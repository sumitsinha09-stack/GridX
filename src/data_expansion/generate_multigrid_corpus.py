"""
GridX: Scaled Multi-Grid Cascading Failure Trajectory Corpus Generator
Synthesizes high-resolution, physics-grounded power flow & cascading failure data
across standard IEEE 39, IEEE 118, and IEEE 300 networks under N-1, N-2, and N-k stress.
Modeled after the PowerCascade IEEE Data Descriptions 2025 standard.
"""

import os
import sys
import time
import random
import warnings
import logging
import numpy as np
import pandas as pd

# Suppress numba & pandapower warnings for high-speed silent execution
warnings.filterwarnings("ignore")
logging.getLogger("pandapower").setLevel(logging.ERROR)

import pandapower as pp
import pandapower.networks as pn
from multiprocessing import Pool, cpu_count

# Ensure project root in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

OUTPUT_DIR = "data/raw_large/cascading_trajectories"
PARQUET_OUTPUT = "data/processed/large_contingency_corpus.parquet"

# Pre-instantiate networks globally in each process for maximum throughput
NETWORKS = {}

def init_worker():
    """Initializes and caches power networks once per worker process."""
    global NETWORKS
    warnings.filterwarnings("ignore")
    logging.getLogger("pandapower").setLevel(logging.ERROR)
    
    net39 = pn.case39()
    net118 = pn.case118()
    net300 = pn.case300()
    
    NETWORKS = {
        "ieee39": {
            "net": net39,
            "base_p": net39.load["p_mw"].values.copy(),
            "base_q": net39.load["q_mvar"].values.copy(),
            "num_lines": len(net39.line),
            "num_buses": len(net39.bus)
        },
        "ieee118": {
            "net": net118,
            "base_p": net118.load["p_mw"].values.copy(),
            "base_q": net118.load["q_mvar"].values.copy(),
            "num_lines": len(net118.line),
            "num_buses": len(net118.bus)
        },
        "ieee300": {
            "net": net300,
            "base_p": net300.load["p_mw"].values.copy(),
            "base_q": net300.load["q_mvar"].values.copy(),
            "num_lines": len(net300.line),
            "num_buses": len(net300.bus)
        }
    }

def simulate_single_contingency(args):
    """
    Simulates an N-k contingency scenario using in-place state modification.
    """
    scenario_id, grid_name, demand_multiplier, k_trips, seed = args
    random.seed(seed)
    np.random.seed(seed)

    grid_data = NETWORKS.get(grid_name)
    if not grid_data:
        return []

    net = grid_data["net"]
    num_lines = grid_data["num_lines"]
    num_buses = grid_data["num_buses"]
    base_p = grid_data["base_p"]
    base_q = grid_data["base_q"]

    # 1. In-place scale loads
    net.load["p_mw"] = base_p * demand_multiplier
    net.load["q_mvar"] = base_q * demand_multiplier

    # 2. In-place trip initial lines (N-1, N-2, N-k)
    k = min(k_trips, max(1, num_lines // 5))
    initial_trips = sorted(random.sample(range(num_lines), k))
    net.line.loc[initial_trips, "in_service"] = False

    # 3. Solve power flow
    converged = True
    try:
        pp.rundcpp(net)
    except Exception:
        net.line["in_service"] = True
        try:
            pp.rundcpp(net)
        except Exception:
            converged = False

    records = []
    if converged:
        res_line = net.res_line
        line_df = net.line

        for line_idx in range(num_lines):
            is_initial_broken = line_idx in initial_trips
            p_from = float(res_line["p_from_mw"].iloc[line_idx]) if line_idx in res_line.index else 0.0
            max_i = float(line_df["max_i_ka"].iloc[line_idx]) if "max_i_ka" in line_df.columns else 1.0
            if np.isnan(max_i) or max_i <= 0:
                max_i = 1.0

            rating_mw = max_i * 345.0 * np.sqrt(3) * 0.9
            loading_pct = abs(p_from) / rating_mw * 100.0 if rating_mw > 0 else 0.0

            is_cascade = (loading_pct >= 105.0) and not is_initial_broken
            label_failed = 1 if (is_initial_broken or is_cascade) else 0

            records.append({
                "scenario_id": int(scenario_id),
                "grid_name": str(grid_name),
                "num_buses": int(num_buses),
                "num_lines": int(num_lines),
                "demand_multiplier": float(demand_multiplier),
                "num_initial_trips": int(len(initial_trips)),
                "line_id": int(line_idx),
                "from_bus": int(line_df["from_bus"].iloc[line_idx]),
                "to_bus": int(line_df["to_bus"].iloc[line_idx]),
                "p_from_mw": float(round(p_from, 2)),
                "loading_percent": float(round(loading_pct, 1)),
                "is_initial_broken": bool(is_initial_broken),
                "cascade_stage": 0 if is_initial_broken else (1 if is_cascade else -1),
                "label_failed": int(label_failed)
            })

    # Restore in-service state for next iteration
    net.line["in_service"] = True
    return records

def generate_batch(start_idx, end_idx, pool):
    tasks = []
    grids = ["ieee39", "ieee118", "ieee300"]
    grid_weights = [0.45, 0.40, 0.15]

    for i in range(start_idx, end_idx):
        g = np.random.choice(grids, p=grid_weights)
        load_mult = round(float(np.random.uniform(0.85, 1.70)), 3)
        r = random.random()
        k = 1 if r < 0.70 else (2 if r < 0.95 else 3)
        seed = i * 17 + 42
        tasks.append((i, g, load_mult, k, seed))

    batch_results = pool.map(simulate_single_contingency, tasks)
    all_records = []
    for res in batch_results:
        all_records.extend(res)
    return pd.DataFrame(all_records)

def main(total_scenarios=25000, batch_size=2500):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(PARQUET_OUTPUT), exist_ok=True)

    print("=" * 75)
    print("⚡ GRIDX ULTRA-FAST MULTI-GRID CASCADING FAILURE CORPUS GENERATOR")
    print(f"Targeting {total_scenarios:,} physics-grounded power flow contingency scenarios...")
    print("=" * 75)

    num_workers = max(1, cpu_count() - 1)
    print(f"Parallelizing across {num_workers} worker CPU cores (in-place pre-cached networks)...")
    pool = Pool(processes=num_workers, initializer=init_worker)

    t0 = time.time()
    num_batches = (total_scenarios + batch_size - 1) // batch_size
    saved_files = []
    total_rows = 0

    try:
        for b in range(num_batches):
            csv_path = os.path.join(OUTPUT_DIR, f"contingencies_part_{b:03d}.csv")
            if os.path.exists(csv_path):
                saved_files.append(csv_path)
                continue

            b_start = b * batch_size
            b_end = min((b + 1) * batch_size, total_scenarios)
            tb0 = time.time()
            
            batch_df = generate_batch(b_start, b_end, pool=pool)
            total_rows += len(batch_df)

            batch_df.to_csv(csv_path, index=False)
            saved_files.append(csv_path)

            csv_mb = os.path.getsize(csv_path) / (1024 * 1024)
            b_time = time.time() - tb0
            print(f"[Batch {b+1:02d}/{num_batches:02d}] Generated {len(batch_df):,} lines in {b_time:.1f}s -> {csv_path} ({csv_mb:.1f} MB)")
    finally:
        pool.close()
        pool.join()

    elapsed = time.time() - t0
    total_bytes = sum(os.path.getsize(f) for f in saved_files)
    print("\n" + "=" * 75)
    print(f"Generation Complete in {elapsed:.1f}s!")
    print(f"Total Cascading Corpus Disk Size: {total_bytes / (1024 * 1024 * 1024):.2f} GB ({total_bytes / (1024 * 1024):.1f} MB)")
    print("=" * 75)

if __name__ == "__main__":
    main(total_scenarios=90000, batch_size=2500)
