import React from "react"
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

/** ARR — momentum arrow with trailing particles */
function ArrWidget() {
  return (
    <div className={styles.widget}>
      <svg width="72" height="32" viewBox="0 0 44 22" fill="none">
        <defs>
          <linearGradient id="arrGrad" x1="0" y1="11" x2="44" y2="11" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
        <path d="M2 18 Q12 16 22 11 T42 4" stroke="url(#arrGrad)" strokeWidth="2" fill="none" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" from="60" to="0" dur="2s" repeatCount="indefinite"/>
        </path>
        <path d="M2 18 Q12 16 22 11 T42 4" stroke="none" fill="none" strokeDasharray="60" strokeWidth="2"/>
        <polygon points="38,2 44,4 38,7" fill="#34d399" opacity="0.9">
          <animateTransform attributeName="transform" type="translate" values="0,0;2,0;0,0" dur="1.2s" repeatCount="indefinite"/>
        </polygon>
        {/* Trailing particles */}
        <circle cx="10" cy="16" r="1.2" fill="#34d399" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0;0.5" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="16;14;16" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="22" cy="11" r="1" fill="#34d399" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2.2s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="11;9;11" dur="2.2s" repeatCount="indefinite"/>
        </circle>
      </svg>
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
