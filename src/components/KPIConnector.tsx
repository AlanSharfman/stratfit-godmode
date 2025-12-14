// src/components/KPIConnector.tsx
// STRATFIT — Glowing connector line from KPI to Mountain

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// CONFIG
// ============================================================================

const KPI_COLORS = [
  "#22d3ee", // MRR - cyan
  "#34d399", // Gross Profit - green
  "#a78bfa", // Cash - purple
  "#f0abfc", // Burn - pink
  "#3b82f6", // Runway - blue
  "#22d3ee", // CAC - cyan
  "#22d3ee", // Churn - cyan
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function KPIConnector() {
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);

  if (hoveredKpiIndex === null) return null;

  const color = KPI_COLORS[hoveredKpiIndex] || "#22d3ee";

  // Calculate X position based on KPI index (7 KPIs spread across)
  const xPercent = 7 + (hoveredKpiIndex * (86 / 6)); // 7% to 93%

  return (
    <AnimatePresence>
      <div className="kpi-connector" style={{ left: `${xPercent}%` }}>
        {/* Pulsing circle at top */}
        <motion.div
          className="connector-pulse"
          style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}, 0 0 40px ${color}` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [1, 0.6, 1]
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Static center dot */}
        <motion.div
          className="connector-dot"
          style={{ backgroundColor: color }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        />

        {/* Vertical line */}
        <motion.div
          className="connector-line"
          style={{ 
            background: `linear-gradient(180deg, ${color} 0%, ${color}00 100%)`,
            boxShadow: `0 0 10px ${color}`
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          exit={{ scaleY: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {/* Bottom glow */}
        <motion.div
          className="connector-glow"
          style={{ 
            background: `radial-gradient(ellipse at center, ${color}60 0%, transparent 70%)`
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
        />

        <style>{`
          .kpi-connector {
            position: absolute;
            top: 0;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
            z-index: 50;
            height: 100%;
          }

          .connector-pulse {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            position: absolute;
            top: -8px;
          }

          .connector-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            position: absolute;
            top: -5px;
            z-index: 2;
          }

          .connector-line {
            width: 2px;
            height: calc(100% - 40px);
            margin-top: 8px;
            transform-origin: top;
            border-radius: 1px;
          }

          .connector-glow {
            position: absolute;
            bottom: 20px;
            width: 80px;
            height: 40px;
            filter: blur(8px);
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
}

