"""
GridX: PySpark Multi-Infrastructure Data Preprocessing & Cleaning Pipeline
Standardizes raw Power, Water, Telecom, and Healthcare datasets into
unified, high-performance Parquet lakehouse tables.
"""

import os
import sys
import re
import math
from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, DoubleType, BooleanType
)
from pyspark.sql.functions import col, when, lit, coalesce

def get_spark_session(app_name="GridX-DataPreprocessing"):
    """Initializes and returns an optimized local SparkSession."""
    spark = SparkSession.builder \
        .appName(app_name) \
        .master("local[*]") \
        .config("spark.driver.memory", "4g") \
        .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
        .config("spark.ui.showConsoleProgress", "false") \
        .getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    return spark

# ==============================================================================
# 1. POWER GRID PREPROCESSING (IEEE 39-Bus New England)
# ==============================================================================
def preprocess_power_grid(spark, mpc_path="data/case39.m", output_dir="data/processed/clean_power_buses.parquet"):
    print("[1/4] Preprocessing Power Grid (IEEE 39-Bus)...")
    
    # 39-bus synthetic coordinates mapped onto realistic New England geographic centers
    # Centered across Massachusetts, Connecticut, Rhode Island, Vermont, New Hampshire, Maine
    ne_bus_coords = {
        0: (42.3601, -71.0589, "Boston Substation 1"),
        1: (42.3736, -71.1097, "Cambridge Hub"),
        2: (42.4072, -71.1190, "Somerville Switching"),
        3: (42.4668, -70.9495, "Lynn Terminal"),
        4: (42.5195, -70.8967, "Salem Substation"),
        5: (42.6334, -71.3162, "Lowell High Voltage"),
        6: (42.7070, -71.1631, "Lawrence Substation"),
        7: (42.7654, -71.4676, "Nashua Intertie"),
        8: (42.9956, -71.4548, "Manchester Grid Center"),
        9: (43.2081, -71.5376, "Concord North Transmission"),
        10: (42.2626, -71.8023, "Worcester Main"),
        11: (42.0834, -72.0306, "Southbridge Substation"),
        12: (42.1015, -72.5898, "Springfield Substation"),
        13: (42.2043, -72.6162, "Holyoke Bulk Power"),
        14: (42.5295, -72.5795, "Greenfield Tap"),
        15: (42.4501, -73.2454, "Pittsfield West"),
        16: (42.7876, -73.1093, "North Adams Transformer"),
        17: (41.7658, -72.6734, "Hartford Metro Central"),
        18: (41.5623, -72.6506, "Middletown Substation"),
        19: (41.3083, -72.9279, "New Haven Shoreline"),
        20: (41.1792, -73.1894, "Bridgeport Marine Bus"),
        21: (41.0534, -73.5387, "Stamford Southwest"),
        22: (41.4022, -73.4710, "Danbury Switching"),
        23: (41.5582, -73.0515, "Waterbury Central"),
        24: (41.8240, -71.4128, "Providence Primary"),
        25: (41.6943, -71.1558, "Fall River Interconnect"),
        26: (41.6362, -70.9342, "New Bedford Coastal"),
        27: (41.6688, -70.2962, "Hyannis Cape Hub"),
        28: (42.0003, -71.5167, "Woonsocket Tap"),
        29: (43.6615, -70.2553, "Portland Maine Coastal"),
        30: (44.4759, -73.2121, "Burlington North Plant"),
        31: (43.0718, -70.7626, "Portsmouth Naval Yard Bus"),
        32: (42.2000, -71.4000, "Framingham Regional"),
        33: (42.1500, -71.1000, "Norwood Substation"),
        34: (42.0800, -71.0200, "Brockton Substation"),
        35: (41.9000, -71.0000, "Taunton Switching"),
        36: (42.8000, -72.0000, "Monadnock Intertie"),
        37: (43.5000, -71.5000, "Lakes Region Substation"),
        38: (42.3000, -71.0000, "Quincy Shore Substation")
    }
    
    # Parse mpc bus table for base demands
    bus_demands = {}
    if os.path.exists(mpc_path):
        with open(mpc_path, 'r') as f:
            lines = f.readlines()
        in_bus_section = False
        for line in lines:
            if 'mpc.bus = [' in line:
                in_bus_section = True
                continue
            if in_bus_section:
                if '];' in line:
                    break
                parts = line.strip().split(';')
                row = parts[0].split()
                if len(row) >= 4:
                    try:
                        bus_id = int(row[0]) - 1 # 0-indexed
                        pd = float(row[2]) # MW
                        qd = float(row[3]) # MVAr
                        bus_demands[bus_id] = (pd, qd)
                    except ValueError:
                        pass
                        
    records = []
    for bus_id in range(39):
        lat, lon, name = ne_bus_coords.get(bus_id, (42.36, -71.05, f"Substation {bus_id}"))
        pd, qd = bus_demands.get(bus_id, (100.0, 30.0))
        records.append({
            "bus_id": bus_id,
            "name": name,
            "latitude": float(lat),
            "longitude": float(lon),
            "nominal_mw": float(pd),
            "reactive_mvar": float(qd),
            "voltage_kv": 345.0,
            "infrastructure_type": "POWER_BUS"
        })
        
    df = spark.createDataFrame(records)
    df.write.mode("overwrite").parquet(output_dir)
    print(f"  -> Power Grid saved ({df.count()} buses) to {output_dir}")
    return df

