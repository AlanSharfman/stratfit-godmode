// src/components/Risk/RiskTransmissionMap.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Risk Transmission Map (Vertical Node Graph)
//
// Shows the causal propagation chain:
//   Churn → Revenue → Burn → Runway → Survival
//
// Each node displays: baseline value, shocked value, Δ%
// Arrows highlight when delta exceeds threshold.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import type { TransmissionNode } from "@/logic/risk/computeRiskIndex";
import styles from "./RiskTransmissionMap.module.css";

// ── Format helpers ──────────────────────────────────────────────────

function formatNodeValue(node: TransmissionNode): { base: string; shock: string } {
  switch (node.id) {
    case "churn":
      return {
        base: `${node.baseline.toFixed(1)}%`,
        shock: `${node.shocked.toFixed(1)}%`,
      };
    case "revenue":
      return {
        base: fmtCurrency(node.baseline),
        shock: fmtCurrency(node.shocked),
      };
    case "burn":
      return {
        base: fmtCurrency(node.baseline),
        shock: fmtCurrency(node.shocked),
      };
    case "runway":
      return {
        base: `${node.baseline.toFixed(1)} mo`,
        shock: `${node.shocked.toFixed(1)} mo`,
      };
    case "survival":
      return {
        base: `${node.baseline.toFixed(1)}%`,
        shock: `${node.shocked.toFixed(1)}%`,
      };
    default:
      return {
        base: node.baseline.toFixed(1),
        shock: node.shocked.toFixed(1),
      };
  }
}

function fmtCurrency(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function getDeltaColor(node: TransmissionNode): string {
  // For churn and burn: increase = bad (red), decrease = good (green)
  // For revenue, runway, survival: decrease = bad (red), increase = good (green)
  const badDirection = (node.id === "churn" || node.id === "burn") ? "up" : "down";
  if (node.direction === "neutral") return "rgba(255,255,255,0.3)";
  if (node.direction === badDirection) return "#ef4444";
  return "#34d399";
}

function getArrowColor(severity: TransmissionNode["severity"]): string {
  if (severity === "high") return "rgba(239, 68, 68, 0.7)";
  if (severity === "medium") return "rgba(251, 191, 36, 0.5)";
  return "rgba(255, 255, 255, 0.1)";
}

// ── Component ───────────────────────────────────────────────────────

interface RiskTransmissionMapProps {
  nodes: TransmissionNode[];
  isComputing?: boolean;
}

const NODE_ICONS: Record<string, string> = {
  churn: "↻",
  revenue: "◈",
  burn: "◉",
  runway: "⏱",
  survival: "◆",
};

export const RiskTransmissionMap: React.FC<RiskTransmissionMapProps> = ({
  nodes,
  isComputing = false,
}) => {
  return (
    <div className={styles.root}>
      <div className={styles.title}>Shock Transmission</div>

      {isComputing && (
        <div className={styles.computing}>Propagating shock…</div>
      )}

      <div className={styles.chain}>
        {nodes.map((node, i) => {
          const fmt = formatNodeValue(node);
          const deltaColor = getDeltaColor(node);
          const isLast = i === nodes.length - 1;
          const nextNode = !isLast ? nodes[i + 1] : null;
          const arrowColor = nextNode
            ? getArrowColor(nextNode.severity)
            : "transparent";

          return (
            <React.Fragment key={node.id}>
              {/* Node card */}
              <div
                className={`${styles.node} ${
                  node.severity === "high" ? styles.nodeHigh : ""
                }`}
              >
                <div className={styles.nodeHeader}>
                  <span className={styles.nodeIcon}>
                    {NODE_ICONS[node.id] ?? "●"}
                  </span>
                  <span className={styles.nodeLabel}>{node.label}</span>
                  <span
                    className={styles.nodeDelta}
                    style={{ color: deltaColor }}
                  >
                    {node.direction === "neutral"
                      ? "—"
                      : `${node.deltaPct >= 0 ? "+" : ""}${node.deltaPct.toFixed(1)}%`}
                  </span>
                </div>
                <div className={styles.nodeBody}>
                  <div className={styles.nodeMetric}>
                    <span className={styles.metricLabel}>Base</span>
                    <span className={styles.metricValue}>{fmt.base}</span>
                  </div>
                  <div className={styles.nodeSep} />
                  <div className={styles.nodeMetric}>
                    <span className={styles.metricLabel}>Shock</span>
                    <span
                      className={styles.metricValue}
                      style={{ color: deltaColor }}
                    >
                      {fmt.shock}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow between nodes */}
              {!isLast && (
                <div
                  className={styles.arrow}
                  style={{ color: arrowColor }}
                >
                  <svg
                    width="12"
                    height="20"
                    viewBox="0 0 12 20"
                    fill="none"
                  >
                    <line
                      x1="6"
                      y1="0"
                      x2="6"
                      y2="14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M2 12L6 18L10 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default RiskTransmissionMap;


