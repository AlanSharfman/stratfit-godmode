// src/store/commandStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Command Centre Mode Engine (God Mode)
//
// Auto-activates appropriate mode based on simulation event severity.
// Manual override still works — user can click a toggle.
// Reset Auto button clears override and re-evaluates.
//
// No visual chaos. No camera movement. No simulation reruns.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"
import type { SimulationResults } from "@/state/phase1ScenarioStore"

/* ── Command modes ── */

export type CommandMode =
  | "overview"
  | "liquidity"
  | "risk"
  | "volatility"
  | "delta"
  | "heatmap"
  | "code"

export const COMMAND_MODES: { value: CommandMode; label: string }[] = [
  { value: "overview",   label: "Overview" },
  { value: "liquidity",  label: "Liquidity" },
  { value: "risk",       label: "Risk" },
  { value: "volatility", label: "Volatility" },
  { value: "delta",      label: "Delta" },
  { value: "heatmap",    label: "Heatmap" },
  { value: "code",       label: "Code" },
]

/* ── Signal emphasis map — which event types each mode emphasizes ── */

export const MODE_EMPHASIS: Record<CommandMode, string[]> = {
  overview:   [],
  liquidity:  ["liquidity_stress"],
  risk:       ["risk_spike", "downside_regime"],
  volatility: ["volatility_zone"],
  delta:      ["probability_shift", "growth_inflection"],
  heatmap:    [],
  code:       [],
}

/* ── Store ── */

interface CommandState {
  currentMode: CommandMode
  manualOverride: boolean
  setMode: (mode: CommandMode) => void
  setManualOverride: (value: boolean) => void
  autoEvaluate: (results: SimulationResults | null) => void
}

/**
 * Deterministic auto-evaluation: scan events for highest severity,
 * map to appropriate command mode. No heuristics.
 */
function evaluateMode(events: TerrainEvent[]): CommandMode {
  if (events.length === 0) return "overview"

  // Find max severity per event type
  let maxLiquidity = 0
  let maxRisk = 0
  let maxVolatility = 0
  let maxProbShift = 0

  for (const e of events) {
    switch (e.type) {
      case "liquidity_stress":
        maxLiquidity = Math.max(maxLiquidity, e.severity)
        break
      case "risk_spike":
      case "downside_regime":
        maxRisk = Math.max(maxRisk, e.severity)
        break
      case "volatility_zone":
        maxVolatility = Math.max(maxVolatility, e.severity)
        break
      case "probability_shift":
        maxProbShift = Math.max(maxProbShift, e.severity)
        break
    }
  }

  // Priority cascade — deterministic, no ties
  if (maxLiquidity >= 0.75) return "liquidity"
  if (maxRisk >= 0.75) return "risk"
  if (maxVolatility >= 0.70) return "volatility"
  if (maxProbShift >= 0.75) return "delta"

  return "overview"
}

export const useCommandStore = create<CommandState>()((set, get) => ({
  currentMode: "overview",
  manualOverride: false,

  setMode: (mode) => set({ currentMode: mode }),

  setManualOverride: (value) => set({ manualOverride: value }),

  autoEvaluate: (results) => {
    if (get().manualOverride) return
    const events = results?.events ?? []
    const mode = evaluateMode(events)
    set({ currentMode: mode })
  },
}))
