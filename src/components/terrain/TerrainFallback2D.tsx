// src/components/terrain/TerrainFallback2D.tsx
// STRATFIT — 2.5D SVG Terrain Fallback
// Renders when WebGL is unavailable or context is lost.
// Clean topographic wireframe — no 3D dependency.

import React, { useMemo } from "react";

// ============================================================================
// WEBGL DETECTION
// ============================================================================

let _webglSupported: boolean | null = null;

export function isWebGLSupported(): boolean {
  if (_webglSupported !== null) return _webglSupported;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    _webglSupported = !!gl;
  } catch {
    _webglSupported = false;
  }
  return _webglSupported;
}

// ============================================================================
// PROPS
// ============================================================================

interface TerrainFallback2DProps {
  dataPoints?: number[];
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TerrainFallback2D({
  dataPoints = [0.5, 0.6, 0.75, 0.8, 0.7, 0.65, 0.85],
  className = "",
  style,
}: TerrainFallback2DProps) {
  const viewW = 400;
  const viewH = 200;
  const padX = 20;
  const padY = 30;

  // Generate terrain layers from data points
  const layers = useMemo(() => {
    const result: string[] = [];
    const numLayers = 5;

    for (let layer = 0; layer < numLayers; layer++) {
      const opacity = 1 - layer * 0.18;
      const yOffset = layer * 8;
      const amplitude = 1 - layer * 0.12;

      const pts: string[] = [];
      const count = dataPoints.length;

      for (let i = 0; i <= count + 1; i++) {
        const t = i / (count + 1);
        const x = padX + t * (viewW - 2 * padX);

        // Interpolate between data points with smoothing
        const idx = Math.min(count - 1, Math.floor(t * count));
        const frac = (t * count) - idx;
        const v0 = dataPoints[Math.max(0, idx)] ?? 0.5;
        const v1 = dataPoints[Math.min(count - 1, idx + 1)] ?? 0.5;
        const val = v0 + (v1 - v0) * frac;

        const baseHeight = val * amplitude * (viewH - 2 * padY) * 0.7;
        const y = viewH - padY - baseHeight - yOffset;
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }

      result.push(pts.join(" "));
    }

    return result;
  }, [dataPoints]);

  // Contour lines
  const contours = useMemo(() => {
    const lines: { y: number; opacity: number }[] = [];
    const numContours = 8;
    for (let i = 0; i < numContours; i++) {
      const y = padY + (i / numContours) * (viewH - 2 * padY);
      lines.push({ y, opacity: 0.06 + (i / numContours) * 0.04 });
    }
    return lines;
  }, []);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        borderRadius: 10,
        overflow: "hidden",
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="terrainFallbackGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Contour grid lines */}
        {contours.map((c, i) => (
          <line
            key={i}
            x1={padX}
            y1={c.y}
            x2={viewW - padX}
            y2={c.y}
            stroke="#22d3ee"
            strokeWidth="0.5"
            opacity={c.opacity}
          />
        ))}

        {/* Terrain layers (back to front) */}
        {layers.map((polyline, i) => (
          <React.Fragment key={i}>
            {/* Fill area */}
            <polygon
              points={`${padX},${viewH - padY} ${polyline} ${viewW - padX},${viewH - padY}`}
              fill="url(#terrainFallbackGrad)"
              opacity={0.3 - i * 0.05}
            />
            {/* Wireframe line */}
            <polyline
              points={polyline}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={i === 0 ? 1.5 : 0.8}
              opacity={0.5 - i * 0.08}
              strokeLinejoin="round"
            />
          </React.Fragment>
        ))}

        {/* Top ridge highlight */}
        {layers[0] && (
          <polyline
            points={layers[0]}
            fill="none"
            stroke="#67e8f9"
            strokeWidth="0.5"
            opacity="0.3"
            strokeLinejoin="round"
            strokeDasharray="4 4"
          />
        )}

        {/* Base line */}
        <line
          x1={padX}
          y1={viewH - padY}
          x2={viewW - padX}
          y2={viewH - padY}
          stroke="#22d3ee"
          strokeWidth="0.5"
          opacity="0.1"
        />

        {/* Corner label */}
        <text
          x={viewW - padX}
          y={padY - 8}
          textAnchor="end"
          fill="#22d3ee"
          fontSize="8"
          fontFamily="'Inter', monospace"
          letterSpacing="0.1em"
          opacity="0.3"
        >
          2.5D FALLBACK
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// WRAPPER: Renders 3D if WebGL is available, otherwise 2D fallback
// ============================================================================

interface TerrainWithFallbackProps {
  children: React.ReactNode; // The 3D ScenarioMountain
  dataPoints?: number[];
  onWebGLLost?: () => void;
}

export function TerrainWithFallback({
  children,
  dataPoints,
  onWebGLLost,
}: TerrainWithFallbackProps) {
  const [hasWebGL, setHasWebGL] = React.useState(() => isWebGLSupported());

  React.useEffect(() => {
    const handleContextLost = () => {
      setHasWebGL(false);
      onWebGLLost?.();
    };

    // Listen for WebGL context loss on all canvases
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((c) => c.addEventListener("webglcontextlost", handleContextLost));

    return () => {
      canvases.forEach((c) => c.removeEventListener("webglcontextlost", handleContextLost));
    };
  }, [onWebGLLost]);

  if (!hasWebGL) {
    return <TerrainFallback2D dataPoints={dataPoints} />;
  }

  return <>{children}</>;
}





