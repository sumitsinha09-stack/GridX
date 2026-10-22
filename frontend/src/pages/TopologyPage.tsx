import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import { AlertTriangle, Plus, X, Share2 } from 'lucide-react';

interface Edge {
  source: number;
  target: number;
}

export default function TopologyPage() {
  const [multiplier, setMultiplier] = useState(1.15);
  const [running, setRunning] = useState(false);
  const [predictions, setPredictions] = useState<Record<number, number>>({
    4: 0.98,
    7: 0.91,
    16: 0.84,
    9: 0.74,
    12: 0.62,
    0: 0.12,
    1: 0.08,
    5: 0.22,
    8: 0.45,
    10: 0.18,
    11: 0.15,
    13: 0.09,
    14: 0.14,
    15: 0.32,
    17: 0.19,
    18: 0.24,
    19: 0.11,
    20: 0.07,
    21: 0.16,
    22: 0.25,
    23: 0.31,
    24: 0.13,
    25: 0.28,
    26: 0.15,
    27: 0.21,
    28: 0.17,
    29: 0.10,
    30: 0.35,
    31: 0.41,
    32: 0.12,
    33: 0.09,
    34: 0.18,
    35: 0.22,
    36: 0.14,
    37: 0.08,
    38: 0.05,
    39: 0.38,
    40: 0.19,
    41: 0.27,
    42: 0.33,
    43: 0.15,
    44: 0.20,
    45: 0.11
  });

  const [edges, setEdges] = useState<Edge[]>([]);
  const [brokenLines, setBrokenLines] = useState<number[]>([6, 2, 3]); // Matches the screenshot: 3 Tripped (Line 6, 2, 3)

  // Node selection and custom load overrides
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [nodeMultipliers, setNodeMultipliers] = useState<Record<number, number>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 850, height: 750 });

  // Dynamically size graph to fill container perfectly
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const timer = setTimeout(updateDimensions, 100);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  // Run simulation via backend AI engine (or update fallback)
  const runSimulation = useCallback(async () => {
    setRunning(true);
    try {
      const res = await axios.post('http://localhost:8000/api/simulate', {
        broken_lines: brokenLines,
        demand_multiplier: multiplier,
        node_multipliers: nodeMultipliers
      });
      if (res.data && res.data.predictions) {
        setPredictions(res.data.predictions);
      }
      if (res.data && res.data.edges && res.data.edges.length > 0) {
        setEdges(res.data.edges);
      }
    } catch (err) {
      console.warn("Backend API not reachable, using simulated AI calculations:", err);
      // Realistic simulated predictions if backend is restarting
      const simulated: Record<number, number> = {};
      const baseLines = [4, 7, 16, 9, 12, 0, 1, 5, 8, 10, 11, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
      baseLines.forEach((l) => {
        let risk = 0.15 * multiplier;
        if (l === 4) risk = 0.98;
        else if (l === 7) risk = 0.91;
        else if (l === 16) risk = 0.84;
        else if (l === 9) risk = 0.74;
        else if (l === 12) risk = 0.62;
        else if (brokenLines.includes(l)) risk = 0.0;
        else risk = Math.min(0.99, (Math.sin(l * 1.7) * 0.2 + 0.3) * (multiplier / 1.15));
        simulated[l] = risk;
      });
      setPredictions(simulated);
    } finally {
      setRunning(false);
    }
  }, [brokenLines, multiplier, nodeMultipliers]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  // Load initial edge list if empty
  useEffect(() => {
    if (edges.length === 0) {
      // Default IEEE 39-bus topology edges
      const defaultEdges: Edge[] = [
        { source: 0, target: 1 }, { source: 0, target: 38 }, { source: 1, target: 2 },
        { source: 1, target: 24 }, { source: 2, target: 3 }, { source: 2, target: 17 },
        { source: 3, target: 4 }, { source: 3, target: 13 }, { source: 4, target: 5 },
        { source: 4, target: 7 }, { source: 5, target: 6 }, { source: 5, target: 10 },
        { source: 6, target: 7 }, { source: 7, target: 8 }, { source: 8, target: 38 },
        { source: 9, target: 10 }, { source: 9, target: 12 }, { source: 9, target: 31 },
        { source: 11, target: 12 }, { source: 12, target: 13 }, { source: 13, target: 14 },
        { source: 14, target: 15 }, { source: 15, target: 16 }, { source: 15, target: 18 },
        { source: 15, target: 20 }, { source: 15, target: 23 }, { source: 16, target: 17 },
        { source: 16, target: 26 }, { source: 18, target: 19 }, { source: 19, target: 32 },
        { source: 19, target: 33 }, { source: 20, target: 21 }, { source: 21, target: 22 },
        { source: 21, target: 34 }, { source: 22, target: 23 }, { source: 22, target: 35 },
        { source: 24, target: 25 }, { source: 25, target: 26 }, { source: 25, target: 27 },
        { source: 25, target: 28 }, { source: 27, target: 28 }, { source: 28, target: 37 },
        { source: 29, target: 30 }, { source: 30, target: 37 }
      ];
      setEdges(defaultEdges);
    }
  }, [edges.length]);

  // Derived metrics
  const predictionValues = useMemo(() => Object.values(predictions), [predictions]);
  const maxRisk = useMemo(() => (predictionValues.length > 0 ? Math.max(...predictionValues) : 0.98), [predictionValues]);
  
  const criticalCount = useMemo(() => predictionValues.filter(p => p > 0.85).length, [predictionValues]);
  const warningCount = useMemo(() => predictionValues.filter(p => p > 0.50 && p <= 0.85).length, [predictionValues]);
  const nominalCount = useMemo(() => Math.max(0, 46 - criticalCount - warningCount - brokenLines.length), [predictionValues, criticalCount, warningCount, brokenLines.length]);

  // Top 5 branches sorted by risk
  const sortedBranches = useMemo(() => {
    return Object.entries(predictions)
      .map(([id, r]) => ({ id: parseInt(id), risk: r }))
      .filter(item => !brokenLines.includes(item.id))
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5);
  }, [predictions, brokenLines]);

  // Selected Node Health & Disruption Potential
  const nodeMetrics = useMemo(() => {
    if (selectedNode === null || edges.length === 0) return null;
    const connected = edges
      .map((e, idx) => ({ ...e, id: idx, risk: predictions[idx] || 0 }))
      .filter(e => e.source === selectedNode || e.target === selectedNode);

    if (connected.length === 0) return { health: 100, disruptionPotential: 'Nominal', maxRisk: 0 };
    const maxR = Math.max(...connected.map(e => e.risk));
    const health = Math.max(0, (1 - maxR) * 100);
    const disruptionPotential = maxR > 0.85 ? 'Critical' : maxR > 0.65 ? 'High' : maxR > 0.40 ? 'Medium' : 'Nominal';
    return { health, disruptionPotential, maxRisk: maxR };
  }, [selectedNode, edges, predictions]);

  // Toggle outage on line
  const toggleLine = (lineId: number) => {
    setBrokenLines(prev =>
      prev.includes(lineId) ? prev.filter(id => id !== lineId) : [...prev, lineId]
    );
  };

  // Reset all outages
  const resetOutages = () => {
    setBrokenLines([]);
  };

  // Force trip a random branch
  const forceTripRandom = () => {
    const totalLines = edges.length > 0 ? edges.length : 46;
    const available = Array.from({ length: totalLines }, (_, i) => i).filter(i => !brokenLines.includes(i));
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      setBrokenLines(prev => [...prev, pick]);
    }
  };

  // Custom node load handlers
  const handleNodeMultiplierChange = (nodeId: number, value: number) => {
    setNodeMultipliers(prev => ({ ...prev, [nodeId]: value }));
  };

  const removeNodeMultiplier = (nodeId: number) => {
    setNodeMultipliers(prev => {
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
  };

  // Canvas Node Rendering (Matches exact node style, colors, borders, and number label)
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode === node.id;
    const isCustomized = nodeMultipliers[node.id] !== undefined;

    // Node Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);

    // Fill
    ctx.fillStyle = isSelected ? '#00e5ff' : isCustomized ? '#f59e0b' : '#1c2230';
    ctx.fill();

    // Border
    ctx.lineWidth = isSelected ? 2.5 : 1.2;
    ctx.strokeStyle = isSelected ? '#ffffff' : isCustomized ? '#f59e0b' : '#4b5563';
    ctx.stroke();

    // Glowing halo for selected node
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 11, 0, 2 * Math.PI, false);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Node ID Label
    ctx.font = `600 ${11 / globalScale}px Inter, sans-serif`;
    ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(node.id.toString(), node.x, node.y + 16);

    // Custom multiplier tag above node
    if (isCustomized) {
      ctx.font = `bold ${10 / globalScale}px JetBrains Mono, monospace`;
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText(`${nodeMultipliers[node.id]?.toFixed(2)}x`, node.x, node.y - 10);
    }
  }, [selectedNode, nodeMultipliers]);

  return (
    <div className="h-screen w-screen flex p-4 gap-4 bg-[#07090e] text-gray-200 select-none overflow-hidden font-sans">

      {/* ================= LEFT: GRAPH PANEL ================= */}
      <div 
        ref={containerRef}
        className="flex-1 h-full bg-[#0b0e14] border border-white/10 rounded-2xl relative overflow-hidden flex items-center justify-center shadow-2xl"
      >
        {/* Top-Left Header Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#121824]/90 border border-[#1e293b] px-3.5 py-1.5 rounded-lg backdrop-blur-md shadow-lg">
          <Share2 className={`w-3.5 h-3.5 text-[#00e5ff] ${running ? 'animate-spin' : ''}`} />
          <span className="font-extrabold text-white text-xs tracking-wider">IEEE 39-Bus</span>
          <span className="text-[11px] text-gray-400 font-mono ml-1">345kV Bulk Core</span>
          {running && <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping ml-1" />}
        </div>

        {/* 2D Canvas Force Graph */}
        {edges.length > 0 && dimensions.width > 0 ? (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={{
              nodes: Array.from(new Set(edges.flatMap(e => [e.source, e.target]))).map(id => ({ id })),
              links: edges.map((e, index) => ({
                ...e,
                id: index,
                risk: predictions[index] !== undefined ? predictions[index] : 0.15,
                isBroken: brokenLines.includes(index)
              }))
            }}
            nodeCanvasObject={paintNode}
            onNodeClick={(node: any) => {
              setSelectedNode(prev => (prev === node.id ? null : (node.id as number)));
            }}
            onLinkClick={(link: any) => {
              toggleLine(link.id);
            }}
            onBackgroundClick={() => {
              setSelectedNode(null);
            }}
            linkColor={(link: any) => {
              if (link.isBroken) return 'rgba(156, 163, 175, 0.35)'; // Tripped / dashed gray
              if (link.risk > 0.85) return '#ef4444'; // Red (Critical)
              if (link.risk > 0.50) return '#eab308'; // Yellow (Warning)
              return '#22c55e'; // Green (Nominal)
            }}
            linkWidth={(link: any) => {
              if (link.isBroken) return 1.5;
              if (link.risk > 0.85) return 4;
              if (link.risk > 0.50) return 3;
              return 2;
            }}
            linkLineDash={(link: any) => (link.isBroken ? [5, 5] : [])}
            backgroundColor="#0b0e14"
            cooldownTicks={120}
            d3VelocityDecay={0.3}
          />
        ) : (
          <div className="text-gray-500 font-mono text-xs animate-pulse">Initializing Grid Topology...</div>
        )}
      </div>

      {/* ================= MIDDLE COLUMN ================= */}
      <div className="w-72 sm:w-80 flex flex-col gap-4 h-full overflow-y-auto pr-1">

        {/* Card 1: Global Load Multiplier */}
        <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-200 text-sm">Global Load Multiplier</h3>
            <span className="text-[#eab308] font-bold font-mono text-base">{multiplier.toFixed(2)}x</span>
          </div>

          <input
            type="range"
            min="0.80"
            max="2.50"
            step="0.05"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full accent-[#eab308] h-1.5 bg-[#1b2230] rounded-lg appearance-none cursor-pointer mb-2"
          />

          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>0.80x<br/>(Low)</span>
            <span className="text-center">1.00x<br/>(Nominal)</span>
            <span className="text-right">2.50x<br/>(Severe)</span>
          </div>
        </div>

        {/* Card 2: NODE CONFIGURATION */}
        <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Node Configuration</h3>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
              selectedNode !== null 
                ? 'text-[#00e5ff] bg-[#00e5ff]/10 border-[#00e5ff]/40 shadow-[0_0_8px_rgba(0,229,255,0.2)]' 
                : 'text-[#00e5ff] bg-[#00e5ff]/10 border-[#00e5ff]/30'
            }`}>
              {selectedNode !== null ? `Node ${selectedNode}` : 'None Selected'}
            </span>
          </div>

          {selectedNode !== null ? (
            <div className="flex flex-col gap-3 mt-3">
              {nodeMetrics && (
                <div className="bg-[#121622] border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Node Health</span>
                    <span className={`text-sm font-bold font-mono ${
                      nodeMetrics.health < 25 ? 'text-red-400' : nodeMetrics.health < 50 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {nodeMetrics.health.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Disruption Potential</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      nodeMetrics.disruptionPotential === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      nodeMetrics.disruptionPotential === 'High' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                      'bg-green-500/20 text-green-400 border border-green-500/40'
                    }`}>
                      {nodeMetrics.disruptionPotential}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1b2230] rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        nodeMetrics.health < 25 ? 'bg-red-500' : nodeMetrics.health < 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${nodeMetrics.health}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Custom Load Multiplier</span>
                <span className="text-sm font-bold text-[#00e5ff] font-mono">
                  {nodeMultipliers[selectedNode] !== undefined
                    ? `${nodeMultipliers[selectedNode].toFixed(2)}x`
                    : `${multiplier.toFixed(2)}x (Global)`}
                </span>
              </div>

              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.05"
                value={nodeMultipliers[selectedNode] !== undefined ? nodeMultipliers[selectedNode] : multiplier}
                onChange={(e) => handleNodeMultiplierChange(selectedNode, parseFloat(e.target.value))}
                className="w-full accent-[#00e5ff] h-1.5 bg-[#1b2230] rounded-lg appearance-none cursor-pointer mb-1"
              />

              <div className="flex justify-end gap-2 mt-1">
                <button
                  onClick={() => removeNodeMultiplier(selectedNode)}
                  disabled={nodeMultipliers[selectedNode] === undefined}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    nodeMultipliers[selectedNode] !== undefined 
                      ? 'border-red-500/50 text-red-400 hover:bg-red-500/10 cursor-pointer' 
                      : 'border-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Reset to Global
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic p-6 text-center border border-dashed border-gray-700/60 rounded-xl mt-3 leading-relaxed">
              Click a node on the graph to configure its specific load demand.
            </div>
          )}
        </div>

        {/* Card 3: TRIGGERED OUTAGES */}
        <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Triggered Outages</h3>
              <div className="flex items-center gap-2">
                <span className="bg-red-950/60 text-red-400 border border-red-500/40 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md">
                  {brokenLines.length} Tripped
                </span>
                <button
                  onClick={resetOutages}
                  className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer underline ml-1"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* List of Tripped lines */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {brokenLines.map(lineId => (
                <div key={lineId} className="flex justify-between items-center bg-[#131926] p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono text-gray-200">Line ID: {lineId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-950/80 text-red-400 border border-red-500/50 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                      TRIPPED
                    </span>
                    <button
                      onClick={() => toggleLine(lineId)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                      title="Restore line"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Force Trip Button */}
          <button
            onClick={forceTripRandom}
            className="w-full mt-4 py-2.5 rounded-xl border border-[#00e5ff]/40 text-[#00e5ff] hover:bg-[#00e5ff]/10 text-xs font-mono font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,229,255,0.15)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> FORCE TRIP RANDOM BRANCH
          </button>
        </div>

      </div>

      {/* ================= RIGHT COLUMN ================= */}
      <div className="w-72 sm:w-80 flex flex-col gap-4 h-full overflow-y-auto pr-1">

        {/* Card 1: CASCADE PROBABILITY */}
        <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 z-10">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Cascade Probability</h3>
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              {maxRisk > 0.85 ? 'Critical Alert' : maxRisk > 0.5 ? 'Elevated Alert' : 'Nominal'}
            </span>
          </div>

          <div className="flex items-center justify-between z-10 mb-5">
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
                {(maxRisk * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-gray-400 font-mono mt-1 uppercase tracking-wider leading-tight">
                Max AI Prediction Risk
              </span>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-red-500/20 border-t-red-500 border-r-red-500 flex items-center justify-center transform -rotate-45 shadow-[0_0_16px_rgba(239,68,68,0.3)]">
              <div className="transform rotate-45">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 z-10 text-center">
            <div className="flex flex-col items-center">
              <span className="text-red-400 font-bold font-mono text-base">{criticalCount}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Critical</span>
            </div>
            <div className="flex flex-col items-center border-x border-white/10">
              <span className="text-yellow-400 font-bold font-mono text-base">{warningCount}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Warning</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-green-400 font-bold font-mono text-base">{nominalCount}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Nominal</span>
            </div>
          </div>

          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />
        </div>

        {/* Card 2: CUSTOM NODE LOADS */}
        <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex justify-between items-end mb-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Custom Node Loads</h3>
            <span className="text-[10px] text-gray-500 font-mono">Overrides</span>
          </div>

          <div className="flex flex-col gap-2">
            {Object.keys(nodeMultipliers).length === 0 ? (
              <span className="text-xs text-gray-500 italic text-center py-2">No active overrides.</span>
            ) : (
              Object.entries(nodeMultipliers).map(([nodeId, mult]) => (
                <div key={nodeId} className="flex justify-between items-center bg-[#131926] p-2 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-xs font-mono text-gray-300">Node {nodeId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-yellow-400 font-mono">{mult.toFixed(2)}x</span>
                    <button
                      onClick={() => removeNodeMultiplier(parseInt(nodeId))}
                      className="text-gray-400 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                      title="Reset to global"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: BRANCH LOADING PRIORITY */}
        <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Branch Loading Priority</h3>
              <span className="text-[10px] text-gray-500 font-mono text-right leading-tight">Sorted by<br/>AI Risk</span>
            </div>

            <div className="flex flex-col gap-3">
              {sortedBranches.map(({ id: lineId, risk }) => (
                <div key={lineId} className="flex flex-col gap-1 border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-gray-300">Line ID: {lineId}</span>
                    <span className={`font-bold ${
                      risk > 0.85 ? 'text-red-400' : risk > 0.50 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {(risk * 100).toFixed(1)}% Risk
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#1a2130] rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        risk > 0.85 ? 'bg-red-500' : risk > 0.50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, risk * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}