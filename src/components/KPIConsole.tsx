// src/components/KPIConsole.tsx
/**
 * KPI CONSOLE — CANONICAL UI (LOCKED)
 * Restored from tag: kpi-pre-instrument-step1
 * Rule: Do not modify KPI box layout/styling without explicit UI sign-off.
 * Scope: KPI boxes only (no slider/mountain/store coupling).
 */
// STRATFIT — Executive Command Console
// World-class KPI instrument panel with terrain + lever linkage

import React, { useEffect, useState, useCallback, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore, SCENARIO_COLORS } from "@/state/scenarioStore";
import BurnTrendBars from "./BurnTrendBars";
import type { LeverId } from "@/logic/mountainPeakModel";
import { onCausal } from "@/ui/causalEvents";
import KPIBezel from "@/components/kpi/KPIBezel";

// ============================================================================
// KPI CONFIGURATION — CANONICAL SET (LOCKED)
// ============================================================================

interface KPIConfig {
  id: string;
  label: string;
  kpiKey: string;
  unit: string;
  widgetType: "bar" | "globe" | "arrow" | "gauge" | "dial" | "chart" | "ring";
  accentColor: string;
  relatedLevers: LeverId[];
}

const KPI_CONFIG: KPIConfig[] = [
  {
    id: "cash",
    label: "CASH",
    kpiKey: "cashPosition",
    unit: "",
    widgetType: "globe",
    accentColor: "#22d3ee",
    relatedLevers: ["operatingExpenses", "fundingInjection"],
  },
  {
    id: "burn",
    label: "MONTHLY BURN",
    kpiKey: "burnQuality",
    unit: "/mo",
    widgetType: "chart", // CHANGED from gauge to chart
    accentColor: "#ef4444", // NO ORANGE
    relatedLevers: ["headcount", "cashSensitivity", "operatingExpenses"],
  },
  {
    id: "runway",
    label: "RUNWAY",
    kpiKey: "runway",
    unit: "",
    widgetType: "bar",
    accentColor: "#22d3ee",
    relatedLevers: ["operatingExpenses", "headcount"],
  },
  {
    id: "arr",
    label: "ARR (RUN-RATE)",
    kpiKey: "momentum",
    unit: "",
    widgetType: "arrow",
    accentColor: "#34d399",
    relatedLevers: ["revenueGrowth", "pricingAdjustment", "marketingSpend"],
  },
  {
    id: "arrGrowth",
    label: "ARR GROWTH",
    kpiKey: "arrGrowthPct",
    unit: "",
    widgetType: "arrow",
    accentColor: "#22d3ee",
    relatedLevers: ["revenueGrowth", "pricingAdjustment", "marketingSpend"],
  },
  {
    id: "margin",
    label: "GROSS MARGIN",
    kpiKey: "earningsPower",
    unit: "",
    widgetType: "chart",
    accentColor: "#34d399",
    relatedLevers: ["pricingAdjustment", "cashSensitivity"],
  },
  {
    id: "risk",
    label: "RISK SCORE",
    kpiKey: "riskIndex",
    unit: "",
    widgetType: "dial",
    accentColor: "#ef4444",
    relatedLevers: ["churnSensitivity", "fundingInjection"],
  },
  {
    id: "value",
    label: "ENTERPRISE VALUE",
    kpiKey: "enterpriseValue",
    unit: "",
    widgetType: "ring",
    accentColor: "#a78bfa",
    relatedLevers: ["pricingAdjustment", "revenueGrowth"],
  },
];

const KPI_GROUPS = [
  { title: "RESILIENCE", items: ["cash", "burn", "runway"] as const },
  { title: "MOMENTUM", items: ["arr", "arrGrowth"] as const },
  { title: "QUALITY", items: ["margin", "risk", "value"] as const },
] as const;

const EMPTY_KPIS = Object.freeze({});

// ============================================================================
// INSTRUMENT WIDGETS — Bloomberg-grade micro-visuals
// ============================================================================

// Shared easing
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

// ============================================================================
// GOD MODE BULLET CHART — Tactical Sci-Fi Command Center Style
// ============================================================================

