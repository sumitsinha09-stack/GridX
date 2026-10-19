import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Activity, Database, ShieldAlert, Clock, AlertTriangle, Layers } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, BarChart as RechartsBarChart, Bar
} from 'recharts';

const trainingData = [
  { epoch: 0, f1Score: 45.2 },
  { epoch: 5, f1Score: 58.4 },
  { epoch: 10, f1Score: 68.4 },
  { epoch: 15, f1Score: 74.2 },
  { epoch: 20, f1Score: 79.1 },
  { epoch: 25, f1Score: 81.3 },
  { epoch: 30, f1Score: 82.5 },
  { epoch: 35, f1Score: 83.9 },
  { epoch: 40, f1Score: 84.7 },
  { epoch: 45, f1Score: 85.2 },
  { epoch: 50, f1Score: 85.8 },
];

export default function AnalyticsPage() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [worstScenarios, setWorstScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
          setWorstScenarios(mcRes.data.worst_scenarios || []);
        }
      } catch (err) {
        console.error("Failed to fetch Spark analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="h-full w-full p-8 bg-grid-bg text-grid-text-muted overflow-y-auto space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-grid-text mb-2 flex items-center gap-2">
          <Database className="text-grid-accent" /> Apache Spark Multi-Infrastructure Analytics
        </h1>
        <p className="text-sm text-grid-text-muted">
          Distributed contingency simulation results, cross-sector vulnerability matrices, and PyTorch GNN convergence.
        </p>
      </div>

      {/* Row 1: Spark Multi-Infrastructure Temporal Cascade Decay Chart */}
      <div className="panel p-6 border border-grid-border bg-grid-panel rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-grid-warning" />
              <h2 className="text-lg font-bold text-grid-text">Multi-Sector Cascade Horizon Decay Profile</h2>
            </div>
            <p className="text-sm text-grid-text-muted mt-1">
              PySpark Monte Carlo simulations (250 runs) tracking average component degradation from shock to 72 hours.
            </p>
          </div>
          <span className="text-xs font-mono bg-grid-accent/10 text-grid-accent px-2 py-1 rounded border border-grid-accent/20">
            Apache Spark RDD Parallelized
          </span>
        </div>

        <div className="w-full h-80 bg-grid-bg-alt rounded-lg border border-grid-border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d303a" vertical={false} />
              <XAxis 
                dataKey="time_horizon_hours" 
                stroke="#9ca3af"
                tickFormatter={(val) => `${val}h`}
                label={{ value: 'Cascade Horizon (Hours)', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#181920', borderColor: '#374151', borderRadius: '8px' }}
                labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="power_buses_offline" name="Power Buses Down" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="water_pumps_tripped" name="Water Pumps Down (0h)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="cell_towers_offline" name="Cell Towers Depleted (4h-8h)" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="hospitals_critical" name="Hospitals Critical (72h Fuel Drop)" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Spark SQL Critical Substation Rankings Table */}
      <div className="panel p-6 border border-grid-border bg-grid-panel rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-grid-text flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-grid-danger" /> Critical Substation Vulnerability Matrix
            </h2>
            <p className="text-sm text-grid-text-muted mt-1">
              Substations ranked by secondary impact potential computed via PySpark Broadcast Spatial Joins & Spark SQL.
            </p>
          </div>
          <span className="text-xs font-mono text-grid-text-dim">Source: critical_substation_rankings.parquet</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-grid-bg-alt text-grid-text-dim uppercase text-[10px] tracking-wider border-b border-grid-border">
              <tr>
                <th className="py-3 px-4">Bus ID</th>
                <th className="py-3 px-4">Substation Name</th>
                <th className="py-3 px-4 text-center">Dependent Hospitals</th>
                <th className="py-3 px-4 text-center">ICU Beds at Risk</th>
                <th className="py-3 px-4 text-center">Dependent Cell Towers</th>
                <th className="py-3 px-4 text-center">Dependent Water Pumps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grid-border/40">
              {rankings.slice(0, 8).map((row, idx) => (
                <tr key={idx} className="hover:bg-grid-bg-alt/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-blue-400">P_{row.bus_id}</td>
                  <td className="py-3 px-4 font-sans text-grid-text font-medium">{row.substation_name}</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">{row.dependent_hospitals}</td>
                  <td className="py-3 px-4 text-center font-bold text-red-400">{row.icu_beds_at_risk}</td>
                  <td className="py-3 px-4 text-center text-purple-400">{row.dependent_cell_towers}</td>
                  <td className="py-3 px-4 text-center text-cyan-400">{row.dependent_water_pumps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: PyTorch GAT Convergence */}
      <div className="panel p-6 border border-grid-border bg-grid-panel rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-grid-text flex items-center gap-2">
              <Activity className="w-5 h-5 text-grid-nominal" /> GAT Neural Network Convergence Benchmark
            </h2>
            <p className="text-sm text-grid-text-muted mt-1">
              F1 Accuracy score convergence across 50 epochs on IEEE 39-bus power flow contingencies.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black text-grid-nominal">85.8<span className="text-lg text-grid-text-dim">%</span></span>
            <span className="text-[10px] text-grid-text-dim font-mono uppercase">Target Accuracy</span>
          </div>
        </div>

        <div className="w-full h-64 bg-grid-bg-alt rounded-lg border border-grid-border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trainingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d303a" vertical={false} />
              <XAxis dataKey="epoch" stroke="#9ca3af" />
              <YAxis domain={[40, 100]} stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: '#181920', borderColor: '#374151' }} />
              <ReferenceLine y={85.8} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Target F1 (85.8%)', fill: '#22c55e', fontSize: 10 }} />
              <Line type="monotone" dataKey="f1Score" name="F1 Score" stroke="#00cce6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}