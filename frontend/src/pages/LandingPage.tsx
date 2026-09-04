import { Link } from 'react-router-dom';
import { Zap, ShieldAlert, Activity, ArrowRight, Radio, LayoutDashboard, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../App';

export default function LandingPage() {
  return (
    <motion.div
      className="min-h-screen bg-grid-bg text-grid-text-muted flex flex-col relative overflow-x-hidden font-sans selection:bg-grid-accent/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)', rotateX: 5 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >

      {/* 3D Moving Grid Animation Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes moveGrid {
          0% { background-position: 0 0; }
          100% { background-position: 0 50px; }
        }
        .animate-grid {
          animation: moveGrid 3s linear infinite;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .hover-3d-tilt:hover {
          transform: perspective(1000px) rotateX(10deg) rotateY(-10deg) translateZ(20px) scale(1.05);
          box-shadow: -20px 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 229, 255, 0.2);
          border-color: rgba(0, 229, 255, 0.5);
          z-index: 50;
        }
        .hover-3d-tilt-warning:hover {
          transform: perspective(1000px) rotateX(10deg) rotateY(10deg) translateZ(20px) scale(1.05);
          box-shadow: 20px 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 153, 0, 0.2);
          border-color: rgba(255, 153, 0, 0.5);
          z-index: 50;
        }
        .hover-3d-tilt-danger:hover {
          transform: perspective(1000px) rotateX(-10deg) rotateY(10deg) translateZ(20px) scale(1.05);
          box-shadow: 20px -20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          z-index: 50;
        }
      `}} />

      {/* Dynamic 3D Background Elements */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none animate-grid z-0"
           style={{
             backgroundImage: 'linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)',
             backgroundSize: '50px 50px',
             transform: 'perspective(500px) rotateX(75deg) translateY(-50px) scale(2.5)',
             transformOrigin: 'top center',
             maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
           }}
      />
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-grid-accent/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 backdrop-blur-md bg-transparent">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-grid-accent/10 border border-grid-accent/30">
            <Zap className="w-4 h-4 text-grid-accent" />
          </div>
          <span className="font-black text-grid-text text-xl tracking-[0.2em] uppercase">Grid<span className="text-grid-accent">X</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-grid-nominal bg-grid-nominal/10 px-3 py-1.5 rounded-full border border-grid-nominal/20">
            <Radio className="w-3 h-3 animate-ping" />
            SYSTEMS ONLINE
          </div>
          <a href="https://github.com/sumitsinha09-stack/GridX" target="_blank" rel="noreferrer" className="text-sm font-mono text-grid-text-muted hover:text-grid-text transition-colors">
            [ GitHub ]
          </a>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Hero Section (Center-Aligned) */}
      <main className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto w-full px-8 pt-16 pb-8">

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-grid-warning/10 border border-grid-warning/30 text-grid-warning text-[10px] font-mono mb-8 uppercase tracking-widest">
          <Activity className="w-3 h-3" /> Real-time IEEE 39-Bus Simulator
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-grid-text mb-6 tracking-tighter leading-[1.1] max-w-4xl">
          Stop Cascading Failures <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-grid-accent to-[#0055ff]">Before They Happen.</span>
        </h1>

        <p className="text-lg text-grid-text-muted max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          GridX leverages PyTorch Graph Attention Networks (GAT) to instantly predict multi-sector blackouts and protect modern power grids from catastrophic collapse.
        </p>

        <Link
          to="/app"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold text-sm tracking-widest uppercase rounded-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] mb-16"
        >
          <span className="relative z-10 flex items-center gap-3">
            Initialize Telemetry Hub <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-grid-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
        </Link>

        {/* 3D Tilted Dashboard Showcase */}
        <div className="relative w-full max-w-6xl mx-auto mt-4" style={{ perspective: '1200px' }}>

          {/* Glowing aura behind the dashboard */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 bg-grid-accent/20 blur-[100px] pointer-events-none" />

          {/* The Dashboard Mockup */}
          <div
            className="w-full h-[450px] bg-grid-bg border border-grid-border rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative z-10 transition-transform duration-1000 ease-out hover:rotate-x-0"
            style={{ transform: 'rotateX(15deg) translateY(-20px) scale(1.05)', transformStyle: 'preserve-3d' }}
          >
            {/* Mock Header */}
            <div className="h-10 border-b border-grid-border bg-grid-panel-alt flex items-center px-4 gap-2">
               <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-grid-danger" />
                 <div className="w-2.5 h-2.5 rounded-full bg-grid-warning" />
                 <div className="w-2.5 h-2.5 rounded-full bg-grid-nominal" />
               </div>
               <div className="mx-auto w-64 h-4 bg-grid-bg-alt rounded-md border border-grid-border flex items-center justify-center">
                 <span className="text-[8px] text-grid-text-dim font-mono tracking-widest">GRIDX-TELEMETRY-FEED</span>
               </div>
            </div>

            {/* Mock Layout Body */}
            <div className="flex-1 flex bg-grid-bg">
               {/* Mock Left Sidebar */}
               <div className="w-1/4 h-full border-r border-grid-border p-4 flex flex-col gap-3 opacity-60">
                  <div className="w-full h-8 bg-grid-panel rounded border border-grid-border" />
                  <div className="w-full h-24 bg-grid-panel rounded border border-grid-border mt-4" />
                  <div className="w-full h-8 bg-grid-accent/20 border border-grid-accent/40 rounded mt-auto" />
               </div>

               {/* Mock Center Graph Canvas */}
               <div className="flex-1 h-full relative flex items-center justify-center overflow-hidden">
                 {/* Abstract Grid Map */}
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #1b1d27 2px, transparent 2px)', backgroundSize: '20px 20px' }} />
                 <div className="relative w-64 h-64 border border-grid-border rounded-full flex items-center justify-center animate-[spin_30s_linear_infinite]">
                    <div className="w-full h-px bg-white/10 absolute top-1/2" />
                    <div className="h-full w-px bg-white/10 absolute left-1/2" />
                    <div className="absolute top-4 left-10 w-3 h-3 bg-grid-accent rounded-full shadow-[0_0_10px_#00e5ff]" />
                    <div className="absolute bottom-8 right-12 w-3 h-3 bg-grid-warning rounded-full shadow-[0_0_10px_#ff9900]" />
                    <div className="absolute top-20 right-8 w-4 h-4 bg-grid-danger rounded-full shadow-[0_0_20px_#ef4444] animate-pulse" />
                 </div>
                 <div className="absolute center w-12 h-12 border-2 border-grid-accent rounded-full flex items-center justify-center backdrop-blur-md">
                    <Target className="w-5 h-5 text-grid-text" />
                 </div>
               </div>

               {/* Mock Right Sidebar */}
               <div className="w-1/4 h-full border-l border-grid-border p-4 flex flex-col gap-3 opacity-60">
                  <div className="w-full h-24 bg-grid-danger/10 border border-grid-danger/30 rounded flex items-center justify-center">
                    <div className="text-3xl font-black text-grid-danger">89%</div>
                  </div>
                  <div className="w-full h-12 bg-grid-panel rounded border border-grid-border mt-2" />
                  <div className="w-full h-12 bg-grid-panel rounded border border-grid-border" />
               </div>
            </div>

            {/* Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none mix-blend-overlay" />
          </div>
        </div>

      </main>

      {/* Architecture / Pipeline Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-8 py-24 border-t border-grid-border">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-grid-text mb-4 tracking-tight">Built for Mission-Critical Environments</h2>
          <p className="text-grid-text-muted max-w-2xl mx-auto text-lg font-light">
            GridX transforms raw grid telemetry into actionable disaster-prevention intelligence using a state-of-the-art AI pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Step 1 */}
           <div className="bg-grid-bg-alt/80 backdrop-blur border border-grid-border p-8 rounded-2xl relative overflow-hidden group hover-3d-tilt transition-all duration-300 preserve-3d cursor-default">
             <div className="text-8xl font-black text-grid-text/[0.02] absolute -top-6 -right-2 group-hover:text-grid-accent/10 transition-colors transform translate-z-[10px]">01</div>
             <Radio className="w-8 h-8 text-grid-accent mb-6 relative z-10 transform translate-z-[20px]" />
             <h3 className="text-xl font-bold text-grid-text mb-3 relative z-10 transform translate-z-[30px]">Live Telemetry Ingestion</h3>
             <p className="text-grid-text-dim text-sm leading-relaxed relative z-10 transform translate-z-[20px]">
               Continuously monitors the Active Power (Pd), Reactive Power (Qd), and physical branch status of the IEEE 39-Bus network.
             </p>
           </div>

           {/* Step 2 */}
           <div className="bg-grid-bg-alt/80 backdrop-blur border border-grid-border p-8 rounded-2xl relative overflow-hidden group hover-3d-tilt-warning transition-all duration-300 preserve-3d cursor-default">
             <div className="text-8xl font-black text-grid-text/[0.02] absolute -top-6 -right-2 group-hover:text-grid-warning/10 transition-colors transform translate-z-[10px]">02</div>
             <Target className="w-8 h-8 text-grid-warning mb-6 relative z-10 transform translate-z-[20px]" />
             <h3 className="text-xl font-bold text-grid-text mb-3 relative z-10 transform translate-z-[30px]">Monte Carlo Stress Testing</h3>
             <p className="text-grid-text-dim text-sm leading-relaxed relative z-10 transform translate-z-[20px]">
               Simulates thousands of N-k contingencies by injecting environmental heatwaves and forcing random physical transmission line outages.
             </p>
           </div>

           {/* Step 3 */}
           <div className="bg-grid-bg-alt/80 backdrop-blur border border-grid-border p-8 rounded-2xl relative overflow-hidden group hover-3d-tilt-danger transition-all duration-300 preserve-3d cursor-default">
             <div className="text-8xl font-black text-grid-text/[0.02] absolute -top-6 -right-2 group-hover:text-grid-danger/10 transition-colors transform translate-z-[10px]">03</div>
             <ShieldAlert className="w-8 h-8 text-grid-danger mb-6 relative z-10 transform translate-z-[20px]" />
             <h3 className="text-xl font-bold text-grid-text mb-3 relative z-10 transform translate-z-[30px]">GNN Cascade Prediction</h3>
             <p className="text-grid-text-dim text-sm leading-relaxed relative z-10 transform translate-z-[20px]">
               The PyTorch Graph Attention Network analyzes the shifted spatial grid topology to instantly map the exact path of the ensuing blackout.
             </p>
           </div>
        </div>
      </section>

      {/* Feature Cards Footer */}
      <footer className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-8 py-16 bg-grid-bg border-t border-grid-border mt-auto max-w-7xl mx-auto w-full perspective-[1000px]">
        <div className="flex flex-col items-center text-center p-6 hover-3d-tilt transition-all duration-300 preserve-3d cursor-default rounded-2xl bg-grid-panel">
          <div className="w-12 h-12 bg-grid-accent/10 border border-grid-accent/30 rounded-xl flex items-center justify-center mb-4 transform translate-z-[30px]">
            <LayoutDashboard className="w-6 h-6 text-grid-accent" />
          </div>
          <h3 className="font-bold text-grid-text text-lg mb-2 transform translate-z-[20px]">Graph Neural Networks</h3>
          <p className="text-sm text-grid-text-dim font-light leading-relaxed transform translate-z-[10px]">Spatial analysis of grid topology to accurately predict the melting probabilities of high-voltage transmission lines under immense stress.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 hover-3d-tilt-warning transition-all duration-300 preserve-3d cursor-default rounded-2xl bg-grid-panel">
          <div className="w-12 h-12 bg-grid-warning/10 border border-grid-warning/30 rounded-xl flex items-center justify-center mb-4 transform translate-z-[30px]">
            <Activity className="w-6 h-6 text-grid-warning" />
          </div>
          <h3 className="font-bold text-grid-text text-lg mb-2 transform translate-z-[20px]">Real-Time Simulation</h3>
          <p className="text-sm text-grid-text-dim font-light leading-relaxed transform translate-z-[10px]">Inject external heatwave stress and manually trip lines via the dashboard to witness instantaneous physics recalculations.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 hover-3d-tilt-danger transition-all duration-300 preserve-3d cursor-default rounded-2xl bg-grid-panel">
          <div className="w-12 h-12 bg-grid-danger/10 border border-grid-danger/30 rounded-xl flex items-center justify-center mb-4 transform translate-z-[30px]">
            <ShieldAlert className="w-6 h-6 text-grid-danger" />
          </div>
          <h3 className="font-bold text-grid-text text-lg mb-2 transform translate-z-[20px]">Disaster Prevention</h3>
          <p className="text-sm text-grid-text-dim font-light leading-relaxed transform translate-z-[10px]">Prioritize vulnerable nodes and critical branches to prevent multi-infrastructure collapse before a blackout event begins.</p>
        </div>
      </footer>
    </motion.div>
  );
}