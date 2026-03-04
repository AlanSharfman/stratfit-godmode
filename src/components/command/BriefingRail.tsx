// src/components/command/BriefingRail.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Briefing Rail (Command Centre Intelligence Theatre)
//
// Right-column panel containing:
//   1. Director playback controls (play / pause / stop)
//   2. Beat timeline progress bar
//   3. Transcript panel (auto-scrolling)
//   4. Legal disclaimer footer
//
// ReadOnly presentation — no data computation.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";
import type { Beat } from "./director/DirectorScript";
import type { DirectorStatus } from "./director/useDirectorMode";
import TranscriptPanel from "./transcript/TranscriptPanel";
import type { CommandBriefing } from "../../core/command/generateCommandBriefing";
import CommandBriefingPanel from "./CommandBriefingPanel";

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, sans-serif";
const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const CYAN = "#22d3ee";

const S: Record<string, React.CSSProperties> = {
  rail: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "rgba(6, 12, 20, 0.85)",
    borderLeft: "1px solid rgba(182, 228, 255, 0.08)",
    backdropFilter: "blur(12px)",
    overflow: "hidden",
  },
  header: {
    padding: "14px 16px 10px",
    borderBottom: "1px solid rgba(182, 228, 255, 0.06)",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: CYAN,
    fontFamily: FONT,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderBottom: "1px solid rgba(182, 228, 255, 0.06)",
    flexShrink: 0,
  },
  controlBtn: {
    padding: "6px 14px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    fontFamily: FONT,
    border: "1px solid rgba(34, 211, 238, 0.25)",
    borderRadius: 4,
    background: "rgba(34, 211, 238, 0.08)",
    color: CYAN,
    cursor: "pointer",
    transition: "background 200ms ease",
  },
  controlBtnActive: {
    padding: "6px 14px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    fontFamily: FONT,
    border: "1px solid rgba(34, 211, 238, 0.5)",
    borderRadius: 4,
    background: "rgba(34, 211, 238, 0.2)",
    color: "#fff",
    cursor: "pointer",
    transition: "background 200ms ease",
  },
  stopBtn: {
    padding: "6px 14px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    fontFamily: FONT,
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: 4,
    background: "rgba(239, 68, 68, 0.08)",
    color: "rgba(239, 68, 68, 0.85)",
    cursor: "pointer",
    transition: "background 200ms ease",
  },
  progressContainer: {
    padding: "0 16px",
    flexShrink: 0,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    background: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    background: `linear-gradient(90deg, ${CYAN}, #67e8f9)`,
    transition: "width 100ms linear",
  },
  beatInfo: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 16px 8px",
    fontSize: 9,
    fontFamily: MONO,
    color: "rgba(148, 180, 214, 0.45)",
    flexShrink: 0,
  },
  transcriptArea: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  disclaimer: {
    padding: "10px 16px",
    borderTop: "1px solid rgba(182, 228, 255, 0.06)",
    fontSize: 9,
    lineHeight: 1.5,
    color: "rgba(148, 180, 214, 0.35)",
    fontFamily: FONT,
    flexShrink: 0,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function fmtTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface BriefingRailProps {
  /** Full beat script */
  beats: Beat[];
  /** Current beat index */
  activeBeatIndex: number;
  /** Director status */
  status: DirectorStatus;
  /** Progress within current beat (0..1) */
  beatProgress: number;
  /** Total elapsed across script (ms) */
  totalElapsed: number;
  /** Total script duration (ms) */
  totalDuration: number;
  /** Controls */
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  /** Data-driven command briefing (optional — falls back to TranscriptPanel) */
  briefing?: CommandBriefing | null;
  /** Callback with active transcript line Y position for laser anchor overlay */
  onAnchorY?: (y: number | null) => void;
  /** Ref to the TheatreLayout container (for relative positioning) */
  theatreRef?: React.RefObject<HTMLDivElement | null>;
}

const BriefingRail: React.FC<BriefingRailProps> = memo(
  ({
    beats,
    activeBeatIndex,
    status,
    beatProgress: _beatProgress,
    totalElapsed,
    totalDuration,
    onPlay,
    onPause,
    onStop,
    briefing,
    onAnchorY,
    theatreRef,
  }) => {
    const overallProgress =
      totalDuration > 0 ? Math.min(1, totalElapsed / totalDuration) : 0;

    const isPlaying = status === "playing";
    const isIdle = status === "idle";

    return (
      <div style={S.rail}>
        {/* ── Header ── */}
        <div style={S.header}>
          <span style={S.headerTitle}>◆ Intelligence Briefing</span>
        </div>

        {/* ── Video Panel Entry ── */}
        <div
          style={{
            padding: "8px 16px",
            borderBottom: "1px solid rgba(182, 228, 255, 0.06)",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              fontFamily: FONT,
              border: "1px solid rgba(168, 85, 247, 0.25)",
              borderRadius: 6,
              background: "rgba(168, 85, 247, 0.08)",
              color: "rgba(168, 85, 247, 0.85)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "background 200ms ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(168, 85, 247, 0.16)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(168, 85, 247, 0.08)")
            }
          >
            ▶ Watch Introduction
          </button>
        </div>

        {/* ── Playback Controls ── */}
        <div style={S.controls}>
          {isPlaying ? (
            <button
              type="button"
              onClick={onPause}
              style={S.controlBtnActive}
            >
              ❚❚ Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlay}
              style={S.controlBtn}
            >
              {status === "finished" ? "↻ Replay" : "▶ Play"}
            </button>
          )}
          {!isIdle && (
            <button
              type="button"
              onClick={onStop}
              style={S.stopBtn}
            >
              ■ Stop
            </button>
          )}
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              fontFamily: MONO,
              color: "rgba(148,180,214,0.5)",
            }}
          >
            {status === "idle"
              ? "Ready"
              : status === "finished"
                ? "Complete"
                : `Beat ${activeBeatIndex + 1}/${beats.length}`}
          </span>
        </div>

        {/* ── Progress Bar ── */}
        <div style={S.progressContainer}>
          <div style={S.progressBar}>
            <div
              style={{
                ...S.progressFill,
                width: `${(overallProgress * 100).toFixed(1)}%`,
              }}
            />
          </div>
        </div>
        <div style={S.beatInfo}>
          <span>{fmtTime(totalElapsed)}</span>
          <span>{fmtTime(totalDuration)}</span>
        </div>

        {/* ── Briefing Content ── */}
        <div style={S.transcriptArea}>
          {briefing ? (
            <CommandBriefingPanel
              briefing={briefing}
              activeBeatIdx={activeBeatIndex}
              isDirectorPlaying={isPlaying}
            />
          ) : (
            <TranscriptPanel
              beats={beats}
              activeBeatIndex={activeBeatIndex}
              status={status}
              onAnchorY={onAnchorY}
              theatreRef={theatreRef}
            />
          )}
        </div>

        {/* ── Legal Disclaimer ── */}
        <div style={S.disclaimer}>
          This briefing is model-derived and probabilistic. Outputs
          represent scenario analysis, not forecasts. No recommendation
          or guarantee of future performance is expressed or implied.
          All figures are simulation estimates subject to the assumptions
          provided.
        </div>
      </div>
    );
  },
);

BriefingRail.displayName = "BriefingRail";
export default BriefingRail;
