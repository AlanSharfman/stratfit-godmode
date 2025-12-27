import { useEffect, useMemo, useRef } from "react";
import { generateSplinePoints } from "./utils/splineMath";
import type { ScenarioId } from "../../dashboardConfig";

interface MountainEngineProps {
  dataPoints: number[];
  activeKPIIndex: number | null;
  scenario: ScenarioId;
  comparisonMode?: boolean;
  comparisonData?: Partial<Record<ScenarioId, { dataPoints: number[] }>>;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STEP 1: SEMANTIC MAPPING — KPI → TERRAIN GEOMETRY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * NO KPI DIRECTLY SETS PIXELS.
 * KPIs are MODIFIERS, not raw geometry.
 * 
 * Canonical Mapping:
 * 
 * KPI       │ Terrain Meaning        │ Geometry Role
 * ──────────┼────────────────────────┼─────────────────────────────────────
 * Runway    │ Base stability         │ Vertical lift (baseline height)
 * Cash      │ Plateau thickness      │ Area / fill depth
 * Growth    │ Ascent steepness       │ Slope angle
 * EBITDA    │ Smoothness             │ Curve tension
 * Burn      │ Downward pressure      │ Gravity / sag
 * Risk      │ Noise / volatility     │ Jaggedness
 * Value     │ Peak prominence        │ Final apex height
 * 
 * This mapping is FROZEN. Do not improvise yet.
 * Future: each KPI will modulate these parameters procedurally.
 * ═══════════════════════════════════════════════════════════════════════════
 */

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

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STEP 2: LAYERED TERRAIN HELPERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Smooth array with factor: 1.0 = keep, <1.0 = dampen, >1.0 = amplify
 */
function smooth(arr: number[], factor: number): number[] {
  if (arr.length < 3) return arr.map(v => v * factor);
  
  const result = [...arr];
  // Simple 3-point smoothing
  for (let i = 1; i < arr.length - 1; i++) {
    result[i] = (arr[i - 1] + arr[i] * 2 + arr[i + 1]) / 4;
  }
  
  return result.map(v => v * factor);
}

/**
 * STEP 3: ACTIVATE KPI FOCUS
 * Emphasize a specific point with falloff to neighbors
 */
function emphasize(points: number[], index: number | null, boost: number = 0.25): number[] {
  if (index === null || index < 0 || index >= points.length) return points;

  return points.map((v, i) => {
    const d = Math.abs(i - index);
    const falloff = Math.max(0, 1 - d * 0.35);
    return v * (1 + falloff * boost);
  });
}

/**
 * Normalise arbitrary numeric inputs to 0..1 so the spline always renders.
 * This prevents “blank mountain” when values are $ millions / mixed units.
 */
function normalise(points: number[]) {
  const clean = points.map((v) => (Number.isFinite(v) ? v : 0));
  if (clean.length === 0) return [];

  const min = Math.min(...clean);
  const max = Math.max(...clean);

  // If all values equal, create a gentle shape instead of a flat line.
  if (Math.abs(max - min) < 1e-9) {
    return clean.map((_, i) => {
      const t = clean.length === 1 ? 0 : i / (clean.length - 1);
      // mild “hill”
      return clamp01(0.35 + Math.sin(t * Math.PI) * 0.25);
    });
  }

  return clean.map((v) => clamp01((v - min) / (max - min)));
}

export default function MountainEngine({ dataPoints, activeKPIIndex, scenario, comparisonMode, comparisonData }: MountainEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parentRectRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // ✅ DEBUG: Verify component mount and data integrity
  console.log("✅ MountainEngine mounted", { 
    dataPoints, 
    length: dataPoints.length,
    allNumbers: dataPoints.every(n => typeof n === "number"),
    allPositive: dataPoints.every(n => n > 0),
    sample: dataPoints.slice(0, 3),
    activeKPIIndex,
    scenario
  });

  // ✅ STEP 4: MOTION DISCIPLINE
  // Normalise ONCE per input change — no state writes, no effects with dependencies
  const points01 = useMemo(() => {
    const normalized = normalise(dataPoints);
    console.log("🔍 Normalized points:", normalized);
    return normalized;
  }, [dataPoints]);

  // ✅ Use refs to pass dynamic data WITHOUT triggering effect restarts
  const points01Ref = useRef(points01);
  const activeKPIRef = useRef(activeKPIIndex);
  const scenarioRef = useRef(scenario);
  const comparisonModeRef = useRef(comparisonMode);
  const comparisonDataRef = useRef(comparisonData);
  
  // Update refs when props change (doesn't trigger effects)
  points01Ref.current = points01;
  activeKPIRef.current = activeKPIIndex;
  scenarioRef.current = scenario;
  comparisonModeRef.current = comparisonMode;
  comparisonDataRef.current = comparisonData;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let tick = 0;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resizeToParent = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const w = Math.max(0, Math.floor(rect.width));
      const h = Math.max(0, Math.floor(rect.height));

      parentRectRef.current = { w, h };

      if (w === 0 || h === 0) return;

      // set internal pixel buffer
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

      // set CSS size
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // reset transform and scale to dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    // ✅ Observe parent size changes (more reliable than window resize)
    const parent = canvas.parentElement;
    const ro = new ResizeObserver(() => resizeToParent());
    if (parent) ro.observe(parent);

    // initial
    resizeToParent();

    const draw = () => {
      const { w: width, h: height } = parentRectRef.current;

      // If parent has no height yet, keep trying
      if (!width || !height) {
        raf = requestAnimationFrame(draw);
        return;
      }

      tick += 0.015;
      const theme = SCENARIO_THEMES[scenarioRef.current];
      
      // ✅ Derive layered terrain INSIDE draw loop (fresh each frame)
      const base = points01Ref.current;
      
      console.log("🎯 Draw loop - base points:", base, "length:", base?.length);
      
      // ✅ FALLBACK: If no data, create dummy mountain so user sees SOMETHING
      const safeBase = (!base || base.length === 0) 
        ? [0.3, 0.5, 0.7, 0.6, 0.8, 0.5, 0.4]  // Dummy hill
        : base;
      
      if (safeBase !== base) {
        console.error("❌ Using fallback data - base was empty/undefined!");
      }
      
      const backRidge = smooth(safeBase, 0.6).map(v => v * 0.6);
      const midRidge = smooth(safeBase, 0.85);
      const frontBase = smooth(safeBase, 1.1).map(v => v * 1.15);
      const frontRidge = emphasize(frontBase, activeKPIRef.current, 0.25);
      
      console.log("🎯 Ridge data:", {
        backRidge,
        midRidge,
        frontRidge,
        lengths: {
          back: backRidge.length,
          mid: midRidge.length,
          front: frontRidge.length
        }
      });
      
      const layeredTerrain = { backRidge, midRidge, frontRidge };

      // clear
      ctx.clearRect(0, 0, width, height);

      // background
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, theme.bg1);
      bg.addColorStop(0.5, theme.bg2);
      bg.addColorStop(1, theme.bg1);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      // ✅ DEBUG: Verify canvas is alive
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px ui-sans-serif";
      ctx.fillText(`canvas ${width}x${height} pts=${points01Ref.current.length}`, 12, 20);
      // scan lines
      ctx.strokeStyle = theme.scan;
      ctx.lineWidth = 1;
      for (let i = 0; i < 25; i++) {
        const y = (i * 18 + tick * 40) % height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // spline base height
      const baseHeight = height * 0.65;

      // ═══════════════════════════════════════════════════════════════════
      // STEP 2: LAYERED TERRAIN — Three ridges from derived data
      // ═══════════════════════════════════════════════════════════════════
      
      // Generate spline curves for each layer
      const baseCurveBack = generateSplinePoints(layeredTerrain.backRidge, width, baseHeight);
      const baseCurveMid = generateSplinePoints(layeredTerrain.midRidge, width, baseHeight);
      const baseCurveFront = generateSplinePoints(layeredTerrain.frontRidge, width, baseHeight);
      
      console.log("🎨 Curve lengths:", {
        back: baseCurveBack.length,
        mid: baseCurveMid.length,
        front: baseCurveFront.length,
        backRidge: layeredTerrain.backRidge,
        frontRidge: layeredTerrain.frontRidge
      });
      
      if (!baseCurveFront.length) {
        console.warn("⚠️ baseCurveFront is empty! Early return.");
        raf = requestAnimationFrame(draw);
        return;
      }

      // ═══════════════════════════════════════════════════════════════════
      // STEP 4: MOTION DISCIPLINE — RAF-based animation, no state writes
      // ═══════════════════════════════════════════════════════════════════
      
      // Subtle motion with different frequencies per layer
      const waveBack = Math.sin(tick * 0.5) * 4;
      const waveMid = Math.sin(tick * 0.8) * 6;
      const waveFront = Math.sin(tick * 1.2) * 8;

      // Apply vertical offsets + waves to create depth
      const curveBack = baseCurveBack.map((pt, i) => ({
        x: pt.x,
        y: pt.y + 45 + waveBack + Math.sin(tick * 0.4 + i * 0.5) * 3,
      }));

      const curveMid = baseCurveMid.map((pt, i) => ({
        x: pt.x,
        y: pt.y + 22 + waveMid + Math.sin(tick * 0.7 + i * 0.6) * 5,
      }));

      const curveFront = baseCurveFront.map((pt, i) => ({
        x: pt.x,
        y: pt.y + waveFront + Math.sin(tick * 1.0 + i * 0.7) * 6,
      }));

      // fill
      const fillGrad = ctx.createLinearGradient(0, height * 0.15, 0, height);
      fillGrad.addColorStop(0, theme.fill1);
      fillGrad.addColorStop(0.4, theme.fill2);
      fillGrad.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.moveTo(curveFront[0].x, height);
      curveFront.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(curveFront[curveFront.length - 1].x, height);
      ctx.closePath();
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // back
      ctx.shadowBlur = 6;
      ctx.shadowColor = theme.glow;
      ctx.strokeStyle = theme.back;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      curveBack.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      // mid
      ctx.shadowBlur = 10;
      ctx.shadowColor = theme.glow;
      ctx.strokeStyle = theme.mid;
      ctx.lineWidth = 2;
      ctx.beginPath();
      curveMid.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      // front
      ctx.shadowBlur = 25;
      ctx.shadowColor = theme.front;
      ctx.strokeStyle = theme.front;
      ctx.lineWidth = 3;
      ctx.beginPath();
      curveFront.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 3: COMPARISON OVERLAYS — Ghost other scenarios
      // ═══════════════════════════════════════════════════════════════════
      if (comparisonModeRef.current && comparisonDataRef.current) {
        const currentScenario = scenarioRef.current;
        Object.entries(comparisonDataRef.current).forEach(([scenId, data]) => {
          if (scenId === currentScenario) return; // Skip active scenario
          
          const compTheme = SCENARIO_THEMES[scenId as ScenarioId];
          if (!compTheme) return;

          // Normalize and smooth comparison data
          const compPoints = normalise(data.dataPoints);
          const compRidge = smooth(compPoints, 1.0).map(v => v * 1.05);
          const compCurve = generateSplinePoints(compRidge, width, baseHeight);
          
          if (!compCurve.length) return;

          // Apply same wave for consistency
          const compFront = compCurve.map((pt, i) => ({
            x: pt.x,
            y: pt.y + waveFront + Math.sin(tick * 1.0 + i * 0.7) * 6,
          }));

          // Ghost line (low opacity)
          ctx.shadowBlur = 8;
          ctx.shadowColor = compTheme.front + "40";
          ctx.strokeStyle = compTheme.front + "60"; // 60% opacity
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]); // Dashed for ghost effect
          ctx.beginPath();
          compFront.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          ctx.stroke();
          ctx.setLineDash([]); // Reset dash
        });
        ctx.shadowBlur = 0;
      }

