// src/components/ui/KPICard.tsx
// STRATFIT — KPI Card matching reference design exactly

import React, { useMemo } from "react";
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
  isExpanded?: boolean;
  onSelect?: (index: number) => void;
}

// ============================================================================
// WIDGETS
// ============================================================================

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function Sparkline({ color, seed, value }: { color: string; seed: number; value: number }) {
  const data = useMemo(() => {
    const points: number[] = [];
    let v = 0.35;
    for (let i = 0; i < 10; i++) {
      v += (seededRandom(seed + i) - 0.45) * 0.18;
      v = Math.max(0.15, Math.min(0.85, v));
      points.push(v * 0.6 + value * 0.4 * (i / 9));
    }
    return points;
  }, [seed, value]);

  const w = 65;
  const h = 22;
  const path = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - v * h}`).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`spark-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${path} ${w},${h}`} fill={`url(#spark-${seed})`} />
      <polyline 
        points={path} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

function Bars({ color, seed, value }: { color: string; seed: number; value: number }) {
  const data = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => 0.25 + seededRandom(seed + i) * 0.35 + value * 0.4);
  }, [seed, value]);

  const w = 50;
  const h = 22;
  const barW = 7;
  const gap = 3;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const barH = Math.max(4, v * h);
        const isLast = i === data.length - 1;
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - barH}
            width={barW}
            height={barH}
            rx="1.5"
            fill={isLast ? "#22c55e" : color}
            opacity={isLast ? 1 : 0.75}
          />
        );
      })}
    </svg>
  );
}

function Donut({ color, value }: { color: string; value: number }) {
  const sz = 32;
  const stroke = 4;
  const r = (sz - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.max(0.1, Math.min(1, value)) * circ;
  const pct = Math.round(value * 100);

  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
      <circle 
        cx={sz / 2} 
        cy={sz / 2} 
        r={r} 
        fill="none" 
        stroke="rgba(255,255,255,0.06)" 
        strokeWidth={stroke} 
      />
      <circle
        cx={sz / 2}
        cy={sz / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${progress} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${sz / 2} ${sz / 2})`}
      />
      <text 
        x={sz / 2} 
        y={sz / 2 + 4} 
        textAnchor="middle" 
        fill="white" 
        fontSize="10" 
        fontWeight="600"
      >
        {pct}%
      </text>
    </svg>
  );
}

function Gauge({ color, value }: { color: string; value: number }) {
  const w = 50;
  const h = 26;
  const strokeW = 4;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path
        d={`M 4 ${h - 2} A ${w / 2 - 4} ${h - 6} 0 0 1 ${w - 4} ${h - 2}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      <path
        d={`M 4 ${h - 2} A ${w / 2 - 4} ${h - 6} 0 0 1 ${w - 4} ${h - 2}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={`${value * 60} 200`}
      />
      <text 
        x={w / 2} 
        y={h - 9} 
        textAnchor="middle" 
        fill="rgba(255,255,255,0.45)" 
        fontSize="7" 
        fontWeight="600"
        letterSpacing="0.04em"
      >
        SCORE
      </text>
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function KPICard({ 
  index, 
  label, 
  value, 
  rawValue, 
  color, 
  widgetType, 
  isExpanded = false,
  onSelect 
}: KPICardProps) {
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const isActive = hoveredKpiIndex === index;

  const normalizedValue = Math.min(1, Math.max(0.1, rawValue));

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

  const handleClick = () => {
    if (onSelect) {
      onSelect(index);
    }
  };

  return (
    <div
      className={`kpi-card ${isActive ? "active" : ""}`}
      style={{ "--kpi-color": color } as React.CSSProperties}
      onClick={handleClick}
    >
      <div className="card-content">
        <span className="card-label">{label}</span>
        <span className="card-value">{value}</span>
        <div className="card-widget">{Widget}</div>
      </div>

      <style>{`
        .kpi-card {
          width: 100%;
          height: 100px;
          border-radius: 6px;
          cursor: pointer;
          background: #161b22;
          border: 1px solid #30363d;
          overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .kpi-card:hover {
          border-color: #484f58;
        }

        .kpi-card.active {
          border-color: var(--kpi-color);
          box-shadow: 
            0 0 20px color-mix(in srgb, var(--kpi-color) 40%, transparent),
            0 0 40px color-mix(in srgb, var(--kpi-color) 20%, transparent),
            inset 0 0 25px color-mix(in srgb, var(--kpi-color) 8%, transparent);
        }

        .card-content {
          height: 100%;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
        }

        .card-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          margin-bottom: 4px;
          transition: color 0.15s;
        }

        .kpi-card:hover .card-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .kpi-card.active .card-label {
          color: var(--kpi-color);
        }

        .card-value {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .card-widget {
          margin-top: auto;
          display: flex;
          align-items: flex-end;
        }

        @media (max-width: 1400px) {
          .kpi-card {
            height: 90px;
          }
          .card-content {
            padding: 10px 12px;
          }
          .card-value {
            font-size: 16px;
          }
        }

        @media (max-width: 1200px) {
          .kpi-card {
            height: 85px;
          }
          .card-value {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
}
