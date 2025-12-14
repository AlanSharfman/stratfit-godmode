// src/components/ui/KPICard.tsx
// STRATFIT — KPI Tile (5% larger)

import React, { useMemo, useEffect, useState } from "react";
import { ViewMode } from "@/state/scenarioStore";

// ============================================================================
// TYPES
// ============================================================================

export interface KPICardProps {
  index: number;
  label: string;
  value: string;
  rawValue: number;
  color: string;
  widgetType: "shrinkingRidge" | "breathingReservoir" | "directionalFlow" | "rotationalArc" | "microJitter" | "verticalLift" | "expandingAura";
  isActive?: boolean;
  onSelect?: (index: number) => void;
  viewMode: ViewMode;
}

// ============================================================================
// MICRO-WIDGETS
// ============================================================================

function ShrinkingRidge({ color, value, amplitude }: { color: string; value: number; amplitude: number }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPhase(p => (p + 0.02 * amplitude) % 1), 50);
    return () => clearInterval(interval);
  }, [amplitude]);

  const w = 54, h = 22;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {[0, 1, 2, 3, 4].map(i => {
        const x = 2 + i * 11;
        const baseH = 18 - i * 2.5;
        const animH = baseH * (0.7 + 0.3 * Math.sin((phase + i * 0.2) * Math.PI * 2));
        return <rect key={i} x={x} y={h - animH} width={8} height={animH} rx={1.5} fill={color} opacity={0.5 + (1 - i * 0.12) * 0.4} />;
      })}
    </svg>
  );
}

function BreathingReservoir({ color, value, amplitude }: { color: string; value: number; amplitude: number }) {
  const [breath, setBreath] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setBreath(b => (b + 0.015 * amplitude) % 1), 50);
    return () => clearInterval(interval);
  }, [amplitude]);

  const w = 54, h = 22;
  const breathScale = 0.85 + 0.15 * Math.sin(breath * Math.PI * 2);
  const fillHeight = Math.max(0.3, value / 100) * h * 0.8 * breathScale;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x={2} y={1} width={w-4} height={h-2} rx={3} fill="rgba(255,255,255,0.05)" />
      <rect x={4} y={h - 1 - fillHeight} width={w-8} height={fillHeight} rx={2} fill={color} opacity={0.7} />
    </svg>
  );
}

function DirectionalFlow({ color, value, amplitude }: { color: string; value: number; amplitude: number }) {
  const [flow, setFlow] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setFlow(f => (f + 0.03 * amplitude) % 1), 50);
    return () => clearInterval(interval);
  }, [amplitude]);

  const w = 54, h = 22;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {[0, 1, 2].map(i => {
        const offset = ((flow + i * 0.33) % 1) * w;
        return (
          <polygon key={i} points={`${offset-7},${h/2} ${offset+7},${h/2-6} ${offset+7},${h/2+6}`} fill={color} opacity={0.4 + (value/100) * 0.4} />
        );
      })}
    </svg>
  );
}

function RotationalArc({ color, value, amplitude }: { color: string; value: number; amplitude: number }) {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setRotation(r => (r + 0.5 * amplitude) % 360), 50);
    return () => clearInterval(interval);
  }, [amplitude]);

  const w = 48, h = 22;
  const cx = w / 2, cy = h / 2;
  const r = 8;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={`${(value/100) * 40} 60`} strokeLinecap="round" transform={`rotate(${rotation} ${cx} ${cy})`} opacity={0.8} />
    </svg>
  );
}

function MicroJitter({ color, value, amplitude }: { color: string; value: number; amplitude: number }) {
  const [jitter, setJitter] = useState<number[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      setJitter(Array.from({ length: 16 }, () => (Math.random() - 0.5) * (value/100) * amplitude * 12));
    }, 80);
    return () => clearInterval(interval);
  }, [value, amplitude]);

  const w = 54, h = 22;
  const points = jitter.map((j, i) => `${(i / 15) * w},${h/2 + j}`).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {jitter.length > 0 && <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />}
    </svg>
  );
}

