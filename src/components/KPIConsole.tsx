// src/components/KPIConsole.tsx
// STRATFIT — Bloomberg-Grade KPI Instrument Console
// Premium unified control surface with embedded instrument widgets

import React, { useState, useEffect} from "react";
import { useScenarioStore, SCENARIO_COLORS } from "@/state/scenarioStore";

// ============================================================================
// KPI CONFIGURATION
// ============================================================================

interface KPIConfig {
  id: string;
  label: string;
  kpiKey: string;
  unit: string;
  widgetType: "bar" | "globe" | "arrow" | "gauge" | "dial" | "chart" | "ring";
  accentColor: string;
}

const KPI_CONFIG: KPIConfig[] = [
  { id: "runway", label: "RUNWAY", kpiKey: "runway", unit: "mo", widgetType: "bar", accentColor: "#00d4ff" },
  { id: "cash", label: "CASH", kpiKey: "cashPosition", unit: "", widgetType: "globe", accentColor: "#00ffcc" },
  { id: "momentum", label: "MOMENTUM", kpiKey: "momentum", unit: "", widgetType: "arrow", accentColor: "#00ff88" },
  { id: "burn", label: "BURN", kpiKey: "burnQuality", unit: "/mo", widgetType: "gauge", accentColor: "#ff6b6b" },
  { id: "risk", label: "RISK", kpiKey: "riskIndex", unit: "/100", widgetType: "dial", accentColor: "#00ccff" },
  { id: "earnings", label: "EARNINGS", kpiKey: "earningsPower", unit: "", widgetType: "chart", accentColor: "#00ff88" },
  { id: "value", label: "VALUE", kpiKey: "enterpriseValue", unit: "", widgetType: "ring", accentColor: "#00ddff" },
];

// ============================================================================
// INSTRUMENT WIDGETS — SVG-based, Unified Visual Language
// ============================================================================

// Shared animation timing
const BREATH_DURATION = "0.4s";
const GLOW_INTENSITY = { idle: 0.3, hover: 0.5, active: 0.8 };

// 1. RUNWAY — Horizontal Fill Bar
function RunwayInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const pct = Math.min(100, Math.max(5, (value / 36) * 100));
  const glow = GLOW_INTENSITY[state];
  
  return (
    <svg viewBox="0 0 100 24" className="instrument-svg">
      <defs>
        <linearGradient id="runwayFill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0088aa"/>
          <stop offset="50%" stopColor="#00ccee"/>
          <stop offset="100%" stopColor="#00eeff"/>
        </linearGradient>
        <filter id="runwayGlow">
          <feGaussianBlur stdDeviation={2 * glow} result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <rect x="4" y="8" width="92" height="8" rx="4" fill="rgba(0,0,0,0.5)" stroke="rgba(0,180,220,0.2)" strokeWidth="0.5"/>
      {/* Fill */}
      <rect x="4" y="8" width={pct * 0.92} height="8" rx="4" fill="url(#runwayFill)" filter="url(#runwayGlow)">
        {state === "active" && <animate attributeName="opacity" values="0.9;1;0.9" dur="1.5s" repeatCount="indefinite"/>}
      </rect>
      {/* Highlight */}
      <rect x="6" y="9" width={Math.max(0, pct * 0.88)} height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

// 2. CASH — Globe with Orbits
function CashInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    const speed = state === "active" ? 1.2 : 0.4;
    const interval = setInterval(() => setRotation(r => (r + speed) % 360), 30);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <svg viewBox="0 0 60 60" className="instrument-svg">
      <defs>
        <radialGradient id="globeGrad" cx="35%" cy="35%">
          <stop offset="0%" stopColor="rgba(0,255,200,0.4)"/>
          <stop offset="100%" stopColor="rgba(0,40,40,0.9)"/>
        </radialGradient>
      </defs>
      {/* Outer orbit */}
      <ellipse cx="30" cy="30" rx="26" ry="10" fill="none" stroke="rgba(0,255,200,0.25)" strokeWidth="0.8"
        transform={`rotate(${rotation * 0.3} 30 30)`} strokeDasharray="4 3"/>
      {/* Inner orbit */}
      <ellipse cx="30" cy="30" rx="20" ry="7" fill="none" stroke="rgba(0,200,255,0.3)" strokeWidth="0.8"
        transform={`rotate(${-rotation * 0.5} 30 30)`}/>
      {/* Globe */}
      <circle cx="30" cy="30" r="14" fill="url(#globeGrad)" stroke="rgba(0,255,200,0.5)" strokeWidth="1">
        {state === "active" && <animate attributeName="r" values="14;14.5;14" dur="2s" repeatCount="indefinite"/>}
      </circle>
      {/* Equator */}
      <ellipse cx="30" cy="30" rx="14" ry="4" fill="none" stroke="rgba(0,255,200,0.3)" strokeWidth="0.5"/>
      {/* Highlight */}
      <circle cx="25" cy="25" r="4" fill="rgba(255,255,255,0.15)"/>
    </svg>
  );
}

