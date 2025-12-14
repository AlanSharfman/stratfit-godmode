// src/components/ui/KPICard.tsx
import React, { useMemo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";

type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface KPICardProps {
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
    case "extreme":
      return { a: "rgba(248,113,113,1)", b: "rgba(248,113,113,0.15)" };
    case "base":
    default:
      return { a: "rgba(34,211,238,1)", b: "rgba(34,211,238,0.15)" };
  }
}

function fmtScore01(v: number) {
  // v is 0..1. Show a “confidence-ish” looking score for now.
  const score = Math.round(clamp01(v) * 100);
  return `${score}`;
}

function makeSparkSeries(seed: number, v01: number, points = 28) {
  // Deterministic micro-series (no randomness). Smooth + “financial” wiggle.
  const out: number[] = [];
  const base = clamp01(v01);
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const w1 = Math.sin((t * 6.2 + seed * 0.7) * Math.PI);
    const w2 = Math.sin((t * 2.1 + seed * 0.33) * Math.PI);
    const wiggle = 0.06 * w1 + 0.03 * w2;
    const trend = (t - 0.5) * 0.10 * (0.35 + base); // slight slope
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
  // ring uses strokeDasharray; circumference for r=10 is ~62.83
  const c = 62.83;
  const filled = c * clamp01(v01);
  const rest = c - filled;
  return `${filled.toFixed(2)} ${rest.toFixed(2)}`;
}

export default function KPICard({ label, subtitle, value01, display, index }: KPICardProps) {
  const scenario = useScenarioStore((s) => s.scenario) as ScenarioId;

  const v01 = clamp01(value01);
  const accent = scenarioAccent(scenario);

  const spark = useMemo(() => makeSparkSeries(index + 1, v01, 30), [index, v01]);
  const sparkW = 180;
  const sparkH = 34;

  const lineD = useMemo(() => sparkPath(spark, sparkW, sparkH), [spark]);
  const fillD = useMemo(() => areaPath(lineD, sparkW, sparkH), [lineD]);

  const glow = `0 0 0 1px rgba(255,255,255,0.06), 0 18px 40px rgba(0,0,0,0.55)`;
  const glowHover = `0 0 0 1px rgba(255,255,255,0.10), 0 24px 60px rgba(0,0,0,0.70)`;

  return (
    <div
      className="group relative rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 overflow-hidden"
      style={{
        boxShadow: glow,
        transform: "translateZ(0)",
      }}
    >
      {/* Ambient accent wash */}
      <div
        className="pointer-events-none absolute -inset-12 opacity-40 blur-2xl"
        style={{
          background: `radial-gradient(circle at 20% 10%, ${accent.b} 0%, rgba(0,0,0,0) 55%)`,
        }}
      />

      {/* Hover lift */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          boxShadow: glowHover,
        }}
      />

      {/* Top row */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.18em] uppercase text-white/60">
            {label}
          </div>
          {subtitle && (
            <div className="text-[9px] text-white/40 mt-0.5">{subtitle}</div>
          )}

          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-[18px] font-semibold text-white leading-none">
              {display}
            </div>
          </div>
        </div>

        {/* Corner ring widget */}
        <div className="relative mt-0.5">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <defs>
              <filter id={`kpiGlow_${index}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.8" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="13" cy="13" r="10" stroke="rgba(255,255,255,0.10)" strokeWidth="2" fill="none" />
            <circle
              cx="13"
              cy="13"
              r="10"
              stroke={accent.a}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={ringDash(v01)}
              transform="rotate(-90 13 13)"
              filter={`url(#kpiGlow_${index})`}
              opacity={0.95}
            />
          </svg>

          <div className="absolute inset-0 grid place-items-center text-[9px] text-white/70">
            {fmtScore01(v01)}
          </div>
        </div>
      </div>

      {/* Widget strip: sparkline + micro fill */}
      <div className="relative mt-3">
        <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2">
          <svg width="100%" height="38" viewBox={`0 0 ${sparkW} ${sparkH}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id={`sparkGrad_${index}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={accent.a} stopOpacity="0.25" />
                <stop offset="55%" stopColor={accent.a} stopOpacity="0.10" />
                <stop offset="100%" stopColor={accent.a} stopOpacity="0.22" />
              </linearGradient>

              <linearGradient id={`sparkFill_${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent.a} stopOpacity="0.22" />
                <stop offset="100%" stopColor={accent.a} stopOpacity="0.00" />
              </linearGradient>

              <filter id={`sparkGlow_${index}`} x="-30%" y="-80%" width="160%" height="260%">
                <feGaussianBlur stdDeviation="2.6" result="g" />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Area */}
            <path d={fillD} fill={`url(#sparkFill_${index})`} />

            {/* Line glow */}
            <path
              d={lineD}
              fill="none"
              stroke={accent.a}
              strokeWidth="2.4"
              opacity="0.35"
              filter={`url(#sparkGlow_${index})`}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Line */}
            <path
              d={lineD}
              fill="none"
              stroke={`url(#sparkGrad_${index})`}
              strokeWidth="1.6"
              opacity="0.95"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Micro tick marks */}
          <div className="mt-1 flex items-center justify-between text-[9px] text-white/35">
            <span>Now</span>
            <span className="text-white/40">↗</span>
            <span>12m</span>
          </div>
        </div>
      </div>

      {/* Hover highlight bar */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: accent.a }}
      />

      {/* Subtle lift on hover */}
      <style>{`
        .group:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