function VerticalLift({ color, value, amplitude }: { color: string; value: number; amplitude: number }) {
  const [lift, setLift] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setLift(l => (l + 0.02 * amplitude) % 1), 50);
    return () => clearInterval(interval);
  }, [amplitude]);

  const w = 48, h = 22;
  const liftOffset = Math.sin(lift * Math.PI * 2) * 2 * amplitude;
  const barHeight = Math.max(6, (value / 100) * (h - 4));

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x={w/2 - 7} y={h - 2 - barHeight + liftOffset} width={14} height={barHeight} rx={2} fill={color} opacity={0.7} />
      <polygon points={`${w/2},${h - 4 - barHeight + liftOffset - 5} ${w/2-5},${h - 4 - barHeight + liftOffset} ${w/2+5},${h - 4 - barHeight + liftOffset}`} fill={color} opacity={0.9} />
    </svg>
  );
}

function ExpandingAura({ color, value, amplitude }: { color: string; value: number; amplitude: number }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => (p + 0.012 * amplitude) % 1), 50);
    return () => clearInterval(interval);
  }, [amplitude]);

  const w = 48, h = 22;
  const cx = w / 2, cy = h / 2;
  const baseR = 5 + (value / 100) * 2;
  const pulseR = baseR + pulse * 7;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <circle cx={cx} cy={cy} r={pulseR} fill="none" stroke={color} strokeWidth={1} opacity={0.3 * (1 - pulse)} />
      <circle cx={cx} cy={cy} r={baseR} fill={color} opacity={0.6} />
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
  isActive = false,
  onSelect,
  viewMode
}: KPICardProps) {
  const amplitude = viewMode === "operator" ? 1.0 : 0.6;
  const normalizedValue = Math.min(100, Math.max(10, rawValue));

  const Widget = useMemo(() => {
    const props = { color, value: normalizedValue, amplitude };
    switch (widgetType) {
      case "shrinkingRidge": return <ShrinkingRidge {...props} />;
      case "breathingReservoir": return <BreathingReservoir {...props} />;
      case "directionalFlow": return <DirectionalFlow {...props} />;
      case "rotationalArc": return <RotationalArc {...props} />;
      case "microJitter": return <MicroJitter {...props} />;
      case "verticalLift": return <VerticalLift {...props} />;
      case "expandingAura": return <ExpandingAura {...props} />;
      default: return <BreathingReservoir {...props} />;
    }
  }, [widgetType, color, normalizedValue, amplitude]);

  return (
    <div
      className={`kpi-card ${isActive ? "active" : ""}`}
      style={{ "--kpi-color": color } as React.CSSProperties}
      onClick={() => onSelect?.(index)}
    >
      <span className="card-label">{label}</span>
      <span className="card-value">{value}</span>
      <div className="card-widget">{Widget}</div>

      <style>{`
        .kpi-card {
          width: 128px;
          min-width: 110px;
          height: 95px;
          flex-shrink: 0;
          border-radius: 12px;
          cursor: pointer;
          background: #161b22;
          border: 1px solid #30363d;
          padding: 11px 14px;
          display: flex;
          flex-direction: column;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .kpi-card:hover {
          border-color: #484f58;
        }

        .kpi-card.active {
          border-color: var(--kpi-color);
          box-shadow: 
            0 0 16px color-mix(in srgb, var(--kpi-color) 40%, transparent),
            inset 0 0 20px color-mix(in srgb, var(--kpi-color) 8%, transparent);
        }

        .card-label {
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .kpi-card:hover .card-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .kpi-card.active .card-label {
          color: var(--kpi-color);
        }

        .card-value {
          font-size: 17px;
          font-weight: 600;
          color: #fff;
          line-height: 1.15;
        }

        .card-widget {
          margin-top: auto;
        }
      `}</style>
    </div>
  );
}