// 3. MOMENTUM — Metallic Arrow with Chevrons
function MomentumInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const speed = state === "active" ? 0.06 : 0.03;
    const interval = setInterval(() => setTick(t => (t + speed) % 1), 30);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <svg viewBox="0 0 80 40" className="instrument-svg">
      <defs>
        <linearGradient id="arrowMetal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#555"/>
          <stop offset="40%" stopColor="#ccc"/>
          <stop offset="50%" stopColor="#fff"/>
          <stop offset="60%" stopColor="#ccc"/>
          <stop offset="100%" stopColor="#555"/>
        </linearGradient>
        <filter id="arrowGlow"><feGaussianBlur stdDeviation="1.5"/></filter>
      </defs>
      {/* Arrow body */}
      <path d="M8 17 L52 17 L52 12 L68 20 L52 28 L52 23 L8 23 Z" fill="url(#arrowMetal)" filter="url(#arrowGlow)"/>
      <path d="M8 17 L52 17 L52 12 L68 20 L52 28 L52 23 L8 23 Z" fill="url(#arrowMetal)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3"/>
      {/* Chevrons */}
      {[0, 1, 2, 3].map(i => {
        const phase = (tick + i * 0.2) % 1;
        const opacity = 0.25 + Math.sin(phase * Math.PI) * 0.6;
        return (
          <polygon key={i} points={`${12 + i * 8},32 ${16 + i * 8},36 ${20 + i * 8},32`} 
            fill="#00ccff" opacity={opacity} transform="rotate(-90 40 34)"/>
        );
      })}
    </svg>
  );
}

// 4. BURN — Semi-circular Gauge
function BurnInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const pct = Math.min(100, Math.max(0, value));
  const angle = -135 + (pct / 100) * 270;
  
  return (
    <svg viewBox="0 0 70 45" className="instrument-svg">
      <defs>
        <linearGradient id="burnArc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00ddff"/>
          <stop offset="40%" stopColor="#00ff88"/>
          <stop offset="70%" stopColor="#ffcc00"/>
          <stop offset="100%" stopColor="#ff4444"/>
        </linearGradient>
      </defs>
      {/* Background arc */}
      <path d="M10 40 A 25 25 0 0 1 60 40" fill="none" stroke="rgba(40,50,60,0.7)" strokeWidth="5" strokeLinecap="round"/>
      {/* Colored arc */}
      <path d="M10 40 A 25 25 0 0 1 60 40" fill="none" stroke="url(#burnArc)" strokeWidth="5" strokeLinecap="round"
        style={{ filter: state !== "idle" ? "drop-shadow(0 0 4px rgba(255,150,50,0.5))" : "none" }}/>
      {/* Needle */}
      <g transform={`rotate(${angle} 35 40)`}>
        <path d="M35 40 L33 18 L35 12 L37 18 Z" fill="#aaa" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3"/>
      </g>
      {/* Center cap */}
      <circle cx="35" cy="40" r="5" fill="#1a1a2a" stroke="rgba(100,110,120,0.5)" strokeWidth="1.5"/>
      <circle cx="35" cy="40" r="2.5" fill={pct > 70 ? "#ff5555" : pct > 40 ? "#ffcc00" : "#00ff88"}/>
    </svg>
  );
}

