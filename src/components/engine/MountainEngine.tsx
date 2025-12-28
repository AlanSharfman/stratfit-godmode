// src/components/engine/MountainEngine.tsx
// STRATFIT — 2D Canvas Mountain Engine with Ghost Overlay Support

import { useRef, useEffect, useCallback } from "react";

type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface MountainEngineProps {
  dataPoints: number[];
  activeKPIIndex: number | null;
  scenario: ScenarioId;
  ghostBase?: number[];
  ghostUpside?: number[];
  ghostDownside?: number[];
}

const SCENARIO_THEMES: Record<ScenarioId, { fill: string; stroke: string; glow: string }> = {
  base: { fill: "rgba(34, 211, 238, 0.15)", stroke: "#22d3ee", glow: "rgba(34, 211, 238, 0.4)" },
  upside: { fill: "rgba(52, 211, 153, 0.15)", stroke: "#34d399", glow: "rgba(52, 211, 153, 0.4)" },
  downside: { fill: "rgba(251, 191, 36, 0.15)", stroke: "#fbbf24", glow: "rgba(251, 191, 36, 0.4)" },
  extreme: { fill: "rgba(248, 113, 113, 0.15)", stroke: "#f87171", glow: "rgba(248, 113, 113, 0.4)" },
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
  const rafRef = useRef<number | null>(null);
  const points01Ref = useRef<number[]>([]);

  // DEV warning for zero-height parent
  useEffect(() => {
    if (import.meta.env.DEV) {
      const parent = canvasRef.current?.parentElement;
      if (parent && parent.getBoundingClientRect().height === 0) {
        console.warn("[STRATFIT][MountainEngine] Canvas parent height is 0 — mountain will not render.");
      }
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const theme = SCENARIO_THEMES[scenario] || SCENARIO_THEMES.base;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Normalize data points to 0-1 range
    const maxVal = Math.max(...dataPoints, 1);
    points01Ref.current = dataPoints.map((v) => v / maxVal);

    const points = points01Ref.current;
    if (points.length < 2) return;

    const padding = 40;
    const graphHeight = height - padding * 2;
    const graphWidth = width - padding * 2;

    // Draw grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (graphHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Build path
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

    // Draw mountain fill
    const mainPath = buildPath(points);

    // --------------------------------------------------
    // GHOST OVERLAY: DOWNSIDE (stroke only, behind main)
    // --------------------------------------------------
    if (ghostDownside && ghostDownside.length === points.length) {
      const maxGhost = Math.max(...ghostDownside, 1);
      const g01 = ghostDownside.map((v) => v / maxGhost);
      const ghostPath = buildPath(g01);

      ctx.save();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.22; // subtle
      ctx.strokeStyle = "rgba(251, 191, 36, 0.9)"; // amber (downside)
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]); // ghost feel
      ctx.stroke(ghostPath);
      ctx.restore();
    }
    
    // Close path for fill
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

    // Draw main stroke with glow
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = theme.stroke;
    ctx.lineWidth = 2;
    ctx.stroke(mainPath);
    ctx.shadowBlur = 0;

    // Draw data points
    points.forEach((val, i) => {
      const x = padding + (graphWidth / (points.length - 1)) * i;
      const y = height - padding - val * graphHeight;

      ctx.beginPath();
      ctx.arc(x, y, activeKPIIndex === i ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = activeKPIIndex === i ? theme.stroke : "rgba(148, 163, 184, 0.6)";
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

    // Draw timeline ticks
    const numTicks = points.length;
    if (numTicks > 0) {
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

  }, [dataPoints, activeKPIIndex, scenario, ghostDownside]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        draw();
      }
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}

