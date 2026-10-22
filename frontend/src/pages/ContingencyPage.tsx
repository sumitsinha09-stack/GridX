import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Flame, ShieldAlert } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ContingencyPage() {
  const { isLight } = useTheme();
  const [multiplier, setMultiplier] = useState(1.35);
  const [brokenLines, setBrokenLines] = useState<number[]>([12, 15]);
  const [predictions, setPredictions] = useState<Record<number, number>>({});
  const [summary, setSummary] = useState<any>(null);

  const runContingencyTest = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/hetero/simulate', {
        broken_lines: brokenLines,
        demand_multiplier: multiplier,
        time_horizon_hours: 24.0,
        enabled_layers: ['POWER', 'WATER', 'TELECOM', 'HEALTHCARE']
      });

      setSummary(res.data.summary);
      setPredictions(res.data.power_predictions || {});
    } catch (err) {
      console.error("Failed to run contingency test:", err);
    }
  };

  useEffect(() => {
    runContingencyTest();
  }, [multiplier, brokenLines]);

  const toggleLine = (lineId: number) => {
    setBrokenLines(prev => 
      prev.includes(lineId) ? prev.filter(l => l !== lineId) : [...prev, lineId]
    );
  };

  const pageBgClass = isLight ? 'bg-[#f1f5f9] text-slate-900' : 'bg-[#07090e] text-gray-200';
  const cardBgClass = isLight ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-[#0b0e17] border-white/10 text-gray-200 shadow-xl';
  const borderClass = isLight ? 'border-slate-200' : 'border-white/10';

  return (
    <div className={`flex-1 w-full p-8 overflow-y-auto font-sans transition-colors duration-200 ${pageBgClass}`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${borderClass}`}>
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h1 className={`text-2xl font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Contingency Lab & Stress Testing
              </h1>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Simulate N-1 and N-k transmission line cuts, climate heatwave surges, and evaluate cascade propagation risks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const rand = Math.floor(Math.random() * 35);
                if (!brokenLines.includes(rand)) setBrokenLines([...brokenLines, rand]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Trip Random Line</span>
            </button>
            <button
              onClick={() => setBrokenLines([])}
              className={`px-3.5 py-2 border text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm ${
                isLight 
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' 
                  : 'bg-[#121724] border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Top Controls: Heatwave Surge Slider & Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Environmental Multiplier Control */}
          <div className={`rounded-xl p-5 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Heatwave Demand Multiplier</h3>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
              }`}>
                {multiplier.toFixed(2)}x
              </span>
            </div>
            <p className={`text-xs mt-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Scales municipal electrical pull across all 39 substations to model extreme weather events.
            </p>
            <input
              type="range"
              min="0.8" max="2.2" step="0.05"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className={`w-full cursor-pointer h-2 rounded-lg appearance-none my-4 ${
                isLight ? 'accent-amber-600 bg-slate-200' : 'accent-cyan-400 bg-gray-800'
              }`}
            />
            <div className={`flex justify-between text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              <span>0.80x (Low)</span>
              <span>1.00x (Nominal)</span>
              <span className="text-red-600 dark:text-red-400 font-bold">2.20x (Extreme Surge)</span>
            </div>
          </div>

          {/* Active Tripped Outages */}
          <div className={`rounded-xl p-5 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Contingency Severity</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                brokenLines.length > 2 
                  ? 'bg-red-600 text-white' 
                  : brokenLines.length > 0 
                    ? (isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-500/20 text-amber-400') 
                    : (isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-400')
              }`}>
                {brokenLines.length > 2 ? 'N-k SEVERE' : brokenLines.length > 0 ? 'N-1 ACTIVE' : 'NOMINAL'}
              </span>
            </div>
            <div className="my-2">
              <span className="text-4xl font-black font-mono text-red-600 dark:text-red-400">{brokenLines.length}</span>
              <span className={`text-sm font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> / 35 lines severed</span>
            </div>
            <div className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Active Cuts: {brokenLines.length > 0 ? brokenLines.map(l => `Line ${l}`).join(', ') : 'None'}
            </div>
          </div>

          {/* Forecasted Secondary Fallout */}
          <div className={`rounded-xl p-5 border flex flex-col justify-between ${cardBgClass}`}>
            <span className={`text-xs uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Forecasted Fallout (24h)</span>
            <div className="grid grid-cols-2 gap-2 my-2 font-mono">
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Buses Down:</span>
                <span className={`text-xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>{summary?.power_buses_offline || 0}</span>
              </div>
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Water Deficit:</span>
                <span className={`text-xl font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {summary ? (summary.estimated_water_loss_gpm / 1000).toFixed(1) : 0}k GPM
                </span>
              </div>
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Towers Dark:</span>
                <span className={`text-xl font-bold ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>{summary?.cell_towers_offline || 0}</span>
              </div>
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Hospitals on Gen:</span>
                <span className={`text-xl font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{summary?.hospitals_on_generator || 0}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Transmission Line Breaker Matrix */}
        <div className={`rounded-xl p-6 border flex flex-col gap-4 ${cardBgClass}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${borderClass}`}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Transmission Line Breaker Switchboard (35 Lines)
              </h2>
            </div>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Click any line to simulate breaker trip</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {Array.from({ length: 35 }).map((_, lineId) => {
              const isBroken = brokenLines.includes(lineId);
              const risk = predictions[lineId] || 0;
              return (
                <button
                  key={lineId}
                  onClick={() => toggleLine(lineId)}
                  className={`p-2.5 rounded-lg border font-mono text-xs flex flex-col items-center justify-between transition-all cursor-pointer ${
                    isBroken
                      ? 'bg-red-600 border-red-700 text-white shadow-md'
                      : risk > 0.85
                      ? (isLight ? 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100' : 'bg-red-900/20 border-red-500/40 text-red-400 hover:bg-red-900/40')
                      : risk > 0.65
                      ? (isLight ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' : 'bg-amber-900/20 border-amber-500/40 text-amber-300 hover:bg-amber-900/40')
                      : (isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300' : 'bg-[#0f1422] border-white/10 text-gray-400 hover:text-white')
                  }`}
                >
                  <div className="flex justify-between w-full text-[10px] opacity-80 font-bold">
                    <span>L{lineId}</span>
                    <span>{isBroken ? 'OFF' : 'ON'}</span>
                  </div>
                  <span className="font-extrabold text-sm my-1">Line {lineId}</span>
                  <span className={`text-[9.5px] font-bold ${
                    isBroken 
                      ? 'text-white underline' 
                      : risk > 0.85 
                        ? 'text-red-600' 
                        : risk > 0.65 
                          ? 'text-amber-600' 
                          : (isLight ? 'text-emerald-700' : 'text-emerald-400')
                  }`}>
                    {isBroken ? 'SEVERED' : `${(risk * 100).toFixed(0)}% Risk`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
