// src/components/compare/DivergenceField.tsx
// STRATFIT — Divergence Field Visualization

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { CompareDataset } from "./types";

type Props = {
  data: CompareDataset;
  monthIndex: number;      // current scrub index
  onScrub: (idx: number) => void;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function fmtMoney(n: number, metric: CompareDataset["metric"]) {
  if (metric === "RUNWAY") return `${Math.max(0, n).toFixed(0)} mo`;
  // assume $M for ARR/CASH for MVP mock
  return `$${n.toFixed(1)}M`;
}

export function DivergenceField({ data, monthIndex, onScrub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [breath, setBreath] = useState(0);

  // subtle "breathing" (controlled, not gamey)
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      setBreath((Math.sin(t * 1.15) + 1) * 0.5); // 0..1
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const N = data.months.length;

  const stats = useMemo(() => {
    const i = clamp(monthIndex, 0, N - 1);
    const a = data.baseline.p50[i];
    const b = data.exploration.p50[i];
    const delta = b - a;

    // confidence proxy: narrower bands = higher confidence
    const bandA = Math.abs(data.baseline.p95[i] - data.baseline.p5[i]);
    const bandB = Math.abs(data.exploration.p95[i] - data.exploration.p5[i]);
    const band = (bandA + bandB) * 0.5;

    // map band to confidence (MVP heuristic)
    const conf = clamp(1 - band / Math.max(0.0001, Math.abs(b) + Math.abs(a)), 0, 1);
    const confidencePct = Math.round(lerp(58, 92, conf)); // keep sane range

    // break-even: first month where exploration median > baseline median
    let breakeven = -1;
    for (let k = 0; k < N; k++) {
      if (data.exploration.p50[k] > data.baseline.p50[k]) {
        breakeven = data.months[k];
        break;
      }
    }

    return {
      a, b, delta, confidencePct, breakeven,
    };
  }, [data, monthIndex, N]);

  // drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = wrap.getBoundingClientRect();

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = rect.width;
    const H = rect.height;

    // background
    ctx.clearRect(0, 0, W, H);

    // instrument frame
    const padL = 56;
    const padR = 22;
    const padT = 18;
    const padB = 44;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    // scale Y from min(p5) to max(p95)
    const minY = Math.min(...data.baseline.p5, ...data.exploration.p5);
    const maxY = Math.max(...data.baseline.p95, ...data.exploration.p95);

    const xAt = (i: number) => padL + (i / (N - 1)) * innerW;
    const yAt = (v: number) => padT + (1 - (v - minY) / Math.max(0.0001, maxY - minY)) * innerH;

    // grid lines (quiet)
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "rgba(148,163,184,0.18)";
    ctx.lineWidth = 1;
    for (let k = 0; k <= 6; k++) {
      const y = padT + (k / 6) * innerH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + innerW, y);
      ctx.stroke();
    }
    for (let k = 0; k <= 6; k++) {
      const x = padL + (k / 6) * innerW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + innerH);
      ctx.stroke();
    }
    ctx.restore();

    // helper to draw band area
    const drawBand = (p5: number[], p95: number[], fill: string, glow: string) => {
      ctx.save();

      // soft glow "breathing"
      const glowAlpha = 0.10 + breath * 0.06;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 22 + breath * 10;
      ctx.fillStyle = fill;

      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = xAt(i);
        const y = yAt(p95[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = N - 1; i >= 0; i--) {
        const x = xAt(i);
        const y = yAt(p5[i]);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.globalAlpha = 1.0;
      ctx.fill();

      // add an extra faint halo pass (controlled)
      ctx.shadowBlur = 36 + breath * 12;
      ctx.globalAlpha = glowAlpha;
      ctx.fill();

      ctx.restore();
    };

    // Baseline band (cyan/ice)
    drawBand(
      data.baseline.p5,
      data.baseline.p95,
      "rgba(34,211,238,0.10)",
      "rgba(34,211,238,0.55)"
    );

    // Exploration band (gold — avoid "orange")
    drawBand(
      data.exploration.p5,
      data.exploration.p95,
      "rgba(234,179,8,0.10)",
      "rgba(234,179,8,0.55)"
    );

    // median lines
    const drawLine = (arr: number[], stroke: string, glow: string, width = 2) => {
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = glow;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = xAt(i);
        const y = yAt(arr[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    drawLine(data.baseline.p50, "rgba(34,211,238,0.95)", "rgba(34,211,238,0.65)", 2.2);
    drawLine(data.exploration.p50, "rgba(234,179,8,0.95)", "rgba(234,179,8,0.65)", 2.2);

    // delta ribbon (gap fill between medians) — this is the "value at stake"
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "rgba(99,102,241,0.28)"; // indigo/violet strategic layer (subtle)
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = xAt(i);
      const y = yAt(Math.max(data.baseline.p50[i], data.exploration.p50[i]));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = N - 1; i >= 0; i--) {
      const x = xAt(i);
      const y = yAt(Math.min(data.baseline.p50[i], data.exploration.p50[i]));
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.shadowColor = "rgba(99,102,241,0.6)";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();

    // scrub cursor line
    const i = clamp(monthIndex, 0, N - 1);
    const cx = xAt(i);

    ctx.save();
    ctx.strokeStyle = "rgba(226,232,240,0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(cx, padT);
    ctx.lineTo(cx, padT + innerH);
    ctx.stroke();
    ctx.restore();

    // hover cursor (if user hovering somewhere else)
    if (hoverX != null) {
      ctx.save();
      ctx.strokeStyle = "rgba(148,163,184,0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.moveTo(hoverX, padT);
      ctx.lineTo(hoverX, padT + innerH);
      ctx.stroke();
      ctx.restore();
    }

    // axis labels
    ctx.save();
    ctx.fillStyle = "rgba(148,163,184,0.75)";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
    ctx.fillText("NOW", padL, H - 18);
    ctx.fillText("HORIZON", padL + innerW - 64, H - 18);
    ctx.restore();

    // left scale ticks (few, calm)
    ctx.save();
    ctx.fillStyle = "rgba(148,163,184,0.65)";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
    for (let k = 0; k <= 3; k++) {
      const v = lerp(minY, maxY, 1 - k / 3);
      const y = yAt(v);
      ctx.fillText(fmtMoney(v, data.metric), 10, y + 4);
    }
    ctx.restore();
  }, [data, monthIndex, hoverX, breath, N]);

  // mouse -> scrub
  function handlePointer(e: React.PointerEvent) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // map x to index based on inner plot region
    const padL = 56;
    const padR = 22;
    const innerW = rect.width - padL - padR;

    const t = clamp((x - padL) / Math.max(1, innerW), 0, 1);
    const idx = Math.round(t * (N - 1));
    onScrub(idx);
  }

  function handleMove(e: React.PointerEvent) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHoverX(e.clientX - rect.left);
  }

  function handleLeave() {
    setHoverX(null);
  }

  return (
    <div className="relative w-full h-full">
      {/* Top inline "truth strip" (surgical, not dashboardy) */}
      <div className="absolute left-6 top-4 z-20 flex items-center gap-3">
        <div className="px-3 py-2 rounded-xl border border-slate-800/70 bg-black/35 backdrop-blur">
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Baseline (Median)</div>
          <div className="mt-1 font-semibold text-slate-100">{fmtMoney(stats.a, data.metric)}</div>
        </div>

        <div className="px-3 py-2 rounded-xl border border-slate-800/70 bg-black/35 backdrop-blur">
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Exploration (Median)</div>
          <div className="mt-1 font-semibold text-slate-100">{fmtMoney(stats.b, data.metric)}</div>
        </div>

        <div className="px-3 py-2 rounded-xl border border-slate-800/70 bg-black/35 backdrop-blur">
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Decision Delta</div>
          <div className={clsx("mt-1 font-semibold", stats.delta >= 0 ? "text-emerald-300" : "text-red-300")}>
            {stats.delta >= 0 ? "+" : ""}
            {data.metric === "RUNWAY" ? `${stats.delta.toFixed(0)} mo` : `$${stats.delta.toFixed(1)}M`}
          </div>
        </div>

        <div className="px-3 py-2 rounded-xl border border-slate-800/70 bg-black/35 backdrop-blur">
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Confidence</div>
          <div className="mt-1 font-semibold text-slate-100">{stats.confidencePct}%</div>
        </div>

        <div className="hidden md:block px-3 py-2 rounded-xl border border-slate-800/70 bg-black/35 backdrop-blur">
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Break-even</div>
          <div className="mt-1 font-semibold text-slate-100">
            {stats.breakeven >= 0 ? `T+${stats.breakeven}` : "—"}
          </div>
        </div>
      </div>

      {/* Canvas Field */}
      <div
        ref={wrapRef}
        className="absolute inset-0 rounded-2xl border border-slate-800/60 bg-gradient-to-b from-[#050b14] via-black to-[#050b14] overflow-hidden"
        onPointerDown={handlePointer}
        onPointerMove={(e) => {
          handleMove(e);
          if (e.buttons === 1) handlePointer(e);
        }}
        onPointerLeave={handleLeave}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        {/* Labels */}
        <div className="absolute left-6 bottom-20 text-[11px] tracking-[0.22em] uppercase text-cyan-300/85">
          BASELINE
        </div>
        <div className="absolute right-6 bottom-20 text-[11px] tracking-[0.22em] uppercase text-amber-300/85">
          EXPLORATION
        </div>

        {/* Timeline scrub UI */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[min(720px,92%)]">
          <div className="flex items-center justify-between text-[10px] tracking-[0.22em] uppercase text-slate-400">
            <span>Timeline</span>
            <span className="text-slate-300">T+{data.months[monthIndex]}</span>
          </div>
          <input
            type="range"
            min={0}
            max={N - 1}
            value={monthIndex}
            onChange={(e) => onScrub(parseInt(e.target.value, 10))}
            className="w-full mt-2 accent-cyan-300"
          />
        </div>
      </div>
    </div>
  );
}
