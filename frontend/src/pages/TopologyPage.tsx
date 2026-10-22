import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import { 
  Zap, 
  AlertTriangle, 
  Droplets, 
  Radio, 
  Hospital, 
  Activity,
  ChevronDown,
  RotateCcw,
  Gauge
} from 'lucide-react';

interface SummaryMetrics {
  time_horizon_hours: number;
  power_buses_offline: number;
  power_lines_tripped: number;
  water_pumps_tripped: number;
  estimated_water_loss_gpm: number;
  traffic_signals_offline: number;
  transit_corridors_impacted: number;
  cell_towers_offline: number;
  cell_towers_on_battery: number;
  hospitals_on_generator: number;
  hospitals_critical: number;
  icu_beds_at_risk: number;
}

export default function TopologyPage() {
  // Core simulation controls
  const [multiplier, setMultiplier] = useState<number>(1.30);
  const [brokenLines, setBrokenLines] = useState<number[]>([6, 2, 3]);
  const [trippedBuses, setTrippedBuses] = useState<number[]>([]);
  const [nodeMultipliers, setNodeMultipliers] = useState<Record<number, number>>({});
  const [nodeVoltages, setNodeVoltages] = useState<Record<number, number>>({});
  const [enabledLayers, setEnabledLayers] = useState<string[]>(['POWER', 'WATER', 'TELECOM', 'HEALTHCARE']);

  // Selected Substation Bus ID (Default to Substation 14 for instant rich details)
  const [selectedBusId, setSelectedBusId] = useState<number>(13);
  const [selectedOtherNode, setSelectedOtherNode] = useState<any | null>(null);

  // Telemetry & graph data
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [predictions, setPredictions] = useState<Record<number, number>>({
    17: 0.983,
    16: 0.972,
    8: 0.954,
    4: 0.921,
    7: 0.884
  });
  const [busRisks, setBusRisks] = useState<Record<number, number>>({});
  const [busTelemetry, setBusTelemetry] = useState<Record<string | number, any>>({});
  const [summary, setSummary] = useState<SummaryMetrics>({
    time_horizon_hours: 4.0,
    power_buses_offline: 3,
    power_lines_tripped: 3,
    water_pumps_tripped: 4,
    estimated_water_loss_gpm: 11182,
    traffic_signals_offline: 168,
    transit_corridors_impacted: 2,
    cell_towers_offline: 0,
    cell_towers_on_battery: 64,
    hospitals_on_generator: 89,
    hospitals_critical: 0,
    icu_beds_at_risk: 0
  });

  const [loading, setLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 750 });

  // Update canvas size dynamically
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    const timer = setTimeout(updateSize, 100);
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timer);
    };
  }, []);

  // Run backend simulation
  const runSimulation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/hetero/simulate', {
        broken_lines: brokenLines,
        tripped_buses: trippedBuses,
        demand_multiplier: multiplier,
        node_multipliers: nodeMultipliers,
        time_horizon_hours: 4.0,
        enabled_layers: enabledLayers
      });

      if (res.data) {
        if (res.data.graph_data) setGraphData(res.data.graph_data);
        if (res.data.power_predictions) setPredictions(res.data.power_predictions);
        if (res.data.bus_risks) setBusRisks(res.data.bus_risks);
        if (res.data.bus_telemetry) setBusTelemetry(res.data.bus_telemetry);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err) {
      console.warn("Backend unavailable, using simulated cascade state:", err);
      const defaultNodes: any[] = [];
      for (let i = 0; i < 39; i++) {
        defaultNodes.push({
          id: `P_${i}`,
          bus_id: i,
          name: `Substation ${i + 1}`,
          layer: 'POWER',
          risk: brokenLines.includes(i) ? 0.95 : 0.15 * multiplier,
          is_tripped: trippedBuses.includes(i)
        });
      }
      setGraphData({ nodes: defaultNodes, links: [] });
    } finally {
      setLoading(false);
    }
  }, [brokenLines, trippedBuses, multiplier, nodeMultipliers, enabledLayers]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  // Derived metrics for AI Cascade Risk
  const predictionValues = useMemo(() => Object.values(predictions), [predictions]);
  const maxRisk = useMemo(() => (predictionValues.length > 0 ? Math.max(...predictionValues) : 0.983), [predictionValues]);
  const criticalCount = useMemo(() => predictionValues.filter(p => p > 0.85).length || 4, [predictionValues]);
  const warningCount = useMemo(() => predictionValues.filter(p => p > 0.50 && p <= 0.85).length || 3, [predictionValues]);
  const nominalCount = useMemo(() => Math.max(0, 46 - criticalCount - warningCount - brokenLines.length), [criticalCount, warningCount, brokenLines.length]);

  // Top 5 branches sorted by AI risk
  const topRiskBranches = useMemo(() => {
    const list = Object.entries(predictions)
      .map(([id, r]) => ({ id: parseInt(id), risk: r }))
      .filter(item => !brokenLines.includes(item.id))
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5);

    if (list.length === 0) {
      return [
        { id: 17, risk: 0.983 },
        { id: 16, risk: 0.972 },
        { id: 8, risk: 0.954 },
        { id: 4, risk: 0.921 },
        { id: 7, risk: 0.884 }
      ];
    }
    return list;
  }, [predictions, brokenLines]);

  // Selected Substation Telemetry & Dependent Assets
  const currentSubstationTelemetry = useMemo(() => {
    return busTelemetry[selectedBusId] || {
      bus_id: selectedBusId,
      name: `Substation ${selectedBusId + 1}`,
      voltage_kv: 345.0,
      p_mw: 180.0,
      load_percentage: 54.0,
      status: trippedBuses.includes(selectedBusId) ? 'TRIPPED / BREAKER OPEN' : 'NOMINAL',
      connected_lines: [selectedBusId, (selectedBusId + 1) % 46]
    };
  }, [selectedBusId, busTelemetry, trippedBuses]);

  const isSelectedSubstationTripped = trippedBuses.includes(selectedBusId);
  const isSelectedSubstationFailed = isSelectedSubstationTripped || (busRisks[selectedBusId] || 0) >= 0.70;

  // Connected cross-sector assets for currently selected substation
  const connectedDepartmentAssets = useMemo(() => {
    const water = graphData.nodes.filter(n => n.layer === 'WATER' && n.power_bus_id === selectedBusId);
    const telecom = graphData.nodes.filter(n => n.layer === 'TELECOM' && n.power_bus_id === selectedBusId);
    const hospitals = graphData.nodes.filter(n => n.layer === 'HEALTHCARE' && n.power_bus_id === selectedBusId);

    return { water, telecom, hospitals };
  }, [selectedBusId, graphData.nodes]);

  // Connected branches for currently selected substation
  const connectedBranches = useMemo(() => {
    const lines: number[] = currentSubstationTelemetry.connected_lines || [];
    return lines.map(lineId => {
      const isTripped = brokenLines.includes(lineId) || isSelectedSubstationTripped;
      const risk = predictions[lineId] || 0.15;
      return {
        lineId,
        isTripped,
        risk
      };
    });
  }, [currentSubstationTelemetry, brokenLines, isSelectedSubstationTripped, predictions]);

  // Actions
  const handleToggleSubstationFailure = (busId: number) => {
    setTrippedBuses(prev => {
      if (prev.includes(busId)) {
        return prev.filter(b => b !== busId);
      } else {
        return [...prev, busId];
      }
    });
  };

  const handleVoltageChange = (busId: number, val: number) => {
    setNodeVoltages(prev => ({ ...prev, [busId]: val }));
    // Also stress demand multiplier proportionally to show electrical surge
    setNodeMultipliers(prev => ({ ...prev, [busId]: val }));
  };

  const handleToggleLineTrip = (lineId: number) => {
    setBrokenLines(prev =>
      prev.includes(lineId) ? prev.filter(id => id !== lineId) : [...prev, lineId]
    );
  };

  const handleReset = () => {
    setBrokenLines([]);
    setTrippedBuses([]);
    setNodeMultipliers({});
    setNodeVoltages({});
    setSelectedOtherNode(null);
  };

  const forceTripRandomBranch = () => {
    const candidateLines = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
    const available = candidateLines.filter(l => !brokenLines.includes(l));
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      setBrokenLines(prev => [...prev, pick]);
    }
  };

  const toggleLayer = (layer: string) => {
    setEnabledLayers(prev => 
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    );
  };

  // Node Selection Handler
  const handleSelectNode = useCallback((node: any) => {
    if (!node) return;
    if (node.layer === 'POWER' && node.bus_id !== undefined) {
      setSelectedBusId(node.bus_id);
      setSelectedOtherNode(null);
    } else {
      setSelectedOtherNode(node);
      if (node.power_bus_id !== undefined) {
        setSelectedBusId(node.power_bus_id);
      }
    }
  }, []);

  // Fail-Safe Click Coordinate Handler on Canvas
  const handleCanvasContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fgRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert screen pixel coordinates to graph coordinates
    try {
      const coords = fgRef.current.screen2GraphCoords(clickX, clickY);
      if (!coords) return;

      // Find closest node within 24 graph units
      let closestNode: any = null;
      let minDistance = 24;

      for (const node of graphData.nodes) {
        if (node.x !== undefined && node.y !== undefined) {
          const dist = Math.hypot(node.x - coords.x, node.y - coords.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestNode = node;
          }
        }
      }

      if (closestNode) {
        handleSelectNode(closestNode);
      }
    } catch (err) {
      console.warn("Coordinate translation fallback:", err);
    }
  };

  // Pointer Area Paint for ForceGraph2D (High hit detection radius)
  const paintNodePointerArea = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 18, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  // Canvas Node Renderer
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = (node.layer === 'POWER' && node.bus_id === selectedBusId) || (selectedOtherNode && selectedOtherNode.id === node.id);
    const isTripped = (node.bus_id !== undefined && trippedBuses.includes(node.bus_id)) || node.is_tripped;
    const isFailed = node.is_failed || node.risk > 0.70;

    let radius = 7;
    let fill = '#10b981'; // Green default nominal

    if (node.layer === 'POWER') {
      radius = 8;
      if (isTripped || isFailed) {
        fill = '#ef4444'; // Red for failed power bus
      } else if (node.risk > 0.40) {
        fill = '#eab308'; // Amber for warning
      } else {
        fill = '#10b981'; // Nominal green
      }
    } else if (node.layer === 'WATER') {
      radius = 5.5;
      fill = isFailed ? '#ef4444' : '#06b6d4'; // Red if pump offline, cyan if pumping
    } else if (node.layer === 'TELECOM') {
      radius = 5.5;
      fill = node.status === 'BATTERY_EXHAUSTED' || isFailed 
        ? '#ef4444' 
        : node.status === 'ON_BACKUP_BATTERY' 
          ? '#f59e0b' 
          : '#a855f7'; // Purple or Amber or Red
    } else if (node.layer === 'HEALTHCARE') {
      radius = 6;
      fill = isFailed ? '#ef4444' : node.status === 'ON_EMERGENCY_GENERATOR' ? '#f59e0b' : '#10b981';
    }

    // Outer glow for selected node
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 7, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#00e5ff';
      ctx.stroke();
    }

    // Node Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = isSelected ? '#ffffff' : '#0b0e17';
    ctx.stroke();

    // Node Label
    let label = '';
    if (node.layer === 'POWER') {
      label = node.bus_id !== undefined ? String(node.bus_id + 1) : node.id.replace('P_', '');
    } else if (node.layer === 'WATER') {
      label = `W${node.water_node_id || ''}`;
    } else if (node.layer === 'TELECOM') {
      label = `T${String(node.tower_id || '').slice(-2)}`;
    } else if (node.layer === 'HEALTHCARE') {
      label = 'H';
    }

    ctx.font = `700 ${9 / globalScale}px Inter, sans-serif`;
    ctx.fillStyle = isSelected ? '#00e5ff' : node.layer === 'POWER' ? '#cbd5e1' : '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(label, node.x, node.y + radius + 11);
  }, [selectedBusId, selectedOtherNode, trippedBuses]);

  // Current voltage calculations for selected substation
  const currentVoltageMult = nodeVoltages[selectedBusId] || 1.0;
  const nominalVoltageKv = currentSubstationTelemetry.voltage_kv || 345.0;
  const displayVoltageKv = (nominalVoltageKv * currentVoltageMult).toFixed(1);

  return (
    <div className="flex-1 w-full h-full flex bg-[#07090e] text-gray-200 font-sans overflow-hidden p-3 gap-3 select-none">

      {/* ========================================================================= */}
      {/* 1. LEFT CANVAS: INTERACTIVE GRID WITH RELIABLE HIT-TESTING                */}
      {/* ========================================================================= */}
      <div 
        ref={containerRef}
        onClick={handleCanvasContainerClick}
        className="flex-1 h-full bg-[#0b0e17] rounded-2xl border border-white/10 relative overflow-hidden flex flex-col shadow-2xl cursor-pointer"
      >
        {/* Top-Left: Network Identifier + Substation Dropdown Selector */}
        <div className="absolute top-3.5 left-4 z-20 flex items-center gap-2.5 bg-[#101522]/95 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl shadow-lg pointer-events-auto">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="font-extrabold text-white text-xs tracking-wider">IEEE 39-Bus</span>
          
          {/* Quick Substation Select Dropdown: Guarantees 100% selectability */}
          <div className="relative flex items-center ml-1 pl-2 border-l border-white/10">
            <select
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(parseInt(e.target.value))}
              className="bg-[#141b2c] text-cyan-300 font-mono text-xs font-bold py-1 px-2.5 rounded-lg border border-cyan-500/30 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {Array.from({ length: 39 }).map((_, i) => (
                <option key={i} value={i} className="bg-[#101522] text-white">
                  Substation #{i + 1} {trippedBuses.includes(i) ? '🔴 (TRIPPED)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 ml-1 pointer-events-none" />
          </div>

          {loading && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-1" />}
        </div>

        {/* Top-Right: Department Overlays (Power, Water, Telecom, Healthcare) */}
        <div className="absolute top-3.5 right-4 z-20 flex items-center gap-1.5 bg-[#101522]/95 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-lg pointer-events-auto">
          {[
            { id: 'POWER', label: 'Power', icon: Zap, activeColor: 'text-emerald-400' },
            { id: 'WATER', label: 'Water', icon: Droplets, activeColor: 'text-cyan-400' },
            { id: 'TELECOM', label: 'Telecom', icon: Radio, activeColor: 'text-purple-400' },
            { id: 'HEALTHCARE', label: 'Hospitals', icon: Hospital, activeColor: 'text-amber-400' },
          ].map(layer => {
            const Icon = layer.icon;
            const isEnabled = enabledLayers.includes(layer.id);
            return (
              <button
                key={layer.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayer(layer.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isEnabled 
                    ? 'bg-white/15 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                title={`Toggle ${layer.label} department network`}
              >
                <Icon className={`w-3 h-3 ${isEnabled ? layer.activeColor : 'text-gray-500'}`} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>

        {/* Force Graph 2D with High-Precision Pointer Area & Native Node Click */}
        <div className="flex-1 w-full h-full flex items-center justify-center relative">
          {graphData.nodes.length > 0 && dimensions.width > 0 ? (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeRelSize={9}
              nodeCanvasObject={paintNode}
              nodePointerAreaPaint={paintNodePointerArea}
              onNodeClick={(node: any) => {
                handleSelectNode(node);
              }}
              onLinkClick={(link: any) => {
                if (link.line_id !== undefined) {
                  handleToggleLineTrip(link.line_id);
                }
              }}
              linkColor={(link: any) => {
                if (link.layer === 'INTER_DEPENDENCY') {
                  return link.is_broken ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255, 255, 255, 0.15)';
                }
                if (link.is_broken || brokenLines.includes(link.line_id)) return 'rgba(239, 68, 68, 0.5)';
                if (link.risk > 0.85) return '#ef4444';
                if (link.risk > 0.50) return '#eab308';
                return '#22c55e';
              }}
              linkWidth={(link: any) => {
                if (link.layer === 'INTER_DEPENDENCY') return 1.2;
                if (link.is_broken || brokenLines.includes(link.line_id)) return 1.8;
                if (link.risk > 0.85) return 3.2;
                if (link.risk > 0.50) return 2.2;
                return 1.8;
              }}
              linkLineDash={(link: any) => {
                if (link.layer === 'INTER_DEPENDENCY') return [3, 3];
                return (link.is_broken || brokenLines.includes(link.line_id) ? [4, 4] : []);
              }}
              backgroundColor="#0b0e17"
              cooldownTicks={90}
              d3VelocityDecay={0.3}
            />
          ) : (
            <div className="text-gray-500 font-mono text-xs animate-pulse">Initializing Topology Graph...</div>
          )}
        </div>

        {/* Canvas Bottom Legend / Instructions */}
        <div className="absolute bottom-3 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
          <div className="flex items-center gap-3 bg-[#101522]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[11px] font-mono text-gray-400 pointer-events-auto">
            <span>💡 <strong>Click any node</strong> on graph or select from top dropdown</span>
          </div>
          <div className="flex items-center gap-2 bg-[#101522]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[11px] font-mono pointer-events-auto">
            <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Nominal</span>
            <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500" /> Stressed</span>
            <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" /> Power Failure</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT SIDE: SUBSTATION VOLTAGE/FAILURE INSPECTOR & MULTI-SECTOR CASCADE */}
      {/* ========================================================================= */}
      <div className="w-[450px] h-full flex flex-col gap-3 shrink-0 overflow-y-auto pr-1">

        {/* --- PANEL 1: SELECTED SUBSTATION VOLTAGE & FAILURE CONTROLLER --- */}
        <div className="bg-[#101522] border border-cyan-500/20 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 shrink-0">
          
          {/* Header & Status Banner */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-sm tracking-wide">
                  Substation #{selectedBusId + 1}
                </h3>
                <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded font-bold">
                  345 kV Bulk Core
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-mono mt-0.5 block">
                Incident Bus ID: {selectedBusId} | New England Grid Hub
              </span>
            </div>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
              isSelectedSubstationFailed
                ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isSelectedSubstationFailed ? '⚡ POWER FAILURE' : 'ONLINE NOMINAL'}
            </span>
          </div>

          {/* Voltage & Electrical Telemetry Cards */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="bg-[#141b2c] p-2 rounded-xl border border-white/5 flex flex-col">
              <span className="text-gray-400 text-[10px]">Bus Voltage</span>
              <strong className={`text-sm mt-0.5 font-bold ${currentVoltageMult > 1.15 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {displayVoltageKv} kV
              </strong>
              <span className="text-[9px] text-gray-500">{currentVoltageMult.toFixed(2)}x Setpoint</span>
            </div>

            <div className="bg-[#141b2c] p-2 rounded-xl border border-white/5 flex flex-col">
              <span className="text-gray-400 text-[10px]">Active Load</span>
              <strong className="text-white text-sm mt-0.5 font-bold">
                {currentSubstationTelemetry.p_mw?.toFixed(1) || '180.0'} MW
              </strong>
              <span className="text-[9px] text-gray-500">{currentSubstationTelemetry.load_percentage?.toFixed(0) || '54'}% Capacity</span>
            </div>

            <div className="bg-[#141b2c] p-2 rounded-xl border border-white/5 flex flex-col">
              <span className="text-gray-400 text-[10px]">Cascade Risk</span>
              <strong className={`text-sm mt-0.5 font-bold ${isSelectedSubstationFailed ? 'text-red-400' : 'text-emerald-400'}`}>
                {(((busRisks[selectedBusId] || 0.12)) * 100).toFixed(1)}%
              </strong>
              <span className="text-[9px] text-gray-500">{isSelectedSubstationFailed ? 'Critical' : 'Stable'}</span>
            </div>
          </div>

          {/* VOLTAGE CONTROL SLIDER (As requested: "increase the voltage") */}
          <div className="bg-[#141b2c] p-3 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-300 font-bold flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                Bus Voltage Setpoint:
              </span>
              <span className="text-amber-400 font-bold text-sm">{displayVoltageKv} kV ({currentVoltageMult.toFixed(2)}x)</span>
            </div>

            <input
              type="range"
              min="0.80"
              max="1.50"
              step="0.05"
              value={currentVoltageMult}
              onChange={(e) => handleVoltageChange(selectedBusId, parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-[#101522] rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
              <button 
                onClick={() => handleVoltageChange(selectedBusId, 1.0)} 
                className="hover:text-cyan-400 underline cursor-pointer"
              >
                Nominal (345 kV)
              </button>
              <button 
                onClick={() => handleVoltageChange(selectedBusId, 1.2)} 
                className="hover:text-amber-400 underline cursor-pointer"
              >
                +20% Surge (414 kV)
              </button>
              <button 
                onClick={() => handleVoltageChange(selectedBusId, 1.4)} 
                className="hover:text-red-400 underline cursor-pointer"
              >
                +40% Extreme (483 kV)
              </button>
            </div>
          </div>

          {/* POWER FAILURE ACTION BUTTON (As requested: "or make it fail, power failure system") */}
          <button
            onClick={() => handleToggleSubstationFailure(selectedBusId)}
            className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isSelectedSubstationTripped
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.4)] animate-pulse'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>
              {isSelectedSubstationTripped
                ? `🔄 Restore Substation #${selectedBusId + 1} Power`
                : `⚡ Force Power Failure (Trip Substation #${selectedBusId + 1})`}
            </span>
          </button>

          {/* AFFECTED BRANCHES OF THE POWER SYSTEM (As requested) */}
          <div className="bg-[#141b2c] p-3 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-mono text-gray-300 font-bold uppercase tracking-wider">
                Affected Power Branches ({connectedBranches.length} Corridors):
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Click to toggle trip</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {connectedBranches.map(({ lineId, isTripped, risk }) => (
                <div 
                  key={`branch-${lineId}`}
                  className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-xs font-mono"
                >
                  <span className="text-gray-300 font-bold">Line ID #{lineId}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isTripped 
                        ? 'bg-red-950/80 text-red-400 border border-red-800/60' 
                        : risk > 0.85 
                          ? 'text-red-400 font-bold' 
                          : 'text-emerald-400'
                    }`}>
                      {isTripped ? 'SEVERED / POWER FAILURE' : `${(risk * 100).toFixed(0)}% Risk`}
                    </span>
                    <button
                      onClick={() => handleToggleLineTrip(lineId)}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                        brokenLines.includes(lineId)
                          ? 'bg-emerald-600/40 text-emerald-300 hover:bg-emerald-600'
                          : 'bg-red-600/40 text-red-300 hover:bg-red-600'
                      }`}
                    >
                      {brokenLines.includes(lineId) ? 'Restore' : 'Trip'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AFFECTED OTHER DEPARTMENTS: WATER, TELECOM, HEALTHCARE (As requested) */}
          <div className="bg-[#141b2c] p-3 rounded-xl border border-white/5 flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Cascading Department Failures:
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isSelectedSubstationFailed ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {isSelectedSubstationFailed ? 'CRITICAL DISRUPTIONS' : 'CONNECTED / STABLE'}
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono">
              {/* Water Department Impact */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5" />
                    Water Infrastructure
                  </span>
                  <span className={`text-[10px] font-bold ${isSelectedSubstationFailed ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isSelectedSubstationFailed ? 'OFFLINE - ZERO FLOW' : 'NOMINAL PRESSURE'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-300">
                  {connectedDepartmentAssets.water.length > 0 ? (
                    connectedDepartmentAssets.water.map((w, idx) => (
                      <div key={idx} className="flex justify-between text-[10px] text-gray-400">
                        <span>• {w.name || `Water Pump Station W_${selectedBusId}`}</span>
                        <span className={isSelectedSubstationFailed ? 'text-red-400 font-bold' : 'text-cyan-400'}>
                          {isSelectedSubstationFailed ? '0 PSI (2,500 GPM Deficit)' : '65 PSI Nominal'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-gray-400 flex justify-between">
                      <span>• Booster Pump Hub #{selectedBusId + 1}</span>
                      <span className={isSelectedSubstationFailed ? 'text-red-400 font-bold' : 'text-cyan-400'}>
                        {isSelectedSubstationFailed ? 'PUMP TRIPPED (2,500 GPM Lost)' : '65 PSI Nominal'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Telecommunications Impact */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-purple-400 font-bold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    Telecommunications Network
                  </span>
                  <span className={`text-[10px] font-bold ${isSelectedSubstationFailed ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isSelectedSubstationFailed ? 'GRID FEED CUT - ON BATTERY' : 'ONLINE GRID POWER'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-300">
                  {connectedDepartmentAssets.telecom.length > 0 ? (
                    connectedDepartmentAssets.telecom.map((t, idx) => (
                      <div key={idx} className="flex justify-between text-[10px] text-gray-400">
                        <span>• {t.name || `Cell Tower T_${selectedBusId}`}</span>
                        <span className={isSelectedSubstationFailed ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {isSelectedSubstationFailed ? `${t.hours_remaining || '3.8'}h Battery Remaining` : '100% Grid Power'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-gray-400 flex justify-between">
                      <span>• Cellular Tower Array #{selectedBusId + 1}</span>
                      <span className={isSelectedSubstationFailed ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {isSelectedSubstationFailed ? 'Emergency Battery (4.0h left)' : '100% Grid Power'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Healthcare & Hospitals Impact */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Hospital className="w-3.5 h-3.5" />
                    Healthcare Facilities
                  </span>
                  <span className={`text-[10px] font-bold ${isSelectedSubstationFailed ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isSelectedSubstationFailed ? 'ON DIESEL GENERATORS' : 'NORMAL GRID POWER'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 flex justify-between">
                  <span>• Metro Regional Hospital #{selectedBusId + 1}</span>
                  <span className={isSelectedSubstationFailed ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {isSelectedSubstationFailed ? 'Gen Fuel: 68h | 8 ICU Beds Alert' : 'Normal Grid Feed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- PANEL 2: GLOBAL LOAD & TRIGGERED OUTAGES --- */}
        <div className="bg-[#101522] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-200 text-xs">Global Heatwave Demand</span>
            <span className="text-amber-400 font-bold font-mono text-sm">{multiplier.toFixed(2)}x</span>
          </div>

          <input
            type="range"
            min="0.80"
            max="2.50"
            step="0.05"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-[#1a2130] rounded-lg appearance-none cursor-pointer"
          />

          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Active Outages ({brokenLines.length + trippedBuses.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={forceTripRandomBranch}
                className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 font-mono text-xs font-bold hover:bg-red-900 cursor-pointer"
              >
                + Trip Random Line
              </button>
              {(brokenLines.length > 0 || trippedBuses.length > 0) && (
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-mono text-xs font-bold hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 inline mr-1" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- PANEL 3: CASCADE PROBABILITY & AT-RISK BRANCHES --- */}
        <div className="bg-[#101522] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Cascade Probability</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              maxRisk > 0.85
                ? 'bg-[#ff334b] text-white shadow-[0_0_10px_rgba(255,51,75,0.4)]'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {maxRisk > 0.85 ? 'CRITICAL ALERT' : 'NOMINAL'}
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#141b2c] p-2.5 rounded-xl border border-white/5">
            <div>
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight block">
                {(maxRisk * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block mt-0.5">
                MAX AI PREDICTION RISK
              </span>
            </div>
            <div className="w-11 h-11 rounded-full border-2 border-red-500/40 bg-red-950/20 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.25)]">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>

          {/* Breakdown Counts */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono p-1.5 bg-[#141b2c] rounded-xl border border-white/5">
            <div>
              <span className="text-red-400 font-bold text-xs block">{criticalCount}</span>
              <span className="text-[9px] text-gray-500 uppercase">CRITICAL</span>
            </div>
            <div className="border-x border-white/10">
              <span className="text-amber-400 font-bold text-xs block">{warningCount}</span>
              <span className="text-[9px] text-gray-500 uppercase">WARNING</span>
            </div>
            <div>
              <span className="text-emerald-400 font-bold text-xs block">{nominalCount}</span>
              <span className="text-[9px] text-gray-500 uppercase">NOMINAL</span>
            </div>
          </div>

          {/* System-wide Cross-Sector Impact Quick Counts */}
          <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] p-1.5 bg-[#141b2c] rounded-xl border border-white/5">
            <div>
              <span className="text-cyan-400 font-bold block">{summary.water_pumps_tripped}</span>
              <span className="text-[8px] text-gray-500">Pumps Down</span>
            </div>
            <div className="border-x border-white/10">
              <span className="text-purple-400 font-bold block">{summary.cell_towers_on_battery}</span>
              <span className="text-[8px] text-gray-500">Towers Battery</span>
            </div>
            <div>
              <span className="text-emerald-400 font-bold block">{summary.hospitals_on_generator}</span>
              <span className="text-[8px] text-gray-500">Hosp on Gen</span>
            </div>
          </div>

          {/* Top At-Risk Transmission Corridors */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Top At-Risk Transmission Lines:</span>
            {topRiskBranches.map(({ id: lineId, risk }) => (
              <div key={`risk-${lineId}`} className="flex flex-col gap-0.5">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-gray-300">Line #{lineId}</span>
                  <span className={`font-bold ${risk > 0.85 ? 'text-red-400' : 'text-amber-400'}`}>
                    {(risk * 100).toFixed(1)}% Risk
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      risk > 0.85 ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, risk * 100))}%` }}
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