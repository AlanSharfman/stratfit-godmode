import { useEffect, useMemo, useRef, memo } from "react";
import { getScenarioPalette } from "./utils/scenarioColors";
import { clamp01, lerp, smoothstep } from "./utils/math";
import { kpiIndexToFocus } from "./utils/mountainFocus";


type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface MountainEngineProps {
  dataPoints?: number[];
  activeKPIIndex?: number | null;
  scenario?: ScenarioId;
  className?: string;
}

const PALETTES: Record<ScenarioId, { primary: string; secondary: string }> = {
  base: { primary: "#22d3ee", secondary: "#ec4899" },
  upside: { primary: "#34d399", secondary: "#22d3ee" },
  downside: { primary: "#fb923c", secondary: "#ec4899" },
  extreme: { primary: "#f87171", secondary: "#fb923c" },
};

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${clamp01(a)})`;
}

function mixHex(a: string, b: string, t: number): string {
  const r = Math.round(lerp(parseInt(a.slice(1, 3), 16), parseInt(b.slice(1, 3), 16), t));
  const g = Math.round(lerp(parseInt(a.slice(3, 5), 16), parseInt(b.slice(3, 5), 16), t));
  const bl = Math.round(lerp(parseInt(a.slice(5, 7), 16), parseInt(b.slice(5, 7), 16), t));
  return `#${[r, g, bl].map(x => x.toString(16).padStart(2, "0")).join("")}`;
}

const DEFAULT_DATA = [0.4, 0.6, 0.9, 1.0, 0.85, 0.5, 0.3];

