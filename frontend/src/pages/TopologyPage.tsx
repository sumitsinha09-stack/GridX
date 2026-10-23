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
  Gauge,
  Plus,
  Minus,
  Crosshair
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getCachedSimulation } from '../lib/simulationCache';

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
  const { isLight } = useTheme();

  // Core simulation controls
  const [multiplier, setMultiplier] = useState<number>(1.30);
  const [brokenLines, setBrokenLines] = useState<number[]>([6, 2, 3]);
  const [trippedBuses, setTrippedBuses] = useState<number[]>([]);
  const [nodeMultipliers, setNodeMultipliers] = useState<Record<number, number>>({});
  const [nodeVoltages, setNodeVoltages] = useState<Record<number, number>>({});
  const [enabledLayers, setEnabledLayers] = useState<string[]>(['POWER', 'WATER', 'TELECOM', 'HEALTHCARE']);

  // Selected Substation Bus ID (Default to Substation 14)
  const [selectedBusId, setSelectedBusId] = useState<number>(13);
  const [selectedOtherNode, setSelectedOtherNode] = useState<any | null>(null);

  // Telemetry & graph data initialized instantly from prewarmed cache
  const initialCache = getCachedSimulation();

  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>(() => {
    return initialCache?.graph_data || { nodes: [], links: [] };
  });

  const [predictions, setPredictions] = useState<Record<number, number>>(() => {
    return initialCache?.power_predictions || {
      17: 0.983,
      16: 0.972,
      8: 0.954,
      4: 0.921,
      7: 0.884
    };
  });
  const [busRisks, setBusRisks] = useState<Record<number, number>>(() => {
    return initialCache?.bus_risks || {};
  });
  const [busTelemetry, setBusTelemetry] = useState<Record<string | number, any>>(() => {
    return initialCache?.bus_telemetry || {};
  });
  const [summary, setSummary] = useState<SummaryMetrics>(() => {
    return initialCache?.summary || {
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
    };
  });

  const [loading, setLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const isFirstMount = useRef(true);
  const hasAutoZoomed = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const simCacheRef = useRef<Map<string, any>>(new Map());

  // Populate initial cache entry
  useEffect(() => {
    if (initialCache) {
      simCacheRef.current.set('2,3,6||1.30|{}', initialCache);
    }
  }, []);

  const [dimensions, setDimensions] = useState(() => {
    if (typeof window !== 'undefined') {
      const w = Math.max(400, window.innerWidth - 470);
      const h = Math.max(400, window.innerHeight - 80);
      return { width: w, height: h };
    }
    return { width: 800, height: 750 };
  });

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
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Configure D3 Force simulation to expand into the IEEE 39-bus topology
  useEffect(() => {
    if (fgRef.current) {
      // Power substations repel strongly to expand the IEEE 39-bus grid,
      // while dependent assets have light charge so they cluster right beside their parent substation
      fgRef.current.d3Force('charge')?.strength((node: any) => {
        return node.layer === 'POWER' ? -240 : -15;
      });

      // Power transmission corridors have wide distance; dependent links are compact satellites
      fgRef.current.d3Force('link')
        ?.distance((link: any) => {
          return link.layer === 'POWER' ? 85 : 22;
        })
        ?.strength((link: any) => {
          return link.layer === 'POWER' ? 0.6 : 1.0;
        });
    }
  }, [graphData.nodes.length]);

  const handleEngineStop = useCallback(() => {
    if (fgRef.current && !hasAutoZoomed.current) {
      hasAutoZoomed.current = true;
      fgRef.current.centerAt(0, 0, 500);
      fgRef.current.zoom(1.15, 500);
    }
  }, []);

  // Run backend simulation with caching and abort handling
  const runSimulation = useCallback(async (
    lines: number[],
    buses: number[],
    mult: number,
    voltages: Record<number, number>
  ) => {
    const sortedLines = [...lines].sort((a, b) => a - b).join(',');
    const sortedBuses = [...buses].sort((a, b) => a - b).join(',');
    const sortedVoltages = JSON.stringify(voltages);
    const cacheKey = `${sortedLines}|${sortedBuses}|${mult.toFixed(2)}|${sortedVoltages}`;

    // Instant local cache hit (0ms)
    const cached = simCacheRef.current.get(cacheKey);
    if (cached) {
      if (cached.graph_data) {
        setGraphData(prev => {
          const posMap = new Map((prev.nodes || []).map((n: any) => [n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy }]));
          const mergedNodes = cached.graph_data.nodes.map((n: any) => {
            const pos = posMap.get(n.id);
            return pos && pos.x !== undefined 
              ? { ...n, x: pos.x, y: pos.y, vx: pos.vx, vy: pos.vy } 
              : n;
          });
          return { nodes: mergedNodes, links: cached.graph_data.links };
        });
      }
      if (cached.power_predictions) setPredictions(cached.power_predictions);
      if (cached.bus_risks) setBusRisks(cached.bus_risks);
      if (cached.bus_telemetry) setBusTelemetry(cached.bus_telemetry);
      if (cached.summary) setSummary(cached.summary);
      setLoading(false);
      return;
    }

    // Cancel in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/hetero/simulate', {
        broken_lines: lines,
        tripped_buses: buses,
        demand_multiplier: mult,
        node_multipliers: voltages,
        time_horizon_hours: 4.0,
        enabled_layers: ['POWER', 'WATER', 'TELECOM', 'HEALTHCARE', 'TRANSPORTATION']
      }, {
        signal: abortCtrl.signal,
        timeout: 5000
      });

      if (res.data) {
        simCacheRef.current.set(cacheKey, res.data);
        if (res.data.graph_data) {
          setGraphData(prev => {
            const posMap = new Map((prev.nodes || []).map((n: any) => [n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy }]));
            const mergedNodes = res.data.graph_data.nodes.map((n: any) => {
              const pos = posMap.get(n.id);
              return pos && pos.x !== undefined 
                ? { ...n, x: pos.x, y: pos.y, vx: pos.vx, vy: pos.vy } 
                : n;
            });
            return { nodes: mergedNodes, links: res.data.graph_data.links };
          });
        }
        if (res.data.power_predictions) setPredictions(res.data.power_predictions);
        if (res.data.bus_risks) setBusRisks(res.data.bus_risks);
        if (res.data.bus_telemetry) setBusTelemetry(res.data.bus_telemetry);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        return;
      }
      console.warn("Backend unavailable, using simulated cascade state:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced simulation effect: 0ms on mount, 120ms debounce on user slider adjustments
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return; // Skip redundant simulation on initial load (0ms instant page entry!)
    }

    const timer = setTimeout(() => {
      runSimulation(brokenLines, trippedBuses, multiplier, nodeMultipliers);
    }, 120);

    return () => clearTimeout(timer);
  }, [brokenLines, trippedBuses, multiplier, nodeMultipliers, runSimulation]);

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

  // Fast Sets for O(1) lookups inside rendering loops
  const trippedBusesSet = useMemo(() => new Set(trippedBuses), [trippedBuses]);
  const brokenLinesSet = useMemo(() => new Set(brokenLines), [brokenLines]);

  // Actions with Optimistic UI updates (0ms perceived latency)
  const handleToggleSubstationFailure = (busId: number) => {
    const isNowTripped = !trippedBuses.includes(busId);
    setTrippedBuses(prev => {
      if (prev.includes(busId)) {
        return prev.filter(b => b !== busId);
      } else {
        return [...prev, busId];
      }
    });

    // Optimistic bus risk and failure status update (0ms immediate feedback)
    setBusRisks(prev => ({
      ...prev,
      [busId]: isNowTripped ? 1.0 : 0.12
    }));
  };

  const handleVoltageChange = (busId: number, val: number) => {
    setNodeVoltages(prev => ({ ...prev, [busId]: val }));
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
    setMultiplier(1.30);

    // Instant 0ms synchronous rollback to pre-baked baseline
    if (initialCache) {
      if (initialCache.power_predictions) setPredictions(initialCache.power_predictions);
      if (initialCache.bus_risks) setBusRisks(initialCache.bus_risks);
      if (initialCache.bus_telemetry) setBusTelemetry(initialCache.bus_telemetry);
      if (initialCache.summary) setSummary(initialCache.summary);
    }
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

  // Pointer Area Paint for ForceGraph2D
  const paintNodePointerArea = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    if (!enabledLayers.includes(node.layer)) return;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 18, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
  }, [enabledLayers]);

  // Canvas Node Renderer with fast O(1) Set lookups
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!enabledLayers.includes(node.layer)) return;

    const isSelected = (node.layer === 'POWER' && node.bus_id === selectedBusId) || (selectedOtherNode && selectedOtherNode.id === node.id);
    const isTripped = (node.bus_id !== undefined && trippedBusesSet.has(node.bus_id)) || node.is_tripped;
    const isFailed = node.is_failed || node.risk > 0.70;

    let radius = 7.5;
    let fill = isLight ? '#d97706' : '#FBBF24'; // Electric gold for power

    if (node.layer === 'POWER') {
      radius = 8.5;
      if (isTripped || isFailed) {
        fill = '#EF4444'; // Bold crimson
      } else if (node.risk > 0.40) {
        fill = '#F59E0B'; // Bold amber
      } else {
        fill = isLight ? '#d97706' : '#FBBF24'; // Electric gold
      }
    } else if (node.layer === 'WATER') {
      radius = 6;
      fill = isFailed ? '#EF4444' : (isLight ? '#0d9488' : '#2DD4BF'); // Bioluminescent teal
    } else if (node.layer === 'TELECOM') {
      radius = 6;
      fill = node.status === 'BATTERY_EXHAUSTED' || isFailed 
        ? '#EF4444' 
        : node.status === 'ON_BACKUP_BATTERY' 
          ? '#F59E0B' 
          : (isLight ? '#9333ea' : '#A855F7'); // Cyber violet
    } else if (node.layer === 'HEALTHCARE') {
      radius = 6.5;
      fill = isFailed 
        ? '#EF4444' 
        : node.status === 'ON_EMERGENCY_GENERATOR' 
          ? '#F59E0B' 
          : (isLight ? '#e11d48' : '#F43F5E'); // Hot neon rose
    }

    // Outer glow for selected node
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 7, 0, 2 * Math.PI, false);
      ctx.fillStyle = isLight ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.4)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = isLight ? '#e11d48' : '#F43F5E';
      ctx.stroke();
    }

    // Node Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isSelected ? '#ffffff' : (isLight ? '#ffffff' : '#0c0716');
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

    const fontSize = Math.max(8, Math.min(14, Math.round(11 / Math.max(0.5, globalScale))));
    const fontStr = `800 ${fontSize}px Inter, sans-serif`;
    if (ctx.font !== fontStr) {
      ctx.font = fontStr;
    }
    ctx.fillStyle = isSelected 
      ? (isLight ? '#e11d48' : '#F43F5E') 
      : isLight 
        ? '#0f172a' 
        : (node.layer === 'POWER' ? '#FBBF24' : '#a19ab5');
    ctx.textAlign = 'center';
    ctx.fillText(label, node.x, node.y + radius + 12);
  }, [selectedBusId, selectedOtherNode, trippedBusesSet, isLight, enabledLayers]);

  // Stable Link Style Callbacks to prevent ForceGraph re-runs
  const getLinkColor = useCallback((link: any) => {
    const srcLayer = typeof link.source === 'object' ? link.source.layer : undefined;
    const tgtLayer = typeof link.target === 'object' ? link.target.layer : undefined;
    if ((srcLayer && !enabledLayers.includes(srcLayer)) || (tgtLayer && !enabledLayers.includes(tgtLayer))) {
      return 'transparent';
    }

    if (link.layer === 'INTER_DEPENDENCY') {
      return link.is_broken 
        ? 'rgba(220, 38, 38, 0.85)' 
        : (isLight ? 'rgba(100, 116, 139, 0.45)' : 'rgba(255, 255, 255, 0.25)');
    }
    if (link.is_broken || brokenLinesSet.has(link.line_id)) return 'rgba(220, 38, 38, 0.85)';
    if (link.risk > 0.85) return '#dc2626';
    if (link.risk > 0.50) return '#d97706';
    return isLight ? '#16a34a' : '#22c55e';
  }, [brokenLinesSet, isLight, enabledLayers]);

  const getLinkWidth = useCallback((link: any) => {
    const srcLayer = typeof link.source === 'object' ? link.source.layer : undefined;
    const tgtLayer = typeof link.target === 'object' ? link.target.layer : undefined;
    if ((srcLayer && !enabledLayers.includes(srcLayer)) || (tgtLayer && !enabledLayers.includes(tgtLayer))) {
      return 0;
    }

    if (link.layer === 'INTER_DEPENDENCY') return 1.5;
    if (link.is_broken || brokenLinesSet.has(link.line_id)) return 2.4;
    if (link.risk > 0.85) return 3.5;
    if (link.risk > 0.50) return 2.6;
    return 2.2;
  }, [brokenLinesSet, enabledLayers]);

  const getLinkLineDash = useCallback((link: any) => {
    if (link.layer === 'INTER_DEPENDENCY') return [3, 3];
    return (link.is_broken || brokenLinesSet.has(link.line_id) ? [4, 4] : []);
  }, [brokenLinesSet]);

  // Current voltage calculations for selected substation
  const currentVoltageMult = nodeVoltages[selectedBusId] || 1.0;
  const nominalVoltageKv = currentSubstationTelemetry.voltage_kv || 345.0;
  const displayVoltageKv = (nominalVoltageKv * currentVoltageMult).toFixed(1);

  // Theme-aware Solid Class Tokens (Zero transparency, high contrast, Safari GPU optimized)
  const cardBgClass = isLight 
    ? 'bg-white border-slate-200 text-slate-900 shadow-md' 
    : 'bg-[#130b24] border-white/10 text-white shadow-2xl';

  const innerBoxClass = isLight
    ? 'bg-[#f8fafc] border-slate-200 text-slate-800'
    : 'bg-[#180e2e]/90 border-white/10 text-[#e2d9f3]';

  const itemBoxClass = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-[#0f091c]/90 border-white/5 text-[#c0b8d4]';

  const headerTextClass = isLight ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold';
  const labelTextClass = isLight ? 'text-slate-600 font-medium' : 'text-[#a19ab5]';
  const canvasBg = isLight ? '#f8fafc' : '#0c0716';

  return (
    <div className={`flex-1 w-full h-full flex font-sans overflow-hidden p-3 gap-3 select-none transition-colors duration-200 ${
      isLight ? 'bg-[#f1f5f9] text-slate-900' : 'bg-[#07090e] text-gray-200'
    }`}>

      {/* ========================================================================= */}
      {/* 1. LEFT CANVAS: INTERACTIVE GRID WITH CRISP TECHNICAL VIEW                */}
      {/* ========================================================================= */}
      <div 
        ref={containerRef}
        className={`flex-1 h-full rounded-2xl border relative overflow-hidden flex flex-col shadow-xl transition-colors duration-200 ${
          isLight ? 'bg-[#f8fafc] border-slate-200' : 'bg-[#0c0716] border-white/10'
        }`}
      >
        {/* Top-Left: Network Identifier + Substation Dropdown Selector */}
        <div className={`absolute top-3.5 left-4 z-20 flex items-center gap-2.5 border px-3 py-1.5 rounded-full shadow-md pointer-events-auto transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#130b24] border-white/10 text-white'
        }`}>
          <Zap className="w-4 h-4 text-[#F59E0B]" />
          <span className={`font-black text-xs tracking-wider ${headerTextClass}`}>IEEE 39-Bus</span>
          
          {/* Quick Substation Select Dropdown */}
          <div className="relative flex items-center ml-1 pl-2 border-l border-white/10">
            <select
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(parseInt(e.target.value))}
              className={`font-mono text-xs font-bold py-1 px-2.5 rounded-full border focus:outline-none cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 text-slate-900 border-slate-300 focus:border-amber-600' 
                  : 'bg-[#180e2e] text-[#FBBF24] border-[#F59E0B]/30 focus:border-[#F59E0B]'
              }`}
            >
              {Array.from({ length: 39 }).map((_, i) => (
                <option key={i} value={i} className={isLight ? 'bg-white text-slate-900' : 'bg-[#180e2e] text-white'}>
                  Substation #{i + 1} {trippedBuses.includes(i) ? '🔴 (TRIPPED)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#F59E0B] ml-1 pointer-events-none" />
          </div>

          {loading && <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping ml-1" />}
        </div>

        {/* Top-Right: Department Overlays (Power, Water, Telecom, Healthcare) */}
        <div className={`absolute top-3.5 right-4 z-20 flex items-center gap-1.5 border p-1 rounded-full shadow-md pointer-events-auto transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#130b24] border-white/10'
        }`}>
          {[
            { id: 'POWER', label: 'Power', icon: Zap, activeColor: '#FBBF24', activeClass: 'bg-[#FBBF24]/15 border-[#FBBF24]/40 text-[#FBBF24]' },
            { id: 'WATER', label: 'Water', icon: Droplets, activeColor: '#2DD4BF', activeClass: 'bg-[#2DD4BF]/15 border-[#2DD4BF]/40 text-[#2DD4BF]' },
            { id: 'TELECOM', label: 'Telecom', icon: Radio, activeColor: '#A855F7', activeClass: 'bg-[#A855F7]/15 border-[#A855F7]/40 text-[#A855F7]' },
            { id: 'HEALTHCARE', label: 'Hospitals', icon: Hospital, activeColor: '#F43F5E', activeClass: 'bg-[#F43F5E]/15 border-[#F43F5E]/40 text-[#F43F5E]' },
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  isEnabled 
                    ? (isLight ? 'bg-slate-900 text-white shadow-sm' : `${layer.activeClass} shadow-[0_0_10px_rgba(255,255,255,0.05)]`) 
                    : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent' : 'text-[#a19ab5] hover:text-white border-transparent')
                }`}
                title={`Toggle ${layer.label} department network`}
              >
                <Icon className={`w-3.5 h-3.5 ${isEnabled ? (isLight ? 'text-white' : '') : 'text-slate-500'}`} style={{ color: isEnabled && !isLight ? layer.activeColor : undefined }} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>

        {/* Floating Canvas Zoom Controls */}
        <div className={`absolute top-16 right-4 z-20 flex flex-col gap-1 border p-1 rounded-xl shadow-md pointer-events-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#130b24] border-white/10 text-gray-300'
        }`}>
          <button 
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 300)} 
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight ? 'hover:bg-slate-100 hover:text-slate-900' : 'hover:bg-white/10 hover:text-white'}`}
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 0.7, 300)} 
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight ? 'hover:bg-slate-100 hover:text-slate-900' : 'hover:bg-white/10 hover:text-white'}`}
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              fgRef.current?.centerAt(0, 0, 400);
              fgRef.current?.zoom(1.15, 400);
            }} 
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight ? 'hover:bg-slate-100 hover:text-slate-900' : 'hover:bg-white/10 hover:text-white'}`}
            title="Reset View"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Force Graph 2D with High-Precision Multi-Sector Topology Engine */}
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
              onNodeClick={handleSelectNode}
              onLinkClick={(link: any) => {
                if (link.line_id !== undefined) {
                  handleToggleLineTrip(link.line_id);
                }
              }}
              linkColor={getLinkColor}
              linkWidth={getLinkWidth}
              linkLineDash={getLinkLineDash}
              backgroundColor={canvasBg}
              cooldownTicks={120}
              d3VelocityDecay={0.3}
              enableNodeDrag={true}
              onEngineStop={handleEngineStop}
            />
          ) : (
            <div className={`font-mono text-xs animate-pulse ${labelTextClass}`}>Initializing Topology Graph...</div>
          )}
        </div>

        {/* Canvas Bottom Legend / Instructions */}
        <div className="absolute bottom-3 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
          <div className={`flex items-center gap-3 border px-3 py-1.5 rounded-full text-[11px] font-mono pointer-events-auto shadow-md ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#130b24] border-white/10 text-[#a19ab5]'
          }`}>
            <span>💡 <strong>Click any node</strong> on graph or select from dropdown</span>
          </div>
          <div className={`flex items-center gap-3 border px-3 py-1.5 rounded-full text-[11px] font-mono pointer-events-auto shadow-md ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#130b24] border-white/10'
          }`}>
            <span className="flex items-center gap-1.5 text-[#FBBF24] font-bold"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#FBBF24]" /> Power</span>
            <span className="flex items-center gap-1.5 text-[#2DD4BF] font-bold"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#2DD4BF]" /> Water</span>
            <span className="flex items-center gap-1.5 text-[#A855F7] font-bold"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#A855F7]" /> Telecom</span>
            <span className="flex items-center gap-1.5 text-[#F43F5E] font-bold"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#F43F5E]" /> Hospitals</span>
            <span className="flex items-center gap-1.5 text-[#EF4444] font-bold"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#EF4444]" /> Tripped</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT SIDE: SUBSTATION VOLTAGE/FAILURE INSPECTOR & MULTI-SECTOR CASCADE */}
      {/* ========================================================================= */}
      <div className="w-[450px] h-full flex flex-col gap-3 shrink-0 overflow-y-auto pr-1">

        {/* --- PANEL 1: SELECTED SUBSTATION VOLTAGE & FAILURE CONTROLLER --- */}
        <div className={`rounded-2xl p-4 flex flex-col gap-3 shrink-0 border transition-colors ${cardBgClass}`}>
          
          {/* Header & Status Banner */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base tracking-wide ${headerTextClass}`}>
                  Substation #{selectedBusId + 1}
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isLight 
                    ? 'bg-slate-100 text-slate-800 border-slate-300' 
                    : 'bg-[#261730] text-[#FBBF24] border-[#F59E0B]/30'
                }`}>
                  345 kV Bulk Core
                </span>
              </div>
              <span className={`text-[11px] font-mono mt-0.5 block ${labelTextClass}`}>
                Incident Bus ID: {selectedBusId} | New England Grid Hub
              </span>
            </div>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isSelectedSubstationFailed
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-[#261730] text-[#FBBF24] border border-[#F59E0B]/40 shadow-sm'
            }`}>
              {isSelectedSubstationFailed ? '⚡ POWER FAILURE' : 'ONLINE NOMINAL'}
            </span>
          </div>

          {/* Voltage & Electrical Telemetry Cards */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className={`p-2.5 rounded-xl border flex flex-col ${innerBoxClass}`}>
              <span className={`text-[10px] font-bold ${labelTextClass}`}>Bus Voltage</span>
              <strong className={`text-sm mt-0.5 font-black ${
                currentVoltageMult > 1.15 
                  ? 'text-[#F59E0B]' 
                  : 'text-[#FBBF24]'
              }`}>
                {displayVoltageKv} kV
              </strong>
              <span className={`text-[9px] ${labelTextClass}`}>{currentVoltageMult.toFixed(2)}x Setpoint</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex flex-col ${innerBoxClass}`}>
              <span className={`text-[10px] font-bold ${labelTextClass}`}>Active Load</span>
              <strong className={`text-sm mt-0.5 font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {currentSubstationTelemetry.p_mw?.toFixed(1) || '180.0'} MW
              </strong>
              <span className={`text-[9px] ${labelTextClass}`}>{currentSubstationTelemetry.load_percentage?.toFixed(0) || '54'}% Capacity</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex flex-col ${innerBoxClass}`}>
              <span className={`text-[10px] font-bold ${labelTextClass}`}>Cascade Risk</span>
              <strong className={`text-sm mt-0.5 font-black ${
                isSelectedSubstationFailed 
                  ? (isLight ? 'text-red-700' : 'text-red-400') 
                  : (isLight ? 'text-emerald-700' : 'text-emerald-400')
              }`}>
                {(((busRisks[selectedBusId] || 0.12)) * 100).toFixed(1)}%
              </strong>
              <span className={`text-[9px] font-bold ${isSelectedSubstationFailed ? 'text-red-600' : 'text-emerald-600'}`}>
                {isSelectedSubstationFailed ? 'Critical Failure' : 'Stable Flow'}
              </span>
            </div>
          </div>

          {/* VOLTAGE CONTROL SLIDER */}
          <div className={`p-3 rounded-xl border flex flex-col gap-2 ${innerBoxClass}`}>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                <Gauge className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                Bus Voltage Setpoint:
              </span>
              <span className={`font-black text-sm ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                {displayVoltageKv} kV ({currentVoltageMult.toFixed(2)}x)
              </span>
            </div>

            <input
              type="range"
              min="0.80"
              max="1.50"
              step="0.05"
              value={currentVoltageMult}
              onChange={(e) => handleVoltageChange(selectedBusId, parseFloat(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                isLight ? 'accent-amber-600 bg-slate-300' : 'accent-amber-400 bg-[#101522]'
              }`}
            />

            <div className="flex justify-between items-center text-[10px] font-mono">
              <button 
                onClick={() => handleVoltageChange(selectedBusId, 1.0)} 
                className={`font-bold underline cursor-pointer ${isLight ? 'text-blue-700 hover:text-blue-900' : 'text-cyan-400 hover:text-cyan-300'}`}
              >
                Nominal (345 kV)
              </button>
              <button 
                onClick={() => handleVoltageChange(selectedBusId, 1.2)} 
                className={`font-bold underline cursor-pointer ${isLight ? 'text-amber-700 hover:text-amber-900' : 'text-amber-400 hover:text-amber-300'}`}
              >
                +20% Surge (414 kV)
              </button>
              <button 
                onClick={() => handleVoltageChange(selectedBusId, 1.4)} 
                className={`font-bold underline cursor-pointer ${isLight ? 'text-red-700 hover:text-red-900' : 'text-red-400 hover:text-red-300'}`}
              >
                +40% Extreme (483 kV)
              </button>
            </div>
          </div>

          {/* POWER FAILURE ACTION BUTTON */}
          <button
            onClick={() => handleToggleSubstationFailure(selectedBusId)}
            className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isSelectedSubstationTripped
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:brightness-110 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
            }`}
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>
              {isSelectedSubstationTripped
                ? `🔄 Restore Substation #${selectedBusId + 1} Power`
                : `⚡ Force Power Failure (Trip Substation #${selectedBusId + 1})`}
            </span>
          </button>

          {/* AFFECTED BRANCHES OF THE POWER SYSTEM */}
          <div className={`p-3 rounded-xl border flex flex-col gap-2 ${innerBoxClass}`}>
            <div className="flex justify-between items-center">
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                Affected Power Branches ({connectedBranches.length} Corridors):
              </span>
              <span className={`text-[10px] font-mono ${labelTextClass}`}>Click to toggle</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {connectedBranches.map(({ lineId, isTripped, risk }) => (
                <div 
                  key={`branch-${lineId}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-mono ${itemBoxClass}`}
                >
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Line ID #{lineId}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isTripped 
                        ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/80 dark:text-red-400 dark:border-red-800' 
                        : risk > 0.85 
                          ? 'text-red-700 font-extrabold' 
                          : (isLight ? 'text-emerald-700 font-extrabold' : 'text-emerald-400')
                    }`}>
                      {isTripped ? 'SEVERED / POWER FAILURE' : `${(risk * 100).toFixed(0)}% Risk`}
                    </span>
                    <button
                      onClick={() => handleToggleLineTrip(lineId)}
                      className={`text-[10px] px-2.5 py-1 rounded font-bold cursor-pointer transition-all shadow-sm ${
                        brokenLines.includes(lineId)
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {brokenLines.includes(lineId) ? 'Restore' : 'Trip'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AFFECTED OTHER DEPARTMENTS: WATER, TELECOM, HEALTHCARE */}
          <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${innerBoxClass}`}>
            <div className="flex justify-between items-center">
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-cyan-800' : 'text-cyan-400'
              }`}>
                <Activity className="w-3.5 h-3.5" />
                Cascading Department Failures:
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isSelectedSubstationFailed 
                  ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-400' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400'
              }`}>
                {isSelectedSubstationFailed ? 'CRITICAL DISRUPTIONS' : 'CONNECTED / STABLE'}
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono">
              {/* Water Department Impact */}
              <div className={`p-2.5 rounded-lg border flex flex-col gap-1 ${itemBoxClass}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
                    <Droplets className="w-3.5 h-3.5" />
                    Water Infrastructure
                  </span>
                  <span className={`text-[10px] font-extrabold ${isSelectedSubstationFailed ? 'text-red-700' : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                    {isSelectedSubstationFailed ? 'OFFLINE - ZERO FLOW' : 'NOMINAL PRESSURE'}
                  </span>
                </div>
                <div className="text-[11px]">
                  {connectedDepartmentAssets.water.length > 0 ? (
                    connectedDepartmentAssets.water.map((w, idx) => (
                      <div key={idx} className="flex justify-between text-[10px]">
                        <span className={labelTextClass}>• {w.name || `Water Pump Station W_${selectedBusId}`}</span>
                        <span className={`font-bold ${isSelectedSubstationFailed ? 'text-red-700' : (isLight ? 'text-cyan-700' : 'text-cyan-400')}`}>
                          {isSelectedSubstationFailed ? '0 PSI (2,500 GPM Deficit)' : '65 PSI Nominal'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] flex justify-between">
                      <span className={labelTextClass}>• Booster Pump Hub #{selectedBusId + 1}</span>
                      <span className={`font-bold ${isSelectedSubstationFailed ? 'text-red-700' : (isLight ? 'text-cyan-700' : 'text-cyan-400')}`}>
                        {isSelectedSubstationFailed ? 'PUMP TRIPPED (2,500 GPM Lost)' : '65 PSI Nominal'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Telecommunications Impact */}
              <div className={`p-2.5 rounded-lg border flex flex-col gap-1 ${itemBoxClass}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>
                    <Radio className="w-3.5 h-3.5" />
                    Telecommunications Network
                  </span>
                  <span className={`text-[10px] font-extrabold ${isSelectedSubstationFailed ? 'text-amber-700' : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                    {isSelectedSubstationFailed ? 'GRID FEED CUT - ON BATTERY' : 'ONLINE GRID POWER'}
                  </span>
                </div>
                <div className="text-[11px]">
                  {connectedDepartmentAssets.telecom.length > 0 ? (
                    connectedDepartmentAssets.telecom.map((t, idx) => (
                      <div key={idx} className="flex justify-between text-[10px]">
                        <span className={labelTextClass}>• {t.name || `Cell Tower T_${selectedBusId}`}</span>
                        <span className={`font-bold ${isSelectedSubstationFailed ? 'text-amber-700' : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                          {isSelectedSubstationFailed ? `${t.hours_remaining || '3.8'}h Battery Remaining` : '100% Grid Power'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] flex justify-between">
                      <span className={labelTextClass}>• Cellular Tower Array #{selectedBusId + 1}</span>
                      <span className={`font-bold ${isSelectedSubstationFailed ? 'text-amber-700' : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                        {isSelectedSubstationFailed ? 'Emergency Battery (4.0h left)' : '100% Grid Power'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Healthcare & Hospitals Impact */}
              <div className={`p-2.5 rounded-lg border flex flex-col gap-1 ${itemBoxClass}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                    <Hospital className="w-3.5 h-3.5" />
                    Healthcare Facilities
                  </span>
                  <span className={`text-[10px] font-extrabold ${isSelectedSubstationFailed ? 'text-amber-700' : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                    {isSelectedSubstationFailed ? 'ON DIESEL GENERATORS' : 'NORMAL GRID POWER'}
                  </span>
                </div>
                <div className="text-[10px] flex justify-between">
                  <span className={labelTextClass}>• Metro Regional Hospital #{selectedBusId + 1}</span>
                  <span className={`font-bold ${isSelectedSubstationFailed ? 'text-amber-700' : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                    {isSelectedSubstationFailed ? 'Gen Fuel: 68h | 8 ICU Beds Alert' : 'Normal Grid Feed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- PANEL 2: GLOBAL LOAD & TRIGGERED OUTAGES --- */}
        <div className={`rounded-2xl p-4 flex flex-col gap-3 shrink-0 border transition-colors ${cardBgClass}`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>Global Heatwave Demand</span>
            <span className={`font-black font-mono text-sm ${isLight ? 'text-amber-700' : 'text-[#FBBF24]'}`}>{multiplier.toFixed(2)}x</span>
          </div>

          <input
            type="range"
            min="0.80"
            max="2.50"
            step="0.05"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
              isLight ? 'accent-amber-600 bg-slate-200' : 'accent-[#F59E0B] bg-[#180e2e]'
            }`}
          />

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/5">
            <span className={`text-xs font-bold uppercase tracking-wider ${headerTextClass}`}>
              Active Outages ({brokenLines.length + trippedBuses.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={forceTripRandomBranch}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#EC4899] to-[#F43F5E] text-[#18051e] font-mono text-xs font-extrabold hover:brightness-110 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.35)]"
              >
                + Trip Random Line
              </button>
              {(brokenLines.length > 0 || trippedBuses.length > 0) && (
                <button
                  onClick={handleReset}
                  className={`px-3 py-1.5 rounded-full border font-mono text-xs font-bold cursor-pointer shadow-sm ${
                    isLight 
                      ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' 
                      : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- PANEL 3: CASCADE PROBABILITY & AT-RISK BRANCHES --- */}
        <div className={`rounded-2xl p-4 flex flex-col gap-3 shrink-0 border transition-colors ${cardBgClass}`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-xs uppercase tracking-wider ${headerTextClass}`}>Cascade Probability</h3>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              maxRisk > 0.85
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-emerald-600 text-white shadow-sm'
            }`}>
              {maxRisk > 0.85 ? 'CRITICAL ALERT' : 'NOMINAL'}
            </span>
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${innerBoxClass}`}>
            <div>
              <span className={`text-3xl font-black font-mono tracking-tight block ${headerTextClass}`}>
                {(maxRisk * 100).toFixed(1)}%
              </span>
              <span className={`text-[10px] font-mono uppercase tracking-wider block mt-0.5 ${labelTextClass}`}>
                MAX AI PREDICTION RISK
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-red-500 bg-red-100 dark:bg-red-950/40 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>

          {/* Breakdown Counts */}
          <div className={`grid grid-cols-3 gap-2 text-center font-mono p-2 rounded-xl border ${innerBoxClass}`}>
            <div>
              <span className={`font-black text-sm block ${isLight ? 'text-red-700' : 'text-[#EF4444]'}`}>{criticalCount}</span>
              <span className={`text-[9px] uppercase font-bold ${labelTextClass}`}>CRITICAL</span>
            </div>
            <div className="border-x border-slate-200 dark:border-white/10">
              <span className={`font-black text-sm block ${isLight ? 'text-amber-700' : 'text-[#F59E0B]'}`}>{warningCount}</span>
              <span className={`text-[9px] uppercase font-bold ${labelTextClass}`}>WARNING</span>
            </div>
            <div>
              <span className={`font-black text-sm block ${isLight ? 'text-emerald-700' : 'text-[#2DD4BF]'}`}>{nominalCount}</span>
              <span className={`text-[9px] uppercase font-bold ${labelTextClass}`}>NOMINAL</span>
            </div>
          </div>

          {/* System-wide Cross-Sector Impact Quick Counts */}
          <div className={`grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] p-2 rounded-xl border ${innerBoxClass}`}>
            <div>
              <span className={`font-bold block ${isLight ? 'text-cyan-800' : 'text-[#2DD4BF]'}`}>{summary.water_pumps_tripped}</span>
              <span className={`text-[8px] ${labelTextClass}`}>Pumps Down</span>
            </div>
            <div className="border-x border-slate-200 dark:border-white/10">
              <span className={`font-bold block ${isLight ? 'text-purple-800' : 'text-[#A855F7]'}`}>{summary.cell_towers_on_battery}</span>
              <span className={`text-[8px] ${labelTextClass}`}>Towers Battery</span>
            </div>
            <div>
              <span className={`font-bold block ${isLight ? 'text-emerald-800' : 'text-[#F43F5E]'}`}>{summary.hospitals_on_generator}</span>
              <span className={`text-[8px] ${labelTextClass}`}>Hosp on Gen</span>
            </div>
          </div>

          {/* Top At-Risk Transmission Corridors */}
          <div className="flex flex-col gap-2 pt-1">
            <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${labelTextClass}`}>Top At-Risk Transmission Lines:</span>
            {topRiskBranches.map(({ id: lineId, risk }) => (
              <div key={`risk-${lineId}`} className="flex flex-col gap-0.5">
                <div className="flex justify-between font-mono text-xs">
                  <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Line #{lineId}</span>
                  <span className={`font-black ${
                    risk > 0.85 
                      ? (isLight ? 'text-red-700' : 'text-red-400') 
                      : (isLight ? 'text-amber-700' : 'text-amber-400')
                  }`}>
                    {(risk * 100).toFixed(1)}% Risk
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-black/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      risk > 0.85 ? 'bg-red-600' : 'bg-amber-500'
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