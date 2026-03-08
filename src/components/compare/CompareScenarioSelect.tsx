// src/components/compare/CompareScenarioSelect.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Scenario Selector Dropdown (Compare Terrain Panel Header)
// Compact dark-theme select for picking Baseline or saved scenarios.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react"

export interface ScenarioOption {
  id: string
  label: string
}

interface CompareScenarioSelectProps {
  /** Current value — null means baseline */
  valueId: string | null
  options: ScenarioOption[]
  onChange: (id: string | null) => void
}

const BASELINE_VALUE = "__baseline__"

const CompareScenarioSelect: React.FC<CompareScenarioSelectProps> = memo(
  ({ valueId, options, onChange }) => (
    <select
      value={valueId ?? BASELINE_VALUE}
      onChange={(e) =>
        onChange(e.target.value === BASELINE_VALUE ? null : e.target.value)
      }
      style={S.select}
    >
      <option value={BASELINE_VALUE}>Baseline</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  ),
)

CompareScenarioSelect.displayName = "CompareScenarioSelect"
export default CompareScenarioSelect

const S: Record<string, React.CSSProperties> = {
  select: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "rgba(34,211,238,0.8)",
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 3,
    padding: "3px 6px",
    outline: "none",
    cursor: "pointer",
    fontFamily: "'Inter', system-ui, sans-serif",
    maxWidth: 140,
  },
}
