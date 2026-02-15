// src/pages/terrain/TerrainOverlays/SensitivityNodes.tsx
// STRATFIT — Sensitivity Nodes ("Orbs") — ALWAYS VISIBLE with Labels
// 3–5 small nodes at key meaning points. 8px. Subtle cyan.
// Labels permanently visible. Tooltip on hover for detail. No hide-on-idle.

import React, { useState, useMemo, useCallback } from "react";
import OverlayTooltip from "./OverlayTooltip";

interface NodeDef {
  id: string;
  label: string;
  shortLabel: string; // Always-visible label (2–3 words)
  value: string;      // Always-visible value
  description: string;
  /** Position in % of container (0–100) */
  x: number;
  y: number;
}

interface SensitivityNodesProps {
  enabled: boolean;
  dataPoints: number[];  // 7-vector normalized 0–1
  riskScore: number;
  runway: number;
  ltvCac: number;
  survivalPct: number;
}

/**
 * Derive node positions and content from real engine outputs.
 * Labels are ALWAYS visible. Hover expands detail.
 */
function buildNodes(
  dataPoints: number[],
  riskScore: number,
  runway: number,
  ltvCac: number,
  survivalPct: number
): NodeDef[] {
  const dp = dataPoints.length >= 7 ? dataPoints : [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

  // Map 7-vector positions with padding
  const padX = 10;
  const padY = 18;
  const rangeX = 100 - 2 * padX;
  const rangeY = 100 - 2 * padY;

  const px = (i: number) => padX + (i / 6) * rangeX;
  const py = (v: number) => (100 - padY) - v * rangeY;

  const nodes: NodeDef[] = [
    {
      id: "revenue",
      label: "Revenue Sensitivity",
      shortLabel: "REVENUE",
      value: `${Math.round(dp[0] * 100)}%`,
      description: `Revenue trajectory at ${Math.round(dp[0] * 100)}% strength. ${dp[0] > 0.6 ? "Supports upside scenarios." : "Constrains growth ceiling."}`,
      x: px(0),
      y: py(dp[0]),
    },
    {
      id: "profit",
      label: "Earnings Power",
      shortLabel: "MARGIN",
      value: `${Math.round(dp[1] * 100)}%`,
      description: `Gross margin / earnings power at ${Math.round(dp[1] * 100)}%. ${dp[1] > 0.55 ? "Unit economics support scaling." : "Margin compression limits optionality."}`,
      x: px(1),
      y: py(dp[1]),
    },
    {
      id: "runway",
      label: "Capital Runway",
      shortLabel: "RUNWAY",
      value: `${runway}mo`,
      description: `Cash reserves map to ${runway}mo runway. ${runway < 18 ? "Near-term capital constraint detected." : "Sufficient buffer for strategic maneuvers."}`,
      x: px(2),
      y: py(dp[2]),
    },
    {
      id: "cash",
      label: "Cash Position",
      shortLabel: "CASH",
      value: `${Math.round(dp[3] * 100)}%`,
      description: `Cash position at ${Math.round(dp[3] * 100)}% of reference. ${dp[3] > 0.5 ? "Reserves provide operational stability." : "Cash reserves below optimal threshold."}`,
      x: px(3),
      y: py(dp[3]),
    },
    {
      id: "burn",
      label: "Burn Compression",
      shortLabel: "BURN",
      value: `${Math.round(dp[4] * 100)}%`,
      description: `Burn quality at ${Math.round(dp[4] * 100)}%. ${dp[4] > 0.5 ? "Capital deployment is disciplined." : "Burn rate exceeds efficient threshold."}`,
      x: px(4),
      y: py(dp[4]),
    },
    {
      id: "efficiency",
      label: "Unit Economics",
      shortLabel: "LTV/CAC",
      value: `${ltvCac.toFixed(1)}x`,
      description: `LTV/CAC at ${ltvCac.toFixed(1)}x. ${ltvCac >= 3 ? "Customer acquisition economics are efficient." : "Acquisition cost-intensive — unit economics require attention."}`,
      x: px(5),
      y: py(dp[5]),
    },
    {
      id: "survival",
      label: "Survival Probability",
      shortLabel: "RISK",
      value: `${survivalPct}%`,
      description: `Risk index at ${riskScore}/100. Survival probability ${survivalPct}%. ${riskScore > 50 ? "Downside probability mass is concentrated." : "Survival distribution is favorable."}`,
      x: px(6),
      y: py(dp[6]),
    },
  ];

  return nodes;
}

const SensitivityNodes: React.FC<SensitivityNodesProps> = ({
  enabled,
  dataPoints,
  riskScore,
  runway,
  ltvCac,
  survivalPct,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const nodes = useMemo(
    () => buildNodes(dataPoints, riskScore, runway, ltvCac, survivalPct),
    [dataPoints, riskScore, runway, ltvCac, survivalPct]
  );

  const handleMouseEnter = useCallback((node: NodeDef, e: React.MouseEvent) => {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    setHoveredNode(node.id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  if (!enabled) return null;

  const activeNode = nodes.find((n) => n.id === hoveredNode);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 8,
      }}
    >
      {nodes.map((node) => {
        const isHovered = hoveredNode === node.id;

        return (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "auto",
              cursor: "pointer",
              zIndex: isHovered ? 20 : 10,
            }}
            onMouseEnter={(e) => handleMouseEnter(node, e)}
            onMouseLeave={handleMouseLeave}
          >
            {/* ═══ ALWAYS-VISIBLE LABEL (above node) ═══ */}
            <div
              style={{
                marginBottom: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                transition: "opacity 150ms ease",
              }}
            >
              {/* Short label */}
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  color: "rgba(0, 224, 255, 0.55)",
                  fontFamily: "'Inter', sans-serif",
                  textShadow: "0 1px 6px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.6)",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                {node.shortLabel}
              </span>
              {/* Value */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255, 255, 255, 0.85)",
                  fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  textShadow: "0 1px 8px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.7)",
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {node.value}
              </span>
            </div>

            {/* ═══ NODE DOT ═══ */}
            <div
              style={{
                width: isHovered ? 10 : 7,
                height: isHovered ? 10 : 7,
                borderRadius: "50%",
                background: isHovered
                  ? "rgba(0, 224, 255, 0.9)"
                  : "rgba(0, 224, 255, 0.6)",
                border: `1px solid ${isHovered ? "rgba(0, 224, 255, 0.6)" : "rgba(0, 224, 255, 0.3)"}`,
                boxShadow: isHovered
                  ? "0 0 12px rgba(0, 224, 255, 0.25), 0 0 4px rgba(0, 224, 255, 0.15)"
                  : "0 0 6px rgba(0, 224, 255, 0.1)",
                transition: "width 150ms ease, height 150ms ease, background 150ms ease, box-shadow 150ms ease",
              }}
            />

            {/* ═══ VERTICAL CONNECTOR LINE (down to base) ═══ */}
            <div
              style={{
                width: 1,
                height: 16,
                background: "linear-gradient(to bottom, rgba(0, 224, 255, 0.25), transparent)",
                marginTop: 1,
              }}
            />
          </div>
        );
      })}

      {/* ═══ EXPANDED TOOLTIP (on hover) ═══ */}
      {activeNode && (
        <OverlayTooltip
          title={activeNode.label}
          description={activeNode.description}
          x={tooltipPos.x}
          y={tooltipPos.y}
          visible
        />
      )}
    </div>
  );
};

export default SensitivityNodes;
