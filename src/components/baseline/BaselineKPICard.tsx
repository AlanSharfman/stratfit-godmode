import React, { memo } from "react";
import type { HeatResult } from "@/logic/heat/structuralHeatEngine";
import styles from "./BaselineKPI.module.css";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function rgbFromTokenVar(tokenName: string, alpha: number) {
  // CSS Color 4: rgb(from var(--token) r g b / a)
  return `rgb(from var(${tokenName}) r g b / ${alpha})`;
}

export type DeltaTone = "up" | "down" | "flat";

export interface BaselineKPICardProps {
  label: string;
  value: string;
  sub: string;
  heat: HeatResult;
  tooltip: string;
  delta?: { tone: DeltaTone; text: string };
}

const BaselineKPICard: React.FC<BaselineKPICardProps> = memo((props) => {
  const tokenVar = props.heat.color;
  const glowAlpha = clamp(props.heat.glowOpacity, 0, 0.35);

  const glow = rgbFromTokenVar(tokenVar, glowAlpha);
  const border = rgbFromTokenVar(tokenVar, 0.22);
  const surface = rgbFromTokenVar(tokenVar, 0.10);
  const valueTint = rgbFromTokenVar(tokenVar, 0.92);

  const deltaColor =
    props.delta?.tone === "up"
      ? rgbFromTokenVar("--heat-strong", 0.85)
      : props.delta?.tone === "down"
        ? rgbFromTokenVar("--heat-weak", 0.85)
        : "rgba(255, 255, 255, 0.35)";

  return (
    <div
      className={styles.card}
      style={{
        borderLeftColor: "rgba(255,255,255,0.06)",
        boxShadow: `0 0 18px -12px ${glow}, 0 10px 22px -18px ${glow}`,
        borderBottom: `1px solid ${border}`,
        background: `linear-gradient(180deg, ${surface}, rgba(0,0,0,0)), radial-gradient(600px 120px at 50% 10%, rgba(255,255,255,0.05), transparent 58%)`,
      }}
    >
      <div className={styles.label}>{props.label}</div>

      <div className={styles.valueRow}>
        <div className={styles.value} style={{ color: valueTint, textShadow: `0 0 14px ${rgbFromTokenVar(tokenVar, 0.22)}` }}>
          {props.value}
        </div>
        {props.delta ? (
          <div className={styles.delta} style={{ color: deltaColor }}>
            {props.delta.text}
          </div>
        ) : null}
      </div>

      <div className={styles.sub}>{props.sub}</div>

      <div
        className={styles.heatLine}
        style={{
          background: `linear-gradient(90deg, transparent, ${rgbFromTokenVar(tokenVar, 0.55)}, ${rgbFromTokenVar(tokenVar, 0.90)}, ${rgbFromTokenVar(tokenVar, 0.55)}, transparent)`,
          boxShadow: `0 0 14px -8px ${glow}`,
        }}
      />

      <div
        className={styles.tooltip}
        style={{
          borderColor: rgbFromTokenVar(tokenVar, 0.18),
          boxShadow: `0 18px 50px rgba(0,0,0,0.55), 0 0 22px -16px ${glow}`,
        }}
      >
        {props.tooltip}
      </div>
    </div>
  );
});

BaselineKPICard.displayName = "BaselineKPICard";
export default BaselineKPICard;


