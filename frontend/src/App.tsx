import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Activity, Settings2, Zap, Sun, Moon, ShieldAlert, Database, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import Multi-Page Architecture
import LandingPage from './pages/LandingPage';
import TopologyPage from './pages/TopologyPage';
import SectorTelemetryPage from './pages/SectorTelemetryPage';
import ContingencyPage from './pages/ContingencyPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

export function ThemeToggle() {
  const { isLight, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme} 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm select-none ${
        isLight
          ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:border-slate-400'
          : 'bg-[#141b2c] border-cyan-500/40 text-amber-300 hover:bg-[#1c2438] hover:border-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
      }`} 
      title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {isLight ? (
        <>
          <Moon className="w-3.5 h-3.5 text-slate-700" />
          <span className="font-mono text-[11px] text-slate-700">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          <span className="font-mono text-[11px] text-gray-200">Light Mode</span>
        </>
      )}
    </button>
  );
}

// Multi-Page Dashboard Layout
function DashboardLayout() {
  const location = useLocation();
  const { isLight } = useTheme();

  const navLinks = [
    { to: '/app/topology', label: 'Topology', icon: Layers },
    { to: '/app/telemetry', label: 'Sector Telemetry', icon: Activity },
    { to: '/app/contingency', label: 'Contingency Lab', icon: ShieldAlert },
    { to: '/app/analytics', label: 'Spark Analytics', icon: Database },
    { to: '/app/settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <motion.div
      className={`flex flex-col h-full max-h-full font-sans overflow-hidden transition-colors duration-200 ${
        isLight ? 'bg-[#f1f5f9] text-slate-900' : 'bg-[#07090e] text-gray-200'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top Telemetry Header */}
      <header className={`h-14 border-b flex items-center justify-between px-5 shrink-0 z-40 select-none transition-colors duration-200 ${
        isLight 
          ? 'bg-white border-slate-200 shadow-sm' 
          : 'bg-[#0a0d14] border-white/10'
      }`}>
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
              isLight 
                ? 'bg-cyan-50 border-cyan-400 text-cyan-600 shadow-sm' 
                : 'bg-cyan-950/60 border-cyan-400/40 text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
            }`}>
              <Zap className="w-4 h-4 text-cyan-500 fill-cyan-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`font-extrabold text-base tracking-wider font-sans leading-none ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  GRIDX
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded leading-none border ${
                  isLight 
                    ? 'bg-cyan-100 text-cyan-800 border-cyan-300' 
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-400/50'
                }`}>
                  V4.8-RT
                </span>
              </div>
              <span className={`text-[8.5px] font-mono tracking-widest uppercase mt-0.5 leading-none ${
                isLight ? 'text-slate-500' : 'text-gray-400'
              }`}>
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

            let buttonClass = '';
            if (isActive) {
              buttonClass = isLight 
                ? 'bg-cyan-600 text-white font-bold shadow-sm' 
                : 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(0,229,255,0.35)]';
            } else {
              buttonClass = isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-gray-400 hover:text-white hover:bg-white/5';
            }

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${buttonClass}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (isLight ? 'text-white' : 'text-slate-950') : (isLight ? 'text-slate-500' : 'text-gray-400')}`} />
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
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app/*" element={<DashboardLayout />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}