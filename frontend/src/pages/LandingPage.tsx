import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ThemeToggle } from '../App';
import { prefetchBaselineSimulation } from '../lib/simulationCache';

interface LayerInfo {
  id: 'healthcare' | 'telecom' | 'water' | 'power';
  name: string;
  label: string;
  color: string;
  glowColor: string;
  borderColor: string;
  textColor: string;
  bgGradient: string;
  nodes: { x: number; y: number; r: number; pulse?: boolean; tripped?: boolean }[];
  accentText: string;
}

const LAYERS: LayerInfo[] = [
  {
    id: 'healthcare',
    name: 'Healthcare',
    label: 'HEALTHCARE',
    color: '#F43F5E',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    borderColor: 'rgba(244, 63, 94, 0.45)',
    textColor: 'text-rose-400',
    bgGradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0.02) 100%)',
    nodes: [
      { x: 30, y: 35, r: 3.5 },
      { x: 55, y: 25, r: 4.5, pulse: true },
      { x: 74, y: 36, r: 4 },
      { x: 42, y: 65, r: 3.5 },
      { x: 68, y: 72, r: 4.5, pulse: true }
    ],
    accentText: '289 Hospitals'
  },
  {
    id: 'telecom',
    name: 'Telecom',
    label: 'TELECOM',
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    borderColor: 'rgba(168, 85, 247, 0.45)',
    textColor: 'text-purple-400',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0.02) 100%)',
    nodes: [
      { x: 25, y: 45, r: 3.5 },
      { x: 45, y: 30, r: 4, pulse: true },
      { x: 62, y: 50, r: 4.5 },
      { x: 78, y: 32, r: 3.5 },
      { x: 52, y: 75, r: 4 }
    ],
    accentText: '624 Cell Towers'
  },
  {
    id: 'water',
    name: 'Water',
    label: 'WATER',
    color: '#2DD4BF',
    glowColor: 'rgba(45, 212, 191, 0.45)',
    borderColor: 'rgba(45, 212, 191, 0.45)',
    textColor: 'text-teal-400',
    bgGradient: 'linear-gradient(135deg, rgba(45, 212, 191, 0.12) 0%, rgba(45, 212, 191, 0.02) 100%)',
    nodes: [
      { x: 28, y: 38, r: 3.5 },
      { x: 50, y: 55, r: 4.5, pulse: true },
      { x: 70, y: 45, r: 3.5 },
      { x: 38, y: 70, r: 4 },
      { x: 80, y: 65, r: 3.5 }
    ],
    accentText: '4 Mega Pumps'
  },
  {
    id: 'power',
    name: 'Power',
    label: 'POWER',
    color: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.45)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
    textColor: 'text-amber-400',
    bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.02) 100%)',
    nodes: [
      { x: 22, y: 40, r: 4 },
      { x: 46, y: 35, r: 5, pulse: true, tripped: true },
      { x: 65, y: 60, r: 3.5 },
      { x: 82, y: 42, r: 4 },
      { x: 35, y: 75, r: 3.5 }
    ],
    accentText: '39 IEEE Substations'
  }
];

