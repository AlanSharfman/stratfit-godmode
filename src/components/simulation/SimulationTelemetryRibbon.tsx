/**
 * SimulationTelemetryRibbon.tsx
 * ════════════════════════════════════════════════════════════════════════════
 * A user-safe telemetry ribbon that appears during simulation runs.
 *
 * Shows:
 *   - "SIMULATION RUNNING" label with safe metadata
 *   - Sequential hardcoded status lines (not AI-generated)
 *   - On completion: "RUN COMPLETE" with safe deltas (survival, runway, top driver)
 *
 * Position: Fixed top-right overlay above the right panel.
 * Institutional styling. No toy effects. No engine internals.
 * ════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef } from "react";
import { useSimulationStore } from "@/state/simulationStore";
import type { SimulationStatus, RunMeta } from "@/state/simulationStore";
import styles from "./SimulationTelemetryRibbon.module.css";

// ────────────────────────────────────────────────────────────────────────────
// HARDCODED STATUS SEQUENCE (deterministic, not AI-generated)
// ────────────────────────────────────────────────────────────────────────────

const STATUS_LINES = [
  "Sampling futures…",
  "Projecting cash horizon…",
  "Resolving survival curve…",
  "Computing value dispersion…",
  "Ranking sensitivity drivers…",
  "Finalizing intelligence brief…",
] as const;

const LINE_INTERVAL_MS = 1800; // Time between each status line appearing
const COMPLETE_VISIBLE_MS = 2000; // How long "RUN COMPLETE" stays visible
const FADE_OUT_MS = 600; // Ease-out duration

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export default function SimulationTelemetryRibbon() {
  const simulationStatus = useSimulationStore((s) => s.simulationStatus);
  const runMeta = useSimulationStore((s) => s.runMeta);

  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "complete" | "fading">("idle");
  const lineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── React to simulation status changes ──
  useEffect(() => {
    if (simulationStatus === "running") {
      setIsVisible(true);
      setPhase("running");
      setVisibleLines(0);

      // Sequentially reveal status lines
      let lineIdx = 0;
      lineTimerRef.current = setInterval(() => {
        lineIdx++;
        if (lineIdx >= STATUS_LINES.length) {
          if (lineTimerRef.current) clearInterval(lineTimerRef.current);
          return;
        }
        setVisibleLines(lineIdx);
      }, LINE_INTERVAL_MS);
    }

    if (simulationStatus === "complete") {
      // Stop line timer
      if (lineTimerRef.current) clearInterval(lineTimerRef.current);
      setVisibleLines(STATUS_LINES.length); // Show all lines briefly
      setPhase("complete");

      // Hold "RUN COMPLETE" then fade
      fadeTimerRef.current = setTimeout(() => {
        setPhase("fading");
        setTimeout(() => {
          setIsVisible(false);
          setPhase("idle");
          setVisibleLines(0);
        }, FADE_OUT_MS);
      }, COMPLETE_VISIBLE_MS);
    }

    if (simulationStatus === "idle" || simulationStatus === "error") {
      if (lineTimerRef.current) clearInterval(lineTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      // Don't immediately hide on error — let it show briefly
      if (simulationStatus === "idle") {
        setIsVisible(false);
        setPhase("idle");
      }
    }

    return () => {
      if (lineTimerRef.current) clearInterval(lineTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [simulationStatus]);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.ribbon} ${phase === "fading" ? styles.fadeOut : styles.fadeIn}`}
      role="status"
      aria-live="polite"
    >
      {/* ── LED + Title ── */}
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

      {/* ── Meta line (safe telemetry only) ── */}
      {runMeta && phase === "running" && (
        <div className={styles.metaLine}>
          Seed locked · {runMeta.paths.toLocaleString()} paths · {runMeta.timeHorizonMonths} mo
          · Updating survival + value bands…
        </div>
      )}

      {/* ── Status lines (sequential reveal) ── */}
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

      {/* ── Completion deltas (safe) ── */}
      {phase === "complete" && runMeta && (
        <div className={styles.completionDeltas}>
          {runMeta.durationMs !== null && (
            <div className={styles.deltaLine}>
              <span className={styles.deltaLabel}>Duration</span>
              <span className={styles.deltaValue}>{(runMeta.durationMs / 1000).toFixed(1)}s</span>
            </div>
          )}
          {runMeta.survivalDelta !== null && (
            <div className={styles.deltaLine}>
              <span className={styles.deltaLabel}>Survival</span>
              <span
                className={`${styles.deltaValue} ${
                  runMeta.survivalDelta >= 0 ? styles.deltaPositive : styles.deltaNegative
                }`}
              >
                {runMeta.survivalDelta >= 0 ? "+" : ""}
                {runMeta.survivalDelta}%
              </span>
            </div>
          )}
          {runMeta.runwayDelta !== null && (
            <div className={styles.deltaLine}>
              <span className={styles.deltaLabel}>Runway</span>
              <span
                className={`${styles.deltaValue} ${
                  runMeta.runwayDelta >= 0 ? styles.deltaPositive : styles.deltaNegative
                }`}
              >
                {runMeta.runwayDelta >= 0 ? "+" : ""}
                {runMeta.runwayDelta} mo
              </span>
            </div>
          )}
          {runMeta.topDriverLabel && (
            <div className={styles.deltaLine}>
              <span className={styles.deltaLabel}>Top driver</span>
              <span className={styles.deltaValue}>{runMeta.topDriverLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



