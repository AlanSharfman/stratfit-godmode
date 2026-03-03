// src/components/Risk/RiskTransmissionStrip.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Phase 300: Risk Transmission Strip
//
// Compact horizontal bar showing how risk propagates across 6 threat axes.
// Renders as a segmented heatbar with flow indicators.
// Mounts below the RiskIntelligencePanel or standalone.
//
// DATA SOURCE: useRiskIntelligence().intelligence.threatAxes
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";
import { useRiskIntelligence } from "@/hooks/useRiskIntelligence";
import { getRiskBandColor, getRiskBand } from "@/engine/riskIntelligenceEngine";

// ── Severity to color ──
function axisColor(score: number): string {
  return getRiskBandColor(getRiskBand(score));
}

function trendArrow(trend: "improving" | "stable" | "worsening"): string {
  return trend === "worsening" ? "↗" : trend === "improving" ? "↘" : "→";
}

const RiskTransmissionStrip: React.FC = memo(() => {
  const { intelligence, ready, baselineDelta } = useRiskIntelligence();

  if (!ready || !intelligence) return null;

  const { threatAxes, overallScore, band, bandColor } = intelligence;

  // Sort by score descending — highest risk first
  const sorted = [...threatAxes].sort((a, b) => b.score - a.score);

  // Max bar width reference
  const maxScore = Math.max(...sorted.map((a) => a.score), 1);

  return (
    <div style={{
      padding: "12px 14px",
      background: "rgba(255,255,255,0.015)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 8,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <div style={{
          fontSize: 8,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "rgba(255,255,255,0.35)",
        }}>
          RISK TRANSMISSION
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{
            fontSize: 14,
            fontWeight: 300,
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            color: bandColor,
          }}>
            {overallScore}
          </span>
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: bandColor,
            background: `${bandColor}15`,
            border: `1px solid ${bandColor}30`,
            padding: "2px 6px",
            borderRadius: 2,
          }}>
            {band}
          </span>
          {baselineDelta !== null && baselineDelta !== 0 && (
            <span style={{
              fontSize: 9,
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              color: baselineDelta > 0 ? "#ef4444" : "#34d399",
            }}>
              {baselineDelta > 0 ? "+" : ""}{baselineDelta}
            </span>
          )}
        </div>
      </div>

      {/* Threat bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {sorted.map((axis) => {
          const color = axisColor(axis.score);
          const width = (axis.score / maxScore) * 100;
          return (
            <div key={axis.category} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.5)",
                minWidth: 68,
                flexShrink: 0,
              }}>
                {axis.label}
              </span>
              <div style={{
                flex: 1,
                height: 5,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 2.5,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${Math.max(2, width)}%`,
                  background: color,
                  borderRadius: 2.5,
                  transition: "width 0.6s ease",
                  opacity: 0.8,
                }} />
              </div>
              <span style={{
                fontSize: 9,
                fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                color: "rgba(255,255,255,0.4)",
                minWidth: 22,
                textAlign: "right" as const,
              }}>
                {axis.score}
              </span>
              <span style={{
                fontSize: 9,
                color: axis.trend === "worsening" ? "#ef4444" : axis.trend === "improving" ? "#34d399" : "rgba(255,255,255,0.25)",
                minWidth: 10,
              }}>
                {trendArrow(axis.trend)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Propagation note */}
      {sorted[0] && sorted[0].score > 60 && (
        <div style={{
          marginTop: 8,
          fontSize: 9.5,
          color: "rgba(255,255,255,0.35)",
          fontStyle: "italic",
          lineHeight: 1.4,
        }}>
          Primary risk concentration: {sorted[0].label.toLowerCase()} ({sorted[0].score}).
          {sorted[1] && sorted[1].score > 50 ? ` Secondary: ${sorted[1].label.toLowerCase()}.` : ""}
        </div>
      )}
    </div>
  );
});

RiskTransmissionStrip.displayName = "RiskTransmissionStrip";

export default RiskTransmissionStrip;
