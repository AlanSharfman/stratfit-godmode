/**
 * STRATFIT MountainEngine v4.0 — Production Ready
 * 
 * Matches target mockup:
 * - Dramatic central peak with side ridges
 * - Dual-layer rendering (cyan primary + magenta secondary)
 * - Correct viewing angle (not tilted)
 * - Perspective grid floor
 * - Atmospheric glow and mist
 * - KPI focus LIFTS section with glow (not fold)
 * - Smooth, stable, no flicker
 */

import { useEffect, useRef, memo } from "react";

// ============================================================================
// TYPES
// ============================================================================

type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface MountainEngineProps {
  dataPoints?: number[];
  activeKPIIndex?: number | null;
  scenario?: ScenarioId;
  className?: string;
}

// ============================================================================
// COLOR PALETTES
// ============================================================================

const PALETTES: Record<ScenarioId, { primary: string; secondary: string; glow: string }> = {
  base: { primary: "#22d3ee", secondary: "#ec4899", glow: "#22d3ee" },
  upside: { primary: "#34d399", secondary: "#22d3ee", glow: "#34d399" },
  downside: { primary: "#fb923c", secondary: "#ec4899", glow: "#fb923c" },
  extreme: { primary: "#f87171", secondary: "#fb923c", glow: "#f87171" },
};

// ============================================================================
// UTILITIES
// ============================================================================

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x;
}

