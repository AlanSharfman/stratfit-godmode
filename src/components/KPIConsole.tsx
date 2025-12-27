// src/components/KPIConsole.tsx
// STRATFIT — Executive Command Console
// KPI Strip Step 2: Add instrument presence to ACTIVE KPI only (subtle lift + emphasis)

import React, { useState, useCallback, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore, SCENARIO_COLORS } from "@/state/scenarioStore";
import BurnTrendBars from "./BurnTrendBars";
import type { LeverId } from "@/logic/mountainPeakModel";

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
    accentColor: "#f97316",
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

// ============================================================================
// INSTRUMENT WIDGETS — keep visuals, but rail styling (Step 1)
// ============================================================================

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

function CashInstrument({ value }: { value: number }) {
  const reservePct = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 18;
  const reserveArc = (reservePct / 100) * circumference;

  return (
    <svg viewBox="0 0 48 48" className="instrument-svg">
      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(50,60,75,0.28)" strokeWidth="3" />
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="rgba(34,211,238,0.55)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${reserveArc} ${circumference}`}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "24px 24px",
          transition: `stroke-dasharray 500ms ${EASE_OUT}`,
        }}
      />
      <circle cx="24" cy="24" r="12" fill="none" stroke="rgba(60,70,85,0.22)" strokeWidth="1" />
      <circle cx="24" cy="24" r="4" fill="rgba(34,211,238,0.45)" />
    </svg>
  );
}

function BurnInstrument({
  value,
  burnAmount,
}: {
  value: number;
  burnAmount?: number;
}) {
  const burn = burnAmount ?? value * 1000;

  const baseline = 85000;
  const diff = burn - baseline;
  const threshold = baseline * 0.05;

  let trend: "positive" | "negative" | "neutral" = "neutral";
  if (diff < -threshold) trend = "positive";
  else if (diff > threshold) trend = "negative";

  return <BurnTrendBars value={burn} trend={trend} />;
}

function RunwayInstrument({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(2, (value / 36) * 100));
  const fillWidth = Math.max(6, pct * 0.88);
  const fadeId = `runway-fade-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg viewBox="0 0 100 24" className="instrument-svg">
      <defs>
        <linearGradient id={fadeId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.55)" />
          <stop offset="85%" stopColor="rgba(34,211,238,0.55)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0.12)" />
        </linearGradient>
      </defs>
      <rect x="4" y="9" width="92" height="6" rx="3" fill="rgba(30,35,45,0.62)" />
      <rect x="82" y="9" width="14" height="6" rx="0" fill="rgba(239,68,68,0.10)" />
      <rect
        x="4"
        y="9"
        width={fillWidth}
        height="6"
        rx="3"
        fill={`url(#${fadeId})`}
        style={{ transition: `width 400ms ${EASE_OUT}` }}
      />
      <circle
        cx={4 + fillWidth - 3}
        cy="12"
        r="3.5"
        fill="rgba(34,211,238,0.62)"
        style={{ transition: `cx 400ms ${EASE_OUT}` }}
      />
    </svg>
  );
}