# ==============================================================================
# 2. WATER SUPPLY PREPROCESSING (EPA EPANET Net3)
# ==============================================================================
def preprocess_water_network(spark, inp_path="data/raw/water/Net3.inp", output_dir="data/processed/clean_water_nodes.parquet"):
    print("[2/4] Preprocessing Water Supply (EPANET Net3)...")
    if not os.path.exists(inp_path):
        raise FileNotFoundError(f"Missing {inp_path}")
        
    with open(inp_path, 'r') as f:
        content = f.read()

    # 1. Parse Junctions (demands)
    junctions = {}
    junc_match = re.search(r'\[JUNCTIONS\](.*?)(?=\n\[|\Z)', content, re.DOTALL)
    if junc_match:
        for line in junc_match.group(1).strip().split('\n'):
            line = line.strip()
            if line and not line.startswith(';'):
                parts = line.split()
                if len(parts) >= 3:
                    j_id = parts[0]
                    elev = float(parts[1])
                    demand = float(parts[2])
                    junctions[j_id] = {"elevation": elev, "base_demand_gpm": demand}

    # 2. Parse Pumps
    pumps = set()
    pump_match = re.search(r'\[PUMPS\](.*?)(?=\n\[|\Z)', content, re.DOTALL)
    if pump_match:
        for line in pump_match.group(1).strip().split('\n'):
            line = line.strip()
            if line and not line.startswith(';'):
                parts = line.split()
                if len(parts) >= 3:
                    pump_id = parts[0]
                    from_node = parts[1]
                    to_node = parts[2]
                    pumps.add(pump_id)
                    pumps.add(from_node)
                    pumps.add(to_node)

    # 3. Parse Coordinates & Project to Massachusetts Geographic Space
    # Net3 uses local grid ~ (0,0) to (100, 100).
    # We project it to Greater Boston [Lat: 42.20 to 42.50, Lon: -71.25 to -70.95]
    coords = {}
    coord_match = re.search(r'\[COORDINATES\](.*?)(?=\n\[|\Z)', content, re.DOTALL)
    raw_x, raw_y = [], []
    if coord_match:
        for line in coord_match.group(1).strip().split('\n'):
            line = line.strip()
            if line and not line.startswith(';'):
                parts = line.split()
                if len(parts) >= 3:
                    node_id = parts[0]
                    x = float(parts[1])
                    y = float(parts[2])
                    coords[node_id] = (x, y)
                    raw_x.append(x)
                    raw_y.append(y)

    min_x, max_x = (min(raw_x), max(raw_x)) if raw_x else (0.0, 100.0)
    min_y, max_y = (min(raw_y), max(raw_y)) if raw_y else (0.0, 100.0)
    dx = max(max_x - min_x, 1.0)
    dy = max(max_y - min_y, 1.0)

    # Scale to New England lat/lon
    base_lat_min, base_lat_max = 42.22, 42.52
    base_lon_min, base_lon_max = -71.28, -70.92

    records = []
    for node_id, (rx, ry) in coords.items():
        norm_x = (rx - min_x) / dx
        norm_y = (ry - min_y) / dy
        lat = base_lat_min + norm_y * (base_lat_max - base_lat_min)
        lon = base_lon_min + norm_x * (base_lon_max - base_lon_min)
        
        is_pump = node_id in pumps
        j_info = junctions.get(node_id, {"elevation": 20.0, "base_demand_gpm": 50.0 if not is_pump else 0.0})
        
        records.append({
            "water_node_id": str(node_id),
            "latitude": float(lat),
            "longitude": float(lon),
            "elevation_m": float(j_info["elevation"]),
            "base_demand_gpm": float(j_info["base_demand_gpm"]),
            "is_pump": bool(is_pump),
            "power_required_kw": 250.0 if is_pump else 0.0,
            "backup_hours": 0.0, # Pumps drop instantly without power
            "infrastructure_type": "WATER_PUMP" if is_pump else "WATER_JUNCTION"
        })

    df = spark.createDataFrame(records)
    df.write.mode("overwrite").parquet(output_dir)
    print(f"  -> Water Network saved ({df.count()} nodes, {sum(1 for r in records if r['is_pump'])} pumps) to {output_dir}")
    return df

