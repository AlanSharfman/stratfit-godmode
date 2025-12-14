// src/components/ui/KPICard.tsx
// STRATFIT — KPI Cards with SUBTLE hover (not neon)

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// TYPES
// ============================================================================

export type WidgetType =
  | "trendSpark"
  | "profitColumns"
  | "cashArea"
  | "burnBars"
  | "runwayGauge"
  | "cacPie"
  | "churnRing";

export interface KPICardProps {
  label: string;
  value: string;
  rawValue?: number;
  baselineValue?: number;
  subValue?: string;
  isPositive?: boolean;
  isInverted?: boolean;
  widgetType: WidgetType;
  accentColor: string;
  index: number;
  kpiIndex: number;
}

// ============================================================================
// HELPERS
// ============================================================================

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const generateLiveSeries = (seed: number, value01: number, length: number) => {
  const data: number[] = [];
  const baseLevel = 0.15 + value01 * 0.7;
  let current = baseLevel * 0.6;
  
  for (let i = 0; i < length; i++) {
    const progress = i / (length - 1);
    const r = seededRandom(seed + i * 1.7);
    const trend = (value01 - 0.3) * 0.5 * progress;
    const noise = (r - 0.5) * 0.12;
    current = Math.max(0.05, Math.min(0.95, baseLevel + trend + noise));
    data.push(current);
  }
  return data;
};

const smoothPath = (data: number[], w: number, h: number) => {
  if (!data.length) return "";
  const step = w / (data.length - 1);
  let d = `M 0 ${h * (1 - data[0])}`;
  for (let i = 0; i < data.length - 1; i++) {
    const x0 = i * step;
    const y0 = h * (1 - data[i]);
    const x1 = (i + 1) * step;
    const y1 = h * (1 - data[i + 1]);
    d += ` C ${x0 + (x1 - x0) / 2} ${y0}, ${x1 - (x1 - x0) / 2} ${y1}, ${x1} ${y1}`;
  }
  return d;
};

function calculateDelta(current: number, baseline: number, isInverted: boolean): { value: number; isPositive: boolean } {
  if (!baseline || baseline === 0) return { value: 0, isPositive: true };
  const delta = ((current - baseline) / Math.abs(baseline)) * 100;
  const isPositive = isInverted ? delta <= 0 : delta >= 0;
  return { value: Math.abs(delta), isPositive };
}

// ============================================================================
// WIDGETS
// ============================================================================

const TrendSpark = ({ color, seed, value01 }: { color: string; seed: number; value01: number }) => {
  const d = useMemo(() => generateLiveSeries(seed, value01, 16), [seed, value01]);
  const p = smoothPath(d, 100, 44);
  return (
    <svg viewBox="0 0 100 44" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkFill_${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${p} L 100 44 L 0 44 Z`} fill={`url(#sparkFill_${seed})`} />
      <path d={p} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const ProfitColumns = ({ color, seed, value01 }: { color: string; seed: number; value01: number }) => {
  const d = useMemo(() => {
    const bars: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = seededRandom(seed + i * 1.5);
      const height = 0.15 + value01 * 0.75 + r * 0.1;
      bars.push(Math.min(0.98, height));
    }
    return bars;
  }, [seed, value01]);
  return (
    <div className="flex items-end justify-between h-full w-full gap-[2px] px-1">
      {d.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all duration-300"
          style={{ background: color, height: `${20 + v * 80}%`, opacity: 0.4 + (i / 10) * 0.55 }} />
      ))}
    </div>
  );
};

const CashArea = ({ color, seed, value01 }: { color: string; seed: number; value01: number }) => {
  const d = useMemo(() => generateLiveSeries(seed + 5, value01, 14), [seed, value01]);
  const p = smoothPath(d, 100, 44);
  return (
    <svg viewBox="0 0 100 44" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`areaFill_${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${p} L 100 44 L 0 44 Z`} fill={`url(#areaFill_${seed})`} />
      <path d={p} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const BurnBars = ({ color, seed, value01 }: { color: string; seed: number; value01: number }) => {
  const d = useMemo(() => {
    const bars: number[] = [];
    for (let i = 0; i < 8; i++) {
      const r = seededRandom(seed + i * 2);
      const height = 0.2 + (1 - value01) * 0.65 + r * 0.15;
      bars.push(Math.min(0.95, height));
    }
    return bars;
  }, [seed, value01]);
  return (
    <div className="flex items-end justify-between h-full w-full gap-[3px] px-1">
      {d.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all duration-300"
          style={{ background: color, height: `${25 + v * 75}%`, opacity: 0.45 + (i / 8) * 0.5 }} />
      ))}
    </div>
  );
};

