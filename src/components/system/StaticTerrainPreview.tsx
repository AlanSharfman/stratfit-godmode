// src/components/system/StaticTerrainPreview.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Static 2.5D Terrain Preview (SVG Wire Mesh)
// Cyan wireframe, no glow, no animation, no WebGL.
// Institutional. Blueprint aesthetic. Data-driven peaks and dips.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";

interface StaticTerrainPreviewProps {
  /** Normalized data points (0–1 range) driving terrain elevation */
  dataPoints?: number[];
  /** Fixed height in px (280–320) */
  height?: number;
}

const SVG_W = 560;
const SVG_H = 280;
const COLS = 28;
const ROWS = 14;
const CELL_W = SVG_W / COLS;
const CELL_H = SVG_H / ROWS;
const MAX_ELEVATION = 50; // max vertical displacement in px

/**
 * Generate elevation at a grid point, influenced by data points.
 * Creates organic topographic relief that responds to baseline signals.
 */
function getElevation(
  col: number,
  row: number,
  data: number[]
): number {
  const nx = col / COLS;
  const ny = row / ROWS;

  // Base terrain: gentle sin-wave landscape
  let h =
    Math.sin(nx * Math.PI * 2.2 + 0.3) * 0.3 +
    Math.sin(ny * Math.PI * 1.8 + 0.7) * 0.2 +
    Math.sin((nx + ny) * Math.PI * 3.1) * 0.15;

  // Data-driven peaks: each data point creates a ridge region
  if (data.length > 0) {
    for (let i = 0; i < data.length; i++) {
      const px = ((i + 0.5) / data.length); // horizontal center of influence
      const dx = nx - px;
      const dy = ny - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy * 2.5);
      const influence = Math.max(0, 1 - dist * 2.8);
      h += data[i] * influence * 0.8;
    }
  }

  return h * MAX_ELEVATION;
}

/**
 * Isometric projection: convert grid (col, row, elevation) → SVG (x, y).
 * Tilted ~30° for 2.5D depth effect.
 */
function project(col: number, row: number, elev: number): [number, number] {
  const baseX = col * CELL_W;
  const baseY = row * CELL_H;

  // Isometric tilt
  const isoX = baseX + (row - ROWS / 2) * 4;
  const isoY = baseY * 0.55 + (col - COLS / 2) * 1.2 + SVG_H * 0.3 - elev;

  return [isoX, isoY];
}

export const StaticTerrainPreview: React.FC<StaticTerrainPreviewProps> = React.memo(
  ({ dataPoints = [], height = 300 }) => {
    const lines = useMemo(() => {
      const data = dataPoints.length > 0 ? dataPoints : [0.3, 0.5, 0.4, 0.6, 0.35, 0.45, 0.5];
      const horizontalLines: string[] = [];
      const verticalLines: string[] = [];

      // Build elevation grid
      const grid: [number, number][][] = [];
      for (let r = 0; r <= ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c <= COLS; c++) {
          const elev = getElevation(c, r, data);
          grid[r][c] = project(c, r, elev);
        }
      }

      // Horizontal wire lines (front-to-back)
      for (let r = 0; r <= ROWS; r++) {
        let d = `M ${grid[r][0][0].toFixed(1)} ${grid[r][0][1].toFixed(1)}`;
        for (let c = 1; c <= COLS; c++) {
          d += ` L ${grid[r][c][0].toFixed(1)} ${grid[r][c][1].toFixed(1)}`;
        }
        horizontalLines.push(d);
      }

      // Vertical wire lines (left-to-right)
      for (let c = 0; c <= COLS; c++) {
        let d = `M ${grid[0][c][0].toFixed(1)} ${grid[0][c][1].toFixed(1)}`;
        for (let r = 1; r <= ROWS; r++) {
          d += ` L ${grid[r][c][0].toFixed(1)} ${grid[r][c][1].toFixed(1)}`;
        }
        verticalLines.push(d);
      }

      return { horizontalLines, verticalLines };
    }, [dataPoints]);

    return (
      <div
        style={{
          width: "100%",
          height,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        >
          {/* Horizontal wireframe lines */}
          {lines.horizontalLines.map((d, i) => (
            <path
              key={`h${i}`}
              d={d}
              fill="none"
              stroke="#00E0FF"
              strokeWidth={0.8}
              strokeOpacity={0.6}
            />
          ))}
          {/* Vertical wireframe lines — slightly thinner for depth */}
          {lines.verticalLines.map((d, i) => (
            <path
              key={`v${i}`}
              d={d}
              fill="none"
              stroke="#00E0FF"
              strokeWidth={0.5}
              strokeOpacity={0.4}
            />
          ))}
        </svg>
      </div>
    );
  }
);

StaticTerrainPreview.displayName = "StaticTerrainPreview";





