// src/components/compare/SpaghettiCanvas.tsx
// STRATFIT — Fast, investor-grade, non-gamey rendering

import React, { useEffect, useMemo, useRef } from "react";

type Bands = { p05: number[]; p50: number[]; p95: number[] };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function dpr() {
  return typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
}

export function SpaghettiCanvas({
  runsA,
  runsB,
  bandsA,
  bandsB,
  tIndex,
  yLabel = "",
}: {
  runsA: number[][];
  runsB: number[][];
  bandsA: Bands;
  bandsB: Bands;
  tIndex: number;
  yLabel?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  const steps = runsA[0]?.length ?? 0;

  const yDomain = useMemo(() => {
    // Use global p05/p95 across A+B for stable scaling
    let lo = Infinity;
    let hi = -Infinity;
    for (let t = 0; t < steps; t++) {
      lo = Math.min(lo, bandsA.p05[t], bandsB.p05[t]);
      hi = Math.max(hi, bandsA.p95[t], bandsB.p95[t]);
    }
    // padding
    const pad = (hi - lo) * 0.08;
    return { lo: lo - pad, hi: hi + pad };
  }, [bandsA, bandsB, steps]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const W = parent.clientWidth;
    const H = parent.clientHeight;
    const DPR = dpr();

    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // --- THEME (institutional) ---
    const bg = "#070f1a";
    const grid = "rgba(148,163,184,0.08)";
    const tick = "rgba(148,163,184,0.35)";
    const text = "rgba(226,232,240,0.80)";

    const cyan = "rgba(34,211,238,0.08)";      // A threads
    const gold = "rgba(234,179,8,0.08)";       // B threads (signal gold)

    const cyanP = "rgba(34,211,238,0.95)";     // percentile strokes
    const goldP = "rgba(234,179,8,0.95)";

    const bandA = "rgba(34,211,238,0.12)";
    const bandB = "rgba(234,179,8,0.12)";

    // --- layout ---
    const padL = 44;
    const padR = 14;
    const padT = 14;
    const padB = 28;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const x = (t: number) => padL + (t / (steps - 1)) * chartW;
    const y = (v: number) => {
      const { lo, hi } = yDomain;
      const n = (v - lo) / (hi - lo);
      return padT + (1 - n) * chartH;
    };

    // --- clear ---
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // --- grid ---
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;

    // vertical grid (T)
    for (let i = 0; i <= 6; i++) {
      const t = Math.round((i / 6) * (steps - 1));
      const X = x(t);
      ctx.beginPath();
      ctx.moveTo(X, padT);
      ctx.lineTo(X, padT + chartH);
      ctx.stroke();
    }

    // horizontal grid (Y)
    for (let i = 0; i <= 5; i++) {
      const Y = padT + (i / 5) * chartH;
      ctx.beginPath();
      ctx.moveTo(padL, Y);
      ctx.lineTo(padL + chartW, Y);
      ctx.stroke();
    }

    // y-axis label
    ctx.fillStyle = tick;
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillText(yLabel, 10, padT + 10);

    // --- draw spaghetti threads (sampled) ---
    // Render subset for perf, still looks dense.
    const drawRuns = (runs: number[][], stroke: string, maxLines: number) => {
      const n = runs.length;
      const stride = Math.max(1, Math.floor(n / maxLines));
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;

      for (let r = 0; r < n; r += stride) {
        const row = runs[r];
        ctx.beginPath();
        ctx.moveTo(x(0), y(row[0]));
        for (let t = 1; t < steps; t++) ctx.lineTo(x(t), y(row[t]));
        ctx.stroke();
      }
    };

    drawRuns(runsA, cyan, 260);
    drawRuns(runsB, gold, 260);

    // --- band fill (P05..P95) ---
    const fillBand = (b: Bands, fill: string) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(x(0), y(b.p05[0]));
      for (let t = 1; t < steps; t++) ctx.lineTo(x(t), y(b.p05[t]));
      for (let t = steps - 1; t >= 0; t--) ctx.lineTo(x(t), y(b.p95[t]));
      ctx.closePath();
      ctx.fill();
    };
    fillBand(bandsA, bandA);
    fillBand(bandsB, bandB);

    // --- percentile lines ---
    const drawLine = (vals: number[], stroke: string, width: number) => {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x(0), y(vals[0]));
      for (let t = 1; t < steps; t++) ctx.lineTo(x(t), y(vals[t]));
      ctx.stroke();
    };

    drawLine(bandsA.p50, cyanP, 2.0);
    drawLine(bandsB.p50, goldP, 2.0);

    ctx.setLineDash([6, 5]);
    drawLine(bandsA.p05, "rgba(34,211,238,0.55)", 1.2);
    drawLine(bandsA.p95, "rgba(34,211,238,0.55)", 1.2);
    drawLine(bandsB.p05, "rgba(234,179,8,0.55)", 1.2);
    drawLine(bandsB.p95, "rgba(234,179,8,0.55)", 1.2);
    ctx.setLineDash([]);

    // --- current time marker ---
    const X = x(clamp(tIndex, 0, steps - 1));
    ctx.strokeStyle = "rgba(226,232,240,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X, padT);
    ctx.lineTo(X, padT + chartH);
    ctx.stroke();

    // marker dots at medians
    const yA = y(bandsA.p50[tIndex]);
    const yB = y(bandsB.p50[tIndex]);

    const dot = (yy: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(X, yy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    };
    dot(yA, cyanP);
    dot(yB, goldP);

    // labels
    ctx.fillStyle = text;
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillText(`T+${tIndex}`, X + 6, padT + 12);
  }, [runsA, runsB, bandsA, bandsB, tIndex, steps, yDomain, yLabel]);

  return <canvas ref={ref} className="block w-full h-full" />;
}