      // core
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      curveFront.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      // points
      const pulseSize = 3 + Math.sin(tick * 3) * 1.5;

      // IMPORTANT: KPI index is 0..6, curveFront has many points.
      // So we map KPI index onto curve positions.
      const kpiCount = Math.max(1, points01Ref.current.length);
      const indexToCurve = (kpiIdx: number) => {
        if (curveFront.length <= 1) return 0;
        const t = kpiCount <= 1 ? 0 : kpiIdx / (kpiCount - 1);
        return Math.round(t * (curveFront.length - 1));
      };

      curveFront.forEach((p) => {
        // subtle dots along curve (optional)
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `${theme.front}22`;
        ctx.fill();
      });

      if (activeKPIRef.current !== null && activeKPIRef.current >= 0 && activeKPIRef.current < kpiCount) {
        const curveIdx = indexToCurve(activeKPIRef.current);
        const point = curveFront[curveIdx];

        const size = pulseSize * 2.5;

        // ═══════════════════════════════════════════════════════════════
        // STEP 3: ACTIVATE KPI FOCUS — Vertical scanline + emphasis glow
        // ═══════════════════════════════════════════════════════════════
        
        // Vertical scanline glow
        const scanGrad = ctx.createLinearGradient(point.x, point.y, point.x, height);
        scanGrad.addColorStop(0, `${theme.front}60`);
        scanGrad.addColorStop(0.3, `${theme.front}20`);
        scanGrad.addColorStop(1, "transparent");
        
        ctx.fillStyle = scanGrad;
        ctx.fillRect(point.x - 30, point.y, 60, height - point.y);

        // glow blob
        ctx.beginPath();
        ctx.arc(point.x, point.y, size + 10, 0, Math.PI * 2);
        ctx.fillStyle = `${theme.front}30`;
        ctx.fill();

        // inner dot
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#ffffff";
        ctx.fill();
        ctx.shadowBlur = 0;

        // guide line
        ctx.strokeStyle = `${theme.front}40`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y + 10);
        ctx.lineTo(point.x, height - 25);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // timeline markers (still 7)
      const timelineY = height - 15;
      const months = ["M1", "M2", "M3", "M4", "M5", "M6", "M7"];

      ctx.font = "10px monospace";
      months.forEach((label, i) => {
        const x = (width / (months.length - 1)) * i;
        const isActive = activeKPIRef.current === i;

        ctx.strokeStyle = isActive ? theme.front : "rgba(148,163,184,0.3)";
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, timelineY - 8);
        ctx.lineTo(x, timelineY - 3);
        ctx.stroke();

        ctx.fillStyle = isActive ? theme.front : "rgba(148,163,184,0.5)";
        ctx.fillText(label, x - 8, timelineY + 8);
      });

      ctx.strokeStyle = "rgba(148,163,184,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, timelineY - 5);
      ctx.lineTo(width, timelineY - 5);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []); // ✅ EMPTY DEPS - Effect runs once, draw loop reads from refs

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
