import { useEffect, useRef } from "react";
import { generateSplinePoints } from "./utils/splineMath";

interface MountainEngineProps {
  dataPoints: number[];
  activeKPIIndex: number | null;
  scenario: "base" | "upside" | "downside" | "extreme";
}

// Scenario color themes - FUTURISTIC NEON
const SCENARIO_THEMES = {
  base: {
    bg1: "#0a0a1a",
    bg2: "#0f1a2a",
    back: "rgba(34, 211, 238, 0.3)",
    mid: "rgba(34, 211, 238, 0.5)",
    front: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.8)",
    fill1: "rgba(34, 211, 238, 0.15)",
    fill2: "rgba(34, 211, 238, 0.05)",
    scan: "rgba(34, 211, 238, 0.03)",
  },
  upside: {
    bg1: "#0a1a0f",
    bg2: "#0f2a1a",
    back: "rgba(52, 211, 153, 0.3)",
    mid: "rgba(52, 211, 153, 0.5)",
    front: "#34d399",
    glow: "rgba(52, 211, 153, 0.8)",
    fill1: "rgba(52, 211, 153, 0.15)",
    fill2: "rgba(52, 211, 153, 0.05)",
    scan: "rgba(52, 211, 153, 0.03)",
  },
  downside: {
    bg1: "#1a1a0a",
    bg2: "#2a1f0f",
    back: "rgba(251, 191, 36, 0.3)",
    mid: "rgba(251, 191, 36, 0.5)",
    front: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.8)",
    fill1: "rgba(251, 191, 36, 0.15)",
    fill2: "rgba(251, 191, 36, 0.05)",
    scan: "rgba(251, 191, 36, 0.03)",
  },
  extreme: {
    bg1: "#1a0a1a",
    bg2: "#2a0f2a",
    back: "rgba(244, 114, 182, 0.3)",
    mid: "rgba(244, 114, 182, 0.5)",
    front: "#f472b6",
    glow: "rgba(244, 114, 182, 0.8)",
    fill1: "rgba(244, 114, 182, 0.2)",
    fill2: "rgba(244, 114, 182, 0.05)",
    scan: "rgba(244, 114, 182, 0.03)",
  },
};

