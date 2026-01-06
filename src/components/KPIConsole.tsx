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
    label: "CASH POSITION",
    kpiKey: "cashPosition",
    unit: "",
    widgetType: "globe",
    accentColor: "#22d3ee",
    relatedLevers: ["operatingExpenses", "fundingInjection"],
  },
  {
    id: "burn",
    label: "BURN RATE",
    kpiKey: "burnQuality",
    unit: "/mo",
    widgetType: "gauge",
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
    label: "ARR",
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

// 1. CASH — Reserve ring showing cash level (no continuous motion)
function CashInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  // Reserve level as percentage of ring fill (0-100 maps to arc)
  const reservePct = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 18;
  const reserveArc = (reservePct / 100) * circumference;
  
  return (
    <svg viewBox="0 0 48 48" className="instrument-svg">
      {/* Outer track ring */}
      <circle 
        cx="24" cy="24" r="18" 
        fill="none" 
        stroke="rgba(50,60,75,0.3)" 
        strokeWidth="3"
      />
      {/* Reserve level arc - fills based on cash position */}
      <circle 
        cx="24" cy="24" r="18" 
        fill="none" 
        stroke="rgba(34,211,238,0.6)" 
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${reserveArc} ${circumference}`}
        style={{ 
          transform: 'rotate(-90deg)',
          transformOrigin: '24px 24px',
          transition: `stroke-dasharray 500ms ${EASE_OUT}`
        }}
      />
      {/* Inner reference ring */}
      <circle cx="24" cy="24" r="12" fill="none" stroke="rgba(60,70,85,0.25)" strokeWidth="1"/>
      {/* Center indicator */}
      <circle cx="24" cy="24" r="4" fill="rgba(34,211,238,0.5)"/>
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

// 3. RUNWAY — Progress bar with rounded leading edge and end fade
function RunwayInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const pct = Math.min(100, Math.max(2, (value / 36) * 100));
  const fillWidth = Math.max(6, pct * 0.88);
  const fadeId = `runway-fade-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg viewBox="0 0 100 24" className="instrument-svg">
      <defs>
        {/* End fade gradient */}
        <linearGradient id={fadeId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.6)"/>
          <stop offset="85%" stopColor="rgba(34,211,238,0.6)"/>
          <stop offset="100%" stopColor="rgba(34,211,238,0.15)"/>
        </linearGradient>
      </defs>
      {/* Track with subtle end zone */}
      <rect x="4" y="9" width="92" height="6" rx="3" fill="rgba(30,35,45,0.7)"/>
      {/* Danger zone indicator at end */}
      <rect x="82" y="9" width="14" height="6" rx="0" fill="rgba(239,68,68,0.12)"/>
      {/* Runway fill with fade */}
      <rect 
        x="4" 
        y="9" 
        width={fillWidth} 
        height="6" 
        rx="3" 
        fill={`url(#${fadeId})`}
        style={{ transition: `width 400ms ${EASE_OUT}` }}
      />
      {/* Rounded leading edge cap */}
      <circle 
        cx={4 + fillWidth - 3} 
        cy="12" 
        r="3.5" 
        fill="rgba(34,211,238,0.7)"
        style={{ transition: `cx 400ms ${EASE_OUT}` }}
      />
    </svg>
  );
}