function clamp01(x: number): number {
  return clamp(x, 0, 1);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${clamp01(alpha)})`;
}

function mixHex(a: string, b: string, t: number): string {
  const ct = clamp01(t);
  const r = Math.round(lerp(parseInt(a.slice(1, 3), 16), parseInt(b.slice(1, 3), 16), ct));
  const g = Math.round(lerp(parseInt(a.slice(3, 5), 16), parseInt(b.slice(3, 5), 16), ct));
  const bl = Math.round(lerp(parseInt(a.slice(5, 7), 16), parseInt(b.slice(5, 7), 16), ct));
  const toHex = (n: number) => clamp(n, 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_DATA = [0.4, 0.6, 0.85, 1.0, 0.75, 0.55, 0.35];

// ============================================================================
// COMPONENT
// ============================================================================

const MountainEngine = memo(function MountainEngine({
  dataPoints,
  activeKPIIndex = null,
  scenario = "base",
  className,
}: MountainEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const state = useRef({
    time: 0,
    lastTime: performance.now(),
    width: 0,
    height: 0,
    data: DEFAULT_DATA,
    targetData: DEFAULT_DATA,
    scenario: scenario as ScenarioId,
    prevScenario: scenario as ScenarioId,
    blend: 1,
    activeKPI: null as number | null,
    focusIntensity: 0,
  });

  // Sync data with smooth interpolation
  useEffect(() => {
    if (dataPoints && Array.isArray(dataPoints) && dataPoints.length >= 2) {
      const min = Math.min(...dataPoints);
      const max = Math.max(...dataPoints);
      const range = Math.max(0.001, max - min);
      state.current.targetData = dataPoints.map(v => clamp01((v - min) / range));
    }
  }, [dataPoints]);

  useEffect(() => {
    const s = state.current;
    if (scenario !== s.scenario) {
      s.prevScenario = s.scenario;
      s.scenario = scenario;
      s.blend = 0;
    }
  }, [scenario]);

  useEffect(() => {
    state.current.activeKPI = activeKPIIndex ?? null;
  }, [activeKPIIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    mountedRef.current = true;
    const s = state.current;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w < 1 || h < 1 || (s.width === w && s.height === h)) return;
      s.width = w;
      s.height = h;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    resize();

    const draw = (now: number) => {
      if (!mountedRef.current) return;

      const dt = Math.min((now - s.lastTime) / 1000, 0.1);
      s.lastTime = now;
      s.time += dt;

      // Smooth data interpolation (INSTANT response)
      for (let i = 0; i < s.data.length; i++) {
        s.data[i] = lerp(s.data[i], s.targetData[i] ?? s.data[i], Math.min(1, dt * 12));
      }

      s.blend = Math.min(1, s.blend + dt * 3);

      const targetFocus = s.activeKPI !== null ? 1 : 0;
      s.focusIntensity = lerp(s.focusIntensity, targetFocus, Math.min(1, dt * 10));

      const W = s.width;
      const H = s.height;
      if (W < 10 || H < 10) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const pal0 = PALETTES[s.prevScenario] ?? PALETTES.base;
      const pal1 = PALETTES[s.scenario] ?? PALETTES.base;
      const primary = mixHex(pal0.primary, pal1.primary, s.blend);
      const secondary = mixHex(pal0.secondary, pal1.secondary, s.blend);
      const glowColor = mixHex(pal0.glow, pal1.glow, s.blend);

      // Clear with dark background
      ctx.fillStyle = "#080c14";
      ctx.fillRect(0, 0, W, H);

      // Grid parameters - CORRECT ANGLE (looking straight at mountain)
      const marginX = W * 0.02;
      const marginTop = H * 0.08;
      const marginBot = H * 0.08;
      const gridW = W - marginX * 2;
      const gridH = H - marginTop - marginBot;
      const centerX = W / 2;
      const horizonY = marginTop + gridH * 0.1;
      const baseY = H - marginBot;

      const cols = 60;
      const rows = 35;
      const data = s.data;
      const dataLen = data.length;
      const activeKPI = s.activeKPI;
      const focusIntensity = s.focusIntensity;
      const time = s.time;

      const breathe = 1 + Math.sin(time * 0.4) * 0.008;

      // Height function - DRAMATIC PEAKS
      const getHeight = (xN: number, zN: number): number => {
        // Main central peak (sharp, tall)
        const mainX = 0.5;
        const mainZ = 0.4;
        const mdx = (xN - mainX) * 2.0;
        const mdz = (zN - mainZ) * 2.5;
        const mainDist = Math.sqrt(mdx * mdx + mdz * mdz);
        const mainPeak = Math.pow(Math.max(0, 1 - mainDist * 0.9), 2.2);

        // Left ridge
        const leftX = 0.25;
        const leftZ = 0.45;
        const ldx = (xN - leftX) * 2.5;
        const ldz = (zN - leftZ) * 2.8;
        const leftDist = Math.sqrt(ldx * ldx + ldz * ldz);
        const leftPeak = Math.pow(Math.max(0, 1 - leftDist), 1.8) * 0.5;

        // Right ridge
        const rightX = 0.72;
        const rightZ = 0.42;
        const rdx = (xN - rightX) * 2.5;
        const rdz = (zN - rightZ) * 2.8;
        const rightDist = Math.sqrt(rdx * rdx + rdz * rdz);
        const rightPeak = Math.pow(Math.max(0, 1 - rightDist), 1.8) * 0.6;

        // Data-driven undulation
        let dataH = 0;
        for (let i = 0; i < dataLen; i++) {
          const px = (i + 0.5) / dataLen;
          const pz = 0.35 + (i % 3) * 0.06;
          const ddx = (xN - px) * 4;
          const ddz = (zN - pz) * 3.5;
          const dd = Math.sqrt(ddx * ddx + ddz * ddz);
          dataH += Math.max(0, 1 - dd) * data[i] * 0.15;
        }

        let h = mainPeak * 0.95 + leftPeak + rightPeak + dataH;

        // Edge falloff
        const fadeX = 1 - Math.pow(Math.abs(xN - 0.5) * 1.9, 5);
        const fadeZ = 1 - Math.pow(zN * 0.85, 6);
        h *= clamp01(fadeX) * clamp01(fadeZ);

        // KPI FOCUS - LIFT (not fold)
        if (activeKPI !== null && activeKPI >= 0 && activeKPI < dataLen) {
          const focusX = (activeKPI + 0.5) / dataLen;
          const fd = Math.abs(xN - focusX);
          if (fd < 0.18) {
            const boost = Math.pow(1 - fd / 0.18, 2) * 0.25 * focusIntensity;
            h += boost;
          }
        }

        h *= breathe;
        return clamp01(h);
      };

      // Projection - straight-on view
      const project = (xN: number, zN: number, h: number): [number, number] => {
        const perspective = lerp(0.08, 1, zN);
        const x = centerX + (xN - 0.5) * gridW * perspective;
        const groundY = lerp(horizonY, baseY, Math.pow(zN, 0.85));
        const lift = h * gridH * 0.75 * lerp(0.3, 1, zN);
        return [x, groundY - lift];
      };

      // Build mesh
      const mesh: [number, number][][] = [];
      for (let r = 0; r <= rows; r++) {
        mesh[r] = [];
        const zN = r / rows;
        for (let c = 0; c <= cols; c++) {
          const xN = c / cols;
          const h = getHeight(xN, zN);
          mesh[r][c] = project(xN, zN, h);
        }
      }

      // GLOW behind mountain
      const glowY = horizonY + gridH * 0.25;
      const glow = ctx.createRadialGradient(centerX, glowY, 0, centerX, glowY, gridH * 0.7);
      glow.addColorStop(0, hexToRgba(glowColor, 0.25));
      glow.addColorStop(0.3, hexToRgba(glowColor, 0.1));
      glow.addColorStop(0.6, hexToRgba(glowColor, 0.03));
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // KPI focus glow (sparkle effect)
      if (activeKPI !== null && activeKPI >= 0 && activeKPI < dataLen && focusIntensity > 0.01) {
        const focusX = marginX + ((activeKPI + 0.5) / dataLen) * gridW;
        const focusGlow = ctx.createRadialGradient(focusX, H * 0.4, 0, focusX, H * 0.4, gridH * 0.4);
        focusGlow.addColorStop(0, hexToRgba(primary, 0.3 * focusIntensity));
        focusGlow.addColorStop(0.5, hexToRgba(primary, 0.1 * focusIntensity));
        focusGlow.addColorStop(1, "transparent");
        ctx.fillStyle = focusGlow;
        ctx.fillRect(0, 0, W, H);
      }

      // Draw mesh layer
      const drawLayer = (color: string, alpha: number, yOff: number, lineW: number, isSecondary: boolean) => {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Horizontal lines
        for (let r = 0; r <= rows; r++) {
          const depth = r / rows;
          const rowAlpha = lerp(0.05, isSecondary ? 0.5 : 1, depth);
          
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha * rowAlpha;
          ctx.lineWidth = lerp(0.3, lineW, depth);
          ctx.shadowColor = color;
          ctx.shadowBlur = isSecondary ? 4 : 8;

          ctx.beginPath();
          for (let c = 0; c <= cols; c++) {
            const [x, y] = mesh[r][c];
            if (c === 0) ctx.moveTo(x, y + yOff);
            else ctx.lineTo(x, y + yOff);
          }
          ctx.stroke();
        }

        // Vertical lines
        for (let c = 0; c <= cols; c += 2) {
          ctx.beginPath();
          for (let r = 0; r <= rows; r++) {
            const [x, y] = mesh[r][c];
            const depth = r / rows;
            ctx.globalAlpha = alpha * 0.3 * lerp(0.05, 1, depth);
            ctx.lineWidth = lerp(0.2, lineW * 0.5, depth);
            if (r === 0) ctx.moveTo(x, y + yOff);
            else ctx.lineTo(x, y + yOff);
          }
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      };

      // SECONDARY layer (magenta/pink) - BEHIND, offset up
      drawLayer(secondary, 0.55, -15, 1.2, true);

      // PRIMARY layer (cyan) - FRONT
      drawLayer(primary, 1, 0, 1.8, false);

      // Floor grid lines (extending to horizon)
      ctx.strokeStyle = primary;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 0.5;
      for (let r = rows; r <= rows + 8; r++) {
        const zN = r / rows;
        const perspective = lerp(0.08, 1, Math.min(1.3, zN));
        const y = lerp(horizonY, baseY, Math.pow(Math.min(1.3, zN), 0.85));
        
        ctx.beginPath();
        ctx.moveTo(centerX - gridW * 0.5 * perspective, y);
        ctx.lineTo(centerX + gridW * 0.5 * perspective, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Bottom mist
      const mist = ctx.createLinearGradient(0, baseY - gridH * 0.12, 0, baseY + 10);
      mist.addColorStop(0, "transparent");
      mist.addColorStop(0.4, hexToRgba(primary, 0.06));
      mist.addColorStop(1, "#080c14");
      ctx.fillStyle = mist;
      ctx.fillRect(0, baseY - gridH * 0.12, W, gridH * 0.12 + 15);

      // Top fade
      const topFade = ctx.createLinearGradient(0, 0, 0, marginTop + 15);
      topFade.addColorStop(0, "rgba(8,12,20,0.98)");
      topFade.addColorStop(1, "transparent");
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, W, marginTop + 15);

      // Vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      mountedRef.current = false;
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "w-full h-full block"}
      style={{ display: "block", background: "#080c14" }}
    />
  );
});

export default MountainEngine;
