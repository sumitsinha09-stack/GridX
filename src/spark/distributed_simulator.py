"""
GridX: PySpark Distributed Monte Carlo Cascading Failure Simulator
Parallelizes thousands of multi-infrastructure disaster scenarios across
Spark workers to compute vulnerability distributions and critical asset metrics.
"""

import os
import sys
import random
import json

# Ensure Java 17 for PySpark
if "JAVA_HOME" not in os.environ or "openjdk@17" not in os.environ.get("JAVA_HOME", ""):
    if os.path.exists("/opt/homebrew/opt/openjdk@17"):
        os.environ["JAVA_HOME"] = "/opt/homebrew/opt/openjdk@17"

from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, IntegerType, DoubleType, StringType, LongType
)

def get_spark_session(app_name="GridX-MonteCarloSimulator"):
    spark = SparkSession.builder \
        .appName(app_name) \
        .master("local[*]") \
        .config("spark.driver.memory", "4g") \
        .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
        .config("spark.ui.showConsoleProgress", "false") \
        .getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    return spark

def run_simulation_partition(partition_iter):
    """
    Worker function executed independently on Spark partitions.
    Instantiates the CascadeEngine locally on each worker core.
    """
    from src.simulation.hetero_cascade import MultiInfrastructureCascadeEngine
    
    # Initialize engine once per partition/worker
    engine = MultiInfrastructureCascadeEngine()
    
    results = []
    for scenario in partition_iter:
        scenario_id = scenario["scenario_id"]
        broken_lines = scenario["broken_lines"]
        demand_mult = scenario["demand_multiplier"]
        time_hours = scenario["time_horizon_hours"]
        
        sim_out = engine.simulate_multisector_cascade(
            broken_lines=broken_lines,
            demand_multiplier=demand_mult,
            time_horizon_hours=time_hours
        )
        
        summary = sim_out["summary"]
        results.append({
            "scenario_id": int(scenario_id),
            "broken_lines_str": ",".join(map(str, broken_lines)),
            "num_broken_lines": len(broken_lines),
            "demand_multiplier": float(demand_mult),
            "time_horizon_hours": float(time_hours),
            "power_buses_offline": int(summary["power_buses_offline"]),
            "water_pumps_tripped": int(summary["water_pumps_tripped"]),
            "water_loss_gpm": float(summary["estimated_water_loss_gpm"]),
            "cell_towers_offline": int(summary["cell_towers_offline"]),
            "hospitals_on_generator": int(summary["hospitals_on_generator"]),
            "hospitals_critical": int(summary["hospitals_critical"]),
            "icu_beds_at_risk": float(summary["icu_beds_at_risk"])
        })
        
    return iter(results)

def main(num_scenarios=1000):
    spark = get_spark_session()
    print("=" * 70)
    print("⚡ GRIDX PYSPARK MASSIVELY PARALLEL MONTE CARLO SIMULATION")
    print(f"Generating and evaluating {num_scenarios} cross-sector contingency scenarios...")
    print("=" * 70)

    # 1. Generate diverse stochastic scenarios (N-1, N-2 contingency + heatwave load shocks)
    random.seed(42)
    scenarios = []
    time_horizons = [0.0, 4.0, 12.0, 24.0, 72.0]
    
    for i in range(num_scenarios):
        # 70% N-1 single line cut, 30% N-2 double line cut
        if random.random() < 0.70:
            broken = [random.randint(0, 34)]
        else:
            broken = sorted(random.sample(range(35), 2))
            
        load_mult = round(random.uniform(1.0, 1.6), 2)
        t_hours = random.choice(time_horizons)
        
        scenarios.append({
            "scenario_id": i,
            "broken_lines": broken,
            "demand_multiplier": load_mult,
            "time_horizon_hours": t_hours
        })

    # 2. Parallelize across Spark RDD partitions
    print(f"\n[1/3] Distributing {num_scenarios} scenarios across Spark cluster...")
    scenarios_rdd = spark.sparkContext.parallelize(scenarios, numSlices=16)

    # 3. Execute in Parallel via mapPartitions
    print("[2/3] Simulating multi-layer cascades in parallel across worker cores...")
    simulation_results_rdd = scenarios_rdd.mapPartitions(run_simulation_partition)

    schema = StructType([
        StructField("scenario_id", IntegerType(), False),
        StructField("broken_lines_str", StringType(), False),
        StructField("num_broken_lines", IntegerType(), False),
        StructField("demand_multiplier", DoubleType(), False),
        StructField("time_horizon_hours", DoubleType(), False),
        StructField("power_buses_offline", IntegerType(), False),
        StructField("water_pumps_tripped", IntegerType(), False),
        StructField("water_loss_gpm", DoubleType(), False),
        StructField("cell_towers_offline", IntegerType(), False),
        StructField("hospitals_on_generator", IntegerType(), False),
        StructField("hospitals_critical", IntegerType(), False),
        StructField("icu_beds_at_risk", DoubleType(), False)
    ])

    results_df = spark.createDataFrame(simulation_results_rdd, schema)
    results_df.write.mode("overwrite").parquet("data/processed/monte_carlo_results.parquet")
    print(f"  -> Monte Carlo results saved ({results_df.count()} records) to data/processed/monte_carlo_results.parquet")

    # 4. Spark SQL Analytics: Systemic Vulnerability Patterns
    print("\n[3/3] Running Spark SQL Vulnerability Aggregations...")
    results_df.createOrReplaceTempView("monte_carlo")

    print("\n--- WORST-CASE N-1 / N-2 CASCADING FAILURE SCENARIOS ---")
    spark.sql("""
        SELECT 
            broken_lines_str AS tripped_lines,
            demand_multiplier AS load_multiplier,
            time_horizon_hours AS hours,
            power_buses_offline,
            water_pumps_tripped,
            cell_towers_offline,
            hospitals_critical,
            ROUND(icu_beds_at_risk, 0) AS icu_beds_lost
        FROM monte_carlo
        ORDER BY icu_beds_at_risk DESC, power_buses_offline DESC
        LIMIT 5
    """).show(truncate=False)

    print("\n--- SECTOR IMPACT BY TIME HORIZON ---")
    spark.sql("""
        SELECT 
            time_horizon_hours,
            ROUND(AVG(power_buses_offline), 1) AS avg_buses_down,
            ROUND(AVG(water_pumps_tripped), 1) AS avg_pumps_down,
            ROUND(AVG(cell_towers_offline), 1) AS avg_towers_down,
            ROUND(AVG(hospitals_on_generator), 1) AS avg_hospitals_on_gen,
            ROUND(AVG(hospitals_critical), 1) AS avg_hospitals_critical,
            ROUND(AVG(icu_beds_at_risk), 1) AS avg_icu_beds_lost
        FROM monte_carlo
        GROUP BY time_horizon_hours
        ORDER BY time_horizon_hours ASC
    """).show()

    spark.stop()
    print("PySpark Distributed Simulation completed successfully!")

if __name__ == "__main__":
    main(num_scenarios=250)