# ==============================================================================
# 3. TELECOM PREPROCESSING (HIFLD Cell Towers)
# ==============================================================================
def preprocess_telecom_towers(spark, csv_path="data/raw/telecom/cell_towers.csv", output_dir="data/processed/clean_telecom_towers.parquet"):
    print("[3/4] Preprocessing Telecommunications (Cell Towers)...")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Missing {csv_path}")

    raw_df = spark.read.csv(csv_path, header=True, inferSchema=True)
    
    # Clean and filter coordinates to New England region
    clean_df = raw_df.filter(
        (col("latitude").isNotNull()) & 
        (col("longitude").isNotNull()) &
        (col("latitude") >= 40.5) & (col("latitude") <= 45.5) &
        (col("longitude") >= -74.5) & (col("longitude") <= -69.0)
    ).select(
        col("cell_id").cast(StringType()).alias("tower_id"),
        coalesce(col("licensee"), lit("Unknown Carrier")).alias("carrier"),
        coalesce(col("city"), lit("Unknown")).alias("city"),
        coalesce(col("state"), lit("MA")).alias("state"),
        col("latitude").cast(DoubleType()),
        col("longitude").cast(DoubleType()),
        coalesce(col("structure_type"), lit("TOWER")).alias("structure_type"),
        lit(5.0).cast(DoubleType()).alias("nominal_power_kw"),
        lit(6.0).cast(DoubleType()).alias("battery_backup_hours"), # Standard 6-hour battery
        lit("ONLINE").alias("operational_status"),
        lit("TELECOM_TOWER").alias("infrastructure_type")
    )

    clean_df.write.mode("overwrite").parquet(output_dir)
    print(f"  -> Telecom Towers saved ({clean_df.count()} towers) to {output_dir}")
    return clean_df

# ==============================================================================
# 4. HEALTHCARE PREPROCESSING (HIFLD Hospitals)
# ==============================================================================
def preprocess_healthcare(spark, csv_path="data/raw/healthcare/hospitals.csv", output_dir="data/processed/clean_hospitals.parquet"):
    print("[4/4] Preprocessing Healthcare (Hospitals)...")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Missing {csv_path}")

    raw_df = spark.read.csv(csv_path, header=True, inferSchema=True)

    # Filter to New England States matching the grid
    ne_states = ["MA", "CT", "RI", "NH", "VT", "ME"]
    
    clean_df = raw_df.filter(
        (col("State").isin(ne_states)) &
        (col("Latitude").isNotNull()) &
        (col("Longitude").isNotNull())
    ).select(
        col("CCM_ID").cast(StringType()).alias("hospital_id"),
        col("Name").alias("name"),
        coalesce(col("Hospital Type"), lit("GENERAL ACUTE CARE")).alias("hospital_type"),
        coalesce(col("City"), lit("Unknown")).alias("city"),
        col("State").alias("state"),
        col("Latitude").cast(DoubleType()).alias("latitude"),
        col("Longitude").cast(DoubleType()).alias("longitude"),
        coalesce(col("Staffed All Beds"), lit(50.0)).cast(DoubleType()).alias("staffed_beds"),
        coalesce(col("Staffed ICU Beds"), lit(8.0)).cast(DoubleType()).alias("icu_beds"),
        lit(72.0).cast(DoubleType()).alias("generator_fuel_hours"), # FEMA 72h standard
        lit("ONLINE").alias("operational_status"),
        lit("HEALTHCARE_HOSPITAL").alias("infrastructure_type")
    )

    clean_df.write.mode("overwrite").parquet(output_dir)
    print(f"  -> Healthcare Facilities saved ({clean_df.count()} hospitals) to {output_dir}")
    return clean_df

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
if __name__ == "__main__":
    os.makedirs("data/processed", exist_ok=True)
    spark = get_spark_session()
    
    try:
        p_df = preprocess_power_grid(spark)
        w_df = preprocess_water_network(spark)
        t_df = preprocess_telecom_towers(spark)
        h_df = preprocess_healthcare(spark)
        print("\nAll 4 infrastructure datasets successfully preprocessed into Parquet Lakehouse!")
    finally:
        spark.stop()
