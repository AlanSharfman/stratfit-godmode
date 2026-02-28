// src/components/kpi/KPIHealthRail.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT GOD MODE — Institutional Health Rail
// 5 grouped sections: Liquidity · Revenue Engine · Efficiency · Valuation · Risk
// UI-only — no store/selector/simulation changes
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useId, useMemo, useState } from "react";
import type { PositionKpis } from "@/pages/position/overlays/positionState";
import styles from "./KPIHealthRail.module.css";

/* ── Formatting helpers (identical to prior KPIOverlay) ── */

function fmtMoney(n: number, compact = true): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (compact) {
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  }
  return `${Math.round(n).toLocaleString()}`;
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(0)}%`;
}

/* ── Risk-tag derivation (pure presentation, no new calc) ── */

type RiskTone = "stable" | "watch" | "critical";

function deriveRiskTone(riskIndex: number): RiskTone {
  if (riskIndex >= 75) return "stable";
  if (riskIndex >= 50) return "watch";
  return "critical";
}

function riskToneLabel(tone: RiskTone): string {
  if (tone === "stable") return "STABLE";
  if (tone === "watch") return "WATCH";
  return "CRITICAL";
}

/* ═══════════════════════════════════════════════════════════════
   MINI-WIDGETS — Same animated inline indicators, preserved
   ═══════════════════════════════════════════════════════════════ */

function CashWidget() {
  return (
    <div className={styles.widget}>
      <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
        <ellipse cx="14" cy="20" rx="10" ry="3" fill="rgba(52,211,153,0.12)" stroke="rgba(52,211,153,0.35)" strokeWidth="1">
          <animate attributeName="opacity" values="0.8;0.5;0.8" dur="2.5s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="14" cy="16" rx="10" ry="3" fill="rgba(52,211,153,0.10)" stroke="rgba(52,211,153,0.3)" strokeWidth="1" />
        <ellipse cx="14" cy="12" rx="10" ry="3" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.25)" strokeWidth="1" />
        <ellipse cx="14" cy="8" rx="10" ry="3" fill="rgba(52,211,153,0.06)" stroke="rgba(52,211,153,0.2)" strokeWidth="1" />
        <text x="14" y="17" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(52,211,153,0.7)" fontFamily="Inter, sans-serif">
          $
          <animate attributeName="opacity" values="0.7;0.4;0.7" dur="3s" repeatCount="indefinite" />
        </text>
      </svg>
    </div>
  );
}

function RunwayWidget() {
  return (
    <div className={styles.widget}>
      <svg width="44" height="44" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="2" />
        <circle cx="14" cy="14" r="11" fill="none" stroke="#22d3ee" strokeWidth="2"
          strokeDasharray="69.1" strokeDashoffset="17" strokeLinecap="round"
          transform="rotate(-90 14 14)">
          <animateTransform attributeName="transform" type="rotate" from="-90 14 14" to="270 14 14" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="14" cy="3" r="2" fill="#22d3ee" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 14 14" to="360 14 14" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="14" cy="14" r="3" fill="rgba(34,211,238,0.12)">
          <animate attributeName="r" values="3;4;3" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function RevenueWidget() {
  const bars = [0.35, 0.5, 0.45, 0.7, 0.65, 0.85, 1.0];
  return (
    <div className={styles.widget}>
      <svg width="72" height="28" viewBox="0 0 56 22" fill="none">
        {bars.map((h, i) => (
          <rect key={i} x={i * 8 + 1} y={22 - h * 20} width="5" height={h * 20} rx="1.5"
            fill={`rgba(96, 165, 250, ${0.3 + h * 0.55})`}>
            <animate attributeName="height" values={`${h * 20};${h * 20 + 2};${h * 20}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            <animate attributeName="y" values={`${22 - h * 20};${20 - h * 20};${22 - h * 20}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </rect>
        ))}
        <line x1="3" y1="18" x2="53" y2="4" stroke="rgba(96,165,250,0.4)" strokeWidth="1" strokeDasharray="2,2" />
      </svg>
    </div>
  );
}

function ArrWidget() {
  const uid = useId();
  const ids = useMemo(() => ({
    line: `${uid}-arrL`, fill: `${uid}-arrF`, glow: `${uid}-arrG`, scanGlow: `${uid}-arrS`,
  }), [uid]);

  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const pts = "4,22 10,18 16,19 22,14 28,16 34,10 40,12 46,7 52,9 58,5 64,7 70,3";

  return (
    <div className={`${styles.widget} ${styles.arrWidget}`}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const nx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
        const ny = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
        setParallax({ x: nx, y: ny });
      }}
      style={{ color: "var(--color-emerald-400, #34d399)" }}
      role="img" aria-label="ARR instrument">
      <div className={styles.arrInstrument}
        style={{
          transform: `translate3d(${parallax.x * 4}px, ${parallax.y * 3}px, 0) rotateX(${parallax.y * -4}deg) rotateY(${parallax.x * 5}deg) scale(${1 + Math.abs(parallax.x * 0.03)})`,
        }}>
        <svg width="100%" height="100%" viewBox="0 0 72 28" preserveAspectRatio="xMidYMid meet" fill="none" overflow="visible">
          <defs>
            <linearGradient id={ids.line} x1="0" y1="0" x2="72" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.20" />
              <stop offset="55%" stopColor="currentColor" stopOpacity="0.78" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
            </linearGradient>
            <linearGradient id={ids.fill} x1="0" y1="0" x2="0" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
            <filter id={ids.glow} x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id={ids.scanGlow} x1="0" y1="0" x2="72" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="48%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="52%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="72" height="28" fill={`url(#${ids.scanGlow})`} opacity="0.6">
            <animateTransform attributeName="transform" type="translate" values="-72,0;72,0" dur="2.8s" repeatCount="indefinite" />
          </rect>
          <polygon points={`4,22 10,18 16,19 22,14 28,16 34,10 40,12 46,7 52,9 58,5 64,7 70,3 70,28 4,28`} fill={`url(#${ids.fill})`}>
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
          </polygon>
          <polyline points={pts} stroke={`url(#${ids.line})`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${ids.glow})`} strokeDasharray="120" strokeDashoffset="120">
            <animate attributeName="stroke-dashoffset" from="120" to="0" dur="1.1s" fill="freeze" begin="0s" />
          </polyline>
          <circle cx="70" cy="3" r="2.2" fill="currentColor" opacity="0">
            <animate attributeName="opacity" values="0;1" dur="0.2s" begin="0.9s" fill="freeze" />
            <animate attributeName="opacity" values="1;0.35;1" dur="1.4s" begin="1.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="70" cy="3" r="4.6" fill="currentColor" opacity="0">
            <animate attributeName="opacity" values="0;0.15" dur="0.2s" begin="0.9s" fill="freeze" />
            <animate attributeName="r" values="4.6;8;4.6" dur="1.4s" begin="1.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0;0.15" dur="1.4s" begin="1.1s" repeatCount="indefinite" />
          </circle>
          <circle r="1.2" fill="currentColor" opacity="0.7">
            <animateMotion dur="3s" repeatCount="indefinite" path="M4,22 L10,18 L16,19 L22,14 L28,16 L34,10 L40,12 L46,7 L52,9 L58,5 L64,7 L70,3" />
            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  );
}

function BurnWidget() {
  const bars = [0.5, 0.8, 1.0, 0.65, 0.4];
  return (
    <div className={styles.widget}>
      <div className={styles.burnBars}>
        {bars.map((h, i) => (
          <div key={i} className={styles.burnBar} style={{ height: `${h * 18}px`, animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  );
}

/** Valuation Widget — ascending diamond / value gauge */
function ValuationWidget() {
  return (
    <div className={styles.widget}>
      <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
        {/* Base rings */}
        <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(250,204,21,0.10)" strokeWidth="1" />
        <circle cx="16" cy="16" r="10" fill="none" stroke="rgba(250,204,21,0.08)" strokeWidth="0.8" />
        {/* Diamond */}
        <path d="M16 4 L24 14 L16 28 L8 14 Z" fill="rgba(250,204,21,0.06)" stroke="rgba(250,204,21,0.35)" strokeWidth="1" strokeLinejoin="round">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
        </path>
        {/* Inner diamond */}
        <path d="M16 9 L20 14 L16 22 L12 14 Z" fill="rgba(250,204,21,0.10)" stroke="rgba(250,204,21,0.25)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Center dot */}
        <circle cx="16" cy="14" r="2" fill="rgba(250,204,21,0.45)">
          <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* Ascending ticks */}
        <line x1="6" y1="22" x2="6" y2="18" stroke="rgba(250,204,21,0.15)" strokeWidth="0.8" strokeLinecap="round">
          <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2.5s" repeatCount="indefinite" />
        </line>
        <line x1="26" y1="22" x2="26" y2="16" stroke="rgba(250,204,21,0.15)" strokeWidth="0.8" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.5s" repeatCount="indefinite" />
        </line>
      </svg>
    </div>
  );
}

/** Gross Margin mini widget — percentage donut (indigo) */
function GrossMarginWidget() {
  return (
    <div className={styles.widget}>
      <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(129,140,248,0.12)" strokeWidth="2" />
        <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(129,140,248,0.45)" strokeWidth="2"
          strokeDasharray="62.8" strokeDashoffset="31.4" strokeLinecap="round"
          transform="rotate(-90 14 14)">
          <animate attributeName="strokeDashoffset" values="31.4;25;31.4" dur="4s" repeatCount="indefinite" />
        </circle>
        <text x="14" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill="rgba(129,140,248,0.6)" fontFamily="Inter, sans-serif">%</text>
      </svg>
    </div>
  );
}

/** Hero Risk Widget — larger radar dial with tone-mapped ring */
function HeroRiskWidget({ tone }: { tone: RiskTone }) {
  const ringColor =
    tone === "stable" ? "rgba(52,211,153,0.35)" :
    tone === "critical" ? "rgba(239,68,68,0.40)" :
    "rgba(34,211,238,0.35)";

  const ringBg =
    tone === "stable" ? "rgba(52,211,153,0.08)" :
    tone === "critical" ? "rgba(239,68,68,0.08)" :
    "rgba(34,211,238,0.08)";

  const sweepColor =
    tone === "stable" ? "rgba(52,211,153,0.35)" :
    tone === "critical" ? "rgba(239,68,68,0.40)" :
    "rgba(34,211,238,0.35)";

  const centerColor =
    tone === "stable" ? "rgba(52,211,153,0.30)" :
    tone === "critical" ? "rgba(239,68,68,0.35)" :
    "rgba(34,211,238,0.30)";

  return (
    <div className={styles.widget}>
      <svg width="44" height="44" viewBox="0 0 32 32">
        {/* Concentric rings */}
        <circle cx="16" cy="16" r="14" fill="none" stroke={ringBg} strokeWidth="1.2" />
        <circle cx="16" cy="16" r="10" fill="none" stroke={ringBg} strokeWidth="1" />
        <circle cx="16" cy="16" r="6" fill="none" stroke={ringBg} strokeWidth="0.8" />
        {/* Outer ring — thicker, tone-mapped */}
        <circle cx="16" cy="16" r="14" fill="none" stroke={ringColor} strokeWidth="2.5"
          strokeDasharray="88" strokeDashoffset="22" strokeLinecap="round"
          transform="rotate(-90 16 16)">
          <animate attributeName="strokeDashoffset" values="22;0;22" dur="6s" repeatCount="indefinite" />
        </circle>
        {/* Sweep line */}
        <line x1="16" y1="16" x2="16" y2="2" stroke={sweepColor} strokeWidth="1.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="4s" repeatCount="indefinite" />
        </line>
        {/* Center pulse */}
        <circle cx="16" cy="16" r="2.5" fill={centerColor}>
          <animate attributeName="r" values="2.5;3.5;2.5" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.8s" repeatCount="indefinite" />
        </circle>
        {/* Detection blips */}
        <circle cx="22" cy="8" r="1.5" fill={sweepColor} opacity="0">
          <animate attributeName="opacity" values="0;0.7;0" dur="4s" begin="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="9" cy="21" r="1.2" fill={sweepColor} opacity="0">
          <animate attributeName="opacity" values="0;0.5;0" dur="4s" begin="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export interface KPIHealthRailProps {
  kpis: PositionKpis | null;
}

const KPIHealthRail: React.FC<KPIHealthRailProps> = memo(({ kpis }) => {
  const k = kpis;

  const riskTone = useMemo<RiskTone>(
    () => deriveRiskTone(k?.riskIndex ?? 0),
    [k?.riskIndex],
  );

  return (
    <div className={styles.rail}>

      {/* ── 1. LIQUIDITY ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionHeader}>Liquidity</h3>
        <div className={styles.cardStack}>
          {/* Cash */}
          <div className={styles.card}>
            <div className={`${styles.label} ${styles.labelCapital}`}>Cash</div>
            <div className={styles.value}>{k ? `$${fmtMoney(k.cashOnHand)}` : "$0"}</div>
            <CashWidget />
            <div className={styles.sub}>On hand</div>
          </div>
          {/* Runway */}
          <div className={styles.card}>
            <div className={`${styles.label} ${styles.labelCapital}`}>Runway</div>
            <div className={styles.value}>
              {k ? (Number.isFinite(k.runwayMonths) ? `${k.runwayMonths.toFixed(1)}m` : "—") : "999.0m"}
            </div>
            <RunwayWidget />
            <div className={styles.sub}>Stability probability</div>
          </div>
        </div>
      </section>

      {/* ── 2. REVENUE ENGINE ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionHeader}>Revenue Engine</h3>
        <div className={styles.cardStack}>
          {/* ARR */}
          <div className={styles.card}>
            <div className={`${styles.label} ${styles.labelPerf}`}>ARR</div>
            <div className={styles.value}>{k ? `$${fmtMoney(k.arr)}` : "$0"}</div>
            <ArrWidget />
            <div className={styles.sub}>Annual run rate</div>
          </div>
          {/* Revenue */}
          <div className={styles.card}>
            <div className={`${styles.label} ${styles.labelPerf}`}>Revenue</div>
            <div className={styles.value}>{k ? `$${fmtMoney(k.revenueMonthly)}` : "$0"}</div>
            <RevenueWidget />
            <div className={styles.sub}>Monthly</div>
          </div>
        </div>
      </section>

      {/* ── 3. EFFICIENCY ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionHeader}>Efficiency</h3>
        <div className={styles.cardStack}>
          {/* Burn */}
          <div className={styles.card}>
            <div className={`${styles.label} ${styles.labelEfficiency}`}>Burn</div>
            <div className={styles.value}>{k ? `$${fmtMoney(k.burnMonthly)}` : "$0"}</div>
            <BurnWidget />
            <div className={styles.sub}>Monthly</div>
          </div>
          {/* Gross Margin */}
          <div className={styles.card}>
            <div className={`${styles.label} ${styles.labelEfficiency}`}>Gross Margin</div>
            <div className={styles.value}>{k ? `${fmtPct(k.grossMarginPct)}` : "—"}</div>
            <GrossMarginWidget />
            <div className={styles.sub}>Of revenue</div>
          </div>
        </div>
      </section>

      {/* ── 4. VALUATION ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionHeader}>Valuation</h3>
        <div className={styles.cardStack}>
          <div className={styles.card}>
            <div className={`${styles.label} ${styles.labelValuation}`}>Enterprise Value (v1)</div>
            <div className={styles.value}>{k && k.valuationEstimate > 0 ? `$${fmtMoney(k.valuationEstimate)}` : "$ —"}</div>
            <ValuationWidget />
            <div className={styles.sub}>{k && k.valuationEstimate > 0 ? "Revenue multiple" : "Awaiting ARR data"}</div>
          </div>
        </div>
      </section>

      {/* ── 5. SURVIVAL PROBABILITY ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionHeader}>Survival Probability</h3>
        <div className={styles.cardStack}>
          <div className={styles.card}>
            <div className={`${styles.label} ${styles.labelRisk}`}>Survival Probability</div>
            <div className={styles.value}>{k ? k.riskIndex.toFixed(0) : "85"}</div>
            <HeroRiskWidget tone={riskTone} />
            <span className={styles.riskTag} data-tone={riskTone}>
              {riskToneLabel(riskTone)} • liquidity pressure
            </span>
          </div>
        </div>
      </section>

    </div>
  );
});

KPIHealthRail.displayName = "KPIHealthRail";
export default KPIHealthRail;
