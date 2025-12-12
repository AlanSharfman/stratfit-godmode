import React, { useEffect, useMemo, useRef } from "react";

export type ScenarioKey = "base" | "upside" | "downside" | "extreme";

type Density = "compact" | "full";

export interface MountainEngineProps {
  dataPoints: number[];           // 0..100
  activeKPIIndex: number | null;  // highlight point
  scenario: ScenarioKey;
  density?: Density;
}

/**
 * KEY JITTER FIXES:
 * - Canvas is resized via ResizeObserver, but debounced to 1 frame.
 * - Draw loop runs on RAF, interpolating toward target points (no "jump on slider").
 * - We avoid re-creating contexts / gradients on every render.
 * - We hard-clip to container and never exceed bounds.
 */
export default function MountainEngine({
  dataPoints,
  activeKPIIndex,
  scenario,
  density = "full",
}: MountainEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const theme = useMemo(() => {
    const base = {
      bgTop: "rgba(0,0,0,0.18)",
      bgBottom: "rgba(0,0,0,0.55)",
      grid: "rgba(255,255,255,0.06)",
      glow: "rgba(0, 255, 210, 0.35)",
      line: "rgba(0, 255, 210, 0.75)",
      line2: "rgba(0, 255, 210, 0.38)",
      dot: "rgba(220,255,248,0.95)",
    };

    if (scenario === "upside") {
      return { ...base, glow: "rgba(0, 255, 210, 0.35)", line: "rgba(0, 255, 210, 0.78)", line2: "rgba(0, 255, 210, 0.40)" };
    }
    if (scenario === "downside") {
      return { ...base, glow: "rgba(255, 90, 140, 0.28)", line: "rgba(255, 90, 140, 0.72)", line2: "rgba(255, 90, 140, 0.38)", dot: "rgba(255,230,240,0.95)" };
    }
    if (scenario === "extreme") {
      return { ...base, glow: "rgba(180, 120, 255, 0.30)", line: "rgba(180, 120, 255, 0.76)", line2: "rgba(180, 120, 255, 0.38)", dot: "rgba(245,235,255,0.95)" };
    }
    return { ...base, glow: "rgba(120, 210, 255, 0.28)", line: "rgba(120, 210, 255, 0.75)", line2: "rgba(120, 210, 255, 0.38)" };
  }, [scenario]);

  // Normalize points to stable length and bounds.
  const target = useMemo(() => {
    const safe = (Array.isArray(dataPoints) ? dataPoints : []).map((v) => {
      const n = typeof v === "number" ? v : 0;
      return Math.max(0, Math.min(100, n));
    });
    // Ensure at least 4 points so the mountain never degenerates.
    while (safe.length < 4) safe.push(50);
    // Cap max count for sanity.
    return safe.slice(0, 14);
  }, [dataPoints]);

  const animRef = useRef<number | null>(null);
  const currentRef = useRef<number[]>([]);
  const sizeRef = useRef<{ w: number; h: number; dpr: number }>({ w: 0, h: 0, dpr: 1 });
  const pendingResizeRef = useRef<number | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const cr = entry?.contentRect;
      if (!cr) return;

      // Debounce to 1 animation frame (prevents resize loop jitter).
      if (pendingResizeRef.current != null) return;
      pendingResizeRef.current = requestAnimationFrame(() => {
        pendingResizeRef.current = null;
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const w = Math.max(1, Math.floor(cr.width));
        const h = Math.max(1, Math.floor(cr.height));
        sizeRef.current = { w, h, dpr };
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      });
    });

    ro.observe(wrapper);
    return () => {
      ro.disconnect();
      if (pendingResizeRef.current != null) cancelAnimationFrame(pendingResizeRef.current);
    };
  }, []);

  useEffect(() => {
    // Initialize current points to avoid first-frame pop.
    if (currentRef.current.length === 0) {
      currentRef.current = target.slice();
    } else if (currentRef.current.length !== target.length) {
      // Smoothly remap length changes.
      const prev = currentRef.current.slice();
      const next: number[] = [];
      for (let i = 0; i < target.length; i++) {
        next.push(prev[Math.min(i, prev.length - 1)] ?? 50);
      }
      currentRef.current = next;
    }
  }, [target]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let last = performance.now();

    const draw = (now: number) => {
      const { w, h, dpr } = sizeRef.current;
      if (w <= 0 || h <= 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;

      // Interpolate toward target points (stability + smoothness).
      const cur = currentRef.current;
      const speed = density === "compact" ? 10 : 8; // slightly faster in compact thumbnails
      for (let i = 0; i < cur.length; i++) {
        const t = target[i] ?? 50;
        cur[i] += (t - cur[i]) * (1 - Math.exp(-speed * dt));
      }

      const cw = canvas.width;
      const ch = canvas.height;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.scale(dpr, dpr);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, theme.bgTop);
      bg.addColorStop(1, theme.bgBottom);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gridCount = density === "compact" ? 3 : 5;
      for (let i = 1; i <= gridCount; i++) {
        const y = (h / (gridCount + 1)) * i;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Layout
      const padX = density === "compact" ? 10 : 18;
      const padY = density === "compact" ? 10 : 18;
      const innerW = Math.max(1, w - padX * 2);
      const innerH = Math.max(1, h - padY * 2);
      const n = cur.length;

      const pts = new Array(n).fill(0).map((_, i) => {
        const x = padX + (innerW * i) / (n - 1);
        // Mountain range: keep within bounds, never exceed.
        const v = cur[i] / 100;
        const y = padY + (1 - v) * innerH;
        return { x, y, v: cur[i] };
      });

      // Optional active marker vertical guide
      if (activeKPIIndex != null && activeKPIIndex >= 0 && activeKPIIndex < pts.length) {
        const px = pts[activeKPIIndex].x;
        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(px, padY);
        ctx.lineTo(px, h - padY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Smooth polyline
      const smooth = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];

      // Draw glow layers (outer -> inner)
      const drawLine = (width: number, color: string, alpha: number) => {
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();

        for (let i = 0; i < n; i++) {
          const p0 = smooth(i - 1);
          const p1 = smooth(i);
          const p2 = smooth(i + 1);
          const cx = (p1.x + p2.x) / 2;
          const cy = (p1.y + p2.y) / 2;

          if (i === 0) ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(p1.x, p1.y, cx, cy);
          // Keep curve stable
          if (i === n - 2) ctx.lineTo(p2.x, p2.y);
          // p0 unused but helps conceptual smoothing if extended later
          void p0;
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      // Glow stack
      drawLine(density === "compact" ? 5 : 10, theme.glow, 0.22);
      drawLine(density === "compact" ? 3 : 6, theme.glow, 0.28);
      drawLine(density === "compact" ? 2 : 3.5, theme.line2, 0.85);
      drawLine(density === "compact" ? 1.6 : 2.4, theme.line, 1);

      // Active dot and subtle pulse
      if (activeKPIIndex != null && activeKPIIndex >= 0 && activeKPIIndex < pts.length) {
        const p = pts[activeKPIIndex];
        const pulse = 0.5 + 0.5 * Math.sin(now / 260);
        const r = (density === "compact" ? 3 : 5) + pulse * (density === "compact" ? 1.2 : 2);

        // Outer glow
        ctx.fillStyle = theme.glow;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.globalAlpha = 1;
        ctx.fillStyle = theme.dot;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Tiny highlight
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.beginPath();
        ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, [target, activeKPIIndex, theme, density]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
