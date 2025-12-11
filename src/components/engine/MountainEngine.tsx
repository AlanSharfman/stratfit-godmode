import { useEffect, useRef } from "react";
import { generateSplinePoints } from "./utils/splineMath";
import { getScenarioColor } from "./utils/scenarioColors";

interface MountainEngineProps {
  dataPoints: number[];
  activeKPIIndex: number | null;
  scenario: "base" | "upside" | "downside" | "extreme";
}

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

      // reset transform each time before scaling
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

      tick += 0.01;

      // ---------- BACKGROUND ----------
      const h = height;
      const bgGradient = _ctx.createLinearGradient(0, 0, 0, h);
      bgGradient.addColorStop(0, "#020617");
      bgGradient.addColorStop(0.4, "#020617");
      bgGradient.addColorStop(1, "#020617");
      _ctx.fillStyle = bgGradient;
      _ctx.fillRect(0, 0, width, h);

      // subtle horizontal grid lines
      _ctx.strokeStyle = "rgba(148,163,184,0.12)";
      _ctx.lineWidth = 1;
      const gridCount = 5;
      for (let i = 1; i <= gridCount; i++) {
        const y = (h * i) / (gridCount + 1);
        _ctx.beginPath();
        _ctx.moveTo(0, y);
        _ctx.lineTo(width, y);
        _ctx.stroke();
      }

      const { glow, main } = getScenarioColor(scenario);

      // ---------- CURVE POINTS ----------
      const baseHeight = h * 0.6; // keep mountain in upper area
      const baseCurve = generateSplinePoints(dataPoints, width, baseHeight);
      if (!baseCurve.length) {
        frameId = requestAnimationFrame(draw);
        return;
      }

      const waveAmp = 6;
      const waveFreq = 0.6;

      const curveFront = baseCurve.map((pt, i) => ({
        x: pt.x,
        y: pt.y + Math.sin(tick * 1.2 + i * waveFreq) * waveAmp * 0.5,
      }));

      const curveMid = baseCurve.map((pt, i) => ({
        x: pt.x,
        y: pt.y + 18 + Math.sin(tick * 0.9 + i * waveFreq * 0.8) * waveAmp,
      }));

      const curveBack = baseCurve.map((pt, i) => ({
        x: pt.x,
        y: pt.y + 32 + Math.sin(tick * 0.6 + i * waveFreq * 0.6) * waveAmp,
      }));

      // ---------- FILL UNDER FRONT CURVE ----------
      const baseLineY = h * 0.85;

      const fillGradient = _ctx.createLinearGradient(0, h * 0.2, 0, h);
      fillGradient.addColorStop(0, "rgba(34,211,238,0.12)");
      fillGradient.addColorStop(0.5, "rgba(15,23,42,0.7)");
      fillGradient.addColorStop(1, "rgba(15,23,42,1)");

      _ctx.beginPath();
      _ctx.moveTo(curveFront[0].x, baseLineY);
      for (let i = 0; i < curveFront.length; i++) {
        _ctx.lineTo(curveFront[i].x, curveFront[i].y);
      }
      _ctx.lineTo(curveFront[curveFront.length - 1].x, baseLineY);
      _ctx.closePath();
      _ctx.fillStyle = fillGradient;
      _ctx.fill();

      // ---------- BACK LAYER ----------
      _ctx.lineWidth = 1.5;
      _ctx.strokeStyle = "rgba(15,118,110,0.45)";
      _ctx.shadowBlur = 0;
      _ctx.beginPath();
      _ctx.moveTo(curveBack[0].x, curveBack[0].y);
      for (let i = 1; i < curveBack.length; i++) {
        _ctx.lineTo(curveBack[i].x, curveBack[i].y);
      }
      _ctx.stroke();

      // ---------- MID LAYER ----------
      _ctx.lineWidth = 2;
      _ctx.strokeStyle = "rgba(45,212,191,0.55)";
      _ctx.shadowBlur = 4;
      _ctx.shadowColor = "rgba(45,212,191,0.5)";
      _ctx.beginPath();
      _ctx.moveTo(curveMid[0].x, curveMid[0].y);
      for (let i = 1; i < curveMid.length; i++) {
        _ctx.lineTo(curveMid[i].x, curveMid[i].y);
      }
      _ctx.stroke();

      // ---------- FRONT NEON LINE ----------
      _ctx.lineWidth = 3;
      _ctx.strokeStyle = main;
      _ctx.shadowBlur = 16;
      _ctx.shadowColor = glow;
      _ctx.beginPath();
      _ctx.moveTo(curveFront[0].x, curveFront[0].y);
      for (let i = 1; i < curveFront.length; i++) {
        _ctx.lineTo(curveFront[i].x, curveFront[i].y);
      }
      _ctx.stroke();

      // ---------- ACTIVE KPI HIGHLIGHT ----------
      if (
        activeKPIIndex !== null &&
        activeKPIIndex >= 0 &&
        activeKPIIndex < curveFront.length
      ) {
        const point = curveFront[activeKPIIndex];

        const radialGradient = _ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          26
        );
        radialGradient.addColorStop(0, "rgba(255,255,255,0.95)");
        radialGradient.addColorStop(0.4, "rgba(45,212,191,0.85)");
        radialGradient.addColorStop(1, "rgba(45,212,191,0)");

        _ctx.fillStyle = radialGradient;
        _ctx.beginPath();
        _ctx.arc(point.x, point.y, 26, 0, Math.PI * 2);
        _ctx.fill();

        _ctx.fillStyle = "#ffffff";
        _ctx.shadowBlur = 8;
        _ctx.shadowColor = "#ffffff";
        _ctx.beginPath();
        _ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        _ctx.fill();
        _ctx.shadowBlur = 0;
      }

      // ---------- TIMELINE BASE LINE ----------
      const axisY = baseLineY;
      _ctx.shadowBlur = 0;
      _ctx.strokeStyle = "rgba(148,163,184,0.35)";
      _ctx.lineWidth = 1;
      _ctx.beginPath();
      _ctx.moveTo(0, axisY);
      _ctx.lineTo(width, axisY);
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
