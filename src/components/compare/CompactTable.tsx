// src/components/compare/CompactTable.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compact Comparison Table
//
// | Structure | Runway | Survival | EV |
//
// No KPI explosion. No spreadsheet styling. No heavy gridlines.
// Board-clean.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import type { CompareScenario } from "@/state/compareViewStore";
import styles from "./CompareView.module.css";

interface CompactTableProps {
  currentStructure: CompareScenario;
  scenarios: CompareScenario[];
  activeScenarioId: string;
}

function survivalFromScenario(s: CompareScenario): string {
  if (s.simulationResult) {
    return `${Math.round(s.simulationResult.survivalRate * 100)}%`;
  }
  if (s.metrics) {
    return `${Math.min(100, Math.round((s.metrics.runway / 36) * 100))}%`;
  }
  return "—";
}

function runwayFromScenario(s: CompareScenario): string {
  if (s.metrics) return `${s.metrics.runway}mo`;
  return "—";
}

function evFromScenario(s: CompareScenario): string {
  if (s.metrics) return `$${s.metrics.enterpriseValue.toFixed(1)}M`;
  return "—";
}

const CompactTable: React.FC<CompactTableProps> = memo(({
  currentStructure,
  scenarios,
  activeScenarioId,
}) => {
  const rows = useMemo(() => {
    const result: { name: string; runway: string; survival: string; ev: string; isActive: boolean }[] = [];

    result.push({
      name: currentStructure.name,
      runway: runwayFromScenario(currentStructure),
      survival: survivalFromScenario(currentStructure),
      ev: evFromScenario(currentStructure),
      isActive: false,
    });

    for (const s of scenarios) {
      result.push({
        name: s.name,
        runway: runwayFromScenario(s),
        survival: survivalFromScenario(s),
        ev: evFromScenario(s),
        isActive: s.id === activeScenarioId,
      });
    }

    return result;
  }, [currentStructure, scenarios, activeScenarioId]);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.compactTable}>
        <thead>
          <tr>
            <th>Structure</th>
            <th>Runway</th>
            <th>Survival</th>
            <th>EV</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} style={row.isActive ? { background: "rgba(0, 224, 255, 0.02)" } : undefined}>
              <td>{row.name}</td>
              <td>{row.runway}</td>
              <td>{row.survival}</td>
              <td>{row.ev}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

CompactTable.displayName = "CompactTable";
export default CompactTable;


