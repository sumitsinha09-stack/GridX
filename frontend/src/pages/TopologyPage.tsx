import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Zap, AlertTriangle, X, Droplets, Radio, Hospital, Clock, 
  Layers, Plus, Minus, Crosshair, ChevronRight, ArrowUpRight
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
  const multiplier = 1.35;
  const [brokenLines, setBrokenLines] = useState<number[]>([12, 15]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  
  // Multi-infrastructure expansion states
  const [timeHorizon, setTimeHorizon] = useState<number>(4.0);
  const [enabledLayers, setEnabledLayers] = useState<string[]>(['POWER', 'WATER', 'TELECOM', 'HEALTHCARE']);
  
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [busRisks, setBusRisks] = useState<Record<number, number>>({});
  const [summary, setSummary] = useState<SummaryMetrics>({
    time_horizon_hours: 4.0,
    power_buses_offline: 11,
    power_lines_tripped: 2,
    water_pumps_tripped: 4,
    estimated_water_loss_gpm: 10910,
    cell_towers_offline: 0,
    cell_towers_on_battery: 81,
    hospitals_on_generator: 64,
    hospitals_critical: 0,
    icu_beds_at_risk: 0
  });

  const graphRef = useRef<any>(null);

  const toggleLayer = (layer: string) => {
    setEnabledLayers(prev => 
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    );
  };

  const runSimulation = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/hetero/simulate', {
        broken_lines: brokenLines,
        demand_multiplier: multiplier,
        time_horizon_hours: timeHorizon,
        enabled_layers: enabledLayers
      });

      if (res.data.summary) {
        setSummary(res.data.summary);
      }
      setBusRisks(res.data.bus_risks || {});
      if (res.data.graph_data) {
        setGraphData(res.data.graph_data);
      }
    } catch (err) {
      console.error("Failed to run multi-infrastructure simulation:", err);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [multiplier, brokenLines, timeHorizon, enabledLayers]);

  // Zoom control helpers
  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 400);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() * 0.7, 400);
  const handleResetZoom = () => graphRef.current?.zoomToFit(400, 30);

  // Node drawing logic matching the clean industrial look
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const layer = node.layer;

    ctx.save();

    if (layer === 'POWER') {
      const isFailed = node.is_failed;
      const r = isSelected ? 8 : 6;

      if (isFailed) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = isFailed ? '#ef4444' : isSelected ? '#00e5ff' : '#0ea5e9';
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.font = `${10 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isFailed ? '#fca5a5' : '#7dd3fc';
      ctx.textAlign = 'center';
      ctx.fillText(`P${node.bus_id}`, node.x, node.y + r + 11);

    } else if (layer === 'WATER') {
      const isPump = node.is_pump;
      const isFailed = node.is_failed;
      const size = isPump ? 9 : 5;

      ctx.beginPath();
      ctx.rect(node.x - size / 2, node.y - size / 2, size, size);
      ctx.fillStyle = isFailed ? '#64748b' : '#00e5ff';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isFailed ? '#ef4444' : '#67e8f9';
      ctx.stroke();

      ctx.font = `${8.5 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'center';
      ctx.fillText(isPump ? `W-PUMP` : `W${node.id.split('_')[1]}`, node.x, node.y + size + 9);

    } else if (layer === 'TELECOM') {
      const isFailed = node.is_failed;
      const size = 6;

      ctx.beginPath();
      ctx.moveTo(node.x, node.y - size);
      ctx.lineTo(node.x + size, node.y);
      ctx.lineTo(node.x, node.y + size);
      ctx.lineTo(node.x - size, node.y);
      ctx.closePath();
      ctx.fillStyle = isFailed ? '#334155' : '#a855f7';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isFailed ? '#ef4444' : '#d8b4fe';
      ctx.stroke();

      ctx.font = `${8 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#c084fc';
      ctx.textAlign = 'center';
      ctx.fillText(`T${node.id.split('_')[1]}`, node.x, node.y + size + 8);

    } else if (layer === 'HEALTHCARE') {
      const isFailed = node.is_failed;
      const size = 11;

      ctx.beginPath();
      ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = isFailed ? '#b91c1c' : node.status === 'ON_EMERGENCY_GENERATOR' ? '#d97706' : '#10b981';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(node.x - 1, node.y - 3.5, 2, 7);
      ctx.fillRect(node.x - 3.5, node.y - 1, 7, 2);

      ctx.font = `${8.5 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isFailed ? '#fca5a5' : '#34d399';
      ctx.textAlign = 'center';
      ctx.fillText(`${node.icu_beds} ICU`, node.x, node.y + size / 2 + 9);
    }

    ctx.restore();
  }, [selectedNode]);

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] relative bg-[#07090e] text-gray-300 font-sans overflow-hidden select-none">

      {/* Background Radar Rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
        <div className="w-[200px] h-[200px] rounded-full border border-dashed border-cyan-500/30" />
        <div className="w-[420px] h-[420px] rounded-full border border-dashed border-cyan-500/20 absolute" />
        <div className="w-[640px] h-[640px] rounded-full border border-cyan-500/15 absolute" />
        <div className="w-[860px] h-[860px] rounded-full border border-dashed border-cyan-500/10 absolute" />
        <div className="w-full h-px bg-cyan-500/10 absolute" />
        <div className="h-full w-px bg-cyan-500/10 absolute" />
      </div>

      {/* ========================================================================= */}
      {/* FLOATING TOP BAR: Layer Toggles, Horizon Slider, and Quick Stats          */}
      {/* ========================================================================= */}
      <div className="absolute top-4 left-6 right-6 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left: Compact Layer Filter Chips */}
        <div className="flex items-center gap-1.5 bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl pointer-events-auto shadow-2xl">
          <Layers className="w-3.5 h-3.5 text-cyan-400 mr-1" />
          {[
            { id: 'POWER', label: 'Power', icon: Zap, color: 'text-blue-400' },
            { id: 'WATER', label: 'Water', icon: Droplets, color: 'text-cyan-400' },
            { id: 'TELECOM', label: 'Telecom', icon: Radio, color: 'text-purple-400' },
            { id: 'HEALTHCARE', label: 'Hospitals', icon: Hospital, color: 'text-emerald-400' },
          ].map(layer => {
            const Icon = layer.icon;
            const isChecked = enabledLayers.includes(layer.id);
            return (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  isChecked
                    ? 'bg-white/10 border-white/20 text-white shadow-sm'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-3 h-3 ${isChecked ? layer.color : 'text-gray-500'}`} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Cascade Horizon Stepper */}
        <div className="flex items-center gap-2 bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-xl pointer-events-auto shadow-2xl">
          <Clock className="w-3.5 h-3.5 text-amber-400 mr-1" />
          <span className="text-xs text-gray-400 font-mono">Horizon:</span>
          <div className="flex gap-1 font-mono text-xs">
            {[0, 4, 12, 24, 72].map(h => (
              <button
                key={h}
                onClick={() => setTimeHorizon(h)}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  timeHorizon === h 
                    ? 'bg-amber-400 text-slate-950 shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* Right: Telemetry Quick Pills + Link to Sector Page */}
        <div className="flex items-center gap-2 bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl pointer-events-auto shadow-2xl font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">Buses: <strong className="text-red-400">{summary.power_buses_offline}</strong>/39</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">Pumps: <strong className="text-cyan-400">{summary.water_pumps_tripped}</strong> cut</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">ICU: <strong className={summary.icu_beds_at_risk > 0 ? 'text-red-400' : 'text-emerald-400'}>{summary.icu_beds_at_risk}</strong></span>
          </div>

          <Link
            to="/app/telemetry"
            className="flex items-center gap-1 text-[11px] bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-sans font-bold px-2.5 py-1 rounded-lg transition-colors ml-1"
          >
            <span>Full Telemetry</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* Full-Bleed Network Graph */}
      <div className="w-full h-full">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeCanvasObject={paintNode}
            onNodeClick={(node) => setSelectedNode(node)}
            linkColor={(link: any) => {
              if (link.is_broken) return 'rgba(239, 68, 68, 0.7)';
              if (link.layer === 'INTER_DEPENDENCY') return 'rgba(168, 85, 247, 0.25)';
              if (link.risk > 0.85) return '#ef4444';
              if (link.risk > 0.65) return '#eab308';
              return '#0284c7';
            }}
            linkWidth={(link: any) => link.is_broken ? 1.5 : link.risk > 0.85 ? 3 : 1.5}
            linkLineDash={(link: any) => link.layer === 'INTER_DEPENDENCY' ? [3, 3] : link.is_broken ? [4, 4] : []}
            backgroundColor="transparent"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs font-mono animate-pulse">Rendering Topology Mesh...</span>
          </div>
        )}
      </div>

      {/* Floating Canvas Zoom Controls (Top Right) */}
      <div className="absolute top-20 right-6 z-20 flex flex-col gap-1 bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-xl text-gray-300">
        <button onClick={handleZoomIn} className="p-1.5 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors" title="Zoom In">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={handleZoomOut} className="p-1.5 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors" title="Zoom Out">
          <Minus className="w-4 h-4" />
        </button>
        <button onClick={handleResetZoom} className="p-1.5 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors" title="Center View">
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Bottom Quick Outage Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[#0b0e17]/95 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-4">
        
        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Outage Control</span>
          <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
            {brokenLines.length} Tripped
          </span>
        </div>

        {/* Quick Line Toggle Buttons */}
        <div className="flex items-center gap-1.5">
          {[2, 6, 12, 15, 20, 27].map(lineId => {
            const isTripped = brokenLines.includes(lineId);
            return (
              <button
                key={lineId}
                onClick={() => setBrokenLines(prev => prev.includes(lineId) ? prev.filter(l => l !== lineId) : [...prev, lineId])}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all border ${
                  isTripped
                    ? 'bg-red-950/70 border-red-500/70 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                    : 'bg-[#121724] border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                Line {lineId}
              </button>
            );
          })}
        </div>

        {/* Force Trip Random Line */}
        <button
          onClick={() => {
            const rand = Math.floor(Math.random() * 35);
            if (!brokenLines.includes(rand)) setBrokenLines([...brokenLines, rand]);
          }}
          className="flex items-center gap-1.5 px-3 py-1 bg-red-950/60 hover:bg-red-900/80 border border-red-500/50 text-red-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          <span>Trip Random</span>
        </button>

        {brokenLines.length > 0 && (
          <button
            onClick={() => setBrokenLines([])}
            className="text-xs text-gray-400 hover:text-white underline transition-colors"
          >
            Reset
          </button>
        )}

        <Link
          to="/app/contingency"
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white pl-2 border-l border-white/10"
        >
          <span>More Lines</span>
          <ChevronRight className="w-3 h-3" />
        </Link>

      </div>

      {/* Selected Node Slide-Over Inspector Drawer */}
      {selectedNode && (
        <div className="absolute top-20 right-6 w-80 z-30 bg-[#0b0e17]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">{selectedNode.name}</h4>
            </div>
            <button 
              onClick={() => setSelectedNode(null)} 
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">Sector Layer:</span>
              <span className="text-white font-bold">{selectedNode.layer}</span>
            </div>

            {selectedNode.layer === 'POWER' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Substation Voltage:</span>
                  <span className="text-cyan-400 font-bold">345 kV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Outage Risk:</span>
                  <span className="text-red-400 font-bold">
                    {((busRisks[selectedNode.bus_id] || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </>
            )}

            {selectedNode.layer === 'WATER' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hydraulic Pressure:</span>
                  <span className="text-cyan-400 font-bold">{selectedNode.pressure_psi} PSI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={selectedNode.status === 'NOMINAL_PRESSURE' ? 'text-emerald-400' : 'text-red-400'}>
                    {selectedNode.status}
                  </span>
                </div>
              </>
            )}

            {selectedNode.layer === 'TELECOM' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reserve Remaining:</span>
                  <span className="text-purple-300 font-bold">{selectedNode.hours_remaining} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Battery Status:</span>
                  <span className="text-amber-400">{selectedNode.status}</span>
                </div>
              </>
            )}

            {selectedNode.layer === 'HEALTHCARE' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Licensed ICU Beds:</span>
                  <span className="text-emerald-400 font-bold">{selectedNode.icu_beds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fuel Hours Remaining:</span>
                  <span className="text-amber-400 font-bold">{selectedNode.fuel_hours_remaining}h</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}