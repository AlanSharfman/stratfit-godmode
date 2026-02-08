// src/pages/terrain/TerrainOverlays/SensitivityNodes.tsx
// STRATFIT — Sensitivity Nodes ("Orbs") with Hover Explainers
// 3–5 small nodes at key meaning points. 6–8px. Subtle cyan.
// Tooltip: title uppercase, 1–2 lines max, derived from outputs. No emoji.

import React, { useState, useMemo, useCallback } from "react";
import OverlayTooltip from "./OverlayTooltip";

interface NodeDef {
  id: string;
  label: string;
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
      description: `Momentum index at ${Math.round(dp[2] * 100)}%. Revenue trajectory ${dp[2] > 0.6 ? "supports" : "constrains"} upside scenarios.`,
      x: px(2),
      y: py(dp[2]),
    },
    {
      id: "burn",
      label: "Burn Compression",
      description: `Burn quality at ${Math.round(dp[3] * 100)}%. ${dp[3] > 0.5 ? "Capital deployment is disciplined." : "Burn rate exceeds efficient threshold."}`,
      x: px(3),
      y: py(dp[3]),
    },
    {
      id: "capital",
      label: "Capital Fragility",
      description: `Cash reserves map to ${runway}mo runway. ${runway < 18 ? "Near-term capital constraint detected." : "Sufficient buffer for strategic maneuvers."}`,
      x: px(1),
      y: py(dp[1]),
    },
    {
      id: "survival",
      label: "Survival Cliff",
      description: `Risk index at ${riskScore}/100. ${riskScore > 50 ? "Downside probability mass is concentrated." : "Survival distribution is favorable."}`,
      x: px(4),
      y: py(dp[4]),
    },
  ];

  // Optional 5th node: Exit viability (only if data supports it)
  if (dp[6] > 0.4) {
    nodes.push({
      id: "exit",
      label: "Exit Viability Ridge",
      description: `Enterprise value factor at ${Math.round(dp[6] * 100)}%. ${dp[6] > 0.65 ? "Exit multiples support strategic optionality." : "Valuation headroom is limited."}`,
      x: px(6),
      y: py(dp[6]),
    });
  }

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
      {nodes.map((node) => (
        <div
          key={node.id}
          onMouseEnter={(e) => handleMouseEnter(node, e)}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "absolute",
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "rgba(0, 224, 255, 0.6)",
            border: "1px solid rgba(0, 224, 255, 0.3)",
            boxShadow: hoveredNode === node.id
              ? "0 0 8px rgba(0, 224, 255, 0.15)"
              : "none",
            cursor: "pointer",
            pointerEvents: "auto",
            transition: "box-shadow 150ms ease",
          }}
        />
      ))}

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





