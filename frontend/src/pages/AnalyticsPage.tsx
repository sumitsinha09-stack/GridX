import { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, ShieldAlert, Clock } from 'lucide-react';
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
    <div className={`h-full w-full p-8 overflow-y-auto space-y-8 transition-colors duration-200 ${
      isLight ? 'bg-[#f1f5f9] text-slate-900' : 'bg-grid-bg text-grid-text-muted'
    }`}>
      
      {/* Page Header */}
      <div>
        <h1 className={`text-2xl font-extrabold mb-2 flex items-center gap-2 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          <Database className="text-cyan-600 dark:text-cyan-400" /> Apache Spark Multi-Infrastructure Analytics
        </h1>
        <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
          Distributed contingency simulation results, cross-sector vulnerability matrices, and PyTorch GNN convergence.
        </p>
      </div>

      {/* Row 1: Spark Multi-Infrastructure Temporal Cascade Decay Chart */}
      <div className={`p-6 border rounded-xl shadow-sm ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#101522] border-white/10 text-white'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className={`text-lg font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Multi-Sector Cascade Horizon Decay Profile
              </h2>
            </div>
            <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              PySpark Monte Carlo simulations (250 runs) tracking average component degradation from shock to 72 hours.
            </p>
          </div>
          <span className={`text-xs font-mono font-bold px-2 py-1 rounded border ${
            isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
          }`}>
            Apache Spark RDD Parallelized
          </span>
        </div>

        <div className={`w-full h-80 rounded-lg border p-4 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b0e17] border-white/5'
        }`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#cbd5e1' : '#2d303a'} vertical={false} />
              <XAxis 
                dataKey="time_horizon_hours" 
                stroke={isLight ? '#334155' : '#9ca3af'}
                tickFormatter={(val) => `${val}h`}
                label={{ value: 'Cascade Horizon (Hours)', position: 'insideBottom', offset: -5, fill: isLight ? '#475569' : '#6b7280', fontSize: 11 }}
              />
              <YAxis stroke={isLight ? '#334155' : '#9ca3af'} />
              <Tooltip 
                contentStyle={isLight 
                  ? { backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' } 
                  : { backgroundColor: '#181920', borderColor: '#374151', borderRadius: '8px' }}
                labelStyle={{ color: isLight ? '#0f172a' : '#f3f4f6', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="power_buses_offline" name="Power Buses Down" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="water_pumps_tripped" name="Water Pumps Down (0h)" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="cell_towers_offline" name="Cell Towers Depleted (4h-8h)" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="hospitals_critical" name="Hospitals Critical (72h Fuel Drop)" stroke="#dc2626" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Spark SQL Critical Substation Rankings Table */}
      <div className={`p-6 border rounded-xl shadow-sm ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#101522] border-white/10 text-white'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className={`text-lg font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" /> Critical Substation Vulnerability Matrix
            </h2>
            <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Substations ranked by secondary impact potential computed via PySpark Broadcast Spatial Joins & Spark SQL.
            </p>
          </div>
          <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            Source: critical_substation_rankings.parquet
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className={`uppercase text-[10px] tracking-wider border-b font-bold ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0b0e17] text-gray-400 border-white/10'
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
                <tr key={idx} className={`transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-white/5 text-gray-300'}`}>
                  <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">P_{row.bus_id}</td>
                  <td className={`py-3 px-4 font-sans font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{row.substation_name}</td>
                  <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">{row.dependent_hospitals}</td>
                  <td className="py-3 px-4 text-center font-bold text-red-600 dark:text-red-400">{row.icu_beds_at_risk}</td>
                  <td className="py-3 px-4 text-center text-purple-600 dark:text-purple-400 font-bold">{row.dependent_cell_towers}</td>
                  <td className="py-3 px-4 text-center text-cyan-600 dark:text-cyan-400 font-bold">{row.dependent_water_pumps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}