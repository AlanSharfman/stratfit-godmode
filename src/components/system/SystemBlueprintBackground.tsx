// src/components/system/SystemBlueprintBackground.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — System Blueprint Background
// Full-page fixed background: deep charcoal gradient + subtle grid + contour SVG
// Pure CSS + SVG. No WebGL. No animation. Institutional.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";

const GRID_SIZE = 40;
const GRID_COUNT_X = 50;
const GRID_COUNT_Y = 35;
const SVG_W = GRID_SIZE * GRID_COUNT_X;
const SVG_H = GRID_SIZE * GRID_COUNT_Y;

/**
 * Generates faint contour-style SVG path data.
 * Produces 5 organic topographic contour lines.
 */
function buildContourPaths(): string[] {
  const paths: string[] = [];
  const cx = SVG_W / 2;
  const cy = SVG_H / 2;

  for (let i = 0; i < 5; i++) {
    const baseRadius = 120 + i * 110;
    const pts: [number, number][] = [];
    const steps = 72;

    for (let s = 0; s <= steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      // Organic deformation using sin harmonics
      const r =
        baseRadius +
        Math.sin(angle * 3 + i * 1.2) * (20 + i * 8) +
        Math.cos(angle * 5 + i * 0.7) * (12 + i * 5) +
        Math.sin(angle * 7 + i * 2.1) * (8 + i * 3);
      pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }

    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let j = 1; j < pts.length; j++) {
      d += ` L ${pts[j][0].toFixed(1)} ${pts[j][1].toFixed(1)}`;
    }
    d += " Z";
    paths.push(d);
  }

  return paths;
}

const contourPaths = buildContourPaths();

export const SystemBlueprintBackground: React.FC = React.memo(() => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "linear-gradient(180deg, #0E1116 0%, #11161D 100%)",
      }}
    >
      {/* Grid + Contour SVG overlay */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.08,
        }}
      >
        {/* Subtle grid lines — vertical */}
        {Array.from({ length: GRID_COUNT_X + 1 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * GRID_SIZE}
            y1={0}
            x2={i * GRID_SIZE}
            y2={SVG_H}
            stroke="#00E0FF"
            strokeWidth={0.5}
          />
        ))}
        {/* Subtle grid lines — horizontal */}
        {Array.from({ length: GRID_COUNT_Y + 1 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * GRID_SIZE}
            x2={SVG_W}
            y2={i * GRID_SIZE}
            stroke="#00E0FF"
            strokeWidth={0.5}
          />
        ))}
        {/* Contour lines — topographic, organic */}
        {contourPaths.map((d, i) => (
          <path
            key={`c${i}`}
            d={d}
            fill="none"
            stroke="#00E0FF"
            strokeWidth={0.8}
            opacity={0.6 - i * 0.08}
          />
        ))}
      </svg>
    </div>
  );
});

SystemBlueprintBackground.displayName = "SystemBlueprintBackground";





