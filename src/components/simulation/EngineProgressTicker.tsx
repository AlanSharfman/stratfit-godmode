import React, { useMemo } from "react";
import styles from "./EngineProgressTicker.module.css";
import { useEngineActivityStore } from "@/state/engineActivityStore";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function formatMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function formatStage(stage: string) {
  switch (stage) {
    case "IDLE": return "Idle";
    case "INITIALIZING": return "Initializing";
    case "SAMPLING": return "Sampling";
    case "AGGREGATING": return "Aggregating";
    case "CONVERGING": return "Converging";
    case "FINALIZING": return "Finalizing";
    case "COMPLETE": return "Complete";
    case "ERROR": return "Error";
    default: return stage;
  }
}

export default function EngineProgressTicker() {
  // ✅ Primitive selectors only (no objects, no whole-store subscription)
  const isRunning = useEngineActivityStore((s) => s.isRunning);
  const stage = useEngineActivityStore((s) => s.stage);
  const iterationsTarget = useEngineActivityStore((s) => s.iterationsTarget);
  const iterationsCompleted = useEngineActivityStore((s) => s.iterationsCompleted);
  const durationMs = useEngineActivityStore((s) => s.durationMs);
  const message = useEngineActivityStore((s) => s.message);
  const error = useEngineActivityStore((s) => s.error);

  const progress01 = useMemo(() => {
    if (!iterationsTarget || iterationsTarget <= 0) return 0;
    return clamp01(iterationsCompleted / iterationsTarget);
  }, [iterationsCompleted, iterationsTarget]);

  const ratePerSec = useMemo(() => {
    if (!durationMs || durationMs <= 0) return null;
    const sec = durationMs / 1000;
    if (sec <= 0.25) return null; // avoid noisy early reads
    return Math.round(iterationsCompleted / sec);
  }, [iterationsCompleted, durationMs]);

  const stageLabel = formatStage(stage);
  const statusTone =
    stage === "ERROR" ? "error" :
    stage === "COMPLETE" ? "complete" :
    isRunning ? "running" : "idle";

  return (
    <div className={`${styles.ticker} ${styles[statusTone]}`} role="status">
      <div className={styles.left}>
        <div className={styles.badge}>{stageLabel}</div>
        <div className={styles.msg}>
          {stage === "ERROR"
            ? (error ?? "Engine error")
            : (message ?? (isRunning ? "Computing…" : "Ready"))}
        </div>
      </div>

      <div className={styles.mid}>
        <div className={styles.metrics}>
          <span className={styles.kv}>
            <span className={styles.k}>Iter</span>
            <span className={styles.v}>
              {iterationsCompleted.toLocaleString()} / {iterationsTarget.toLocaleString()}
            </span>
          </span>

          <span className={styles.kv}>
            <span className={styles.k}>Elapsed</span>
            <span className={styles.v}>{formatMs(durationMs ?? 0)}</span>
          </span>

          <span className={styles.kv}>
            <span className={styles.k}>Rate</span>
            <span className={styles.v}>{ratePerSec ? `${ratePerSec.toLocaleString()}/s` : "—"}</span>
          </span>
        </div>

        <div className={styles.bar}>
          <div className={styles.barFill} style={{ width: `${Math.round(progress01 * 100)}%` }} />
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.pct}>{Math.round(progress01 * 100)}%</div>
      </div>
    </div>
  );
}
