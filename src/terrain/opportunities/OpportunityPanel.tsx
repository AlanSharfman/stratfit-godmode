import React, { memo, useCallback } from "react"
import type { OpportunitySignal } from "./opportunitySignals"

const EMERALD = "#10b981"

const S = {
  panel: {
    width: 280,
    padding: "16px 20px",
    borderRadius: 10,
    background: "rgba(6, 14, 24, 0.94)",
    border: `1px solid rgba(16,185,129,0.2)`,
    boxShadow: `0 0 24px rgba(16,185,129,0.12), 0 8px 32px rgba(0,0,0,0.6)`,
    backdropFilter: "blur(16px)",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#e2e8f0",
    userSelect: "none" as const,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: EMERALD,
    lineHeight: 1.3,
    flex: 1,
  },
  close: {
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: 16,
    cursor: "pointer",
    padding: "0 0 0 8px",
    lineHeight: 1,
  },
  desc: {
    fontSize: 11,
    lineHeight: 1.55,
    color: "#94a3b8",
    marginBottom: 12,
  },
  metaRow: {
    display: "flex",
    gap: 12,
  },
  metaItem: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 6,
    background: "rgba(16,185,129,0.06)",
    border: "1px solid rgba(16,185,129,0.1)",
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#64748b",
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#e2e8f0",
  },
} as const

function impactColor(impact: OpportunitySignal["potentialImpact"]): string {
  switch (impact) {
    case "Very High": return "#10b981"
    case "High": return "#34d399"
    case "Medium": return "#fbbf24"
    case "Low": return "#94a3b8"
  }
}

interface Props {
  signal: OpportunitySignal
  onClose: () => void
}

const OpportunityPanel: React.FC<Props> = memo(({ signal, onClose }) => {
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onClose()
    },
    [onClose],
  )

  return (
    <div style={S.panel} onClick={(e) => e.stopPropagation()}>
      <div style={S.header}>
        <div style={S.title}>{signal.title}</div>
        <button style={S.close} onClick={handleClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div style={S.desc}>{signal.description}</div>

      <div style={S.metaRow}>
        <div style={S.metaItem}>
          <div style={S.metaLabel}>Potential Impact</div>
          <div style={{ ...S.metaValue, color: impactColor(signal.potentialImpact) }}>
            {signal.potentialImpact}
          </div>
        </div>
        <div style={S.metaItem}>
          <div style={S.metaLabel}>Confidence</div>
          <div style={{ ...S.metaValue, color: signal.confidence > 70 ? EMERALD : "#fbbf24" }}>
            {signal.confidence}%
          </div>
        </div>
      </div>
    </div>
  )
})

OpportunityPanel.displayName = "OpportunityPanel"
export default OpportunityPanel
