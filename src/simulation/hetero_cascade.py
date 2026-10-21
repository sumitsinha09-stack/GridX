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

        # Map each power bus to all connecting transmission lines
        self.bus_to_lines = {bus_id: [] for bus_id in range(39)}
        for line_id, (u, v) in self.line_to_buses.items():
            self.bus_to_lines[u].append(line_id)
            self.bus_to_lines[v].append(line_id)

        # Pre-compute baseline electrical metrics for each bus
        self.bus_metrics = {}
        for bus_id in range(39):
            p_mw = float(self.grid_ai.base_node_features[bus_id, 0])
            q_mvar = float(self.grid_ai.base_node_features[bus_id, 1])
            vn_kv = float(self.grid_ai.base_node_features[bus_id, 2])
            conn_lines = self.bus_to_lines.get(bus_id, [])
            self.bus_metrics[bus_id] = {
                "p_mw": round(p_mw, 1),
                "q_mvar": round(q_mvar, 1),
                "vn_kv": round(vn_kv, 1),
                "connected_lines": sorted(conn_lines)
            }

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
        time_horizon_hours: float = 4.0,
        tripped_buses: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Executes a complete multi-sector cascading failure simulation across time.
        Supports both transmission line trips and direct substation node trips.
        """
        if node_multipliers is None:
            node_multipliers = {}
        if tripped_buses is None:
            tripped_buses = []

        # 1. Expand node trips into incident transmission line trips
        active_broken = set(broken_lines)
        for b in tripped_buses:
            for l in self.bus_to_lines.get(b, []):
                active_broken.add(l)
        active_broken_lines = sorted(list(active_broken))

        # 2. Run GAT Power Line Risk Inference on redistributed topology
        line_predictions = self.grid_ai.predict_cascade(
            broken_lines=active_broken_lines,
            demand_multiplier=demand_multiplier,
            node_multipliers=node_multipliers
        )

        # 3. Derive Bus Vulnerabilities
        bus_risks = self.compute_bus_failure_probabilities(line_predictions, active_broken_lines)
        for b in tripped_buses:
            bus_risks[b] = 1.0

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

        # 6. Simulate Layer 3: Transportation & Traffic Control Cascade
        traffic_intersections_offline = 0
        transit_corridors_impacted = 0
        transportation_impacts = []

        for bus_id in range(39):
            is_down = bus_id in failed_buses
            num_signals = 18 if bus_id < 12 else (14 if bus_id < 26 else 10)
            has_transit = bus_id in [3, 4, 7, 8, 15, 16, 20, 22, 35]
            if is_down:
                traffic_intersections_offline += num_signals
                if has_transit:
                    transit_corridors_impacted += 1
                transportation_impacts.append({
                    "traffic_grid_id": f"TRF_BUS_{bus_id}",
                    "power_bus_id": bus_id,
                    "intersections_offline": num_signals,
                    "has_electrified_transit": has_transit,
                    "status": "SIGNALS_DARK_GRIDLOCK",
                    "severity": "CRITICAL" if num_signals >= 16 else "MODERATE"
                })

        # 7. Detailed Electrical Bus Telemetry & Load Percentages
        bus_telemetry = {}
        for bus_id in range(39):
            b_meta = self.bus_metrics[bus_id]
            p_mw = b_meta["p_mw"]
            c_lines = b_meta["connected_lines"]
            conn_risks = [line_predictions.get(l, 0.0) for l in c_lines]
            avg_risk = sum(conn_risks) / max(1, len(conn_risks))
            
            is_tripped = bus_id in tripped_buses
            is_failed = bus_risks.get(bus_id, 0.0) >= 0.70 or is_tripped

            if is_tripped:
                load_pct = 0.0
                status_label = "TRIPPED / BREAKER OPEN"
            elif is_failed:
                load_pct = 0.0
                status_label = "BLACKOUT / DE-ENERGIZED"
            else:
                base_load_pct = min(100.0, (p_mw * demand_multiplier / 522.0) * 100) if p_mw > 0 else 48.0
                load_pct = min(100.0, round(base_load_pct * (1.0 + avg_risk * 0.45), 1))
                status_label = "HIGH STRESS" if load_pct >= 85 else ("ELEVATED" if load_pct >= 65 else "NOMINAL")

            w_count = len(self.water_deps_df[self.water_deps_df["power_bus_id"] == bus_id])
            t_count = len(self.telecom_deps_df[self.telecom_deps_df["power_bus_id"] == bus_id])
            h_count = len(self.hosp_deps_df[self.hosp_deps_df["power_bus_id"] == bus_id])
            tr_count = 18 if bus_id < 12 else (14 if bus_id < 26 else 10)

            bus_telemetry[bus_id] = {
                "bus_id": bus_id,
                "name": f"Substation {bus_id}",
                "voltage_kv": b_meta["vn_kv"],
                "p_mw": round(p_mw * demand_multiplier, 1),
                "q_mvar": round(b_meta["q_mvar"] * demand_multiplier, 1),
                "load_percentage": load_pct,
                "status": status_label,
                "outage_risk": round(bus_risks.get(bus_id, 0.0), 3),
                "is_failed": is_failed,
                "is_tripped": is_tripped,
                "connected_lines": c_lines,
                "dependent_water_pumps": w_count,
                "dependent_towers": t_count,
                "dependent_hospitals": h_count,
                "dependent_traffic_signals": tr_count
            }

        # 8. Predictive Cascading Timeline Progression (Future Effects)
        secondary_overloads = [l for l, r in line_predictions.items() if r > 0.70 and l not in active_broken_lines]

        timeline_progression = [
            {
                "stage": 0,
                "time_horizon": "t = 0h (Immediate Shock)",
                "phase": "Primary Substation Trip & Direct Shocks",
                "description": f"{len(tripped_buses)} substations tripped. {len(active_broken_lines)} transmission lines disconnected. Instantaneous loss of {total_pumps_down} water booster pumps ({round(total_water_deficit_gpm, 1):,} GPM deficit) and {traffic_intersections_offline} traffic signal intersections de-energized.",
                "severity": "CRITICAL",
                "sectors_affected": ["Power Grid", "Water Supply", "Transportation"]
            },
            {
                "stage": 1,
                "time_horizon": "t = 1h - 2h (Electrical Wave)",
                "phase": "Dynamic Power Flow Redistribution",
                "description": f"Grid redistribution pushes heavy currents to parallel circuits. GATv2 model predicts {len(secondary_overloads)} secondary lines operating in critical thermal overload range (>100% capacity).",
                "severity": "HIGH",
                "sectors_affected": ["Power Grid"]
            },
            {
                "stage": 2,
                "time_horizon": "t = 4h - 8h (Telecom Depletion)",
                "phase": "Cellular Tower Battery Depletion",
                "description": f"{towers_offline} cellular base stations exhaust emergency DC battery banks and go dark. {towers_on_battery} towers remaining on countdown, degrading municipal communication & SCADA telemetry.",
                "severity": "HIGH" if towers_offline > 0 else "MODERATE",
                "sectors_affected": ["Telecommunications"]
            },
            {
                "stage": 3,
                "time_horizon": "t = 24h - 72h (Fuel Exhaustion)",
                "phase": "Hospital Emergency Generator Starvation",
                "description": f"{hospitals_on_generator} hospitals running on on-site diesel backup. Extended outage beyond 72h causes fuel starvation at {hospitals_critical} hospitals, putting {icu_beds_at_risk:.0f} ICU beds at risk.",
                "severity": "EMERGENCY" if hospitals_critical > 0 else "WARNING",
                "sectors_affected": ["Healthcare & Emergency Services"]
            }
        ]

        # 9. Aggregate System-Wide Telemetry
        summary_metrics = {
            "time_horizon_hours": time_horizon_hours,
            "power_buses_offline": len(failed_buses),
            "power_lines_tripped": len(active_broken_lines),
            "substations_tripped": len(tripped_buses),
            "secondary_lines_at_risk": len(secondary_overloads),
            "water_pumps_tripped": total_pumps_down,
            "estimated_water_loss_gpm": round(total_water_deficit_gpm, 1),
            "traffic_signals_offline": traffic_intersections_offline,
            "transit_corridors_impacted": transit_corridors_impacted,
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
            "bus_telemetry": bus_telemetry,
            "tripped_buses": tripped_buses,
            "broken_lines": active_broken_lines,
            "timeline_progression": timeline_progression,
            "transportation_impacts": transportation_impacts,
            "water_impacts": water_impacts[:25],
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