const RunwayGauge = ({ value01 }: { value01: number }) => {
  const v = Math.max(0, Math.min(1, value01));
  const arcLength = Math.PI * 42;
  return (
    <div className="flex items-center justify-center h-full w-full">
      <svg viewBox="0 0 90 52" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeGradBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path d="M6 46 A38 38 0 0 1 84 46" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M6 46 A38 38 0 0 1 84 46" stroke="url(#gaugeGradBlue)" strokeWidth="6" fill="none" strokeLinecap="round"
          strokeDasharray={arcLength} strokeDashoffset={arcLength * (1 - v)} className="transition-all duration-500" />
        <text x="45" y="42" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#3b82f6">{Math.round(v * 100)}%</text>
      </svg>
    </div>
  );
};

const CacPie = ({ seed, value01 }: { seed: number; value01: number }) => {
  const slices = useMemo(() => {
    const a = 0.15 + value01 * 0.25;
    const b = 0.20 + seededRandom(seed + 1) * 0.15;
    const c = 0.15 + seededRandom(seed + 2) * 0.15;
    const d = Math.max(0.15, 1 - (a + b + c));
    const arr = [a, b, c, d];
    const sum = arr.reduce((s, x) => s + x, 0);
    return arr.map((x) => x / sum);
  }, [seed, value01]);
  const colors = ["#22d3ee", "#a78bfa", "#34d399", "#60a5fa"];
  const R = 22, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center justify-center h-full w-full">
      <svg width="70" height="70" viewBox="0 0 70 70">
        <g transform="translate(35 35)">
          {slices.map((s, i) => {
            const dash = s * C, gap = C - dash, offset = C * (1 - acc);
            acc += s;
            return <circle key={i} r={R} cx={0} cy={0} fill="none" stroke={colors[i]} strokeWidth="7"
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset} strokeLinecap="butt" />;
          })}
          <circle r={12} cx={0} cy={0} fill="rgba(11,14,20,0.95)" />
        </g>
      </svg>
    </div>
  );
};

const ChurnRing = ({ value01 }: { value01: number }) => {
  const v = Math.max(0, Math.min(1, 1 - value01));
  const R = 22, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center justify-center h-full w-full">
      <svg width="70" height="70" viewBox="0 0 70 70">
        <defs>
          <linearGradient id="ringGradAqua2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" /><stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <g transform="translate(35 35) rotate(-90)">
          <circle r={R} cx={0} cy={0} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle r={R} cx={0} cy={0} fill="none" stroke="url(#ringGradAqua2)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - v)} className="transition-all duration-500" />
        </g>
        <text x="35" y="40" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#22d3ee">{Math.round(v * 100)}%</text>
      </svg>
    </div>
  );
};

// ============================================================================
// MAIN CARD
// ============================================================================

