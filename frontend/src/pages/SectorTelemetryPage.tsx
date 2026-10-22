import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Droplets, Radio, Hospital, Zap, Activity, Clock, RefreshCw
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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

export default function SectorTelemetryPage() {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'power' | 'water' | 'telecom' | 'healthcare'>('all');
  const [timeHorizon, setTimeHorizon] = useState<number>(4.0);
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

  const [waterNodes, setWaterNodes] = useState<any[]>([]);
  const [telecomTowers, setTelecomTowers] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/hetero/simulate', {
        broken_lines: [12, 15],
        demand_multiplier: 1.35,
        time_horizon_hours: timeHorizon,
        enabled_layers: ['POWER', 'WATER', 'TELECOM', 'HEALTHCARE']
      });

      if (res.data.summary) {
        setSummary(res.data.summary);
      }
      
      const nodes = res.data.graph_data?.nodes || [];
      setWaterNodes(nodes.filter((n: any) => n.layer === 'WATER'));
      setTelecomTowers(nodes.filter((n: any) => n.layer === 'TELECOM'));
      setHospitals(nodes.filter((n: any) => n.layer === 'HEALTHCARE'));
    } catch (err) {
      console.error("Failed to load telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [timeHorizon]);

  // Theme-aware styles
  const pageBgClass = isLight ? 'bg-[#f1f5f9] text-slate-900' : 'bg-[#07090e] text-gray-200';
  const cardBgClass = isLight ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-[#0b0e17] border-white/10 text-gray-200 shadow-xl';
  const borderClass = isLight ? 'border-slate-200' : 'border-white/10';
  const tableHeaderClass = isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#0e131f] text-gray-400';
  const tableRowClass = isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-white/5 text-gray-300';

  return (
    <div className={`flex-1 w-full p-8 overflow-y-auto font-sans transition-colors duration-200 ${pageBgClass}`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${borderClass}`}>
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h1 className={`text-2xl font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Multi-Sector Telemetry Operations
              </h1>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Real-time component degradation, operational thresholds, and cascading failure monitoring across the 4 infrastructure sectors.
            </p>
          </div>

          {/* Time Horizon Filter */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0c101a] border-white/10 text-gray-200'
          }`}>
            <Clock className="w-4 h-4 text-amber-500" />
            <span className={`text-xs uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Horizon:</span>
            <div className="flex gap-1.5 font-mono text-xs">
              {[0, 4, 12, 24, 72].map(h => (
                <button
                  key={h}
                  onClick={() => setTimeHorizon(h)}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    timeHorizon === h 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : (isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#141b2a] text-gray-400 hover:text-white')
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
            <button 
              onClick={fetchTelemetry} 
              disabled={loading}
              className={`p-1 transition-colors ml-1 cursor-pointer ${isLight ? 'text-slate-600 hover:text-cyan-700' : 'text-gray-400 hover:text-cyan-400'}`}
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sector Tabs */}
        <div className={`flex items-center gap-2 border-b pb-3 ${borderClass}`}>
          {[
            { id: 'all', label: 'All Sectors Overview', icon: Activity, count: '4 Active' },
            { id: 'power', label: 'Power Grid', icon: Zap, count: '39 Buses', color: isLight ? 'text-blue-700' : 'text-blue-400' },
            { id: 'water', label: 'Water Supply', icon: Droplets, count: '4 Pumps', color: isLight ? 'text-cyan-700' : 'text-cyan-400' },
            { id: 'telecom', label: 'Telecommunications', icon: Radio, count: '624 Towers', color: isLight ? 'text-purple-700' : 'text-purple-400' },
            { id: 'healthcare', label: 'Healthcare Facilities', icon: Hospital, count: '289 Hospitals', color: isLight ? 'text-emerald-700' : 'text-emerald-400' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? (isLight 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                        : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.15)]')
                    : (isLight 
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' 
                        : 'bg-[#0c101a] border-white/5 text-gray-400 hover:text-white')
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (isLight ? 'text-white' : tab.color) : tab.color}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono opacity-80 ml-1 font-normal">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* High-Level Sector Metric Cards Grid */}
        {(activeTab === 'all' || activeTab === 'power') && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Power Metric */}
            <div className={`rounded-xl p-4 flex flex-col justify-between border ${cardBgClass}`}>
              <div className="flex justify-between items-center text-xs">
                <span className={`uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Power Buses</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  isLight ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  L0 Backbone
                </span>
              </div>
              <div className="my-2">
                <span className={`text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {summary.power_buses_offline}
                </span>
                <span className={`text-xs font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> / 39 offline</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}>
                <div className="bg-blue-600 h-full" style={{ width: `${(summary.power_buses_offline / 39) * 100}%` }} />
              </div>
            </div>

            {/* Water Metric */}
            <div className={`rounded-xl p-4 flex flex-col justify-between border ${cardBgClass}`}>
              <div className="flex justify-between items-center text-xs">
                <span className={`uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Water Loss</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-200' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                }`}>
                  {summary.water_pumps_tripped} Pumps Cut
                </span>
              </div>
              <div className="my-2">
                <span className={`text-3xl font-black font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {(summary.estimated_water_loss_gpm / 1000).toFixed(1)}k
                </span>
                <span className={`text-xs font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> GPM deficit</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}>
                <div className="bg-cyan-600 h-full" style={{ width: `${Math.min(100, (summary.water_pumps_tripped / 4) * 100)}%` }} />
              </div>
            </div>

            {/* Telecom Metric */}
            <div className={`rounded-xl p-4 flex flex-col justify-between border ${cardBgClass}`}>
              <div className="flex justify-between items-center text-xs">
                <span className={`uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Telecom Depletion</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  isLight ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>
                  6h Battery Buffer
                </span>
              </div>
              <div className="my-2">
                <span className={`text-3xl font-black font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  {summary.cell_towers_on_battery}
                </span>
                <span className={`text-xs font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> on battery ({summary.cell_towers_offline} dead)</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}>
                <div className="bg-purple-600 h-full" style={{ width: `${(summary.cell_towers_on_battery / 624) * 100}%` }} />
              </div>
            </div>

            {/* Healthcare Metric */}
            <div className={`rounded-xl p-4 flex flex-col justify-between border ${cardBgClass}`}>
              <div className="flex justify-between items-center text-xs">
                <span className={`uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Hospital Fuel Status</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  72h Diesel Standard
                </span>
              </div>
              <div className="my-2">
                <span className={`text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {summary.hospitals_on_generator}
                </span>
                <span className={`text-xs font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> on generators ({summary.hospitals_critical} critical)</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}>
                <div className="bg-emerald-600 h-full" style={{ width: `${Math.max(0, 100 - (timeHorizon / 72) * 100)}%` }} />
              </div>
            </div>

          </div>
        )}

        {/* Detailed Tables by Sector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Water Infrastructure Table */}
          {(activeTab === 'all' || activeTab === 'water') && (
            <div className={`rounded-xl p-5 border flex flex-col gap-3 ${cardBgClass}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>EPANET Water Network Components</h3>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30'
                }`}>
                  {waterNodes.length} Nodes Loaded
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Booster pumps rely directly on 3-phase commercial grid power. Loss of substation voltage halts hydraulic pumping, leading to zero-pressure water outages.
              </p>

              <div className={`overflow-x-auto max-h-72 border rounded-lg ${borderClass}`}>
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`uppercase text-[10px] sticky top-0 font-bold ${tableHeaderClass}`}>
                    <tr>
                      <th className="py-2.5 px-3">Node ID</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Pressure (PSI)</th>
                      <th className="py-2.5 px-3">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderClass}`}>
                    {waterNodes.map((w, idx) => (
                      <tr key={idx} className={tableRowClass}>
                        <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">{w.id}</td>
                        <td className="py-2 px-3 font-medium">{w.is_pump ? '⚡ BOOSTER PUMP' : 'JUNCTION'}</td>
                        <td className="py-2 px-3">
                          <span className={w.pressure_psi < 20 ? 'text-red-600 font-bold' : ''}>
                            {w.pressure_psi} PSI
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.status === 'OFFLINE_NO_POWER' 
                              ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-400' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Telecommunications Table */}
          {(activeTab === 'all' || activeTab === 'telecom') && (
            <div className={`rounded-xl p-5 border flex flex-col gap-3 ${cardBgClass}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>HIFLD Cell Towers & SCADA Telemetry</h3>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'text-purple-400 bg-purple-950/40 border-purple-500/30'
                }`}>
                  {telecomTowers.length} Towers
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Cell towers have 4 to 8 hours of battery backup. Loss of commercial feed forces DC battery drain, severing smart-grid telemetry once depleted.
              </p>

              <div className={`overflow-x-auto max-h-72 border rounded-lg ${borderClass}`}>
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`uppercase text-[10px] sticky top-0 font-bold ${tableHeaderClass}`}>
                    <tr>
                      <th className="py-2.5 px-3">Tower Name</th>
                      <th className="py-2.5 px-3 text-center">Battery Left</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderClass}`}>
                    {telecomTowers.slice(0, 50).map((t, idx) => (
                      <tr key={idx} className={tableRowClass}>
                        <td className="py-2 px-3 font-sans truncate max-w-[180px] font-medium">{t.name}</td>
                        <td className="py-2 px-3 text-center font-bold text-purple-600 dark:text-purple-400">
                          {t.hours_remaining !== undefined ? `${t.hours_remaining}h` : '6.0h'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'BATTERY_EXHAUSTED'
                              ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-400'
                              : t.status === 'ON_BATTERY'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400'
                          }`}>
                            {t.status || 'OPERATIONAL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Healthcare Facilities Table */}
          {(activeTab === 'all' || activeTab === 'healthcare') && (
            <div className={`rounded-xl p-5 border flex flex-col gap-3 ${cardBgClass}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Critical Healthcare Facilities (HIFLD)</h3>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                }`}>
                  {hospitals.length} Hospitals
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Hospitals operate emergency diesel generators upon primary feed cutoff. If grid power is unrecovered within 72 hours, fuel is exhausted, endangering ICU life support.
              </p>

              <div className={`overflow-x-auto max-h-72 border rounded-lg ${borderClass}`}>
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`uppercase text-[10px] sticky top-0 font-bold ${tableHeaderClass}`}>
                    <tr>
                      <th className="py-2.5 px-3">Hospital Name</th>
                      <th className="py-2.5 px-3 text-center">ICU Beds</th>
                      <th className="py-2.5 px-3">Fuel Hours Left</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderClass}`}>
                    {hospitals.map((h, idx) => (
                      <tr key={idx} className={tableRowClass}>
                        <td className="py-2 px-3 font-sans truncate max-w-[180px] font-medium">{h.name}</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{h.icu_beds}</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-bold">{h.fuel_hours_remaining}h</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.status === 'CRITICAL_POWER_EXHAUSTION'
                              ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-400 animate-pulse'
                              : h.status === 'ON_EMERGENCY_GENERATOR'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
