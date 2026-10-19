import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Zap, AlertTriangle, Activity, X, Droplets, Radio, Hospital, Clock, 
  Layers, Flame, Plus, Minus, Maximize2, Crosshair, Box, Check, RotateCcw
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
        node_multipliers: nodeMultipliers,
        time_horizon_hours: timeHorizon,
        enabled_layers: enabledLayers
      });

      if (res.data.summary) {
        setSummary(res.data.summary);
      }
      setPredictions(res.data.power_predictions || {});
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
  }, [multiplier, nodeMultipliers, brokenLines, timeHorizon, enabledLayers]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 0.7, 400);
    }
  };

  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 30);
    }
  };

  // Node drawing logic matching the industrial telemetry aesthetic
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const layer = node.layer;

    ctx.save();

    if (layer === 'POWER') {
      const isFailed = node.is_failed;
      const r = isSelected ? 8 : 6;

      // Glow halo if failed
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

      // Bus label
      ctx.font = `${10 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isFailed ? '#fca5a5' : '#7dd3fc';
      ctx.textAlign = 'center';
      ctx.fillText(`P${node.bus_id}`, node.x, node.y + r + 11);

      if (isFailed) {
        ctx.font = `bold ${9 / globalScale}px sans-serif`;
        ctx.fillStyle = '#ef4444';
        ctx.fillText('⚠️', node.x + 8, node.y - 6);
      }

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
      ctx.fillText(isPump ? `W-PUMP ${node.id.split('_')[1]}` : `W${node.id.split('_')[1]}`, node.x, node.y + size + 9);

    } else if (layer === 'TELECOM') {
      const isFailed = node.is_failed;
      const size = 6.5;

      // Draw Diamond for Telecom Tower
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

      // Subtle broadcast ping
      if (!isFailed) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

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

      // Cross symbol
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
    <div className="flex-1 w-full flex p-3.5 gap-3.5 bg-[#07090e] text-gray-300 font-sans overflow-hidden select-none">

      {/* ========================================================================= */}
      {/* 1. LEFT COLUMN: Infrastructure Layer Toggles & Hazard Sliders             */}
      {/* ========================================================================= */}
      <div className="w-[280px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-0.5">

        {/* Card 1: Infrastructure Layers */}
        <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-3.5 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Infrastructure Layers</h3>
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {enabledLayers.length} ACTIVE
            </span>
          </div>

          <div className="flex flex-col gap-2">
            
            {/* Power Grid */}
            <div 
              onClick={() => toggleLayer('POWER')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                enabledLayers.includes('POWER') 
                  ? 'bg-[#0e1424] border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.08)]' 
                  : 'bg-[#090c14] border-white/5 opacity-40 hover:opacity-70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  enabledLayers.includes('POWER') ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-gray-600'
                }`}>
                  {enabledLayers.includes('POWER') && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="w-6 h-6 rounded bg-cyan-950/70 border border-cyan-400/30 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white leading-tight">Power Grid</span>
                  <span className="text-[9.5px] text-gray-400 font-mono leading-tight">IEEE 39-Bus</span>
                </div>
              </div>
            </div>

            {/* Water Supply */}
            <div 
              onClick={() => toggleLayer('WATER')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                enabledLayers.includes('WATER') 
                  ? 'bg-[#0e1424] border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.08)]' 
                  : 'bg-[#090c14] border-white/5 opacity-40 hover:opacity-70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  enabledLayers.includes('WATER') ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-gray-600'
                }`}>
                  {enabledLayers.includes('WATER') && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="w-6 h-6 rounded bg-blue-950/70 border border-blue-400/30 flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white leading-tight">Water Supply</span>
                  <span className="text-[9.5px] text-gray-400 font-mono leading-tight">EPANET Mesh</span>
                </div>
              </div>
              <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                4 Pumps
              </span>
            </div>

            {/* Telecom Towers */}
            <div 
              onClick={() => toggleLayer('TELECOM')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                enabledLayers.includes('TELECOM') 
                  ? 'bg-[#150f24] border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.08)]' 
                  : 'bg-[#090c14] border-white/5 opacity-40 hover:opacity-70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  enabledLayers.includes('TELECOM') ? 'bg-purple-400 border-purple-400 text-slate-950' : 'border-gray-600'
                }`}>
                  {enabledLayers.includes('TELECOM') && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="w-6 h-6 rounded bg-purple-950/70 border border-purple-400/30 flex items-center justify-center">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white leading-tight">Telecom Towers</span>
                  <span className="text-[9.5px] text-gray-400 font-mono leading-tight">FCC/HIFLD</span>
                </div>
              </div>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                624 Towers
              </span>
            </div>

            {/* Hospitals */}
            <div 
              onClick={() => toggleLayer('HEALTHCARE')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                enabledLayers.includes('HEALTHCARE') 
                  ? 'bg-[#0e1c18] border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.08)]' 
                  : 'bg-[#090c14] border-white/5 opacity-40 hover:opacity-70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  enabledLayers.includes('HEALTHCARE') ? 'bg-emerald-400 border-emerald-400 text-slate-950' : 'border-gray-600'
                }`}>
                  {enabledLayers.includes('HEALTHCARE') && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="w-6 h-6 rounded bg-emerald-950/70 border border-emerald-400/30 flex items-center justify-center">
                  <Hospital className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white leading-tight">Hospitals</span>
                  <span className="text-[9.5px] text-gray-400 font-mono leading-tight">COVID Surge Care</span>
                </div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                289 Facilities
              </span>
            </div>

          </div>
        </div>

        {/* Card 2: Cascade Horizon */}
        <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Cascade Horizon</h3>
            </div>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/50 text-xs font-mono font-bold px-2 py-0.5 rounded">
              {timeHorizon.toFixed(0)}h
            </span>
          </div>

          <input
            type="range"
            min="0" max="72" step="4"
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none mt-1"
          />

          <div className="flex justify-between text-[9px] font-mono text-gray-400 mt-0.5 leading-tight">
            <div className="flex flex-col">
              <span className="text-gray-300 font-bold">0h</span>
              <span className="text-[8px] text-gray-400">Shock</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-amber-400 font-bold">4h-8h</span>
              <span className="text-[8px] text-amber-400">Battery Drop</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-300 font-bold">24h</span>
              <span className="text-[8px] text-gray-400">Emergency</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-300 font-bold">72h</span>
              <span className="text-[8px] text-gray-400">Fuel Depleted</span>
            </div>
          </div>
        </div>

        {/* Card 3: Heatwave Multiplier */}
        <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Heatwave Multiplier</h3>
            </div>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/50 text-xs font-mono font-bold px-2 py-0.5 rounded">
              {multiplier.toFixed(2)}x
            </span>
          </div>

          <input
            type="range"
            min="0.8" max="2.2" step="0.05"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none mt-1"
          />

          <div className="flex justify-between text-[9px] font-mono text-gray-400 mt-0.5">
            <span>0.80x (Low)</span>
            <span>1.00x (Nominal)</span>
            <span className="text-red-400">2.20x (Surge)</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER COLUMN: Radar Canvas & Pinned Outage Controls                    */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col relative rounded-xl border border-white/10 bg-[#080b12] overflow-hidden shadow-2xl">
        
        {/* Radar Concentric Rings in Canvas Background */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
          <div className="w-[180px] h-[180px] rounded-full border border-dashed border-cyan-500/30" />
          <div className="w-[360px] h-[360px] rounded-full border border-dashed border-cyan-500/20 absolute" />
          <div className="w-[540px] h-[540px] rounded-full border border-cyan-500/15 absolute" />
          <div className="w-[720px] h-[720px] rounded-full border border-dashed border-cyan-500/10 absolute" />
          <div className="w-full h-px bg-cyan-500/10 absolute" />
          <div className="h-full w-px bg-cyan-500/10 absolute" />
        </div>

        {/* Inset Top Control Header */}
        <div className="absolute top-3.5 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          
          {/* Left Title Pill */}
          <div className="bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-lg flex items-center gap-3 pointer-events-auto shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
            <span className="text-xs font-semibold text-white tracking-wide">Multi-Infrastructure Cascading Topology</span>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/50 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              Horizon: {timeHorizon.toFixed(0)}h
            </span>
          </div>

          {/* Right Zoom / Action Controls */}
          <div className="bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg flex items-center gap-1.5 pointer-events-auto shadow-lg text-xs font-mono text-gray-300">
            <button onClick={handleZoomIn} className="p-1 hover:text-cyan-400 hover:bg-white/5 rounded transition-colors" title="Zoom In">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleZoomOut} className="p-1 hover:text-cyan-400 hover:bg-white/5 rounded transition-colors" title="Zoom Out">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetZoom} className="px-2 py-0.5 text-[10px] hover:text-cyan-400 hover:bg-white/5 rounded transition-colors" title="Reset Scale">
              100%
            </button>
            <div className="w-px h-3 bg-white/10 mx-0.5" />
            <button onClick={handleResetZoom} className="p-1 hover:text-cyan-400 hover:bg-white/5 rounded transition-colors" title="Center View">
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:text-cyan-400 hover:bg-white/5 rounded transition-colors" title="3D View">
              <Box className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Center ForceGraph Canvas */}
        <div className="flex-1 w-full h-full">
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
              <span className="text-gray-400 text-xs font-mono animate-pulse">Initializing Cascade Graph Simulator...</span>
            </div>
          )}
        </div>

        {/* Inset Bottom Outage Trigger Panel (Matching Screenshot) */}
        <div className="absolute bottom-11 left-5 right-5 z-20 bg-[#0a0e18]/95 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2.5 shadow-2xl">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="font-bold text-white text-xs uppercase tracking-wider">Triggered Outages</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                {brokenLines.length} Tripped
              </span>
              {brokenLines.length > 0 && (
                <button
                  onClick={() => setBrokenLines([])}
                  className="text-[10px] text-gray-400 hover:text-white underline transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Line Selection Buttons */}
          <div className="grid grid-cols-6 gap-2">
            {[2, 6, 12, 15, 20, 27].map(lineId => {
              const isTripped = brokenLines.includes(lineId);
              return (
                <button
                  key={lineId}
                  onClick={() => setBrokenLines(prev => prev.includes(lineId) ? prev.filter(l => l !== lineId) : [...prev, lineId])}
                  className={`py-1.5 px-2 rounded-lg font-mono text-xs font-bold transition-all text-center border ${
                    isTripped
                      ? 'bg-red-950/70 border-red-500/60 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                      : 'bg-[#121724] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  Line {lineId}
                </button>
              );
            })}
          </div>

          {/* Big Crimson Action Button */}
          <button
            onClick={() => {
              const rand = Math.floor(Math.random() * 35);
              if (!brokenLines.includes(rand)) setBrokenLines([...brokenLines, rand]);
            }}
            className="w-full py-2 bg-gradient-to-r from-red-950/60 via-red-900/40 to-red-950/60 hover:from-red-900/80 hover:to-red-800/80 border border-red-500/50 text-red-400 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
          >
            <Zap className="w-3.5 h-3.5 text-red-400 fill-red-400" />
            <span>Force Trip Random Line</span>
          </button>

        </div>

        {/* Bottom Legend Bar */}
        <div className="h-9 bg-[#0a0d14] border-t border-white/10 flex items-center justify-between px-5 text-[10px] font-mono text-gray-400 shrink-0 z-10">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Power Bus</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-400" /> Water Pump</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-400 rotate-45" /> Telecom Tower</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Hospital</span>
          </div>
          <div className="text-gray-400">
            Spatial Coupling: <span className="text-gray-300 font-bold">Haversine Bounded Nearest-Neighbor</span> <span className="text-emerald-400 font-bold">[Active]</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT COLUMN: Multi-Sector Crisis & Telemetry Cards                    */}
      {/* ========================================================================= */}
      <div className="w-[320px] shrink-0 flex flex-col gap-3 overflow-y-auto pl-0.5">

        {/* Card 1: Multi-Sector Shock Meter */}
        <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-3.5 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Multi-Sector Shock Meter</h3>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
              Contained
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Buses Down */}
            <div className="bg-[#0e131f] border border-white/10 rounded-lg p-2.5 flex flex-col">
              <span className="text-[9px] text-gray-400 uppercase font-mono">Buses Down</span>
              <div className="text-xl font-bold font-mono mt-0.5">
                <span className="text-red-500 text-2xl font-black">{summary.power_buses_offline}</span>
                <span className="text-gray-400 text-xs font-normal"> / 39</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono mt-1 text-amber-400">
                <span>N-1 Exceeded</span>
                <span className="font-bold">28%</span>
              </div>
              <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-amber-400 h-full" style={{ width: '28%' }} />
              </div>
            </div>

            {/* Water Deficit */}
            <div className="bg-[#0e131f] border border-white/10 rounded-lg p-2.5 flex flex-col">
              <span className="text-[9px] text-gray-400 uppercase font-mono">Water Deficit</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                {(summary.estimated_water_loss_gpm / 1000).toFixed(1)}k <span className="text-xs text-gray-400 font-normal">GPM</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono mt-1 text-cyan-400">
                <span>Severe Pressure</span>
                <span className="font-bold">62%</span>
              </div>
              <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-cyan-400 h-full" style={{ width: '62%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Water Supply */}
        <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Water Supply</h3>
            </div>
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
              {summary.water_pumps_tripped} Pumps Tripped
            </span>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed">
            Pumps have zero battery storage and trip immediately with power loss. Hydraulic head pressure collapsing in Sector 4.
          </p>

          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-gray-400">Primary Reservoir Level:</span>
              <span className="text-amber-400 font-bold">78.4 PSI (-14%)</span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: '78%' }} />
            </div>
          </div>
        </div>

        {/* Card 3: Telecommunications */}
        <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Telecommunications</h3>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
              {summary.cell_towers_offline} Offline
            </span>
          </div>

          <div className="flex flex-col gap-2 font-mono">
            
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[10.5px] text-gray-400 uppercase">On Backup Battery</span>
              <span className="text-[10.5px] text-gray-400">Avg Reserve: <span className="text-gray-300 font-bold">3h 42m</span></span>
            </div>
            <div className="text-lg font-bold text-amber-400 -mt-1">
              {summary.cell_towers_on_battery} towers
            </div>

            <div className="border-t border-white/5 pt-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase block">Battery Exhausted</span>
                <span className="text-sm font-bold text-white">{summary.cell_towers_offline} towers</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                ✓ Normal Ops
              </span>
            </div>

          </div>
        </div>

        {/* Card 4: Healthcare Facilities */}
        <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hospital className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Healthcare Facilities</h3>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
              {summary.hospitals_critical} Critical
            </span>
          </div>

          <div className="flex flex-col gap-1.5 font-mono text-xs">
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-gray-400">Hospitals on Generator (72h buffer):</span>
              <span className="text-amber-400 font-bold">{summary.hospitals_on_generator}</span>
            </div>
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-gray-400">ICU Beds at Direct Risk:</span>
              <span className="text-emerald-400 font-bold">{summary.icu_beds_at_risk} Beds</span>
            </div>

            <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">Diesel Fuel Reserve Index:</span>
                <span className="text-emerald-400 font-bold">94%</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: '94%' }} />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}