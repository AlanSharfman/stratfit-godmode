// src/components/center/RiskBreakdownPanel.tsx
// PHASE-IG: Investor-Grade Truth Lock
// Heatmap visuals derive ONLY from buildScenarioDeltaLedger(engineResults, activeScenario)

import { useMemo } from "react";
import type { ScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";
import styles from "./RiskBreakdownPanel.module.css";

type Tone = "pos" | "neg" | "neutral";

type MetricKey = "runwayMonths" | "arr12" | "arrGrowthPct" | "riskScore" | "qualityScore";

type MetricSpec = {
  key: MetricKey;
  label: string;
  dominant?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  invertGood?: boolean; // e.g. Risk: lower is good
  formatScenario: (n: number | null) => string;
  deltaSuffix?: string;
};

function lnNumber(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }
  if (x && typeof x === "object" && "value" in (x as any)) {
    const v = (x as any).value;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  return null;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function toneFromDelta(delta: number | null, invertGood = false): Tone {
  const d = delta ?? 0;
  if (!Number.isFinite(d) || Math.abs(d) <= 1e-9) return "neutral";
  const sign = invertGood ? -d : d;
  return sign > 0 ? "pos" : "neg";
}

function extractDeltaNumber(deltaField: any): number | null {
  // supports: deltaField = { delta: number } OR deltaField = number
  const n = lnNumber(deltaField?.delta ?? deltaField);
  return n === null ? null : n;
}

function fmtInt(n: number | null): string {
  if (n === null) return "—";
  return Math.round(n).toString();
}

function fmt1(n: number | null): string {
  if (n === null) return "—";
  return n.toFixed(1);
}

function fmtPct1(n: number | null): string {
  if (n === null) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtMoneyCompact(n: number | null): string {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-AU", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(n);
}

function displayDelta(deltaField: any, suffix = ""): string {
  const n = extractDeltaNumber(deltaField);
  if (n === null) return "—";
  const fixed = Math.abs(n) >= 100 ? Math.round(n).toString() : n.toFixed(1);
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${fixed}${suffix}`;
}

/**
 * PHASE-IG normalization: absolute delta magnitude -> [0..1] intensity
 * UI-only normalization (NOT a model). Uses ONLY numeric ledger deltas.
 */
function intensityForMetric(metric: MetricKey, absDelta: number): number {
  const x = Math.abs(absDelta);

  const scale: Record<MetricKey, number> = {
    runwayMonths: 6,       // months
    arr12: 500_000,        // dollars
    arrGrowthPct: 10,      // percentage points
    riskScore: 20,         // points
    qualityScore: 20,      // points
  };

  return clamp01(x / Math.max(1e-9, scale[metric]));
}

const METRICS: MetricSpec[] = [
  {
    key: "runwayMonths",
    label: "Runway",
    dominant: true,
    formatScenario: (n) => `${fmt1(n)} mo`,
    deltaSuffix: " mo",
  },
  {
    key: "riskScore",
    label: "Risk",
    dominant: true,
    invertGood: true,
    formatScenario: (n) => fmtInt(n),
    deltaSuffix: "",
  },
  {
    key: "arr12",
    label: "ARR",
    secondary: true,
    formatScenario: (n) => `$${fmtMoneyCompact(n)}`,
    deltaSuffix: "",
  },
  {
    key: "arrGrowthPct",
    label: "ARR Growth",
    secondary: true,
    formatScenario: (n) => fmtPct1(n),
    deltaSuffix: "%",
  },
  {
    key: "qualityScore",
    label: "Quality",
    tertiary: true,
    formatScenario: (n) => fmtInt(n),
    deltaSuffix: "",
  },
];

type Props = {
  ledger: ScenarioDeltaLedger | null;
};

export default function RiskBreakdownPanel({ ledger }: Props) {
  const rows = useMemo(() => {
    const l: any = ledger ?? {};

    // IMPORTANT: we map the typed METRICS list (NOT Object.keys) to avoid string -> MetricKey issues.
    return METRICS.map((m) => {
      const bucket = l?.[m.key];

      const scenarioValue = lnNumber(bucket?.scenario);
      const deltaNum = extractDeltaNumber(bucket?.delta);

      const tone = toneFromDelta(deltaNum, !!m.invertGood);
      const intensity = intensityForMetric(m.key, Math.abs(deltaNum ?? 0));

      return {
        key: m.key,
        label: m.label,
        scenarioText: m.formatScenario(scenarioValue),
        deltaText: displayDelta(bucket?.delta, m.deltaSuffix ?? ""),
        tone,
        intensity,
        dominant: !!m.dominant,
        secondary: !!m.secondary,
        tertiary: !!m.tertiary,
      };
    });
  }, [ledger]);

  return (
    <section className={styles.panel} aria-label="Risk Breakdown Heatmap">
      <div className={styles.header}>
        <div className={styles.title}>Risk Breakdown</div>
        <div className={styles.sub}>Stress surface (ledger-driven)</div>
      </div>

      <div className={styles.grid} role="list">
        {rows.map((r) => {
          const rowClass = r.dominant
            ? styles.rowDominant
            : r.secondary
            ? styles.rowSecondary
            : styles.rowTertiary;

          const toneClass =
            r.tone === "pos"
              ? styles.tonePos
              : r.tone === "neg"
              ? styles.toneNeg
              : styles.toneNeutral;

          return (
            <div
              key={r.key}
              role="listitem"
              className={`${styles.row} ${rowClass} ${toneClass}`}
              style={{ ["--heat" as any]: r.intensity } as any}
            >
              <div className={styles.cell}>
                <div className={styles.cellTop}>
                  <div className={styles.metric}>{r.label}</div>
                  <div className={styles.value}>{r.scenarioText}</div>
                </div>

                <div className={styles.delta}>{r.deltaText}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
