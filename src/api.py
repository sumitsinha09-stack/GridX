import os
import sys
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.ai_engine import GridAI
from src.simulation.hetero_cascade import MultiInfrastructureCascadeEngine

app = FastAPI(title="GridX Multi-Infrastructure API")

# Setup CORS to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI Engine and Heterogeneous Cascade Engine lazily on startup
ai_engine = None
hetero_engine = None

@app.on_event("startup")
async def startup_event():
    global ai_engine, hetero_engine
    print("Loading AI Engine and Multi-Infrastructure Cascade Engine for API...")
    try:
        ai_engine = GridAI(
            model_path="models/trained_cascade_model_GAT.pth",
            mpc_path="data/case39.m"
        )
        print("AI Engine initialized for API.")
    except Exception as e:
        print(f"Error initializing AI Engine: {e}")

    try:
        hetero_engine = MultiInfrastructureCascadeEngine()
        print("Multi-Infrastructure Cascade Engine initialized for API.")
    except Exception as e:
        print(f"Error initializing Multi-Infrastructure Engine: {e}")

# ==============================================================================
# 1. LEGACY ELECTRICAL-ONLY ENDPOINTS (For backward compatibility)
# ==============================================================================
class SimulationRequest(BaseModel):
    broken_lines: List[int]
    demand_multiplier: float = 1.0
    node_multipliers: Dict[int, float] = {}

class SimulationResponse(BaseModel):
    predictions: Dict[int, float]
    num_lines: int
    edges: List[Dict[str, int]]

@app.post("/api/simulate", response_model=SimulationResponse)
async def simulate(req: SimulationRequest):
    if not ai_engine:
        return {"error": "AI engine not loaded."}

    predictions = ai_engine.predict_cascade(
        broken_lines=req.broken_lines,
        demand_multiplier=req.demand_multiplier,
        node_multipliers=req.node_multipliers
    )

    source_nodes = ai_engine.edge_index[0][:ai_engine.num_lines].tolist()
    target_nodes = ai_engine.edge_index[1][:ai_engine.num_lines].tolist()
    edges = [{"source": src, "target": tgt} for src, tgt in zip(source_nodes, target_nodes)]

    return SimulationResponse(
        predictions=predictions,
        num_lines=ai_engine.num_lines,
        edges=edges
    )

# ==============================================================================
# 2. MULTI-INFRASTRUCTURE CASCADING FAILURE ENDPOINTS
# ==============================================================================
class HeteroSimulationRequest(BaseModel):
    broken_lines: List[int] = []
    tripped_buses: List[int] = []
    demand_multiplier: float = 1.0
    node_multipliers: Dict[int, float] = {}
    time_horizon_hours: float = 4.0
    enabled_layers: List[str] = ["POWER", "WATER", "TELECOM", "HEALTHCARE", "TRANSPORTATION"]

