import React from "react";
import styles from "./TerrainTopStrip.module.css";
import MomentumArrow from "./MomentumArrow";

type Telemetry = {
  runwayMonths: number;
  momGrowth: number; // e.g. -0.012 for -1.2%
  probability: number; // 0..1
  sysIndex?: number; // optional display only
};

type Props = {
  telemetry: Telemetry;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function pct(n: number) {
  const v = (n * 100);
  const abs = Math.abs(v);
  const dp = abs >= 10 ? 0 : 1;
  return `${v.toFixed(dp)}%`;
}

function growthTier(mom: number): "strong" | "stable" | "risk" {
  if (mom >= 0.02) return "strong";
  if (mom >= -0.005) return "stable";
  return "risk";
}

function stabilityTier(p: number): "strong" | "stable" | "risk" {
  if (p >= 0.75) return "strong";
  if (p >= 0.55) return "stable";
  return "risk";
}

export default function TerrainTopStrip({ telemetry }: Props) {
  const runway = Math.max(0, Math.round(telemetry.runwayMonths));
  const mom = telemetry.momGrowth ?? 0;
  const prob = clamp01(telemetry.probability ?? 0);

  const momTier = growthTier(mom);
  const stabTier = stabilityTier(prob);

  const sysIndex = typeof telemetry.sysIndex === "number" ? telemetry.sysIndex : undefined;

  return (
    <div className={styles.topStrip}>
      {/* RESILIENCE */}
      <div className={styles.pod}>
        <div className={styles.podHeader}>
          <div className={styles.podTitle}>RESILIENCE</div>
          <div className={`${styles.chip} ${styles.chipCyan}`}>RUNWAY</div>
        </div>

        <div className={styles.podBody}>
          <div className={styles.primaryValue}>
            <div className={styles.bigNumber}>{runway}</div>
            <div className={styles.unit}>MONTHS</div>
          </div>
          <div className={styles.subLabel}>runway</div>
        </div>

        <div className={styles.podViz} aria-hidden="true">
          <div className={styles.resilienceBars}>
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className={styles.bar} style={{ ["--i" as any]: i }} />
            ))}
          </div>
        </div>
      </div>

      {/* MOMENTUM */}
      <div className={styles.pod}>
        <div className={styles.podHeader}>
          <div className={styles.podTitle}>MOMENTUM</div>
          <div
            className={[
              styles.chip,
              momTier === "strong"
                ? styles.chipEmerald
                : momTier === "risk"
                ? styles.chipRed
                : styles.chipCyan,
            ].join(" ")}
          >
            {momTier === "strong" ? "ACCEL" : momTier === "risk" ? "DRIFT" : "STABLE"}
          </div>
        </div>

        <div className={styles.podBody}>
          <div className={styles.primaryValue}>
            <div className={styles.bigNumber}>{pct(mom)}</div>
            <div className={styles.unit}>MoM</div>
          </div>
          <div className={styles.subLabel}>growth</div>
        </div>

        <div className={styles.podViz}>
          <MomentumArrow momGrowth={mom} />
        </div>
      </div>

      {/* STABILITY */}
      <div className={`${styles.pod} ${styles.stabilityPod}`}>
        <div className={styles.podHeader}>
          <div className={styles.podTitle}>STABILITY</div>
          <div
            className={[
              styles.chip,
              stabTier === "strong"
                ? styles.chipEmerald
                : stabTier === "risk"
                ? styles.chipRed
                : styles.chipCyan,
            ].join(" ")}
          >
            {stabTier === "strong" ? "NOMINAL" : stabTier === "risk" ? "VOLATILE" : "CONTROLLED"}
          </div>
        </div>

        <div className={styles.podBody}>
          <div className={styles.primaryValue}>
            <div className={styles.bigNumber}>{Math.round(prob * 100)}%</div>
            <div className={styles.unit}>PROB</div>
          </div>

          <div className={styles.subLabel}>
            {sysIndex != null ? `SYS ${Math.round(sysIndex)}` : "probability"}
          </div>
        </div>

        <div className={styles.podViz}>
          <div className={styles.survivalRing} data-tier={stabTier} aria-hidden="true">
            <div className={styles.ringInner} />
          </div>
        </div>
      </div>
    </div>
  );
}