function MomentumInstrument({ value }: { value: number }) {
  const fadeId = `arr-fade-${Math.random().toString(36).substr(2, 9)}`;
  const points = Array.from({ length: 16 }, (_, i) => {
    const base = 28 - (value / 100) * 12;
    const variance = Math.sin(i * 0.8 + value * 0.1) * 6 + Math.cos(i * 1.2) * 3;
    const trend = (i / 15) * (value / 100) * -8;
    return { x: 4 + i * 5.5, y: Math.max(8, Math.min(38, base + variance + trend)) };
  });

  const historyPath = points
    .slice(0, 12)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const recentPath = points
    .slice(11)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <svg viewBox="0 0 92 44" className="instrument-svg">
      <defs>
        <linearGradient id={fadeId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(100,115,130,0.18)" />
          <stop offset="100%" stopColor="rgba(100,115,130,0.45)" />
        </linearGradient>
      </defs>
      <line x1="4" y1="24" x2="88" y2="24" stroke="rgba(60,70,85,0.18)" strokeWidth="0.5" strokeDasharray="2 3" />
      <path
        d={historyPath}
        fill="none"
        stroke={`url(#${fadeId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: `d 350ms ${EASE_OUT}` }}
      />
      <path
        d={recentPath}
        fill="none"
        stroke="rgba(140,160,180,0.75)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: `d 350ms ${EASE_OUT}` }}
      />
      <circle cx={points[15].x} cy={points[15].y} r="3.5" fill="rgba(34,211,238,0.62)" />
    </svg>
  );
}

function EarningsInstrument({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const indicatorX = 4 + (pct / 100) * 72;

  return (
    <svg viewBox="0 0 80 32" className="instrument-svg">
      <rect x="4" y="12" width="28.8" height="8" fill="rgba(239,68,68,0.12)" />
      <rect x="32.8" y="12" width="21.6" height="8" fill="rgba(217,119,6,0.10)" />
      <rect x="54.4" y="12" width="21.6" height="8" fill="rgba(74,222,128,0.10)" />
      <rect x="4" y="12" width="72" height="8" rx="1" fill="none" stroke="rgba(60,70,85,0.30)" strokeWidth="1" />
      <line
        x1={indicatorX}
        y1="8"
        x2={indicatorX}
        y2="24"
        stroke="rgba(34,211,238,0.62)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: `x1 300ms ${EASE_OUT}, x2 300ms ${EASE_OUT}` }}
      />
      <circle
        cx={indicatorX}
        cy="16"
        r="3"
        fill="rgba(34,211,238,0.50)"
        style={{ transition: `cx 300ms ${EASE_OUT}` }}
      />
    </svg>
  );
}

function RiskInstrument({ value }: { value: number }) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  const color =
    score < 35
      ? "rgba(74,222,128,0.68)"
      : score < 65
      ? "rgba(217,119,6,0.68)"
      : "rgba(239,68,68,0.68)";

  return (
    <svg viewBox="0 0 60 50" className="instrument-svg">
      <path
        d="M8 38 A 22 22 0 0 1 52 38"
        fill="none"
        stroke="rgba(40,48,60,0.45)"
        strokeWidth="5"
        strokeLinecap="round"
      />
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
      <text
        x="30"
        y="32"
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill="rgba(160,175,190,0.88)"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {score}
      </text>
    </svg>
  );
}

function ValueInstrument({ value }: { value: number }) {
  const normalized = Math.min(100, Math.max(0, value));
  const baselineX = 40;
  const indicatorX = 10 + (normalized / 100) * 60;
  const bandWidth = Math.abs(indicatorX - baselineX) + 8;
  const bandX = Math.min(indicatorX, baselineX) - 4;

  return (
    <svg viewBox="0 0 80 36" className="instrument-svg">
      <rect
        x={bandX}
        y="10"
        width={bandWidth}
        height="16"
        rx="2"
        fill="rgba(34,211,238,0.06)"
        style={{ transition: `x 500ms ${EASE_OUT}, width 500ms ${EASE_OUT}` }}
      />
      <line x1="10" y1="18" x2="70" y2="18" stroke="rgba(55,65,80,0.36)" strokeWidth="1.5" />
      <line x1={baselineX} y1="12" x2={baselineX} y2="24" stroke="rgba(90,105,120,0.45)" strokeWidth="1.5" />
      <line
        x1={indicatorX}
        y1="10"
        x2={indicatorX}
        y2="26"
        stroke="rgba(34,211,238,0.60)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: `x1 500ms ${EASE_OUT}, x2 500ms ${EASE_OUT}` }}
      />
      <circle
        cx={indicatorX}
        cy="18"
        r="3.5"
        fill="rgba(34,211,238,0.50)"
        style={{ transition: `cx 500ms ${EASE_OUT}` }}
      />
    </svg>
  );
}

function InstrumentWidget({
  type,
  value,
  burnAmount,
}: {
  type: KPIConfig["widgetType"];
  value: number;
  burnAmount?: number;
}) {
  switch (type) {
    case "bar":
      return <RunwayInstrument value={value} />;
    case "globe":
      return <CashInstrument value={value} />;
    case "arrow":
      return <MomentumInstrument value={value} />;
    case "gauge":
      return <BurnInstrument value={value} burnAmount={burnAmount} />;
    case "dial":
      return <RiskInstrument value={value} />;
    case "chart":
      return <EarningsInstrument value={value} />;
    case "ring":
      return <ValueInstrument value={value} />;
  }
}

// ============================================================================
// KPI CELL (formerly card) — Step 1: Flat instrument cell, no widget chrome
// ============================================================================

interface KPIInstrumentCardProps {
  cfg: KPIConfig;
  data: { value: number; display: string } | undefined;
  state: "idle" | "hover" | "active";
  isDimmed: boolean;
  accentColor: string;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  burnAmount?: number;
}

const KPIInstrumentCard = memo(function KPIInstrumentCard({
  cfg,
  data,
  state,
  isDimmed,
  accentColor,
  onClick,
  onMouseEnter,
  onMouseLeave,
  burnAmount,
}: KPIInstrumentCardProps) {
  return (
    <div
      className={`kpi-cell ${state} ${isDimmed ? "dimmed" : ""}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ["--kpi-accent" as string]: accentColor,
      }}
    >
      <div className="cell-inner">
        <div className="cell-label-row">
          <span className="cell-label">{cfg.label}</span>
        </div>

        <div className="cell-value-row">
          <span className="cell-value">{data?.display ?? "—"}</span>
          {cfg.unit && <span className="cell-unit">{cfg.unit}</span>}
        </div>

        <div className="cell-visual" aria-hidden="true">
          <InstrumentWidget type={cfg.widgetType} value={data?.value ?? 0} burnAmount={burnAmount} />
        </div>
      </div>

      {/* Step 1: active marker is structural + calm (no glow/pulse, no lift) */}
      <div className="cell-active-underline" />
    </div>
  );
});