// CYAN ELEMENTS - Brighter
function GodModeGrid({ id }: { id: string }) {
  return (
    <defs>
      {/* Cyan gradient for bars - brighter */}
      <linearGradient id={`${id}-beam`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(0,255,255,0.4)"/>
        <stop offset="50%" stopColor="rgba(0,255,255,0.85)"/>
        <stop offset="100%" stopColor="rgba(0,255,255,0.4)"/>
      </linearGradient>
      {/* Horizontal cyan bar - brighter */}
      <linearGradient id={`${id}-hbeam`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(0,255,255,0.95)"/>
        <stop offset="80%" stopColor="rgba(0,255,255,0.65)"/>
        <stop offset="100%" stopColor="rgba(0,255,255,0.25)"/>
      </linearGradient>
      {/* Glow filter */}
      <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id={`${id}-glow-strong`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id={`${id}-text-halo`} x="0%" y="0%" width="100%" height="100%">
        <feComposite in="SourceGraphic" operator="over"/>
      </filter>
    </defs>
  );
}

// CYAN brackets - brighter corner hints
function TechBrackets({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const bracketSize = 3;
  return (
    <g stroke="rgba(0,255,255,0.75)" strokeWidth="1" fill="none">
      {/* Top-left bracket */}
      <path d={`M ${x} ${y + bracketSize} L ${x} ${y} L ${x + bracketSize} ${y}`}/>
      {/* Top-right bracket */}
      <path d={`M ${x + w - bracketSize} ${y} L ${x + w} ${y} L ${x + w} ${y + bracketSize}`}/>
      {/* Bottom-left bracket */}
      <path d={`M ${x} ${y + h - bracketSize} L ${x} ${y + h} L ${x + bracketSize} ${y + h}`}/>
      {/* Bottom-right bracket */}
      <path d={`M ${x + w - bracketSize} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y + h - bracketSize}`}/>
    </g>
  );
}

// Precision ruler tick marks - cyan glow
function TickMarks({ x, y, width, count = 10 }: { x: number; y: number; width: number; count?: number }) {
  const ticks = [];
  for (let i = 0; i <= count; i++) {
    const tickX = x + (i / count) * width;
    const isMajor = i % 5 === 0;
    ticks.push(
      <line 
        key={i}
        x1={tickX} y1={y} 
        x2={tickX} y2={y + (isMajor ? 3 : 1.5)}
        stroke={isMajor ? "rgba(0,255,255,0.75)" : "rgba(0,255,255,0.4)"}
        strokeWidth={0.5}
      />
    );
  }
  return <g>{ticks}</g>;
}

// GLOWING PILL BADGE - God Mode status indicator
// SILENT INTELLIGENCE - Tiny geometric symbols, no glow
function StatusBadge({ 
  x, y, text, color, id, align = "end" 
}: { 
  x: number; y: number; text: string; color: string; id: string; align?: "start" | "middle" | "end" 
}) {
  const isRed = color.includes("FF33") || color.includes("ef44") || color.includes("FF00") || text === "CRIT" || text === "CRITICAL";
  const isWarn = color.includes("FFB0") || text === "LOW" || text === "MED";
  
  // Matte colors - no glow, deep tones
  const symbolColor = isRed ? "#8B3030" : isWarn ? "#8B7030" : "rgba(140,150,160,0.6)";
  const symX = align === "end" ? x - 6 : align === "middle" ? x : x;
  
  // Tiny geometric symbols: triangle for critical, diamond for warning, circle for ok
  if (isRed) {
    // Small matte triangle (pointing up = alert)
    return (
      <polygon 
        points={`${symX},${y - 3} ${symX + 4},${y + 3} ${symX - 4},${y + 3}`}
        fill={symbolColor}
        stroke="none"
      />
    );
  } else if (isWarn) {
    // Small matte diamond
    return (
      <polygon 
        points={`${symX},${y - 3} ${symX + 3},${y} ${symX},${y + 3} ${symX - 3},${y}`}
        fill={symbolColor}
        stroke="none"
      />
    );
  } else {
    // Tiny matte circle (stable/ok)
    return (
      <circle 
        cx={symX} cy={y}
        r={2.5}
        fill={symbolColor}
        stroke="none"
      />
    );
  }
}

// 1. CASH — Cyan Bullet Chart
function CashInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const pct = Math.min(100, Math.max(0, value));
  const barWidth = (pct / 100) * 88;
  const targetX = 70; // 80% target line
  const id = `cash-gm-${Math.random().toString(36).substr(2, 6)}`;
  const status = pct >= 80 ? "OK" : pct >= 50 ? "LOW" : "CRIT";
  const statusColor = pct >= 80 ? "#00FF00" : pct >= 50 ? "#FFB000" : "#FF3300";
  
  return (
    <svg viewBox="0 0 100 32" className="instrument-svg" style={{ overflow: 'visible' }}>
      <GodModeGrid id={id} />
      
      {/* Track */}
      <rect x="4" y="14" width="88" height="4" rx="0.5" fill="rgba(0,255,255,0.1)"/>
      
      {/* Precision tick marks underneath */}
      <TickMarks x={4} y={20} width={88} count={10} />
      
      {/* Cyan bar */}
      <rect 
        x="4" y="14" 
        width={barWidth} height="4" 
        rx="0.5"
        fill={`url(#${id}-hbeam)`}
        filter={`url(#${id}-glow)`}
        style={{ transition: `width 150ms ${EASE_OUT}` }}
      />
      
      {/* Target marker */}
      <line 
        x1={4 + targetX} y1="10" 
        x2={4 + targetX} y2="22"
        stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"
      />
      
      {/* STATUS SYMBOL */}
      <StatusBadge x={96} y={16} text={status} color={statusColor} id={id} />
    </svg>
  );
}

// 2. BURN RATE — Trend Bars (purple base, orange negative, green positive)
// Uses BurnTrendBars component - shows burn rate trend over time
function BurnInstrument({ value, state, burnAmount, cashAmount }: { 
  value: number; 
  state: "idle" | "hover" | "active";
  burnAmount?: number;
  cashAmount?: number;
}) {
  // Use provided burn amount or fall back to value
  const burn = burnAmount ?? value * 1000;
  
  // Calculate trend: compare to baseline (85K)
  // Lower burn = positive (green), Higher burn = negative (orange)
  const baseline = 85000; // $85K baseline
  const diff = burn - baseline;
  const threshold = baseline * 0.05; // 5% threshold for neutral
  
  let trend: "positive" | "negative" | "neutral" = "neutral";
  if (diff < -threshold) {
    trend = "positive"; // Burn decreased = good = green
  } else if (diff > threshold) {
    trend = "negative"; // Burn increased = bad = orange
  }
  
  return <BurnTrendBars value={burn} trend={trend} />;
}

// 3. RUNWAY — Cyan Bullet Chart
function RunwayInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const months = Math.min(36, Math.max(0, value));
  const pct = (months / 36) * 100;
  const barWidth = Math.max(4, (pct / 100) * 88);
  const targetX = 29; // 12 months target
  const id = `runway-gm-${Math.random().toString(36).substr(2, 6)}`;
  
  const status = months >= 12 ? "OK" : months >= 6 ? "LOW" : "CRIT";
  const statusColor = months >= 12 ? "#00FF00" : months >= 6 ? "#FFB000" : "#FF3300";
  
  return (
    <svg viewBox="0 0 100 32" className="instrument-svg" style={{ overflow: 'visible' }}>
      <GodModeGrid id={id} />
      
      {/* Subtle danger zone */}
      <rect x="4" y="14" width="15" height="4" fill="rgba(255,50,50,0.2)" rx="0.5"/>
      
      {/* Track */}
      <rect x="4" y="14" width="88" height="4" rx="0.5" fill="rgba(0,255,255,0.1)"/>
      
      {/* Precision tick marks */}
      <TickMarks x={4} y={20} width={88} count={12} />
      
      {/* Cyan bar */}
      <rect 
        x="4" y="14" 
        width={barWidth} height="4" 
        rx="0.5"
        fill={`url(#${id}-hbeam)`}
        filter={`url(#${id}-glow)`}
        style={{ transition: `width 150ms ${EASE_OUT}` }}
      />
      
      {/* Target marker */}
      <line 
        x1={4 + targetX} y1="10" 
        x2={4 + targetX} y2="22"
        stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"
      />
      
      {/* STATUS SYMBOL */}
      <StatusBadge x={96} y={16} text={status} color={statusColor} id={id} />
    </svg>
  );
}

// 4. ARR — Cyan Sparkline with trend arrow
function MomentumInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const id = `arr-gm-${Math.random().toString(36).substr(2, 6)}`;
  
  // Generate sparkline points
  const points = Array.from({ length: 8 }, (_, i) => {
    const base = 20 - (value / 100) * 8;
    const variance = Math.sin(i * 0.8 + value * 0.1) * 4 + Math.cos(i * 1.2) * 2;
    const trend = (i / 7) * (value / 100) * -6;
    return { x: 6 + i * 10, y: Math.max(8, Math.min(28, base + variance + trend)) };
  });
  
  const fullPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const lastPoint = points[points.length - 1];
  const isUpTrend = points[points.length - 1].y < points[0].y;
  
  return (
    <svg
      viewBox="0 0 100 32"
      className="instrument-svg h-16 z-20 relative"
      style={{ overflow: 'visible' }}
    >
      <GodModeGrid id={id} />
      {/* Cyan sparkline */}
      <path
        d={fullPath}
        fill="none"
        stroke="#00D9FF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${id}-glow)`}
      />
      {/* Cyan dot at end */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="3"
        fill="#00D9FF"
        filter={`url(#${id}-glow)`}
      />
      {/* Cyan arrow */}
      {isUpTrend ? (
        <polygon
          points="88,10 96,16 88,22"
          fill="#00D9FF"
          filter={`url(#${id}-glow)`}
        />
      ) : (
        <polygon
          points="88,22 96,16 88,10"
          fill="#00D9FF"
          filter={`url(#${id}-glow)`}
        />
      )}
    </svg>
  );
}

// 5. GROSS MARGIN — Cyan Range Indicator
function EarningsInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const pct = Math.min(100, Math.max(0, value));
  const indicatorX = 8 + (pct / 100) * 84;
  const id = `margin-gm-${Math.random().toString(36).substr(2, 6)}`;
  
  // Determine zone
  const zone = pct >= 70 ? "OK" : pct >= 40 ? "MED" : "CRIT";
  const zoneColor = pct >= 70 ? "#00FF00" : pct >= 40 ? "#FFB000" : "#FF3300";
  
  return (
    <svg viewBox="0 0 100 32" className="instrument-svg" style={{ overflow: 'visible' }}>
      <GodModeGrid id={id} />
      
      {/* Colored bands - subtle */}
      <rect x="8" y="12" width="34" height="8" fill="rgba(255,50,50,0.15)"/>
      <rect x="42" y="12" width="25" height="8" fill="rgba(255,176,0,0.1)"/>
      <rect x="67" y="12" width="25" height="8" fill="rgba(0,255,0,0.08)"/>
      
      {/* Cyan track outline */}
      <rect x="8" y="12" width="84" height="8" rx="0.5" fill="none" stroke="rgba(0,255,255,0.3)" strokeWidth="0.5"/>
      
      {/* Tick marks */}
      <TickMarks x={8} y={22} width={84} count={10} />
      <text x="8" y="28" fontSize="4" fill="rgba(0,255,255,0.5)" fontFamily="'Roboto Mono', monospace">0</text>
      <text x="88" y="28" fontSize="4" fill="rgba(0,255,255,0.5)" fontFamily="'Roboto Mono', monospace" textAnchor="end">100</text>
      
      {/* Cyan position indicator */}
      <line 
        x1={indicatorX} y1="8" 
        x2={indicatorX} y2="24"
        stroke="rgba(0,255,255,0.9)" strokeWidth="1.5"
        filter={`url(#${id}-glow)`}
        style={{ transition: `x1 150ms ${EASE_OUT}, x2 150ms ${EASE_OUT}` }}
      />
      
      {/* Cyan indicator dot */}
      <circle cx={indicatorX} cy={16} r="3" fill="rgba(0,255,255,0.9)" filter={`url(#${id}-glow)`}/>
      
      {/* STATUS SYMBOL */}
      <StatusBadge x={96} y={16} text={zone} color={zoneColor} id={id} />
    </svg>
  );
}

// 6. RISK SCORE — Cyan Arc Gauge
function RiskInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  const id = `risk-gm-${Math.random().toString(36).substr(2, 6)}`;
  
  // Cyan arc with risk-based color
  const arcColor = score < 35 ? "#00FF00" : score < 65 ? "#FFB000" : "#FF3300";
  const status = score < 35 ? "LOW" : score < 65 ? "MED" : "HIGH";
  
  return (
    <svg viewBox="0 0 100 48" className="instrument-svg" style={{ overflow: 'visible' }}>
      <GodModeGrid id={id} />
      
      {/* Cyan arc track */}
      <path 
        d="M18 40 A 32 32 0 0 1 82 40" 
        fill="none" 
        stroke="rgba(0,255,255,0.2)" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      
      {/* Cyan tick marks on arc */}
      {[0, 25, 50, 75, 100].map((tick, i) => {
        const angle = (Math.PI * tick) / 100;
        const x1 = 50 - 28 * Math.cos(angle);
        const y1 = 40 - 28 * Math.sin(angle);
        const x2 = 50 - 34 * Math.cos(angle);
        const y2 = 40 - 34 * Math.sin(angle);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} 
            stroke="rgba(0,255,255,0.5)" strokeWidth="1"/>
        );
      })}
      
      {/* Cyan colored arc with glow */}
      <path 
        d="M18 40 A 32 32 0 0 1 82 40" 
        fill="none" 
        stroke="rgba(0,255,255,0.8)"
        strokeWidth="3" 
        strokeLinecap="round"
        strokeDasharray="100"
        strokeDashoffset={100 - (score / 100) * 100}
        filter={`url(#${id}-glow)`}
        style={{ transition: `stroke-dashoffset 150ms ${EASE_OUT}, stroke 150ms ${EASE_OUT}` }}
      />
      
      {/* Cyan score display */}
      <text 
        x="50" y="34" 
        textAnchor="middle" 
        fontSize="16" 
        fontWeight="600" 
        fill="rgba(0,255,255,0.9)"
        fontFamily="'Roboto Mono', monospace"
        style={{ textRendering: 'geometricPrecision' }}
      >
        {score}
      </text>
      
      {/* STATUS SYMBOL - below score */}
      <StatusBadge x={50} y={44} text={status} color={arcColor} id={id} align="middle" />
    </svg>
  );
}

