// src/components/center/RiskBreakdownPanel.tsx
// PHASE-IG: Investor-Grade Truth Lock
// Visuals derive ONLY from ScenarioDeltaLedger buckets (base/scenario/delta/deltaPct)

import { useMemo } from "react";
import type { ScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";
import styles from "./RiskBreakdownPanel.module.css";

type Tone = "pos" | "neg" | "neutral";
type MetricKey = "runwayMonths" | "arr12" | "arrGrowthPct" | "riskScore" | "qualityScore";

type MetricSpec = {
  key: MetricKey;
  label: string;
  invertGood?: boolean; // e.g. Risk: lower is good
  format: (n: number | null) => string;
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

function deltaNumber(deltaField: any): number | null {
  const n = lnNumber(deltaField?.delta ?? deltaField);
  return n === null ? null : n;
}

function toneFromDelta(delta: number | null, invertGood = false): Tone {
  const d = delta ?? 0;
  if (!Number.isFinite(d) || Math.abs(d) <= 1e-9) return "neutral";
  const sign = invertGood ? -d : d;
  return sign > 0 ? "pos" : "neg";
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
  const n = deltaNumber(deltaField);
  if (n === null) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const mag = Math.abs(n);
  const fixed = mag >= 100 ? Math.round(mag).toString() : mag.toFixed(1);
  return `${sign}${fixed}${suffix}`;
}

/**
 * Intensity is UI-only normalization of |delta| (NOT model math)
 */
function intensityForMetric(metric: MetricKey, absDelta: number): number {
  const x = Math.abs(absDelta);
  const scale: Record<MetricKey, number> = {
    runwayMonths: 6,        // months
    arr12: 500_000,         // dollars
    arrGrowthPct: 10,       // percentage points
    riskScore: 20,          // points
    qualityScore: 20,       // points
  };
  return clamp01(x / Math.max(1e-9, scale[metric]));
}

/**
 * Instrument track position (0..1) derived from base vs scenario.
 * We map the two values onto a local domain for that row to show relative shift.
 */
function instrumentPos(base: number | null, scenario: number | null): { b: number; s: number } {
  const b = base ?? 0;
  const s = scenario ?? 0;
  const min = Math.min(b, s);
  const max = Math.max(b, s);
  const span = Math.max(1e-6, max - min);
  return { b: (b - min) / span, s: (s - min) / span };
}

const METRICS: MetricSpec[] = [
  { key: "runwayMonths", label: "Runway", format: (n) => `${fmt1(n)} mo`, deltaSuffix: " mo" },
  { key: "riskScore", label: "Risk", invertGood: true, format: (n) => fmtInt(n) },
  { key: "arr12", label: "ARR", format: (n) => `$${fmtMoneyCompact(n)}` },
  { key: "arrGrowthPct", label: "ARR Growth", format: (n) => fmtPct1(n), deltaSuffix: "%" },
  { key: "qualityScore", label: "Quality", format: (n) => fmtInt(n) },
];

type Props = { ledger: ScenarioDeltaLedger | null };

export default function RiskBreakdownPanel({ ledger }: Props) {
  const rows = useMemo(() => {
    const l: any = ledger ?? {};

    return METRICS.map((m) => {
      const bucket = l?.[m.key];

      const baseValue = lnNumber(bucket?.base);
      const scenarioValue = lnNumber(bucket?.scenario);
      const d = deltaNumber(bucket?.delta);

      const tone = toneFromDelta(d, !!m.invertGood);
      const intensity = intensityForMetric(m.key, Math.abs(d ?? 0));

      const pos = instrumentPos(baseValue, scenarioValue);

      return {
        key: m.key,
        label: m.label,
        baseText: m.format(baseValue),
        scenarioText: m.format(scenarioValue),
        deltaText: displayDelta(bucket?.delta, m.deltaSuffix ?? ""),
        tone,
        intensity,
        posB: pos.b,
        posS: pos.s,
      };
    });
  }, [ledger]);

  return (
    <section className={styles.panel} aria-label="Risk Breakdown Heatmap">
      <div className={styles.header}>
        <div className={styles.title}>Risk Breakdown</div>
        <div className={styles.sub}>Base → Scenario stress (ledger-driven)</div>
      </div>

      <div className={styles.grid} role="list">
        {rows.map((r) => {
          const toneClass =
            r.tone === "pos" ? styles.tonePos : r.tone === "neg" ? styles.toneNeg : styles.toneNeutral;

          return (
            <div
              key={r.key}
              role="listitem"
              className={`${styles.row} ${toneClass}`}
              style={
                {
                  ["--heat" as any]: r.intensity,
                  ["--bpos" as any]: r.posB,
                  ["--spos" as any]: r.posS,
                } as any
              }
            >
              <div className={styles.left}>
                <div className={styles.metric}>{r.label}</div>
                <div className={styles.values}>
                  <span className={styles.base}>Base: {r.baseText}</span>
                  <span className={styles.scenario}>Scenario: {r.scenarioText}</span>
                </div>
              </div>

              <div className={styles.trackWrap}>
                <div className={styles.track}>
                  <div className={styles.heat} />
                  <div className={styles.baseMark} />
                  <div className={styles.scMark} />
                </div>
              </div>

              <div className={styles.right}>
                <div className={styles.deltaBadge}>{r.deltaText}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
