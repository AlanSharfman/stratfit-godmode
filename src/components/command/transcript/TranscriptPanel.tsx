// src/components/command/transcript/TranscriptPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Transcript Panel (Command Centre Intelligence Theatre)
//
// Renders the director script transcript with:
//   - Smooth auto-scroll to active line
//   - Cyan glow on the current beat line
//   - Muted rendering for past and future lines
//   - Anchor IDs for laser pointer origin mapping
//
// ReadOnly presentation — no data computation.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useRef } from "react";
import type { Beat } from "../director/DirectorScript";
import type { DirectorStatus } from "../director/useDirectorMode";

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, sans-serif";
const CYAN = "#22d3ee";

const S: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "8px 0",
    scrollBehavior: "smooth",
  },
  header: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(148, 180, 214, 0.5)",
    fontFamily: FONT,
    padding: "0 16px 8px",
    flexShrink: 0,
  },
  line: {
    padding: "10px 16px",
    fontSize: 12,
    lineHeight: 1.65,
    fontFamily: FONT,
    color: "rgba(226, 240, 255, 0.35)",
    borderLeft: "2px solid transparent",
    transition: "all 300ms ease",
  },
  lineActive: {
    padding: "10px 16px",
    fontSize: 12,
    lineHeight: 1.65,
    fontFamily: FONT,
    color: "rgba(226, 240, 255, 0.95)",
    borderLeft: `2px solid ${CYAN}`,
    background: "rgba(34, 211, 238, 0.06)",
    boxShadow: `inset 3px 0 12px -4px rgba(34, 211, 238, 0.15)`,
    transition: "all 300ms ease",
  },
  linePlayed: {
    padding: "10px 16px",
    fontSize: 12,
    lineHeight: 1.65,
    fontFamily: FONT,
    color: "rgba(226, 240, 255, 0.55)",
    borderLeft: "2px solid rgba(34, 211, 238, 0.2)",
    transition: "all 300ms ease",
  },
  beatLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: CYAN,
    marginBottom: 4,
    display: "block",
    opacity: 0.7,
  },
  idle: {
    padding: "24px 16px",
    textAlign: "center" as const,
    fontSize: 12,
    color: "rgba(148, 180, 214, 0.4)",
    fontFamily: FONT,
    fontStyle: "italic" as const,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface TranscriptPanelProps {
  /** All beats in the script */
  beats: Beat[];
  /** Index of the currently active beat */
  activeBeatIndex: number;
  /** Director status */
  status: DirectorStatus;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = memo(
  ({ beats, activeBeatIndex, status }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active line
    useEffect(() => {
      if (activeLineRef.current && containerRef.current) {
        activeLineRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, [activeBeatIndex]);

    if (status === "idle") {
      return (
        <div style={S.container}>
          <div style={S.header}>Transcript</div>
          <div style={S.idle}>
            Start the Investor Briefing to begin the narrated walkthrough.
          </div>
        </div>
      );
    }

    return (
      <div ref={containerRef} style={S.container}>
        <div style={S.header}>Transcript</div>
        {beats.map((beat, i) => {
          const isActive = i === activeBeatIndex && status !== "finished";
          const isPlayed = i < activeBeatIndex || status === "finished";

          const lineStyle = isActive
            ? S.lineActive
            : isPlayed
              ? S.linePlayed
              : S.line;

          return (
            <div
              key={beat.id}
              id={`transcript-${beat.id}`}
              ref={isActive ? activeLineRef : undefined}
              style={lineStyle}
            >
              <span style={S.beatLabel}>{beat.title}</span>
              {beat.transcriptLine}
            </div>
          );
        })}
      </div>
    );
  },
);

TranscriptPanel.displayName = "TranscriptPanel";
export default TranscriptPanel;
