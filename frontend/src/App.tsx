import { useState } from 'react';
import { Activity, LayoutDashboard, Route, Settings2, Download, Zap } from 'lucide-react';
import TopologyTab from './components/tabs/TopologyTab';

function App() {
  const [activeTab, setActiveTab] = useState('topology');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-grid-panel border-b border-grid-border flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-grid-accent" />
            <div className="flex flex-col">
              <span className="font-bold text-white text-lg leading-tight tracking-wide">SENTINEL</span>
              <span className="text-[0.6rem] text-gray-500 font-mono tracking-widest uppercase">Telemetry Hub</span>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="flex items-center space-x-6 text-sm font-mono bg-[#12141c] px-4 py-1.5 rounded-md border border-grid-border">
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px] uppercase">Freq</span>
              <span className="text-grid-accent font-bold">59.988 <span className="text-gray-400 text-xs font-sans">Hz</span></span>
            </div>
            <div className="w-px h-6 bg-grid-border" />
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px] uppercase">Load</span>
              <span className="text-grid-accent font-bold">4,820 <span className="text-gray-400 text-xs font-sans">MW</span></span>
            </div>
            <div className="w-px h-6 bg-grid-border" />
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-grid-nominal animate-pulse" />
              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] uppercase">N-1 Status</span>
                <span className="text-grid-nominal font-bold">NOMINAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2">
          <button
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors bg-grid-accent text-black`}
          >
            Topology & Simulation
          </button>
        </div>

        <div className="flex items-center space-x-2 w-[88px]">
           {/* Spacer to replace EXPORT button and keep layout balanced */}
        </div>
      </header>

      {/* Sub-header / Status Bar */}
      <div className="h-8 bg-[#161821] border-b border-grid-border flex items-center justify-between px-6 shrink-0 text-xs font-mono">
        <div className="flex items-center space-x-2 text-gray-400">
          <Activity className="w-3 h-3 text-grid-accent" />
          <span>LIVE VECTOR WAVEFRONT</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">ISO-NE IEEE 39-Bus Node Feed Active [120ms Latency]</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-grid-accent" />
            <span className="text-gray-400">SIM ENGINE <span className="text-gray-200">READY</span></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Settings2 className="w-3 h-3 text-grid-warning" />
            <span className="text-gray-400">AUTO-OPF POLLING <span className="text-grid-warning">PASSIVE</span></span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <TopologyTab />
      </main>
    </div>
  );
}

export default App;
