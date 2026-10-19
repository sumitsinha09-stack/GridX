import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Activity, Settings2, Zap, Sun, Moon, Bell, SlidersHorizontal, Radio, Cpu, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import Pages
import LandingPage from './pages/LandingPage';
import TopologyPage from './pages/TopologyPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.body.classList.contains('light-theme'));
  }, []);

  const toggle = () => {
    document.body.classList.toggle('light-theme');
    setIsLight(!isLight);
  };

  return (
    <button 
      onClick={toggle} 
      className="p-1.5 rounded-lg bg-[#0e131f] border border-white/10 hover:border-cyan-500/40 transition-colors text-gray-400 hover:text-white" 
      title="Toggle Theme"
    >
      {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
    </button>
  );
}

// Layout matching the industrial telemetry top bar
function DashboardLayout() {
  const location = useLocation();

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-[#07090e] text-gray-200 relative z-20 font-sans"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top Telemetry Header */}
      <header className="h-14 bg-[#0a0d14] border-b border-white/10 flex items-center justify-between px-5 shrink-0 z-30 select-none">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.25)]">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-wider font-sans leading-none">GRIDX</span>
                <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded leading-none">
                  V4.8-RT
                </span>
              </div>
              <span className="text-[8.5px] text-gray-400 font-mono tracking-widest uppercase mt-0.5 leading-none">
                Critical Infrastructure Telemetry
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Live Industrial Telemetry Badges */}
        <div className="hidden xl:flex items-center gap-3 text-xs font-mono">
          
          {/* Frequency */}
          <div className="flex items-center gap-2 bg-[#0e131f] border border-white/10 px-3 py-1 rounded-md">
            <span className="text-[10px] text-gray-400 uppercase">Freq:</span>
            <span className="text-cyan-400 font-bold">59.988</span>
            <span className="text-gray-400 text-[10px]">Hz</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00e5ff]" />
          </div>

          {/* Load */}
          <div className="flex items-center gap-2 bg-[#0e131f] border border-white/10 px-3 py-1 rounded-md">
            <span className="text-[10px] text-gray-400 uppercase">Load:</span>
            <span className="text-cyan-400 font-bold">4,820</span>
            <span className="text-gray-400 text-[10px]">MW</span>
            <span className="text-emerald-400 text-[10px] font-bold">(+12)</span>
          </div>

          {/* N-1 Status */}
          <div className="flex items-center gap-2 bg-[#0e131f] border border-white/10 px-3 py-1 rounded-md">
            <span className="text-[10px] text-gray-400 uppercase">N-1 Status:</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
              Nominal
            </span>
          </div>

          {/* Grid Model & Latency */}
          <div className="flex items-center gap-1.5 bg-[#0e131f] border border-white/10 px-3 py-1 rounded-md text-[11px] text-gray-300">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>IEEE 39-Bus</span>
            <span className="text-gray-400 text-[10px]">[120ms Latency]</span>
          </div>

          {/* Sim Engine Status */}
          <div className="flex items-center gap-1.5 bg-[#0e131f] border border-white/10 px-3 py-1 rounded-md text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-gray-400 text-[10px] uppercase">Sim Engine:</span>
            <span className="text-cyan-300 font-bold text-[10px]">READY</span>
          </div>

          {/* Auto-OPF */}
          <div className="flex items-center gap-1.5 bg-[#0e131f] border border-white/10 px-3 py-1 rounded-md text-[11px]">
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span className="text-gray-400 text-[10px] uppercase">Auto-OPF:</span>
            <span className="text-amber-400 font-bold text-[10px]">PASSIVE</span>
          </div>

        </div>

        {/* Right: Navigation Tabs & Utility Buttons */}
        <div className="flex items-center gap-2">
          
          <Link
            to="/app/topology"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center leading-tight ${
              location.pathname === '/app/topology'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Topology & Simulation
          </Link>

          <Link
            to="/app/analytics"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              location.pathname === '/app/analytics'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Analytics
          </Link>

          <Link
            to="/app/settings"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              location.pathname === '/app/settings'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Settings
          </Link>

          {/* Notification Button */}
          <button 
            className="p-1.5 rounded-lg bg-[#0e131f] border border-white/10 text-gray-400 hover:text-white hover:border-cyan-500/40 transition-colors ml-1"
            title="Alerts"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* Controls Button */}
          <button 
            className="p-1.5 rounded-lg bg-[#0e131f] border border-white/10 text-gray-400 hover:text-white hover:border-cyan-500/40 transition-colors"
            title="Options"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <ThemeToggle />
        </div>

      </header>

      {/* Main Page Outlet */}
      <main className="flex-1 flex overflow-hidden">
        <Routes>
          <Route path="topology" element={<TopologyPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="topology" replace />} />
        </Routes>
      </main>

    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app/*" element={<DashboardLayout />} />
      </Routes>
    </BrowserRouter>
  );
}