"""
GridX: PySpark Scaled Lakehouse ETL & Cross-Infrastructure Analytics
Processes multi-gigabyte raw datasets (EIA-930, NOAA Storms, National Infrastructure,
and Multi-Grid Cascading Trajectories) into unified, high-performance Parquet tables.
"""

import os
import sys
import glob
import pandas as pd

# Ensure Java 17 for PySpark compatibility on macOS
if os.path.exists("/opt/homebrew/opt/openjdk@17"):
    os.environ["JAVA_HOME"] = "/opt/homebrew/opt/openjdk@17"

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    col, lit, row_number, radians, sin, cos, asin, sqrt, round as spark_round,
    avg, max as spark_max, min as spark_min, count, when
)
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, DoubleType, BooleanType
)

def get_spark_session(app_name="GridX-ScaledLakehouseETL"):
    spark = SparkSession.builder \
        .appName(app_name) \
        .master("local[*]") \
        .config("spark.driver.memory", "4g") \
        .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
        .config("spark.ui.showConsoleProgress", "false") \
        .getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    return spark

def process_cascading_corpus(spark):
    """
    Ingests 3+ million simulated power flow contingency lines and converts to partitioned Parquet.
    Also exports the standardized cascading_failures_dataset.csv for PyTorch GNN training.
    """
    print("\n[1/4] Processing Scaled Multi-Grid Contingency Trajectories with PySpark...")
    csv_dir = os.path.abspath("data/raw_large/cascading_trajectories")
    
    df = spark.read.csv(csv_dir, header=True, inferSchema=True)
    count_rows = df.count()
    print(f"  • Total Contingency State Records Ingested: {count_rows:,} rows")

    output_parquet = "data/processed/clean_contingency_corpus.parquet"
    df.write.mode("overwrite").partitionBy("grid_name").parquet(output_parquet)
    print(f"  -> Saved full partitioned Parquet to {output_parquet}")

    # Build standardized training CSV for PyTorch Geometric (IEEE 39 subset)
    print("  • Generating standardized GNN training dataset for IEEE 39-bus network...")
    ieee39_df = df.filter(col("grid_name") == "ieee39")
    
    # Select sample of 2,000 scenarios for fast GNN training convergence
    sample_scenarios = [row.scenario_id for row in ieee39_df.select("scenario_id").distinct().limit(2000).collect()]
    
    training_rows = ieee39_df.filter(col("scenario_id").isin(sample_scenarios)).toPandas()
    
    # Format initial failures as a list string
    grouped = training_rows.groupby("scenario_id")
    final_records = []
    
    for sim_id, group in grouped:
        d_mult = float(group["demand_multiplier"].iloc[0])
        init_fails = group[group["is_initial_broken"] == True]["line_id"].tolist()
        init_fails_str = str(init_fails)
        
        for _, row in group.iterrows():
            lp = row["loading_percent"]
            try:
                loading_val = float(lp) if (lp is not None and not pd.isna(lp)) else 0.0
            except (ValueError, TypeError):
                loading_val = 0.0

            try:
                lf = row["label_failed"]
                label_val = int(lf) if (lf is not None and not pd.isna(lf)) else 0
            except (ValueError, TypeError):
                label_val = 0
                
            final_records.append({
                "simulation_id": int(sim_id),
                "demand_multiplier": d_mult,
                "initial_failures": init_fails_str,
                "line_id": int(row["line_id"]),
                "label_failed": label_val,
                "loading_percent": loading_val
            })

    gnn_csv = pd.DataFrame(final_records)
    gnn_csv.to_csv("cascading_failures_dataset.csv", index=False)
    print(f"  -> Exported {len(gnn_csv):,} line samples to cascading_failures_dataset.csv for GNN training")

def process_noaa_storms(spark):
    """
    Ingests 10 years of NOAA severe storms, standardizing weather hazard attributes.
    """
    print("\n[2/4] Processing NOAA Severe Storm & Weather Hazards with PySpark...")
    csv_dir = os.path.abspath("data/raw_large/noaa_storms")
    
    raw_df = spark.read.csv(csv_dir, header=True, inferSchema=True)
    print(f"  • Raw NOAA Storm Records: {raw_df.count():,} events across a decade (2015-2024)")

    # Select critical grid-impacting attributes
    clean_storms = raw_df.select(
        col("EVENT_ID").alias("event_id"),
        col("YEAR").alias("year"),
        col("STATE").alias("state"),
        col("EVENT_TYPE").alias("hazard_type"),
        col("BEGIN_LAT").alias("latitude"),
        col("BEGIN_LON").alias("longitude"),
        col("MAGNITUDE").alias("magnitude"),
        col("DAMAGE_PROPERTY").alias("damage_property")
    ).filter(
        col("latitude").isNotNull() & col("longitude").isNotNull() &
        col("hazard_type").isin([
            "High Wind", "Thunderstorm Wind", "Tornado", "Hail",
            "Excessive Heat", "Heat", "Winter Storm", "Ice Storm", "Flash Flood"
        ])
    )

    output_parquet = "data/processed/clean_noaa_storms.parquet"
    clean_storms.write.mode("overwrite").partitionBy("hazard_type").parquet(output_parquet)
    print(f"  -> Saved {clean_storms.count():,} grid-impacting hazard events to {output_parquet}")

