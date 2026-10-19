import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Flame, ShieldAlert } from 'lucide-react';

export default function ContingencyPage() {
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

  return (
    <div className="flex-1 w-full p-8 bg-[#07090e] text-gray-200 overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h1 className="text-2xl font-bold text-white tracking-wide">Contingency Lab & Stress Testing</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Simulate $N-1$ and $N-k$ transmission line cuts, climate heatwave surges, and evaluate cascade propagation risks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const rand = Math.floor(Math.random() * 35);
                if (!brokenLines.includes(rand)) setBrokenLines([...brokenLines, rand]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-500/50 text-red-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span>Trip Random Line</span>
            </button>
            <button
              onClick={() => setBrokenLines([])}
              className="px-3.5 py-2 bg-[#121724] border border-white/10 hover:border-white/20 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Top Controls: Heatwave Surge Slider & Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Environmental Multiplier Control */}
          <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Heatwave Demand Multiplier</h3>
              </div>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/50 text-xs font-mono font-bold px-2 py-0.5 rounded">
                {multiplier.toFixed(2)}x
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Scales municipal electrical pull across all 39 substations to model extreme weather events.
            </p>
            <input
              type="range"
              min="0.8" max="2.2" step="0.05"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none my-4"
            />
            <div className="flex justify-between text-[10px] font-mono text-gray-400">
              <span>0.80x (Low)</span>
              <span>1.00x (Nominal)</span>
              <span className="text-red-400 font-bold">2.20x (Extreme Surge)</span>
            </div>
          </div>

          {/* Active Tripped Outages */}
          <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase font-mono">Contingency Severity</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                brokenLines.length > 2 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {brokenLines.length > 2 ? 'N-k SEVERE' : brokenLines.length > 0 ? 'N-1 ACTIVE' : 'NOMINAL'}
              </span>
            </div>
            <div className="my-2">
              <span className="text-4xl font-extrabold text-red-400 font-mono">{brokenLines.length}</span>
              <span className="text-gray-400 text-sm font-mono"> / 35 lines severed</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Active Cuts: {brokenLines.length > 0 ? brokenLines.map(l => `Line ${l}`).join(', ') : 'None'}
            </div>
          </div>

          {/* Forecasted Secondary Fallout */}
          <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <span className="text-xs text-gray-400 uppercase font-mono">Forecasted Fallout (24h)</span>
            <div className="grid grid-cols-2 gap-2 my-2 font-mono">
              <div>
                <span className="text-[10px] text-gray-400 block">Buses Down:</span>
                <span className="text-xl font-bold text-blue-400">{summary?.power_buses_offline || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Water Deficit:</span>
                <span className="text-xl font-bold text-cyan-400">
                  {summary ? (summary.estimated_water_loss_gpm / 1000).toFixed(1) : 0}k GPM
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Towers Dark:</span>
                <span className="text-xl font-bold text-purple-400">{summary?.cell_towers_offline || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Hospitals on Gen:</span>
                <span className="text-xl font-bold text-amber-400">{summary?.hospitals_on_generator || 0}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Transmission Line Breaker Matrix */}
        <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Transmission Line Breaker Switchboard (35 Lines)</h2>
            </div>
            <span className="text-xs text-gray-400 font-mono">Click any line to simulate breaker trip</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {Array.from({ length: 35 }).map((_, lineId) => {
              const isBroken = brokenLines.includes(lineId);
              const risk = predictions[lineId] || 0;
              return (
                <button
                  key={lineId}
                  onClick={() => toggleLine(lineId)}
                  className={`p-2.5 rounded-lg border font-mono text-xs flex flex-col items-center justify-between transition-all ${
                    isBroken
                      ? 'bg-red-950/70 border-red-500/80 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                      : risk > 0.85
                      ? 'bg-red-900/20 border-red-500/40 text-red-400 hover:bg-red-900/40'
                      : risk > 0.65
                      ? 'bg-amber-900/20 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                      : 'bg-[#0f1422] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between w-full text-[10px] opacity-70">
                    <span>L{lineId}</span>
                    <span>{isBroken ? 'OFF' : 'ON'}</span>
                  </div>
                  <span className="font-bold text-sm my-1">Line {lineId}</span>
                  <span className={`text-[9.5px] font-bold ${isBroken ? 'text-red-400' : risk > 0.85 ? 'text-red-400' : risk > 0.65 ? 'text-amber-400' : 'text-emerald-400'}`}>
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