// 4. ARR — Sparkline with thicker final segment, faded history
function MomentumInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const fadeId = `arr-fade-${Math.random().toString(36).substr(2, 9)}`;
  // Generate deterministic sparkline based on value
  const points = Array.from({ length: 16 }, (_, i) => {
    const base = 28 - (value / 100) * 12;
    const variance = Math.sin(i * 0.8 + value * 0.1) * 6 + Math.cos(i * 1.2) * 3;
    const trend = (i / 15) * (value / 100) * -8;
    return { x: 4 + i * 5.5, y: Math.max(8, Math.min(38, base + variance + trend)) };
  });
  
  // Split into history (faded) and recent (bold)
  const historyPath = points.slice(0, 12).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const recentPath = points.slice(11).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  return (
    <svg viewBox="0 0 92 44" className="instrument-svg">
      <defs>
        <linearGradient id={fadeId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(100,115,130,0.2)"/>
          <stop offset="100%" stopColor="rgba(100,115,130,0.5)"/>
        </linearGradient>
      </defs>
      {/* Baseline reference */}
      <line x1="4" y1="24" x2="88" y2="24" stroke="rgba(60,70,85,0.2)" strokeWidth="0.5" strokeDasharray="2 3"/>
      {/* History segment (faded) */}
      <path 
        d={historyPath} 
        fill="none" 
        stroke={`url(#${fadeId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: `d 350ms ${EASE_OUT}` }}
      />
      {/* Recent segment (bold) */}
      <path 
        d={recentPath} 
        fill="none" 
        stroke="rgba(140,160,180,0.8)" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: `d 350ms ${EASE_OUT}` }}
      />
      {/* Current value dot */}
      <circle cx={points[15].x} cy={points[15].y} r="3.5" fill="rgba(34,211,238,0.7)"/>
    </svg>
  );
}

// 5. GROSS MARGIN — Banded range with position indicator
function EarningsInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const pct = Math.min(100, Math.max(0, value));
  const indicatorX = 4 + (pct / 100) * 72;
  
  return (
    <svg viewBox="0 0 80 32" className="instrument-svg">
      {/* Low band (0-40%) - warning */}
      <rect x="4" y="12" width="28.8" height="8" fill="rgba(239,68,68,0.15)"/>
      {/* Mid band (40-70%) - acceptable */}
      <rect x="32.8" y="12" width="21.6" height="8" fill="rgba(217,119,6,0.12)"/>
      {/* High band (70-100%) - healthy */}
      <rect x="54.4" y="12" width="21.6" height="8" fill="rgba(74,222,128,0.12)"/>
      {/* Track outline */}
      <rect x="4" y="12" width="72" height="8" rx="1" fill="none" stroke="rgba(60,70,85,0.35)" strokeWidth="1"/>
      {/* Position indicator line */}
      <line 
        x1={indicatorX} 
        y1="8" 
        x2={indicatorX} 
        y2="24" 
        stroke="rgba(34,211,238,0.75)" 
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: `x1 300ms ${EASE_OUT}, x2 300ms ${EASE_OUT}` }}
      />
      {/* Indicator cap */}
      <circle 
        cx={indicatorX} 
        cy="16" 
        r="3" 
        fill="rgba(34,211,238,0.6)"
        style={{ transition: `cx 300ms ${EASE_OUT}` }}
      />
    </svg>
  );
}

// 6. RISK SCORE — Thickened arc with single numeric display
function RiskInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  const color = score < 35 ? "rgba(74,222,128,0.75)" : score < 65 ? "rgba(217,119,6,0.75)" : "rgba(239,68,68,0.75)";
  
  return (
    <svg viewBox="0 0 60 50" className="instrument-svg">
      {/* Arc track - thicker */}
      <path 
        d="M8 38 A 22 22 0 0 1 52 38" 
        fill="none" 
        stroke="rgba(40,48,60,0.5)" 
        strokeWidth="5" 
        strokeLinecap="round"
      />
      {/* Colored arc based on value - thicker */}
      <path 
        d="M8 38 A 22 22 0 0 1 52 38" 
        fill="none" 
        stroke={color}
        strokeWidth="5" 
        strokeLinecap="round"
        strokeDasharray="110"
        strokeDashoffset={110 - (score / 100) * 110}
        style={{ transition: `stroke-dashoffset 400ms ${EASE_OUT}, stroke 300ms ${EASE_OUT}` }}
      />
      {/* Score display - prominent single number */}
      <text 
        x="30" 
        y="32" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="600" 
        fill="rgba(160,175,190,0.9)"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {score}
      </text>
    </svg>
  );
}

// 7. VALUATION — Confidence band with baseline indicator
function ValueInstrument({ value, state }: { value: number; state: "idle" | "hover" | "active" }) {
  const normalized = Math.min(100, Math.max(0, value));
  const baselineX = 40; // Center baseline
  const indicatorX = 10 + (normalized / 100) * 60; // Current position
  const bandWidth = Math.abs(indicatorX - baselineX) + 8;
  const bandX = Math.min(indicatorX, baselineX) - 4;
  
  return (
    <svg viewBox="0 0 80 36" className="instrument-svg">
      {/* Confidence band behind baseline */}
      <rect 
        x={bandX} 
        y="10" 
        width={bandWidth} 
        height="16" 
        rx="2" 
        fill="rgba(34,211,238,0.08)"
        style={{ transition: `x 500ms ${EASE_OUT}, width 500ms ${EASE_OUT}` }}
      />
      {/* Track */}
      <line x1="10" y1="18" x2="70" y2="18" stroke="rgba(55,65,80,0.4)" strokeWidth="1.5"/>
      {/* Baseline marker */}
      <line x1={baselineX} y1="12" x2={baselineX} y2="24" stroke="rgba(90,105,120,0.5)" strokeWidth="1.5"/>
      {/* Current value indicator */}
      <line 
        x1={indicatorX} 
        y1="10" 
        x2={indicatorX} 
        y2="26" 
        stroke="rgba(34,211,238,0.7)" 
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: `x1 500ms ${EASE_OUT}, x2 500ms ${EASE_OUT}` }}
      />
      {/* Indicator cap */}
      <circle 
        cx={indicatorX} 
        cy="18" 
        r="3.5" 
        fill="rgba(34,211,238,0.6)"
        style={{ transition: `cx 500ms ${EASE_OUT}` }}
      />
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
  data: { value: number; display: string } | undefined;
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
          <div className="instrument-visual">
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
                  columns={cols as 2 | 3}
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
                      <KPIInstrumentCard
                        key={cfg.id}
                        cfg={cfg}
                        data={data}
                        secondaryLine={
                          cfg.id === "arrGrowth"
                            ? `Δ ARR ${kpiValues?.arrDelta?.display ?? "—"}`
                            : null
                        }
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
                    );
                  })}
                </KPIBezel>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}