// src/components/kpi/KPIHealthRail.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT GOD MODE — Institutional Health Rail
// 5 grouped sections: Liquidity · Revenue Engine · Efficiency · Valuation · Risk
// UI-only — no store/selector/simulation changes
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PositionKpis } from "@/pages/position/overlays/positionState";
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping";
import { KPI_ZONE_MAP, KPI_STRESS_PROMPTS, KPI_CATEGORY_COLORS, PRIMARY_KPI_HIERARCHY } from "@/domain/intelligence/kpiZoneMapping";
import { getKpiCommentary } from "@/domain/intelligence/kpiCommentary";
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
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="0.4" strokeDasharray="3,5">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="24s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(52,211,153,0.06)" strokeWidth="0.4" strokeDasharray="2,4">
          <animateTransform attributeName="transform" type="rotate" from="360 16 16" to="0 16 16" dur="18s" repeatCount="indefinite" />
        </circle>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-1.8;0,0" dur="3.2s" repeatCount="indefinite" />
          {[20, 16.5, 13, 9.5].map((cy, i) => (
            <ellipse key={i} cx="16" cy={cy} rx="8" ry="2.8" fill={`rgba(52,211,153,${0.04 + i * 0.03})`} stroke={`rgba(52,211,153,${0.18 + i * 0.06})`} strokeWidth="0.8">
              <animate attributeName="ry" values="2.8;3.4;2.8" dur={`${3.2 - i * 0.15}s`} repeatCount="indefinite" />
              <animate attributeName="rx" values="8;8.6;8" dur={`${3.2 - i * 0.15}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
        </g>
        <circle cx="16" cy="16" r="4" fill="rgba(52,211,153,0.06)">
          <animate attributeName="r" values="4;5.5;4" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.08;0.02;0.08" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <text x="16" y="18.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="rgba(52,211,153,0.65)" fontFamily="Inter, sans-serif">
          $
          <animate attributeName="opacity" values="0.65;0.25;0.65" dur="2.2s" repeatCount="indefinite" />
        </text>
        <circle r="1" fill="rgba(52,211,153,0.3)">
          <animateMotion dur="8s" repeatCount="indefinite" path="M16,1.5 A14.5,14.5 0 1,1 15.99,1.5" />
          <animate attributeName="opacity" values="0.35;0.1;0.35" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle r="0.7" fill="rgba(52,211,153,0.25)">
          <animateMotion dur="8s" begin="-4s" repeatCount="indefinite" path="M16,1.5 A14.5,14.5 0 1,1 15.99,1.5" />
          <animate attributeName="opacity" values="0.25;0.05;0.25" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function RunwayWidget() {
  return (
    <div className={styles.widget}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth="0.4" strokeDasharray="2,6">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="30s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(34,211,238,0.50)" strokeWidth="1.8"
          strokeDasharray="75.4" strokeDashoffset="18" strokeLinecap="round" transform="rotate(-90 16 16)">
          <animateTransform attributeName="transform" type="rotate" from="-90 16 16" to="270 16 16" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="8" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="0.6" strokeDasharray="4,3">
          <animateTransform attributeName="transform" type="rotate" from="360 16 16" to="0 16 16" dur="12s" repeatCount="indefinite" />
        </circle>
        <line x1="16" y1="16" x2="16" y2="5" stroke="rgba(34,211,238,0.25)" strokeWidth="0.8" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="5s" repeatCount="indefinite" />
        </line>
        <circle cx="16" cy="4" r="1.6" fill="rgba(34,211,238,0.6)">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle r="0.8" fill="rgba(34,211,238,0.35)">
          <animateMotion dur="7s" begin="-3.5s" repeatCount="indefinite" path="M16,4 A12,12 0 1,1 15.99,4" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="3" fill="rgba(34,211,238,0.10)">
          <animate attributeName="r" values="3;4.5;3" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.12;0.03;0.12" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="1.2" fill="rgba(34,211,238,0.4)">
          <animate attributeName="r" values="1.2;1.8;1.2" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function RevenueWidget() {
  const bars = [0.30, 0.48, 0.42, 0.65, 0.58, 0.80, 0.92];
  return (
    <div className={styles.widget}>
      <svg width="72" height="32" viewBox="0 0 60 26" fill="none">
        {bars.map((h, i) => {
          const bh = h * 22;
          return (
            <g key={i}>
              <rect x={i * 8 + 2} y={24 - bh} width="5.5" height={bh} rx="1.5"
                fill={`rgba(96,165,250,${0.22 + h * 0.48})`}>
                <animate attributeName="height" values={`${bh};${bh + 4};${bh - 1.5};${bh}`} dur={`${2 + i * 0.18}s`} repeatCount="indefinite" />
                <animate attributeName="y" values={`${24 - bh};${20 - bh};${25.5 - bh};${24 - bh}`} dur={`${2 + i * 0.18}s`} repeatCount="indefinite" />
              </rect>
              <rect x={i * 8 + 2} y={24 - bh} width="5.5" height="1.5" rx="0.75"
                fill={`rgba(96,165,250,${0.15 + h * 0.3})`}>
                <animate attributeName="y" values={`${24 - bh};${20 - bh};${25.5 - bh};${24 - bh}`} dur={`${2 + i * 0.18}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.8;0.4;0.5" dur={`${2 + i * 0.18}s`} repeatCount="indefinite" />
              </rect>
            </g>
          );
        })}
        <polyline points="4,21 12,17.5 20,18.5 28,13 36,14.5 44,8 56,4" fill="none" stroke="rgba(96,165,250,0.35)" strokeWidth="0.8" strokeDasharray="3,2">
          <animate attributeName="stroke-dashoffset" values="0;-25" dur="2.5s" repeatCount="indefinite" />
        </polyline>
        <circle r="1.4" fill="rgba(96,165,250,0.65)">
          <animateMotion dur="3.5s" repeatCount="indefinite" path="M4,21 L12,17.5 L20,18.5 L28,13 L36,14.5 L44,8 L56,4" />
          <animate attributeName="opacity" values="0;0.7;0.7;0" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="rgba(96,165,250,0.08)">
          <animateMotion dur="3.5s" repeatCount="indefinite" path="M4,21 L12,17.5 L20,18.5 L28,13 L36,14.5 L44,8 L56,4" />
          <animate attributeName="opacity" values="0;0.12;0.12;0" dur="3.5s" repeatCount="indefinite" />
        </circle>
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
  return (
    <div className={styles.widget}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(251,146,60,0.06)" strokeWidth="0.4" strokeDasharray="2,5">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="-360 16 16" dur="22s" repeatCount="indefinite" />
        </circle>
        {[0.45, 0.75, 1.0, 0.60, 0.35].map((h, i) => {
          const bh = h * 20;
          return (
            <rect key={i} x={3 + i * 5.2} y={28 - bh} width="4" height={bh} rx="1.4"
              fill={`rgba(251,146,60,${0.20 + h * 0.42})`}>
              <animate attributeName="height" values={`${bh};${bh + 4.5};${bh - 1};${bh}`} dur={`${1.6 + i * 0.22}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${28 - bh};${23.5 - bh};${29 - bh};${28 - bh}`} dur={`${1.6 + i * 0.22}s`} repeatCount="indefinite" />
            </rect>
          );
        })}
        {[{ cx: 8, d: 1.4, dur: "1.8s", begin: "0s" }, { cx: 14, d: 1.8, dur: "1.4s", begin: "0.3s" }, { cx: 16, d: 1.2, dur: "2.0s", begin: "0.6s" }, { cx: 20, d: 1.0, dur: "1.6s", begin: "0.9s" }].map((p, i) => (
          <circle key={i} cx={p.cx} cy="8" r={p.d} fill={`rgba(251,146,60,${0.3 + i * 0.08})`}>
            <animate attributeName="cy" values="10;2;10" dur={p.dur} begin={p.begin} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur={p.dur} begin={p.begin} repeatCount="indefinite" />
            <animate attributeName="r" values={`${p.d};${p.d * 0.3};${p.d}`} dur={p.dur} begin={p.begin} repeatCount="indefinite" />
          </circle>
        ))}
        <line x1="4" y1="28" x2="28" y2="28" stroke="rgba(251,146,60,0.15)" strokeWidth="0.5">
          <animate attributeName="opacity" values="0.15;0.30;0.15" dur="2s" repeatCount="indefinite" />
        </line>
      </svg>
    </div>
  );
}

