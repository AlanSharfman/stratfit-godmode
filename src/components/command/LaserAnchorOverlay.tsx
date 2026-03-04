// src/components/command/LaserAnchorOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Laser Anchor Overlay (Command Centre Intelligence Theatre)
//
// Renders a visual laser line from the active transcript line (right rail)
// toward the terrain viewport (left column). Creates the visual effect of
// information flowing from the briefing rail to the terrain surface.
//
// Positioned absolutely within TheatreLayout. Uses CSS gradients + glow
// for the laser effect. No R3F — pure DOM overlay.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useRef, useState } from "react";

const CYAN = "#22d3ee";
const FADE_DURATION = 400;

interface LaserAnchorOverlayProps {
  /** Y position (px) of the active transcript line relative to TheatreLayout */
  anchorY: number | null;
  /** Whether the director is actively playing (shows laser only when active) */
  active: boolean;
  /** Whether a laser target exists (some beats have no target) */
  hasTarget: boolean;
}

const LaserAnchorOverlay: React.FC<LaserAnchorOverlayProps> = memo(
  ({ anchorY, active, hasTarget }) => {
    const [opacity, setOpacity] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (active && hasTarget && anchorY != null && anchorY > 0) {
        timerRef.current = setTimeout(() => setOpacity(1), 60);
      } else {
        setOpacity(0);
      }

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [active, hasTarget, anchorY]);

    if (anchorY == null || anchorY <= 0) return null;

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          overflow: "hidden",
          opacity,
          transition: `opacity ${FADE_DURATION}ms ease`,
        }}
      >
        {/* Laser line: horizontal from ~60% (rail edge) to ~30% (terrain centre) */}
        <div
          style={{
            position: "absolute",
            top: anchorY - 1,
            left: "30%",
            width: "35%",
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${CYAN}55 30%, ${CYAN} 100%)`,
            borderRadius: 1,
            boxShadow: `0 0 12px ${CYAN}40, 0 0 4px ${CYAN}60`,
            transition: "top 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Glow dot at rail junction */}
        <div
          style={{
            position: "absolute",
            top: anchorY - 4,
            left: "calc(65% - 4px)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: CYAN,
            boxShadow: `0 0 16px ${CYAN}80, 0 0 6px ${CYAN}`,
            transition: "top 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Glow dot at terrain endpoint */}
        <div
          style={{
            position: "absolute",
            top: anchorY - 3,
            left: "30%",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: `${CYAN}aa`,
            boxShadow: `0 0 10px ${CYAN}60`,
            transition: "top 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    );
  },
);

LaserAnchorOverlay.displayName = "LaserAnchorOverlay";
export default LaserAnchorOverlay;
