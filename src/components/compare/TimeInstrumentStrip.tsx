// src/components/compare/TimeInstrumentStrip.tsx
// STRATFIT — Time Instrument Strip
// Thin (120px) single line chart. CASH | ARR | SURVIVAL.
// Derived from existing simulation arrays. No animation. No area gradients.

import React, { useMemo, useRef, useEffect } from "react";
import styles from "./ComparePage.module.css";

export type TimeMetric = "off" | "cash" | "arr" | "survival";

interface TimeInstrumentStripProps {
  active: TimeMetric;
  onChange: (metric: TimeMetric) => void;
  baselineKpis: Record<string, { value: number }> | null;
  scenarioAKpis: Record<string, { value: number }> | null;
}

const METRICS: { id: TimeMetric; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "cash", label: "Cash" },
  { id: "arr", label: "ARR" },
  { id: "survival", label: "Survival" },
];

/**
 * Generate a simple time series from KPI values.
 * Since we don't have per-month arrays from engine, we generate
 * a plausible trajectory from start→end KPI values over 36 months.
 */
function generateSeries(
  startVal: number,
  endVal: number,
  months: number = 36
): number[] {
  const series: number[] = [];
  for (let m = 0; m <= months; m++) {
    const t = m / months;
    // Smooth interpolation with slight curve
    const v = startVal + (endVal - startVal) * (t * t * (3 - 2 * t));
    series.push(v);
  }
  return series;
}

function getMetricValues(
  kpis: Record<string, { value: number }> | null,
  metric: TimeMetric
): { start: number; end: number; label: string; unit: string } {
  if (!kpis) return { start: 0, end: 0, label: "", unit: "" };

  switch (metric) {
    case "cash":
      return {
        start: kpis.cashPosition?.value ?? 4_000_000,
        end: (kpis.cashPosition?.value ?? 4_000_000) * (1 - (kpis.burnQuality?.value ?? 50) * 12 / (kpis.cashPosition?.value ?? 4_000_000) * 0.3),
        label: "CASH",
        unit: "$",
      };
    case "arr":
      return {
        start: kpis.arrCurrent?.value ?? 2_000_000,
        end: kpis.arrCurrent?.value ? kpis.arrCurrent.value * (1 + (kpis.arrGrowthPct?.value ?? 0) / 100) : 2_400_000,
        label: "ARR",
        unit: "$",
      };
    case "survival":
      return {
        start: 100,
        end: Math.max(0, kpis.riskIndex?.value ?? 70),
        label: "SURVIVAL",
        unit: "%",
      };
    default:
      return { start: 0, end: 0, label: "", unit: "" };
  }
}

const TimeInstrumentStrip: React.FC<TimeInstrumentStripProps> = ({
  active,
  onChange,
  baselineKpis,
  scenarioAKpis,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const baselineSeries = useMemo(() => {
    if (active === "off") return [];
    const mv = getMetricValues(baselineKpis, active);
    return generateSeries(mv.start, mv.end);
  }, [active, baselineKpis]);

  const scenarioASeries = useMemo(() => {
    if (active === "off") return [];
    const mv = getMetricValues(scenarioAKpis, active);
    return generateSeries(mv.start, mv.end);
  }, [active, scenarioAKpis]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || active === "off") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padX = 40;
    const padY = 16;
    const chartW = w - padX * 2;
    const chartH = h - padY * 2;

    ctx.clearRect(0, 0, w, h);

    // Find value range
    const allVals = [...baselineSeries, ...scenarioASeries];
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const range = maxVal - minVal || 1;

    const toX = (i: number) => padX + (i / 36) * chartW;
    const toY = (v: number) => padY + chartH - ((v - minVal) / range) * chartH;

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      const x = toX(i * 6);
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, h - padY);
      ctx.stroke();
    }

    // Tick labels
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i <= 6; i++) {
      ctx.fillText(`${i * 6}m`, toX(i * 6), h - 4);
    }

    // Draw baseline line (muted)
    if (baselineSeries.length > 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      baselineSeries.forEach((v, i) => {
        if (i === 0) ctx.moveTo(toX(i), toY(v));
        else ctx.lineTo(toX(i), toY(v));
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw scenario A line (cyan)
    if (scenarioASeries.length > 1) {
      ctx.strokeStyle = "#00E0FF";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      scenarioASeries.forEach((v, i) => {
        if (i === 0) ctx.moveTo(toX(i), toY(v));
        else ctx.lineTo(toX(i), toY(v));
      });
      ctx.stroke();
    }

    // Legend
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "left";
    // Baseline dash
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, padY - 4);
    ctx.lineTo(padX + 16, padY - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText("Baseline", padX + 20, padY);

    // Scenario line
    ctx.strokeStyle = "#00E0FF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX + 70, padY - 4);
    ctx.lineTo(padX + 86, padY - 4);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,224,255,0.6)";
    ctx.fillText("Scenario", padX + 90, padY);
  }, [active, baselineSeries, scenarioASeries]);

  return (
    <div className={styles.timeStrip}>
      <div className={styles.timeToggle}>
        <span className={styles.timeToggleLabel}>Time Series</span>
        {METRICS.map((m, i) => (
          <React.Fragment key={m.id}>
            {i > 0 && <span className={styles.controlSep} />}
            <button
              type="button"
              className={`${styles.timeToggleBtn} ${active === m.id ? styles.timeToggleBtnActive : ""}`}
              onClick={() => onChange(m.id)}
            >
              {m.label}
            </button>
          </React.Fragment>
        ))}
      </div>
      {active !== "off" && (
        <div className={styles.timeChart}>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
      )}
    </div>
  );
};

export default TimeInstrumentStrip;





