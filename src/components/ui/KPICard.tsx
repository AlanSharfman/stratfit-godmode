// src/components/ui/KPICard.tsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useScenarioStore } from "@/state/scenarioStore";

export type WidgetType =
  | "trendSpark"      // MRR
  | "profitColumns"   // Gross Profit
  | "cashArea"        // Cash
  | "burnBars"        // Burn
  | "runwayGauge"     // Runway (light red)
  | "cacPie"          // CAC pie (multi colour)
  | "churnRing";      // Churn upgraded

export interface KPICardProps {
  label: string;
  value: string;
  subValue?: string;
  isPositive?: boolean;
  widgetType: WidgetType;
  accentColor: string;
  index: number;
  kpiIndex: number; // 0..6 (drives mountain hover)
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const generateSeries = (seed: number, length: number) => {
  const data: number[] = [];
  let current = 0.5;
  for (let i = 0; i < length; i++) {
    const r = seededRandom(seed + i * 1.7);
    current = Math.max(0.08, Math.min(0.92, current + (r - 0.5) * 0.22));
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

// ---------- Widgets ----------
const TrendSpark = ({ color, seed }: { color: string; seed: number }) => {
  const d = useMemo(() => generateSeries(seed, 14), [seed]);
  const p = smoothPath(d, 100, 46);
  return (
    <svg viewBox="0 0 100 46" className="w-full h-full">
      <path d={`${p} L 100 46 L 0 46 Z`} fill={color} fillOpacity="0.12" />
      <path d={p} fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  );
};

const ProfitColumns = ({ color, seed }: { color: string; seed: number }) => {
  const d = useMemo(() => generateSeries(seed, 10), [seed]);
  return (
    <div className="flex items-end justify-between h-full gap-[3px]">
      {d.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-[3px]"
          style={{
            height: `${22 + v * 78}%`,
            background: color,
            opacity: 0.25 + i * 0.065,
          }}
        />
      ))}
    </div>
  );
};

const CashArea = ({ color, seed }: { color: string; seed: number }) => {
  const d = useMemo(() => generateSeries(seed, 11), [seed]);
  const p = smoothPath(d, 100, 46);
  return (
    <svg viewBox="0 0 100 46" className="w-full h-full">
      <path d={`${p} L 100 46 L 0 46 Z`} fill={color} fillOpacity="0.10" />
      <path d={p} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
};

const BurnBars = ({ color, seed }: { color: string; seed: number }) => {
  const d = useMemo(() => generateSeries(seed, 12), [seed]);
  return (
    <div className="flex items-end justify-between h-full gap-[2px]">
      {d.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-[2px]"
          style={{
            height: `${18 + v * 82}%`,
            background: color,
            opacity: 0.30 + (i / 12) * 0.55,
          }}
        />
      ))}
    </div>
  );
};

const RunwayGauge = ({ color, value01 }: { color: string; value01: number }) => {
  const v = Math.max(0, Math.min(1, value01));
  const c = Math.PI * 40;
  return (
    <div className="flex items-end justify-center h-full">
      <svg viewBox="0 0 100 52" className="overflow-visible">
        <path
          d="M10 46 A40 40 0 0 1 90 46"
          stroke="white"
          strokeOpacity="0.08"
          strokeWidth="7"
          fill="none"
        />
        <motion.path
          d="M10 46 A40 40 0 0 1 90 46"
          stroke={color}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - v * c }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
    </div>
  );
};

const CacPie = ({ seed }: { seed: number }) => {
  // multi-colour pie (no yellow)
  const slices = useMemo(() => {
    const a = 0.18 + seededRandom(seed) * 0.24;
    const b = 0.18 + seededRandom(seed + 1) * 0.24;
    const c = 0.18 + seededRandom(seed + 2) * 0.24;
    const d = Math.max(0.10, 1 - (a + b + c));
    const arr = [a, b, c, d];
    const sum = arr.reduce((s, x) => s + x, 0);
    return arr.map((x) => x / sum);
  }, [seed]);

  const colors = ["#22d3ee", "#a78bfa", "#fb7185", "#34d399"]; // cyan/purple/rose/emerald
  const R = 20;
  const C = 2 * Math.PI * R;

  let acc = 0;
  return (
    <div className="flex items-center justify-center h-full">
      <svg width="54" height="54" viewBox="0 0 56 56">
        <g transform="translate(28 28)">
          {slices.map((s, i) => {
            const dash = s * C;
            const gap = C - dash;
            const offset = C * (1 - acc);
            acc += s;
            return (
              <circle
                key={i}
                r={R}
                cx={0}
                cy={0}
                fill="none"
                stroke={colors[i]}
                strokeWidth="7"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                style={{ filter: `drop-shadow(0 0 6px ${colors[i]})` }}
              />
            );
          })}
          <circle r={12} cx={0} cy={0} fill="rgba(11,14,20,0.92)" />
        </g>
      </svg>
    </div>
  );
};

