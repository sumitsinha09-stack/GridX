import { useState } from 'react';
import { Settings2, Cpu, Bell, Network, Save, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { isLight } = useTheme();
  const [useCuda, setUseCuda] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [alertCritical, setAlertCritical] = useState(true);
  const [soundAlarms, setSoundAlarms] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const pageBgClass = isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0c0716] text-gray-200';
  const cardBgClass = isLight 
    ? 'bg-white/90 border-slate-200 text-slate-900 shadow-sm backdrop-blur-md rounded-2xl' 
    : 'bg-[#130b24]/75 border-white/10 text-gray-200 shadow-xl backdrop-blur-md rounded-2xl';
  const borderClass = isLight ? 'border-slate-200' : 'border-white/10';
  const inputBgClass = isLight
    ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-amber-500'
    : 'bg-[#0c0716] border-white/10 text-gray-200 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/50';

  // Reusable toggle switch component with sunset gradient active state
  const Toggle = ({ label, description, checked, onChange }: any) => (
    <div className={`flex items-center justify-between py-3.5 border-b last:border-0 ${borderClass}`}>
      <div className="flex flex-col pr-4">
        <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{label}</span>
        <span className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{description}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all focus:outline-none ${
          checked 
            ? 'bg-gradient-to-r from-[#F59E0B] to-[#EC4899] shadow-md shadow-pink-500/25' 
            : (isLight ? 'bg-slate-300' : 'bg-white/10')
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );

  return (
    <div className={`flex-1 w-full p-8 overflow-y-auto font-sans transition-colors duration-200 ${pageBgClass}`}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${borderClass}`}>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B] via-[#EC4899] to-[#A855F7] p-0.5 shadow-md shadow-pink-500/20">
                <div className="w-full h-full bg-[#0c0716] rounded-[6px] flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-[#F59E0B]" />
                </div>
              </div>
              <h1 className={`text-2xl font-black tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                System Configuration
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-bold ml-2">
                CORE CONFIG
              </span>
            </div>
            <p className={`text-xs mt-1.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Manage PyTorch simulation inference acceleration, alerting thresholds, and WebSocket network routing.
            </p>
          </div>

          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-[#F59E0B] via-[#EC4899] to-[#F43F5E] hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-pink-500/25 cursor-pointer active:scale-95"
          >
            {saved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Settings Saved' : 'Save Changes'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Simulation Engine Parameters */}
          <div className={`p-6 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/5">
              <Cpu className="w-4 h-4 text-[#F59E0B]" />
              <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Simulation Engine
              </h2>
            </div>
            <div className="flex flex-col">
              <Toggle
                label="Hardware Acceleration (CUDA / Metal)"
                description="Offload PyTorch tensor calculations to the GPU for sub-second inference."
                checked={useCuda}
                onChange={setUseCuda}
              />
              <Toggle
                label="Auto-Refresh Dynamic Topology"
                description="Automatically re-sync node state when environmental heatwave surges change."
                checked={autoRefresh}
                onChange={setAutoRefresh}
              />
              <Toggle
                label="Always Show Node Labels"
                description="Keep numerical node IDs persistently rendered on the 2D topology map."
                checked={showNodeLabels}
                onChange={setShowNodeLabels}
              />
            </div>
          </div>

          {/* Alerting & Notifications */}
          <div className={`p-6 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/5">
              <Bell className="w-4 h-4 text-[#EC4899]" />
              <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Alerting & Thresholds
              </h2>
            </div>
            <div className="flex flex-col">
              <Toggle
                label="Critical Failure Beacon Overlays"
                description="Pulsate crimson alert indicators when any transmission line surpasses 85% predicted risk."
                checked={alertCritical}
                onChange={setAlertCritical}
              />
              <Toggle
                label="Audible Cascading Alarm"
                description="Emit a synthesized warning tone whenever an N-k failure cascade triggers."
                checked={soundAlarms}
                onChange={setSoundAlarms}
              />
            </div>
          </div>

          {/* Network Routing */}
          <div className={`p-6 border flex flex-col justify-between lg:col-span-2 ${cardBgClass}`}>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/5">
              <Network className="w-4 h-4 text-[#2DD4BF]" />
              <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Distributed Backend & Telemetry Endpoints
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isLight ? 'text-slate-600' : 'text-gray-400'
                }`}>
                  FastAPI Hetero Graph Backend URL
                </label>
                <input 
                  type="text" 
                  defaultValue="http://localhost:8000" 
                  className={`border rounded-xl p-3 text-sm font-mono outline-none transition-all ${inputBgClass}`} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isLight ? 'text-slate-600' : 'text-gray-400'
                }`}>
                  WebSocket Feed (Real-Time Sensor Feed)
                </label>
                <input 
                  type="text" 
                  defaultValue="ws://localhost:8000/ws" 
                  className={`border rounded-xl p-3 text-sm font-mono outline-none transition-all ${inputBgClass}`} 
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}