// IMPORTANT: memo() prevents unnecessary re-renders
const MountainEngine = memo(function MountainEngine({ 
  dataPoints, 
  activeKPIIndex = null, 
  scenario = "base", 
  className 
}: MountainEngineProps) {
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const mountedRef = useRef(true);
  
  // ALL state in a single ref - never causes re-render
  const state = useRef({
    time: 0,
    lastTime: performance.now(),
    w: 0,
    h: 0,
    data: DEFAULT_DATA,
    scenario: scenario,
    prevScenario: scenario,
    blend: 1,
    activeKPI: null as number | null,
    initialized: false,
  });

  // Update data ref (no re-render)
  useEffect(() => {
    if (dataPoints && Array.isArray(dataPoints) && dataPoints.length >= 2) {
      const min = Math.min(...dataPoints);
      const max = Math.max(...dataPoints);
      const range = Math.max(0.001, max - min);
      state.current.data = dataPoints.map(v => clamp01((v - min) / range));
    }
  }, [dataPoints]);

  // Update scenario ref (no re-render)
  useEffect(() => {
    const s = state.current;
    if (scenario !== s.scenario) {
      s.prevScenario = s.scenario;
      s.scenario = scenario;
      s.blend = 0;
    }
  }, [scenario]);

  // Update activeKPI ref (no re-render)
  useEffect(() => {
    state.current.activeKPI = activeKPIIndex ?? null;
  }, [activeKPIIndex]);

  // SINGLE useEffect for canvas - runs ONCE on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    mountedRef.current = true;
    const s = state.current;

    // Resize handler
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const rect = parent.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      
      if (w < 1 || h < 1) return;
      if (s.w === w && s.h === h) return;
      
      s.w = w;
      s.h = h;
      
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    resize();

    // Animation loop
    const draw = (now: number) => {
      if (!mountedRef.current) return;

      // Stable delta time
      const dt = Math.min((now - s.lastTime) / 1000, 0.05);
      s.lastTime = now;
      s.time += dt;
      s.blend = Math.min(1, s.blend + dt * 2.5);

      const W = s.w;
      const H = s.h;
      
      if (W < 10 || H < 10) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const time = s.time;
      const pal0 = PALETTES[s.prevScenario] ?? PALETTES.base;
      const pal1 = PALETTES[s.scenario] ?? PALETTES.base;
      const primary = mixHex(pal0.primary, pal1.primary, s.blend);
      const secondary = mixHex(pal0.secondary, pal1.secondary, s.blend);

      // Clear
      ctx.fillStyle = "#070b12";
      ctx.fillRect(0, 0, W, H);

      // Grid bounds
      const padX = W * 0.03;
      const padTop = H * 0.05;
      const padBot = H * 0.12;
      const gridW = W - padX * 2;
      const gridH = H - padTop - padBot;
      const centerX = W / 2;
      const horizonY = padTop + gridH * 0.15;
      const baseY = H - padBot;

      const cols = 48;
      const rows = 28;
      const data = s.data;
      const dataLen = data.length;
      const activeKPI = s.activeKPI;

      // Breathing
      const breathe = 1 + Math.sin(time * 0.6) * 0.02;

      // Height function
      const getHeight = (xN: number, zN: number): number => {
        const cx = 0.5, cz = 0.4;
        const dx = (xN - cx) * 2.2;
        const dz = (zN - cz) * 2.8;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const mainPeak = Math.max(0, 1 - dist);
        const sharpPeak = Math.pow(mainPeak, 1.3);

        let dataPeak = 0;
        for (let i = 0; i < dataLen; i++) {
          const px = (i + 0.5) / dataLen;
          const pz = 0.35 + (i % 3) * 0.08;
          const ddx = (xN - px) * 4;
          const ddz = (zN - pz) * 3;
          const d = Math.sqrt(ddx * ddx + ddz * ddz);
          const p = Math.max(0, 1 - d) * data[i] * 0.6;
          dataPeak = Math.max(dataPeak, p);
        }

        let h = sharpPeak * 0.7 + dataPeak * 0.5;

        const edgeX = 1 - Math.pow(Math.abs(xN - 0.5) * 2.2, 3);
        const edgeZ = 1 - Math.pow(zN * 1.1, 4);
        h *= Math.max(0, edgeX) * Math.max(0, edgeZ);

        if (activeKPI !== null && activeKPI >= 0 && activeKPI < dataLen) {
          const fx = (activeKPI + 0.5) / dataLen;
          const fd = Math.abs(xN - fx);
          if (fd < 0.12) h += Math.pow(1 - fd / 0.12, 2) * 0.2;
        }

        h *= breathe;
        return clamp01(h);
      };

      // Project 3D to 2D
      const project = (xN: number, zN: number, h: number): [number, number] => {
        const perspective = lerp(0.15, 1, zN);
        const x = centerX + (xN - 0.5) * gridW * perspective;
        const groundY = lerp(horizonY, baseY, zN);
        const lift = h * gridH * 0.7 * perspective;
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

      // Glow
      const glow = ctx.createRadialGradient(centerX, horizonY + gridH * 0.25, 0, centerX, horizonY + gridH * 0.25, gridH * 0.6);
      glow.addColorStop(0, hexToRgba(primary, 0.15));
      glow.addColorStop(0.5, hexToRgba(primary, 0.05));
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Draw mesh
      const drawMesh = (color: string, alpha: number, yOff: number, lineW: number) => {
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        for (let r = 0; r <= rows; r++) {
          const depth = r / rows;
          ctx.globalAlpha = alpha * lerp(0.1, 1, depth);
          ctx.lineWidth = lerp(0.3, lineW, depth);
          ctx.beginPath();
          for (let c = 0; c <= cols; c++) {
            const [x, y] = mesh[r][c];
            if (c === 0) ctx.moveTo(x, y + yOff);
            else ctx.lineTo(x, y + yOff);
          }
          ctx.stroke();
        }

        for (let c = 0; c <= cols; c += 3) {
          ctx.beginPath();
          for (let r = 0; r <= rows; r++) {
            const [x, y] = mesh[r][c];
            const depth = r / rows;
            ctx.globalAlpha = alpha * 0.5 * lerp(0.1, 1, depth);
            ctx.lineWidth = lerp(0.2, lineW * 0.7, depth);
            if (r === 0) ctx.moveTo(x, y + yOff);
            else ctx.lineTo(x, y + yOff);
          }
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      };

      drawMesh(secondary, 0.35, -10, 1);
      drawMesh(primary, 0.9, 0, 1.4);

      // Mist
      const mist = ctx.createLinearGradient(0, baseY - gridH * 0.15, 0, baseY + 5);
      mist.addColorStop(0, "transparent");
      mist.addColorStop(0.6, hexToRgba(primary, 0.08));
      mist.addColorStop(1, "#070b12");
      ctx.fillStyle = mist;
      ctx.fillRect(0, baseY - gridH * 0.15, W, gridH * 0.15 + 10);

      // Top fade
      const top = ctx.createLinearGradient(0, 0, 0, padTop + 30);
      top.addColorStop(0, "rgba(7,11,18,0.9)");
      top.addColorStop(1, "transparent");
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, W, padTop + 30);

      // Vignette
      const vig = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    // Cleanup
    return () => {
      mountedRef.current = false;
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []); // EMPTY - runs once

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "w-full h-full block"}
      style={{ display: "block" }}
    />
  );
});

export default MountainEngine;