// 7. VALUATION — Cyan Variance Indicator
function ValueInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const normalized = Math.min(100, Math.max(0, value));
  const baselineX = 50; // Center baseline
  const indicatorX = 8 + (normalized / 100) * 84;
  const id = `val-gm-${Math.random().toString(36).substr(2, 6)}`;
  
  // Variance from baseline
  const variance = normalized - 50;
  const varColor = variance >= 0 ? "#00FF00" : "#FF3300";
  const status = variance >= 10 ? "OK" : variance >= 0 ? "OK" : variance >= -10 ? "LOW" : "CRIT";
  
  return (
    <svg viewBox="0 0 100 32" className="instrument-svg" style={{ overflow: 'visible' }}>
      <GodModeGrid id={id} />
      
      {/* Cyan track */}
      <rect x="8" y="14" width="84" height="4" rx="0.5" fill="rgba(0,255,255,0.1)"/>
      
      {/* Variance band */}
      <rect 
        x={Math.min(indicatorX, baselineX)} 
        y="14" 
        width={Math.abs(indicatorX - baselineX)} 
        height="4" 
        fill={variance >= 0 ? "rgba(0,255,0,0.3)" : "rgba(255,50,50,0.3)"}
        style={{ transition: `x 150ms ${EASE_OUT}, width 150ms ${EASE_OUT}` }}
      />
      
      {/* Tick marks */}
      <TickMarks x={8} y={20} width={84} count={10} />
      
      {/* Baseline marker - amber */}
      <line 
        x1={baselineX} y1="10" 
        x2={baselineX} y2="22"
        stroke="rgba(255,176,0,0.7)" strokeWidth="1.5"
        strokeDasharray="2 1"
      />
      
      {/* Current value - cyan */}
      <line 
        x1={indicatorX} y1="10" 
        x2={indicatorX} y2="22"
        stroke="rgba(0,255,255,0.9)" strokeWidth="1.5"
        filter={`url(#${id}-glow)`}
        style={{ transition: `x1 150ms ${EASE_OUT}, x2 150ms ${EASE_OUT}` }}
      />
      
      {/* Cyan indicator dot */}
      <circle cx={indicatorX} cy="16" r="3" fill="rgba(0,255,255,0.9)"
        filter={`url(#${id}-glow)`}
        style={{ transition: `cx 150ms ${EASE_OUT}` }}/>
      
      {/* STATUS SYMBOL */}
      <StatusBadge x={96} y={16} text={status} color={varColor} id={id} />
    </svg>
  );
}

