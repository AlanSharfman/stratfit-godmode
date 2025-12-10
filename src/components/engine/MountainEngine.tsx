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

    // --------------------------------------------------
    // ❗ FIX: Tell TS these are definitely non-null now
    // --------------------------------------------------
    const _canvas = canvas as HTMLCanvasElement;
    const _ctx = ctx as CanvasRenderingContext2D;

    let frame = 0;

    // --------------------------------------------------
    // Resize handler (high-res scaled canvas)
    // --------------------------------------------------
    function resize() {
      const parent = _canvas.parentElement;
      if (!parent) return;

      _canvas.width = parent.clientWidth * 2;   // 2x scaling for retina
      _canvas.height = parent.clientHeight * 2;
      _ctx.scale(2, 2);
    }

    resize();
    window.addEventListener("resize", resize);

    // --------------------------------------------------
    // Draw loop — runs every frame
    // --------------------------------------------------
    function draw() {
      const width = _canvas.width / 2;
      const height = _canvas.height / 2;

      _ctx.clearRect(0, 0, width, height);

      // --------------------------------------------------
      // 1. Build smoothed spline from KPIs
      // --------------------------------------------------
      const curve = generateSplinePoints(dataPoints, width, height);

      // --------------------------------------------------
      // 2. Glow layer
      // --------------------------------------------------
      const { glow, main } = getScenarioColor(scenario);

      _ctx.lineWidth = 3;
      _ctx.strokeStyle = glow;
      _ctx.shadowBlur = 18;
      _ctx.shadowColor = glow;

      _ctx.beginPath();
      _ctx.moveTo(curve[0].x, curve[0].y);
      for (let i = 1; i < curve.length; i++) {
        _ctx.lineTo(curve[i].x, curve[i].y);
      }
      _ctx.stroke();

      // --------------------------------------------------
      // 3. Main line
      // --------------------------------------------------
      _ctx.lineWidth = 2;
      _ctx.strokeStyle = main;
      _ctx.shadowBlur = 0;

      _ctx.beginPath();
      _ctx.moveTo(curve[0].x, curve[0].y);
      for (let i = 1; i < curve.length; i++) {
        _ctx.lineTo(curve[i].x, curve[i].y);
      }
      _ctx.stroke();

      // --------------------------------------------------
      // 4. Active KPI highlight
      // --------------------------------------------------
      if (activeKPIIndex !== null && curve[activeKPIIndex]) {
        const point = curve[activeKPIIndex];

        _ctx.fillStyle = "#ffffff";
        _ctx.shadowBlur = 12;
        _ctx.shadowColor = "#ffffff";

        _ctx.beginPath();
        _ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        _ctx.fill();

        _ctx.shadowBlur = 0;
      }

      frame = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [dataPoints, activeKPIIndex, scenario]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
