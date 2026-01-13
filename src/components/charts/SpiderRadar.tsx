import React, { useMemo } from "react";
import styles from "./SpiderRadar.module.css";
import type { SpiderAxis } from "@/logic/spiderFitness";

type Props = {
  title?: string;
  base: SpiderAxis[];
  scenario: SpiderAxis[];
  note?: string;
};

function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function toPoints(axes: SpiderAxis[], cx: number, cy: number, R: number) {
  const n = axes.length;
  const start = -Math.PI / 2; // top
  return axes.map((ax, i) => {
    const a = start + (i * 2 * Math.PI) / n;
    const r = (Math.max(0, Math.min(100, ax.value)) / 100) * R;
    return polar(cx, cy, r, a);
  });
}

function pathFrom(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} ` +
    points.slice(1).map(p => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") +
    " Z";
}

export function SpiderRadar({ title = "Strategic Fitness Profile", base, scenario, note }: Props) {
  const axes = scenario.length ? scenario : base;

  const W = 420;
  const H = 320;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const R = 120;

  const rings = [0.45, 0.70, 1.0]; // red→amber→green boundaries

  const basePts = useMemo(() => toPoints(base, cx, cy, R), [base]);
  const scenPts = useMemo(() => toPoints(scenario, cx, cy, R), [scenario]);

  const basePath = useMemo(() => pathFrom(basePts), [basePts]);
  const scenPath = useMemo(() => pathFrom(scenPts), [scenPts]);

  const axisLines = useMemo(() => {
    const n = axes.length;
    const start = -Math.PI / 2;
    return axes.map((ax, i) => {
      const a = start + (i * 2 * Math.PI) / n;
      const p = polar(cx, cy, R, a);
      const labelP = polar(cx, cy, R + 30, a);
      return { ax, end: p, label: labelP };
    });
  }, [axes]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.legend}>
          <span className={styles.key}>
            <span className={styles.swatch} style={{ background: "rgba(255,255,255,0.40)" }} />
            Base
          </span>
          <span className={styles.key}>
            <span className={styles.swatch} style={{ background: "rgba(34,211,238,0.90)" }} />
            Scenario
          </span>
        </div>
      </div>

      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Strategic fitness spider chart">
        {/* rings */}
        {rings.map((k, idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={R * k}
            fill="none"
            stroke={idx === 0 ? "rgba(248,113,113,0.20)" : idx === 1 ? "rgba(251,191,36,0.18)" : "rgba(52,211,153,0.14)"}
            strokeWidth={1}
          />
        ))}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(120,180,255,0.10)" strokeWidth={1} />

        {/* axes */}
        {axisLines.map((l) => (
          <line
            key={l.ax.key}
            x1={cx}
            y1={cy}
            x2={l.end.x}
            y2={l.end.y}
            stroke="rgba(120,180,255,0.10)"
            strokeWidth={1}
          />
        ))}

        {/* base polygon */}
        <path d={basePath} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.38)" strokeWidth={1.25} />

        {/* scenario polygon */}
        <path d={scenPath} fill="rgba(34,211,238,0.12)" stroke="rgba(34,211,238,0.85)" strokeWidth={2} />

        {/* points */}
        {scenPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="rgba(34,211,238,0.95)" />
        ))}

        {/* labels */}
        {axisLines.map((l) => (
          <g key={l.ax.key}>
            <text
              x={l.label.x}
              y={l.label.y}
              textAnchor="middle"
              fontSize="11"
              fill="rgba(210,245,255,0.78)"
              style={{ letterSpacing: "0.06em" }}
            >
              {l.ax.label}
            </text>
          </g>
        ))}
      </svg>

      <div className={styles.footer}>
        <span className={styles.help}>How to read:</span>{" "}
        Shape expanding outward = stronger fitness. Inner red/amber rings highlight where the scenario sits outside safe investor thresholds.
        {note ? ` ${note}` : ""}
      </div>
    </div>
  );
}

