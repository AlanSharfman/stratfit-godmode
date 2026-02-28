import React from "react"
import type { Phase1Scenario } from "@/state/phase1ScenarioStore"
import type { BaselineV1 } from "@/onboard/baseline"
import styles from "./ScenarioBriefPanel.module.css"

const DASH = "\u2014" // em-dash fallback

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

interface Props {
  scenario: Phase1Scenario
  baseline: BaselineV1 | null | undefined
}

export default function ScenarioBriefPanel({ scenario, baseline }: Props) {
  const decisionText =
    scenario.decision && scenario.decision.length > 0
      ? scenario.decision.length > 120
        ? scenario.decision.slice(0, 117) + "\u2026"
        : scenario.decision
      : "No decision"

  const intentLabel =
    scenario.intent != null && typeof scenario.intent === "string" && scenario.intent.length > 0
      ? scenario.intent
      : scenario.intent != null &&
          typeof scenario.intent === "object" &&
          (scenario.intent as any)?.label
        ? String((scenario.intent as any).label)
        : null

  const cash = baseline?.financial?.cashOnHand ?? null
  const burn = baseline?.financial?.monthlyBurn ?? null
  const runway =
    cash != null && burn != null && burn > 0
      ? Math.round(cash / burn)
      : null

  return (
    <div className={styles.panel} aria-label="Scenario Brief">
      <div className={styles.heading}>Scenario Brief</div>

      <div className={styles.decision}>{decisionText}</div>

      {intentLabel && <div className={styles.intent}>{intentLabel}</div>}

      <div className={styles.kpiGrid}>
        <span className={styles.kpiLabel}>Cash</span>
        <span className={styles.kpiValue}>{fmt(cash)}</span>

        <span className={styles.kpiLabel}>Burn</span>
        <span className={styles.kpiValue}>{fmt(burn)}</span>

        <span className={styles.kpiLabel}>Runway</span>
        <span className={styles.kpiValue}>{runway != null ? `${runway}mo` : DASH}</span>
      </div>

      <div className={styles.horizon}>
        <span>Horizon: 24mo</span>
        <span>
          {new Date(scenario.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  )
}
