// src/components/ui/KPICard.tsx
// STRATFIT — Premium KPI Widgets — Bloomberg/Apple-Grade Quality

import React, { useEffect, useState } from "react";
import { ViewMode } from "@/state/scenarioStore";

export interface KPICardProps {
  index: number;
  label: string;
  value: string;
  rawValue: number;
  color: string;
  widgetType: string;
  isActive?: boolean;
  isAnyActive?: boolean;
  onSelect?: (index: number) => void;
  viewMode: ViewMode;
  highlightColor?: string;
}

// ============================================================================
// WIDGET COLOR MAPPING
// ============================================================================
const WIDGET_COLORS: Record<string, { primary: string; glow: string }> = {
  timeCompression: { primary: "#00d4ff", glow: "rgba(0, 212, 255, 0.6)" },      // Cyan - Runway
  liquidityReservoir: { primary: "#00ffcc", glow: "rgba(0, 255, 204, 0.5)" },   // Green - Cash
  vectorFlow: { primary: "#00ff88", glow: "rgba(0, 255, 136, 0.5)" },           // Green - Momentum
  efficiencyRotor: { primary: "#ff6b6b", glow: "rgba(255, 107, 107, 0.5)" },    // Red - Burn
  stabilityWave: { primary: "#00ccff", glow: "rgba(0, 204, 255, 0.5)" },        // Cyan - Risk
  structuralLift: { primary: "#00ff88", glow: "rgba(0, 255, 136, 0.5)" },       // Green - Earnings
  scaleAura: { primary: "#00ddff", glow: "rgba(0, 221, 255, 0.5)" },            // Cyan - Value
};

