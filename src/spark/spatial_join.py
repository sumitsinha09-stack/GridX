"""
GridX: PySpark Distributed Spatial Dependency Join
Computes geospatial dependencies across Power, Water, Telecom, and Healthcare
using PySpark Broadcast Joins and spherical Haversine distance.
"""

import os
import sys

# Ensure Java 17 for PySpark compatibility on macOS
if "JAVA_HOME" not in os.environ or "openjdk@17" not in os.environ.get("JAVA_HOME", ""):
    if os.path.exists("/opt/homebrew/opt/openjdk@17"):
        os.environ["JAVA_HOME"] = "/opt/homebrew/opt/openjdk@17"

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    col, broadcast, row_number, radians, sin, cos, asin, sqrt, lit, round as spark_round, count, sum as spark_sum
)

def get_spark_session(app_name="GridX-SpatialDependencyJoin"):
    """Initializes SparkSession for distributed geospatial joins."""
    spark = SparkSession.builder \
        .appName(app_name) \
        .master("local[*]") \
        .config("spark.driver.memory", "4g") \
        .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
        .config("spark.ui.showConsoleProgress", "false") \
        .getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    return spark

def compute_haversine_distance(lat1_col, lon1_col, lat2_col, lon2_col):
    """
    Computes great-circle distance between two GPS coordinates in kilometers
    using standard PySpark SQL columnar math functions.
    """
    R = 6371.0 # Earth's radius in km
    
    dlat = radians(lat2_col - lat1_col)
    dlon = radians(lon2_col - lon1_col)
    
    lat1_rad = radians(lat1_col)
    lat2_rad = radians(lat2_col)
    
    a = sin(dlat / 2.0) ** 2 + cos(lat1_rad) * cos(lat2_rad) * (sin(dlon / 2.0) ** 2)
    c = 2.0 * asin(sqrt(a))
    return spark_round(lit(R) * c, 2)

