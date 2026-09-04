import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ShieldAlert, Zap, PlusCircle, AlertTriangle, Play, ChevronRight, Activity, X } from 'lucide-react';

import ForceGraph2D from 'react-force-graph-2d';

export default function TopologyTab() {
  const [multiplier, setMultiplier] = useState(1.35);
  const [running, setRunning] = useState(false);
  const [predictions, setPredictions] = useState<Record<number, number>>({});
  const [edges, setEdges] = useState<{source: number, target: number}[]>([]);
  const [brokenLines, setBrokenLines] = useState<number[]>([6, 2]); // Lines 6-7, 2-3 roughly mapped for demo

  // New state for node interaction
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [nodeMultipliers, setNodeMultipliers] = useState<Record<number, number>>({});

  const [activeScenario, setActiveScenario] = useState('heatwave');
  const [activeViz, setActiveViz] = useState('heatmap');

  const runSimulation = async () => {
    setRunning(true);
    try {
      const res = await axios.post('http://localhost:8000/api/simulate', {
        broken_lines: brokenLines,
        demand_multiplier: multiplier,
        node_multipliers: nodeMultipliers
      });
      setPredictions(res.data.predictions);
      setEdges(res.data.edges);
    } catch (err) {
      console.error("Failed to run simulation:", err);
      // Fallback dummy data if backend isn't running yet
      setPredictions({ 4: 0.98, 7: 0.91, 16: 0.84, 9: 0.74, 12: 0.62 });
    }
    setRunning(false);
  };

  useEffect(() => {
    runSimulation();
  }, [multiplier, nodeMultipliers, brokenLines]); // Auto-run when inputs change

  // Calculate Node Health & Disruption Potential
  const getSelectedNodeMetrics = () => {
    if (selectedNode === null || edges.length === 0) return null;

    // Find all edges connected to this node
    const connectedEdges = edges.map((e, idx) => ({ ...e, id: idx, risk: predictions[idx] || 0 }))
                                .filter(e => e.source === selectedNode || e.target === selectedNode);

    if (connectedEdges.length === 0) return { health: 100, disruptionPotential: 'Low', maxRisk: 0 };

    const maxRisk = Math.max(...connectedEdges.map(e => e.risk));
    const health = Math.max(0, (1 - maxRisk) * 100);

    let disruptionPotential = 'Low';
    if (maxRisk > 0.85) disruptionPotential = 'Critical';
    else if (maxRisk > 0.65) disruptionPotential = 'High';
    else if (maxRisk > 0.40) disruptionPotential = 'Medium';

    return { health, disruptionPotential, maxRisk };
  };

  const nodeMetrics = getSelectedNodeMetrics();

  // Handle setting multiplier for a specific node
  const handleNodeMultiplierChange = (nodeId: number, value: number) => {
    setNodeMultipliers(prev => ({
      ...prev,
      [nodeId]: value
    }));
  };

  const removeNodeMultiplier = (nodeId: number) => {
    setNodeMultipliers(prev => {
      const updated = { ...prev };
      delete updated[nodeId];
      return updated;
    });
  };

  // Node drawing logic to highlight the selected node and customized nodes
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode === node.id;
    const isCustomized = nodeMultipliers[node.id] !== undefined;

    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);

    // Core color
    ctx.fillStyle = isSelected ? '#00cce6' : isCustomized ? '#ff9900' : '#1b1d27';
    ctx.fill();

    // Border
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeStyle = isSelected ? '#ffffff' : isCustomized ? '#ff9900' : '#444';
    ctx.stroke();

    // Always show Node ID below the node
    ctx.font = `${10 / globalScale}px Sans-Serif`;
    ctx.fillStyle = '#a1a1aa'; // gray-400
    ctx.textAlign = 'center';
    ctx.fillText(node.id.toString(), node.x, node.y + 12);

    // Label for customized nodes
    if (isCustomized) {
       ctx.font = `${10 / globalScale}px Sans-Serif`;
       ctx.fillStyle = '#ff9900';
       ctx.textAlign = 'center';
       ctx.fillText(`${nodeMultipliers[node.id]?.toFixed(2)}x`, node.x, node.y - 8);
    }
  }, [selectedNode, nodeMultipliers]);

  return (
    <div className="h-full w-full flex p-4 gap-4 bg-grid-bg text-gray-300">

      {/* LEFT SIDEBAR: Controls */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2">

        {/* Global Load Multiplier */}
        <div className="panel p-4 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-300 text-sm">Global Load Multiplier</h3>
            <span className="text-grid-warning font-bold font-mono">{multiplier.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.8" max="2.5" step="0.05"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full accent-grid-warning mb-2"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>0.80x<br/>(Low)</span>
            <span className="text-center">1.00x<br/>(Nominal)</span>
            <span className="text-right">2.50x<br/>(Severe)</span>
          </div>
        </div>

        {/* Node Selection Overlay */}
        <div className="panel p-4 flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Node Configuration</h3>
            <span className="text-xs text-grid-accent font-mono bg-grid-accent/10 px-1.5 py-0.5 rounded">
              {selectedNode !== null ? `Node ${selectedNode}` : 'None Selected'}
            </span>
          </div>

          {selectedNode !== null ? (
            <div className="flex flex-col gap-2 mt-2">
              {nodeMetrics && (
                <div className="bg-[#12141c] border border-grid-border rounded p-3 mb-2 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-gray-400">Node Health</span>
                     <span className={`text-sm font-bold ${nodeMetrics.health < 15 ? 'text-grid-danger' : nodeMetrics.health < 35 ? 'text-grid-warning' : 'text-grid-nominal'}`}>
                       {nodeMetrics.health.toFixed(1)}%
                     </span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-gray-400">Disruption Potential</span>
                     <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${nodeMetrics.disruptionPotential === 'Critical' ? 'bg-grid-danger/20 text-grid-danger' : nodeMetrics.disruptionPotential === 'High' ? 'bg-grid-warning/20 text-grid-warning' : 'bg-grid-nominal/20 text-grid-nominal'}`}>
                       {nodeMetrics.disruptionPotential}
                     </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1b1d27] rounded-full overflow-hidden mt-1">
                     <div
                        className={`h-full ${nodeMetrics.health < 15 ? 'bg-grid-danger' : nodeMetrics.health < 35 ? 'bg-grid-warning' : 'bg-grid-nominal'}`}
                        style={{ width: `${nodeMetrics.health}%` }}
                     />
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Custom Load Multiplier</span>
                <span className="text-sm font-bold text-grid-accent">
                  {nodeMultipliers[selectedNode] !== undefined
                    ? `${nodeMultipliers[selectedNode].toFixed(2)}x`
                    : `${multiplier.toFixed(2)}x (Global)`}
                </span>
              </div>
              <input
                type="range"
                min="0.0" max="3.0" step="0.05"
                value={nodeMultipliers[selectedNode] !== undefined ? nodeMultipliers[selectedNode] : multiplier}
                onChange={(e) => handleNodeMultiplierChange(selectedNode, parseFloat(e.target.value))}
                className="w-full accent-grid-accent mb-1"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => removeNodeMultiplier(selectedNode)}
                  disabled={nodeMultipliers[selectedNode] === undefined}
                  className={`text-xs px-2 py-1 rounded border ${nodeMultipliers[selectedNode] !== undefined ? 'border-grid-danger text-grid-danger hover:bg-grid-danger/10' : 'border-gray-700 text-gray-600'}`}
                >
                  Reset to Global
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic p-4 text-center border border-dashed border-gray-700 rounded mt-2">
              Click a node on the graph to configure its specific load demand.
            </div>
          )}
        </div>

        {/* Triggered Outages */}
        <div className="panel p-4 flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Triggered Outages</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-grid-danger font-mono bg-grid-danger/10 px-1.5 py-0.5 rounded">{brokenLines.length} Tripped</span>
              {brokenLines.length > 0 && (
                <button
                  onClick={() => setBrokenLines([])}
                  className="text-xs text-gray-400 hover:text-white transition-colors underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {brokenLines.map((lineId) => (
            <div key={lineId} className="bg-[#12141c] border border-grid-border rounded p-2.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-grid-danger animate-pulse" />
                <span className="text-sm font-mono text-gray-300">Line ID: {lineId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-danger">TRIPPED</span>
                <button
                  onClick={() => setBrokenLines(brokenLines.filter(id => id !== lineId))}
                  className="text-gray-500 hover:text-grid-danger transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => {
            let newLine;
            let attempts = 0;
            // IEEE 39-bus system has 46 branches (0 to 45). Find one that isn't already broken.
            do {
               newLine = Math.floor(Math.random() * 46);
               attempts++;
            } while (brokenLines.includes(newLine) && attempts < 100);

            if (!brokenLines.includes(newLine)) {
              setBrokenLines([...brokenLines, newLine]);
            }
          }} className="mt-1 text-xs text-grid-accent flex items-center justify-center gap-1 p-2 border border-dashed border-grid-accent/30 rounded hover:bg-grid-accent/10 transition-colors">
            <PlusCircle className="w-3 h-3" />
            FORCE TRIP RANDOM BRANCH
          </button>
        </div>

        <button
          onClick={runSimulation}
          disabled={running}
          className="w-full bg-grid-accent hover:bg-[#00cce6] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-auto"
        >
          {running ? <Activity className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {running ? 'CALCULATING...' : 'Run Monte Carlo Solver'}
        </button>
      </div>

      {/* CENTER: Grid Visualization */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="panel flex-1 relative flex flex-col p-0 overflow-hidden">
          {/* Viz Header */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="bg-grid-bg/80 backdrop-blur p-2 border border-grid-border rounded-lg flex items-center gap-2 pointer-events-auto">
                <ShareIcon />
                <span className="font-bold text-white text-sm">IEEE 39-Bus New England</span>
              </div>
              <span className="text-xs text-gray-500 font-mono">345kV Bulk Core</span>
            </div>
          </div>

          {/* Actual D3/NetworkX Graph */}
          <div className="flex-1 bg-[#0b0c10] flex items-center justify-center relative border border-grid-border m-4 mt-16 rounded-xl overflow-hidden cursor-crosshair">
             {edges.length > 0 ? (
               <ForceGraph2D
                 width={800}
                 height={600}
                 graphData={{
                   nodes: Array.from(new Set(edges.flatMap(e => [e.source, e.target]))).map(id => ({ id })),
                   links: edges.map((e, index) => ({
                     ...e,
                     id: index,
                     risk: predictions[index] || 0,
                     isBroken: brokenLines.includes(index)
                   }))
                 }}
                 nodeCanvasObject={paintNode}
                 onNodeClick={(node) => setSelectedNode(node.id as number)}
                 linkColor={(link: any) => {
                   if (link.isBroken) return 'rgba(100, 100, 100, 0.5)';
                   if (link.risk > 0.85) return '#ef4444'; // Red
                   if (link.risk > 0.65) return '#eab308'; // Yellow
                   return '#22c55e'; // Green
                 }}
                 linkWidth={(link: any) => link.isBroken ? 1 : link.risk > 0.85 ? 4 : link.risk > 0.65 ? 3 : 2}
                 linkLineDash={(link: any) => link.isBroken ? [5, 5] : []}
                 backgroundColor="#0b0c10"
               />
             ) : (
               <>
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #1b1d27 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
                 <span className="text-gray-500 font-mono animate-pulse">Waiting for Simulation Data...</span>
               </>
             )}
          </div>

          {/* Viz Legend */}
          <div className="absolute bottom-4 left-8 right-8 flex justify-between items-center text-[10px] font-mono text-gray-400">
             <div className="flex gap-4">
                <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-grid-nominal" /> Safe &lt;65%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-grid-warning" /> Intermediate Safe 65-85%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-grid-danger" /> Risky &gt;85%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-gray-500 border border-dashed border-gray-400" /> Severed / Tripped</div>
             </div>
             <div>Synchronous Area: 60.00 Hz Base</div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto pl-2">
         {/* Cascade Probability */}
         <div className="panel p-4 flex flex-col relative overflow-hidden shrink-0">
            <div className="flex justify-between items-center mb-6 z-10">
               <h3 className="font-bold text-white text-sm uppercase tracking-wider">Cascade Probability</h3>
               <span className="bg-grid-danger text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                  {Object.values(predictions).some(p => p > 0.85) ? 'Critical Alert' : 'Nominal'}
               </span>
            </div>

            <div className="flex items-center justify-between z-10">
               <div className="flex flex-col">
                  <span className="text-5xl font-bold text-white tracking-tighter">
                     {Object.values(predictions).length > 0
                        ? `${(Math.max(...Object.values(predictions)) * 100).toFixed(1)}%`
                        : '0.0%'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono mt-1 uppercase w-32 leading-tight">Max AI Prediction Risk</span>
               </div>
               <div className="w-16 h-16 rounded-full border-4 border-grid-danger/20 border-t-grid-danger border-r-grid-danger flex items-center justify-center transform -rotate-45">
                  <div className="transform rotate-45">
                     <AlertTriangle className="w-6 h-6 text-grid-danger" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-grid-border z-10">
               <div className="flex flex-col items-center">
                  <span className="text-grid-danger font-bold text-lg">{Object.values(predictions).filter(p => p > 0.85).length}</span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">Critical</span>
               </div>
               <div className="flex flex-col items-center border-x border-grid-border">
                  <span className="text-grid-warning font-bold text-lg">{Object.values(predictions).filter(p => p > 0.5 && p <= 0.85).length}</span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">Warning</span>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-grid-nominal font-bold text-lg">{Object.values(predictions).filter(p => p <= 0.5).length}</span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">Nominal</span>
               </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-grid-danger/10 blur-3xl rounded-full" />
         </div>

         {/* Affected Custom Nodes Panel */}
         <div className="panel p-4 flex flex-col shrink-0">
            <div className="flex justify-between items-end mb-4">
               <h3 className="font-bold text-white text-sm uppercase tracking-wider w-32">Custom Node Loads</h3>
               <span className="text-[10px] text-gray-500 font-mono text-right">Overrides</span>
            </div>

            <div className="flex flex-col gap-2">
               {Object.keys(nodeMultipliers).length === 0 ? (
                 <span className="text-xs text-gray-500 italic text-center py-2">No active overrides.</span>
               ) : (
                 Object.entries(nodeMultipliers).map(([nodeId, mult]) => (
                   <div key={nodeId} className="flex justify-between items-center bg-[#12141c] p-2 rounded border border-grid-border">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-grid-warning animate-pulse" />
                        <span className="text-sm font-mono text-gray-300">Node {nodeId}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="font-bold text-grid-warning">{mult.toFixed(2)}x</span>
                        <button
                           onClick={() => removeNodeMultiplier(parseInt(nodeId))}
                           className="text-gray-500 hover:text-grid-danger transition-colors"
                           title="Reset to global"
                        >
                           <X className="w-4 h-4" />
                        </button>
                     </div>
                   </div>
                 ))
               )}
            </div>
         </div>

         {/* Branch Loading Priority */}
         <div className="panel p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-end mb-4">
               <h3 className="font-bold text-white text-sm uppercase tracking-wider w-32">Branch Loading Priority</h3>
               <span className="text-[10px] text-gray-500 font-mono text-right">Sorted by<br/>AI Risk</span>
            </div>

            <div className="flex flex-col gap-3">
               {Object.entries(predictions)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([lineId, risk]) => (
                  <div key={lineId} className="flex flex-col gap-1 border-b border-grid-border pb-3">
                     <div className="flex justify-between font-mono text-sm">
                        <span className="text-gray-300">Line ID: {lineId}</span>
                        <span className={`font-bold ${risk > 0.85 ? 'text-grid-danger' : risk > 0.5 ? 'text-grid-warning' : 'text-grid-nominal'}`}>
                           {(risk * 100).toFixed(1)}% Risk
                        </span>
                     </div>
                     <div className="w-full h-1 bg-[#12141c] rounded-full overflow-hidden">
                        <div
                           className={`h-full ${risk > 0.85 ? 'bg-grid-danger' : risk > 0.5 ? 'bg-grid-warning' : 'bg-grid-nominal'}`}
                           style={{ width: `${risk * 100}%` }}
                        />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

// Simple icons for UI match
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-grid-accent">
      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-grid-accent">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}