@app.post("/api/hetero/simulate")
async def simulate_hetero(req: HeteroSimulationRequest):
    if not hetero_engine:
        return {"error": "Multi-Infrastructure engine not loaded."}

    results = hetero_engine.simulate_multisector_cascade(
        broken_lines=req.broken_lines,
        tripped_buses=req.tripped_buses,
        demand_multiplier=req.demand_multiplier,
        node_multipliers=req.node_multipliers,
        time_horizon_hours=req.time_horizon_hours
    )

    # Compile network graph data for multi-layer 2D/3D force visualizer
    nodes = []
    links = []

    # Layer 0: Power Grid Buses
    if "POWER" in req.enabled_layers:
        for bus_id in range(39):
            bus_risk = results["bus_risks"].get(bus_id, 0.0)
            telemetry = results.get("bus_telemetry", {}).get(bus_id, {})
            is_tripped = bus_id in results.get("tripped_buses", [])
            nodes.append({
                "id": f"P_{bus_id}",
                "name": f"Substation {bus_id}",
                "layer": "POWER",
                "bus_id": bus_id,
                "risk": bus_risk,
                "is_failed": bus_risk >= 0.70 or is_tripped,
                "is_tripped": is_tripped,
                "load_percentage": telemetry.get("load_percentage", 0.0),
                "active_power_mw": telemetry.get("active_power_mw", 0.0),
                "voltage_norm": telemetry.get("voltage_norm", 1.0),
                "status": telemetry.get("status", "ONLINE_NOMINAL"),
                "connected_lines": telemetry.get("connected_lines", []),
                "dependent_assets": telemetry.get("dependent_assets", {})
            })

        # Power lines (Layer 0 intra-edges)
        for line_id, (u, v) in hetero_engine.line_to_buses.items():
            is_broken = line_id in results.get("broken_lines", req.broken_lines)
            is_incident_tripped = (u in results.get("tripped_buses", [])) or (v in results.get("tripped_buses", []))
            links.append({
                "source": f"P_{u}",
                "target": f"P_{v}",
                "layer": "POWER",
                "line_id": line_id,
                "risk": results["power_predictions"].get(line_id, 0.0),
                "is_broken": is_broken,
                "is_severed_by_bus": is_incident_tripped
            })

    # Layer 1: Water Supply
    if "WATER" in req.enabled_layers:
        for w in results["water_impacts"]:
            w_id = f"W_{w['water_node_id']}"
            nodes.append({
                "id": w_id,
                "name": f"Water {'Pump' if w['is_pump'] else 'Junction'} {w['water_node_id']}",
                "layer": "WATER",
                "is_pump": w["is_pump"],
                "status": w["status"],
                "pressure_psi": w["pressure_psi"],
                "is_failed": w["status"] != "NOMINAL_PRESSURE"
            })
            if "POWER" in req.enabled_layers:
                links.append({
                    "source": f"P_{w['power_bus_id']}",
                    "target": w_id,
                    "layer": "INTER_DEPENDENCY",
                    "relation": "powers_water",
                    "is_broken": w["status"] == "OFFLINE_NO_POWER"
                })

    # Layer 2: Telecommunications
    if "TELECOM" in req.enabled_layers:
        for t in results["telecom_impacts"]:
            t_id = f"T_{t['tower_id']}"
            nodes.append({
                "id": t_id,
                "name": f"Cell Tower {t['tower_id']} ({t['carrier']})",
                "layer": "TELECOM",
                "status": t["status"],
                "hours_remaining": t["hours_remaining"],
                "is_failed": t["status"] == "BATTERY_EXHAUSTED"
            })
            if "POWER" in req.enabled_layers:
                links.append({
                    "source": f"P_{t['power_bus_id']}",
                    "target": t_id,
                    "layer": "INTER_DEPENDENCY",
                    "relation": "powers_telecom",
                    "is_broken": t["status"] == "BATTERY_EXHAUSTED"
                })

    # Layer 3: Healthcare Hospitals
    if "HEALTHCARE" in req.enabled_layers:
        for h in results["hospital_impacts"]:
            h_id = f"H_{h['hospital_id']}"
            nodes.append({
                "id": h_id,
                "name": h["name"],
                "layer": "HEALTHCARE",
                "staffed_beds": h["staffed_beds"],
                "icu_beds": h["icu_beds"],
                "status": h["status"],
                "fuel_hours_remaining": h["fuel_hours_remaining"],
                "is_failed": h["status"] == "CRITICAL_POWER_EXHAUSTION"
            })
            if "POWER" in req.enabled_layers:
                links.append({
                    "source": f"P_{h['power_bus_id']}",
                    "target": h_id,
                    "layer": "INTER_DEPENDENCY",
                    "relation": "powers_hospital",
                    "is_broken": h["status"] == "CRITICAL_POWER_EXHAUSTION"
                })

    # Layer 4: Transportation & Traffic Control
    if "TRANSPORTATION" in req.enabled_layers:
        for tr in results.get("transportation_impacts", []):
            tr_id = tr["traffic_grid_id"]
            nodes.append({
                "id": tr_id,
                "name": f"Traffic Zone {tr['power_bus_id']} ({tr['intersections_offline']} Signals)",
                "layer": "TRANSPORTATION",
                "intersections_offline": tr["intersections_offline"],
                "has_electrified_transit": tr["has_electrified_transit"],
                "status": tr["status"],
                "is_failed": True
            })
            if "POWER" in req.enabled_layers:
                links.append({
                    "source": f"P_{tr['power_bus_id']}",
                    "target": tr_id,
                    "layer": "INTER_DEPENDENCY",
                    "relation": "powers_traffic",
                    "is_broken": True
                })

    return {
        "summary": results["summary"],
        "power_predictions": results["power_predictions"],
        "bus_risks": results["bus_risks"],
        "bus_telemetry": results.get("bus_telemetry", {}),
        "tripped_buses": results.get("tripped_buses", []),
        "broken_lines": results.get("broken_lines", []),
        "transportation_impacts": results.get("transportation_impacts", []),
        "timeline_progression": results.get("timeline_progression", []),
        "graph_data": {
            "nodes": nodes,
            "links": links
        }
    }

# ==============================================================================
# 3. SPARK SQL ANALYTICS ENDPOINTS
# ==============================================================================
@app.get("/api/spark/rankings")
async def get_spark_critical_rankings():
    """Returns substation cross-sector criticality rankings computed via Spark SQL."""
    try:
        rankings_path = "data/processed/critical_substation_rankings.parquet"
        if os.path.exists(rankings_path):
            df = pd.read_parquet(rankings_path)
            return {"status": "ok", "rankings": df.to_dict(orient="records")}
        return {"status": "error", "message": "Parquet rankings not found."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/spark/monte-carlo")
async def get_spark_monte_carlo():
    """Returns parallel Monte Carlo results and worst-case scenarios computed via Spark."""
    try:
        mc_path = "data/processed/monte_carlo_results.parquet"
        if os.path.exists(mc_path):
            df = pd.read_parquet(mc_path)
            
            # Top 10 worst case scenarios by ICU beds lost
            worst_scenarios = df.sort_values(by=["icu_beds_at_risk", "power_buses_offline"], ascending=False).head(10)
            
            # Aggregate timeline metrics
            timeline = df.groupby("time_horizon_hours").agg({
                "power_buses_offline": "mean",
                "water_pumps_tripped": "mean",
                "cell_towers_offline": "mean",
                "hospitals_on_generator": "mean",
                "hospitals_critical": "mean",
                "icu_beds_at_risk": "mean"
            }).reset_index().round(1)

            return {
                "status": "ok",
                "total_scenarios_simulated": len(df),
                "timeline": timeline.to_dict(orient="records"),
                "worst_scenarios": worst_scenarios.to_dict(orient="records")
            }
        return {"status": "error", "message": "Monte Carlo parquet not found."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "ai_loaded": ai_engine is not None,
        "hetero_engine_loaded": hetero_engine is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
