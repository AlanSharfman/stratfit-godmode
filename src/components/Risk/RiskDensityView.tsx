// src/components/Risk/RiskDensityView.tsx
// STRATFIT — Risk Density heat strip over time
// X = months (0–36), color intensity = risk concentration
// Derived from existing timeline array. No new simulation.

import React, { useMemo, useRef, useEffect } from "react";
import styles from "./RiskPage.module.css";
import type { RiskHorizon } from "./RiskHorizonToggle";

interface RiskDensityViewProps {
  timeline: { month: number; risk: number }[];
  horizon: RiskHorizon;
}

function getHorizonRange(horizon: RiskHorizon): [number, number] {
  switch (horizon) {
    case "short": return [0, 6];
    case "mid": return [6, 18];
    case "long": return [18, 36];
  }
}

const RiskDensityView: React.FC<RiskDensityViewProps> = ({ timeline, horizon }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [start, end] = getHorizonRange(horizon);

  const filteredTimeline = useMemo(
    () => timeline.filter((t) => t.month >= start && t.month <= end),
    [timeline, start, end]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || filteredTimeline.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const months = end - start;
    const cellWidth = w / months;

    filteredTimeline.forEach((t) => {
      const x = ((t.month - start) / months) * w;
      const riskNorm = Math.min(1, t.risk / 100);

      // Color ramp: teal (low) → amber (mid) → red (high)
      let r: number, g: number, b: number;
      if (riskNorm < 0.4) {
        // Teal → neutral
        const t2 = riskNorm / 0.4;
        r = Math.round(0 + t2 * 60);
        g = Math.round(224 - t2 * 140);
        b = Math.round(255 - t2 * 180);
      } else if (riskNorm < 0.65) {
        // Neutral → amber
        const t2 = (riskNorm - 0.4) / 0.25;
        r = Math.round(60 + t2 * 191);
        g = Math.round(84 + t2 * 107);
        b = Math.round(75 - t2 * 39);
      } else {
        // Amber → red
        const t2 = (riskNorm - 0.65) / 0.35;
        r = Math.round(251 + t2 * 4);
        g = Math.round(191 - t2 * 114);
        b = Math.round(36 + t2 * 41);
      }

      const alpha = 0.15 + riskNorm * 0.5;

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(x, 0, cellWidth + 1, h);

      // Risk value text at top
      if (filteredTimeline.length <= 18 || t.month % 3 === 0) {
        ctx.fillStyle = `rgba(255,255,255,${0.2 + riskNorm * 0.4})`;
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${t.risk}`, x + cellWidth / 2, h / 2 + 3);
      }
    });
  }, [filteredTimeline, start, end]);

  return (
    <div className={styles.densityContainer}>
      <div className={styles.densityHeader}>Risk Density — {start}–{end} Months</div>
      <div className={styles.densityStrip}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
      <div className={styles.densityAxis}>
        <span className={styles.densityAxisLabel}>{start}m</span>
        <span className={styles.densityAxisLabel}>{Math.round((start + end) / 2)}m</span>
        <span className={styles.densityAxisLabel}>{end}m</span>
      </div>
    </div>
  );
};

export default RiskDensityView;





