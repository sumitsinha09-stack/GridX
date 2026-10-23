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

  // Cosmic theme styles
  const pageBgClass = isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0c0716] text-gray-200';
  const cardBgClass = isLight 
    ? 'bg-white/90 border-slate-200 text-slate-900 shadow-sm backdrop-blur-md rounded-2xl' 
    : 'bg-[#130b24]/75 border-white/10 text-gray-200 shadow-xl backdrop-blur-md rounded-2xl';
  const borderClass = isLight ? 'border-slate-200' : 'border-white/10';
  const tableHeaderClass = isLight ? 'bg-slate-100/90 text-slate-700' : 'bg-[#180e2e]/90 text-purple-200/70 border-b border-white/10';
  const tableRowClass = isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-white/5 text-gray-300';

  return (
    <div className={`flex-1 w-full p-8 overflow-y-auto font-sans transition-colors duration-200 ${pageBgClass}`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${borderClass}`}>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B] via-[#EC4899] to-[#F43F5E] p-0.5 shadow-md shadow-pink-500/20">
                <div className="w-full h-full bg-[#0c0716] rounded-[6px] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#F59E0B]" />
                </div>
              </div>
              <h1 className={`text-2xl font-black tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Multi-Sector Telemetry Operations
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold ml-2">
                4 SECTORS SYNCED
              </span>
            </div>
            <p className={`text-xs mt-1.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Real-time component degradation, operational thresholds, and cascading failure monitoring across municipal networks.
            </p>
          </div>

          {/* Time Horizon Filter */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border shadow-lg ${
            isLight ? 'bg-white/90 border-slate-200 text-slate-800' : 'bg-[#130b24]/80 border-white/10 text-gray-200 backdrop-blur-md'
          }`}>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <span className={`text-xs uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Horizon:</span>
            <div className="flex gap-1.5 font-mono text-xs">
              {[0, 4, 12, 24, 72].map(h => (
                <button
                  key={h}
                  onClick={() => setTimeHorizon(h)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    timeHorizon === h 
                      ? 'bg-gradient-to-r from-[#F59E0B] to-[#EC4899] text-white shadow-md shadow-amber-500/25' 
                      : (isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/10')
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
            <button 
              onClick={fetchTelemetry} 
              disabled={loading}
              className={`p-1.5 rounded-lg transition-colors ml-1 cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-amber-600 hover:bg-slate-100' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F59E0B]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sector Tabs with Custom Neon Accents */}
        <div className={`flex items-center gap-2.5 border-b pb-3 overflow-x-auto ${borderClass}`}>
          {[
            { id: 'all', label: 'All Sectors Overview', icon: Activity, count: '4 Active', activeColor: 'bg-white/15 text-white border-white/30' },
            { id: 'power', label: 'Power Grid', icon: Zap, count: '39 Buses', activeColor: 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/50 shadow-[0_0_12px_rgba(251,191,36,0.2)]', iconColor: 'text-[#FBBF24]' },
            { id: 'water', label: 'Water Supply', icon: Droplets, count: '4 Pumps', activeColor: 'bg-[#2DD4BF]/20 text-[#2DD4BF] border-[#2DD4BF]/50 shadow-[0_0_12px_rgba(45,212,191,0.2)]', iconColor: 'text-[#2DD4BF]' },
            { id: 'telecom', label: 'Telecommunications', icon: Radio, count: '624 Towers', activeColor: 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]', iconColor: 'text-[#A855F7]' },
            { id: 'healthcare', label: 'Healthcare Facilities', icon: Hospital, count: '289 Hospitals', activeColor: 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/50 shadow-[0_0_12px_rgba(244,63,94,0.2)]', iconColor: 'text-[#F43F5E]' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                  isActive
                    ? (isLight ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : tab.activeColor)
                    : (isLight 
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' 
                        : 'bg-[#130b24]/50 border-white/5 text-gray-400 hover:text-white hover:border-white/15')
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.iconColor || 'text-white'}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono opacity-70 ml-1 font-normal">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* High-Level Sector Metric Cards Grid */}
        {(activeTab === 'all' || activeTab === 'power') && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Power Metric (Gold) */}
            <div className={`p-5 flex flex-col justify-between border relative overflow-hidden group ${cardBgClass}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#FBBF24]/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center text-xs">
                <span className={`uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Power Buses</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30">
                  L0 Backbone
                </span>
              </div>
              <div className="my-3">
                <span className="text-3xl font-black font-mono text-[#FBBF24]">
                  {summary.power_buses_offline}
                </span>
                <span className={`text-xs font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> / 39 offline</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                <div className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] h-full rounded-full transition-all duration-500" style={{ width: `${(summary.power_buses_offline / 39) * 100}%` }} />
              </div>
            </div>

            {/* Water Metric (Teal) */}
            <div className={`p-5 flex flex-col justify-between border relative overflow-hidden group ${cardBgClass}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#2DD4BF]/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center text-xs">
                <span className={`uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Water Deficit</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30">
                  {summary.water_pumps_tripped} Pumps Cut
                </span>
              </div>
              <div className="my-3">
                <span className="text-3xl font-black font-mono text-[#2DD4BF]">
                  {(summary.estimated_water_loss_gpm / 1000).toFixed(1)}k
                </span>
                <span className={`text-xs font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> GPM deficit</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                <div className="bg-gradient-to-r from-[#0D9488] to-[#2DD4BF] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (summary.water_pumps_tripped / 4) * 100)}%` }} />
              </div>
            </div>

            {/* Telecom Metric (Purple) */}
            <div className={`p-5 flex flex-col justify-between border relative overflow-hidden group ${cardBgClass}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#A855F7]/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center text-xs">
                <span className={`uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Telecom Drain</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30">
                  6h Buffer
                </span>
              </div>
              <div className="my-3">
                <span className="text-3xl font-black font-mono text-[#A855F7]">
                  {summary.cell_towers_on_battery}
                </span>
                <span className={`text-xs font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> on battery ({summary.cell_towers_offline} dead)</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                <div className="bg-gradient-to-r from-[#7E22CE] to-[#A855F7] h-full rounded-full transition-all duration-500" style={{ width: `${(summary.cell_towers_on_battery / 624) * 100}%` }} />
              </div>
            </div>

            {/* Healthcare Metric (Rose) */}
            <div className={`p-5 flex flex-col justify-between border relative overflow-hidden group ${cardBgClass}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F43F5E]/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center text-xs">
                <span className={`uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Hospital Fuel</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30">
                  72h Standard
                </span>
              </div>
              <div className="my-3">
                <span className="text-3xl font-black font-mono text-[#F43F5E]">
                  {summary.hospitals_on_generator}
                </span>
                <span className={`text-xs font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> on generators ({summary.hospitals_critical} critical)</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                <div className="bg-gradient-to-r from-[#BE123C] to-[#F43F5E] h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, 100 - (timeHorizon / 72) * 100)}%` }} />
              </div>
            </div>

          </div>
        )}

        {/* Detailed Tables by Sector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Water Infrastructure Table */}
          {(activeTab === 'all' || activeTab === 'water') && (
            <div className={`p-6 border flex flex-col gap-3 ${cardBgClass}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-[#2DD4BF]" />
                  <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>EPANET Water Network Components</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg border text-[#2DD4BF] bg-[#2DD4BF]/10 border-[#2DD4BF]/30">
                  {waterNodes.length} Nodes Loaded
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Booster pumps rely directly on 3-phase commercial grid power. Loss of substation voltage halts hydraulic pumping, leading to zero-pressure water outages.
              </p>

              <div className={`overflow-x-auto max-h-72 border rounded-xl ${borderClass}`}>
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
                        <td className="py-2 px-3 font-bold text-[#2DD4BF]">{w.id}</td>
                        <td className="py-2 px-3 font-medium">{w.is_pump ? '⚡ BOOSTER PUMP' : 'JUNCTION'}</td>
                        <td className="py-2 px-3">
                          <span className={w.pressure_psi < 20 ? 'text-[#EF4444] font-bold' : ''}>
                            {w.pressure_psi} PSI
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.status === 'OFFLINE_NO_POWER' 
                              ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30' 
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
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
            <div className={`p-6 border flex flex-col gap-3 ${cardBgClass}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#A855F7]" />
                  <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>HIFLD Cell Towers & SCADA Telemetry</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg border text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/30">
                  {telecomTowers.length} Towers
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Cell towers have 4 to 8 hours of battery backup. Loss of commercial feed forces DC battery drain, severing smart-grid telemetry once depleted.
              </p>

              <div className={`overflow-x-auto max-h-72 border rounded-xl ${borderClass}`}>
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
                        <td className="py-2 px-3 text-center font-bold text-[#A855F7]">
                          {t.hours_remaining !== undefined ? `${t.hours_remaining}h` : '6.0h'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'BATTERY_EXHAUSTED'
                              ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                              : t.status === 'ON_BATTERY'
                              ? 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
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
            <div className={`p-6 border flex flex-col gap-3 ${cardBgClass}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-[#F43F5E]" />
                  <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Critical Healthcare Facilities (HIFLD)</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg border text-[#F43F5E] bg-[#F43F5E]/10 border-[#F43F5E]/30">
                  {hospitals.length} Hospitals
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Hospitals operate emergency diesel generators upon primary feed cutoff. If grid power is unrecovered within 72 hours, fuel is exhausted, endangering ICU life support.
              </p>

              <div className={`overflow-x-auto max-h-72 border rounded-xl ${borderClass}`}>
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
                        <td className="py-2 px-3 text-center font-bold text-[#F43F5E]">{h.icu_beds}</td>
                        <td className="py-2 px-3 text-[#FBBF24] font-bold">{h.fuel_hours_remaining}h</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.status === 'CRITICAL_POWER_EXHAUSTION'
                              ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 animate-pulse'
                              : h.status === 'ON_EMERGENCY_GENERATOR'
                              ? 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
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