export default function MountainEngine({
  dataPoints,
  activeKPIIndex,
  scenario,
}: MountainEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const _canvas = canvas as HTMLCanvasElement;
    const _ctx = ctx as CanvasRenderingContext2D;

    let frameId: number;
    let tick = 0;

    function resize() {
      const parent = _canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = window.devicePixelRatio || 1;

      _canvas.width = rect.width * dpr;
      _canvas.height = rect.height * dpr;

      _ctx.setTransform(1, 0, 0, 1, 0, 0);
      _ctx.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const parent = _canvas.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (!width || !height) {
        frameId = requestAnimationFrame(draw);
        return;
      }

      tick += 0.015;
      const theme = SCENARIO_THEMES[scenario];

      // ========== BACKGROUND ==========
      const bg = _ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, theme.bg1);
      bg.addColorStop(0.5, theme.bg2);
      bg.addColorStop(1, theme.bg1);
      _ctx.fillStyle = bg;
      _ctx.fillRect(0, 0, width, height);

      // ========== ANIMATED SCAN LINES ==========
      _ctx.strokeStyle = theme.scan;
      _ctx.lineWidth = 1;
      for (let i = 0; i < 25; i++) {
        const y = ((i * 18 + tick * 40) % height);
        _ctx.beginPath();
        _ctx.moveTo(0, y);
        _ctx.lineTo(width, y);
        _ctx.stroke();
      }

      // ========== GENERATE CURVES ==========
      const baseHeight = height * 0.65;
      const baseCurve = generateSplinePoints(dataPoints, width, baseHeight);
      if (!baseCurve.length) {
        frameId = requestAnimationFrame(draw);
        return;
      }

      // Parallax wave motion - back moves slow, front moves fast
      const waveBack = Math.sin(tick * 0.5) * 4;
      const waveMid = Math.sin(tick * 0.8) * 6;
      const waveFront = Math.sin(tick * 1.2) * 8;

      const curveBack = baseCurve.map((pt, i) => ({
        x: pt.x,
        y: pt.y + 45 + waveBack + Math.sin(tick * 0.4 + i * 0.5) * 3,
      }));

      const curveMid = baseCurve.map((pt, i) => ({
        x: pt.x,
        y: pt.y + 22 + waveMid + Math.sin(tick * 0.7 + i * 0.6) * 5,
      }));

      const curveFront = baseCurve.map((pt, i) => ({
        x: pt.x,
        y: pt.y + waveFront + Math.sin(tick * 1.0 + i * 0.7) * 6,
      }));

      // ========== GRADIENT FILL UNDER CURVE ==========
      const fillGrad = _ctx.createLinearGradient(0, height * 0.15, 0, height);
      fillGrad.addColorStop(0, theme.fill1);
      fillGrad.addColorStop(0.4, theme.fill2);
      fillGrad.addColorStop(1, "transparent");

      _ctx.beginPath();
      _ctx.moveTo(curveFront[0].x, height);
      curveFront.forEach((p) => _ctx.lineTo(p.x, p.y));
      _ctx.lineTo(curveFront[curveFront.length - 1].x, height);
      _ctx.closePath();
      _ctx.fillStyle = fillGrad;
      _ctx.fill();

      // ========== BACK LAYER ==========
      _ctx.shadowBlur = 6;
      _ctx.shadowColor = theme.glow;
      _ctx.strokeStyle = theme.back;
      _ctx.lineWidth = 1.5;
      _ctx.beginPath();
      curveBack.forEach((p, i) => (i === 0 ? _ctx.moveTo(p.x, p.y) : _ctx.lineTo(p.x, p.y)));
      _ctx.stroke();

      // ========== MID LAYER ==========
      _ctx.shadowBlur = 10;
      _ctx.shadowColor = theme.glow;
      _ctx.strokeStyle = theme.mid;
      _ctx.lineWidth = 2;
      _ctx.beginPath();
      curveMid.forEach((p, i) => (i === 0 ? _ctx.moveTo(p.x, p.y) : _ctx.lineTo(p.x, p.y)));
      _ctx.stroke();

      // ========== FRONT LAYER - HOT NEON ==========
      _ctx.shadowBlur = 25;
      _ctx.shadowColor = theme.front;
      _ctx.strokeStyle = theme.front;
      _ctx.lineWidth = 3;
      _ctx.beginPath();
      curveFront.forEach((p, i) => (i === 0 ? _ctx.moveTo(p.x, p.y) : _ctx.lineTo(p.x, p.y)));
      _ctx.stroke();

      // White-hot inner core
      _ctx.shadowBlur = 0;
      _ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      _ctx.lineWidth = 1;
      _ctx.beginPath();
      curveFront.forEach((p, i) => (i === 0 ? _ctx.moveTo(p.x, p.y) : _ctx.lineTo(p.x, p.y)));
      _ctx.stroke();

      // ========== PULSING DATA POINTS ==========
      const pulseSize = 3 + Math.sin(tick * 3) * 1.5;
      curveFront.forEach((p, i) => {
        const isActive = activeKPIIndex === i;
        const size = isActive ? pulseSize * 2.5 : pulseSize;

        // Outer glow
        _ctx.beginPath();
        _ctx.arc(p.x, p.y, size + 4, 0, Math.PI * 2);
        _ctx.fillStyle = isActive ? `${theme.front}40` : `${theme.front}20`;
        _ctx.fill();

        // Inner dot
        _ctx.beginPath();
        _ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        _ctx.fillStyle = isActive ? "#ffffff" : theme.front;
        _ctx.shadowBlur = isActive ? 20 : 10;
        _ctx.shadowColor = isActive ? "#ffffff" : theme.front;
        _ctx.fill();
        _ctx.shadowBlur = 0;
      });

      // ========== ACTIVE KPI HIGHLIGHT ==========
      if (activeKPIIndex !== null && activeKPIIndex >= 0 && activeKPIIndex < curveFront.length) {
        const point = curveFront[activeKPIIndex];

        // Radial pulse
        const pulseRadius = 30 + Math.sin(tick * 2) * 8;
        const radialGrad = _ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, pulseRadius);
        radialGrad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        radialGrad.addColorStop(0.3, `${theme.front}60`);
        radialGrad.addColorStop(1, "transparent");

        _ctx.beginPath();
        _ctx.arc(point.x, point.y, pulseRadius, 0, Math.PI * 2);
        _ctx.fillStyle = radialGrad;
        _ctx.fill();

        // Vertical guide line
        _ctx.strokeStyle = `${theme.front}40`;
        _ctx.lineWidth = 1;
        _ctx.setLineDash([4, 4]);
        _ctx.beginPath();
        _ctx.moveTo(point.x, point.y + 10);
        _ctx.lineTo(point.x, height - 25);
        _ctx.stroke();
        _ctx.setLineDash([]);
      }

      // ========== TIMELINE MARKERS ==========
      const timelineY = height - 15;
      const months = ["M1", "M2", "M3", "M4", "M5", "M6", "M7"];
      
      _ctx.font = "10px monospace";
      months.forEach((label, i) => {
        const x = (width / (months.length - 1)) * i;
        const isActive = activeKPIIndex === i;

        // Tick mark
        _ctx.strokeStyle = isActive ? theme.front : "rgba(148, 163, 184, 0.3)";
        _ctx.lineWidth = isActive ? 2 : 1;
        _ctx.beginPath();
        _ctx.moveTo(x, timelineY - 8);
        _ctx.lineTo(x, timelineY - 3);
        _ctx.stroke();

        // Label
        _ctx.fillStyle = isActive ? theme.front : "rgba(148, 163, 184, 0.5)";
        _ctx.fillText(label, x - 8, timelineY + 8);
      });

      // Timeline base line
      _ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      _ctx.lineWidth = 1;
      _ctx.beginPath();
      _ctx.moveTo(0, timelineY - 5);
      _ctx.lineTo(width, timelineY - 5);
      _ctx.stroke();

      frameId = requestAnimationFrame(draw);
    }

    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [dataPoints, activeKPIIndex, scenario]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}