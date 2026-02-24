import React, { useMemo } from "react";
import { useEngineActivityStore } from "@/state/engineActivityStore";
import { useSimulationStore } from "@/state/simulationStore";

function fmtMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0.0s";
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusText(status: string) {
  switch (status) {
    case "idle":
      return "Ready";
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function stageText(stage: string) {
  switch (stage) {
    case "IDLE":
      return "Idle";
    case "INITIALIZING":
      return "Initialising";
    case "SAMPLING":
      return "Sampling";
    case "AGGREGATING":
      return "Aggregating";
    case "CONVERGING":
      return "Converging";
    case "FINALIZING":
      return "Finalising";
    case "COMPLETE":
      return "Complete";
    case "ERROR":
      return "Error";
    default:
      return stage;
  }
}

/**
 * STRATFIT — Simulation Progress Ticker (Module 1)
 * - Read-only UI surface
 * - Primitive selectors ONLY
 * - No effects, no store writes, no object selectors
 */
export default function SimulationProgressTicker() {
  // Simulation lifecycle (canonical high-level status)
  const simStatus = useSimulationStore((s) => s.simulationStatus);

  // Engine telemetry (truth for progress)
  const isRunning = useEngineActivityStore((s) => s.isRunning);
  const stage = useEngineActivityStore((s) => s.stage);
  const itTarget = useEngineActivityStore((s) => s.iterationsTarget);
  const itDone = useEngineActivityStore((s) => s.iterationsCompleted);
  const durationMs = useEngineActivityStore((s) => s.durationMs);
  const message = useEngineActivityStore((s) => s.message);
  const error = useEngineActivityStore((s) => s.error);

  const pct = useMemo(() => {
    if (!itTarget || itTarget <= 0) return 0;
    const raw = (itDone / itTarget) * 100;
    return Math.max(0, Math.min(100, raw));
  }, [itDone, itTarget]);

  const headline = useMemo(() => {
    const s = statusText(simStatus);
    const st = stageText(stage);
    return `${s} · ${st}`;
  }, [simStatus, stage]);

  const subline = useMemo(() => {
    if (error) return `Error: ${error}`;
    if (message) return message;
    if (isRunning) return "Engine executing…";
    return "Ready.";
  }, [error, message, isRunning]);

  return (
    <div
      aria-label="Simulation progress ticker"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.30)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Top line */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: 0.2,
            opacity: 0.92,
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {headline}
        </div>

        <div style={{ fontSize: 12, opacity: 0.7 }}>{fmtMs(durationMs)}</div>
      </div>

      {/* Sub line */}
      <div style={{ fontSize: 12, opacity: 0.75 }}>{subline}</div>

      {/* Progress bar */}
      <div
        style={{
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: error ? "rgba(255,80,80,0.70)" : "rgba(0,224,255,0.65)",
            transition: "width 80ms linear",
          }}
        />
      </div>

      {/* Bottom metrics */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.7 }}>
        <div>
          {itTarget > 0
            ? `${Math.min(itDone, itTarget).toLocaleString()} / ${itTarget.toLocaleString()}`
            : "—"}
        </div>
        <div>{pct.toFixed(0)}%</div>
      </div>
    </div>
  );
}
