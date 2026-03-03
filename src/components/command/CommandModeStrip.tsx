// src/components/command/CommandModeStrip.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Command Mode Toggle Strip (God Mode)
//
// Horizontal toggle strip for command modes.
// Manual click sets mode + enables manualOverride.
// Reset Auto clears override and re-evaluates from engine results.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback } from "react"
import {
  useCommandStore,
  COMMAND_MODES,
  type CommandMode,
} from "@/store/commandStore"
import type { SimulationResults } from "@/state/phase1ScenarioStore"

interface CommandModeStripProps {
  /** Current engine results — needed for Reset Auto re-evaluation */
  engineResults: SimulationResults | null
}

const CommandModeStrip: React.FC<CommandModeStripProps> = memo(
  ({ engineResults }) => {
    const currentMode = useCommandStore((s) => s.currentMode)
    const manualOverride = useCommandStore((s) => s.manualOverride)
    const setMode = useCommandStore((s) => s.setMode)
    const setManualOverride = useCommandStore((s) => s.setManualOverride)
    const autoEvaluate = useCommandStore((s) => s.autoEvaluate)

    const handleSelect = useCallback(
      (mode: CommandMode) => {
        setMode(mode)
        setManualOverride(true)
      },
      [setMode, setManualOverride],
    )

    const handleResetAuto = useCallback(() => {
      setManualOverride(false)
      autoEvaluate(engineResults)
    }, [setManualOverride, autoEvaluate, engineResults])

    return (
      <div style={S.strip}>
        <div style={S.modes}>
          {COMMAND_MODES.map((m) => {
            const isActive = currentMode === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => handleSelect(m.value)}
                style={{
                  ...S.modeBtn,
                  ...(isActive ? S.modeBtnActive : {}),
                }}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {manualOverride && (
          <button
            type="button"
            onClick={handleResetAuto}
            style={S.resetBtn}
            title="Clear manual override — auto-evaluate from engine results"
          >
            Reset Auto
          </button>
        )}

        {!manualOverride && (
          <span style={S.autoTag}>AUTO</span>
        )}
      </div>
    )
  },
)

CommandModeStrip.displayName = "CommandModeStrip"
export default CommandModeStrip

/* ── Styles ── */

const FONT = "'Inter', system-ui, sans-serif"
const CYAN = "rgba(34, 211, 238, 0.85)"
const CYAN_DIM = "rgba(34, 211, 238, 0.15)"

const S: Record<string, React.CSSProperties> = {
  strip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 8px",
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
    borderRadius: 6,
    border: "1px solid rgba(182,228,255,0.08)",
  },

  modes: {
    display: "flex",
    alignItems: "center",
    gap: 2,
  },

  modeBtn: {
    padding: "3px 8px",
    borderRadius: 4,
    border: "none",
    background: "transparent",
    color: "rgba(148,180,214,0.5)",
    fontFamily: FONT,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    transition: "all 150ms ease",
  },

  modeBtnActive: {
    background: CYAN_DIM,
    color: CYAN,
  },

  resetBtn: {
    marginLeft: 4,
    padding: "2px 8px",
    borderRadius: 3,
    border: "1px solid rgba(250,204,21,0.25)",
    background: "rgba(250,204,21,0.08)",
    color: "rgba(250,204,21,0.7)",
    fontFamily: FONT,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
  },

  autoTag: {
    marginLeft: 4,
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "rgba(34,197,94,0.5)",
    fontFamily: FONT,
  },
}