// ============================================================================
// MAIN CONSOLE COMPONENT (logic unchanged)
// ============================================================================

export default function KPIConsole() {
  const { activeScenarioId, scenario, hoveredKpiIndex, setHoveredKpiIndex } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      scenario: s.scenario,
      hoveredKpiIndex: s.hoveredKpiIndex,
      setHoveredKpiIndex: s.setHoveredKpiIndex,
    }))
  );

  const kpiValues = useScenarioStore((s) => s.engineResults[s.activeScenarioId]?.kpis || {});

  const scenarioColor = SCENARIO_COLORS[scenario].primary;
  const [localHoverIndex, setLocalHoverIndex] = useState<number | null>(null);

  const handleMouseLeave = useCallback(() => setLocalHoverIndex(null), []);

  const isAnyActive = hoveredKpiIndex !== null;

  return (
    <div className="kpi-command-console">
      <div className="console-container">
        <div className="console-backdrop" />

        <div className="instrument-rail" role="group" aria-label="KPI instrument rail">
          {KPI_CONFIG.map((cfg, index) => {
            const data = kpiValues[cfg.kpiKey as keyof typeof kpiValues];
            const isActive = hoveredKpiIndex === index;
            const isHovered = localHoverIndex === index && !isActive;
            const isDimmed = isAnyActive && !isActive;
            const state: "idle" | "hover" | "active" = isActive ? "active" : isHovered ? "hover" : "idle";

            return (
              <KPIInstrumentCard
                key={cfg.id}
                cfg={cfg}
                data={data}
                state={state}
                isDimmed={isDimmed}
                accentColor={isActive ? scenarioColor : cfg.accentColor}
                onClick={() => setHoveredKpiIndex(hoveredKpiIndex === index ? null : index)}
                onMouseEnter={() => setLocalHoverIndex(index)}
                onMouseLeave={handleMouseLeave}
                burnAmount={cfg.id === "burn" ? (kpiValues.burnQuality?.value ?? 0) * 1000 : undefined}
              />
            );
          })}
        </div>
      </div>

      <style>{`
        /* ============================================
           COMMAND CONSOLE — TOP LEVEL (strip-level surface)
           ============================================ */
        .kpi-command-console {
          width: 100%;
          padding: 0;
          position: relative;
        }

        .console-container {
          position: relative;
          margin: 0 auto;
          max-width: 1400px;
          padding: 12px 18px;
          background: linear-gradient(
            168deg,
            rgba(12, 16, 24, 0.96) 0%,
            rgba(8, 12, 18, 0.98) 55%,
            rgba(6, 8, 12, 1) 100%
          );
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.03),
            inset 0 -1px 0 rgba(0, 0, 0, 0.45),
            0 10px 30px rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(12px);
        }

        .console-backdrop {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: radial-gradient(
            ellipse 70% 50% at 50% 40%,
            rgba(34, 211, 238, 0.02) 0%,
            transparent 72%
          );
          pointer-events: none;
        }

        /* ============================================
           INSTRUMENT RAIL (single surface, subtle dividers)
           ============================================ */
        .instrument-rail {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: stretch;
          gap: 0;
          border-radius: 14px;
          overflow: hidden;

          /* Rail-level inner surface (no per-KPI cards) */
          background: linear-gradient(
            172deg,
            rgba(18, 24, 34, 0.78) 0%,
            rgba(12, 16, 24, 0.86) 55%,
            rgba(8, 10, 16, 0.92) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.02),
            inset 0 -1px 0 rgba(0, 0, 0, 0.35);
        }

        /* ============================================
           KPI CELL (flat readout; no card chrome)
           ============================================ */
        .kpi-cell {
          position: relative;
          flex: 1;
          min-width: 0;

          /* No "card" borders, no rounded rectangles, no shadows */
          background: transparent;

          /* Calm interaction only: color/underline, subtle lift on active */
          cursor: pointer;
          transition: opacity 160ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Dividers between cells (rail-level separation, not boxes) */
        .kpi-cell + .kpi-cell {
          border-left: 1px solid rgba(255, 255, 255, 0.045);
        }

        .kpi-cell.dimmed {
          opacity: 0.50;
        }

        /* No lift on hover (keep it calm) */
        .kpi-cell.hover {
          opacity: 0.92;
        }

        /* Step 2: Subtle vertical lift on ACTIVE only */
        .kpi-cell.active {
          opacity: 1;
          transform: translateY(-3px);
        }

        .cell-inner {
          padding: 12px 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 132px;
        }

        .cell-label-row {
          display: flex;
          align-items: center;
          min-height: 12px;
        }

        .cell-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2.1px;
          text-transform: uppercase;
          color: rgba(140, 160, 180, 0.66);
          transition: color 160ms ease;
        }

        .kpi-cell.active .cell-label {
          color: rgba(200, 220, 240, 0.92);
        }

        .cell-value-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-top: 2px;
          white-space: nowrap;
        }

        .cell-value {
          font-size: 26px;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.98);
          letter-spacing: -0.8px;
          line-height: 1;
          /* Keep it authoritative, not glossy */
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.32);
          transition: color 180ms ease;
        }

        .kpi-cell.active .cell-value {
          color: var(--kpi-accent);
        }

        .cell-unit {
          font-size: 11px;
          font-weight: 700;
          color: rgba(120, 140, 160, 0.62);
          margin-left: 2px;
        }

        /* Visual region is fixed-height to avoid layout push */
        .cell-visual {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 58px;
          margin-top: 2px;
          opacity: 0.90;
          transition: opacity 180ms ease;
        }

        /* Step 2: Strengthen visual emphasis on active */
        .kpi-cell.active .cell-visual {
          opacity: 1;
        }

        /* De-emphasize visuals when dimmed */
        .kpi-cell.dimmed .cell-visual {
          opacity: 0.70;
        }

        .instrument-svg {
          width: 100%;
          height: auto;
          max-height: 58px;
        }

        /* Active underline = structural focus (no glow/pulse) */
        .cell-active-underline {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background: transparent;
          opacity: 0;
          transition: opacity 160ms ease, background 160ms ease;
        }

        .kpi-cell.active .cell-active-underline {
          opacity: 0.85;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--kpi-accent) 25%,
            var(--kpi-accent) 75%,
            transparent 100%
          );
        }

        /* ============================================
           RESPONSIVE (keep single row)
           ============================================ */
        @media (max-width: 1400px) {
          .cell-value {
            font-size: 24px;
          }
          .cell-inner {
            min-height: 128px;
          }
        }

        @media (max-width: 1200px) {
          .console-container {
            padding: 10px 14px;
          }
          .cell-inner {
            padding: 11px 12px 9px;
            min-height: 124px;
          }
          .cell-value {
            font-size: 22px;
          }
          .cell-label {
            font-size: 8px;
            letter-spacing: 1.8px;
          }
        }
      `}</style>
    </div>
  );
}
