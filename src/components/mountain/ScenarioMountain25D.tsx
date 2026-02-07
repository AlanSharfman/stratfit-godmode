import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  dataPoints: number[];
  activeKpiIndex?: number | null;
  className?: string;
  /**
   * Canvas size (CSS pixels). Canvas is rendered at devicePixelRatio for crisp lines.
   */
  width?: number;
  height?: number;
  mode?: "default" | "celebration" | "ghost";
  glowIntensity?: number;
  riskLevel?: number; // 0..100
  isSeismicActive?: boolean;
  isDragging?: boolean;
  hasInteracted?: boolean;
  neuralPulse?: boolean;
  showPath?: boolean;
  showMilestones?: boolean;
  solverPath?: { riskIndex: number; enterpriseValue: number; runway: number }[];
  pathColor?: string;
};

// --- Constants copied from the 5181 "canonical mountain" shape (3D version) ---
const GRID_W = 90;
const GRID_D = 45;
const MESH_W = 50;
const MESH_D = 25;
const ISLAND_RADIUS = 22;

const BASE_SCALE = 4.5;
const MASSIF_SCALE = 5.0;
const RIDGE_SHARPNESS = 1.4;
const CLIFF_BOOST = 1.15;

const SOFT_CEILING = 9.0;
const CEILING_START = 7.0;

type MassifPeak = { x: number; z: number; amplitude: number; sigmaX: number; sigmaZ: number };
const MASSIF_PEAKS: MassifPeak[] = [
  { x: 0, z: -2, amplitude: 1.5, sigmaX: 2.8, sigmaZ: 2.4 },
  { x: -10, z: -1, amplitude: 1.2, sigmaX: 3.0, sigmaZ: 2.6 },
  { x: 11, z: -1.5, amplitude: 1.1, sigmaX: 2.8, sigmaZ: 2.5 },
  { x: -3, z: 3, amplitude: 0.85, sigmaX: 3.5, sigmaZ: 3.0 },
  { x: -16, z: 2, amplitude: 0.6, sigmaX: 4.0, sigmaZ: 3.5 },
  { x: 17, z: 1, amplitude: 0.55, sigmaX: 3.8, sigmaZ: 3.2 },
];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function noise2(x: number, z: number): number {
  const n1 = Math.sin(x * 0.7 + z * 0.35) * 0.2;
  const n2 = Math.cos(x * 1.2 - z * 0.6) * 0.15;
  const n3 = Math.sin(x * 2.1 + z * 1.8) * 0.08;
  return n1 + n2 + n3;
}

function ridgeNoise(x: number, z: number): number {
  const base = Math.sin(x * 0.5) * Math.cos(z * 0.3);
  const detail = Math.abs(Math.sin(x * 2.5 + z * 1.5)) * 0.35;
  return base * 0.15 + detail * 0.2;
}

function gaussian1(x: number, c: number, s: number): number {
  const t = (x - c) / Math.max(0.1, s);
  return Math.exp(-0.5 * t * t);
}

function gaussian2(dx: number, dz: number, sx: number, sz: number): number {
  return Math.exp(-0.5 * ((dx * dx) / (sx * sx) + (dz * dz) / (sz * sz)));
}

function applySoftCeiling(h: number): number {
  if (h <= CEILING_START) return h;
  const excess = h - CEILING_START;
  const range = SOFT_CEILING - CEILING_START;
  return CEILING_START + range * (1 - Math.exp(-excess / range));
}

type HeightField = {
  heights: Float32Array;
  illum: Float32Array;
  maxH: number;
};

function buildHeightField(dataPoints: number[], activeKpiIndex: number | null | undefined): HeightField {
  const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];

  const vx = GRID_W + 1;
  const vz = GRID_D + 1;
  const heights = new Float32Array(vx * vz);
  const illum = new Float32Array(vx * vz);

  const wHalf = MESH_W / 2;
  const dHalf = MESH_D / 2;

  let maxH = 0.01;

  for (let iz = 0; iz < vz; iz++) {
    const z = lerp(-dHalf, dHalf, iz / GRID_D);
    for (let ix = 0; ix < vx; ix++) {
      const x = lerp(-wHalf, wHalf, ix / GRID_W);

      const kpiX = ((x + wHalf) / MESH_W) * 6;

      let ridge = 0;
      let illumination = 0;

      for (let idx = 0; idx < 7; idx++) {
        const v = clamp01(dp[idx]);
        const g = gaussian1(kpiX, idx, 0.48);
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
        if (activeKpiIndex === idx) illumination = Math.max(illumination, g * 0.6);
      }

      let h = ridge * BASE_SCALE;

      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
        h += g * m.amplitude * MASSIF_SCALE;
      }

      const rugged = ridgeNoise(x, z);
      h += rugged * (0.3 + h * 0.08);

      // Island mask
      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));

      const n = noise2(x, z) * 0.2;
      const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
      let finalH = Math.max(0, (h + n) * mask * cliff);
      finalH = applySoftCeiling(finalH);

      const i = iz * vx + ix;
      heights[i] = finalH;
      illum[i] = illumination;
      if (finalH > maxH) maxH = finalH;
    }
  }

  return { heights, illum, maxH };
}