// 5. RISK — Circular Dial with Score
function RiskInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    const speed = state === "active" ? 1.8 : 0.6;
    const interval = setInterval(() => setRotation(r => (r + speed) % 360), 30);
    return () => clearInterval(interval);
  }, [state]);

  const score = Math.min(100, Math.max(0, Math.round(value)));
  const color = score < 35 ? "#00ff88" : score < 65 ? "#ffcc00" : "#ff5555";

  return (
    <svg viewBox="0 0 60 60" className="instrument-svg">
      {/* Outer bezel */}
      <circle cx="30" cy="30" r="27" fill="none" stroke="rgba(80,90,100,0.5)" strokeWidth="3"/>
      <circle cx="30" cy="30" r="25" fill="linear-gradient(180deg, #2a2a3a, #1a1a2a)"/>
      {/* Rotating glow ring */}
      <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(0,200,255,0.4)" strokeWidth="1.5"
        strokeDasharray="30 100" transform={`rotate(${rotation} 30 30)`}/>
      {/* Inner face */}
      <circle cx="30" cy="30" r="18" fill="#0a0a15" stroke="rgba(0,180,255,0.3)" strokeWidth="1"/>
      {/* Score */}
      <text x="30" y="28" textAnchor="middle" fontSize="14" fontWeight="800" fill={color}
        style={{ textShadow: `0 0 8px ${color}` }}>{score}</text>
      <text x="30" y="38" textAnchor="middle" fontSize="7" fill="rgba(150,170,190,0.7)">/100</text>
    </svg>
  );
}

// 6. EARNINGS — Bar Chart
function EarningsInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const heights = [35, 50, 68, 100];
  const scale = state === "active" ? 1.05 : 1;

  return (
    <svg viewBox="0 0 70 50" className="instrument-svg" style={{ transform: `scale(${scale})`, transition: "transform 0.2s" }}>
      <defs>
        <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00ff88"/>
          <stop offset="50%" stopColor="#00cc66"/>
          <stop offset="100%" stopColor="#009944"/>
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <g key={i}>
          <rect x={10 + i * 15} y={50 - h * 0.45} width="10" height={h * 0.45} rx="2" fill="url(#barGrad)"
            style={{ filter: state !== "idle" ? "drop-shadow(0 0 6px rgba(0,255,136,0.4))" : "none" }}/>
          <rect x={11 + i * 15} y={51 - h * 0.45} width="8" height={h * 0.15} rx="1" fill="rgba(255,255,255,0.3)"/>
        </g>
      ))}
    </svg>
  );
}

// 7. VALUE — Halo Ring with Arrow
function ValueInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const [pulse, setPulse] = useState(0);
  const [orbit, setOrbit] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 0.04) % 1);
      setOrbit(o => (o + (state === "active" ? 0.8 : 0.3)) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [state]);

  const glowScale = 1 + Math.sin(pulse * Math.PI * 2) * 0.06;

  return (
    <svg viewBox="0 0 60 60" className="instrument-svg">
      {/* Outer dashed orbit */}
      <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(0,220,255,0.2)" strokeWidth="0.8" strokeDasharray="3 4"
        transform={`rotate(${-orbit} 30 30)`}/>
      {/* Main ring */}
      <circle cx="30" cy="30" r={20 * glowScale} fill="none" stroke="rgba(0,220,255,0.5)" strokeWidth="2"
        style={{ filter: state !== "idle" ? "drop-shadow(0 0 10px rgba(0,220,255,0.4))" : "none" }}/>
      {/* Inner glow */}
      <circle cx="30" cy="30" r="16" fill="radial-gradient(circle, rgba(0,200,255,0.15) 0%, transparent 70%)"/>
      {/* Up arrow */}
      <path d="M30 38 L30 22 M24 28 L30 22 L36 28" fill="none" stroke="#00ddff" strokeWidth="2.5" strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 6px rgba(0,255,255,0.7))" }}/>
    </svg>
  );
}

