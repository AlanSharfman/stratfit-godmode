import React, { useId, useMemo, useState } from "react"
import styles from "../PositionOverlays.module.css"
import type { PositionViewModel } from "./positionState"

function fmtMoney(n: number, compact = true): string {
  if (!Number.isFinite(n)) return "—"
  const abs = Math.abs(n)
  if (compact) {
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  }
  return `${Math.round(n).toLocaleString()}`
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return `${n.toFixed(0)}%`
}

/* ═══════════════════════════════════════════════════════════════
   GODMODE MINI-WIDGETS — Animated inline indicators per KPI
   Sourced from prior KPICard.tsx widget patterns (globe, bars, dial, arrow, ring)
   ═══════════════════════════════════════════════════════════════ */

/** ARR — interactive God Mode instrument (parallax + hover detail). */
function ArrWidget() {
  const uid = useId()
  const ids = useMemo(
    () => ({
      line: `${uid}-arrLine`,
      fill: `${uid}-arrFill`,
      glow: `${uid}-arrGlow`,
      scanGlow: `${uid}-arrScan`,
    }),
    [uid],
  )

  const [parallax, setParallax] = useState({ x: 0, y: 0 })

  // Deterministic sparkline data points (x,y) in a 72×28 viewport
  const pts = "4,22 10,18 16,19 22,14 28,16 34,10 40,12 46,7 52,9 58,5 64,7 70,3"

  return (
    <div
      className={`${styles.widget} ${styles.arrWidget}`}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2
        const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2
        setParallax({ x: nx, y: ny })
      }}
      style={{ color: "var(--color-emerald-400)" }}
      role="img"
      aria-label="ARR instrument"
    >
      <div
        className={styles.arrInstrument}
        style={{
          transform: `translate3d(${parallax.x * 4}px, ${parallax.y * 3}px, 0) rotateX(${parallax.y * -4}deg) rotateY(${parallax.x * 5}deg) scale(${1 + Math.abs(parallax.x * 0.03)})`,
        }}
      >
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
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Vertical scan-line filter */}
            <linearGradient id={ids.scanGlow} x1="0" y1="0" x2="72" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="48%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="52%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Animated scan line sweeping left-to-right continuously */}
          <rect x="0" y="0" width="72" height="28" fill={`url(#${ids.scanGlow})`} opacity="0.6">
            <animateTransform attributeName="transform" type="translate" values="-72,0;72,0" dur="2.8s" repeatCount="indefinite" />
          </rect>

          {/* Fill area under sparkline */}
          <polygon
            points={`4,22 10,18 16,19 22,14 28,16 34,10 40,12 46,7 52,9 58,5 64,7 70,3 70,28 4,28`}
            fill={`url(#${ids.fill})`}
          >
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
          </polygon>

          {/* Sparkline — stroke-dasharray draw-on animation */}
          <polyline
            points={pts}
            stroke={`url(#${ids.line})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${ids.glow})`}
            strokeDasharray="120"
            strokeDashoffset="120"
          >
            <animate attributeName="stroke-dashoffset" from="120" to="0" dur="1.1s" fill="freeze" begin="0s" />
          </polyline>

          {/* Live head — pulsing dot at latest point */}
          <circle cx="70" cy="3" r="2.2" fill="currentColor" opacity="0">
            <animate attributeName="opacity" values="0;1" dur="0.2s" begin="0.9s" fill="freeze" />
            <animate attributeName="opacity" values="1;0.35;1" dur="1.4s" begin="1.1s" repeatCount="indefinite" />
          </circle>
          {/* Outer breathing glow ring */}
          <circle cx="70" cy="3" r="4.6" fill="currentColor" opacity="0">
            <animate attributeName="opacity" values="0;0.15" dur="0.2s" begin="0.9s" fill="freeze" />
            <animate attributeName="r" values="4.6;8;4.6" dur="1.4s" begin="1.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0;0.15" dur="1.4s" begin="1.1s" repeatCount="indefinite" />
          </circle>

          {/* Travelling particle along the sparkline path */}
          <circle r="1.2" fill="currentColor" opacity="0.7">
            <animateMotion dur="3s" repeatCount="indefinite" path="M4,22 L10,18 L16,19 L22,14 L28,16 L34,10 L40,12 L46,7 L52,9 L58,5 L64,7 L70,3" />
            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  )
}

/** Runway — countdown timer ring with sweep animation */
function RunwayWidget() {
  return (
    <div className={styles.widget}>
      <svg width="44" height="44" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="2"/>
        <circle cx="14" cy="14" r="11" fill="none" stroke="#22d3ee" strokeWidth="2"
          strokeDasharray="69.1" strokeDashoffset="17" strokeLinecap="round"
          transform="rotate(-90 14 14)">
          <animateTransform attributeName="transform" type="rotate" from="-90 14 14" to="270 14 14" dur="8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="14" cy="3" r="2" fill="#22d3ee" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 14 14" to="360 14 14" dur="8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="14" cy="14" r="3" fill="rgba(34,211,238,0.12)">
          <animate attributeName="r" values="3;4;3" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.5s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  )
}

