// src/components/ui/KPICard.tsx
// STRATFIT — Premium KPI Card with Visible Micro-Widgets
// Glass + emerald borders + premium glow

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// TYPES
// ============================================================================

export interface KPICardProps {
  index: number;
  label: string;
  value: string;
  rawValue: number;
  color: string;
  widgetType: "sparkline" | "bars" | "donut" | "gauge";
}

// ============================================================================
// MICRO-VISUAL COMPONENTS — All render visibly
// ============================================================================

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function generateSparkline(seed: number, points: number = 10): number[] {
  const data: number[] = [];
  let val = 0.5;
  for (let i = 0; i < points; i++) {
    val += (seededRandom(seed + i) - 0.48) * 0.3;
    val = Math.max(0.15, Math.min(0.9, val));
    data.push(val);
  }
  return data;
}

interface SparklineProps {
  color: string;
  seed: number;
  value: number;
}

function Sparkline({ color, seed, value }: SparklineProps) {
  const data = useMemo(() => {
    const base = generateSparkline(seed);
    return base.map((v, i) => v * 0.5 + value * 0.5 * (i / base.length));
  }, [seed, value]);

  const w = 48;
  const h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - v * h}`).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`spark-fill-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#spark-fill-${seed})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - data[data.length - 1] * h} r="2" fill={color} />
    </svg>
  );
}

interface BarsProps {
  color: string;
  seed: number;
  value: number;
}

function Bars({ color, seed, value }: BarsProps) {
  const data = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => 0.25 + seededRandom(seed + i) * 0.35 + value * 0.4);
  }, [seed, value]);

  const w = 44;
  const h = 18;
  const barW = 6;
  const gap = (w - barW * data.length) / (data.length - 1);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {data.map((v, i) => {
        const barH = Math.max(3, v * h);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - barH}
            width={barW}
            height={barH}
            rx="1"
            fill={color}
            opacity={0.5 + (i / data.length) * 0.5}
          />
        );
      })}
    </svg>
  );
}

interface DonutProps {
  color: string;
  value: number;
}

function Donut({ color, value }: DonutProps) {
  const size = 22;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.max(0.1, Math.min(1, value)) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${progress} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

interface GaugeProps {
  color: string;
  value: number;
}

function Gauge({ color, value }: GaugeProps) {
  const w = 40;
  const h = 20;
  const angle = Math.max(0.05, Math.min(1, value)) * 180;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <path
        d={`M 3 ${h - 1} A ${w / 2 - 3} ${h - 3} 0 0 1 ${w - 3} ${h - 1}`}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d={`M 3 ${h - 1} A ${w / 2 - 3} ${h - 3} 0 0 1 ${w - 3} ${h - 1}`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${(angle / 180) * 52} 100`}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      <line
        x1={w / 2}
        y1={h - 1}
        x2={w / 2 + Math.cos((Math.PI * (180 - angle)) / 180) * (h - 5)}
        y2={h - 1 - Math.sin((Math.PI * (180 - angle)) / 180) * (h - 5)}
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function KPICard({ index, label, value, rawValue, color, widgetType }: KPICardProps) {
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const isHovered = hoveredKpiIndex === index;

  const normalizedValue = Math.min(1, Math.max(0.05, rawValue));

  const Widget = useMemo(() => {
    switch (widgetType) {
      case "sparkline":
        return <Sparkline color={color} seed={index * 17 + 7} value={normalizedValue} />;
      case "bars":
        return <Bars color={color} seed={index * 23 + 11} value={normalizedValue} />;
      case "donut":
        return <Donut color={color} value={normalizedValue} />;
      case "gauge":
        return <Gauge color={color} value={normalizedValue} />;
      default:
        return <Sparkline color={color} seed={index * 17} value={normalizedValue} />;
    }
  }, [widgetType, color, index, normalizedValue]);

  return (
    <motion.div
      className={`kpi-card ${isHovered ? "active" : ""}`}
      style={{ "--kpi-color": color } as React.CSSProperties}
      onMouseEnter={() => setHoveredKpiIndex(index)}
      onMouseLeave={() => setHoveredKpiIndex(null)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      {/* Glass background */}
      <div className="card-glass" />

      {/* Premium border with emerald accent */}
      <div className="card-border" />

      {/* Ring stroke */}
      <div className="card-ring" />

      {/* Content */}
      <div className="card-content">
        <div className="card-row">
          <div className="card-info">
            <span className="card-label">{label}</span>
            <span className="card-value">{value}</span>
          </div>
          <div className="card-widget">{Widget}</div>
        </div>
      </div>

      <style>{`
        .kpi-card {
          position: relative;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        /* Glass background: bg-white/5 backdrop-blur-xl */
        .card-glass {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        /* Premium border: border border-emerald-400/20 */
        .card-border {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.22);
          transition: all 0.15s ease;
          pointer-events: none;
        }

        /* Ring stroke: ring-1 ring-white/10 */
        .card-ring {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
          pointer-events: none;
        }

        /* Premium glow on hover/active */
        .kpi-card:hover .card-border,
        .kpi-card.active .card-border {
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 
            0 0 0 1px rgba(16, 185, 129, 0.22),
            0 0 22px rgba(16, 185, 129, 0.1);
        }

        .kpi-card.active {
          transform: scale(1.02);
        }

        .kpi-card.active .card-border {
          border-color: var(--kpi-color);
          box-shadow: 
            0 0 0 1px var(--kpi-color),
            0 0 24px rgba(16, 185, 129, 0.15);
        }

        /* Content */
        .card-content {
          position: relative;
          z-index: 1;
          padding: 8px 10px;
        }

        .card-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }

        .card-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
          flex: 1;
        }

        .card-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--kpi-color);
          text-transform: uppercase;
          opacity: 0.9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .kpi-card:hover .card-label,
        .kpi-card.active .card-label {
          text-shadow: 0 0 6px var(--kpi-color);
          opacity: 1;
        }

        .card-value {
          font-size: 14px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1.1;
          white-space: nowrap;
        }

        .card-widget {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Responsive */
        @media (max-width: 1400px) {
          .card-content {
            padding: 6px 8px;
          }
          .card-label {
            font-size: 7px;
          }
          .card-value {
            font-size: 12px;
          }
        }

        @media (max-width: 1200px) {
          .card-content {
            padding: 8px 10px;
          }
          .card-label {
            font-size: 8px;
          }
          .card-value {
            font-size: 14px;
          }
        }
      `}</style>
    </motion.div>
  );
}
