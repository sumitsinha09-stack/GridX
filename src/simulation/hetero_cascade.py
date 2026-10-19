"""
GridX: Multi-Infrastructure Cascading Failure Physics Engine
Simulates cross-sector failure propagation across Power, Water, Telecom, and Healthcare
over time horizons: t = 0h (instant), t = 4-8h (battery depletion), t = 72h (fuel exhaustion).
"""

import os
import sys
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

# Ensure project root in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.ai_engine import GridAI

class MultiInfrastructureCascadeEngine:
    def __init__(
        self,
        processed_data_dir: str = "data/processed",
        model_path: str = "models/trained_cascade_model_GAT.pth",
        mpc_path: str = "data/case39.m"
    ):
        print("Initializing Multi-Infrastructure Cascade Engine...")
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
        self.data_dir = os.path.join(root_dir, processed_data_dir)
        
        # 1. Initialize Power Grid GAT AI Engine
        self.grid_ai = GridAI(model_path=model_path, mpc_path=mpc_path)
        self.num_lines = self.grid_ai.num_lines
        self.edge_index = self.grid_ai.edge_index
        
        # Build line-to-bus adjacency
        self.line_to_buses = {}
        for line_id in range(self.num_lines):
            u = int(self.edge_index[0][line_id])
            v = int(self.edge_index[1][line_id])
            self.line_to_buses[line_id] = (u, v)
            
        # 2. Ingest Processed Parquet Dependencies
        print("Loading cross-sector dependency tables from Parquet Lakehouse...")
        self.power_buses_df = pd.read_parquet(os.path.join(self.data_dir, "clean_power_buses.parquet"))
        self.water_deps_df = pd.read_parquet(os.path.join(self.data_dir, "deps_power_water.parquet"))
        self.telecom_deps_df = pd.read_parquet(os.path.join(self.data_dir, "deps_power_telecom.parquet"))
        self.hosp_deps_df = pd.read_parquet(os.path.join(self.data_dir, "deps_power_hospital.parquet"))
        self.critical_rankings_df = pd.read_parquet(os.path.join(self.data_dir, "critical_substation_rankings.parquet"))
        
        # Pre-group dependencies by power bus ID for O(1) fast cascade lookups
        self.bus_to_water = self.water_deps_df.groupby("power_bus_id")
        self.bus_to_telecom = self.telecom_deps_df.groupby("power_bus_id")
        self.bus_to_hospitals = self.hosp_deps_df.groupby("power_bus_id")

        print("Multi-Infrastructure Cascade Engine Ready.")

    def compute_bus_failure_probabilities(
        self,
        line_predictions: Dict[int, float],
        broken_lines: List[int]
    ) -> Dict[int, float]:
        """
        Computes the failure probability of each electrical bus based on
        the status and trip probabilities of incident transmission lines.
        """
        bus_incident_risks = {bus_id: [] for bus_id in range(39)}
        
        for line_id, (u, v) in self.line_to_buses.items():
            if line_id in broken_lines:
                risk = 1.0
            else:
                risk = line_predictions.get(line_id, 0.0)
            bus_incident_risks[u].append(risk)
            bus_incident_risks[v].append(risk)

        bus_risks = {}
        for bus_id, risks in bus_incident_risks.items():
            if not risks:
                bus_risks[bus_id] = 0.0
            else:
                # Bus outage probability increases with multiple high-risk lines
                high_risk_count = sum(1 for r in risks if r > 0.65)
                max_risk = max(risks)
                if high_risk_count >= 2 or max_risk >= 0.95:
                    bus_risks[bus_id] = min(1.0, max_risk * 1.05)
                else:
                    bus_risks[bus_id] = float(max_risk * 0.75)
                    
        return bus_risks

    def simulate_multisector_cascade(
        self,
        broken_lines: List[int],
        demand_multiplier: float = 1.0,
        node_multipliers: Optional[Dict[int, float]] = None,
        time_horizon_hours: float = 4.0
    ) -> Dict[str, Any]:
        """
        Executes a complete 4-sector cascading failure simulation across time.
        """
        if node_multipliers is None:
            node_multipliers = {}

        # 1. Run GAT Power Line Risk Inference
        line_predictions = self.grid_ai.predict_cascade(
            broken_lines=broken_lines,
            demand_multiplier=demand_multiplier,
            node_multipliers=node_multipliers
        )

        # 2. Derive Bus Vulnerabilities
        bus_risks = self.compute_bus_failure_probabilities(line_predictions, broken_lines)
        failed_buses = set([b for b, r in bus_risks.items() if r >= 0.70])

        # 3. Simulate Layer 1: Water Supply Cascade
        water_impacts = []
        total_pumps_down = 0
        total_water_deficit_gpm = 0.0

        for _, row in self.water_deps_df.iterrows():
            bus_id = int(row["power_bus_id"])
            is_bus_down = bus_id in failed_buses
            is_pump = bool(row["is_pump"])
            base_demand = float(row["base_demand_gpm"])
            
            # Water pumps have 0h backup; fail immediately if bus fails
            if is_bus_down and is_pump:
                status = "OFFLINE_NO_POWER"
                total_pumps_down += 1
                total_water_deficit_gpm += 2500.0 # Standard booster pump deficit
            elif is_bus_down:
                status = "LOW_PRESSURE_WARNING"
                total_water_deficit_gpm += base_demand * 0.5
            else:
                status = "NOMINAL_PRESSURE"

            water_impacts.append({
                "water_node_id": str(row["water_node_id"]),
                "power_bus_id": bus_id,
                "is_pump": is_pump,
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "status": status,
                "pressure_psi": 12.0 if is_bus_down else 65.0
            })

        # 4. Simulate Layer 2: Telecommunications Cascade (Battery Decay)
        telecom_impacts = []
        towers_offline = 0
        towers_on_battery = 0

        for _, row in self.telecom_deps_df.iterrows():
            bus_id = int(row["power_bus_id"])
            is_bus_down = bus_id in failed_buses
            battery_cap = float(row.get("battery_backup_hours", 6.0))
            
            if is_bus_down:
                if time_horizon_hours >= battery_cap:
                    status = "BATTERY_EXHAUSTED"
                    towers_offline += 1
                    hours_left = 0.0
                else:
                    status = "ON_BACKUP_BATTERY"
                    towers_on_battery += 1
                    hours_left = max(0.0, battery_cap - time_horizon_hours)
            else:
                status = "ONLINE_GRID_POWER"
                hours_left = battery_cap

            telecom_impacts.append({
                "tower_id": str(row["tower_id"]),
                "power_bus_id": bus_id,
                "carrier": str(row.get("carrier", "Carrier")),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "status": status,
                "hours_remaining": round(hours_left, 1)
            })

        # 5. Simulate Layer 3: Healthcare Cascade (Generator Fuel Decay)
        hospital_impacts = []
        hospitals_critical = 0
        hospitals_on_generator = 0
        icu_beds_at_risk = 0.0

        for _, row in self.hosp_deps_df.iterrows():
            bus_id = int(row["power_bus_id"])
            is_bus_down = bus_id in failed_buses
            fuel_cap = float(row.get("generator_fuel_hours", 72.0))
            icu_beds = float(row.get("icu_beds", 8.0))
            staffed_beds = float(row.get("staffed_beds", 50.0))
            
            if is_bus_down:
                if time_horizon_hours >= fuel_cap:
                    status = "CRITICAL_POWER_EXHAUSTION"
                    hospitals_critical += 1
                    icu_beds_at_risk += icu_beds
                    fuel_hours_left = 0.0
                else:
                    status = "ON_EMERGENCY_GENERATOR"
                    hospitals_on_generator += 1
                    fuel_hours_left = max(0.0, fuel_cap - time_horizon_hours)
            else:
                status = "NORMAL_GRID_FEED"
                fuel_hours_left = fuel_cap

            hospital_impacts.append({
                "hospital_id": str(row["hospital_id"]),
                "name": str(row["name"]),
                "power_bus_id": bus_id,
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "staffed_beds": staffed_beds,
                "icu_beds": icu_beds,
                "status": status,
                "fuel_hours_remaining": round(fuel_hours_left, 1)
            })

        # 6. Aggregate System-Wide Telemetry
        summary_metrics = {
            "time_horizon_hours": time_horizon_hours,
            "power_buses_offline": len(failed_buses),
            "power_lines_tripped": len(broken_lines),
            "water_pumps_tripped": total_pumps_down,
            "estimated_water_loss_gpm": round(total_water_deficit_gpm, 1),
            "cell_towers_offline": towers_offline,
            "cell_towers_on_battery": towers_on_battery,
            "hospitals_on_generator": hospitals_on_generator,
            "hospitals_critical": hospitals_critical,
            "icu_beds_at_risk": icu_beds_at_risk
        }

        return {
            "summary": summary_metrics,
            "power_predictions": line_predictions,
            "bus_risks": bus_risks,
            "water_impacts": water_impacts[:25], # Top subset for API transmission
            "telecom_impacts": telecom_impacts[:50],
            "hospital_impacts": hospital_impacts[:30]
        }

# Self-test block
if __name__ == "__main__":
    engine = MultiInfrastructureCascadeEngine()
    print("\nRunning Test Disaster Scenario (Line 12 & Line 15 tripped, Heatwave 1.4x)...")
    result = engine.simulate_multisector_cascade(broken_lines=[12, 15], demand_multiplier=1.4, time_horizon_hours=8.0)
    print("\n--- MULTI-SECTOR CASCADE TELEMETRY ---")
    for k, v in result["summary"].items():
        print(f"  • {k}: {v}")