/** Burn — pulsing flame bars */
function BurnWidget() {
  const bars = [0.5, 0.8, 1.0, 0.65, 0.4]
  return (
    <div className={styles.widget}>
      <div className={styles.burnBars}>
        {bars.map((h, i) => (
          <div key={i} className={styles.burnBar} style={{
            height: `${h * 18}px`,
            animationDelay: `${i * 0.12}s`,
          }}/>
        ))}
      </div>
    </div>
  )
}

/** EBITDA — oscillating earnings wave */
function EbitdaWidget() {
  return (
    <div className={styles.widget}>
      <svg width="72" height="28" viewBox="0 0 44 18" fill="none">
        <path d="M0 14 Q6 6 11 9 T22 7 T33 10 T44 5" stroke="rgba(124,58,237,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="d"
            values="M0 14 Q6 6 11 9 T22 7 T33 10 T44 5;M0 12 Q6 8 11 7 T22 9 T33 6 T44 8;M0 14 Q6 6 11 9 T22 7 T33 10 T44 5"
            dur="3.5s" repeatCount="indefinite"/>
        </path>
        <path d="M0 14 Q6 6 11 9 T22 7 T33 10 T44 5" stroke="rgba(124,58,237,0.2)" strokeWidth="4" fill="none" strokeLinecap="round" filter="blur(2px)">
          <animate attributeName="d"
            values="M0 14 Q6 6 11 9 T22 7 T33 10 T44 5;M0 12 Q6 8 11 7 T22 9 T33 6 T44 8;M0 14 Q6 6 11 9 T22 7 T33 10 T44 5"
            dur="3.5s" repeatCount="indefinite"/>
        </path>
      </svg>
    </div>
  )
}

/** Risk — breathing radar dial with sweep */
function RiskWidget() {
  return (
    <div className={styles.widget}>
      <svg width="44" height="44" viewBox="0 0 28 28">
        {/* Concentric risk rings */}
        <circle cx="14" cy="14" r="12" fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="1"/>
        <circle cx="14" cy="14" r="8" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="1"/>
        <circle cx="14" cy="14" r="4" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="1"/>
        {/* Sweep line */}
        <line x1="14" y1="14" x2="14" y2="2" stroke="rgba(239,68,68,0.65)" strokeWidth="1.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 14 14" to="360 14 14" dur="4s" repeatCount="indefinite"/>
        </line>
        {/* Glow trail */}
        <path d="M14 14 L14 2" stroke="none" fill="none">
          <animateTransform attributeName="transform" type="rotate" from="-30 14 14" to="330 14 14" dur="4s" repeatCount="indefinite"/>
        </path>
        {/* Center pulse */}
        <circle cx="14" cy="14" r="2" fill="rgba(239,68,68,0.5)">
          <animate attributeName="r" values="2;3;2" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        {/* Detection blips */}
        <circle cx="20" cy="8" r="1.5" fill="#ef4444" opacity="0">
          <animate attributeName="opacity" values="0;0.7;0" dur="4s" begin="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="8" cy="18" r="1.2" fill="#ef4444" opacity="0">
          <animate attributeName="opacity" values="0;0.5;0" dur="4s" begin="2.5s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  )
}

export default function KPIOverlay({ vm, feed }: { vm: PositionViewModel | null; feed?: boolean }) {
  const k = vm?.kpis
  const cellClass = feed ? styles.kpiFeedCell : styles.kpiCell
  const stripClass = feed ? styles.kpiFeed : styles.kpiStrip
  return (
    <div className={stripClass}>
      <div className={cellClass}>
        <div className={styles.kpiLabel}>ARR</div>
        <div className={styles.kpiValue}>{k ? `$${fmtMoney(k.arr)}` : "$0"}</div>
        <ArrWidget />
        <div className={styles.kpiSub}>Annual recurring</div>
      </div>
      <div className={cellClass}>
        <div className={styles.kpiLabel}>Runway</div>
        <div className={styles.kpiValue}>
          {k ? (Number.isFinite(k.runwayMonths) ? `${k.runwayMonths.toFixed(1)}m` : "—") : "999.0m"}
        </div>
        <RunwayWidget />
        <div className={styles.kpiSub}>Months at burn</div>
      </div>
      <div className={cellClass}>
        <div className={styles.kpiLabel}>Burn</div>
        <div className={styles.kpiValue}>{k ? `$${fmtMoney(k.burnMonthly)}` : "$0"}</div>
        <BurnWidget />
        <div className={styles.kpiSub}>Monthly</div>
      </div>
      <div className={cellClass}>
        <div className={styles.kpiLabel}>EBITDA</div>
        <div className={styles.kpiValue}>{k ? `$${fmtMoney(k.ebitdaMonthly)}` : "$0"}</div>
        <EbitdaWidget />
        <div className={styles.kpiSub}>Monthly approx</div>
      </div>
      <div className={cellClass}>
        <div className={styles.kpiLabel}>Risk Index</div>
        <div className={styles.kpiValue}>{k ? fmtPct(k.riskIndex) : "85%"}</div>
        <RiskWidget />
        <div className={styles.kpiSub}>Health / survival</div>
      </div>
    </div>
  )
}
