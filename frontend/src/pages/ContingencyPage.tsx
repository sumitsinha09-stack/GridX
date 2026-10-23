import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Zap, Flame, ShieldAlert, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ContingencyPage() {
  const { isLight } = useTheme();
  const [multiplier, setMultiplier] = useState(1.35);
  const [brokenLines, setBrokenLines] = useState<number[]>([12, 15]);
  const [predictions, setPredictions] = useState<Record<number, number>>({});
  const [summary, setSummary] = useState<any>(null);

  const abortRef = useRef<AbortController | null>(null);

  const runContingencyTest = useCallback(async (lines: number[], mult: number) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await axios.post('http://localhost:8000/api/hetero/simulate', {
        broken_lines: lines,
        demand_multiplier: mult,
        time_horizon_hours: 24.0,
        enabled_layers: ['POWER', 'WATER', 'TELECOM', 'HEALTHCARE']
      }, { signal: ctrl.signal });

      setSummary(res.data.summary);
      setPredictions(res.data.power_predictions || {});
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'CanceledError') return;
      console.error("Failed to run contingency test:", err);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      runContingencyTest(brokenLines, multiplier);
    }, 120);
    return () => clearTimeout(t);
  }, [multiplier, brokenLines, runContingencyTest]);

  const toggleLine = (lineId: number) => {
    setBrokenLines(prev => 
      prev.includes(lineId) ? prev.filter(l => l !== lineId) : [...prev, lineId]
    );
  };

  const pageBgClass = isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0c0716] text-gray-200';
  const cardBgClass = isLight 
    ? 'bg-white/90 border-slate-200 text-slate-900 shadow-sm backdrop-blur-md rounded-2xl' 
    : 'bg-[#130b24]/75 border-white/10 text-gray-200 shadow-xl backdrop-blur-md rounded-2xl';
  const borderClass = isLight ? 'border-slate-200' : 'border-white/10';

  return (
    <div className={`flex-1 w-full p-8 overflow-y-auto font-sans transition-colors duration-200 ${pageBgClass}`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${borderClass}`}>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EF4444] to-[#F59E0B] p-0.5 shadow-md shadow-red-500/20">
                <div className="w-full h-full bg-[#0c0716] rounded-[6px] flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                </div>
              </div>
              <h1 className={`text-2xl font-black tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Contingency Lab & Stress Testing
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-bold ml-2">
                N-k CASCADE ENGINE
              </span>
            </div>
            <p className={`text-xs mt-1.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Simulate N-1 and N-k transmission line cuts, climate heatwave surges, and evaluate cascade propagation risks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const rand = Math.floor(Math.random() * 35);
                if (!brokenLines.includes(rand)) setBrokenLines([...brokenLines, rand]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F59E0B] via-[#EC4899] to-[#F43F5E] hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-pink-500/20 cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Trip Random Line</span>
            </button>
            <button
              onClick={() => setBrokenLines([])}
              className={`flex items-center gap-1.5 px-3.5 py-2 border text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
                isLight 
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>
        </div>

        {/* Top Controls: Heatwave Surge Slider & Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Environmental Multiplier Control */}
          <div className={`p-6 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#F59E0B]" />
                <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Heatwave Surge Multiplier</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg border bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40 shadow-sm">
                {multiplier.toFixed(2)}x
              </span>
            </div>
            <p className={`text-xs mt-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Scales municipal electrical pull across all 39 substations to model extreme weather events.
            </p>
            <div className="my-5">
              <input
                type="range"
                min="0.8" max="2.2" step="0.05"
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                className="w-full cursor-pointer h-2 rounded-lg appearance-none bg-white/10 accent-[#F59E0B]"
              />
            </div>
            <div className={`flex justify-between text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              <span>0.80x (Low)</span>
              <span className="text-emerald-400">1.00x (Nominal)</span>
              <span className="text-[#EF4444] font-bold">2.20x (Severe Surge)</span>
            </div>
          </div>

          {/* Active Tripped Outages */}
          <div className={`p-6 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Contingency Severity</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono border ${
                brokenLines.length > 2 
                  ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40 animate-pulse' 
                  : brokenLines.length > 0 
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}>
                {brokenLines.length > 2 ? 'N-k SEVERE' : brokenLines.length > 0 ? 'N-1 ACTIVE' : 'NOMINAL'}
              </span>
            </div>
            <div className="my-3">
              <span className="text-4xl font-black font-mono text-[#EF4444]">{brokenLines.length}</span>
              <span className={`text-sm font-mono ml-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> / 35 lines severed</span>
            </div>
            <div className={`text-xs font-mono truncate ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              <span className="text-gray-500">Active Cuts:</span> {brokenLines.length > 0 ? brokenLines.map(l => `Line ${l}`).join(', ') : 'None'}
            </div>
          </div>

          {/* Forecasted Secondary Fallout (24h) with 4-Sector Neon Accents */}
          <div className={`p-6 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs uppercase font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Cascade Fallout (24h)</span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                PROJECTION
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 my-2 font-mono">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] block text-[#FBBF24]">Power Buses:</span>
                <span className="text-xl font-black text-[#FBBF24]">{summary?.power_buses_offline || 0}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] block text-[#2DD4BF]">Water Deficit:</span>
                <span className="text-xl font-black text-[#2DD4BF]">
                  {summary ? (summary.estimated_water_loss_gpm / 1000).toFixed(1) : 0}k <span className="text-xs font-normal">GPM</span>
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] block text-[#A855F7]">Towers Dark:</span>
                <span className="text-xl font-black text-[#A855F7]">{summary?.cell_towers_offline || 0}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] block text-[#F43F5E]">Hospitals on Gen:</span>
                <span className="text-xl font-black text-[#F43F5E]">{summary?.hospitals_on_generator || 0}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Transmission Line Breaker Matrix */}
        <div className={`p-6 border flex flex-col gap-4 ${cardBgClass}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${borderClass}`}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FBBF24]" />
              <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Transmission Line Breaker Switchboard (35 Lines)
              </h2>
            </div>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Click any line to simulate breaker trip / line severance
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {Array.from({ length: 35 }).map((_, lineId) => {
              const isBroken = brokenLines.includes(lineId);
              const risk = predictions[lineId] || 0;
              return (
                <button
                  key={lineId}
                  onClick={() => toggleLine(lineId)}
                  className={`p-3 rounded-xl border font-mono text-xs flex flex-col items-center justify-between transition-all cursor-pointer ${
                    isBroken
                      ? 'bg-[#EF4444]/25 border-[#EF4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-pulse'
                      : risk > 0.85
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/20'
                      : risk > 0.65
                      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/20'
                      : (isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300' 
                          : 'bg-[#180e2e]/50 border-white/5 text-gray-400 hover:border-white/20 hover:text-white')
                  }`}
                >
                  <div className="flex justify-between w-full text-[10px] opacity-80 font-bold">
                    <span>L{lineId}</span>
                    <span className={isBroken ? 'text-[#EF4444] font-black' : ''}>{isBroken ? 'CUT' : 'ON'}</span>
                  </div>
                  <span className="font-extrabold text-sm my-1.5">Line {lineId}</span>
                  <span className={`text-[9.5px] font-bold ${
                    isBroken 
                      ? 'text-[#EF4444] font-black' 
                      : risk > 0.85 
                        ? 'text-[#EF4444]' 
                        : risk > 0.65 
                          ? 'text-[#F59E0B]' 
                          : 'text-emerald-400'
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
