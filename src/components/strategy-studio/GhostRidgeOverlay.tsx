// src/components/strategy-studio/GhostRidgeOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Ghost Ridge Preview Overlay
//
// Renders a subtle, semi-transparent ridge curve on top of the mountain stage
// during lever preview (drag). Shows the DELTA between committed and preview
// terrain without triggering heavy compute.
//
// Constraints:
// - Must not flicker
// - Must not cause FPS drops
// - Must not trigger re-render of the mountain canvas
// - Purely CSS/SVG overlay
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import styles from "./StrategyStudio.module.css";

interface GhostRidgeOverlayProps {
  /** Committed (current) data points, 0–1 normalized */
  committedPoints: number[];
  /** Preview (during drag) data points, 0–1 normalized */
  previewPoints: number[];
  /** Whether the overlay is active */
  active: boolean;
}

/**
 * Generate a smooth SVG path from normalized data points (0–1).
 * Uses cardinal spline interpolation for smooth curves.
 */
function pointsToSvgPath(
  points: number[],
  width: number,
  height: number,
  verticalCenter: number,
  amplitude: number,
): string {
  if (points.length < 2) return "";

  const coords = points.map((v, i) => ({
    x: (i / (points.length - 1)) * width,
    y: verticalCenter - (v - 0.5) * amplitude,
  }));

  // Build smooth bezier curve
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const GhostRidgeOverlay: React.FC<GhostRidgeOverlayProps> = memo(({
  committedPoints,
  previewPoints,
  active,
}) => {
  const SVG_W = 1000;
  const SVG_H = 400;
  const CENTER_Y = SVG_H * 0.5;
  const AMPLITUDE = SVG_H * 0.6;

  const committedPath = useMemo(
    () => pointsToSvgPath(committedPoints, SVG_W, SVG_H, CENTER_Y, AMPLITUDE),
    [committedPoints],
  );

  const previewPath = useMemo(
    () => pointsToSvgPath(previewPoints, SVG_W, SVG_H, CENTER_Y, AMPLITUDE),
    [previewPoints],
  );

  // Compute max delta for intensity scaling
  const maxDelta = useMemo(() => {
    let max = 0;
    for (let i = 0; i < committedPoints.length; i++) {
      max = Math.max(max, Math.abs((previewPoints[i] ?? 0) - (committedPoints[i] ?? 0)));
    }
    return max;
  }, [committedPoints, previewPoints]);

  if (!active || maxDelta < 0.001) return null;

  // Scale opacity by delta magnitude (subtle for small changes, clearer for large)
  const opacity = Math.min(0.65, 0.15 + maxDelta * 2.5);

  return (
    <div className={styles.ghostOverlay} data-active={active}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="none"
        className={styles.ghostSvg}
      >
        <defs>
          {/* Ghost ridge gradient */}
          <linearGradient id="ghostGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0, 224, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(0, 224, 255, 0)" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="ghostGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ghost preview ridge line */}
        <path
          d={previewPath}
          fill="none"
          stroke="rgba(0, 224, 255, 0.5)"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity={opacity}
          filter="url(#ghostGlow)"
          className={styles.ghostPath}
        />

        {/* Committed ridge line (subtle reference) */}
        <path
          d={committedPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
          opacity={0.4}
        />
      </svg>

      {/* PREVIEW badge */}
      <div className={styles.ghostBadge}>
        <span className={styles.ghostBadgeDot} />
        PREVIEW
      </div>
    </div>
  );
});

GhostRidgeOverlay.displayName = "GhostRidgeOverlay";
export default GhostRidgeOverlay;



