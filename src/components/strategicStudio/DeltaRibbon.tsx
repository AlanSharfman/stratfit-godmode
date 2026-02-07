import React, { useMemo } from "react";
import styles from "./DeltaRibbon.module.css";

type StoredResult = Partial<{
  survivalRate: number; // 0..1
  runwayPercentiles: Partial<Record<"p10" | "p50" | "p90", number>>;
  arrPercentiles: Partial<Record<"p10" | "p50" | "p90", number>>;
  medianCase: Partial<{ finalARR: number; finalRunway: number }>;
}>;

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function extractStoredResult(v: unknown): StoredResult | null {
  if (!isObj(v)) return null;
  const survivalRate = asNum(v.survivalRate) ?? undefined;
  const runwayPercentiles = isObj(v.runwayPercentiles) ? (v.runwayPercentiles as any) : undefined;
  const arrPercentiles = isObj(v.arrPercentiles) ? (v.arrPercentiles as any) : undefined;
  const medianCase = isObj(v.medianCase) ? (v.medianCase as any) : undefined;

  const hasAny = survivalRate != null || runwayPercentiles || arrPercentiles || medianCase;
  if (!hasAny) return null;
  return { survivalRate, runwayPercentiles, arrPercentiles, medianCase };
}

function fmtMoney(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function fmtPct(v01: number): string {
  const pct = v01 * 100;
  return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`;
}

function fmtMo(v: number): string {
  const r = Math.max(0, v);
  return `${r.toFixed(r < 10 ? 1 : 0)} mo`;
}

export function DeltaRibbon(props: {
  storedResult: unknown | null;
  pulse?: boolean;
}) {
  const { storedResult, pulse = false } = props;

  const extracted = useMemo(() => extractStoredResult(storedResult), [storedResult]);

  const survivalPct = extracted?.survivalRate != null ? fmtPct(extracted.survivalRate) : "—";
  const runwayMoRaw =
    extracted?.runwayPercentiles?.p50 ??
    extracted?.medianCase?.finalRunway ??
    null;
  const runwayMo = typeof runwayMoRaw === "number" && Number.isFinite(runwayMoRaw) ? fmtMo(runwayMoRaw) : "—";

  const arrP50Raw =
    extracted?.arrPercentiles?.p50 ??
    extracted?.medianCase?.finalARR ??
    null;
  const evApprox =
    typeof arrP50Raw === "number" && Number.isFinite(arrP50Raw) ? arrP50Raw * 8 : null;
  const ev = evApprox != null ? fmtMoney(evApprox) : "—";

  const missing = !extracted;

  return (
    <div className={styles.ribbon}>
      <div className={`${styles.tile} ${pulse ? styles.tilePulse : ""}`}>
        <div className={styles.kicker}>Survival</div>
        <div className={styles.value}>{survivalPct}</div>
        <div className={styles.sub}>From stored results</div>
      </div>
      <div className={`${styles.tile} ${pulse ? styles.tilePulse : ""}`}>
        <div className={styles.kicker}>Runway</div>
        <div className={styles.value}>{runwayMo}</div>
        <div className={styles.sub}>Median (P50)</div>
      </div>
      <div className={`${styles.tile} ${pulse ? styles.tilePulse : ""}`}>
        <div className={styles.kicker}>Value / EV</div>
        <div className={styles.value}>{ev}</div>
        <div className={styles.sub}>Proxy: P50 ARR × 8</div>
      </div>

      {missing ? <div className={styles.hint}>Run Simulation to update outcomes.</div> : null}
    </div>
  );
}

export default DeltaRibbon;


