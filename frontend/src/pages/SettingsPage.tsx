import { useState } from 'react';
import { Settings2, ShieldAlert, Cpu, Bell, Network, Save, ServerCrash } from 'lucide-react';

export default function SettingsPage() {
  const [useCuda, setUseCuda] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [alertCritical, setAlertCritical] = useState(true);
  const [soundAlarms, setSoundAlarms] = useState(false);

  // Reusable toggle switch component
  const Toggle = ({ label, description, checked, onChange }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-grid-border last:border-0">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-grid-text">{label}</span>
        <span className="text-xs text-grid-text-dim">{description}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-grid-accent' : 'bg-gray-700'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="h-full w-full p-8 bg-grid-bg text-grid-text-muted overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-grid-text flex items-center gap-3 tracking-tight">
            <Settings2 className="text-grid-accent w-8 h-8" /> System Configuration
          </h1>
          <button className="flex items-center gap-2 bg-grid-accent text-black font-bold px-4 py-2 rounded hover:bg-[#00cce6] transition-colors">
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Simulation Engine Parameters */}
          <div className="panel p-6 border border-grid-border bg-grid-panel rounded-xl shadow-lg">
            <h2 className="text-lg font-bold text-grid-text mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-grid-warning" /> Simulation Engine
            </h2>
            <div className="flex flex-col">
              <Toggle
                label="Hardware Acceleration (CUDA)"
                description="Offload PyTorch tensor calculations to the GPU for faster inference."
                checked={useCuda}
                onChange={setUseCuda}
              />
              <Toggle
                label="Auto-Refresh Topology"
                description="Automatically re-render the ForceGraph when load multipliers change."
                checked={autoRefresh}
                onChange={setAutoRefresh}
              />
              <Toggle
                label="Always Show Node IDs"
                description="Keep numerical node labels persistently visible on the map."
                checked={showNodeLabels}
                onChange={setShowNodeLabels}
              />
            </div>
          </div>

          {/* Alerting & Notifications */}
          <div className="panel p-6 border border-grid-border bg-grid-panel rounded-xl shadow-lg">
            <h2 className="text-lg font-bold text-grid-text mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-grid-accent" /> Alerting Thresholds
            </h2>
            <div className="flex flex-col">
              <Toggle
                label="Critical Failure Overlays"
                description="Flash the screen red when any line surpasses 85% predicted risk."
                checked={alertCritical}
                onChange={setAlertCritical}
              />
              <Toggle
                label="Audible Alarms"
                description="Play an alert siren when a cascading failure is detected."
                checked={soundAlarms}
                onChange={setSoundAlarms}
              />
            </div>
          </div>

          {/* Network Routing */}
          <div className="panel p-6 border border-grid-border bg-grid-panel rounded-xl shadow-lg lg:col-span-2">
            <h2 className="text-lg font-bold text-grid-text mb-4 flex items-center gap-2">
              <Network className="w-5 h-5 text-grid-nominal" /> Network Routing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-grid-text-dim uppercase tracking-widest">FastAPI Backend URL</label>
                <input type="text" defaultValue="http://localhost:8000" className="bg-grid-bg-alt border border-grid-border focus:border-grid-accent rounded-lg p-3 text-sm font-mono text-grid-text-muted outline-none transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-grid-text-dim uppercase tracking-widest">WebSocket Feed (Live Telemetry)</label>
                <input type="text" defaultValue="ws://localhost:8000/ws" className="bg-grid-bg-alt border border-grid-border focus:border-grid-accent rounded-lg p-3 text-sm font-mono text-grid-text-muted outline-none transition-colors" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}