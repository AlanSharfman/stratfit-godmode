// src/components/engine/MountainEngine.tsx
// STRATFIT — 2D Canvas Mountain Engine (Performance Hardened: single RAF + dirty flag)

import { useRef, useEffect, useCallback } from "react";

type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface MountainEngineProps {
  dataPoints: number[];
  activeKPIIndex: number | null;
  scenario: ScenarioId;

  // Ghost overlays (optional)
  ghostBase?: number[];
  ghostUpside?: number[];
  ghostDownside?: number[];
}

const SCENARIO_THEMES: Record<
  ScenarioId,
  { fill: string; stroke: string; glow: string }
> = {
  base: {
    fill: "rgba(34, 211, 238, 0.15)",
    stroke: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.4)",
  },
  upside: {
    fill: "rgba(52, 211, 153, 0.15)",
    stroke: "#34d399",
    glow: "rgba(52, 211, 153, 0.4)",
  },
  downside: {
    fill: "rgba(251, 191, 36, 0.15)",
    stroke: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.4)",
  },
  extreme: {
    fill: "rgba(248, 113, 113, 0.15)",
    stroke: "#f87171",
    glow: "rgba(248, 113, 113, 0.4)",
  },
};

export default function MountainEngine({
  dataPoints,
  activeKPIIndex,
  scenario,
  ghostBase,
  ghostUpside,
  ghostDownside,
}: MountainEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // RAF loop refs
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const dirtyRef = useRef(true);

  // Cached size (avoid repeated getBoundingClientRect)
  const sizeRef = useRef({ w: 0, h: 0 });

  // Normalize cache
  const points01Ref = useRef<number[]>([]);

  // DEV warning for zero-height parent
  useEffect(() => {
    if (import.meta.env.DEV) {
      const parent = canvasRef.current?.parentElement;
      if (parent && parent.getBoundingClientRect().height === 0) {
        console.warn(
          "[STRATFIT][MountainEngine] Canvas parent height is 0 — mountain will not render."
        );
      }
    }
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    if (width === 0 || height === 0) return;

    // If not dirty, skip drawing (cheap idle frames)
    if (!dirtyRef.current) return;
    dirtyRef.current = false;

    const theme = SCENARIO_THEMES[scenario] || SCENARIO_THEMES.base;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Normalize data points to 0-1 range (guard for empty)
    const safe = dataPoints && dataPoints.length ? dataPoints : [0, 0];
    const maxVal = Math.max(...safe, 1);
    points01Ref.current = safe.map((v) => v / maxVal);

    const points = points01Ref.current;
    if (points.length < 2) return;

    const padding = 40;
    const graphHeight = height - padding * 2;
    const graphWidth = width - padding * 2;

    // Grid lines (fixed cost)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.10)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (graphHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Path builder
    const buildPath = (pts: number[]) => {
      const path = new Path2D();
      pts.forEach((val, i) => {
        const x = padding + (graphWidth / (pts.length - 1)) * i;
        const y = height - padding - val * graphHeight;
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      });
      return path;
    };

    // Fill path
    const fillPath = new Path2D();
    points.forEach((val, i) => {
      const x = padding + (graphWidth / (points.length - 1)) * i;
      const y = height - padding - val * graphHeight;
      if (i === 0) fillPath.moveTo(x, y);
      else fillPath.lineTo(x, y);
    });
    fillPath.lineTo(width - padding, height - padding);
    fillPath.lineTo(padding, height - padding);
    fillPath.closePath();

    // Fill gradient
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, theme.fill);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fill(fillPath);

    // Main stroke with glow
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = theme.stroke;
    ctx.lineWidth = 2;
    ctx.stroke(buildPath(points));
    ctx.shadowBlur = 0;

    // Data points
    points.forEach((val, i) => {
      const x = padding + (graphWidth / (points.length - 1)) * i;
      const y = height - padding - val * graphHeight;

      ctx.beginPath();
      ctx.arc(x, y, activeKPIIndex === i ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle =
        activeKPIIndex === i ? theme.stroke : "rgba(148, 163, 184, 0.6)";
      ctx.fill();

      if (activeKPIIndex === i) {
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = theme.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // Timeline ticks
    const numTicks = points.length;
    if (numTicks > 1) {
      const tickY = height - 15;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, tickY - 5);
      ctx.lineTo(width - padding, tickY - 5);
      ctx.stroke();

      for (let i = 0; i < numTicks; i++) {
        const x = padding + (graphWidth / (numTicks - 1)) * i;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, tickY - 8);
        ctx.lineTo(x, tickY - 3);
        ctx.stroke();
      }
    }

    // NOTE: Ghost arrays are accepted but not drawn here (kept for future).
    // ghostBase / ghostUpside / ghostDownside
    void ghostBase;
    void ghostUpside;
    void ghostDownside;
  }, [dataPoints, activeKPIIndex, scenario, ghostBase, ghostUpside, ghostDownside]);

  // Resize handler: update canvas size + mark dirty (DO NOT draw here)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const applySize = () => {
      const rect = parent.getBoundingClientRect();
      const w = Math.max(0, Math.floor(rect.width));
      const h = Math.max(0, Math.floor(rect.height));

      if (w === sizeRef.current.w && h === sizeRef.current.h) return;

      sizeRef.current = { w, h };
      canvas.width = w;
      canvas.height = h;

      dirtyRef.current = true;
    };

    // Initial
    applySize();

    // Observe parent size changes (more reliable than window resize alone)
    const ro = new ResizeObserver(() => {
      applySize();
    });
    ro.observe(parent);

    // Window resize as backup
    const onWin = () => applySize();
    window.addEventListener("resize", onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, []);

  // Any prop change that affects drawing => mark dirty
  useEffect(() => {
    dirtyRef.current = true;
  }, [dataPoints, activeKPIIndex, scenario]);

  // Single RAF loop (always running while mounted; draws only when dirty)
  useEffect(() => {
    runningRef.current = true;

    const tick = () => {
      if (!runningRef.current) return;
      drawFrame();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [drawFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}