def run_spatial_dependency_pipeline():
    spark = get_spark_session()
    print("=" * 70)
    print("⚡ GRIDX PYSPARK DISTRIBUTED SPATIAL DEPENDENCY PIPELINE")
    print("=" * 70)
    
    # 1. Load Preprocessed Parquet Tables
    print("\n[1/4] Ingesting Parquet Lakehouse Tables...")
    power_df = spark.read.parquet("data/processed/clean_power_buses.parquet")
    water_df = spark.read.parquet("data/processed/clean_water_nodes.parquet")
    telecom_df = spark.read.parquet("data/processed/clean_telecom_towers.parquet")
    hospitals_df = spark.read.parquet("data/processed/clean_hospitals.parquet")
    
    print(f"  • Power Grid Substations : {power_df.count()} buses")
    print(f"  • Water Supply Facilities: {water_df.count()} nodes")
    print(f"  • Telecom Base Stations  : {telecom_df.count()} towers")
    print(f"  • Healthcare Facilities  : {hospitals_df.count()} hospitals")

    # Prepare Power Buses for broadcast join (power buses are small: 39 rows)
    power_broadcast = power_df.select(
        col("bus_id").alias("power_bus_id"),
        col("name").alias("power_bus_name"),
        col("latitude").alias("bus_lat"),
        col("longitude").alias("bus_lon")
    )

    # 2. Join Water Network -> Nearest Power Bus
    print("\n[2/4] Executing Spatial Join: Water Nodes -> Power Buses...")
    water_with_dist = water_df.crossJoin(broadcast(power_broadcast)) \
        .withColumn("distance_km", compute_haversine_distance(col("latitude"), col("longitude"), col("bus_lat"), col("bus_lon")))
    
    water_window = Window.partitionBy("water_node_id").orderBy(col("distance_km").asc())
    water_deps = water_with_dist.withColumn("rn", row_number().over(water_window)) \
        .filter(col("rn") == 1) \
        .drop("rn", "bus_lat", "bus_lon") \
        .withColumn("dependency_type", lit("POWERS_WATER"))
    
    water_deps.write.mode("overwrite").parquet("data/processed/deps_power_water.parquet")
    print(f"  -> Water dependencies mapped & saved ({water_deps.count()} links)")

    # 3. Join Telecom Towers -> Nearest Power Bus
    print("\n[3/4] Executing Spatial Join: Telecom Towers -> Power Buses...")
    telecom_with_dist = telecom_df.crossJoin(broadcast(power_broadcast)) \
        .withColumn("distance_km", compute_haversine_distance(col("latitude"), col("longitude"), col("bus_lat"), col("bus_lon")))
    
    telecom_window = Window.partitionBy("tower_id").orderBy(col("distance_km").asc())
    telecom_deps = telecom_with_dist.withColumn("rn", row_number().over(telecom_window)) \
        .filter(col("rn") == 1) \
        .drop("rn", "bus_lat", "bus_lon") \
        .withColumn("dependency_type", lit("POWERS_TELECOM"))
    
    telecom_deps.write.mode("overwrite").parquet("data/processed/deps_power_telecom.parquet")
    print(f"  -> Telecom dependencies mapped & saved ({telecom_deps.count()} links)")

    # 4. Join Healthcare Hospitals -> Nearest Power Bus
    print("\n[4/4] Executing Spatial Join: Hospitals -> Power Buses...")
    hosp_with_dist = hospitals_df.crossJoin(broadcast(power_broadcast)) \
        .withColumn("distance_km", compute_haversine_distance(col("latitude"), col("longitude"), col("bus_lat"), col("bus_lon")))
    
    hosp_window = Window.partitionBy("hospital_id").orderBy(col("distance_km").asc())
    hosp_deps = hosp_with_dist.withColumn("rn", row_number().over(hosp_window)) \
        .filter(col("rn") == 1) \
        .drop("rn", "bus_lat", "bus_lon") \
        .withColumn("dependency_type", lit("POWERS_HOSPITAL"))
    
    hosp_deps.write.mode("overwrite").parquet("data/processed/deps_power_hospital.parquet")
    print(f"  -> Healthcare dependencies mapped & saved ({hosp_deps.count()} links)")

    # 5. Build Unified Interdependent Edge Table for GNN & Cascade Engine
    print("\n[5/5] Synthesizing Unified Multi-Layer Edge Parquet...")
    
    # Normalize edges to unified schema: [source_id, source_type, target_id, target_type, relation, distance_km]
    e_water = water_deps.select(
        col("power_bus_id").cast("string").alias("source_id"),
        lit("POWER_BUS").alias("source_type"),
        col("water_node_id").cast("string").alias("target_id"),
        col("infrastructure_type").alias("target_type"),
        lit("powers").alias("relation"),
        col("distance_km")
    )

    e_telecom = telecom_deps.select(
        col("power_bus_id").cast("string").alias("source_id"),
        lit("POWER_BUS").alias("source_type"),
        col("tower_id").cast("string").alias("target_id"),
        lit("TELECOM_TOWER").alias("target_type"),
        lit("powers").alias("relation"),
        col("distance_km")
    )

    # Telecom provides reverse SCADA telemetry edge to Power
    e_scada = telecom_deps.select(
        col("tower_id").cast("string").alias("source_id"),
        lit("TELECOM_TOWER").alias("source_type"),
        col("power_bus_id").cast("string").alias("target_id"),
        lit("POWER_BUS").alias("target_type"),
        lit("monitors_scada").alias("relation"),
        col("distance_km")
    )

    e_hosp = hosp_deps.select(
        col("power_bus_id").cast("string").alias("source_id"),
        lit("POWER_BUS").alias("source_type"),
        col("hospital_id").cast("string").alias("target_id"),
        lit("HEALTHCARE_HOSPITAL").alias("target_type"),
        lit("powers").alias("relation"),
        col("distance_km")
    )

    unified_edges_df = e_water.unionByName(e_telecom).unionByName(e_scada).unionByName(e_hosp)
    unified_edges_df.write.mode("overwrite").parquet("data/processed/interdependent_edges.parquet")
    print(f"  -> Total Interdependent Cross-Sector Edges: {unified_edges_df.count()} edges")

    # 6. Spark SQL Aggregations: Critical Substation Cross-Sector Rankings
    print("\n" + "=" * 70)
    print("📈 SPARK SQL CRITICALITY ANALYSIS: SUBSTATION IMPACT METRICS")
    print("=" * 70)
    
    telecom_deps.createOrReplaceTempView("telecom_deps")
    hosp_deps.createOrReplaceTempView("hosp_deps")
    water_deps.createOrReplaceTempView("water_deps")
    power_df.createOrReplaceTempView("power_buses")

    critical_substations_sql = """
        SELECT 
            p.bus_id,
            p.name AS substation_name,
            COALESCE(h.total_hospitals, 0) AS dependent_hospitals,
            COALESCE(h.total_icu_beds, 0) AS icu_beds_at_risk,
            COALESCE(t.total_towers, 0) AS dependent_cell_towers,
            COALESCE(w.total_pumps, 0) AS dependent_water_pumps
        FROM power_buses p
        LEFT JOIN (
            SELECT power_bus_id, COUNT(hospital_id) as total_hospitals, SUM(icu_beds) as total_icu_beds
            FROM hosp_deps GROUP BY power_bus_id
        ) h ON p.bus_id = h.power_bus_id
        LEFT JOIN (
            SELECT power_bus_id, COUNT(tower_id) as total_towers
            FROM telecom_deps GROUP BY power_bus_id
        ) t ON p.bus_id = t.power_bus_id
        LEFT JOIN (
            SELECT power_bus_id, COUNT(water_node_id) as total_pumps
            FROM water_deps WHERE is_pump = true GROUP BY power_bus_id
        ) w ON p.bus_id = w.power_bus_id
        ORDER BY icu_beds_at_risk DESC, dependent_hospitals DESC
    """
    
    critical_df = spark.sql(critical_substations_sql)
    critical_df.show(10, truncate=False)
    critical_df.write.mode("overwrite").parquet("data/processed/critical_substation_rankings.parquet")
    print("  -> Substation criticality rankings saved to data/processed/critical_substation_rankings.parquet")
    
    spark.stop()
    print("\nSpatial Dependency Pipeline completed successfully!")

if __name__ == "__main__":
    run_spatial_dependency_pipeline()