// Widget renderer
function InstrumentWidget({ 
  type, 
  value, 
  state,
  burnAmount,
  cashAmount 
}: { 
  type: KPIConfig["widgetType"]; 
  value: number; 
  state: "idle" | "hover" | "active";
  burnAmount?: number;
  cashAmount?: number;
}) {
  switch (type) {
    case "bar": return <RunwayInstrument value={value} state={state} />;
    case "globe": return <CashInstrument value={value} state={state} />;
    case "arrow": return <MomentumInstrument value={value} state={state} />;
    case "gauge": return <BurnInstrument value={value} state={state} burnAmount={burnAmount} cashAmount={cashAmount} />;
    case "dial": return <RiskInstrument value={value} state={state} />;
    case "chart": return <EarningsInstrument value={value} state={state} />;
    case "ring": return <ValueInstrument value={value} state={state} />;
  }
}

// ============================================================================
// MEMOIZED KPI INSTRUMENT CARD
// ============================================================================

interface KPIInstrumentCardProps {
  cfg: KPIConfig;
  data: { value: number; display?: string } | undefined;
  secondaryLine?: string | null;
  state: "idle" | "hover" | "active";
  isDimmed: boolean;
  accentColor: string;
  pulseColor?: string | null;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  burnAmount?: number;
  cashAmount?: number;
}

