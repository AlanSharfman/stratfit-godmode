// src/components/ui/KPICard.tsx
// STRATFIT — NEON KPI Cards with dramatic hover lift

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
  subValue?: string;
  isPositive?: boolean;
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
  const baseLevel = 0.3 + value01 * 0.4;
  let current = baseLevel * 0.7;
  
  for (let i = 0; i < length; i++) {
    const progress = i / (length - 1);
    const r = seededRandom(seed + i * 1.7);
    const trend = (value01 - 0.5) * 0.3 * progress;
    const noise = (r - 0.5) * 0.15;
    current = Math.max(0.08, Math.min(0.92, baseLevel + trend + noise));
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

// ============================================================================
// WIDGETS
// ============================================================================

const TrendSpark = ({ color, seed, value01 }: { color: string; seed: number; value01: number }) => {
  const d = useMemo(() => generateLiveSeries(seed, value01, 14), [seed, value01]);
  const p = smoothPath(d, 100, 40);
  
  return (
    <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkFill_${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`sparkGlow_${seed}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path 
        d={`${p} L 100 40 L 0 40 Z`} 
        fill={`url(#sparkFill_${seed})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path 
        d={p} 
        fill="none" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round"
        filter={`url(#sparkGlow_${seed})`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
};

const ProfitColumns = ({ color, seed, value01 }: { color: string; seed: number; value01: number }) => {
  const d = useMemo(() => {
    const bars: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = seededRandom(seed + i * 1.5);
      const height = 0.2 + value01 * 0.6 + r * 0.2;
      bars.push(Math.min(0.95, height));
    }
    return bars;
  }, [seed, value01]);

  return (
    <div className="flex items-end justify-between h-full w-full gap-[2px] px-1">
      {d.map((v, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm"
          style={{ background: color }}
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: `${25 + v * 75}%`,
            opacity: 0.4 + (i / 10) * 0.5
          }}
          transition={{ duration: 0.4, delay: i * 0.03, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const CashArea = ({ color, seed, value01 }: { color: string; seed: number; value01: number }) => {
  const d = useMemo(() => generateLiveSeries(seed + 5, value01, 12), [seed, value01]);
  const p = smoothPath(d, 100, 40);
  
  return (
    <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`areaFill_${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path 
        d={`${p} L 100 40 L 0 40 Z`} 
        fill={`url(#areaFill_${seed})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path 
        d={p} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
    </svg>
  );
};

const BurnBars = ({ color, seed, value01 }: { color: string; seed: number; value01: number }) => {
  const invertedValue = 1 - value01;
  
  const d = useMemo(() => {
    const bars: number[] = [];
    for (let i = 0; i < 8; i++) {
      const r = seededRandom(seed + i * 2);
      const height = 0.25 + invertedValue * 0.55 + r * 0.2;
      bars.push(Math.min(0.95, height));
    }
    return bars;
  }, [seed, invertedValue]);

  return (
    <div className="flex items-end justify-between h-full w-full gap-[3px] px-1">
      {d.map((v, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm"
          style={{ background: color }}
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: `${30 + v * 70}%`,
            opacity: 0.45 + (i / 8) * 0.45
          }}
          transition={{ duration: 0.4, delay: i * 0.04, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const RunwayGauge = ({ value01 }: { value01: number }) => {
  const v = Math.max(0, Math.min(1, value01));
  const arcLength = Math.PI * 36;
  const gaugeColor = "#3b82f6";
  
  return (
    <div className="flex items-center justify-center h-full w-full">
      <svg viewBox="0 0 80 45" className="w-full h-full">
        <defs>
          <filter id="gaugeGlowBlue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="gaugeGradBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path d="M8 40 A32 32 0 0 1 72 40" stroke="rgba(255,255,255,0.1)" strokeWidth="7" fill="none" strokeLinecap="round" />
        <motion.path
          d="M8 40 A32 32 0 0 1 72 40"
          stroke="url(#gaugeGradBlue)"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: arcLength * (1 - v) }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          filter="url(#gaugeGlowBlue)"
        />
        <text x="40" y="38" textAnchor="middle" fontSize="12" fontWeight="bold" fill={gaugeColor}>
          {Math.round(v * 100)}%
        </text>
      </svg>
    </div>
  );
};

const CacPie = ({ seed, value01 }: { seed: number; value01: number }) => {
  const slices = useMemo(() => {
    const efficiency = value01;
    const a = 0.15 + efficiency * 0.25;
    const b = 0.20 + seededRandom(seed + 1) * 0.15;
    const c = 0.15 + seededRandom(seed + 2) * 0.15;
    const d = Math.max(0.15, 1 - (a + b + c));
    const arr = [a, b, c, d];
    const sum = arr.reduce((s, x) => s + x, 0);
    return arr.map((x) => x / sum);
  }, [seed, value01]);

  const colors = ["#22d3ee", "#a78bfa", "#34d399", "#60a5fa"];
  const R = 16;
  const C = 2 * Math.PI * R;

  let acc = 0;
  return (
    <div className="flex items-center justify-center h-full w-full">
      <svg width="50" height="50" viewBox="0 0 50 50">
        <defs>
          <filter id="pieGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform="translate(25 25)">
          {slices.map((s, i) => {
            const dash = s * C;
            const gap = C - dash;
            const offset = C * (1 - acc);
            acc += s;
            return (
              <motion.circle
                key={i}
                r={R}
                cx={0}
                cy={0}
                fill="none"
                stroke={colors[i]}
                strokeWidth="6"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                filter="url(#pieGlow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              />
            );
          })}
          <circle r={9} cx={0} cy={0} fill="rgba(11,14,20,0.95)" />
        </g>
      </svg>
    </div>
  );
};

const ChurnRing = ({ value01 }: { value01: number }) => {
  const displayValue = 1 - value01;
  const v = Math.max(0, Math.min(1, displayValue));
  const R = 16;
  const C = 2 * Math.PI * R;
  const ringColor = "#22d3ee";

  return (
    <div className="flex items-center justify-center h-full w-full">
      <svg width="50" height="50" viewBox="0 0 50 50">
        <defs>
          <filter id="ringGlowAqua" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="ringGradAqua" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <g transform="translate(25 25) rotate(-90)">
          <circle r={R} cx={0} cy={0} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
          <motion.circle
            r={R}
            cx={0}
            cy={0}
            fill="none"
            stroke="url(#ringGradAqua)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - v) }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            filter="url(#ringGlowAqua)"
          />
        </g>
        <text x="25" y="29" textAnchor="middle" fontSize="11" fontWeight="bold" fill={ringColor}>
          {Math.round(v * 100)}%
        </text>
      </svg>
    </div>
  );
};

// ============================================================================
// MAIN CARD COMPONENT
// ============================================================================

export default function KPICard({
  label,
  value,
  subValue,
  isPositive = true,
  widgetType,
  accentColor,
  index,
  kpiIndex,
}: KPICardProps) {
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const dataPoints = useScenarioStore((s) => s.dataPoints);

  const seed = 40 + index * 17;
  const liveValue01 = dataPoints[kpiIndex] ?? 0.5;
  const isSelected = hoveredKpiIndex === kpiIndex;

  // Override colors for Runway and Churn
  let widgetColor = accentColor;
  let labelColor = accentColor;
  if (widgetType === "runwayGauge") {
    widgetColor = "#3b82f6";
    labelColor = "#3b82f6";
  } else if (widgetType === "churnRing") {
    widgetColor = "#22d3ee";
    labelColor = "#22d3ee";
  }

  const Widget = useMemo(() => {
    switch (widgetType) {
      case "trendSpark":
        return <TrendSpark color={widgetColor} seed={seed} value01={liveValue01} />;
      case "profitColumns":
        return <ProfitColumns color={widgetColor} seed={seed} value01={liveValue01} />;
      case "cashArea":
        return <CashArea color={widgetColor} seed={seed} value01={liveValue01} />;
      case "burnBars":
        return <BurnBars color={widgetColor} seed={seed} value01={liveValue01} />;
      case "runwayGauge":
        return <RunwayGauge value01={liveValue01} />;
      case "cacPie":
        return <CacPie seed={seed} value01={liveValue01} />;
      case "churnRing":
        return <ChurnRing value01={liveValue01} />;
      default:
        return <TrendSpark color={widgetColor} seed={seed} value01={liveValue01} />;
    }
  }, [widgetType, widgetColor, seed, liveValue01]);

  const isGaugeType = widgetType === "runwayGauge" || widgetType === "cacPie" || widgetType === "churnRing";

  return (
    <motion.button
      type="button"
      onMouseEnter={() => setHoveredKpiIndex(kpiIndex)}
      onMouseLeave={() => setHoveredKpiIndex(null)}
      onFocus={() => setHoveredKpiIndex(kpiIndex)}
      onBlur={() => setHoveredKpiIndex(null)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ 
        opacity: 1, 
        y: isSelected ? -16 : 0,
        scale: isSelected ? 1.05 : 1,
      }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      whileTap={{ scale: 0.98 }}
      className={`kpi-card ${isSelected ? 'selected' : ''}`}
      style={{
        "--accent": labelColor,
        "--accent-glow": `${labelColor}`,
      } as React.CSSProperties}
    >
      {/* Premium gradient border */}
      <div className="kpi-card-border-gradient" />
      
      {/* Inner card */}
      <div className="kpi-card-inner">
        {/* Neon glow wash */}
        <div className="kpi-card-glow" />

        {/* Content */}
        <div className="kpi-card-content">
          {/* Header */}
          <div className="kpi-card-header">
            <span className="kpi-label" style={{ color: labelColor }}>
              {label}
            </span>
            {subValue && (
              <span className={`kpi-delta ${isPositive ? "positive" : "negative"}`}>
                {subValue}
              </span>
            )}
          </div>

          {/* Value */}
          <div className="kpi-value">{value}</div>

          {/* Widget */}
          <div className={`kpi-widget ${isGaugeType ? "gauge" : "chart"}`}>
            {Widget}
          </div>
        </div>
      </div>

      <style>{`
        .kpi-card {
          position: relative;
          width: 100%;
          height: 100%;
          aspect-ratio: 1 / 1;
          padding: 2px;
          border-radius: 18px;
          cursor: pointer;
          text-align: left;
          background: transparent;
          border: none;
        }

        .kpi-card-border-gradient {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.1) 0%,
            rgba(255,255,255,0.05) 50%,
            rgba(255,255,255,0.1) 100%
          );
          opacity: 1;
          transition: all 0.3s ease;
        }

        .kpi-card.selected .kpi-card-border-gradient {
          background: linear-gradient(
            135deg,
            var(--accent-glow) 0%,
            transparent 50%,
            var(--accent-glow) 100%
          );
          opacity: 1;
          box-shadow: 
            0 0 20px var(--accent-glow),
            0 0 40px var(--accent-glow),
            inset 0 0 20px var(--accent-glow);
        }

        .kpi-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 16px;
          background: linear-gradient(
            145deg,
            rgba(15, 20, 30, 0.95) 0%,
            rgba(10, 15, 25, 0.98) 100%
          );
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .kpi-card.selected .kpi-card-inner {
          background: linear-gradient(
            145deg,
            rgba(20, 30, 45, 0.98) 0%,
            rgba(15, 22, 35, 0.99) 100%
          );
        }

        .kpi-card-glow {
          position: absolute;
          inset: -30px;
          background: radial-gradient(circle at 30% 20%, var(--accent-glow), transparent 60%);
          opacity: 0.15;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .kpi-card.selected .kpi-card-glow {
          opacity: 0.4;
        }

        .kpi-card:hover .kpi-card-glow {
          opacity: 0.3;
        }

        .kpi-card-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 12px;
        }

        .kpi-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 4px;
        }

        .kpi-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }

        .kpi-card.selected .kpi-label {
          text-shadow: 0 0 10px var(--accent-glow);
        }

        .kpi-delta {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .kpi-delta.positive {
          background: rgba(52, 211, 153, 0.15);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.25);
        }

        .kpi-delta.negative {
          background: rgba(251, 113, 133, 0.15);
          color: #fb7185;
          border: 1px solid rgba(251, 113, 133, 0.25);
        }

        .kpi-value {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          margin-top: 6px;
          line-height: 1.1;
          transition: all 0.3s ease;
        }

        .kpi-card.selected .kpi-value {
          text-shadow: 0 0 15px rgba(255,255,255,0.3);
        }

        .kpi-widget {
          flex: 1;
          min-height: 0;
          margin-top: 8px;
          display: flex;
          align-items: flex-end;
        }

        .kpi-widget.chart {
          padding-bottom: 4px;
        }

        .kpi-widget.gauge {
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </motion.button>
  );
}
