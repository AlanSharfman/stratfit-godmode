// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Scenario Run Registry (What-If Engine)
//
// CANONICAL STORE for What-If scenario runs and their deterministic
// engine results. Each ScenarioRun stores the untransformed engine output.
//
// Companion stores:
//   - phase1ScenarioStore  → simulation pipeline & Position/Compare pages
//   - scenarioTimelineStore → timeline playback state
// ═══════════════════════════════════════════════════════════════════════════
import { create } from "zustand"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { ScenarioCategory } from "@/engine/scenarioTemplates"

export interface ScenarioRunEngineResult {
  forces: Partial<Record<KpiKey, number>>
  propagation: { affected: Record<KpiKey, number>; hops: Record<KpiKey, number> }
  clampWarnings: string[]
  assumptions: string[]
  confidence: { level: "high" | "medium" | "low"; score: number; reasons: string[] }
}

export interface ScenarioRun {
  id: string
  prompt: string
  scenarioType: ScenarioCategory
  templateId: string
  timestamp: number
  engineResults: ScenarioRunEngineResult
  baselineKpis: Partial<Record<KpiKey, number>> | null
}

interface ScenarioRunState {
  scenarioRuns: ScenarioRun[]
  activeScenarioId: string | null
  baselineScenarioId: string | null
  comparisonScenarioId: string | null

  addScenarioRun: (run: ScenarioRun) => void
  setActiveScenario: (id: string | null) => void
  setBaselineScenario: (id: string | null) => void
  setComparisonScenario: (id: string | null) => void
  getScenarioById: (id: string) => ScenarioRun | undefined
  clearRuns: () => void
}

export const useScenarioRunStore = create<ScenarioRunState>((set, get) => ({
  scenarioRuns: [],
  activeScenarioId: null,
  baselineScenarioId: null,
  comparisonScenarioId: null,

  addScenarioRun: (run) =>
    set((s) => ({
      scenarioRuns: [...s.scenarioRuns, run],
      activeScenarioId: run.id,
    })),

  setActiveScenario: (id) => set({ activeScenarioId: id }),
  setBaselineScenario: (id) => set({ baselineScenarioId: id }),
  setComparisonScenario: (id) => set({ comparisonScenarioId: id }),

  getScenarioById: (id) => get().scenarioRuns.find((r) => r.id === id),

  clearRuns: () =>
    set({
      scenarioRuns: [],
      activeScenarioId: null,
      baselineScenarioId: null,
      comparisonScenarioId: null,
    }),
}))
