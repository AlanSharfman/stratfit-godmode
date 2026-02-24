/**
 * SimulationTelemetryRibbon.tsx
 * ════════════════════════════════════════════════════════════════════════════
 * User-safe telemetry ribbon during simulation runs.
 *
 * Now supports BOTH:
 *  - simulationStore (beginRun/completeRun)
 *  - engineActivityStore (canonical real engine activity)
 *
 * This guarantees the ribbon shows for any real run.
 * ════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSimulationStore } from "@/state/simulationStore";
import { useEngineActivityStore } from "@/state/engineActivityStore";
import styles from "./SimulationTelemetryRibbon.module.css";

// Deterministic status sequence (not AI-generated)
const STATUS_LINES = [
  "Sampling futures…",
  "Projecting cash horizon…",
  "Resolving survival curve…",
  "Computing value dispersion…",
  "Ranking sensitivity drivers…",
  "Finalizing intelligence brief…",
] as const;

const LINE_INTERVAL_MS = 1800;
const COMPLETE_VISIBLE_MS = 2000;
const FADE_OUT_MS = 600;

type Phase = "idle" | "running" | "complete" | "fading";

export default function SimulationTelemetryRibbon() {
  // ── Store inputs ──
  const simStatus = useSimulationStore((s) => s.simulationStatus);
  const simMeta = useSimulationStore((s) => s.runMeta);

  const engine = useEngineActivityStore((s) => ({
    isRunning: s.isRunning,
    stage: s.stage,
    iterationsTarget: s.iterationsTarget,
    durationMs: s.durationMs,
  }));

  // ── Derived "active" state ──
  const isRunning = simStatus === "running" || engine.isRunning;
  const isComplete =
    simStatus === "complete" ||
    (!engine.isRunning && engine.stage === "COMPLETE");

  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const lineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safe meta line (prefer simMeta if present; fallback to engineActivity)
  const metaLine = useMemo(() => {
    if (simMeta && isRunning) {
      return `Seed locked · ${simMeta.paths.toLocaleString()} paths · ${simMeta.timeHorizonMonths} mo · Updating survival + value bands…`;
    }
    if (engine.isRunning) {
      const paths = engine.iterationsTarget > 0 ? engine.iterationsTarget.toLocaleString() : "—";
      return `Seed locked · ${paths} paths · Updating survival + value bands…`;
    }
    return null;
  }, [simMeta, engine.isRunning, engine.iterationsTarget, isRunning]);

  // React to run start/stop
  useEffect(() => {
    if (isRunning) {
      setIsVisible(true);
      setPhase("running");
      setVisibleLines(0);

      let lineIdx = 0;
      if (lineTimerRef.current) clearInterval(lineTimerRef.current);
      lineTimerRef.current = setInterval(() => {
        lineIdx++;
        if (lineIdx >= STATUS_LINES.length) {
          if (lineTimerRef.current) clearInterval(lineTimerRef.current);
          return;
        }
        setVisibleLines(lineIdx);
      }, LINE_INTERVAL_MS);
    }

    if (!isRunning && isComplete) {
      if (lineTimerRef.current) clearInterval(lineTimerRef.current);
      setVisibleLines(STATUS_LINES.length);
      setPhase("complete");

      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        setPhase("fading");
        setTimeout(() => {
          setIsVisible(false);
          setPhase("idle");
          setVisibleLines(0);
        }, FADE_OUT_MS);
      }, COMPLETE_VISIBLE_MS);
    }

    return () => {
      if (lineTimerRef.current) clearInterval(lineTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [isRunning, isComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.ribbon} ${phase === "fading" ? styles.fadeOut : styles.fadeIn}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.header}>
        <span
          className={`${styles.led} ${
            phase === "complete" ? styles.ledComplete : styles.ledRunning
          }`}
        />
        <span className={styles.title}>
          {phase === "complete" ? "RUN COMPLETE" : "SIMULATION RUNNING"}
        </span>
      </div>

      {metaLine && phase === "running" && (
        <div className={styles.metaLine}>{metaLine}</div>
      )}

      {phase === "running" && (
        <div className={styles.statusLines}>
          {STATUS_LINES.slice(0, visibleLines + 1).map((line, i) => (
            <div
              key={i}
              className={`${styles.statusLine} ${
                i === visibleLines ? styles.statusLineActive : styles.statusLineDone
              }`}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Completion deltas only if simMeta exists */}
      {phase === "complete" && simMeta && (
        <div className={styles.completionDeltas}>
          {simMeta.durationMs !== null && (
            <div className={styles.deltaLine}>
              <span className={styles.deltaLabel}>Duration</span>
              <span className={styles.deltaValue}>{(simMeta.durationMs / 1000).toFixed(1)}s</span>
            </div>
          )}
          {simMeta.survivalDelta !== null && (
            <div className={styles.deltaLine}>
              <span className={styles.deltaLabel}>Survival</span>
              <span
                className={`${styles.deltaValue} ${
                  simMeta.survivalDelta >= 0 ? styles.deltaPositive : styles.deltaNegative
                }`}
              >
                {simMeta.survivalDelta >= 0 ? "+" : ""}
                {simMeta.survivalDelta}%
              </span>
            </div>
          )}
          {simMeta.runwayDelta !== null && (
            <div className={styles.deltaLine}>
              <span className={styles.deltaLabel}>Runway</span>
              <span
                className={`${styles.deltaValue} ${
                  simMeta.runwayDelta >= 0 ? styles.deltaPositive : styles.deltaNegative
                }`}
              >
                {simMeta.runwayDelta >= 0 ? "+" : ""}
                {simMeta.runwayDelta} mo
              </span>
            </div>
          )}
          {simMeta.topDriverLabel && (
            <div className={styles.deltaLine}>
              <span className={styles.deltaLabel}>Top driver</span>
              <span className={styles.deltaValue}>{simMeta.topDriverLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
