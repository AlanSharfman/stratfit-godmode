// src/components/ui/KPISparkline.tsx
// STRATFIT — KPI Sparkline Card with Stealth Protocol
// Ghosted when idle, Ignited when dragging sliders

import React, { useMemo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { useUIStore } from "@/state/uiStore";

type ScenarioId = "base" | "upside" | "downside" | "stress";

export interface KPISparklineProps {
  label: string;
  subtitle?: string;
  value01: number; // 0..1 from dataPoints
  display: string; // formatted display string (e.g., "$120k/mo")
  index: number;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function scenarioAccent(s: ScenarioId) {
  switch (s) {
    case "upside":
      return { a: "rgba(74,222,128,1)", b: "rgba(74,222,128,0.15)" };
    case "downside":
      return { a: "rgba(251,191,36,1)", b: "rgba(251,191,36,0.15)" };
    case "stress":
      return { a: "rgba(248,113,113,1)", b: "rgba(248,113,113,0.15)" };
    case "base":
    default:
      return { a: "rgba(34,211,238,1)", b: "rgba(34,211,238,0.15)" };
  }
}

function fmtScore01(v: number) {
  const score = Math.round(clamp01(v) * 100);
  return `${score}`;
}

function makeSparkSeries(seed: number, v01: number, points = 28) {
  const out: number[] = [];
  const base = clamp01(v01);
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const w1 = Math.sin((t * 6.2 + seed * 0.7) * Math.PI);
    const w2 = Math.sin((t * 2.1 + seed * 0.33) * Math.PI);
    const wiggle = 0.06 * w1 + 0.03 * w2;
    const trend = (t - 0.5) * 0.10 * (0.35 + base);
    const y = clamp01(base + wiggle + trend);
    out.push(y);
  }
  return out;
}

function sparkPath(series: number[], w: number, h: number) {
  if (!series.length) return "";
  let d = "";
  for (let i = 0; i < series.length; i++) {
    const t = series.length === 1 ? 0 : i / (series.length - 1);
    const x = t * w;
    const y = (1 - clamp01(series[i])) * h;
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

function areaPath(lineD: string, w: number, h: number) {
  if (!lineD) return "";
  return `${lineD} L ${w.toFixed(2)} ${h.toFixed(2)} L 0 ${h.toFixed(2)} Z`;
}

function ringDash(v01: number) {
  const c = 62.83;
  const filled = c * clamp01(v01);
  const rest = c - filled;
  return `${filled.toFixed(2)} ${rest.toFixed(2)}`;
}

export default function KPISparkline({ label, subtitle, value01, display, index }: KPISparklineProps) {
  const scenario = useScenarioStore((s) => s.scenario) as ScenarioId;
  
  // STEALTH PROTOCOL: Subscribe to global dragging state
  const isDragging = useUIStore((s) => s.isDragging);

  const v01 = clamp01(value01);
  const accent = scenarioAccent(scenario);

  const spark = useMemo(() => makeSparkSeries(index + 1, v01, 30), [index, v01]);
  const sparkW = 180;
  const sparkH = 40;

  const lineD = useMemo(() => sparkPath(spark, sparkW, sparkH), [spark]);
  const fillD = useMemo(() => areaPath(lineD, sparkW, sparkH), [lineD]);

  // Stealth colors
  const strokeColor = isDragging ? '#00D9FF' : '#334155';
  const glowFilter = isDragging ? 'drop-shadow(0 0 10px rgba(0, 217, 255, 0.8))' : 'none';

  return (
    <div
      className={`
        group relative h-[180px] rounded-xl border overflow-hidden
        flex flex-col justify-between p-4
        transition-all duration-500 ease-out
        ${isDragging 
          ? 'border-cyan-500/50 bg-slate-900/80 shadow-[0_0_30px_rgba(0,217,255,0.3)]' 
          : 'border-white/10 bg-slate-900/40 shadow-lg'
        }
      `}
    >
      {/* Ambient accent wash */}
      <div
        className={`
          pointer-events-none absolute -inset-12 blur-2xl transition-opacity duration-500
          ${isDragging ? 'opacity-60' : 'opacity-20'}
        `}
        style={{
          background: `radial-gradient(circle at 20% 10%, ${isDragging ? 'rgba(0,217,255,0.3)' : accent.b} 0%, rgba(0,0,0,0) 55%)`,
        }}
      />

      {/* Top row: Label + Value + Ring */}
      <div className="relative flex items-start justify-between gap-3 z-10">
        <div className="min-w-0 flex-1">
          <div className={`
            text-[11px] tracking-[0.15em] uppercase font-semibold
            transition-colors duration-500
            ${isDragging ? 'text-cyan-400' : 'text-white/50'}
          `}>
            {label}
          </div>
          {subtitle && (
            <div className="text-[9px] text-white/40 mt-0.5">{subtitle}</div>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            <div className={`
              text-2xl font-bold leading-none
              transition-all duration-500
              ${isDragging ? 'text-white' : 'text-white/60'}
            `}>
              {display}
            </div>
          </div>
        </div>

        {/* Corner ring widget */}
        <div className={`
          relative mt-0.5 transition-all duration-500
          ${isDragging ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}
        `}>
          <svg width="32" height="32" viewBox="0 0 26 26" aria-hidden="true">
            <defs>
              <filter id={`kpiGlow_${index}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="13" cy="13" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
            <circle
              cx="13"
              cy="13"
              r="10"
              stroke={isDragging ? '#00D9FF' : accent.a}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={ringDash(v01)}
              transform="rotate(-90 13 13)"
              filter={`url(#kpiGlow_${index})`}
              opacity={isDragging ? 1 : 0.7}
            />
          </svg>

          <div className={`
            absolute inset-0 grid place-items-center text-[10px] font-bold
            transition-colors duration-500
            ${isDragging ? 'text-cyan-400' : 'text-white/50'}
          `}>
            {fmtScore01(v01)}
          </div>
        </div>
      </div>

      {/* STEALTH SPARKLINE — Ghosted/Ignited */}
      <div className={`
        relative mt-auto z-10
        transition-all duration-700 ease-in-out
        ${isDragging 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-20 translate-y-2 grayscale'
        }
      `}
        style={{ filter: glowFilter }}
      >
        <div 
          className={`
            rounded-lg border px-2 py-2 h-[60px]
            transition-all duration-500
            ${isDragging 
              ? 'border-cyan-500/40 bg-slate-950/90' 
              : 'border-slate-700/30 bg-slate-950/50'
            }
          `}
        >
          <svg 
            width="100%" 
            height="44" 
            viewBox={`0 0 ${sparkW} ${sparkH}`} 
            preserveAspectRatio="none" 
            aria-hidden="true"
            className="block w-full"
          >
            <defs>
              <linearGradient id={`sparkFill_${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>

              <filter id={`sparkGlow_${index}`} x="-30%" y="-80%" width="160%" height="260%">
                <feGaussianBlur stdDeviation="3" result="g" />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Area fill */}
            <path d={fillD} fill={`url(#sparkFill_${index})`} />

            {/* Glow line */}
            <path
              d={lineD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="4"
              opacity="0.5"
              filter={`url(#sparkGlow_${index})`}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Main line */}
            <path
              d={lineD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              opacity="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Left accent bar on ignite */}
      <div
        className={`
          pointer-events-none absolute left-0 top-0 h-full w-[3px]
          transition-all duration-500
          ${isDragging ? 'opacity-100' : 'opacity-0'}
        `}
        style={{ background: 'linear-gradient(180deg, #00D9FF 0%, #0891b2 100%)' }}
      />
    </div>
  );
}

// Named export for compatibility
export { KPISparkline as KPICard };
