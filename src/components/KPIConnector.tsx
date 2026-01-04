// src/components/KPIConnector.tsx
// STRATFIT — Fixed KPI Connector — Line goes from KPI to MOUNTAIN PEAK

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
  const { hoveredKpiIndex } = useScenarioStore(
    useShallow((s) => ({ hoveredKpiIndex: s.hoveredKpiIndex }))
  );

  if (hoveredKpiIndex === null) return null;

  const color = KPI_COLORS[hoveredKpiIndex] || "#22d3ee";
  const xPercent = 15 + (hoveredKpiIndex * (70 / 6));

  return (
    <AnimatePresence>
      <div className="kpi-connector" style={{ left: `${xPercent}%`, "--connector-color": color } as React.CSSProperties}>
        <motion.div className="connector-pulse-top" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.4, 0.8] }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="connector-line" initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} exit={{ scaleY: 0, opacity: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} />
        <motion.div className="connector-pulse-bottom" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [1, 1.8, 1], opacity: [1, 0.5, 1] }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="connector-glow" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.4 }} />
        <style>{`
          .kpi-connector { position: absolute; top: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; pointer-events: none; z-index: 20; height: 65%; }
          .connector-pulse-top { width: 14px; height: 14px; border-radius: 50%; background: var(--connector-color); box-shadow: 0 0 15px var(--connector-color), 0 0 30px var(--connector-color); position: absolute; top: -7px; }
          .connector-line { width: 2px; height: 100%; background: linear-gradient(180deg, var(--connector-color) 0%, var(--connector-color) 70%, transparent 100%); box-shadow: 0 0 8px var(--connector-color), 0 0 16px var(--connector-color); transform-origin: top; border-radius: 1px; }
          .connector-pulse-bottom { width: 20px; height: 20px; border-radius: 50%; background: var(--connector-color); box-shadow: 0 0 20px var(--connector-color), 0 0 40px var(--connector-color), 0 0 60px var(--connector-color); position: absolute; bottom: -10px; }
          .connector-glow { position: absolute; bottom: -30px; width: 100px; height: 60px; background: radial-gradient(ellipse at center, var(--connector-color) 0%, transparent 70%); opacity: 0.5; filter: blur(15px); }
        `}</style>
      </div>
    </AnimatePresence>
  );
}