// Widget renderer
function InstrumentWidget({ type, value, state }: { type: KPIConfig["widgetType"]; value: number; state: "idle" | "hover" | "active" }) {
  switch (type) {
    case "bar": return <RunwayInstrument value={value} state={state} />;
    case "globe": return <CashInstrument value={value} state={state} />;
    case "arrow": return <MomentumInstrument value={value} state={state} />;
    case "gauge": return <BurnInstrument value={value} state={state} />;
    case "dial": return <RiskInstrument value={value} state={state} />;
    case "chart": return <EarningsInstrument value={value} state={state} />;
    case "ring": return <ValueInstrument value={value} state={state} />;
  }
}

// ============================================================================
// MAIN CONSOLE COMPONENT
// ============================================================================

export default function KPIConsole() {
  const kpiValues = useScenarioStore((s) => s.kpiValues);
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const viewMode = useScenarioStore((s) => s.viewMode);
  const scenario = useScenarioStore((s) => s.scenario);
  
  const scenarioColor = SCENARIO_COLORS[scenario].primary;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const visibleKPIs = viewMode === "investor" 
    ? KPI_CONFIG.filter(k => !["burn", "earnings"].includes(k.id))
    : KPI_CONFIG;

  const handleClick = (index: number) => {
    const actualIndex = KPI_CONFIG.findIndex(k => k.id === visibleKPIs[index].id);
    setHoveredKpiIndex(hoveredKpiIndex === actualIndex ? null : actualIndex);
  };

  const isAnyActive = hoveredKpiIndex !== null;

  return (
    <div className="kpi-console">
      {/* Console Surface */}
      <div className="console-surface">
        {/* Vignette overlay */}
        <div className="console-vignette" />
        
        {/* Instrument Row */}
        <div className="instrument-row">
          {visibleKPIs.map((cfg, i) => {
            const data = kpiValues[cfg.kpiKey as keyof typeof kpiValues];
            const actualIndex = KPI_CONFIG.findIndex(k => k.id === cfg.id);
            const isActive = hoveredKpiIndex === actualIndex;
            const isHovered = hoverIndex === i;
            const state = isActive ? "active" : isHovered ? "hover" : "idle";
            const dimmed = isAnyActive && !isActive;

            return (
              <div
                key={cfg.id}
                className={`instrument ${state} ${dimmed ? "dimmed" : ""}`}
                onClick={() => handleClick(i)}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{
                  ["--accent" as string]: isActive ? scenarioColor : cfg.accentColor,
                }}
              >
                {/* Instrument frame */}
                <div className="instrument-frame">
                  {/* Inner well */}
                  <div className="instrument-well">
                    {/* Header */}
                    <div className="instrument-header">
                      <span className="instrument-label">{cfg.label}</span>
                    </div>
                    {/* Value */}
                    <div className="instrument-value">
                      <span className="value-main">{data?.display ?? "—"}</span>
                      {cfg.unit && <span className="value-unit">{cfg.unit}</span>}
                    </div>
                    {/* Widget */}
                    <div className="instrument-widget">
                      <InstrumentWidget type={cfg.widgetType} value={data?.value ?? 0} state={state} />
                    </div>
                  </div>
                </div>
                {/* Glow layer */}
                <div className="instrument-glow" />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .kpi-console {
          width: 100%;
          padding: 8px 0;
        }

        /* ============================================
           CONSOLE SURFACE — Unified Dark Glass
           ============================================ */
        .console-surface {
          position: relative;
          display: flex;
          justify-content: center;
          padding: 12px 20px;
          background: linear-gradient(
            180deg,
            rgba(16, 22, 30, 0.98) 0%,
            rgba(12, 16, 24, 0.99) 100%
          );
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.03),
            inset 0 -2px 8px rgba(0, 0, 0, 0.3),
            0 4px 20px rgba(0, 0, 0, 0.4);
        }

        .console-vignette {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%);
          pointer-events: none;
        }

        /* ============================================
           INSTRUMENT ROW
           ============================================ */
        .instrument-row {
          display: flex;
          gap: 14px;
          align-items: stretch;
          position: relative;
          z-index: 2;
        }

        /* ============================================
           INDIVIDUAL INSTRUMENT
           ============================================ */
        .instrument {
          position: relative;
          width: 138px;
          cursor: pointer;
          transition: all ${BREATH_DURATION} cubic-bezier(0.4, 0, 0.2, 1);
        }

        .instrument.hover {
          transform: translateY(-2px);
        }

        .instrument.active {
          transform: translateY(-6px) scale(1.02);
          z-index: 10;
        }

        .instrument.dimmed {
          opacity: 0.55;
          transform: scale(0.98);
        }

        /* Frame — Metallic border */
        .instrument-frame {
          position: relative;
          border-radius: 14px;
          padding: 1.5px;
          background: linear-gradient(
            155deg,
            rgba(255,255,255,0.25) 0%,
            rgba(255,255,255,0.08) 30%,
            rgba(0,0,0,0.1) 50%,
            rgba(255,255,255,0.08) 70%,
            rgba(255,255,255,0.2) 100%
          );
        }

        .instrument.active .instrument-frame {
          background: linear-gradient(
            155deg,
            var(--accent) 0%,
            rgba(255,255,255,0.15) 30%,
            transparent 50%,
            rgba(255,255,255,0.15) 70%,
            var(--accent) 100%
          );
        }

        /* Well — Recessed inner surface */
        .instrument-well {
          background: linear-gradient(
            168deg,
            rgba(22, 30, 42, 0.98) 0%,
            rgba(14, 20, 30, 0.99) 50%,
            rgba(10, 14, 22, 1) 100%
          );
          border-radius: 12px;
          padding: 12px 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 
            inset 0 2px 6px rgba(0, 0, 0, 0.4),
            inset 0 -1px 0 rgba(255, 255, 255, 0.02);
          min-height: 130px;
        }

        /* Glow layer */
        .instrument-glow {
          position: absolute;
          inset: -4px;
          border-radius: 18px;
          background: radial-gradient(ellipse at center, var(--accent), transparent 70%);
          opacity: 0;
          transition: opacity ${BREATH_DURATION} ease;
          pointer-events: none;
          z-index: -1;
        }

        .instrument.hover .instrument-glow {
          opacity: 0.12;
        }

        .instrument.active .instrument-glow {
          opacity: 0.25;
        }

        /* ============================================
           INSTRUMENT CONTENT
           ============================================ */
        .instrument-header {
          display: flex;
          align-items: center;
        }

        .instrument-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: rgba(160, 180, 200, 0.75);
          transition: color 0.2s ease;
        }

        .instrument.active .instrument-label {
          color: rgba(200, 220, 240, 0.95);
        }

        .instrument-value {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }

        .value-main {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          transition: text-shadow 0.2s ease;
        }

        .instrument.active .value-main {
          color: var(--accent);
          text-shadow: 0 0 16px var(--accent);
        }

        .value-unit {
          font-size: 11px;
          font-weight: 600;
          color: rgba(140, 160, 180, 0.7);
        }

        .instrument-widget {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
        }

        .instrument-svg {
          width: 100%;
          height: auto;
          max-height: 55px;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 1200px) {
          .instrument {
            width: 125px;
          }
          .value-main {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

