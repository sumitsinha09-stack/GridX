import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, Zap, AlertTriangle, Activity, X, Droplets, Radio, Hospital, Clock, Layers, Flame
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

interface SummaryMetrics {
  time_horizon_hours: number;
  power_buses_offline: number;
  power_lines_tripped: number;
  water_pumps_tripped: number;
  estimated_water_loss_gpm: number;
  cell_towers_offline: number;
  cell_towers_on_battery: number;
  hospitals_on_generator: number;
  hospitals_critical: number;
  icu_beds_at_risk: number;
}

export default function TopologyPage() {
  const [multiplier, setMultiplier] = useState(1.35);
  const [running, setRunning] = useState(false);
  const [brokenLines, setBrokenLines] = useState<number[]>([12, 15]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [nodeMultipliers, setNodeMultipliers] = useState<Record<number, number>>({});
  
  // Multi-infrastructure expansion states
  const [timeHorizon, setTimeHorizon] = useState<number>(4.0);
  const [enabledLayers, setEnabledLayers] = useState<string[]>(['POWER', 'WATER', 'TELECOM', 'HEALTHCARE']);
  
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [predictions, setPredictions] = useState<Record<number, number>>({});
  const [busRisks, setBusRisks] = useState<Record<number, number>>({});
  const [summary, setSummary] = useState<SummaryMetrics>({
    time_horizon_hours: 4.0,
    power_buses_offline: 0,
    power_lines_tripped: 2,
    water_pumps_tripped: 0,
    estimated_water_loss_gpm: 0,
    cell_towers_offline: 0,
    cell_towers_on_battery: 0,
    hospitals_on_generator: 0,
    hospitals_critical: 0,
    icu_beds_at_risk: 0
  });

  const toggleLayer = (layer: string) => {
    setEnabledLayers(prev => 
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    );
  };

  const runSimulation = async () => {
    setRunning(true);
    try {
      const res = await axios.post('http://localhost:8000/api/hetero/simulate', {
        broken_lines: brokenLines,
        demand_multiplier: multiplier,
        node_multipliers: nodeMultipliers,
        time_horizon_hours: timeHorizon,
        enabled_layers: enabledLayers
      });

      setSummary(res.data.summary);
      setPredictions(res.data.power_predictions || {});
      setBusRisks(res.data.bus_risks || {});
      setGraphData(res.data.graph_data || { nodes: [], links: [] });
    } catch (err) {
      console.error("Failed to run multi-infrastructure simulation:", err);
    }
    setRunning(false);
  };

  useEffect(() => {
    runSimulation();
  }, [multiplier, nodeMultipliers, brokenLines, timeHorizon, enabledLayers]);

  // Handle setting multiplier for a specific power bus
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

  // Node drawing logic to visually differentiate the 4 sectors
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isLight = document.body.classList.contains('light-theme');
    const layer = node.layer;

    ctx.save();

    if (layer === 'POWER') {
      const busId = node.bus_id;
      const isCustomized = nodeMultipliers[busId] !== undefined;
      const isFailed = node.is_failed;
      const r = isSelected ? 8 : 6;

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = isFailed ? '#ef4444' : isCustomized ? '#ff9900' : isSelected ? '#00cce6' : '#3b82f6';
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Label
      ctx.font = `${11 / globalScale}px Monospace`;
      ctx.fillStyle = isLight ? '#1f2937' : '#e5e7eb';
      ctx.textAlign = 'center';
      ctx.fillText(`P${busId}`, node.x, node.y + r + 10);

    } else if (layer === 'WATER') {
      const isFailed = node.is_failed;
      const isPump = node.is_pump;
      const size = isPump ? 10 : 6;

      ctx.beginPath();
      ctx.rect(node.x - size / 2, node.y - size / 2, size, size);
      ctx.fillStyle = isFailed ? '#9ca3af' : '#06b6d4'; // Gray if failed, Cyan if nominal
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isFailed ? '#ef4444' : '#67e8f9';
      ctx.stroke();

      ctx.font = `${9 / globalScale}px Sans-Serif`;
      ctx.fillStyle = '#06b6d4';
      ctx.textAlign = 'center';
      ctx.fillText(isPump ? 'PUMP' : `W${node.id.split('_')[1]}`, node.x, node.y + size + 8);

    } else if (layer === 'TELECOM') {
      const isFailed = node.is_failed;
      const size = 6;

      // Draw Diamond for Telecom Tower
      ctx.beginPath();
      ctx.moveTo(node.x, node.y - size);
      ctx.lineTo(node.x + size, node.y);
      ctx.lineTo(node.x, node.y + size);
      ctx.lineTo(node.x - size, node.y);
      ctx.closePath();
      ctx.fillStyle = isFailed ? '#4b5563' : '#a855f7'; // Purple
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isFailed ? '#ef4444' : '#c084fc';
      ctx.stroke();

      ctx.font = `${8 / globalScale}px Sans-Serif`;
      ctx.fillStyle = '#c084fc';
      ctx.textAlign = 'center';
      ctx.fillText(node.status === 'ON_BACKUP_BATTERY' ? `🔋${node.hours_remaining}h` : '📡', node.x, node.y + size + 7);

    } else if (layer === 'HEALTHCARE') {
      const isFailed = node.is_failed;
      const size = 12;

      ctx.beginPath();
      ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = isFailed ? '#dc2626' : node.status === 'ON_EMERGENCY_GENERATOR' ? '#f59e0b' : '#10b981';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw '+' Cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(node.x - 1, node.y - 4, 2, 8);
      ctx.fillRect(node.x - 4, node.y - 1, 8, 2);

      ctx.font = `${9 / globalScale}px Bold Sans-Serif`;
      ctx.fillStyle = isFailed ? '#f87171' : '#34d399';
      ctx.textAlign = 'center';
      ctx.fillText(`${node.icu_beds} ICU`, node.x, node.y + size / 2 + 9);
    }

    ctx.restore();
  }, [selectedNode, nodeMultipliers]);

  return (
    <div className="min-h-full w-full flex p-4 gap-4 bg-grid-bg text-grid-text-muted">

      {/* LEFT SIDEBAR: Controls & Multi-Infrastructure Settings */}
      <div className="w-80 flex flex-col gap-4 pr-2 overflow-y-auto">

        {/* Multi-Sector Layer Switcher */}
        <div className="panel p-4 shrink-0 bg-grid-panel border border-grid-border rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-grid-accent" />
            <h3 className="font-bold text-grid-text text-sm uppercase tracking-wider">Infrastructure Layers</h3>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: 'POWER', label: '⚡ Power Grid (IEEE 39-Bus)', color: 'text-blue-400', count: '39 Buses' },
              { id: 'WATER', label: '💧 Water Supply (EPANET)', color: 'text-cyan-400', count: '4 Pumps' },
              { id: 'TELECOM', label: '📡 Telecom Towers (FCC/HIFLD)', color: 'text-purple-400', count: '624 Towers' },
              { id: 'HEALTHCARE', label: '🏥 Hospitals (COVID Care Map)', color: 'text-emerald-400', count: '289 Facilities' },
            ].map(layer => (
              <label 
                key={layer.id} 
                className={`flex items-center justify-between p-2 rounded cursor-pointer border transition-colors ${
                  enabledLayers.includes(layer.id) ? 'bg-grid-bg-alt border-grid-border' : 'opacity-40 border-transparent hover:opacity-70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={enabledLayers.includes(layer.id)}
                    onChange={() => toggleLayer(layer.id)}
                    className="accent-grid-accent rounded"
                  />
                  <span className={`text-xs font-bold ${layer.color}`}>{layer.label}</span>
                </div>
                <span className="text-[10px] text-grid-text-dim font-mono">{layer.count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Cascade Horizon Slider */}
        <div className="panel p-4 shrink-0 bg-grid-panel border border-grid-border rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-grid-warning" />
              <h3 className="font-bold text-grid-text text-sm uppercase tracking-wider">Cascade Horizon</h3>
            </div>
            <span className="text-grid-warning font-mono font-bold text-sm">{timeHorizon.toFixed(0)}h</span>
          </div>
          <input
            type="range"
            min="0" max="72" step="4"
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(parseFloat(e.target.value))}
            className="w-full accent-grid-warning mb-2"
          />
          <div className="flex justify-between text-[9px] text-grid-text-dim font-mono">
            <span>0h<br/>Shock</span>
            <span>4h-8h<br/>Battery Drop</span>
            <span>24h<br/>Emergency</span>
            <span className="text-right">72h<br/>Fuel Depleted</span>
          </div>
        </div>

        {/* Global Load Multiplier */}
        <div className="panel p-4 shrink-0 bg-grid-panel border border-grid-border rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="font-bold text-grid-text text-sm uppercase tracking-wider">Heatwave Load Multiplier</h3>
            </div>
            <span className="text-orange-400 font-bold font-mono">{multiplier.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.8" max="2.2" step="0.05"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full accent-orange-400 mb-2"
          />
          <div className="flex justify-between text-[10px] text-grid-text-dim font-mono">
            <span>0.80x (Low)</span>
            <span>1.00x (Nominal)</span>
            <span>2.20x (Extreme Surge)</span>
          </div>
        </div>

        {/* Triggered Outages */}
        <div className="panel p-4 flex flex-col gap-3 shrink-0 bg-grid-panel border border-grid-border rounded-xl">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-grid-text text-sm uppercase tracking-wider">Triggered Line Outages</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-grid-danger font-mono bg-grid-danger/10 px-1.5 py-0.5 rounded">{brokenLines.length} Tripped</span>
              {brokenLines.length > 0 && (
                <button
                  onClick={() => setBrokenLines([])}
                  className="text-xs text-grid-text-muted hover:text-grid-text transition-colors underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[2, 6, 12, 15, 20, 27].map(lineId => (
              <button
                key={lineId}
                onClick={() => setBrokenLines(prev => prev.includes(lineId) ? prev.filter(l => l !== lineId) : [...prev, lineId])}
                className={`text-xs px-2.5 py-1 rounded font-mono border transition-all ${
                  brokenLines.includes(lineId)
                    ? 'bg-grid-danger/20 border-grid-danger text-grid-danger font-bold'
                    : 'bg-grid-bg-alt border-grid-border text-grid-text-dim hover:text-grid-text'
                }`}
              >
                Line {lineId}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const rand = Math.floor(Math.random() * 35);
              if (!brokenLines.includes(rand)) setBrokenLines([...brokenLines, rand]);
            }}
            className="w-full py-2 bg-grid-danger/10 hover:bg-grid-danger/20 text-grid-danger border border-grid-danger/30 rounded font-bold text-xs uppercase tracking-wider transition-all mt-1"
          >
            ⚡ Force Trip Random Line
          </button>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="panel p-4 flex flex-col gap-2 shrink-0 bg-grid-panel border border-grid-border rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-grid-accent uppercase">{selectedNode.name}</span>
              <button onClick={() => setSelectedNode(null)} className="text-grid-text-dim hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-grid-text-muted">
              Layer: <span className="font-bold text-grid-text">{selectedNode.layer}</span>
            </div>
            {selectedNode.layer === 'POWER' && (
              <div className="text-xs text-grid-text-muted">
                Bus Failure Risk: <span className="font-bold text-grid-danger">{((busRisks[selectedNode.bus_id] || 0) * 100).toFixed(1)}%</span>
              </div>
            )}
            {selectedNode.layer === 'WATER' && (
              <div className="text-xs text-grid-text-muted">
                Pressure: <span className="font-bold text-cyan-400">{selectedNode.pressure_psi} PSI</span>
              </div>
            )}
            {selectedNode.layer === 'TELECOM' && (
              <div className="text-xs text-grid-text-muted">
                Status: <span className="font-bold text-purple-400">{selectedNode.status}</span>
              </div>
            )}
            {selectedNode.layer === 'HEALTHCARE' && (
              <div className="text-xs text-grid-text-muted">
                ICU Capacity: <span className="font-bold text-emerald-400">{selectedNode.icu_beds} Beds</span>
                <br />
                Status: <span className="font-bold text-amber-400">{selectedNode.status}</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CENTER: Multi-Layer Network Topology Force Graph */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex-1 bg-grid-bg relative border border-grid-border rounded-xl overflow-hidden cursor-crosshair flex items-center justify-center">
          
          {/* Layer Indicator Header */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-grid-panel/90 backdrop-blur px-3 py-1.5 border border-grid-border rounded-lg text-xs font-mono text-grid-text flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-grid-nominal animate-ping" />
              <span>Multi-Infrastructure Cascading Topology</span>
            </div>
            <div className="bg-grid-panel/90 backdrop-blur px-3 py-1.5 border border-grid-border rounded-lg text-xs font-mono text-grid-warning">
              Horizon: {timeHorizon}h
            </div>
          </div>

          {graphData.nodes.length > 0 ? (
            <ForceGraph2D
              width={820}
              height={620}
              graphData={graphData}
              nodeCanvasObject={paintNode}
              onNodeClick={(node) => setSelectedNode(node)}
              linkColor={(link: any) => {
                if (link.is_broken) return 'rgba(239, 68, 68, 0.4)';
                if (link.layer === 'INTER_DEPENDENCY') return 'rgba(168, 85, 247, 0.25)'; // Purple dashed inter-layer
                if (link.risk > 0.85) return '#ef4444';
                if (link.risk > 0.65) return '#eab308';
                return '#22c55e';
              }}
              linkWidth={(link: any) => link.is_broken ? 1 : link.risk > 0.85 ? 3.5 : 1.5}
              linkLineDash={(link: any) => link.layer === 'INTER_DEPENDENCY' ? [4, 4] : link.is_broken ? [2, 2] : []}
              backgroundColor={document.body.classList.contains('light-theme') ? '#f3f4f6' : '#07080b'}
            />
          ) : (
            <span className="text-grid-text-dim font-mono animate-pulse">Running Multi-Sector Simulation...</span>
          )}

          {/* Visual Legend */}
          <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[10px] font-mono text-grid-text-muted bg-grid-panel/80 p-2 rounded border border-grid-border">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Power Bus</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-400" /> Water Pump</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-500 rotate-45" /> Telecom Tower</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hospital</span>
            </div>
            <div>Spatial Coupling: Haversine Bounded Nearest-Neighbor</div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR: Live Cross-Sector Telemetry & Risk Metrics */}
      <div className="w-84 flex flex-col gap-4 pl-2 overflow-y-auto">

        {/* Global Crisis Meter */}
        <div className="panel p-4 flex flex-col relative overflow-hidden bg-grid-panel border border-grid-border rounded-xl">
          <div className="flex justify-between items-center mb-4 z-10">
            <h3 className="font-bold text-grid-text text-sm uppercase tracking-wider">Multi-Sector Shock Meter</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
              summary.icu_beds_at_risk > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {summary.icu_beds_at_risk > 0 ? 'CRITICAL CRISIS' : 'CONTAINED'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 z-10">
            <div className="bg-grid-bg-alt p-3 rounded-lg border border-grid-border">
              <span className="text-xs text-grid-text-dim uppercase">Buses Down</span>
              <div className="text-2xl font-bold text-blue-400 mt-1">{summary.power_buses_offline} <span className="text-xs text-gray-400">/ 39</span></div>
            </div>
            <div className="bg-grid-bg-alt p-3 rounded-lg border border-grid-border">
              <span className="text-xs text-grid-text-dim uppercase">Water Deficit</span>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{(summary.estimated_water_loss_gpm / 1000).toFixed(1)}k <span className="text-xs text-gray-400">GPM</span></div>
            </div>
          </div>
        </div>

        {/* Sector 1: Water Supply Degradation */}
        <div className="panel p-4 bg-grid-panel border border-grid-border rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="flex items-center gap-2 font-bold text-xs text-cyan-400 uppercase">
              <Droplets className="w-4 h-4" /> Water Supply
            </span>
            <span className="text-xs font-mono text-cyan-400">{summary.water_pumps_tripped} Pumps Tripped</span>
          </div>
          <div className="text-xs text-grid-text-dim mb-2">
            Pumps have zero battery storage and trip immediately with power loss.
          </div>
          <div className="w-full bg-grid-bg-alt h-2 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-400 h-full transition-all" 
              style={{ width: `${Math.min(100, (summary.water_pumps_tripped / 4) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Sector 2: Telecom Battery Status */}
        <div className="panel p-4 bg-grid-panel border border-grid-border rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="flex items-center gap-2 font-bold text-xs text-purple-400 uppercase">
              <Radio className="w-4 h-4" /> Telecommunications
            </span>
            <span className="text-xs font-mono text-purple-400">{summary.cell_towers_offline} Offline</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-grid-bg-alt p-2 rounded">
              <span className="text-[10px] text-grid-text-dim">On Backup Battery</span>
              <div className="text-sm font-bold text-amber-400">{summary.cell_towers_on_battery} towers</div>
            </div>
            <div className="bg-grid-bg-alt p-2 rounded">
              <span className="text-[10px] text-grid-text-dim">Battery Exhausted</span>
              <div className="text-sm font-bold text-red-400">{summary.cell_towers_offline} towers</div>
            </div>
          </div>
        </div>

        {/* Sector 3: Healthcare Crisis */}
        <div className="panel p-4 bg-grid-panel border border-grid-border rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="flex items-center gap-2 font-bold text-xs text-emerald-400 uppercase">
              <Hospital className="w-4 h-4" /> Healthcare Facilities
            </span>
            <span className="text-xs font-mono text-red-400">{summary.hospitals_critical} Critical</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-grid-text-muted">Hospitals on Generator (72h buffer):</span>
              <span className="font-bold text-amber-400">{summary.hospitals_on_generator}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-grid-text-muted">ICU Beds at Direct Risk:</span>
              <span className="font-bold text-red-400">{summary.icu_beds_at_risk} Beds</span>
            </div>
          </div>
          {summary.icu_beds_at_risk > 0 && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-[11px] text-red-300 flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>Hospital diesel fuel depleted at {timeHorizon}h. Life-support systems compromised.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}