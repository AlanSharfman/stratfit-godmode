// src/components/compare/CompareGhostHeaderBar.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Ghost Mode Header Bar
//
// Compact header above the single ghost canvas with:
//   Left:   PRIMARY (A) dropdown
//   Middle: GHOST (B) dropdown
//   If 3:   GHOST (C) dropdown
//   Right:  Active pair selector (3-mode) + swap/rotate
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react"
import CompareScenarioSelect, {
  type ScenarioOption,
} from "./CompareScenarioSelect"
import type { ComparePair } from "@/store/compareStore"

export interface CompareGhostHeaderBarProps {
  nScenarios: 2 | 3
  activePair: ComparePair

  selectedAId: string | null
  selectedBId: string | null
  selectedCId: string | null

  scenarioOptions: ScenarioOption[]
  onSelectA: (id: string | null) => void
  onSelectB: (id: string | null) => void
  onSelectC: (id: string | null) => void

  onPairChange: (pair: ComparePair) => void
  onSwap: () => void
  onRotate: () => void
}

const PAIRS: ComparePair[] = ["AB", "AC", "BC"]

const CompareGhostHeaderBar: React.FC<CompareGhostHeaderBarProps> = memo(
  ({
    nScenarios,
    activePair,
    selectedAId,
    selectedBId,
    selectedCId,
    scenarioOptions,
    onSelectA,
    onSelectB,
    onSelectC,
    onPairChange,
    onSwap,
    onRotate,
  }) => {
    const is3 = nScenarios === 3

    return (
      <div style={S.bar}>
        {/* ── PRIMARY (A) ── */}
        <div style={S.slotGroup}>
          <span style={{ ...S.slotDot, background: "rgba(148,180,214,0.5)" }} />
          <span style={S.slotTag}>PRIMARY</span>
          <CompareScenarioSelect
            valueId={selectedAId}
            options={scenarioOptions}
            onChange={onSelectA}
          />
        </div>

        {/* ── GHOST B ── */}
        <div style={S.slotGroup}>
          <span style={{ ...S.slotDot, background: "rgba(34,197,94,0.6)" }} />
          <span style={S.slotTag}>GHOST B</span>
          <CompareScenarioSelect
            valueId={selectedBId}
            options={scenarioOptions}
            onChange={onSelectB}
          />
        </div>

        {/* ── GHOST C (3-mode) ── */}
        {is3 && (
          <div style={S.slotGroup}>
            <span style={{ ...S.slotDot, background: "rgba(129,140,248,0.6)" }} />
            <span style={S.slotTag}>GHOST C</span>
            <CompareScenarioSelect
              valueId={selectedCId}
              options={scenarioOptions}
              onChange={onSelectC}
            />
          </div>
        )}

        {/* ── Right: Pair selector + swap/rotate ── */}
        <div style={S.rightGroup}>
          {is3 && (
            <div style={S.pairToggle}>
              {PAIRS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPairChange(p)}
                  style={activePair === p ? S.pairBtnActive : S.pairBtn}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {is3 ? (
            <button type="button" onClick={onRotate} style={S.actionBtn} title="Rotate A→B→C→A">↻</button>
          ) : (
            <button type="button" onClick={onSwap} style={S.actionBtn} title="Swap A ↔ B">⇄</button>
          )}
        </div>
      </div>
    )
  },
)

CompareGhostHeaderBar.displayName = "CompareGhostHeaderBar"
export default CompareGhostHeaderBar

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"
const CYAN = "rgba(34, 211, 238, 0.85)"
const CYAN_DIM = "rgba(34, 211, 238, 0.15)"
const GLASS_BORDER = "1px solid rgba(182, 228, 255, 0.1)"

const S: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    height: 38,
    padding: "0 14px",
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "8px 8px 0 0",
    flexShrink: 0,
    zIndex: 4,
  },

  slotGroup: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },

  slotDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    flexShrink: 0,
  },

  slotTag: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "rgba(34,211,238,0.55)",
    fontFamily: FONT,
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  rightGroup: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  pairToggle: {
    display: "flex",
    gap: 0,
    borderRadius: 4,
    overflow: "hidden",
    border: GLASS_BORDER,
  },

  pairBtn: {
    padding: "3px 8px",
    border: "none",
    background: "rgba(0,0,0,0.3)",
    color: "rgba(148,180,214,0.45)",
    fontSize: 9,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.06em",
    transition: "background 200ms ease, color 200ms ease",
  },

  pairBtnActive: {
    padding: "3px 8px",
    border: "none",
    background: "rgba(34,211,238,0.12)",
    color: CYAN,
    fontSize: 9,
    fontWeight: 800,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.06em",
  },

  actionBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    border: `1px solid ${CYAN_DIM}`,
    background: "rgba(34,211,238,0.06)",
    color: CYAN,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: FONT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 200ms ease",
  },
}
