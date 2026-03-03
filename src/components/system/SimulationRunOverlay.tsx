// src/components/system/SimulationRunOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Simulation Run Event Overlay
//
// Temporary cinematic overlay shown when simulation starts.
// Text: "SIMULATION RUNNING — Computing 10,000 possible futures"
// Fades out after terrain_render stage.
// Wired to real engine state.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useState } from "react";
import { useSimulationEngineStore } from "@/state/simulationEngineStore";

const SimulationRunOverlay: React.FC = memo(() => {
  const stage = useSimulationEngineStore((s) => s.stage);
  const paths = useSimulationEngineStore((s) => s.simulationPaths);

  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show when simulation enters active stages
    if (
      stage === "baseline_capture" ||
      stage === "scenario_construction" ||
      stage === "model_calibration" ||
      stage === "monte_carlo"
    ) {
      setShow(true);
      setFading(false);
    }

    // Fade out at terrain_render or complete
    if (stage === "terrain_render" || stage === "complete") {
      setFading(true);
      const t = setTimeout(() => {
        setShow(false);
        setFading(false);
      }, 1200);
      return () => clearTimeout(t);
    }

    // Reset on idle
    if (stage === "idle") {
      setShow(false);
      setFading(false);
    }
  }, [stage]);

  if (!show) return null;

  const pathsLabel = paths > 0 ? paths.toLocaleString() : "10,000";

  return (
    <div
      style={{
        ...S.overlay,
        opacity: fading ? 0 : 1,
        transition: "opacity 1.2s ease",
      }}
      aria-live="assertive"
      role="alert"
    >
      <div style={S.inner}>
        <div style={S.scanBar} />
        <div style={S.label}>SIMULATION RUNNING</div>
        <div style={S.sub}>
          Computing {pathsLabel} possible futures
        </div>
        <div style={S.dots}>
          <span style={S.dot} />
          <span style={{ ...S.dot, animationDelay: "0.2s" }} />
          <span style={{ ...S.dot, animationDelay: "0.4s" }} />
        </div>
      </div>

      {/* Inject keyframe animation */}
      <style>{`
        @keyframes sf-sim-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes sf-sim-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
});

SimulationRunOverlay.displayName = "SimulationRunOverlay";
export default SimulationRunOverlay;

// ────────────────────────────────────────────────────────────────────────────
// INLINE STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(5, 8, 14, 0.75)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    pointerEvents: "none",
  },
  inner: {
    textAlign: "center" as const,
    maxWidth: 400,
  },
  scanBar: {
    width: 200,
    height: 1,
    margin: "0 auto 20px",
    background: "rgba(34, 211, 238, 0.15)",
    overflow: "hidden",
    position: "relative" as const,
  },
  label: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.12em",
    color: "rgba(226, 232, 240, 0.85)",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  sub: {
    fontFamily: FONT,
    fontSize: 12,
    color: "rgba(148, 163, 184, 0.6)",
    letterSpacing: "0.04em",
    marginBottom: 16,
  },
  dots: {
    display: "flex",
    gap: 6,
    justifyContent: "center",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: "rgba(34, 211, 238, 0.6)",
    animation: "sf-sim-pulse 1.2s ease infinite",
  },
};
