// src/components/KPISparklineSection.tsx
// STRATFIT — HYBRID COCKPIT
// "2-Bar + 1-Dial" Flight Deck Layout with Jewel Hardware Aesthetic

import React, { useMemo, useEffect, useState, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { useUIStore } from "@/state/uiStore";

// ============================================================================
// JEWEL MODULE — High-Contrast Titanium Rectangular Chassis
// ============================================================================

interface JewelModuleProps {
  isActive: boolean;
  children: React.ReactNode;
  theme?: 'cyan' | 'amber';
}

const JewelModule = ({ isActive, children, theme = 'cyan' }: JewelModuleProps) => {
  const activeBorderColor = theme === 'cyan' ? 'border-cyan-400/50' : 'border-amber-400/50';
  const activeGlow = theme === 'cyan' 
    ? '0 0 50px -5px rgba(0,217,255,0.4)' 
    : '0 0 50px -5px rgba(245,158,11,0.4)';
  
  // Pulse colors for idle state
  const pulseColor = theme === 'cyan' ? 'rgba(34, 211, 238, 0.15)' : 'rgba(245, 158, 11, 0.15)';

  return (
    <div 
      className={`
        relative h-32 w-full flex flex-col rounded-lg transition-all duration-200 ease-out group overflow-hidden
        border
        ${isActive 
          ? `-translate-y-1 z-20 ${activeBorderColor} bg-[#0f172a]` 
          : 'z-10 border-white/10 bg-[#0b1221]'
        }
      `}
      style={{
        boxShadow: isActive 
          ? `${activeGlow}, 0 20px 50px -10px rgba(0,0,0,0.8)`
          : '0 10px 40px -10px rgba(0,0,0,0.7), 0 4px 12px -4px rgba(0,0,0,0.5)',
        animation: isActive ? 'none' : 'kpiPulse 3s ease-in-out infinite',
      }}
    >
      {/* PULSING BORDER RIM — The Heartbeat (Always Active) */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          border: '1px solid transparent',
          background: `linear-gradient(#0b1221, #0b1221) padding-box, 
                       linear-gradient(135deg, ${pulseColor}, transparent 50%, ${pulseColor}) border-box`,
          animation: isActive ? 'kpiPulseActive 1s ease-in-out infinite' : 'kpiPulse 3s ease-in-out infinite',
        }}
      />
      
      {/* SCANLINE EFFECT — Constant Motion (The Machine is Alive) */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent pointer-events-none"
        style={{
          animation: 'shimmer 4s ease-in-out infinite',
          opacity: isActive ? 0.4 : 0.15,
        }}
      />
      
      {/* 1. The "Wet Glass" Highlight (Top Reflection) — Sharp light catch */}
      <div 
        className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
        style={{ opacity: isActive ? 1 : 0.7 }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent pointer-events-none rounded-lg" />

      {/* 2. The "Stepped" Hardware Bezel — Outer mounting plate */}
      <div 
        className="absolute -inset-[3px] rounded-xl border pointer-events-none -z-10"
        style={{
          borderColor: isActive ? pulseColor : 'rgba(255,255,255,0.08)',
          animation: isActive ? 'bezelPulse 1.5s ease-in-out infinite' : 'bezelPulse 4s ease-in-out infinite',
        }}
      />

      {/* 3. The Mounting Bolts — Mechanical anchors */}
      <div className="absolute top-2 left-2 w-1 h-1 bg-[#334155] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)]" />
      <div className="absolute top-2 right-2 w-1 h-1 bg-[#334155] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)]" />
      <div className="absolute bottom-2 left-2 w-1 h-1 bg-[#334155] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)]" />
      <div className="absolute bottom-2 right-2 w-1 h-1 bg-[#334155] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)]" />

      {/* Content Layer */}
      <div className="relative z-10 h-full w-full px-6 py-4 flex items-center">
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// JEWEL REACTOR — High-Contrast Titanium Circular Chassis
// ============================================================================

interface JewelReactorProps {
  isActive: boolean;
  children: React.ReactNode;
  riskLevel: number;
}

const JewelReactor = ({ isActive, children, riskLevel }: JewelReactorProps) => {
  const isHighRisk = riskLevel > 60;
  const isCritical = riskLevel > 80;
  
  const glowColor = !isActive 
    ? 'rgba(0,0,0,0.3)'
    : isCritical 
      ? 'rgba(239, 68, 68, 0.6)'
      : isHighRisk 
        ? 'rgba(245, 158, 11, 0.6)'
        : 'rgba(52, 211, 153, 0.5)';
  
  const ringColor = !isActive 
    ? 'border-slate-600/50' 
    : isCritical 
      ? 'border-red-500/70'
      : isHighRisk 
        ? 'border-amber-500/70'
        : 'border-emerald-400/70';

  const burnBorderColor = !isActive 
    ? 'border-transparent' 
    : isCritical 
      ? 'border-red-500/60'
      : isHighRisk 
        ? 'border-amber-500/60'
        : 'border-emerald-400/50';

  return (
    <div 
      className={`
        relative h-32 w-32 flex items-center justify-center rounded-full 
        transition-all duration-300 ease-out flex-shrink-0 ml-auto
        bg-[#0b1221]
        ${isActive ? 'scale-105 z-20' : 'z-10'}
      `}
      style={{
        boxShadow: isActive 
          ? `0 0 50px -5px ${glowColor}, 0 20px 50px -10px rgba(0,0,0,0.8)`
          : '0 10px 40px -10px rgba(0,0,0,0.7), 0 4px 12px -4px rgba(0,0,0,0.5)',
      }}
    >
      {/* Outer Metal Rim (Stepped) — The mounting plate */}
      <div className="absolute -inset-[4px] rounded-full border border-white/10 bg-[#1e293b] -z-10" />
      
      {/* Inner Machined Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-slate-700/50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]" />
      
      {/* The Active "Burn" Ring — Glows when active */}
      <div className={`
        absolute inset-[-2px] rounded-full border-2 transition-all duration-300
        ${burnBorderColor}
        ${isActive ? 'blur-[2px]' : ''}
      `} />

      {/* IDLE RADAR RING — Always spinning slowly (The Machine is Monitoring) */}
      <div 
        className="absolute inset-[6px] rounded-full border-t border-slate-500/30 animate-spin"
        style={{ animationDuration: '12s' }}
      />

      {/* Spinning Indicator Ring — Slow idle, Fast active */}
      <div 
        className={`
          absolute inset-[10px] rounded-full border-t-2 border-r transition-colors duration-300 animate-spin
          ${ringColor}
        `}
        style={{ animationDuration: isActive ? '1.5s' : '8s' }}
      />
      
      {/* Counter Spinning Ring — Slow idle, Fast active (reverse) */}
      <div 
        className={`
          absolute inset-[18px] rounded-full border-b-2 border-l transition-colors duration-300 animate-spin
          ${ringColor}
        `}
        style={{ 
          animationDuration: isActive ? '2s' : '10s', 
          animationDirection: 'reverse' 
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// WIDGET: HORIZONTAL EQUALIZER — Compact bars
// ============================================================================

interface HorizontalEqualizerProps {
  isActive: boolean;
  isDragging: boolean;
}

const IDLE_HEIGHTS = [25, 40, 30, 55, 35, 60, 45, 70, 40, 50, 35, 45];

const HorizontalEqualizer = memo(function HorizontalEqualizer({ 
  isActive, 
  isDragging 
}: HorizontalEqualizerProps) {
  const [tick, setTick] = useState(0);
  
  // ALWAYS animate — slow sonar when idle, fast pulse when active
  useEffect(() => {
    const speed = isDragging ? 50 : isActive ? 100 : 300; // Faster when active
    const interval = setInterval(() => setTick(t => t + 1), speed);
    return () => clearInterval(interval);
  }, [isActive, isDragging]);

  return (
    <div className="flex items-end h-14 flex-1 gap-[2px] ml-4 pb-1">
      {IDLE_HEIGHTS.map((baseH, i) => {
        let height: number;
        
        if (isDragging) {
          // REACTOR OVERLOAD: Random rapid heights
          height = Math.random() * 70 + 30;
        } else if (isActive) {
          // ACTIVE: Fast animated wave
          height = baseH + Math.sin((tick + i) * 0.4) * 20;
        } else {
          // IDLE: Slow submarine sonar wave (always moving)
          height = 25 + Math.sin((tick * 0.15) + i * 0.5) * 12;
        }
        
        return (
          <div 
            key={i} 
            className={`
              flex-1 rounded-[1px] transition-all
              ${isDragging 
                ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]'  // OVERLOAD: White strobe
                : isActive 
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' // ACTIVE: Neon cyan
                  : 'bg-cyan-900/60'  // IDLE: Dim cyan glow
              }
            `}
            style={{ 
              height: `${height}%`,
              transitionDuration: isDragging ? '40ms' : isActive ? '100ms' : '400ms',
              animationDelay: `${i * 0.05}s`,
            }} 
          />
        );
      })}
    </div>
  );
});

// ============================================================================
// WIDGET: MINI SPARKLINE — Compact wave
// ============================================================================

interface MiniSparklineProps {
  isActive: boolean;
  value01: number;
}

const MiniSparkline = memo(function MiniSparkline({ isActive, value01 }: MiniSparklineProps) {
  const [scanPos, setScanPos] = useState(0);
  const [wavePhase, setWavePhase] = useState(0);
  
  // ALWAYS animate — slow crawl when idle, fast scan when active
  useEffect(() => {
    const speed = isActive ? 25 : 80; // Faster when active
    const interval = setInterval(() => {
      setScanPos(p => (p + (isActive ? 2.5 : 0.8)) % 100);
      setWavePhase(p => p + (isActive ? 0.08 : 0.02));
    }, speed);
    return () => clearInterval(interval);
  }, [isActive]);

  const points = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const x = i * (100 / 29);
      const wave = Math.sin((i / 29) * Math.PI * 2 + value01 * 3 + wavePhase) * 20;
      const y = 50 - wave * value01;
      return `${x},${y}`;
    }).join(' ');
  }, [value01, wavePhase]);

  return (
    <div className="relative h-10 flex-1 ml-4 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Fill Area */}
        <path 
          d={`M0,100 L0,${50 - Math.sin(value01 * 3 + wavePhase) * 20 * value01} ${points.split(' ').map((p) => `L${p}`).join(' ')} L100,100 Z`}
          fill={isActive ? 'rgba(34, 211, 238, 0.12)' : 'rgba(99, 102, 241, 0.05)'}
          className="transition-all duration-500"
        />
        {/* The Wave Line */}
        <polyline 
          points={points}
          fill="none"
          stroke={isActive ? '#22d3ee' : '#6366f1'}
          strokeWidth={isActive ? '2.5' : '1.5'}
          strokeLinecap="round"
          className="transition-all duration-300"
          style={{ 
            filter: isActive ? 'drop-shadow(0 0 4px rgba(34,211,238,0.6))' : 'drop-shadow(0 0 2px rgba(99,102,241,0.3))',
          }}
        />
        {/* Scanner Dot — Always moving */}
        <circle 
          cx={scanPos} 
          cy={50 - Math.sin((scanPos / 100) * Math.PI * 2 + value01 * 3 + wavePhase) * 20 * value01}
          r={isActive ? '3' : '2'}
          fill={isActive ? '#ffffff' : '#818cf8'}
          className="transition-all duration-300"
          style={{ 
            filter: isActive 
              ? 'drop-shadow(0 0 6px #22d3ee)' 
              : 'drop-shadow(0 0 3px rgba(129,140,248,0.5))',
          }}
        />
      </svg>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT — HYBRID COCKPIT: 2 Bars + 1 Dial
// ============================================================================

export default function KPISparklineSection() {
  const { activeScenarioId, engineResults } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
    }))
  );

  const { activeGroup, isDragging } = useUIStore(
    useShallow((s) => ({
      activeGroup: s.activeGroup,
      isDragging: s.isDragging,
    }))
  );
  
  const engineResult = engineResults?.[activeScenarioId];
  const kpis = engineResult?.kpis || {};

  // TARGETED ACTIVATION (mapped to slider groups)
  const isResilienceActive = activeGroup === 'efficiency';
  const isMomentumActive = activeGroup === 'growth';
  const isRiskActive = activeGroup === 'risk';

  // Extract KPI values
  const cash = kpis.cashPosition?.display ?? "$—";
  const runway = kpis.runway?.display ?? "—";
  const runwayValue = kpis.runway?.value ?? 24;
  
  const momentum = kpis.momentum?.display ?? "$—";
  const arr = kpis.arrGrowthPct?.display ?? "—";
  const momentumValue = kpis.momentum?.value ?? 50;
  
  const riskScore = 100 - (kpis.riskIndex?.value ?? 50);
  const stabilityPct = Math.round(100 - riskScore);

  const isRunwayStrong = runwayValue >= 24;
  const isGrowthPositive = (kpis.arrGrowthPct?.value ?? 0) > 0;

  // Stability status colors
  const isHighRisk = riskScore > 60;
  const isCritical = riskScore > 80;
  const stabilityColor = !isRiskActive 
    ? 'text-slate-500'
    : isCritical 
      ? 'text-red-400'
      : isHighRisk 
        ? 'text-amber-400'
        : 'text-emerald-400';
  
  const barColor = !isRiskActive 
    ? 'bg-slate-700'
    : isCritical 
      ? 'bg-red-500'
      : isHighRisk 
        ? 'bg-amber-500'
        : 'bg-emerald-400';

  return (
    <div className="kpi-sparkline-section">
      {/* THE HYBRID COCKPIT: 2 Glass Screens + 1 Standalone Reactor */}
      <div className="grid grid-cols-[1.2fr_1.2fr_0.6fr] gap-6 w-full max-w-6xl mx-auto items-center">
        
        {/* ═══════════════════════════════════════════════════════════════
            MODULE 1: RESILIENCE — Glass Brick Screen + Equalizer
           ═══════════════════════════════════════════════════════════════ */}
        <JewelModule isActive={isResilienceActive} theme="cyan">
          <div className="flex justify-between items-center w-full h-full gap-4">
            {/* Data Stack — HERO TYPOGRAPHY */}
            <div className="flex flex-col justify-center min-w-[100px]">
              <div className={`text-[10px] uppercase tracking-[0.2em] font-semibold mb-1 transition-colors duration-300 ${isResilienceActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                Resilience
              </div>
              <div className={`text-3xl font-bold tracking-tight transition-colors duration-300 drop-shadow-lg ${isResilienceActive ? 'text-white' : 'text-slate-300'}`}>
                {cash}
              </div>
              <div className={`text-[10px] mt-1 font-mono uppercase transition-colors duration-300 ${isRunwayStrong ? 'text-emerald-400' : 'text-amber-400'}`}>
                Runway: {runway}
              </div>
            </div>
            
            {/* Equalizer Widget */}
            <HorizontalEqualizer 
              isActive={isResilienceActive} 
              isDragging={isDragging && isResilienceActive}
            />
          </div>
        </JewelModule>

        {/* ═══════════════════════════════════════════════════════════════
            MODULE 2: MOMENTUM — Glass Brick Screen + Sparkline
           ═══════════════════════════════════════════════════════════════ */}
        <JewelModule isActive={isMomentumActive} theme="cyan">
          <div className="flex justify-between items-center w-full h-full gap-4">
            {/* Data Stack — HERO TYPOGRAPHY */}
            <div className="flex flex-col justify-center min-w-[100px]">
              <div className={`text-[10px] uppercase tracking-[0.2em] font-semibold mb-1 transition-colors duration-300 ${isMomentumActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                Momentum
              </div>
              <div className={`text-3xl font-bold tracking-tight transition-colors duration-300 drop-shadow-lg ${isMomentumActive ? 'text-white' : 'text-slate-300'}`}>
                {momentum}
              </div>
              <div className={`text-[10px] mt-1 font-mono uppercase transition-colors duration-300 ${isGrowthPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                Growth: {arr}
              </div>
            </div>
            
            {/* Sparkline Widget */}
            <MiniSparkline value01={momentumValue / 100} isActive={isMomentumActive} />
          </div>
        </JewelModule>

        {/* ═══════════════════════════════════════════════════════════════
            MODULE 3: STABILITY — Standalone Circular Reactor (No Box)
           ═══════════════════════════════════════════════════════════════ */}
        <div className="flex justify-end">
          <JewelReactor isActive={isRiskActive} riskLevel={riskScore}>
            <div className={`text-[9px] uppercase tracking-widest font-bold mb-0.5 transition-colors duration-300 ${stabilityColor}`}>
              Stability
            </div>
            <div className={`text-3xl font-bold tracking-tighter transition-colors duration-300 ${isRiskActive ? 'text-white' : 'text-slate-300'}`}>
              {stabilityPct}%
            </div>
            <div className={`text-[8px] mt-1 uppercase tracking-wider transition-colors duration-300 ${isRiskActive ? stabilityColor : 'text-slate-600'}`}>
              {isCritical ? 'CRITICAL' : isHighRisk ? 'WARNING' : 'NOMINAL'}
            </div>
          </JewelReactor>
        </div>

      </div>
    </div>
  );
}