export default function KPICard({
  label, value, rawValue = 0, baselineValue = 0, subValue, isPositive = true, isInverted = false,
  widgetType, accentColor, index, kpiIndex,
}: KPICardProps) {
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const dataPoints = useScenarioStore((s) => s.dataPoints);

  const seed = 40 + index * 17;
  const liveValue01 = dataPoints[kpiIndex] ?? 0.5;
  const isSelected = hoveredKpiIndex === kpiIndex;

  const delta = useMemo(() => {
    if (rawValue && baselineValue) return calculateDelta(rawValue, baselineValue, isInverted);
    return null;
  }, [rawValue, baselineValue, isInverted]);

  let widgetColor = accentColor, labelColor = accentColor;
  if (widgetType === "runwayGauge") { widgetColor = "#3b82f6"; labelColor = "#3b82f6"; }
  else if (widgetType === "churnRing") { widgetColor = "#22d3ee"; labelColor = "#22d3ee"; }

  const Widget = useMemo(() => {
    switch (widgetType) {
      case "trendSpark": return <TrendSpark color={widgetColor} seed={seed} value01={liveValue01} />;
      case "profitColumns": return <ProfitColumns color={widgetColor} seed={seed} value01={liveValue01} />;
      case "cashArea": return <CashArea color={widgetColor} seed={seed} value01={liveValue01} />;
      case "burnBars": return <BurnBars color={widgetColor} seed={seed} value01={liveValue01} />;
      case "runwayGauge": return <RunwayGauge value01={liveValue01} />;
      case "cacPie": return <CacPie seed={seed} value01={liveValue01} />;
      case "churnRing": return <ChurnRing value01={liveValue01} />;
      default: return <TrendSpark color={widgetColor} seed={seed} value01={liveValue01} />;
    }
  }, [widgetType, widgetColor, seed, liveValue01]);

  const isGaugeType = widgetType === "runwayGauge" || widgetType === "cacPie" || widgetType === "churnRing";
  const deltaDisplay = delta ? (delta.value < 0.1 ? "—" : `${delta.isPositive ? "+" : "-"}${delta.value.toFixed(1)}%`) : subValue || "";
  const deltaIsPositive = delta ? delta.isPositive : isPositive;

  return (
    <motion.button type="button"
      onMouseEnter={() => setHoveredKpiIndex(kpiIndex)}
      onMouseLeave={() => setHoveredKpiIndex(null)}
      onFocus={() => setHoveredKpiIndex(kpiIndex)}
      onBlur={() => setHoveredKpiIndex(null)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: isSelected ? -8 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      whileTap={{ scale: 0.98 }}
      className="kpi-card" style={{ "--accent": labelColor } as React.CSSProperties}>
      <div className={`kpi-card-glass ${isSelected ? 'selected' : ''}`}>
        <div className="kpi-card-content">
          <div className="kpi-card-header">
            <span className="kpi-label" style={{ color: labelColor }}>{label}</span>
            {deltaDisplay && (
              <span className={`kpi-delta ${deltaIsPositive ? "positive" : "negative"}`}>{deltaDisplay}</span>
            )}
          </div>
          <div className="kpi-value">{value}</div>
          <div className={`kpi-widget ${isGaugeType ? "gauge" : "chart"}`}>{Widget}</div>
        </div>
      </div>
      <style>{`
        .kpi-card { position: relative; width: 100%; height: 100%; aspect-ratio: 1 / 1; border-radius: 16px; cursor: pointer; text-align: left; background: transparent; border: none; padding: 0; }
        .kpi-card-glass { width: 100%; height: 100%; border-radius: 16px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden; transition: all 0.25s ease; }
        .kpi-card-glass:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.12); }
        .kpi-card-glass.selected { background: rgba(255, 255, 255, 0.06); border-color: var(--accent); box-shadow: 0 0 20px rgba(255, 255, 255, 0.05); }
        .kpi-card-content { display: flex; flex-direction: column; height: 100%; padding: 14px; }
        .kpi-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 4px; }
        .kpi-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .kpi-delta { font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 6px; font-variant-numeric: tabular-nums; }
        .kpi-delta.positive { background: rgba(52, 211, 153, 0.15); color: #34d399; }
        .kpi-delta.negative { background: rgba(251, 113, 133, 0.15); color: #fb7185; }
        .kpi-value { font-size: 24px; font-weight: 800; color: #fff; margin-top: 8px; line-height: 1.1; }
        .kpi-widget { flex: 1; min-height: 0; margin-top: 10px; display: flex; align-items: flex-end; }
        .kpi-widget.gauge { align-items: center; justify-content: center; }
      `}</style>
    </motion.button>
  );
}
