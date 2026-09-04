import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Activity, Settings2, Zap, Sun, Moon } from 'lucide-react';
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
    <button onClick={toggle} className="ml-4 p-2 rounded-lg bg-grid-bg-alt border border-grid-border hover:bg-white/5 transition-colors text-grid-text-muted hover:text-grid-text" title="Toggle Theme">
      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}

// This layout contains the complex dashboard header and telemetry bar
function DashboardLayout() {
  const location = useLocation();

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-grid-bg relative z-20"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <header className="h-16 bg-grid-panel border-b border-grid-border flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-8">
          {/* Logo (Clicking it goes back to Landing Page) */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Zap className="w-6 h-6 text-grid-accent" />
            <div className="flex flex-col">
              <span className="font-bold text-grid-text text-lg leading-tight tracking-wide">GridX</span>
              <span className="text-[0.6rem] text-grid-text-dim font-mono tracking-widest uppercase">Telemetry Hub</span>
            </div>
          </Link>

          {/* Core Metrics */}
          <div className="flex items-center space-x-6 text-sm font-mono bg-grid-bg-alt px-4 py-1.5 rounded-md border border-grid-border">
            <div className="flex flex-col">
              <span className="text-grid-text-dim text-[10px] uppercase">Freq</span>
              <span className="text-grid-accent font-bold">59.988 <span className="text-grid-text-muted text-xs font-sans">Hz</span></span>
            </div>
            <div className="w-px h-6 bg-grid-border" />
            <div className="flex flex-col">
              <span className="text-grid-text-dim text-[10px] uppercase">Load</span>
              <span className="text-grid-accent font-bold">4,820 <span className="text-grid-text-muted text-xs font-sans">MW</span></span>
            </div>
            <div className="w-px h-6 bg-grid-border" />
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-grid-nominal animate-pulse" />
              <div className="flex flex-col">
                <span className="text-grid-text-dim text-[10px] uppercase">N-1 Status</span>
                <span className="text-grid-nominal font-bold">NOMINAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex items-center space-x-2">
          <Link
            to="/app/topology"
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${location.pathname === '/app/topology' ? 'bg-grid-accent text-black' : 'text-grid-text-muted hover:text-grid-text'}`}
          >
            Topology & Simulation
          </Link>
          <Link
            to="/app/analytics"
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${location.pathname === '/app/analytics' ? 'bg-grid-accent text-black' : 'text-grid-text-muted hover:text-grid-text'}`}
          >
            Analytics
          </Link>
          <Link
            to="/app/settings"
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${location.pathname === '/app/settings' ? 'bg-grid-accent text-black' : 'text-grid-text-muted hover:text-grid-text'}`}
          >
            Settings
          </Link>
          <div className="w-px h-6 bg-grid-border mx-2" />
          <ThemeToggle />
        </div>
      </header>

      {/* Sub-header / Status Bar */}
      <div className="h-8 bg-grid-panel-alt border-b border-grid-border flex items-center justify-between px-6 shrink-0 text-xs font-mono">
        <div className="flex items-center space-x-2 text-grid-text-muted">
          <Activity className="w-3 h-3 text-grid-accent" />
          <span>LIVE VECTOR WAVEFRONT</span>
          <span className="text-gray-600">|</span>
          <span className="text-grid-text-muted">ISO-NE IEEE 39-Bus Node Feed Active [120ms Latency]</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-grid-accent" />
            <span className="text-grid-text-muted">SIM ENGINE <span className="text-grid-text">READY</span></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Settings2 className="w-3 h-3 text-grid-warning" />
            <span className="text-grid-text-muted">AUTO-OPF POLLING <span className="text-grid-warning">PASSIVE</span></span>
          </div>
        </div>
      </div>

      {/* Main Content Area swapped by React Router */}
      <main className="flex-1 relative bg-grid-bg">
        <Routes>
          <Route path="/" element={<Navigate to="/app/topology" replace />} />
          <Route path="topology" element={<TopologyPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.startsWith('/app') ? 'app' : 'home'}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app/*" element={<DashboardLayout />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}