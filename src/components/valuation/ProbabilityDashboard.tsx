// src/components/valuation/ProbabilityDashboard.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Probability Dashboard (Phase V-3B)
//
// Three probability KPI rows derived from ValuationResults.probabilities:
//   1) P(Value Creation)  — fraction of methods with EV > 0
//   2) P(Value Loss)      — fraction of methods with EV ≤ 0
//   3) P(EV ≥ Target)     — fraction of methods exceeding blended EV
//
// No UI-side computation — reads formatted probabilities only.
// ═══════════════════════════════════════════════════════════════════════════

import type { ValuationResults } from "@/valuation/valuationTypes";
import styles from "./ProbabilityDashboard.module.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  valuation: ValuationResults;
}

interface MetricRow {
  label: string;
  value: number | null;
  sentiment: "positive" | "negative" | "neutral";
  hint: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING — zero computation
// ═══════════════════════════════════════════════════════════════════════════

function fmtPct(v: number | null): string {
  if (v == null || !isFinite(v)) return "—";
  return `${(v * 100).toFixed(0)}%`;
}

function fmtEV(v: number): string {
  if (!isFinite(v) || v === 0) return "$0";
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ProbabilityDashboard({ valuation }: Props) {
  const probs = valuation.probabilities;

  const metrics: MetricRow[] = [
    {
      label: "Probability Strategy Creates Value",
      value: probs?.valueCreate ?? null,
      sentiment: (probs?.valueCreate ?? 0) >= 0.5 ? "positive" : "neutral",
      hint: "Fraction of valuation methods yielding EV > 0",
    },
    {
      label: "Probability Strategy Destroys Value",
      value: probs?.valueLoss ?? null,
      sentiment: (probs?.valueLoss ?? 0) > 0 ? "negative" : "positive",
      hint: "Fraction of valuation methods yielding EV ≤ 0",
    },
    {
      label: `Probability EV ≥ Target`,
      value: probs?.target ?? null,
      sentiment: (probs?.target ?? 0) >= 0.5 ? "positive" : "neutral",
      hint: `Target = blended EV (${fmtEV(valuation.blendedValue)})`,
    },
  ];

  return (
    <div className={styles.dashboard}>
      {metrics.map((m) => (
        <div key={m.label} className={styles.row}>
          {/* Progress bar background */}
          <div
            className={`${styles.bar} ${styles[`bar_${m.sentiment}`]}`}
            style={{ width: `${Math.max(2, (m.value ?? 0) * 100)}%` }}
          />

          {/* Content overlay */}
          <div className={styles.rowContent}>
            <div className={styles.labelCol}>
              <span className={styles.label}>{m.label}</span>
              <span className={styles.hint}>{m.hint}</span>
            </div>
            <span className={`${styles.value} ${styles[`value_${m.sentiment}`]}`}>
              {fmtPct(m.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