export default function LandingPage() {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  // Mouse tilt physics using Framer Motion
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 90, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 90, damping: 20 });

  // 3D rotation transforms
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [64, 52]);
  const rotateZ = useTransform(smoothX, [-0.5, 0.5], [-42, -34]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const domRect = containerRef.current.getBoundingClientRect();
      rectRef.current = { left: domRect.left, top: domRect.top, width: domRect.width, height: domRect.height };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    let r = rectRef.current;
    if (!r && containerRef.current) {
      const domRect = containerRef.current.getBoundingClientRect();
      r = { left: domRect.left, top: domRect.top, width: domRect.width, height: domRect.height };
      rectRef.current = r;
    }
    if (!r || r.width === 0 || r.height === 0) return;
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    prefetchBaselineSimulation();
  }, []);

  return (
    <div className="min-h-screen h-screen bg-[#0c0716] text-[#e2d9f3] flex flex-col justify-between overflow-x-hidden overflow-y-auto lg:overflow-hidden font-sans selection:bg-[#EC4899]/30">
      
      {/* Dynamic Ambient Background Glows optimized for Safari GPU rendering */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transform-gpu">
        <div 
          className="absolute -top-[10%] right-[10%] w-[680px] h-[680px] rounded-full opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #EC4899 35%, transparent 65%)' }}
        />
        <div 
          className="absolute top-[20%] left-[-8%] w-[550px] h-[550px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, #E11D48 40%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[25%] w-[700px] h-[700px] rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, #10B981 35%, transparent 65%)' }}
        />
      </div>

      {/* Top Navbar */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-6 pb-2 flex items-center justify-between shrink-0">
        {/* Left: Brand with Pill Subtitle */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-black text-2xl tracking-tight text-white group-hover:opacity-90 transition-opacity">
              GRID<span className="text-[#F59E0B]">X</span>
            </span>
          </Link>
          
          <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[11px] font-mono text-[#a19ab5]">
            GridX – Critical Infrastructure Telemetry
          </div>
        </div>

        {/* Right Navigation */}
        <nav className="flex items-center gap-6 md:gap-8 text-sm font-medium text-[#c0b8d4]">
          <Link to="/app/topology" className="hover:text-white transition-colors">
            Platform
          </Link>
          <Link to="/app/telemetry" className="hover:text-white transition-colors">
            Sectors
          </Link>
          <Link to="/app/analytics" className="hover:text-white transition-colors">
            Analytics
          </Link>
          <a 
            href="https://github.com/sumitsinha09-stack/GridX" 
            target="_blank" 
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <div className="pl-2 border-l border-white/10">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 flex flex-col justify-center py-2 lg:py-0">
        
        {/* Hero Row: Left Copy & Right 3D Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-6 flex flex-col items-start max-w-xl">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#261730]/70 border border-[#F59E0B]/30 text-[#FBBF24] text-[11px] font-mono font-bold tracking-widest uppercase mb-5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <span>IEEE 39-BUS</span>
              <span className="w-1 h-1 rounded-full bg-[#FBBF24]" />
              <span>LIVE TWIN</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-white leading-[1.08] tracking-tight mb-4">
              One tripped bus.<br />
              <span className="text-[#FBBF24]">Four </span>
              <span className="bg-gradient-to-r from-[#F97316] via-[#FB7185] to-[#F43F5E] bg-clip-text text-transparent">
                sectors 
              </span>{' '}
              <span className="bg-gradient-to-r from-[#F43F5E] via-[#D946EF] to-[#818CF8] bg-clip-text text-transparent">
                at risk.
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#a19ab5] leading-relaxed mb-7 max-w-lg font-normal">
              GridX stacks power, water, telecom and healthcare into one live model, so you can see a cascade before it reaches a hospital.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Link
                to="/app/topology"
                onMouseEnter={() => prefetchBaselineSimulation()}
                className="relative inline-flex items-center justify-center px-7 py-3 rounded-full font-bold text-sm text-[#18051e] tracking-wide transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_35px_rgba(244,63,94,0.45)] group overflow-hidden"
                style={{
                  background: 'linear-gradient(90deg, #F59E0B 0%, #EC4899 50%, #F43F5E 100%)'
                }}
              >
                <span className="relative z-10 flex items-center gap-2 font-extrabold text-[#1a0520]">
                  Initialize Telemetry Hub
                </span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <a
                href="https://github.com/sumitsinha09-stack/GridX"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-sm text-white bg-white/[0.04] border border-white/20 hover:bg-white/[0.08] hover:border-white/40 transition-all duration-200"
              >
                GitHub
              </a>
            </div>

            {/* Sector Color Legend (Vertical Stack Matching Mockup) */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-col gap-2 text-xs font-medium text-[#c0b8d4]">
                {LAYERS.slice().reverse().map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setHoveredLayer(hoveredLayer === layer.id ? null : layer.id)}
                    className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors group"
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-[3px] transition-transform duration-200 group-hover:scale-110 shadow-sm"
                      style={{ 
                        backgroundColor: layer.color,
                        boxShadow: `0 0 8px ${layer.glowColor}`
                      }}
                    />
                    <span className={hoveredLayer === layer.id ? 'text-white font-bold' : ''}>
                      {layer.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: 3D Stacked Isometric Planes */}
          <div 
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="lg:col-span-6 relative flex items-center justify-center h-[380px] sm:h-[430px] select-none cursor-grab active:cursor-grabbing transform-gpu"
            style={{ perspective: 1200 }}
          >
            {/* Interactive 3D Canvas Rig */}
            <motion.div
              className="relative w-[320px] sm:w-[390px] h-[300px] sm:h-[350px] flex items-center justify-center"
              style={{
                transformStyle: 'preserve-3d',
                rotateX,
                rotateZ,
                rotateY
              }}
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {/* Vertical Cascading Energy Conduit connecting layers */}
              <div 
                className="absolute pointer-events-none"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(-20px)',
                  left: '46%',
                  top: '36%',
                  width: '2px',
                  height: '240px'
                }}
              >
                <div 
                  className="w-full h-full border-l border-dashed border-rose-400/50 opacity-60"
                  style={{
                    transform: 'rotateX(-90deg)',
                    transformOrigin: 'top left'
                  }}
                />
              </div>

              {/* 4 Stacked Isometric Layers */}
              {LAYERS.map((layer, index) => {
                const stackIndex = 3 - index; // 0 for power, 1 for water, 2 for telecom, 3 for healthcare
                const baseZ = isExploded ? stackIndex * 85 : stackIndex * 58;
                const isCurrentHovered = hoveredLayer === layer.id;
                const elevationZ = isCurrentHovered ? baseZ + 25 : baseZ;

                return (
                  <motion.div
                    key={layer.id}
                    onMouseEnter={() => setHoveredLayer(layer.id)}
                    onMouseLeave={() => setHoveredLayer(null)}
                    className="absolute w-[290px] sm:w-[350px] h-[180px] sm:h-[210px] rounded-[24px] border transition-all duration-300 cursor-pointer"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: `translateZ(${elevationZ}px)`,
                      background: isCurrentHovered 
                        ? layer.bgGradient.replace('0.12', '0.24') 
                        : layer.bgGradient,
                      borderColor: isCurrentHovered ? layer.color : layer.borderColor,
                      boxShadow: isCurrentHovered 
                        ? `0 0 35px ${layer.glowColor}, inset 0 0 20px ${layer.glowColor}`
                        : `0 0 15px ${layer.glowColor}`
                    }}
                  >
                    {/* Inner Glass Highlights */}
                    <div 
                      className="absolute inset-0 rounded-[24px] pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 60%)'
                      }}
                    />

                    {/* Nodes Scatter */}
                    {layer.nodes.map((node, nodeIdx) => (
                      <div
                        key={nodeIdx}
                        className="absolute rounded-full transition-all duration-300"
                        style={{
                          left: `${node.x}%`,
                          top: `${node.y}%`,
                          width: `${node.r * 2}px`,
                          height: `${node.r * 2}px`,
                          backgroundColor: node.tripped ? '#EF4444' : layer.color,
                          boxShadow: `0 0 ${node.pulse ? '16px' : '8px'} ${node.tripped ? '#EF4444' : layer.color}`
                        }}
                      >
                        {node.pulse && (
                          <div 
                            className="absolute -inset-1 rounded-full animate-ping opacity-75"
                            style={{ backgroundColor: node.tripped ? '#EF4444' : layer.color }}
                          />
                        )}
                      </div>
                    ))}

                    {/* Sector Label on Right Edge */}
                    <div className="absolute right-4 bottom-3 sm:right-5 sm:bottom-3.5 pointer-events-none">
                      <span 
                        className="text-[10px] sm:text-[11px] font-mono font-black tracking-[0.25em] uppercase opacity-90 transition-opacity"
                        style={{ 
                          color: layer.color,
                          textShadow: `0 0 10px ${layer.glowColor}`
                        }}
                      >
                        {layer.label}
                      </span>
                    </div>

                    {/* Hover Tooltip */}
                    {isCurrentHovered && (
                      <div className="absolute left-4 top-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[9px] font-mono text-white/90">
                        {layer.accentText}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            {/* 3D Explode Button */}
            <div className="absolute bottom-1 right-2 flex items-center gap-2">
              <button
                onClick={() => setIsExploded(!isExploded)}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 hover:border-white/30 text-[10px] font-mono text-[#a19ab5] hover:text-white transition-all shadow-sm cursor-pointer"
                title="Toggle Expanded Layer Spacing"
              >
                {isExploded ? 'Collapse Stack' : 'Explode 3D Stack'}
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Bottom Section: 4 Stat Cards */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-12 pb-6 pt-2 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Substations */}
          <div className="group rounded-2xl p-5 bg-[#130b24] border border-white/10 shadow-lg hover:border-white/20 transition-all duration-300 hover:bg-[#180e2e]">
            <div className="text-3xl sm:text-4xl font-black text-[#FBBF24] tracking-tight mb-1 font-sans">
              39
            </div>
            <div className="text-xs sm:text-sm font-medium text-[#a19ab5]">
              Substations
            </div>
          </div>

          {/* Card 2: Cell Towers */}
          <div className="group rounded-2xl p-5 bg-[#130b24] border border-white/10 shadow-lg hover:border-white/20 transition-all duration-300 hover:bg-[#180e2e]">
            <div className="text-3xl sm:text-4xl font-black text-[#A855F7] tracking-tight mb-1 font-sans">
              624
            </div>
            <div className="text-xs sm:text-sm font-medium text-[#a19ab5]">
              Cell towers
            </div>
          </div>

          {/* Card 3: Hospitals */}
          <div className="group rounded-2xl p-5 bg-[#130b24] border border-white/10 shadow-lg hover:border-white/20 transition-all duration-300 hover:bg-[#180e2e]">
            <div className="text-3xl sm:text-4xl font-black text-[#F43F5E] tracking-tight mb-1 font-sans">
              289
            </div>
            <div className="text-xs sm:text-sm font-medium text-[#a19ab5]">
              Hospitals
            </div>
          </div>

          {/* Card 4: Decay Horizon */}
          <div className="group rounded-2xl p-5 bg-[#130b24] border border-white/10 shadow-lg hover:border-white/20 transition-all duration-300 hover:bg-[#180e2e]">
            <div className="text-3xl sm:text-4xl font-black text-[#2DD4BF] tracking-tight mb-1 font-sans">
              72h
            </div>
            <div className="text-xs sm:text-sm font-medium text-[#a19ab5]">
              Decay horizon
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}