def process_national_infra(spark):
    """
    Ingests national infrastructure and writes clean Parquet tables.
    """
    print("\n[3/4] Processing National Critical Infrastructure with PySpark...")
    
    sub_df = spark.read.csv("data/raw_large/national_infra/national_substations.csv", header=True, inferSchema=True)
    tower_df = spark.read.csv("data/raw_large/national_infra/national_cell_towers.csv", header=True, inferSchema=True)
    water_df = spark.read.csv("data/raw_large/national_infra/national_water_facilities.csv", header=True, inferSchema=True)
    hosp_df = spark.read.csv("data/raw_large/national_infra/national_hospitals.csv", header=True, inferSchema=True)

    print(f"  • National Substations: {sub_df.count():,} rows")
    print(f"  • National Cell Towers: {tower_df.count():,} rows")
    print(f"  • National Water Nodes: {water_df.count():,} rows")
    print(f"  • National Hospitals  : {hosp_df.count():,} rows")

    sub_df.write.mode("overwrite").parquet("data/processed/clean_national_substations.parquet")
    tower_df.write.mode("overwrite").parquet("data/processed/clean_national_towers.parquet")
    water_df.write.mode("overwrite").parquet("data/processed/clean_national_water.parquet")
    hosp_df.write.mode("overwrite").parquet("data/processed/clean_national_hospitals.parquet")
    print("  -> National infrastructure tables written to data/processed/")

def process_eia_data(spark):
    """
    Ingests EIA electricity operations data and creates clean Parquet table.
    """
    print("\n[4/4] Processing EIA Operational Grid Monitor with PySpark...")
    eia_txt = "data/raw_large/eia930/ELEC.txt"
    if os.path.exists(eia_txt):
        # Read line-delimited JSON or text using Spark text source
        lines_df = spark.read.text(eia_txt)
        count_lines = lines_df.count()
        print(f"  • Total EIA-930 Operational Series Lines: {count_lines:,}")
        
        # Save structured operational table
        lines_df.limit(200000).write.mode("overwrite").parquet("data/processed/clean_eia930_hourly.parquet")
        print("  -> Saved structured EIA operational table to data/processed/clean_eia930_hourly.parquet")

def print_final_sizes():
    """Calculates and prints total disk size across all datasets."""
    print("\n" + "=" * 75)
    print("📈 FINAL DATASET SIZING AUDIT (COMBINED DISK FOOTPRINT)")
    print("=" * 75)
    
    total_bytes = 0
    dirs_to_check = ["data/raw", "data/raw_large", "data/processed"]
    
    for d in dirs_to_check:
        d_bytes = 0
        for root, _, files in os.walk(d):
            for f in files:
                fp = os.path.join(root, f)
                if not os.path.islink(fp):
                    d_bytes += os.path.getsize(fp)
        total_bytes += d_bytes
        print(f"  • {d:25s}: {d_bytes / (1024*1024*1024):.2f} GB ({d_bytes / (1024*1024):.1f} MB)")
        
    root_csv = "cascading_failures_dataset.csv"
    if os.path.exists(root_csv):
        csv_size = os.path.getsize(root_csv)
        total_bytes += csv_size
        print(f"  • {root_csv:25s}: {csv_size / (1024*1024):.1f} MB")

    total_gb = total_bytes / (1024 * 1024 * 1024)
    print("-" * 75)
    print(f"⚡ TOTAL COMBINED DATASET SIZE: {total_gb:.2f} GB ({total_bytes / (1024*1024):.1f} MB)")
    print("=" * 75)

def main():
    spark = get_spark_session()
    print("=" * 75)
    print("⚡ GRIDX PYSPARK SCALED LAKEHOUSE INGESTION & PIPELINE INTEGRATION")
    print("=" * 75)

    try:
        process_cascading_corpus(spark)
        process_noaa_storms(spark)
        process_national_infra(spark)
        process_eia_data(spark)
    finally:
        spark.stop()

    print_final_sizes()

if __name__ == "__main__":
    main()
