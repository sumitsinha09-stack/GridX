import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.ai_engine import GridAI

app = FastAPI(title="GridX API")

# Setup CORS to allow React frontend (running on Vite's default 5173 or others)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI Engine lazily on startup to prevent blocking module import
ai_engine = None

@app.on_event("startup")
async def startup_event():
    global ai_engine
    print("Loading AI Engine for API...")
    try:
        ai_engine = GridAI(
            model_path="models/trained_cascade_model_GAT.pth",
            mpc_path="data/case39.m"
        )
        print("AI Engine initialized for API.")
    except Exception as e:
        print(f"Error initializing AI Engine: {e}")

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

    # Run inference
    predictions = ai_engine.predict_cascade(
        broken_lines=req.broken_lines,
        demand_multiplier=req.demand_multiplier,
        node_multipliers=req.node_multipliers
    )

    # Extract topology for the frontend network graph
    source_nodes = ai_engine.edge_index[0][:ai_engine.num_lines].tolist()
    target_nodes = ai_engine.edge_index[1][:ai_engine.num_lines].tolist()

    edges = [{"source": src, "target": tgt} for src, tgt in zip(source_nodes, target_nodes)]

    return SimulationResponse(
        predictions=predictions,
        num_lines=ai_engine.num_lines,
        edges=edges
    )

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "ai_loaded": ai_engine is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