// ============================================================================
// 1. RUNWAY — Horizontal Progress Bar with Glow
// ============================================================================
function RunwayWidget({
  value,
  isActive,
  reduceMotion,
}: {
  value: number;
  isActive: boolean;
  reduceMotion: boolean;
}) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (reduceMotion) {
      setPulse(0);
      return;
    }
    const interval = setInterval(() => setPulse((p) => (p + 0.025) % 1), 50);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  const normalized = Math.min(100, Math.max(8, (value / 36) * 100));
  const glowIntensity = isActive ? 25 : reduceMotion ? 18 : 18 + Math.sin(pulse * Math.PI * 2) * 6;

  return (
    <div className="runway-widget">
      <div className="runway-track">
        <div 
          className="runway-fill"
          style={{ 
            width: `${normalized}%`,
            boxShadow: `0 0 ${glowIntensity}px rgba(0, 212, 255, 0.7), 0 0 ${glowIntensity * 1.5}px rgba(0, 212, 255, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)`
          }}
        >
          <div className="runway-highlight" />
        </div>
        <div className="runway-glow-line" style={{ width: `${normalized}%` }} />
      </div>
      <style>{`
        .runway-widget { width: 100%; padding: 0 4px; }
        .runway-track {
          width: 100%;
          height: 18px;
          background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(10,20,30,0.8) 100%);
          border-radius: 9px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(0, 180, 220, 0.3);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
        }
        .runway-fill {
          height: 100%;
          background: linear-gradient(90deg, #0090aa 0%, #00c8e8 40%, #00e8ff 70%, #40f8ff 100%);
          border-radius: 9px;
          position: relative;
          transition: width 0.3s ease;
        }
        .runway-highlight {
          position: absolute;
          top: 2px; left: 8px; right: 8px; height: 5px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
          border-radius: 3px;
        }
        .runway-glow-line {
          position: absolute;
          bottom: 0; left: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #00e8ff, #00ffff);
          filter: blur(1px);
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// 2. CASH — Orbital Globe + Bars
// ============================================================================
function CashWidget({ value, isActive }: { value: number; isActive: boolean }) {
  const pct = Math.max(0, Math.min(1, value / 100));
  const base = isActive ? 1 : 0.92;
  const heights = [0.55, 0.8, 1.0, 0.7].map((m, i) => {
    const h = 10 + pct * 34 * m;
    return Math.max(8, Math.min(48, h + (i % 2 === 0 ? 2 : 0)));
  });

  return (
    <div className="cash-widget" style={{ opacity: base }}>
      <div className="cash-row">
        <div className="cash-globe-wrap" aria-hidden="true">
          <div className="cash-orbit outer" />
          <div className="cash-orbit" />
          <div className="cash-globe">
            <div className="globe-equator" />
            <div className="globe-shine" />
          </div>
        </div>
        <div className="cash-bars" aria-hidden="true">
          {heights.map((h, i) => (
            <div key={i} className="cash-bar" style={{ height: `${h}px` }}>
              <div className="bar-shine" />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .cash-widget { width: 100%; display: flex; justify-content: center; }
        .cash-row { display: flex; align-items: center; justify-content: center; gap: 14px; width: 100%; }

        .cash-globe-wrap { width: 52px; height: 52px; position: relative; flex: 0 0 auto; }
        .cash-orbit {
          position: absolute;
          inset: -6px;
          border: 1.5px solid rgba(0, 255, 200, 0.35);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0, 255, 200, 0.22);
        }
        .cash-orbit.outer {
          inset: -11px;
          border-color: rgba(0, 200, 255, 0.22);
          box-shadow: 0 0 14px rgba(0, 200, 255, 0.18);
          animation: cash-orbit 5.2s linear infinite;
        }
        .cash-globe {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 28%, rgba(255,255,255,0.10), rgba(0,255,200,0.06) 35%, rgba(0,0,0,0.25) 72%);
          border: 1px dashed rgba(0, 255, 200, 0.28);
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.35);
          overflow: hidden;
        }
        .globe-equator {
          position: absolute;
          top: 50%;
          left: -6px;
          right: -6px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 200, 0.55), transparent);
          opacity: 0.9;
        }
        .globe-shine {
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle at 20% 18%, rgba(255,255,255,0.14), transparent 45%);
          filter: blur(0.5px);
          transform: rotate(-12deg);
        }

        .cash-bars { display: flex; align-items: flex-end; gap: 6px; height: 48px; }
        .cash-bar {
          width: 14px;
          background: linear-gradient(180deg, #00ffcc 0%, #00dd99 40%, #00aa77 100%);
          border-radius: 3px 3px 0 0;
          box-shadow: 0 0 12px rgba(0, 255, 200, 0.35), inset 0 1px 2px rgba(255,255,255,0.24);
          min-height: 8px;
          position: relative;
        }
        .bar-shine {
          position: absolute;
          top: 2px; left: 2px; right: 2px; height: 35%;
          background: linear-gradient(180deg, rgba(255,255,255,0.42), transparent);
          border-radius: 2px;
        }

        @keyframes cash-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// 3. MOMENTUM — Metallic Arrow + Animated Chevrons
// ============================================================================
function MomentumWidget({ value, isActive }: { value: number; isActive: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const speed = isActive ? 0.04 : 0.025;
    const interval = setInterval(() => setTick(t => (t + speed) % 1), 40);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="momentum-widget">
      <svg viewBox="0 0 60 28" width="65" height="30" className="momentum-arrow">
        <defs>
          <linearGradient id="arrowMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#666"/>
            <stop offset="30%" stopColor="#ccc"/>
            <stop offset="50%" stopColor="#fff"/>
            <stop offset="70%" stopColor="#ccc"/>
            <stop offset="100%" stopColor="#666"/>
          </linearGradient>
          <filter id="arrowGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path 
          d="M2 11 L42 11 L42 5 L58 14 L42 23 L42 17 L2 17 Z" 
          fill="url(#arrowMetalGrad)" 
          filter="url(#arrowGlow)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.5"
        />
      </svg>
      <div className="momentum-chevrons">
        {[0, 1, 2, 3].map(i => {
          const phase = (tick + i * 0.18) % 1;
          const opacity = 0.3 + Math.sin(phase * Math.PI) * 0.7;
          return <div key={i} className="chevron" style={{ opacity }} />;
        })}
      </div>
      <style>{`
        .momentum-widget {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .momentum-arrow {
          filter: drop-shadow(0 0 6px rgba(200, 220, 255, 0.5));
        }
        .momentum-chevrons {
          display: flex;
          gap: 4px;
        }
        .chevron {
          width: 10px;
          height: 12px;
          background: linear-gradient(135deg, #00aacc 0%, #00ddff 50%, #00ffff 100%);
          clip-path: polygon(0 50%, 60% 0, 100% 50%, 60% 100%);
          transform: rotate(-90deg);
          box-shadow: 0 0 8px rgba(0, 220, 255, 0.6);
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// 4. BURN — Semi-Circular Gauge with Needle
// ============================================================================
function BurnWidget({ value, isActive }: { value: number; isActive: boolean }) {
  const normalized = Math.min(100, Math.max(5, value));
  const angle = -90 + (normalized / 100) * 180;
  
  // Color shifts based on value: green → amber → red
  const getColor = () => {
    if (normalized < 40) return { main: '#00ff88', glow: 'rgba(0,255,136,0.5)' };
    if (normalized < 70) return { main: '#ffcc00', glow: 'rgba(255,204,0,0.5)' };
    return { main: '#ff5555', glow: 'rgba(255,85,85,0.5)' };
  };
  const color = getColor();

  return (
    <div className="burn-widget">
      <svg viewBox="0 0 100 58" width="90" height="52">
        <defs>
          <linearGradient id="burnArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ddff"/>
            <stop offset="40%" stopColor="#00ff88"/>
            <stop offset="65%" stopColor="#ffcc00"/>
            <stop offset="100%" stopColor="#ff4444"/>
          </linearGradient>
          <filter id="burnGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Background arc */}
        <path d="M12 52 A 40 40 0 0 1 88 52" fill="none" stroke="rgba(40,50,60,0.8)" strokeWidth="7" strokeLinecap="round"/>
        {/* Colored arc */}
        <path d="M12 52 A 40 40 0 0 1 88 52" fill="none" stroke="url(#burnArcGrad)" strokeWidth="7" strokeLinecap="round" filter="url(#burnGlow)"/>
        {/* Tick marks */}
        {[0, 45, 90, 135, 180].map((a, i) => (
          <line key={i} x1="50" y1="12" x2="50" y2="16" stroke="rgba(150,170,190,0.5)" strokeWidth="1"
            transform={`rotate(${a - 90} 50 52)`}/>
        ))}
        {/* Needle */}
        <g transform={`rotate(${angle} 50 52)`}>
          <path d="M50 52 L48 20 L50 12 L52 20 Z" fill="url(#arrowMetalGrad)" 
            stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
        </g>
        {/* Center cap */}
        <circle cx="50" cy="52" r="8" fill="linear-gradient(180deg, #2a2a3a, #1a1a2a)" stroke="rgba(100,110,120,0.6)" strokeWidth="2"/>
        <circle cx="50" cy="52" r="4" fill={color.main} style={{ filter: `drop-shadow(0 0 4px ${color.glow})` }}/>
      </svg>
      <style>{`
        .burn-widget { display: flex; justify-content: center; }
      `}</style>
    </div>
  );
}

// ============================================================================
// 5. RISK — Circular Score Ring with /100
// ============================================================================
function RiskWidget({ value, isActive }: { value: number; isActive: boolean }) {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    const speed = isActive ? 1.5 : 0.8;
    const interval = setInterval(() => setRotation(r => (r + speed) % 360), 30);
    return () => clearInterval(interval);
  }, [isActive]);

  const score = Math.min(100, Math.max(0, Math.round(value)));
  const riskColor = score < 35 ? '#00ff88' : score < 65 ? '#ffcc00' : '#ff5555';

  return (
    <div className="risk-widget">
      <div className="risk-dial">
        <div className="dial-bezel">
          <div className="dial-glow-ring" style={{ transform: `rotate(${rotation}deg)` }} />
          <div className="dial-face">
            <span className="dial-score" style={{ color: riskColor, textShadow: `0 0 12px ${riskColor}` }}>{score}</span>
            <span className="dial-max">/100</span>
          </div>
        </div>
      </div>
      <style>{`
        .risk-widget { display: flex; justify-content: center; }
        .risk-dial { width: 62px; height: 62px; position: relative; }
        .dial-bezel {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(145deg, #3a3a4a 0%, #1a1a2a 40%, #2a2a3a 100%);
          border: 2px solid;
          border-color: #555 #333 #222 #444;
          box-shadow: 
            0 4px 12px rgba(0,0,0,0.6),
            inset 0 2px 8px rgba(0,0,0,0.5),
            inset 0 -1px 2px rgba(255,255,255,0.05);
          position: relative;
        }
        .dial-glow-ring {
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(0, 200, 255, 0.7);
          border-right-color: rgba(0, 200, 255, 0.3);
          filter: blur(0.5px);
        }
        .dial-face {
          position: absolute;
          inset: 7px;
          border-radius: 50%;
          background: linear-gradient(180deg, #1a1a2a 0%, #0a0a15 100%);
          border: 1.5px solid rgba(0, 180, 255, 0.35);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.4);
        }
        .dial-score {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 17px;
          font-weight: 800;
          line-height: 1;
        }
        .dial-max {
          font-size: 9px;
          font-weight: 600;
          color: rgba(150, 170, 190, 0.7);
          margin-top: 1px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// 6. EARNINGS — Ascending Bar Chart (Green)
// ============================================================================
function EarningsWidget({ value, isActive }: { value: number; isActive: boolean }) {
  const heights = [38, 55, 72, 100];
  const scale = isActive ? 1.05 : 1;

  return (
    <div className="earnings-widget" style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease' }}>
      {heights.map((h, i) => (
        <div key={i} className="earnings-bar" style={{ height: `${h * 0.48}px` }}>
          <div className="bar-highlight" />
        </div>
      ))}
      <style>{`
        .earnings-widget {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 7px;
          height: 50px;
        }
        .earnings-bar {
          width: 16px;
          background: linear-gradient(180deg, #00ff88 0%, #00dd66 35%, #00bb55 70%, #009944 100%);
          border-radius: 3px 3px 0 0;
          position: relative;
          box-shadow: 
            0 0 14px rgba(0, 255, 136, 0.45),
            inset 0 1px 3px rgba(255,255,255,0.35);
          min-height: 8px;
        }
        .bar-highlight {
          position: absolute;
          top: 2px; left: 2px; right: 2px; height: 40%;
          background: linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.1), transparent);
          border-radius: 2px 2px 0 0;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// 7. VALUE — Halo Ring with Upward Arrow
// ============================================================================
function ValueWidget({ value, isActive }: { value: number; isActive: boolean }) {
  const [pulse, setPulse] = useState(0);
  const [orbit, setOrbit] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 0.03) % 1);
      setOrbit(o => (o + (isActive ? 0.6 : 0.3)) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isActive]);

  const glowScale = 1 + Math.sin(pulse * Math.PI * 2) * 0.08;

  return (
    <div className="value-widget">
      <div className="value-halo" style={{ transform: `rotate(${-orbit}deg)` }} />
      <div className="value-ring" style={{ transform: `scale(${glowScale})` }}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#00ddff" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 17V7M7 12l5-5 5 5"/>
        </svg>
      </div>
      <style>{`
        .value-widget {
          width: 56px;
          height: 56px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .value-halo {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px dashed rgba(0, 220, 255, 0.3);
        }
        .value-ring {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(0,200,255,0.2) 0%, rgba(0,150,200,0.1) 40%, transparent 70%);
          border: 2px solid rgba(0, 220, 255, 0.5);
          box-shadow: 
            0 0 20px rgba(0,220,255,0.35),
            0 0 40px rgba(0,220,255,0.15),
            inset 0 0 15px rgba(0,220,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease;
        }
        .value-ring svg {
          filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// MAIN KPI CARD — Premium Glass Container
// ============================================================================
export default function KPICard({ 
  index, label, value, rawValue, widgetType, 
  isActive = false, isAnyActive = false, onSelect, viewMode, highlightColor = "#22d3ee"
}: KPICardProps) {
  
  const reduceMotion = isAnyActive && !isActive;

  const isCashCard = widgetType === "liquidityReservoir";
  const cardWidth = isCashCard ? 220 : 152;
  const cardHeight = isCashCard ? 155 : 138;
  
  const colors = WIDGET_COLORS[widgetType] || WIDGET_COLORS.timeCompression;
  const activeColor = isActive ? highlightColor : colors.primary;

  // Value color based on KPI type
  const valueColor =
    widgetType === "efficiencyRotor"
      ? "#ff3b3b" // Risk/stress red
      : widgetType === "liquidityReservoir" || widgetType === "structuralLift"
        ? "#22c55e" // Emerald
        : widgetType === "vectorFlow"
          ? "#00ccff" // Cyan/Ice
          : widgetType === "scaleAura"
            ? "#7c3aed" // Indigo/Violet
            : "#ffffff";

  const Widget = () => {
    const props = { value: rawValue, isActive };
    switch (widgetType) {
      case "timeCompression": return <RunwayWidget {...props} reduceMotion={reduceMotion} />;
      case "liquidityReservoir": return <CashWidget {...props} />;
      case "vectorFlow": return <MomentumWidget {...props} />;
      case "efficiencyRotor": return <BurnWidget {...props} />;
      case "stabilityWave": return <RiskWidget {...props} />;
      case "structuralLift": return <EarningsWidget {...props} />;
      case "scaleAura": return <ValueWidget {...props} />;
      default: return <RunwayWidget {...props} reduceMotion={reduceMotion} />;
    }
  };

  return (
    <div
      className={`kpi-card ${isActive ? "active" : ""} ${isCashCard ? "hero" : ""} ${reduceMotion ? "inactive-dim" : ""}`}
      onClick={() => onSelect?.(index)}
      style={{
        width: cardWidth,
        height: cardHeight,
        transform: isActive ? 'translateY(-6px) scale(1.03)' : isAnyActive ? 'scale(0.98)' : 'none',
        opacity: isAnyActive && !isActive ? 0.7 : 1,
        zIndex: isActive ? 50 : 1,
        ['--accent-color' as string]: activeColor,
        ['--accent-glow' as string]: colors.glow,
      }}
    >
      {/* Metallic outer frame */}
      <div className="card-frame" />
      
      {/* Inner glass surface */}
      <div className={`card-surface ${isCashCard ? "hero-surface" : ""}`}>
        {/* Top highlight */}
        <div className="surface-highlight" />
        
        {/* Content */}
        <div className="card-header">
          <span className="card-label">{label}</span>
          {isCashCard && (
            <svg className="trend-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" strokeWidth="3">
              <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
          )}
          </div>
        <span className="card-value" style={{ color: valueColor }}>{value}</span>
        <div className="card-widget">
          <Widget />
        </div>
      </div>

      <style>{`
        .kpi-card {
          position: relative;
          border-radius: 18px;
          cursor: pointer;
          transition:
            transform 180ms cubic-bezier(0.2, 0.9, 0.2, 1),
            box-shadow 220ms ease,
            opacity 160ms ease,
            filter 180ms ease;
          will-change: transform, box-shadow;
          flex-shrink: 0;
          isolation: isolate;
          overflow: visible;
        }

        .card-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          opacity: 0.70;
        }

        .card-value {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.05;
          margin-top: 6px;
        }
        .kpi-card:hover {
          transform: translateY(-4px) scale(1.02);
        }
        .kpi-card.active {
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.06) inset,
            0 0 0 2px color-mix(in srgb, var(--accent-color) 70%, transparent),
            0 0 26px color-mix(in srgb, var(--accent-color) 22%, transparent),
            0 0 46px color-mix(in srgb, var(--accent-glow) 28%, transparent),
            0 18px 42px rgba(0,0,0,0.55);
        }

        /* Selection pulse (scenario-colored, premium, visible) */
        .kpi-card.active::after {
          content: "";
          position: absolute;
          inset: -10px;
          border-radius: 26px;
          pointer-events: none;
          z-index: 1;                 /* behind frame/surface */
          background: radial-gradient(
            circle at 50% 45%,
            rgba(255,255,255,0.08) 0%,
            color-mix(in srgb, var(--accent-color) 40%, transparent) 22%,
            transparent 70%
          );
          opacity: 0;
          filter: blur(14px);
          transform: scale(0.965);
          mix-blend-mode: screen;
          animation: kpi-select-pulse 560ms cubic-bezier(0.2, 0.9, 0.2, 1) 1;
        }

        /* Hero card pulse slightly stronger */
        .kpi-card.hero.active::after {
          inset: -12px;
          filter: blur(16px);
          animation-duration: 620ms;
        }

        @keyframes kpi-select-pulse {
          0%   { opacity: 0;    transform: scale(0.965); }
          35%  { opacity: 0.90; transform: scale(1.00); }
          100% { opacity: 0;    transform: scale(1.07); }
        }
                .kpi-card .card-value {
                  transition: opacity 140ms ease, transform 160ms ease;
                }

                .kpi-card:not(.active) .card-value {
                  opacity: 0.92;
                  transform: translateY(0.5px);
                }
        
        /* Metallic border frame */
        .card-frame {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          padding: 1.5px;

          /* IMPORTANT:
             Keep the frame "machined" but introduce a darker bite so it never melts into the KPI chassis */
          background: linear-gradient(
            155deg,
            rgba(255,255,255,0.42) 0%,
            rgba(200,225,255,0.14) 18%,
            rgba(0,0,0,0.28) 44%,
            rgba(120,170,220,0.10) 66%,
            rgba(255,255,255,0.32) 100%
          );

          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;

          z-index: 2;
        }
        .kpi-card.active .card-frame {
          background: linear-gradient(155deg, var(--accent-color) 0%, transparent 40%, var(--accent-color) 100%);
        }
        .kpi-card.hero .card-frame {
          background: linear-gradient(
            155deg,
            rgba(0,255,200,0.6) 0%,
            rgba(0,200,255,0.3) 25%,
            rgba(0,100,150,0.15) 50%,
            rgba(0,200,255,0.3) 75%,
            rgba(0,255,200,0.5) 100%
          );
        }

        /* Glass surface — tuned contrast */
        .card-surface {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 16px;

          /* Slightly brighter top glass so cards don't "sink" into the chassis */
          background: linear-gradient(
            168deg,
            rgba(34, 46, 62, 0.965) 0%,
            rgba(18, 24, 32, 0.985) 52%,
            rgba(10, 14, 20, 0.99) 100%
          );

          /* dual-rim: a dark bite + a subtle cyan hairline */
          border: 1px solid rgba(0,0,0,0.55);
          box-shadow:
            inset 0 0 0 1px rgba(160, 210, 255, 0.10),
            inset 0 1px 0 rgba(255,255,255,0.07),
            inset 0 -14px 28px rgba(0,0,0,0.55);

          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          padding: 14px;
          overflow: hidden;
          z-index: 3;
        }
        .card-surface.hero-surface {
          background: linear-gradient(180deg, rgba(0, 28, 38, 0.95), rgba(0, 14, 22, 0.95));
          border: 1px solid rgba(0, 220, 180, 0.22);
        }

        /* Top highlight hairline — makes card edges read instantly */
        .card-surface::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 16px;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(190, 230, 255, 0.10), rgba(0,0,0,0) 46%);
          opacity: 0.95;
        }
        
        .surface-highlight {
          position: absolute;
          top: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%);
          pointer-events: none;
          border-radius: 16px 16px 0 0;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          z-index: 2;
        }
        .card-label {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.8px;
          color: rgba(180, 200, 220, 0.85);
        }
        .kpi-card.active .card-label {
          color: rgba(220, 235, 250, 0.95);
        }
        .trend-arrow {
          filter: drop-shadow(0 0 5px rgba(0, 255, 200, 0.7));
        }

        .card-value {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 22px;
          font-weight: 800;
          position: relative;
          z-index: 2;
          margin-top: 2px;
          text-shadow: 0 0 20px currentColor;
          letter-spacing: -0.5px;
        }
        .kpi-card.hero .card-value {
          font-size: 28px;
        }

        .card-widget {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          margin-top: 6px;
        }

        /* PHASE 2 — Inactive KPI discipline */
        .kpi-card.inactive-dim {
          transform: scale(0.988);
          opacity: 0.86;
          filter: saturate(0.92) brightness(0.94);
          box-shadow: none;
        }

        .kpi-card.inactive-dim:hover {
          transform: scale(0.988);
        }

        @media (prefers-reduced-motion: reduce) {
          .kpi-card,
          .kpi-card * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
