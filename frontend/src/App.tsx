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
      className={`flex flex-col h-full max-h-full font-sans overflow-hidden transition-colors duration-200 relative ${
        isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0c0716] text-[#e2d9f3]'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      {/* Dynamic Ambient Background Glows */}
      {!isLight && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div 
            className="absolute -top-[15%] right-[10%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-20"
            style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #EC4899 50%, transparent 70%)' }}
          />
          <div 
            className="absolute bottom-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full blur-[170px] opacity-15"
            style={{ background: 'radial-gradient(circle, #F59E0B 0%, #E11D48 60%, transparent 75%)' }}
          />
        </div>
      )}

      {/* Top Telemetry Header */}
      <header className={`h-14 border-b flex items-center justify-between px-6 shrink-0 z-40 select-none backdrop-blur-md transition-colors duration-200 ${
        isLight 
          ? 'bg-white/90 border-slate-200 shadow-sm' 
          : 'bg-[#0f091c]/90 border-white/10'
      }`}>
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
              isLight 
                ? 'bg-amber-50 border-amber-400 text-amber-600 shadow-sm' 
                : 'bg-[#261730] border-[#F59E0B]/40 text-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            }`}>
              <Zap className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`font-black text-lg tracking-tight font-sans leading-none ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  GRID<span className="text-[#F59E0B]">X</span>
                </span>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full leading-none border ${
                  isLight 
                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                    : 'bg-[#261730] text-[#FBBF24] border-[#F59E0B]/30'
                }`}>
                  V4.8-RT • LIVE TWIN
                </span>
              </div>
              <span className={`text-[8.5px] font-mono tracking-widest uppercase mt-0.5 leading-none ${
                isLight ? 'text-slate-500' : 'text-[#a19ab5]'
              }`}>
                Critical Infrastructure Telemetry
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Multi-Page Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-full border border-white/5 bg-black/20">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            let buttonClass = '';
            if (isActive) {
              buttonClass = isLight 
                ? 'bg-slate-900 text-white font-bold shadow-sm' 
                : 'bg-[#261730] text-white font-bold border border-white/20 shadow-[0_0_15px_rgba(168,85,247,0.35)]';
            } else {
              buttonClass = isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-[#a19ab5] hover:text-white hover:bg-white/5';
            }

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${buttonClass}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (isLight ? 'text-white' : 'text-[#FBBF24]') : (isLight ? 'text-slate-500' : 'text-[#a19ab5]')}`} />
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