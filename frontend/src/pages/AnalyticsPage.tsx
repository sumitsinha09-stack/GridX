import { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export default function AnalyticsPage() {
  const { isLight } = useTheme();
  const [rankings, setRankings] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [rankRes, mcRes] = await Promise.all([
          axios.get('http://localhost:8000/api/spark/rankings'),
          axios.get('http://localhost:8000/api/spark/monte-carlo')
        ]);

        if (rankRes.data.status === 'ok') {
          setRankings(rankRes.data.rankings || []);
        }
        if (mcRes.data.status === 'ok') {
          setTimeline(mcRes.data.timeline || []);
        }
      } catch (err) {
        console.error("Failed to fetch Spark analytics:", err);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className={`h-full w-full p-8 overflow-y-auto space-y-8 font-sans transition-colors duration-200 ${
      isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0c0716] text-[#e2d9f3]'
    }`}>
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#261730] border border-[#F59E0B]/30 text-[#FBBF24] text-[11px] font-mono font-bold tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            <span>APACHE SPARK DISTRIBUTED ENGINE</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Multi-Infrastructure <span className="text-[#FBBF24]">Analytics</span> & <span className="bg-gradient-to-r from-[#F97316] via-[#FB7185] to-[#F43F5E] bg-clip-text text-transparent">Cascade Matrices</span>
          </h1>
          <p className="text-sm text-[#a19ab5] mt-1.5 max-w-2xl font-normal">
            PySpark Monte Carlo simulations tracking component degradation, cross-sector vulnerabilities, and GNN topological risks across 72 hours.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-[#261730] text-[#FBBF24] border border-[#F59E0B]/30 shadow-sm flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
            Spark RDD Active
          </span>
        </div>
      </div>

      {/* Row 1: Spark Multi-Infrastructure Temporal Cascade Decay Chart */}
      <div className={`p-6 border rounded-2xl shadow-xl transition-all duration-300 ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900' 
          : 'bg-[#130b24]/75 border-white/10 text-white backdrop-blur-md'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <h2 className="text-lg font-black tracking-wide text-white">
                Multi-Sector Cascade Horizon Decay Profile
              </h2>
            </div>
            <p className="text-xs text-[#a19ab5] mt-1">
              PySpark Monte Carlo simulations (250 runs) tracking average component degradation from initial shock to 72 hours.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#FBBF24]">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.6)]" /> Power
            </span>
            <span className="flex items-center gap-1.5 text-[#2DD4BF]">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#2DD4BF] shadow-[0_0_8px_rgba(45,212,191,0.6)]" /> Water
            </span>
            <span className="flex items-center gap-1.5 text-[#A855F7]">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#A855F7] shadow-[0_0_8px_rgba(168,85,247,0.6)]" /> Telecom
            </span>
            <span className="flex items-center gap-1.5 text-[#F43F5E]">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#F43F5E] shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> Hospitals
            </span>
          </div>
        </div>

        <div className={`w-full h-80 rounded-xl border p-4 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c0716]/90 border-white/5'
        }`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.06)'} vertical={false} />
              <XAxis 
                dataKey="time_horizon_hours" 
                stroke={isLight ? '#334155' : '#a19ab5'}
                tickFormatter={(val) => `${val}h`}
                label={{ value: 'Cascade Horizon (Hours)', position: 'insideBottom', offset: -5, fill: isLight ? '#475569' : '#a19ab5', fontSize: 11 }}
              />
              <YAxis stroke={isLight ? '#334155' : '#a19ab5'} />
              <Tooltip 
                contentStyle={isLight 
                  ? { backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' } 
                  : { backgroundColor: '#180e2e', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', color: '#ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                labelStyle={{ color: isLight ? '#0f172a' : '#f3f4f6', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="power_buses_offline" name="Power Buses Down" stroke="#FBBF24" strokeWidth={3} dot={{ r: 4, fill: '#FBBF24' }} />
              <Line type="monotone" dataKey="water_pumps_tripped" name="Water Pumps Down (0h)" stroke="#2DD4BF" strokeWidth={3} dot={{ r: 4, fill: '#2DD4BF' }} />
              <Line type="monotone" dataKey="cell_towers_offline" name="Cell Towers Depleted (4h-8h)" stroke="#A855F7" strokeWidth={3} dot={{ r: 4, fill: '#A855F7' }} />
              <Line type="monotone" dataKey="hospitals_critical" name="Hospitals Critical (72h Fuel Drop)" stroke="#F43F5E" strokeWidth={3.5} dot={{ r: 5, fill: '#F43F5E' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Spark SQL Critical Substation Rankings Table */}
      <div className={`p-6 border rounded-2xl shadow-xl transition-all duration-300 ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900' 
          : 'bg-[#130b24]/75 border-white/10 text-white backdrop-blur-md'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#F43F5E]" /> Critical Substation Vulnerability Matrix
            </h2>
            <p className="text-xs text-[#a19ab5] mt-1">
              Substations ranked by secondary cascade impact potential computed via PySpark Broadcast Spatial Joins & Spark SQL.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[#a19ab5]">
            Source: critical_substation_rankings.parquet
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm font-mono">
            <thead className={`uppercase text-[10px] tracking-wider border-b font-bold ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#180e2e] text-[#a19ab5] border-white/10'
            }`}>
              <tr>
                <th className="py-3 px-4">Bus ID</th>
                <th className="py-3 px-4">Substation Name</th>
                <th className="py-3 px-4 text-center">Dependent Hospitals</th>
                <th className="py-3 px-4 text-center">ICU Beds at Risk</th>
                <th className="py-3 px-4 text-center">Dependent Cell Towers</th>
                <th className="py-3 px-4 text-center">Dependent Water Pumps</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
              {rankings.slice(0, 8).map((row, idx) => (
                <tr key={idx} className={`transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-white/[0.04] text-gray-200'}`}>
                  <td className="py-3.5 px-4 font-bold">
                    <span className="px-2 py-0.5 rounded bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[#FBBF24] font-mono text-xs">
                      P_{row.bus_id}
                    </span>
                  </td>
                  <td className={`py-3.5 px-4 font-sans font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {row.substation_name}
                  </td>
                  <td className="py-3.5 px-4 text-center text-[#F43F5E] font-bold">
                    {row.dependent_hospitals}
                  </td>
                  <td className="py-3.5 px-4 text-center font-black text-[#EF4444]">
                    {row.icu_beds_at_risk}
                  </td>
                  <td className="py-3.5 px-4 text-center text-[#A855F7] font-bold">
                    {row.dependent_cell_towers}
                  </td>
                  <td className="py-3.5 px-4 text-center text-[#2DD4BF] font-bold">
                    {row.dependent_water_pumps}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: 4 Bottom Telemetry KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        
        {/* Card 1: Substations */}
        <div className="rounded-2xl p-5 bg-[#130b24]/75 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all hover:bg-[#180e2e]/80 shadow-lg">
          <div className="text-3xl sm:text-4xl font-black text-[#FBBF24] tracking-tight mb-1 font-sans">
            39
          </div>
          <div className="text-xs sm:text-sm font-medium text-[#a19ab5]">
            Substations
          </div>
        </div>

        {/* Card 2: Cell Towers */}
        <div className="rounded-2xl p-5 bg-[#130b24]/75 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all hover:bg-[#180e2e]/80 shadow-lg">
          <div className="text-3xl sm:text-4xl font-black text-[#A855F7] tracking-tight mb-1 font-sans">
            624
          </div>
          <div className="text-xs sm:text-sm font-medium text-[#a19ab5]">
            Cell towers
          </div>
        </div>

        {/* Card 3: Hospitals */}
        <div className="rounded-2xl p-5 bg-[#130b24]/75 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all hover:bg-[#180e2e]/80 shadow-lg">
          <div className="text-3xl sm:text-4xl font-black text-[#F43F5E] tracking-tight mb-1 font-sans">
            289
          </div>
          <div className="text-xs sm:text-sm font-medium text-[#a19ab5]">
            Hospitals
          </div>
        </div>

        {/* Card 4: Decay Horizon */}
        <div className="rounded-2xl p-5 bg-[#130b24]/75 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all hover:bg-[#180e2e]/80 shadow-lg">
          <div className="text-3xl sm:text-4xl font-black text-[#2DD4BF] tracking-tight mb-1 font-sans">
            72h
          </div>
          <div className="text-xs sm:text-sm font-medium text-[#a19ab5]">
            Decay horizon
          </div>
        </div>

      </div>

    </div>
  );
}