import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

import TopologyPage from './pages/TopologyPage';
import LandingPage from './pages/LandingPage';
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
      className="p-1.5 rounded-lg bg-[#0e131f] border border-white/10 hover:border-cyan-500/40 transition-colors text-gray-400 hover:text-white cursor-pointer" 
      title="Toggle Theme"
    >
      {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main interactive IEEE 39-Bus topology dashboard matching user design */}
        <Route path="/" element={<TopologyPage />} />
        <Route path="/app/topology" element={<TopologyPage />} />
        <Route path="/app" element={<Navigate to="/" replace />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/app/telemetry" element={<SectorTelemetryPage />} />
        <Route path="/app/contingency" element={<ContingencyPage />} />
        <Route path="/app/analytics" element={<AnalyticsPage />} />
        <Route path="/app/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}