const KPIInstrumentCard = memo(function KPIInstrumentCard({
  cfg,
  data,
  secondaryLine,
  state,
  isDimmed,
  accentColor,
  pulseColor,
  onClick,
  onMouseEnter,
  onMouseLeave,
  burnAmount,
  cashAmount,
}: KPIInstrumentCardProps) {
  return (
    <div
      className={`kpi-instrument ${state} ${isDimmed ? "dimmed" : ""} ${pulseColor ? "pulse" : ""}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ["--kpi-accent" as string]: accentColor,
        ["--kpi-pulse" as string]: pulseColor ?? accentColor,
      }}
    >
      {/* Metallic border frame */}
      <div className="instrument-border">
        {/* Recessed instrument well */}
        <div className="instrument-well">
          {/* Label row */}
          <div className="instrument-label-row">
            <span className="instrument-label">{cfg.label}</span>
          </div>
          
          {/* Value display */}
          <div className="instrument-value-row">
            <span className="value-display">{data?.display ?? "—"}</span>
            {cfg.unit && <span className="value-unit">{cfg.unit}</span>}
            {secondaryLine ? <span className="value-secondary">{secondaryLine}</span> : null}
          </div>
          
          {/* Visual widget */}
          <div className="instrument-visual relative z-20 h-16 flex items-center justify-center">
            <InstrumentWidget 
              type={cfg.widgetType} 
              value={data?.value ?? 0} 
              state={state}
              burnAmount={burnAmount}
              cashAmount={cashAmount}
            />
          </div>
        </div>
      </div>
      
      {/* Neon glow layer */}
      <div className="instrument-glow" />
      
      {/* Focus indicator ring */}
      {state === "active" && <div className="focus-ring" />}
    </div>
  );
});

// ============================================================================
// MAIN CONSOLE COMPONENT
// ============================================================================

export default function KPIConsole() {
  // Subscribe only to specific values needed, not the entire engineResults object
  const { activeScenarioId, scenario, hoveredKpiIndex, setHoveredKpiIndex } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      scenario: s.scenario,
      hoveredKpiIndex: s.hoveredKpiIndex,
      setHoveredKpiIndex: s.setHoveredKpiIndex,
    }))
  );
  
  // Subscribe to KPI values for active scenario only (avoids rerender on other scenario updates)
  const kpiValues = useScenarioStore((s) => s.engineResults[s.activeScenarioId]?.kpis ?? EMPTY_KPIS);
  
  const scenarioColor = SCENARIO_COLORS[scenario].primary;
  const [localHoverIndex, setLocalHoverIndex] = useState<number | null>(null);
  const [pulses, setPulses] = useState<Record<number, string>>({});

  // Stable callback for clearing local hover
  const handleMouseLeave = useCallback(() => setLocalHoverIndex(null), []);

  const isAnyActive = hoveredKpiIndex !== null;

  // CAUSAL HIGHLIGHT — KPI echo pulse (delayed ~50ms after user action)
  useEffect(() => {
    const off = onCausal((detail) => {
      const indices =
        detail.source === "scenario_switch"
          ? KPI_CONFIG.map((_, i) => i)
          : (detail.kpiIndices ?? []);
      if (!indices.length) return;

      window.setTimeout(() => {
        setPulses((prev) => {
          const next = { ...prev };
          for (const i of indices) next[i] = detail.color;
          return next;
        });

        window.setTimeout(() => {
          setPulses((prev) => {
            const next = { ...prev };
            for (const i of indices) delete next[i];
            return next;
          });
        }, 420);
      }, 50);
    });

    return off;
  }, []);

  return (
    <div className="kpi-command-console">
      {/* Command Console Container */}
      <div className="top-kpi-row">
        <div className="console-container">
        {/* Ambient backdrop layer */}
        <div className="console-backdrop" />
        
        <div className="kpi-groups">
          {KPI_GROUPS.map((g) => {
            const cols = g.items.length === 2 ? 2 : 3;
            const sizeClass = g.title === "MOMENTUM" ? "sf-kpi--narrow" : "sf-kpi--wide";

            return (
              <div key={g.title} className={sizeClass} data-kpi-group={g.title}>
                <KPIBezel
                  title={g.title}
                  cols={cols}
                >
                  {g.items.map((id) => {
                    const cfg = KPI_CONFIG.find((k) => k.id === id)!;
                    const index = KPI_CONFIG.findIndex((k) => k.id === cfg.id);
                    const data = kpiValues[cfg.kpiKey as keyof typeof kpiValues];
                    const isActive = hoveredKpiIndex === index;
                    const isHovered = localHoverIndex === index && !isActive;
                    const isDimmed = isAnyActive && !isActive;
                    const state: "idle" | "hover" | "active" = isActive
                      ? "active"
                      : isHovered
                        ? "hover"
                        : "idle";

                    return (
                      <div key={cfg.id} style={{ height: "100%" }}>
                        <KPIInstrumentCard
                          cfg={cfg}
                          data={data}
                          secondaryLine={null} /* REMOVED delta displays */
                          state={state}
                          isDimmed={isDimmed}
                          accentColor={isActive ? scenarioColor : cfg.accentColor}
                          pulseColor={pulses[index] ?? null}
                          onClick={() => setHoveredKpiIndex(hoveredKpiIndex === index ? null : index)}
                          onMouseEnter={() => setLocalHoverIndex(index)}
                          onMouseLeave={handleMouseLeave}
                          burnAmount={cfg.id === "burn" ? (kpiValues.burnQuality?.value ?? 0) * 1000 : undefined}
                          cashAmount={cfg.id === "burn" ? (kpiValues.cashPosition?.value ?? 0) * 100000 : undefined}
                        />
                      </div>
                    );
                  })}
                </KPIBezel>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}