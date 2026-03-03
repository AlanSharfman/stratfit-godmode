// src/components/Risk/RiskDeltaBadge.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Phase 300: Risk Delta Badge
//
// Compact inline badge showing scenario risk vs baseline risk delta.
// Use inside any panel header or KPI rail.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";
import { useRiskIntelligence } from "@/hooks/useRiskIntelligence";
import { getRiskBandColor, getRiskBand } from "@/engine/riskIntelligenceEngine";

interface RiskDeltaBadgeProps {
  /** Show full score + band, not just delta */
  showScore?: boolean;
  /** Compact mode: smaller font, inline */
  compact?: boolean;
}

const RiskDeltaBadge: React.FC<RiskDeltaBadgeProps> = memo(({
  showScore = false,
  compact = false,
}) => {
  const { intelligence, ready, baselineDelta } = useRiskIntelligence();

  if (!ready || !intelligence) return null;

  const { overallScore, band, bandColor } = intelligence;
  const fontSize = compact ? 9 : 11;
  const padding = compact ? "2px 6px" : "3px 10px";

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: compact ? 4 : 6,
      fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
    }}>
      {showScore && (
        <>
          <span style={{ fontSize, fontWeight: 500, color: bandColor }}>
            {overallScore}
          </span>
          <span style={{
            fontSize: compact ? 7 : 8,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: bandColor,
            background: `${bandColor}12`,
            border: `1px solid ${bandColor}25`,
            padding,
            borderRadius: 2,
          }}>
            {band}
          </span>
        </>
      )}
      {baselineDelta !== null && baselineDelta !== 0 && (
        <span style={{
          fontSize,
          fontWeight: 600,
          color: baselineDelta > 0 ? "#ef4444" : "#34d399",
          background: baselineDelta > 0 ? "rgba(239,68,68,0.08)" : "rgba(52,211,153,0.08)",
          border: `1px solid ${baselineDelta > 0 ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)"}`,
          padding,
          borderRadius: 2,
        }}>
          {baselineDelta > 0 ? "▲" : "▼"} {Math.abs(baselineDelta)}
        </span>
      )}
    </span>
  );
});

RiskDeltaBadge.displayName = "RiskDeltaBadge";

export default RiskDeltaBadge;