export function ScenarioMountain25D({
  dataPoints,
  activeKpiIndex = null,
  className,
  width = 900,
  height = 360,
  mode = "default",
  glowIntensity = 1,
  riskLevel = 30,
  isSeismicActive = false,
  isDragging = false,
  hasInteracted = false,
  neuralPulse = false,
  showPath = false,
  showMilestones = false,
  solverPath,
  pathColor,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const hf = useMemo(() => buildHeightField(dataPoints, activeKpiIndex), [dataPoints, activeKpiIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vx = GRID_W + 1;
    const vz = GRID_D + 1;

    const wHalf = MESH_W / 2;
    const dHalf = MESH_D / 2;

    // 2.5D projection parameters
    const cx = (canvas.width / dpr) * 0.5;
    const cy = (canvas.height / dpr) * 0.63;
    const sx = ((canvas.width / dpr) / (MESH_W + MESH_D)) * 1.15;
    const sy = sx * 0.55;
    const hz = sx * 2.0;

    const damp = (cur: number, target: number, lambda: number, dt: number) => {
      const a = 1 - Math.exp(-lambda * dt);
      return cur + (target - cur) * a;
    };

    const camRef = { yaw: 0, pitch: 0, bob: 0, zoom: 1 };
    let lastT = performance.now();

    const toScreen = (x0: number, z0: number, h: number, yaw: number, pitch: number, zoom: number, bob: number) => {
      // Rotate the "world" around Y (yaw) to simulate the 3D idle orbit.
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      const x = x0 * cos - z0 * sin;
      const z = x0 * sin + z0 * cos;

      // Pitch subtly changes vertical scale to mimic camera tilt.
      const sy2 = sy * (1 + pitch);

      const isoX = (x - z) * sx * zoom;
      const isoY = (x + z) * sy2 * zoom;
      return {
        x: cx + isoX,
        y: cy + isoY - h * hz * zoom + bob,
      };
    };

    const smoothSeismicNoise = (tt: number) => {
      const a = Math.sin(tt * 7.13 + 0.37 * 1.7);
      const b = Math.sin(tt * 12.77 + 0.37 * 3.1);
      const c = Math.sin(tt * 19.31 + 0.37 * 5.3);
      return a * 0.62 + b * 0.28 + c * 0.10;
    };

    const draw = (tMs: number) => {
      const now = tMs;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
      lastT = now;
      const t = now * 0.001;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Background: match 5181 vibe
      const bg = ctx.createRadialGradient(cx, cy * 0.9, 40, cx, cy * 0.9, Math.max(width, height));
      bg.addColorStop(0, "#1a2744");
      bg.addColorStop(0.55, "#0f1a2e");
      bg.addColorStop(1, "#0a1220");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Haze
      const haze = ctx.createLinearGradient(0, 0, 0, height);
      haze.addColorStop(0, "rgba(255,255,255,0.02)");
      haze.addColorStop(0.35, "rgba(255,255,255,0.00)");
      haze.addColorStop(1, "rgba(0,0,0,0.14)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);

      // Wireframe style
      ctx.lineWidth = 1;
      ctx.globalCompositeOperation = "lighter";

      const baseCyan = { r: 34, g: 211, b: 238 };
      const breathe = 1 + Math.sin(t * 0.55) * 0.015; // subtle, stable

      // Seismic shake (2.5D analogue)
      const risk01 = Math.max(0, Math.min(1, riskLevel / 100));
      const shakeAmp = isSeismicActive ? 10 * risk01 : risk01 > 0.4 ? 3.5 * risk01 : 0;
      const shake = smoothSeismicNoise(t) * shakeAmp;

      // Mode styling
      const modeAlphaMul = mode === "ghost" ? 0.35 : mode === "celebration" ? 1.25 : 1.0;
      const modeGlowMul = mode === "ghost" ? 0.25 : mode === "celebration" ? 1.6 : 1.0;

      const pulse = neuralPulse ? (0.85 + Math.sin(t * 8) * 0.35) : 1.0;
      const dragBoost = isDragging ? 1.35 : 1.0;

      // "Search pattern" idle motion (2.5D camera analogue)
      const wantsIdle = !hasInteracted;
      const yawTarget = wantsIdle ? Math.sin(t * 0.18) * 0.22 + Math.sin(t * 0.07) * 0.09 : 0;
      const pitchTarget = wantsIdle ? Math.cos(t * 0.25) * 0.06 + Math.sin(t * 0.11) * 0.03 : 0;
      const bobTarget = wantsIdle ? (Math.sin(t * 0.4) * 6 + Math.cos(t * 0.22) * 3) : 0;
      const zoomTarget = wantsIdle ? 1.02 : 1.0;

      camRef.yaw = damp(camRef.yaw, yawTarget, 3.5, dt);
      camRef.pitch = damp(camRef.pitch, pitchTarget, 3.5, dt);
      camRef.bob = damp(camRef.bob, bobTarget, 3.5, dt);
      camRef.zoom = damp(camRef.zoom, zoomTarget, 3.5, dt);

      const idx = (ix: number, iz: number) => iz * vx + ix;

      // Draw far -> near to prevent over-bright stacking at the front.
      for (let iz = 0; iz < vz; iz++) {
        // Row lines
        ctx.beginPath();
        for (let ix = 0; ix < vx; ix++) {
          const x = lerp(-wHalf, wHalf, ix / GRID_W);
          const z = lerp(-dHalf, dHalf, iz / GRID_D);
          const i = idx(ix, iz);
          const h = hf.heights[i] * breathe;
          const p = toScreen(x, z, h, camRef.yaw, camRef.pitch, camRef.zoom, camRef.bob);
          if (ix === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        const rowIllum = hf.illum[idx(Math.floor(vx / 2), iz)];
        const a = (0.12 + rowIllum * 0.26) * modeAlphaMul * pulse * dragBoost;
        ctx.strokeStyle = `rgba(${baseCyan.r},${baseCyan.g},${baseCyan.b},${a})`;
        ctx.stroke();
      }

      for (let ix = 0; ix < vx; ix += 2) {
        // Column lines (skip every other to reduce density)
        ctx.beginPath();
        for (let iz = 0; iz < vz; iz++) {
          const x = lerp(-wHalf, wHalf, ix / GRID_W);
          const z = lerp(-dHalf, dHalf, iz / GRID_D);
          const i = idx(ix, iz);
          const h = hf.heights[i] * breathe;
          const p = toScreen(x, z, h, camRef.yaw, camRef.pitch, camRef.zoom, camRef.bob);
          if (iz === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        const colIllum = hf.illum[idx(ix, Math.floor(vz / 2))];
        const a = (0.09 + colIllum * 0.20) * modeAlphaMul * pulse * dragBoost;
        ctx.strokeStyle = `rgba(${baseCyan.r},${baseCyan.g},${baseCyan.b},${a})`;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";

      // --- Path + Milestones overlays (2.5D approximation) ---
      const sp = solverPath?.length
        ? solverPath
        : [
            { riskIndex: 60, enterpriseValue: 1, runway: 12 },
            { riskIndex: 55, enterpriseValue: 2, runway: 16 },
            { riskIndex: 50, enterpriseValue: 3, runway: 20 },
            { riskIndex: 45, enterpriseValue: 4, runway: 26 },
            { riskIndex: 40, enterpriseValue: 5, runway: 32 },
          ];

      const canShowOverlays = hasInteracted && (showPath || showMilestones);
      if (canShowOverlays) {
        const maxRunway = Math.max(...sp.map((p) => p.runway || 0), 1);
        const minEV = Math.min(...sp.map((p) => p.enterpriseValue || 0));
        const maxEV = Math.max(...sp.map((p) => p.enterpriseValue || 0), minEV + 1);
        const color = pathColor ?? "rgba(34,211,238,0.95)";

        const pathPts = sp.map((p, i) => {
          const tt = sp.length <= 1 ? 0 : i / (sp.length - 1);
          const runway01 = (p.runway ?? 0) / maxRunway;
          const ev01 = ((p.enterpriseValue ?? 0) - minEV) / (maxEV - minEV);
          const risk01p = clamp01((p.riskIndex ?? 50) / 100);
          const x = (tt - 0.5) * 10;
          const z = -1.2 + tt * 0.8; // forward
          const y = 0.3 + runway01 * 2.2 + ev01 * 1.2 - risk01p * 0.8; // lift
          // Note: our 2.5D toScreen expects (x,z,height). We treat "y" as height.
          const p2 = toScreen(x, z, y, camRef.yaw, camRef.pitch, camRef.zoom, camRef.bob);
          return p2;
        });

        if (showPath) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          // Glow stroke
          ctx.strokeStyle = color.replace("0.95", `${0.18 * modeGlowMul * glowIntensity}`);
          ctx.lineWidth = 5;
          ctx.beginPath();
          pathPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x + shake * 0.15, p.y) : ctx.lineTo(p.x + shake * 0.15, p.y)));
          ctx.stroke();

          // Core stroke
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          pathPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x + shake * 0.15, p.y) : ctx.lineTo(p.x + shake * 0.15, p.y)));
          ctx.stroke();

          ctx.restore();
        }

        if (showMilestones) {
          const picks = [0.15, 0.35, 0.55, 0.75, 0.92];
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          for (const tt of picks) {
            const i = Math.max(0, Math.min(pathPts.length - 1, Math.round(tt * (pathPts.length - 1))));
            const p = pathPts[i];
            const r = 4 + Math.sin(t * 3 + tt * 10) * 0.7;
            ctx.fillStyle = "rgba(255,255,255,0.08)";
            ctx.beginPath();
            ctx.arc(p.x + shake * 0.15, p.y, r * 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(34,211,238,0.75)";
            ctx.beginPath();
            ctx.arc(p.x + shake * 0.15, p.y, r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      raf = window.requestAnimationFrame(draw);
    };

    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, [hf, width, height]);

  return <canvas ref={canvasRef} className={className} />;
}


