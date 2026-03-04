// src/components/decision/LeverSliderGroup.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Shared Lever Slider Group
//
// Canonical renderer for lever sliders used by DecisionPage + StudioPage.
// Single source of truth for lever value formatting and slider rendering.
//
// Props:
//   levers   — filtered LeverSchema[] to render
//   values   — current lever values (Record<string, number>)
//   onChange  — (id, value) setter
//   grouped  — optional: visually separate constraint / tuning tiers
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react"
import type { LeverSchema } from "@/config/decisionLeverSchemas"

// ── Canonical lever value formatter (single source of truth) ──

export function formatLeverValue(val: number, lever: LeverSchema): string {
  const sign = val > 0 ? "+" : ""
  switch (lever.unit) {
    case "%":  return `${sign}${val}%`
    case "mo": return `${val}mo`
    case "$M": return `$${val}M`
    case "x":  return `${val.toFixed(1)}x`
    default:   return `${sign}${val}`
  }
}

// ── Types ──

export interface LeverSliderGroupProps {
  /** Lever schemas to render (pre-filtered by caller) */
  levers: LeverSchema[]
  /** Current lever values */
  values: Record<string, number>
  /** Called when a lever value changes */
  onChange: (id: string, value: number) => void
  /** When true, group levers by tier with visual section labels */
  grouped?: boolean
  /** Optional className on the root container */
  className?: string
  /** Optional style on the root container */
  style?: React.CSSProperties
}

// ── Styles (institutional, matches existing Decision/Studio aesthetic) ──

const S = {
  group: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  tierLabel: {
    fontSize: 9,
    fontWeight: 600 as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "rgba(255,255,255,0.25)",
    marginTop: 10,
    marginBottom: 2,
    paddingBottom: 4,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  row: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(226,240,255,0.75)",
  },
  value: {
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(226,240,255,0.85)",
  },
  valueDefault: {
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(255,255,255,0.35)",
  },
  valueActive: {
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(34,211,238,0.9)",
  },
  slider: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    appearance: "auto" as const,
    accentColor: "#22d3ee",
    cursor: "pointer",
    background: "transparent",
  },
  range: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 9,
    color: "rgba(148,180,214,0.35)",
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
} as const

// ── Single Lever Row ──

const LeverRow: React.FC<{
  lever: LeverSchema
  value: number
  onChange: (id: string, value: number) => void
}> = memo(({ lever, value, onChange }) => {
  const isDefault = value === lever.default
  return (
    <div style={S.row}>
      <div style={S.header}>
        <span style={S.label}>{lever.label}</span>
        <span style={isDefault ? S.valueDefault : S.valueActive}>
          {formatLeverValue(value, lever)}
        </span>
      </div>
      <input
        type="range"
        min={lever.min}
        max={lever.max}
        step={lever.step}
        value={value}
        onChange={(e) => onChange(lever.id, Number(e.target.value))}
        style={S.slider}
      />
      <div style={S.range}>
        <span>{lever.min}{lever.unit}</span>
        <span>{lever.max}{lever.unit}</span>
      </div>
    </div>
  )
})
LeverRow.displayName = "LeverRow"

// ── Main Component ──

const LeverSliderGroup: React.FC<LeverSliderGroupProps> = memo(({
  levers,
  values,
  onChange,
  grouped = false,
  className,
  style,
}) => {
  if (levers.length === 0) return null

  if (!grouped) {
    // Flat list — no tier labels
    return (
      <div className={className} style={{ ...S.group, ...style }}>
        {levers.map((lever) => (
          <LeverRow
            key={lever.id}
            lever={lever}
            value={values[lever.id] ?? lever.default}
            onChange={onChange}
          />
        ))}
      </div>
    )
  }

  // Grouped by tier — constraint first, then tuning
  const constraints = levers.filter((l) => l.tier === "constraint")
  const tuning = levers.filter((l) => l.tier === "tuning")

  return (
    <div className={className} style={{ ...S.group, ...style }}>
      {constraints.length > 0 && (
        <>
          <div style={S.tierLabel}>Constraints</div>
          {constraints.map((lever) => (
            <LeverRow
              key={lever.id}
              lever={lever}
              value={values[lever.id] ?? lever.default}
              onChange={onChange}
            />
          ))}
        </>
      )}
      {tuning.length > 0 && (
        <>
          <div style={{ ...S.tierLabel, marginTop: constraints.length > 0 ? 14 : 10 }}>
            Tuning
          </div>
          {tuning.map((lever) => (
            <LeverRow
              key={lever.id}
              lever={lever}
              value={values[lever.id] ?? lever.default}
              onChange={onChange}
            />
          ))}
        </>
      )}
    </div>
  )
})

LeverSliderGroup.displayName = "LeverSliderGroup"
export default LeverSliderGroup
