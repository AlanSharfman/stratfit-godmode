// src/components/studio/SimulationPlayback.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Simulation Playback Controls
//
// ▶ Play  ❚❚ Pause  ⟲ Reset
// Drives the studioTimelineStore playback state.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback } from "react";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, sans-serif";
const CYAN = "rgba(34, 211, 238, 0.85)";
const CYAN_DIM = "rgba(34, 211, 238, 0.15)";

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 28,
    borderRadius: 5,
    border: `1px solid ${CYAN_DIM}`,
    background: "rgba(34,211,238,0.06)",
    color: CYAN,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 150ms ease, border-color 150ms ease",
    padding: 0,
    lineHeight: 1,
  },
  btnActive: {
    background: "rgba(34,211,238,0.18)",
    borderColor: "rgba(34,211,238,0.35)",
  },
  btnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

const SimulationPlayback: React.FC = memo(() => {
  const isPlaying = useStudioTimelineStore((s) => s.isPlaying);
  const timeline = useStudioTimelineStore((s) => s.timeline);
  const play = useStudioTimelineStore((s) => s.play);
  const pause = useStudioTimelineStore((s) => s.pause);
  const reset = useStudioTimelineStore((s) => s.reset);

  const empty = timeline.length === 0;

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div style={S.wrapper}>
      {/* Play / Pause */}
      <button
        type="button"
        onClick={handlePlayPause}
        disabled={empty}
        style={{
          ...S.btn,
          ...(isPlaying ? S.btnActive : {}),
          ...(empty ? S.btnDisabled : {}),
        }}
        title={isPlaying ? "Pause" : "Play"}
        aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>

      {/* Reset */}
      <button
        type="button"
        onClick={handleReset}
        disabled={empty}
        style={{
          ...S.btn,
          ...(empty ? S.btnDisabled : {}),
          fontSize: 16,
        }}
        title="Reset to start"
        aria-label="Reset simulation"
      >
        ⟲
      </button>
    </div>
  );
});

SimulationPlayback.displayName = "SimulationPlayback";
export default SimulationPlayback;
