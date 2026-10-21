import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Activity, Settings2, Zap, Sun, Moon, Radio, ShieldAlert, Database, Layers } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Import Multi-Page Architecture
import LandingPage from './pages/LandingPage';
import TopologyPage from './pages/TopologyPage';
import SectorTelemetryPage from './pages/SectorTelemetryPage';
import ContingencyPage from './pages/ContingencyPage';
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

// Multi-Page Dashboard Layout
function DashboardLayout() {
  const location = useLocation();

  const navLinks = [
    { to: '/app/topology', label: 'Topology', icon: Layers },
    { to: '/app/telemetry', label: 'Sector Telemetry', icon: Activity },
    { to: '/app/contingency', label: 'Contingency Lab', icon: ShieldAlert },
    { to: '/app/analytics', label: 'Spark Analytics', icon: Database },
    { to: '/app/settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <motion.div
      className="flex flex-col h-full max-h-full bg-[#07090e] text-gray-200 relative z-20 font-sans overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top Telemetry Header */}
      <header className="h-14 bg-[#0a0d14] border-b border-white/10 flex items-center justify-between px-5 shrink-0 z-40 select-none">
        
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

        {/* Center: Multi-Page Navigation Bar */}
        <div className="flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(0,229,255,0.35)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-gray-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>

      </header>

      {/* Main Page Outlet */}
      <main className="flex-1 flex min-h-0 overflow-hidden relative">
        <Routes>
          <Route path="topology" element={<TopologyPage />} />
          <Route path="telemetry" element={<SectorTelemetryPage />} />
          <Route path="contingency" element={<ContingencyPage />} />
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