function ValuationWidget() {
  return (
    <div className={styles.widget}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(163,230,53,0.07)" strokeWidth="0.4" strokeDasharray="4,5">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="26s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="11" fill="none" stroke="rgba(163,230,53,0.05)" strokeWidth="0.4" strokeDasharray="2,4">
          <animateTransform attributeName="transform" type="rotate" from="360 16 16" to="0 16 16" dur="16s" repeatCount="indefinite" />
        </circle>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-2.2;0,0" dur="4.2s" repeatCount="indefinite" />
          <path d="M16 3 L25 14 L16 29 L7 14 Z" fill="rgba(163,230,53,0.05)" stroke="rgba(163,230,53,0.28)" strokeWidth="0.8" strokeLinejoin="round">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="3.2s" repeatCount="indefinite" />
          </path>
          <path d="M16 8 L21 14 L16 23 L11 14 Z" fill="rgba(163,230,53,0.08)" stroke="rgba(163,230,53,0.18)" strokeWidth="0.6" strokeLinejoin="round">
            <animateTransform attributeName="transform" type="rotate" values="0 16 15.5;3 16 15.5;0 16 15.5;-3 16 15.5;0 16 15.5" dur="6s" repeatCount="indefinite" />
          </path>
          <line x1="16" y1="3" x2="16" y2="29" stroke="rgba(163,230,53,0.10)" strokeWidth="0.3">
            <animate attributeName="opacity" values="0.1;0.25;0.1" dur="3.2s" repeatCount="indefinite" />
          </line>
          <line x1="7" y1="14" x2="25" y2="14" stroke="rgba(163,230,53,0.10)" strokeWidth="0.3">
            <animate attributeName="opacity" values="0.1;0.25;0.1" dur="3.2s" begin="1.6s" repeatCount="indefinite" />
          </line>
        </g>
        <circle cx="16" cy="14" r="2.2" fill="rgba(163,230,53,0.30)">
          <animate attributeName="r" values="2.2;3.8;2.2" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle r="1" fill="rgba(163,230,53,0.30)">
          <animateMotion dur="7s" repeatCount="indefinite" path="M16,1.5 A14.5,14.5 0 1,1 15.99,1.5" />
          <animate attributeName="opacity" values="0.35;0.1;0.35" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle r="0.7" fill="rgba(163,230,53,0.20)">
          <animateMotion dur="7s" begin="-3.5s" repeatCount="indefinite" path="M16,1.5 A14.5,14.5 0 1,1 15.99,1.5" />
          <animate attributeName="opacity" values="0.20;0.05;0.20" dur="3.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function GrowthWidget() {
  return (
    <div className={styles.widget}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(52,211,153,0.06)" strokeWidth="0.4" strokeDasharray="3,6">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="28s" repeatCount="indefinite" />
        </circle>
        <path d="M4 28 L10 22 L16 24 L22 14 L28 8 L30 4" stroke="rgba(52,211,153,0.40)" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeDasharray="70" strokeDashoffset="70">
          <animate attributeName="stroke-dashoffset" values="70;0;0;70" dur="4.5s" repeatCount="indefinite" />
        </path>
        <path d="M4 28 L10 22 L16 24 L22 14 L28 8 L30 4 L30 32 L4 32 Z" fill="rgba(52,211,153,0.04)">
          <animate attributeName="opacity" values="0;0.06;0.06;0" dur="4.5s" repeatCount="indefinite" />
        </path>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0;-0.8,-1.5;0,0" dur="2.8s" repeatCount="indefinite" />
          <polygon points="26,2 31,7 28,9" fill="rgba(52,211,153,0.35)">
            <animate attributeName="opacity" values="0.25;0.7;0.25" dur="2.2s" repeatCount="indefinite" />
          </polygon>
        </g>
        <circle r="1.6" fill="rgba(52,211,153,0.55)">
          <animateMotion dur="3.5s" repeatCount="indefinite" path="M4,28 L10,22 L16,24 L22,14 L28,8 L30,4" />
          <animate attributeName="opacity" values="0;0.7;0.7;0" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle r="4" fill="rgba(52,211,153,0.06)">
          <animateMotion dur="3.5s" repeatCount="indefinite" path="M4,28 L10,22 L16,24 L22,14 L28,8 L30,4" />
          <animate attributeName="opacity" values="0;0.08;0.08;0" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="30" cy="4" r="2.2" fill="rgba(52,211,153,0.40)">
          <animate attributeName="r" values="2.2;4.5;2.2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.40;0.08;0.40" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function ChurnWidget() {
  return (
    <div className={styles.widget}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(239,68,68,0.06)" strokeWidth="0.4" strokeDasharray="2,5">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="-360 16 16" dur="20s" repeatCount="indefinite" />
        </circle>
        <g>
          <animateTransform attributeName="transform" type="rotate" values="-1.5 16 14;1.5 16 14;-1.5 16 14" dur="4.5s" repeatCount="indefinite" />
          <path d="M6 4 L26 4 L22 15 L10 15 Z" fill="rgba(239,68,68,0.06)" stroke="rgba(239,68,68,0.25)" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M10 15 L12.5 26 L19.5 26 L22 15" fill="rgba(239,68,68,0.04)" stroke="rgba(239,68,68,0.20)" strokeWidth="0.8" strokeLinejoin="round" />
          <line x1="16" y1="4" x2="16" y2="26" stroke="rgba(239,68,68,0.08)" strokeWidth="0.3" strokeDasharray="1,2">
            <animate attributeName="opacity" values="0.08;0.20;0.08" dur="3s" repeatCount="indefinite" />
          </line>
        </g>
        {[
          { cx: 18, cy: 16, r: 1.4, dur: "1.5s", begin: "0s", dx: 2.5 },
          { cx: 20, cy: 17, r: 1.0, dur: "1.9s", begin: "0.4s", dx: 3.5 },
          { cx: 15, cy: 16.5, r: 0.8, dur: "2.2s", begin: "0.8s", dx: -2.5 },
          { cx: 13, cy: 17, r: 1.1, dur: "1.7s", begin: "1.2s", dx: -3 },
          { cx: 17, cy: 18, r: 0.6, dur: "2.4s", begin: "0.2s", dx: 1.5 },
        ].map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={`rgba(239,68,68,${0.35 + i * 0.05})`}>
            <animate attributeName="cy" values={`${p.cy};${p.cy + 12}`} dur={p.dur} begin={p.begin} repeatCount="indefinite" />
            <animate attributeName="cx" values={`${p.cx};${p.cx + p.dx}`} dur={p.dur} begin={p.begin} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0" dur={p.dur} begin={p.begin} repeatCount="indefinite" />
            <animate attributeName="r" values={`${p.r};${p.r * 0.4}`} dur={p.dur} begin={p.begin} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    </div>
  );
}

function GrossMarginWidget() {
  return (
    <div className={styles.widget}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(129,140,248,0.05)" strokeWidth="0.4" strokeDasharray="3,6">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="22s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="11.5" fill="none" stroke="rgba(129,140,248,0.10)" strokeWidth="1.4" />
        <circle cx="16" cy="16" r="11.5" fill="none" stroke="rgba(129,140,248,0.42)" strokeWidth="1.8"
          strokeDasharray="72.3" strokeDashoffset="36" strokeLinecap="round" transform="rotate(-90 16 16)">
          <animateTransform attributeName="transform" type="rotate" from="-90 16 16" to="270 16 16" dur="9s" repeatCount="indefinite" />
          <animate attributeName="stroke-dashoffset" values="36;22;36" dur="4.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="7.5" fill="none" stroke="rgba(129,140,248,0.06)" strokeWidth="0.5" strokeDasharray="2,3">
          <animateTransform attributeName="transform" type="rotate" from="360 16 16" to="0 16 16" dur="14s" repeatCount="indefinite" />
        </circle>
        <circle r="1.1" fill="rgba(129,140,248,0.40)">
          <animateMotion dur="6s" repeatCount="indefinite" path="M16,4.5 A11.5,11.5 0 1,1 15.99,4.5" />
          <animate attributeName="opacity" values="0.45;0.12;0.45" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle r="0.7" fill="rgba(129,140,248,0.25)">
          <animateMotion dur="6s" begin="-3s" repeatCount="indefinite" path="M16,4.5 A11.5,11.5 0 1,1 15.99,4.5" />
          <animate attributeName="opacity" values="0.25;0.06;0.25" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="3.5" fill="rgba(129,140,248,0.05)">
          <animate attributeName="r" values="3.5;5;3.5" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.06;0.02;0.06" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <text x="16" y="19" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="rgba(129,140,248,0.55)" fontFamily="Inter, sans-serif">
          %
          <animate attributeName="opacity" values="0.55;0.22;0.55" dur="2.8s" repeatCount="indefinite" />
        </text>
      </svg>
    </div>
  );
}

function HeadcountWidget() {
  return (
    <div className={styles.widget}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(168,85,247,0.06)" strokeWidth="0.4" strokeDasharray="2,5">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="-360 16 16" dur="24s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="10.5" fill="none" stroke="rgba(168,85,247,0.05)" strokeWidth="0.3" strokeDasharray="3,4">
          <animateTransform attributeName="transform" type="rotate" from="360 16 16" to="0 16 16" dur="16s" repeatCount="indefinite" />
        </circle>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-1.2;0,0" dur="3s" repeatCount="indefinite" />
          <circle cx="10" cy="10" r="3.2" fill="rgba(168,85,247,0.10)" stroke="rgba(168,85,247,0.30)" strokeWidth="0.8" />
          <path d="M4 25 Q4 19 10 19 Q14.5 19 14.5 22" fill="rgba(168,85,247,0.06)" stroke="rgba(168,85,247,0.22)" strokeWidth="0.8" />
        </g>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-1.5;0,0" dur="3.4s" begin="0.5s" repeatCount="indefinite" />
          <circle cx="22" cy="10" r="3.2" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.26)" strokeWidth="0.8" />
          <path d="M28 25 Q28 19 22 19 Q17.5 19 17.5 22" fill="rgba(168,85,247,0.06)" stroke="rgba(168,85,247,0.22)" strokeWidth="0.8" />
        </g>
        <line x1="10" y1="14" x2="22" y2="14" stroke="rgba(168,85,247,0.12)" strokeWidth="0.4" strokeDasharray="2,2">
          <animate attributeName="stroke-dashoffset" values="0;-8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.12;0.25;0.12" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="10" y1="19" x2="16" y2="22" stroke="rgba(168,85,247,0.10)" strokeWidth="0.3" strokeDasharray="1.5,2">
          <animate attributeName="stroke-dashoffset" values="0;-7" dur="2.4s" repeatCount="indefinite" />
        </line>
        <line x1="22" y1="19" x2="16" y2="22" stroke="rgba(168,85,247,0.10)" strokeWidth="0.3" strokeDasharray="1.5,2">
          <animate attributeName="stroke-dashoffset" values="0;-7" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
        </line>
        <circle cx="16" cy="22" r="1.8" fill="rgba(168,85,247,0.35)">
          <animate attributeName="r" values="1.8;3.2;1.8" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle r="0.8" fill="rgba(168,85,247,0.28)">
          <animateMotion dur="5s" repeatCount="indefinite" path="M10,10 L22,10 L16,22 Z" />
          <animate attributeName="opacity" values="0.30;0.08;0.30" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function HeroRiskWidget({ tone }: { tone: RiskTone }) {
  const ringColor =
    tone === "stable" ? "rgba(52,211,153,0.35)" :
    tone === "critical" ? "rgba(239,68,68,0.40)" :
    "rgba(34,211,238,0.35)";

  const ringBg =
    tone === "stable" ? "rgba(52,211,153,0.07)" :
    tone === "critical" ? "rgba(239,68,68,0.07)" :
    "rgba(34,211,238,0.07)";

  const sweepColor =
    tone === "stable" ? "rgba(52,211,153,0.30)" :
    tone === "critical" ? "rgba(239,68,68,0.35)" :
    "rgba(34,211,238,0.30)";

  const centerColor =
    tone === "stable" ? "rgba(52,211,153,0.28)" :
    tone === "critical" ? "rgba(239,68,68,0.32)" :
    "rgba(34,211,238,0.28)";

  const faintColor =
    tone === "stable" ? "rgba(52,211,153,0.04)" :
    tone === "critical" ? "rgba(239,68,68,0.04)" :
    "rgba(34,211,238,0.04)";

  return (
    <div className={styles.widget}>
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke={faintColor} strokeWidth="0.4" strokeDasharray="2,5">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="30s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="13.5" fill="none" stroke={ringBg} strokeWidth="1" />
        <circle cx="16" cy="16" r="10" fill="none" stroke={ringBg} strokeWidth="0.8" />
        <circle cx="16" cy="16" r="6.5" fill="none" stroke={ringBg} strokeWidth="0.6" />
        <circle cx="16" cy="16" r="3" fill="none" stroke={ringBg} strokeWidth="0.4" />
        <line x1="2" y1="16" x2="30" y2="16" stroke={ringBg} strokeWidth="0.3" />
        <line x1="16" y1="2" x2="16" y2="30" stroke={ringBg} strokeWidth="0.3" />
        <line x1="5.5" y1="5.5" x2="26.5" y2="26.5" stroke={faintColor} strokeWidth="0.3" />
        <line x1="26.5" y1="5.5" x2="5.5" y2="26.5" stroke={faintColor} strokeWidth="0.3" />
        <circle cx="16" cy="16" r="13.5" fill="none" stroke={ringColor} strokeWidth="2"
          strokeDasharray="84.8" strokeDashoffset="21" strokeLinecap="round"
          transform="rotate(-90 16 16)">
          <animate attributeName="stroke-dashoffset" values="21;0;21" dur="6.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="10" fill="none" stroke={sweepColor} strokeWidth="0.6"
          strokeDasharray="62.8" strokeDashoffset="47" strokeLinecap="round"
          transform="rotate(90 16 16)">
          <animateTransform attributeName="transform" type="rotate" from="90 16 16" to="450 16 16" dur="9s" repeatCount="indefinite" />
        </circle>
        <line x1="16" y1="16" x2="16" y2="2.5" stroke={sweepColor} strokeWidth="1.2" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="3.8s" repeatCount="indefinite" />
        </line>
        <path d="M16,16 L14,3 A13.5,13.5 0 0,1 18,3 Z" fill={sweepColor} opacity="0.12">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="3.8s" repeatCount="indefinite" />
        </path>
        <circle cx="16" cy="16" r="2" fill={centerColor}>
          <animate attributeName="r" values="2;3;2" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.40;0.15;0.40" dur="1.6s" repeatCount="indefinite" />
        </circle>
        {[
          { cx: 22, cy: 8, r: 1.3, begin: "0.8s" },
          { cx: 9, cy: 21, r: 1.0, begin: "2.2s" },
          { cx: 24, cy: 18, r: 0.8, begin: "1.5s" },
          { cx: 11, cy: 9, r: 0.9, begin: "3.0s" },
          { cx: 20, cy: 24, r: 0.7, begin: "0.3s" },
        ].map((blip, i) => (
          <circle key={i} cx={blip.cx} cy={blip.cy} r={blip.r} fill={sweepColor} opacity="0">
            <animate attributeName="opacity" values="0;0.60;0.60;0" dur="3.8s" begin={blip.begin} repeatCount="indefinite" />
            <animate attributeName="r" values={`${blip.r};${blip.r * 1.8};${blip.r}`} dur="3.8s" begin={blip.begin} repeatCount="indefinite" />
          </circle>
        ))}
        <circle r="0.6" fill={sweepColor}>
          <animateMotion dur="6s" repeatCount="indefinite" path="M16,2.5 A13.5,13.5 0 1,1 15.99,2.5" />
          <animate attributeName="opacity" values="0.28;0.06;0.28" dur="3s" repeatCount="indefinite" />
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
  focusedKpi?: KpiKey | null;
  onFocusKpi?: (key: KpiKey | null) => void;
  revealedKpis?: Set<KpiKey>;
}

interface KpiCardDef {
  key: KpiKey;
  label: string;
  getValue: (k: PositionKpis) => string;
  widget: React.ReactNode;
  sub: string | ((k: PositionKpis) => string);
  extra?: (k: PositionKpis, riskTone: RiskTone) => React.ReactNode;
}

function KpiCard({
  def,
  k,
  riskTone,
  isActive,
  isRevealed,
  commentary,
  onHover,
  onStressTest,
}: {
  def: KpiCardDef;
  k: PositionKpis | null;
  riskTone: RiskTone;
  isActive: boolean;
  isRevealed: boolean;
  commentary: string;
  onHover: (key: KpiKey | null) => void;
  onStressTest: (key: KpiKey) => void;
}) {
  const zone = KPI_ZONE_MAP[def.key];
  const kpiColor = KPI_CATEGORY_COLORS[def.key].hex;
  return (
    <div
      className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
      onMouseEnter={() => onHover(def.key)}
      onMouseLeave={() => onHover(null)}
      data-kpi={def.key}
      style={{ "--kpi-color": kpiColor } as React.CSSProperties}
    >
      <div className={styles.label} style={{ color: kpiColor }}>
        {def.label}
        {isRevealed && (
          <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.5, color: "#34d399" }} aria-label="Revealed">✓</span>
        )}
      </div>
      <div className={styles.value}>{k ? def.getValue(k) : "—"}</div>
      {def.widget}
      <div className={styles.sub}>{typeof def.sub === "function" ? (k ? def.sub(k) : "") : def.sub}</div>
      {def.extra?.(k!, riskTone)}
      <div className={`${styles.zoneLabel} ${isActive ? styles.zoneLabelVisible : ""}`}>
        {zone.label}
      </div>
      <div className={`${styles.commentary} ${isActive ? styles.commentaryVisible : ""}`}>
        {commentary}
      </div>
      <button
        className={`${styles.stressBtn} ${isActive ? styles.stressBtnVisible : ""}`}
        onClick={(e) => { e.stopPropagation(); onStressTest(def.key); }}
      >
        ⚡ Stress-Test This
      </button>
    </div>
  );
}

const KPIHealthRail: React.FC<KPIHealthRailProps> = memo(({ kpis, focusedKpi, revealedKpis }) => {
  const k = kpis;
  const navigate = useNavigate();
  const railRef = useRef<HTMLDivElement>(null);
  const [expandedPrimary, setExpandedPrimary] = useState<KpiKey | null>(null);

  const riskTone = useMemo<RiskTone>(
    () => deriveRiskTone(k?.riskIndex ?? 0),
    [k?.riskIndex],
  );

  const handleHover = useCallback(
    (_key: KpiKey | null) => { /* output-only — no interaction */ },
    [],
  );

  const handleStressTest = useCallback(
    (key: KpiKey) => {
      const prompt = KPI_STRESS_PROMPTS[key];
      navigate("/decision", { state: { prefillPrompt: prompt } });
    },
    [navigate],
  );

  const getCommentary = useCallback(
    (key: KpiKey): string => {
      if (!k) return "";
      return getKpiCommentary(key, k);
    },
    [k],
  );

  const CARDS: KpiCardDef[] = useMemo(() => [
    {
      key: "cash" as KpiKey,
      label: "Liquidity",
      getValue: (kk) => `$${fmtMoney(kk.cashOnHand)}`,
      widget: <CashWidget />,
      sub: "Cash on hand",
    },
    {
      key: "runway" as KpiKey,
      label: "Runway",
      getValue: (kk) => Number.isFinite(kk.runwayMonths) ? `${kk.runwayMonths.toFixed(1)}m` : "—",
      widget: <RunwayWidget />,
      sub: "Months remaining",
    },
    {
      key: "growth" as KpiKey,
      label: "Growth",
      getValue: (kk) => `${(kk.growthRatePct ?? 0).toFixed(1)}%`,
      widget: <GrowthWidget />,
      sub: "Month-over-month",
    },
    {
      key: "arr" as KpiKey,
      label: "ARR",
      getValue: (kk) => `$${fmtMoney(kk.arr)}`,
      widget: <ArrWidget />,
      sub: "Annual run rate",
    },
    {
      key: "revenue" as KpiKey,
      label: "Revenue",
      getValue: (kk) => `$${fmtMoney(kk.revenueMonthly)}`,
      widget: <RevenueWidget />,
      sub: "Monthly",
    },
    {
      key: "burn" as KpiKey,
      label: "Burn",
      getValue: (kk) => `$${fmtMoney(kk.burnMonthly)}`,
      widget: <BurnWidget />,
      sub: "Monthly",
    },
    {
      key: "churn" as KpiKey,
      label: "Retention",
      getValue: (kk) => `${(kk.churnPct ?? 0).toFixed(1)}%`,
      widget: <ChurnWidget />,
      sub: "Monthly churn rate",
    },
    {
      key: "grossMargin" as KpiKey,
      label: "Gross Margin",
      getValue: (kk) => fmtPct(kk.grossMarginPct),
      widget: <GrossMarginWidget />,
      sub: "Of revenue",
    },
    {
      key: "headcount" as KpiKey,
      label: "Talent",
      getValue: (kk) => {
        const hc = kk.headcount ?? 0
        return hc > 0 ? `${Math.round(hc)}` : "—"
      },
      widget: <HeadcountWidget />,
      sub: "Total team",
    },
    {
      key: "enterpriseValue" as KpiKey,
      label: "Value",
      getValue: (kk) => kk.valuationEstimate > 0 ? `$${fmtMoney(kk.valuationEstimate)}` : "$ —",
      widget: <ValuationWidget />,
      sub: (kk) => kk.valuationEstimate > 0 ? "Revenue multiple" : "Awaiting ARR data",
      extra: (kk, _rt) => kk ? (
        <span className={styles.probBadge} data-tone={deriveRiskTone(kk.riskIndex)}>
          {fmtPct(kk.riskIndex)} probability
        </span>
      ) : null,
    },
  ], []);

  const cardMap = useMemo(() => {
    const m = new Map<string, KpiCardDef>();
    for (const c of CARDS) m.set(c.key, c);
    return m;
  }, [CARDS]);

  const handlePrimaryClick = useCallback((key: KpiKey) => {
    setExpandedPrimary(prev => prev === key ? null : key);
  }, []);

  return (
    <div className={styles.rail} ref={railRef}>
      {PRIMARY_KPI_HIERARCHY.map((primary) => {
        const def = cardMap.get(primary.key);
        if (!def) return null;
        const isExpanded = expandedPrimary === primary.key;
        const hasSecondaries = primary.secondaries.length > 0;

        return (
          <div key={primary.key} className={styles.section}>
            <div
              onClick={() => handlePrimaryClick(primary.key)}
              style={{ cursor: "pointer" }}
            >
              <KpiCard
                def={def}
                k={k}
                riskTone={riskTone}
                isActive={focusedKpi === primary.key}
                isRevealed={revealedKpis?.has(primary.key) ?? false}
                commentary={getCommentary(primary.key)}
                onHover={handleHover}
                onStressTest={handleStressTest}
              />
            </div>

            {hasSecondaries && (
              <div
                className={styles.secondaryPanel}
                style={{
                  maxHeight: isExpanded ? `${primary.secondaries.length * 80 + 32}px` : "0",
                  opacity: isExpanded ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 250ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out",
                }}
              >
                <div className={styles.secondaryHeader}>
                  {primary.label} — Diagnostics
                  <button
                    className={styles.secondaryClose}
                    onClick={(e) => { e.stopPropagation(); setExpandedPrimary(null); }}
                    aria-label="Close diagnostics"
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.cardStack}>
                  {primary.secondaries.map((sec) => {
                    const secDef = cardMap.get(sec.key);
                    if (!secDef) return null;
                    return (
                      <KpiCard
                        key={sec.key}
                        def={secDef}
                        k={k}
                        riskTone={riskTone}
                        isActive={focusedKpi === sec.key}
                        isRevealed={revealedKpis?.has(sec.key) ?? false}
                        commentary={getCommentary(sec.key)}
                        onHover={handleHover}
                        onStressTest={handleStressTest}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

KPIHealthRail.displayName = "KPIHealthRail";
export default KPIHealthRail;
