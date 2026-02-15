// src/components/valuation/ValuationDriverSpider.tsx
// STRATFIT — Layer 4: Valuation Driver Spider Map
// 6-axis radar: Growth, Margin, Retention, Capital Efficiency, Market Position, Risk Stability
// Overlay: Baseline (thin white) + Scenario (cyan fill). No heavy gradients.

import { useMemo } from "react";
import styles from "./ValuationPage.module.css";

interface DriverAxis {
  label: string;
  baseline: number; // 0–100
  scenario: number; // 0–100
}

interface ValuationDriverSpiderProps {
  axes: DriverAxis[];
}

const RADIUS = 110;
const CX = 150;
const CY = 140;

function polarToCart(angleDeg: number, r: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

export default function ValuationDriverSpider({ axes }: ValuationDriverSpiderProps) {
  const n = axes.length;
  const angleStep = 360 / n;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const baselinePath = useMemo(() => {
    return axes
      .map((a, i) => {
        const [x, y] = polarToCart(i * angleStep, (a.baseline / 100) * RADIUS);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z";
  }, [axes, angleStep]);

  const scenarioPath = useMemo(() => {
    return axes
      .map((a, i) => {
        const [x, y] = polarToCart(i * angleStep, (a.scenario / 100) * RADIUS);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z";
  }, [axes, angleStep]);

  return (
    <div className={`${styles.panel} ${styles.spiderWrap}`}>
      <div className={styles.panelTitle}>Valuation Driver Map</div>

      <svg className={styles.spiderSvg} viewBox="0 0 300 280">
        {/* Grid rings */}
        {gridLevels.map((level) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const [x, y] = polarToCart(i * angleStep, level * RADIUS);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ");
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const [x, y] = polarToCart(i * angleStep, RADIUS);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Baseline polygon */}
        <polygon
          points={baselinePath.replace(/[MLZ]/g, " ").trim()}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />

        {/* Scenario polygon */}
        <polygon
          points={scenarioPath.replace(/[MLZ]/g, " ").trim()}
          fill="rgba(0,224,255,0.1)"
          stroke="#00E0FF"
          strokeWidth="1.5"
        />

        {/* Scenario dots */}
        {axes.map((a, i) => {
          const [x, y] = polarToCart(i * angleStep, (a.scenario / 100) * RADIUS);
          return <circle key={i} cx={x} cy={y} r="3" fill="#00E0FF" />;
        })}

        {/* Labels */}
        {axes.map((a, i) => {
          const [x, y] = polarToCart(i * angleStep, RADIUS + 18);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.5)"
              fontSize="9"
              fontFamily="Inter, sans-serif"
              letterSpacing="0.04em"
            >
              {a.label.toUpperCase()}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className={styles.spiderLegend}>
        <div className={styles.spiderLegendItem}>
          <span
            className={styles.spiderLegendDot}
            style={{ background: "rgba(255,255,255,0.4)", border: "1px dashed rgba(255,255,255,0.4)" }}
          />
          Baseline
        </div>
        <div className={styles.spiderLegendItem}>
          <span className={styles.spiderLegendDot} style={{ background: "#00E0FF" }} />
          Scenario
        </div>
      </div>
    </div>
  );
}





