// src/components/system/ComputationMonitor.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Platform-Wide Computation Monitor
//
// LEGAL GUARDRAIL: This must only display real compute lifecycle events;
// never fabricate progress. No fake percentages. No staged delays.
// No typing theatre. Only real function boundary events.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import {
  computeBus,
  type ComputeEvent,
  type ComputeJob,
  type ComputeStep,
} from "@/engine/computeTelemetry";

// ── Human-readable job labels ────────────────────────────────────────────

const JOB_LABELS: Record<ComputeJob, string> = {
  baseline_compile: "Baseline calibration",
  strategy_compile: "Strategy compilation",
  terrain_simulation: "Terrain simulation",
  compare_delta: "Compare delta analysis",
  risk_scoring: "Risk scoring",
  valuation_dcf: "Valuation analysis",
  valuation_comps: "Valuation analysis",
  valuation_multiples: "Valuation analysis",
  decision_synthesis: "Decision synthesis",
  report_pack_generate: "Output pack generation",
  data_import: "Data import",
  render_prepare: "Render preparation",
  cache_rebuild: "Cache rebuild",
  custom: "Processing",
};

// ── Human-readable step labels ───────────────────────────────────────────

const STEP_LABELS: Record<ComputeStep, string> = {
  initialize: "Initializing",
  load_inputs: "Loading inputs",
  validate: "Validating",
  normalize: "Normalizing",
  derive_metrics: "Deriving metrics",
  prepare_model: "Preparing model",
  run_model: "Computing",
  aggregate: "Aggregating",
  postprocess: "Post-processing",
  render: "Rendering",
  persist: "Saving",
  complete: "Complete",
  error: "Error",
};

// ── Monitor state ────────────────────────────────────────────────────────

type MonitorState = "idle" | "active" | "complete" | "error";

// ── Component ────────────────────────────────────────────────────────────

export default function ComputationMonitor() {
  const [monitorState, setMonitorState] = useState<MonitorState>("idle");
  const [currentEvent, setCurrentEvent] = useState<ComputeEvent | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEvent = useCallback((evt: ComputeEvent) => {
    // Clear any pending collapse timer
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }

    setCurrentEvent(evt);

    if (evt.step === "complete") {
      setMonitorState("complete");
      // Show complete state for 1.5s, then collapse to icon
      collapseTimerRef.current = setTimeout(() => {
        setMonitorState("idle");
        setCurrentEvent(null);
      }, 1500);
    } else if (evt.step === "error") {
      setMonitorState("error");
      // Show error state for 3s, then collapse
      collapseTimerRef.current = setTimeout(() => {
        setMonitorState("idle");
        setCurrentEvent(null);
      }, 3000);
    } else {
      setMonitorState("active");
    }
  }, []);

  useEffect(() => {
    const unsub = computeBus.subscribe(handleEvent);
    return () => {
      unsub();
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, [handleEvent]);

  // ── Build meta line (only factual data) ─────────────────────────────

  const metaLine = currentEvent?.meta
    ? [
        currentEvent.meta.methodName,
        currentEvent.meta.iterations != null
          ? `Iterations: ${currentEvent.meta.iterations.toLocaleString()}`
          : null,
        currentEvent.meta.scenarios != null
          ? `Scenarios: ${currentEvent.meta.scenarios.toLocaleString()}`
          : null,
        currentEvent.meta.rows != null
          ? `Rows: ${currentEvent.meta.rows.toLocaleString()}`
          : null,
        currentEvent.step === "complete" && currentEvent.meta.durationMs != null
          ? `✓ Complete · ${currentEvent.meta.durationMs.toFixed(0)}ms`
          : null,
        currentEvent.meta.note,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  const jobLabel = currentEvent
    ? JOB_LABELS[currentEvent.job] ?? currentEvent.job
    : "";
  const stepLabel = currentEvent
    ? STEP_LABELS[currentEvent.step] ?? currentEvent.step
    : "";

  // ── Idle: small persistent icon bottom-right ────────────────────────

  if (monitorState === "idle") {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(5,8,16,0.85)",
          border: "1px solid rgba(34,211,238,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "default",
          zIndex: 9999,
          backdropFilter: "blur(8px)",
          transition: "opacity 0.2s",
        }}
        title="STRATFIT Computation Monitor"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle
            cx="7"
            cy="7"
            r="5"
            stroke="rgba(34,211,238,0.4)"
            strokeWidth="1"
          />
          <circle cx="7" cy="7" r="2" fill="rgba(34,211,238,0.3)" />
        </svg>
      </div>
    );
  }

  // ── Active / Complete / Error: expanded panel ───────────────────────

  const borderColor =
    monitorState === "error"
      ? "rgba(239,68,68,0.4)"
      : monitorState === "complete"
        ? "rgba(52,211,153,0.4)"
        : "rgba(34,211,238,0.25)";

  const dotColor =
    monitorState === "error"
      ? "#ef4444"
      : monitorState === "complete"
        ? "#34d399"
        : "#22d3ee";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        minWidth: 220,
        maxWidth: 320,
        background: "rgba(5,8,16,0.92)",
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        padding: "10px 14px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        zIndex: 9999,
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        transition: "border-color 0.2s",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
          }}
        >
          COMPUTATION
        </span>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dotColor,
            display: "inline-block",
          }}
        />
      </div>

      {/* Job label */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(226,232,240,0.9)",
          marginBottom: 2,
          letterSpacing: "-0.01em",
        }}
      >
        {jobLabel}
      </div>

      {/* Step label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 400,
          color:
            monitorState === "error"
              ? "rgba(239,68,68,0.8)"
              : monitorState === "complete"
                ? "rgba(52,211,153,0.8)"
                : "rgba(34,211,238,0.7)",
          marginBottom: 4,
        }}
      >
        {monitorState === "complete"
          ? "✓ Complete"
          : monitorState === "error"
            ? "✗ Error"
            : stepLabel}
      </div>

      {/* Meta line — only factual data */}
      {metaLine && (
        <div
          style={{
            fontSize: 9,
            color: "rgba(148,163,184,0.6)",
            letterSpacing: "0.02em",
            lineHeight: 1.4,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: 4,
            marginTop: 2,
          }}
        >
          {metaLine}
        </div>
      )}
    </div>
  );
}