const ChurnRing = ({ color, seed, value01 }: { color: string; seed: number; value01: number }) => {
  const v = Math.max(0, Math.min(1, value01));
  const c = 2 * Math.PI * 22;
  const d = useMemo(() => generateSeries(seed, 10), [seed]);
  const p = smoothPath(d, 100, 28);

  return (
    <div className="flex items-center justify-center h-full relative">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r="22" stroke="white" strokeOpacity="0.08" strokeWidth="4" fill="none" />
        <motion.circle
          cx="28"
          cy="28"
          r="22"
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - v * c }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>

      <div className="absolute bottom-[6px] left-0 right-0 px-[6px] opacity-85">
        <svg viewBox="0 0 100 28" className="w-full h-[18px]">
          <path d={p} fill="none" stroke={color} strokeWidth="1.4" opacity="0.85" />
        </svg>
      </div>
    </div>
  );
};

// ---------- Main Card ----------
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
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);

  // A stable derived "intensity" for gauges/rings without reading live data.
  const seed = 40 + index * 17;
  const v01 = Math.max(0, Math.min(1, (seededRandom(seed) + 0.25)));

  const Widget = useMemo(() => {
    switch (widgetType) {
      case "trendSpark":
        return <TrendSpark color={accentColor} seed={seed} />;
      case "profitColumns":
        return <ProfitColumns color={accentColor} seed={seed} />;
      case "cashArea":
        return <CashArea color={accentColor} seed={seed} />;
      case "burnBars":
        return <BurnBars color={accentColor} seed={seed} />;
      case "runwayGauge":
        return <RunwayGauge color={accentColor} value01={v01} />;
      case "cacPie":
        return <CacPie seed={seed} />;
      case "churnRing":
        return <ChurnRing color={accentColor} seed={seed} value01={v01} />;
      default:
        return <TrendSpark color={accentColor} seed={seed} />;
    }
  }, [widgetType, accentColor, seed, v01]);

  return (
    <motion.button
      type="button"
      onMouseEnter={() => setHoveredKpiIndex(kpiIndex)}
      onMouseLeave={() => setHoveredKpiIndex(null)}
      onFocus={() => setHoveredKpiIndex(kpiIndex)}
      onBlur={() => setHoveredKpiIndex(null)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045 }}
      whileHover={{ y: -10, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className="relative flex flex-col justify-between rounded-2xl border border-white/[0.10] bg-[#0B0E14]/72 backdrop-blur-md overflow-hidden group transition-all duration-300"
      style={{
        height: 186,
        minWidth: 220,
        flex: "1 0 220px",
        boxShadow: `0 22px 60px rgba(0,0,0,0.55)`,
      }}
    >
      {/* Premium border glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(900px 250px at 35% 20%, ${accentColor}22, transparent 55%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 30px rgba(0,0,0,0.55)`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 flex flex-col gap-1 text-left">
        <div className="flex justify-between items-start">
          <span className="text-[12px] font-extrabold tracking-[0.18em] uppercase text-white/70">
            {label}
          </span>

          {subValue && (
            <div
              className={`px-2 py-[2px] rounded-md text-[10px] font-bold border ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-300 border-rose-500/20"
              }`}
            >
              {subValue}
            </div>
          )}
        </div>

        <div className="text-[28px] leading-[30px] font-extrabold text-white tracking-tight">
          {value}
        </div>
      </div>

      {/* Widget */}
      <div className="relative z-10 flex-1 w-full px-4 pb-4 pt-2 min-h-0 flex flex-col justify-end">
        <div className="w-full h-[78px] opacity-90 group-hover:opacity-100 transition-opacity">
          {Widget}
        </div>
      </div>
    </motion.button>
  );
}
