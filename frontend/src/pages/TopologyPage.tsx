import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Zap, AlertTriangle, X, Droplets, Radio, Hospital, Clock, 
  Layers, Plus, Minus, Crosshair, ChevronRight, ArrowUpRight,
  Car, RefreshCw, ShieldAlert, Activity, ExternalLink
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

interface SummaryMetrics {
  time_horizon_hours: number;
  power_buses_offline: number;
  power_lines_tripped: number;
  substations_tripped?: number;
  secondary_lines_at_risk?: number;
  water_pumps_tripped: number;
  estimated_water_loss_gpm: number;
  traffic_signals_offline?: number;
  transit_corridors_impacted?: number;
  cell_towers_offline: number;
  cell_towers_on_battery: number;
  hospitals_on_generator: number;
  hospitals_critical: number;
  icu_beds_at_risk: number;
}

interface TimelineStage {
  stage: number;
  time_horizon?: string;
  time_label?: string;
  phase?: string;
  phase_title?: string;
  severity: string;
  description: string;
  sectors_affected?: string[];
  consequences?: string[];
}

export default function TopologyPage() {
  const multiplier = 1.35;
  const [brokenLines, setBrokenLines] = useState<number[]>([12, 15]);
  const [trippedBuses, setTrippedBuses] = useState<number[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedLink, setSelectedLink] = useState<any | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'TELEMETRY' | 'IMPACT' | 'TIMELINE'>('TELEMETRY');
  
  // Multi-infrastructure expansion states
  const [timeHorizon, setTimeHorizon] = useState<number>(4.0);
  const [enabledLayers, setEnabledLayers] = useState<string[]>([
    'POWER', 'WATER', 'TELECOM', 'HEALTHCARE', 'TRANSPORTATION'
  ]);
  
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [busRisks, setBusRisks] = useState<Record<number, number>>({});
  const [busTelemetry, setBusTelemetry] = useState<Record<string | number, any>>({});
  const [timelineProgression, setTimelineProgression] = useState<TimelineStage[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics>({
    time_horizon_hours: 4.0,
    power_buses_offline: 11,
    power_lines_tripped: 2,
    water_pumps_tripped: 4,
    estimated_water_loss_gpm: 10910,
    traffic_signals_offline: 32,
    transit_corridors_impacted: 2,
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
        tripped_buses: trippedBuses,
        demand_multiplier: multiplier,
        time_horizon_hours: timeHorizon,
        enabled_layers: enabledLayers
      });

      if (res.data.summary) {
        setSummary(res.data.summary);
      }
      setBusRisks(res.data.bus_risks || {});
      setBusTelemetry(res.data.bus_telemetry || {});
      setTimelineProgression(res.data.timeline_progression || []);
      
      if (res.data.graph_data) {
        setGraphData(res.data.graph_data);
      }

      // Refresh currently selected node if active
      if (selectedNode && res.data.graph_data?.nodes) {
        const updated = res.data.graph_data.nodes.find((n: any) => n.id === selectedNode.id);
        if (updated) setSelectedNode(updated);
      }

      // Refresh currently selected link if active
      if (selectedLink && res.data.graph_data?.links) {
        const updatedL = res.data.graph_data.links.find((l: any) => l.line_id === selectedLink.line_id);
        if (updatedL) setSelectedLink(updatedL);
      }
    } catch (err) {
      console.error("Failed to run multi-infrastructure simulation:", err);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [multiplier, brokenLines, trippedBuses, timeHorizon, enabledLayers]);

  const hasAutoZoomed = useRef(false);

  useEffect(() => {
    if (graphData.nodes.length > 0 && graphRef.current && !hasAutoZoomed.current) {
      const timer = setTimeout(() => {
        if (graphRef.current) {
          hasAutoZoomed.current = true;
          graphRef.current.centerAt(-80, -80, 500);
          graphRef.current.zoom(1.42, 500);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [graphData.nodes.length]);

  // Zoom control helpers
  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() * 0.7, 300);
  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.centerAt(-80, -80, 400);
      graphRef.current.zoom(1.42, 400);
    }
  };

  // Toggle Substation Trip Failure
  const handleTripBus = (busId: number) => {
    if (!trippedBuses.includes(busId)) {
      setTrippedBuses(prev => [...prev, busId]);
    }
  };

  const handleRestoreBus = (busId: number) => {
    setTrippedBuses(prev => prev.filter(b => b !== busId));
  };

  // Toggle Transmission Line Trip
  const handleToggleLine = (lineId: number) => {
    setBrokenLines(prev => 
      prev.includes(lineId) ? prev.filter(l => l !== lineId) : [...prev, lineId]
    );
  };

  // Select node helper
  const handleSelectSubstation = (busId: number) => {
    const nodeObj = graphData.nodes.find(n => n.id === `P_${busId}`) || {
      id: `P_${busId}`,
      name: `Substation ${busId}`,
      layer: 'POWER',
      bus_id: busId
    };
    setSelectedNode(nodeObj);
    setSelectedLink(null);
    setActiveInspectorTab('TELEMETRY');
  };

  // Select line helper
  const handleSelectLine = (lineId: number) => {
    const linkObj = graphData.links.find(l => l.line_id === lineId) || {
      line_id: lineId,
      source: `P_4`,
      target: `P_5`,
      from_bus: 4,
      to_bus: 5,
      risk: 0.85,
      is_broken: brokenLines.includes(lineId)
    };
    setSelectedLink(linkObj);
    setSelectedNode(null);
  };

  // Reset all outages
  const handleResetAllOutages = () => {
    setBrokenLines([]);
    setTrippedBuses([]);
  };

  // Node drawing logic matching the clean industrial look
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const layer = node.layer;

    ctx.save();

    if (layer === 'POWER') {
      const isTripped = trippedBuses.includes(node.bus_id) || node.is_tripped;
      const isFailed = node.is_failed || isTripped;
      const r = isSelected ? 11 : 8;

      if (isTripped) {
        // Red flashing hazard ring for directly tripped substations
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 8, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (isFailed) {
        // Secondary overloaded or cascade-failed substation
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = isTripped ? '#dc2626' : isFailed ? '#ea580c' : isSelected ? '#00e5ff' : '#0ea5e9';
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.8;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.font = `${11 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isTripped ? '#fca5a5' : isFailed ? '#fdba74' : '#7dd3fc';
      ctx.textAlign = 'center';
      const label = isTripped ? `P${node.bus_id} [TRIP]` : `P${node.bus_id}`;
      ctx.fillText(label, node.x, node.y + r + 13);

    } else if (layer === 'WATER') {
      const isPump = node.is_pump;
      const isFailed = node.is_failed;
      const size = isPump ? 11 : 6.5;

      ctx.beginPath();
      ctx.rect(node.x - size / 2, node.y - size / 2, size, size);
      ctx.fillStyle = isFailed ? '#64748b' : isSelected ? '#38bdf8' : '#00e5ff';
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.5 : 1.2;
      ctx.strokeStyle = isFailed ? '#ef4444' : '#ffffff';
      ctx.stroke();

      ctx.font = `${9.5 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isFailed ? '#94a3b8' : '#00e5ff';
      ctx.textAlign = 'center';
      ctx.fillText(isPump ? `W-PUMP` : `W${node.id.split('_')[1]}`, node.x, node.y + size + 10);

    } else if (layer === 'TELECOM') {
      const isFailed = node.is_failed;
      const size = 7.5;

      ctx.beginPath();
      ctx.moveTo(node.x, node.y - size);
      ctx.lineTo(node.x + size, node.y);
      ctx.lineTo(node.x, node.y + size);
      ctx.lineTo(node.x - size, node.y);
      ctx.closePath();
      ctx.fillStyle = isFailed ? '#334155' : isSelected ? '#c084fc' : '#a855f7';
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.5 : 1.2;
      ctx.strokeStyle = isFailed ? '#ef4444' : '#ffffff';
      ctx.stroke();

      ctx.font = `${9 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#c084fc';
      ctx.textAlign = 'center';
      ctx.fillText(`T${node.id.split('_')[1]}`, node.x, node.y + size + 9);

    } else if (layer === 'HEALTHCARE') {
      const isFailed = node.is_failed;
      const size = 13;

      ctx.beginPath();
      ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = isFailed ? '#b91c1c' : node.status === 'ON_EMERGENCY_GENERATOR' ? '#d97706' : '#10b981';
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(node.x - 1.2, node.y - 4, 2.4, 8);
      ctx.fillRect(node.x - 4, node.y - 1.2, 8, 2.4);

      ctx.font = `${9.5 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isFailed ? '#fca5a5' : '#34d399';
      ctx.textAlign = 'center';
      ctx.fillText(`${node.icu_beds} ICU`, node.x, node.y + size / 2 + 10);

    } else if (layer === 'TRANSPORTATION') {
      const isFailed = node.is_failed;
      const size = 10;

      ctx.beginPath();
      ctx.rect(node.x - size / 2, node.y - size / 2, size, size);
      ctx.fillStyle = isFailed ? '#78350f' : isSelected ? '#fde047' : '#f59e0b';
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.5 : 1.2;
      ctx.strokeStyle = isFailed ? '#ef4444' : '#ffffff';
      ctx.stroke();

      ctx.font = `${9 / globalScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isFailed ? '#fca5a5' : '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(`🚦 ${node.intersections_offline || ''}`, node.x, node.y + size + 9);
    }

    ctx.restore();
  }, [selectedNode, trippedBuses]);

  // Selected bus telemetry helper with robust fallback resolution
  const busKey = selectedNode?.bus_id;
  const rawTel = (selectedNode && selectedNode.layer === 'POWER') 
    ? (busTelemetry[busKey] || busTelemetry[String(busKey)] || selectedNode)
    : null;

  const selectedBusTelemetry = rawTel ? {
    load_percentage: Number(rawTel.load_percentage ?? selectedNode?.load_percentage ?? 45.0),
    active_power_mw: Number(rawTel.p_mw ?? rawTel.active_power_mw ?? selectedNode?.active_power_mw ?? 150.0),
    voltage_kv: Number(rawTel.voltage_kv ?? 345.0),
    status: (selectedNode && trippedBuses.includes(selectedNode.bus_id)) 
      ? 'TRIPPED / BREAKER OPEN' 
      : (rawTel.status || 'ONLINE_NOMINAL'),
    connected_lines: rawTel.connected_lines || selectedNode?.connected_lines || [],
    dependent_water_pumps: Number(rawTel.dependent_water_pumps ?? selectedNode?.dependent_assets?.water_pumps ?? 1),
    dependent_traffic_signals: Number(rawTel.dependent_traffic_signals ?? selectedNode?.dependent_assets?.traffic_signals ?? 14),
    dependent_towers: Number(rawTel.dependent_towers ?? selectedNode?.dependent_assets?.telecom_towers ?? 18),
    dependent_hospitals: Number(rawTel.dependent_hospitals ?? selectedNode?.dependent_assets?.hospitals ?? 4)
  } : null;

  const isSelectedBusTripped = selectedNode?.layer === 'POWER' && trippedBuses.includes(selectedNode.bus_id);

  // Helper to extract numeric bus id from source/target (which can be a string 'P_12' or node object)
  const getBusIdFromRef = (ref: any): number => {
    if (!ref) return 0;
    if (typeof ref === 'number') return ref;
    if (typeof ref === 'string') {
      const parts = ref.replace('P_', '').split('_');
      return parseInt(parts[parts.length - 1], 10) || 0;
    }
    if (ref.bus_id !== undefined) return ref.bus_id;
    if (ref.id) {
      const parts = String(ref.id).replace('P_', '').split('_');
      return parseInt(parts[parts.length - 1], 10) || 0;
    }
    return 0;
  };

  return (
    <div className="flex-1 w-full h-full relative bg-[#07090e] text-gray-300 font-sans overflow-hidden select-none">

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
      {/* FLOATING TOP BAR: Layer Toggles, Horizon Stepper, Quick Stats            */}
      {/* ========================================================================= */}
      <div className="absolute top-3 left-5 right-5 z-30 flex items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Compact Layer Filter Chips */}
        <div className="flex items-center gap-1.5 bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl pointer-events-auto shadow-2xl">
          <Layers className="w-3.5 h-3.5 text-cyan-400 mr-1" />
          {[
            { id: 'POWER', label: 'Power', icon: Zap, color: 'text-blue-400' },
            { id: 'WATER', label: 'Water', icon: Droplets, color: 'text-cyan-400' },
            { id: 'TRANSPORTATION', label: 'Traffic & Rail', icon: Car, color: 'text-amber-400' },
            { id: 'TELECOM', label: 'Telecom', icon: Radio, color: 'text-purple-400' },
            { id: 'HEALTHCARE', label: 'Hospitals', icon: Hospital, color: 'text-emerald-400' },
          ].map(layer => {
            const Icon = layer.icon;
            const isChecked = enabledLayers.includes(layer.id);
            return (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                  isChecked
                    ? 'bg-white/10 border-white/20 text-white shadow-sm'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                }`}
                title={`Toggle ${layer.label} visibility`}
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
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
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

        {/* Right: Telemetry Quick Interactive Pills */}
        <div className="flex items-center gap-2 bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl pointer-events-auto shadow-2xl font-mono text-xs">
          <div className="flex items-center gap-2.5">
            {trippedBuses.length > 0 && (
              <button
                onClick={() => handleSelectSubstation(trippedBuses[0])}
                className="flex items-center gap-1 text-red-400 font-bold bg-red-950/70 hover:bg-red-900/80 px-2 py-0.5 rounded border border-red-500/50 animate-pulse cursor-pointer"
                title="Inspect First Tripped Substation"
              >
                <Zap className="w-3 h-3" />
                {trippedBuses.length} Tripped
              </button>
            )}
            <button
              onClick={() => handleSelectSubstation(18)}
              className="hover:text-white transition-colors cursor-pointer text-gray-400"
              title="Click to inspect substation"
            >
              Buses: <strong className="text-red-400">{summary.power_buses_offline}</strong>/39
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => {
                const pumpNode = graphData.nodes.find(n => n.is_pump);
                if (pumpNode) { setSelectedNode(pumpNode); setSelectedLink(null); }
              }}
              className="hover:text-white transition-colors cursor-pointer text-gray-400"
              title="Click to inspect water booster pumps"
            >
              Pumps: <strong className="text-cyan-400">{summary.water_pumps_tripped}</strong>
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => {
                const trNode = graphData.nodes.find(n => n.layer === 'TRANSPORTATION');
                if (trNode) { setSelectedNode(trNode); setSelectedLink(null); }
              }}
              className="hover:text-white transition-colors cursor-pointer text-gray-400"
              title="Click to inspect traffic signals"
            >
              Signals: <strong className="text-amber-400">{summary.traffic_signals_offline || 0}</strong>
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => {
                const hospNode = graphData.nodes.find(n => n.layer === 'HEALTHCARE');
                if (hospNode) { setSelectedNode(hospNode); setSelectedLink(null); }
              }}
              className="hover:text-white transition-colors cursor-pointer text-gray-400"
              title="Click to inspect hospitals"
            >
              ICU: <strong className={summary.icu_beds_at_risk > 0 ? 'text-red-400' : 'text-emerald-400'}>{summary.icu_beds_at_risk}</strong>
            </button>
          </div>

          <Link
            to="/app/telemetry"
            className="flex items-center gap-1 text-[11px] bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-sans font-bold px-2.5 py-1 rounded-lg transition-colors ml-1 cursor-pointer"
          >
            <span>Full Telemetry</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* Floating Canvas Zoom Controls (Positioned on Left to never be blocked by right inspector drawer) */}
      <div className="absolute top-20 left-6 z-30 flex flex-col gap-1.5 bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-xl text-gray-300">
        <button 
          onClick={handleZoomIn} 
          className="p-2 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" 
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomOut} 
          className="p-2 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" 
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={handleResetZoom} 
          className="p-2 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" 
          title="Center View"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Full-Bleed Network Graph */}
      <div className="w-full h-full">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              ctx.beginPath();
              // Generous 20px pointer area ensures every node is easily clickable
              ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkPointerAreaPaint={(link: any, color: string, ctx: CanvasRenderingContext2D) => {
              if (link.source && link.target && link.source.x !== undefined) {
                ctx.beginPath();
                ctx.moveTo(link.source.x, link.source.y);
                ctx.lineTo(link.target.x, link.target.y);
                ctx.lineWidth = 14;
                ctx.strokeStyle = color;
                ctx.stroke();
              }
            }}
            onNodeClick={(node) => {
              setSelectedNode(node);
              setSelectedLink(null);
              setActiveInspectorTab('TELEMETRY');
            }}
            onLinkClick={(link) => {
              setSelectedLink(link);
              setSelectedNode(null);
            }}
            linkColor={(link: any) => {
              const isSelected = selectedLink && selectedLink.line_id === link.line_id;
              if (isSelected) return '#ffffff';
              if (link.is_broken) return 'rgba(239, 68, 68, 0.85)';
              if (link.is_severed_by_bus) return 'rgba(239, 68, 68, 0.95)';
              if (link.layer === 'INTER_DEPENDENCY') return 'rgba(168, 85, 247, 0.3)';
              if (link.risk > 0.85) return '#ef4444';
              if (link.risk > 0.65) return '#f59e0b';
              return '#0284c7';
            }}
            linkWidth={(link: any) => {
              const isSelected = selectedLink && selectedLink.line_id === link.line_id;
              if (isSelected) return 4;
              return (link.is_broken || link.is_severed_by_bus) ? 2.5 : link.risk > 0.85 ? 3.5 : 2;
            }}
            linkLineDash={(link: any) => link.layer === 'INTER_DEPENDENCY' ? [3, 3] : (link.is_broken || link.is_severed_by_bus) ? [4, 4] : []}
            backgroundColor="transparent"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs font-mono animate-pulse">Rendering Cascading Mesh...</span>
          </div>
        )}
      </div>

      {/* Floating Bottom Quick Outage Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#0b0e17]/95 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-2 shadow-2xl flex items-center gap-4">
        
        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Outage Control</span>
          <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
            {brokenLines.length + trippedBuses.length} Active
          </span>
        </div>

        {/* Quick Line Outage Chips (Clicking opens line details in inspector drawer) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-mono text-gray-500 font-bold mr-0.5">Lines:</span>
          {[2, 6, 12, 15, 20, 27].map(lineId => {
            const isTripped = brokenLines.includes(lineId);
            const isSelected = selectedLink && selectedLink.line_id === lineId;
            return (
              <button
                key={lineId}
                onClick={() => handleSelectLine(lineId)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 bg-cyan-950/60 text-cyan-200 border-cyan-400'
                    : isTripped
                    ? 'bg-red-950/70 border-red-500/70 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                    : 'bg-[#121724] border-white/10 text-gray-400 hover:text-white'
                }`}
                title={`Inspect Transmission Line ${lineId}`}
              >
                L{lineId}
              </button>
            );
          })}
        </div>

        {/* Quick Substation Trip Chips (Clicking opens substation details in inspector drawer) */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
          <span className="text-[10px] uppercase font-mono text-gray-500 font-bold mr-0.5">Nodes:</span>
          {[3, 15, 18, 35].map(busId => {
            const isTripped = trippedBuses.includes(busId);
            const isSelected = selectedNode && selectedNode.bus_id === busId;
            return (
              <button
                key={busId}
                onClick={() => handleSelectSubstation(busId)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 bg-cyan-950/60 text-cyan-200 border-cyan-400'
                    : isTripped
                    ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse'
                    : 'bg-[#121724] border-white/10 text-cyan-400 hover:text-white'
                }`}
                title={`Inspect Substation P${busId}`}
              >
                P{busId}
              </button>
            );
          })}
        </div>

        {(brokenLines.length > 0 || trippedBuses.length > 0) && (
          <button
            onClick={handleResetAllOutages}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-bold pl-2 border-l border-white/10 transition-colors cursor-pointer"
            title="Restore all broken lines and substations"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}

        <Link
          to="/app/contingency"
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white pl-2 border-l border-white/10 cursor-pointer"
        >
          <span>Matrix</span>
          <ChevronRight className="w-3 h-3" />
        </Link>

      </div>

      {/* ========================================================================= */}
      {/* EXPANDED INTERACTIVE SIDE PANEL: Node & Link Inspection, Failure Cascade */}
      {/* ========================================================================= */}
      {(selectedNode || selectedLink) && (
        <div className="absolute top-16 right-6 w-[410px] max-h-[calc(100vh-140px)] z-40 bg-[#0b0e17]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl flex flex-col gap-3.5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${
                selectedLink ? (brokenLines.includes(selectedLink.line_id) ? 'bg-red-500 animate-ping' : 'bg-blue-400') :
                isSelectedBusTripped ? 'bg-red-500 animate-ping' :
                selectedNode.layer === 'POWER' ? 'bg-blue-400' :
                selectedNode.layer === 'WATER' ? 'bg-cyan-400' :
                selectedNode.layer === 'TRANSPORTATION' ? 'bg-amber-400' :
                selectedNode.layer === 'TELECOM' ? 'bg-purple-400' : 'bg-emerald-400'
              }`} />
              <div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                  {selectedLink ? `TRANSMISSION LINE #${selectedLink.line_id}` : selectedNode.name}
                  {selectedLink && brokenLines.includes(selectedLink.line_id) && (
                    <span className="text-[10px] font-mono bg-red-600/30 text-red-400 border border-red-500/50 px-1.5 py-0.2 rounded font-black">
                      SEVERED
                    </span>
                  )}
                  {isSelectedBusTripped && (
                    <span className="text-[10px] font-mono bg-red-600/30 text-red-400 border border-red-500/50 px-1.5 py-0.2 rounded font-black">
                      BREAKER OPEN
                    </span>
                  )}
                </h4>
                <span className="text-[11px] text-gray-400 font-mono">
                  {selectedLink ? 'Layer: POWER TRANSMISSION CORRIDOR' : `Layer: ${selectedNode.layer}`}
                </span>
              </div>
            </div>
            <button 
              onClick={() => { setSelectedNode(null); setSelectedLink(null); }} 
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selector for Power Node or Line */}
          {(selectedNode?.layer === 'POWER' || selectedLink) && (
            <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs font-semibold">
              <button
                onClick={() => setActiveInspectorTab('TELEMETRY')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeInspectorTab === 'TELEMETRY'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Telemetry
              </button>
              <button
                onClick={() => setActiveInspectorTab('IMPACT')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeInspectorTab === 'IMPACT'
                    ? 'bg-red-600/30 text-red-300 border border-red-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Cascades
              </button>
              <button
                onClick={() => setActiveInspectorTab('TIMELINE')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeInspectorTab === 'TIMELINE'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Timeline
              </button>
            </div>
          )}

          {/* Scrollable Body Content */}
          <div className="overflow-y-auto pr-1 flex flex-col gap-3 max-h-[calc(100vh-270px)] custom-scrollbar">

            {/* A. TRANSMISSION LINE INSPECTION */}
            {selectedLink && (
              <div className="flex flex-col gap-3 font-mono text-xs">
                
                {/* Line Status Card */}
                <div className="bg-[#121724] border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Circuit ID:</span>
                    <span className="text-white font-bold">Line #{selectedLink.line_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Terminal Substation From:</span>
                    <button
                      onClick={() => handleSelectSubstation(getBusIdFromRef(selectedLink.source))}
                      className="text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Substation P{getBusIdFromRef(selectedLink.source)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Terminal Substation To:</span>
                    <button
                      onClick={() => handleSelectSubstation(getBusIdFromRef(selectedLink.target))}
                      className="text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Substation P{getBusIdFromRef(selectedLink.target)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">GATv2 Thermal Overload Risk:</span>
                    <span className={`font-bold ${
                      (selectedLink.risk || 0) > 0.85 ? 'text-red-400' :
                      (selectedLink.risk || 0) > 0.65 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {((selectedLink.risk || 0.12) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Operating Status:</span>
                    <span className={`font-bold ${
                      brokenLines.includes(selectedLink.line_id) ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {brokenLines.includes(selectedLink.line_id) ? 'TRIPPED / DISCONNECTED' : 'ENERGIZED / NOMINAL'}
                    </span>
                  </div>
                </div>

                {/* Direct Action Button to Trip or Restore Line */}
                <div className="pt-1 flex flex-col gap-2">
                  {brokenLines.includes(selectedLink.line_id) ? (
                    <button
                      onClick={() => handleToggleLine(selectedLink.line_id)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Restore Transmission Line #{selectedLink.line_id}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleLine(selectedLink.line_id)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_18px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-white animate-pulse" />
                      <span>⚡ Trip Line #{selectedLink.line_id}</span>
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* B. ELECTRICAL POWER NODE INSPECTION */}
            {selectedNode && selectedNode.layer === 'POWER' && (
              <>
                {/* 1. LOAD PERCENTAGE GAUGE & METRICS */}
                {activeInspectorTab === 'TELEMETRY' && selectedBusTelemetry && (
                  <div className="flex flex-col gap-3">
                    
                    {/* Load Percentage Visual Card */}
                    <div className="bg-[#121724]/90 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          Substation Load Factor
                        </span>
                        <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                          isSelectedBusTripped 
                            ? 'bg-red-950 text-red-400 border border-red-500/40' 
                            : (selectedBusTelemetry.load_percentage || 0) > 85 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : (selectedBusTelemetry.load_percentage || 0) > 65
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isSelectedBusTripped ? '0.0% [DE-ENERGIZED]' : `${(selectedBusTelemetry.load_percentage || 0).toFixed(1)}%`}
                        </span>
                      </div>

                      {/* Animated Gauge Bar */}
                      <div className="w-full bg-slate-900/90 rounded-full h-2.5 border border-white/10 overflow-hidden relative">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            isSelectedBusTripped 
                              ? 'bg-transparent'
                              : (selectedBusTelemetry.load_percentage || 0) > 85
                              ? 'bg-gradient-to-r from-amber-500 to-red-500'
                              : (selectedBusTelemetry.load_percentage || 0) > 65
                              ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                              : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          }`}
                          style={{ width: `${isSelectedBusTripped ? 0 : Math.min(100, selectedBusTelemetry.load_percentage || 0)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] font-mono text-gray-400">
                        <span>Active Power: <strong className="text-white">{(selectedBusTelemetry.active_power_mw || 0).toFixed(1)} MW</strong></span>
                        <span>Rating: <strong className="text-gray-300">522.0 MW</strong></span>
                      </div>
                    </div>

                    {/* Operational Telemetry Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="bg-[#121724]/70 border border-white/10 rounded-xl p-2.5 flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Substation</span>
                        <span className="text-cyan-300 font-bold text-sm">345.0 kV</span>
                        <span className="text-[10px] text-gray-500">Nominal 1.0 p.u.</span>
                      </div>
                      <div className="bg-[#121724]/70 border border-white/10 rounded-xl p-2.5 flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Breaker</span>
                        <span className={`font-bold text-sm ${isSelectedBusTripped ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isSelectedBusTripped ? 'OPEN' : 'ARMED'}
                        </span>
                        <span className="text-[10px] text-gray-500">SF6 Protection</span>
                      </div>
                      <div className="bg-[#121724]/70 border border-white/10 rounded-xl p-2.5 flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">GNN Risk</span>
                        <span className={`font-bold text-sm ${
                          isSelectedBusTripped || (busRisks[selectedNode.bus_id] || 0) >= 0.70 
                            ? 'text-red-400' 
                            : (busRisks[selectedNode.bus_id] || 0) >= 0.40 
                            ? 'text-amber-400' 
                            : 'text-emerald-400'
                        }`}>
                          {isSelectedBusTripped ? '100%' : `${(((busRisks[selectedNode.bus_id] || 0.12)) * 100).toFixed(1)}%`}
                        </span>
                        <span className="text-[10px] text-gray-500">Cascade Prob</span>
                      </div>
                    </div>

                    {/* Connected Transmission Lines */}
                    <div className="bg-[#121724]/70 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                      <span className="text-xs text-gray-400 font-mono">Incident Transmission Corridors (Click to inspect):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedBusTelemetry.connected_lines || []).map((l: number) => {
                          const isSevered = brokenLines.includes(l) || isSelectedBusTripped;
                          return (
                            <button 
                              key={l}
                              onClick={() => handleSelectLine(l)}
                              className={`text-[11px] font-mono px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                                isSevered 
                                  ? 'bg-red-950/80 border-red-500/60 text-red-300 font-bold hover:bg-red-900/90' 
                                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/15 hover:text-white'
                              }`}
                            >
                              Line {l} {isSevered ? '(Severed)' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Direct Dependent Assets */}
                    <div className="bg-[#121724]/70 border border-white/10 rounded-xl p-3 flex flex-col gap-2 text-xs font-mono">
                      <span className="text-gray-400">Direct Sector Dependencies Powered:</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-cyan-300">
                          <Droplets className="w-3.5 h-3.5" />
                          <span>{selectedBusTelemetry.dependent_water_pumps} Booster Pumps</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Car className="w-3.5 h-3.5" />
                          <span>{selectedBusTelemetry.dependent_traffic_signals} Traffic Signals</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-purple-300">
                          <Radio className="w-3.5 h-3.5" />
                          <span>{selectedBusTelemetry.dependent_towers} Cell Towers</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-300">
                          <Hospital className="w-3.5 h-3.5" />
                          <span>{selectedBusTelemetry.dependent_hospitals} Regional Hospitals</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. CASCADING IMPACT BREAKDOWN */}
                {activeInspectorTab === 'IMPACT' && (
                  <div className="flex flex-col gap-3 font-mono text-xs">
                    {isSelectedBusTripped ? (
                      <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          <span>Cascading Outage In Progress</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                          Tripping Substation {selectedNode.bus_id} has severed all incident transmission circuits, forcing instantaneous power flow redistribution across parallel branches and de-energizing interconnected public services.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-gray-400">
                        Substation {selectedNode.bus_id} is operating nominally. Click the <strong className="text-red-400">"Trip Failure"</strong> button below to simulate immediate breaker severance and cross-infrastructure cascade.
                      </div>
                    )}

                    {/* Sector Impacts Grid */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">Multi-Sector Propagation Summary:</span>

                      {/* Power */}
                      <div className="bg-[#121724] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="text-white font-bold text-xs">Power Grid Redirection</div>
                            <div className="text-[10px] text-gray-400">{summary.power_lines_tripped} Lines Cut | GATv2 Rebalanced</div>
                          </div>
                        </div>
                        <span className="text-red-400 font-bold text-xs">{summary.power_buses_offline} Buses Down</span>
                      </div>

                      {/* Water */}
                      <div className="bg-[#121724] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-cyan-400" />
                          <div>
                            <div className="text-white font-bold text-xs">Water Booster Pumping</div>
                            <div className="text-[10px] text-gray-400">0h Backup • Immediate Shutoff</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-cyan-400 font-bold text-xs">{summary.water_pumps_tripped} Pumps Cut</div>
                          <div className="text-[10px] text-gray-400">-{summary.estimated_water_loss_gpm.toLocaleString()} GPM</div>
                        </div>
                      </div>

                      {/* Transportation */}
                      <div className="bg-[#121724] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-amber-400" />
                          <div>
                            <div className="text-white font-bold text-xs">Transportation & Signals</div>
                            <div className="text-[10px] text-gray-400">Signal Controllers Dark</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-400 font-bold text-xs">{summary.traffic_signals_offline || 0} Intersections</div>
                          <div className="text-[10px] text-gray-400">{summary.transit_corridors_impacted || 0} Rail Corridors</div>
                        </div>
                      </div>

                      {/* Telecom */}
                      <div className="bg-[#121724] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-purple-400" />
                          <div>
                            <div className="text-white font-bold text-xs">Telecommunications</div>
                            <div className="text-[10px] text-gray-400">VRLA Batteries (4-8h reserve)</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-purple-300 font-bold text-xs">{summary.cell_towers_on_battery} on Battery</div>
                          <div className="text-[10px] text-gray-400">{summary.cell_towers_offline} Blackout</div>
                        </div>
                      </div>

                      {/* Healthcare */}
                      <div className="bg-[#121724] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hospital className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="text-white font-bold text-xs">Emergency Healthcare</div>
                            <div className="text-[10px] text-gray-400">Diesel Gensets (72h tank)</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-bold text-xs">{summary.hospitals_on_generator} on Genset</div>
                          <div className="text-[10px] text-red-400">{summary.icu_beds_at_risk} ICU at Risk</div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 3. FUTURE EFFECTS PREDICTIVE TIMELINE */}
                {activeInspectorTab === 'TIMELINE' && (
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">
                      Predicted Failure Progression ({timelineProgression.length} Stages):
                    </span>

                    <div className="flex flex-col gap-2.5">
                      {timelineProgression.map((stage) => {
                        const timeLabel = stage.time_horizon || stage.time_label || `Stage ${stage.stage}`;
                        const phaseTitle = stage.phase || stage.phase_title || 'Cascading Phase';
                        const tags = stage.sectors_affected || stage.consequences || [];
                        return (
                          <div 
                            key={stage.stage}
                            className="bg-[#121724] border border-white/10 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                                {timeLabel}
                              </span>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                stage.severity === 'CRITICAL' || stage.severity === 'CATASTROPHIC' || stage.severity === 'EMERGENCY'
                                  ? 'bg-red-950 text-red-400 border border-red-500/50' 
                                  : stage.severity === 'HIGH' || stage.severity === 'SEVERE' 
                                  ? 'bg-orange-950 text-orange-400 border border-orange-500/50' 
                                  : 'bg-amber-950 text-amber-400 border border-amber-500/50'
                              }`}>
                                {stage.severity}
                              </span>
                            </div>

                            <h5 className="font-bold text-white text-xs font-sans">
                              {phaseTitle}
                            </h5>

                            <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                              {stage.description}
                            </p>

                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {tags.map((item, idx) => (
                                  <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300">
                                    • {item}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PROMINENT "TRIP FAILURE" ACTION BUTTON */}
                <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                  {isSelectedBusTripped ? (
                    <button
                      onClick={() => handleRestoreBus(selectedNode.bus_id)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Restore Substation P{selectedNode.bus_id}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTripBus(selectedNode.bus_id)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_18px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-white animate-pulse" />
                      <span>⚡ Trip Failure on Substation P{selectedNode.bus_id}</span>
                    </button>
                  )}
                  <p className="text-[10px] text-gray-500 text-center font-mono">
                    {isSelectedBusTripped 
                      ? 'Substation is currently offline. Restoring reconnects circuits and rebalances grid.'
                      : 'Simulates instantaneous breaker trip, line disconnection & multi-sector cascade.'}
                  </p>
                </div>
              </>
            )}

            {/* C. WATER NODE INSPECTION */}
            {selectedNode && selectedNode.layer === 'WATER' && (
              <div className="flex flex-col gap-3 text-xs font-mono">
                <div className="bg-[#121724] border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Node Type:</span>
                    <span className="text-cyan-400 font-bold">{selectedNode.is_pump ? 'High-Volume Booster Pump' : 'Distribution Junction'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Hydraulic Pressure:</span>
                    <span className="text-cyan-400 font-bold">{selectedNode.pressure_psi} PSI</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Operational Status:</span>
                    <span className={selectedNode.status === 'NOMINAL_PRESSURE' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {selectedNode.status}
                    </span>
                  </div>
                  {selectedNode.power_bus_id !== undefined && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-gray-400">Power Substation:</span>
                      <button
                        onClick={() => handleSelectSubstation(selectedNode.power_bus_id)}
                        className="text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Substation P{selectedNode.power_bus_id}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {selectedNode.power_bus_id !== undefined && (
                  <button
                    onClick={() => handleSelectSubstation(selectedNode.power_bus_id)}
                    className="w-full py-2.5 px-3 bg-blue-950/70 hover:bg-blue-900 border border-blue-500/50 text-blue-300 font-sans font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>Inspect Power Substation P{selectedNode.power_bus_id}</span>
                  </button>
                )}
              </div>
            )}

            {/* D. TRANSPORTATION NODE INSPECTION */}
            {selectedNode && selectedNode.layer === 'TRANSPORTATION' && (
              <div className="flex flex-col gap-3 text-xs font-mono">
                <div className="bg-[#121724] border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Intersections Offline:</span>
                    <span className="text-amber-400 font-bold">{selectedNode.intersections_offline} Signals Dark</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Electrified Transit Rail:</span>
                    <span className="text-red-400 font-bold">{selectedNode.has_electrified_transit ? 'YES (Traction Power Halted)' : 'NO (Diesel Only)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Signal Controller Status:</span>
                    <span className="text-red-400 font-bold">{selectedNode.status}</span>
                  </div>
                  {selectedNode.power_bus_id !== undefined && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-gray-400">Power Substation:</span>
                      <button
                        onClick={() => handleSelectSubstation(selectedNode.power_bus_id)}
                        className="text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Substation P{selectedNode.power_bus_id}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {selectedNode.power_bus_id !== undefined && (
                  <button
                    onClick={() => handleSelectSubstation(selectedNode.power_bus_id)}
                    className="w-full py-2.5 px-3 bg-blue-950/70 hover:bg-blue-900 border border-blue-500/50 text-blue-300 font-sans font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>Inspect Power Substation P{selectedNode.power_bus_id}</span>
                  </button>
                )}
              </div>
            )}

            {/* E. TELECOM NODE INSPECTION */}
            {selectedNode && selectedNode.layer === 'TELECOM' && (
              <div className="flex flex-col gap-3 text-xs font-mono">
                <div className="bg-[#121724] border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Cell Carrier:</span>
                    <span className="text-purple-300 font-bold">{selectedNode.carrier || 'Regional Wireless'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Reserve Battery Remaining:</span>
                    <span className="text-purple-300 font-bold">{selectedNode.hours_remaining} hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Battery Status:</span>
                    <span className={selectedNode.status === 'BATTERY_EXHAUSTED' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                      {selectedNode.status}
                    </span>
                  </div>
                  {selectedNode.power_bus_id !== undefined && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-gray-400">Power Substation:</span>
                      <button
                        onClick={() => handleSelectSubstation(selectedNode.power_bus_id)}
                        className="text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Substation P{selectedNode.power_bus_id}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {selectedNode.power_bus_id !== undefined && (
                  <button
                    onClick={() => handleSelectSubstation(selectedNode.power_bus_id)}
                    className="w-full py-2.5 px-3 bg-blue-950/70 hover:bg-blue-900 border border-blue-500/50 text-blue-300 font-sans font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>Inspect Power Substation P{selectedNode.power_bus_id}</span>
                  </button>
                )}
              </div>
            )}

            {/* F. HEALTHCARE NODE INSPECTION */}
            {selectedNode && selectedNode.layer === 'HEALTHCARE' && (
              <div className="flex flex-col gap-3 text-xs font-mono">
                <div className="bg-[#121724] border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Licensed ICU Beds:</span>
                    <span className="text-emerald-400 font-bold">{selectedNode.icu_beds} Beds</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Staffed Hospital Beds:</span>
                    <span className="text-white font-bold">{selectedNode.staffed_beds} Beds</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Generator Fuel Remaining:</span>
                    <span className="text-amber-400 font-bold">{selectedNode.fuel_hours_remaining}h Tank</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Operating Status:</span>
                    <span className={selectedNode.status === 'CRITICAL_POWER_EXHAUSTION' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                      {selectedNode.status}
                    </span>
                  </div>
                  {selectedNode.power_bus_id !== undefined && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-gray-400">Power Substation:</span>
                      <button
                        onClick={() => handleSelectSubstation(selectedNode.power_bus_id)}
                        className="text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Substation P{selectedNode.power_bus_id}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {selectedNode.power_bus_id !== undefined && (
                  <button
                    onClick={() => handleSelectSubstation(selectedNode.power_bus_id)}
                    className="w-full py-2.5 px-3 bg-blue-950/70 hover:bg-blue-900 border border-blue-500/50 text-blue-300 font-sans font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>Inspect Power Substation P{selectedNode.power_bus_id}</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}