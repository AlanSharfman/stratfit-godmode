import { create } from "zustand"
import { persist } from "zustand/middleware"
import { safeLocalStoragePersist } from "@/state/safePersistStorage"
import type { ScenarioCategory } from "@/engine/scenarioTemplates"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */

export type ARRRange =
  | "pre-revenue"
  | "0-500k"
  | "500k-1m"
  | "1m-5m"
  | "5m-20m"
  | "20m+"

export type GrowthRange =
  | "negative"
  | "0-10"
  | "10-30"
  | "30-60"
  | "60-100"
  | "100+"

export interface ScenarioLibraryEntry {
  id: string
  scenarioType: ScenarioCategory
  industry: string
  arrRange: ARRRange
  growthRange: GrowthRange
  baselineMetrics: {
    arr: number
    revenueMonthly: number
    growthRatePct: number
    burnMonthly: number
    runwayMonths: number
    cashOnHand: number
    grossMarginPct: number
    valuationEstimate: number
  }
  resultingDeltas: Partial<Record<KpiKey, number>>
  timestamp: number
}

export interface NetworkInsight {
  totalMatches: number
  headline: string
  details: string[]
}

/* ═══════════════════════════════════════════════
   Banding helpers
   ═══════════════════════════════════════════════ */

export function toARRRange(arr: number): ARRRange {
  if (arr <= 0) return "pre-revenue"
  if (arr < 500_000) return "0-500k"
  if (arr < 1_000_000) return "500k-1m"
  if (arr < 5_000_000) return "1m-5m"
  if (arr < 20_000_000) return "5m-20m"
  return "20m+"
}

export function toGrowthRange(growthPct: number): GrowthRange {
  if (growthPct < 0) return "negative"
  if (growthPct < 10) return "0-10"
  if (growthPct < 30) return "10-30"
  if (growthPct < 60) return "30-60"
  if (growthPct < 100) return "60-100"
  return "100+"
}

/* ═══════════════════════════════════════════════
   Query engine
   ═══════════════════════════════════════════════ */

function querySimilar(
  entries: ScenarioLibraryEntry[],
  type: ScenarioCategory,
  arrRange: ARRRange,
  growthRange: GrowthRange,
): ScenarioLibraryEntry[] {
  const exact = entries.filter(
    (e) => e.scenarioType === type && e.arrRange === arrRange && e.growthRange === growthRange,
  )
  if (exact.length >= 5) return exact

  const relaxGrowth = entries.filter(
    (e) => e.scenarioType === type && e.arrRange === arrRange,
  )
  if (relaxGrowth.length >= 5) return relaxGrowth

  return entries.filter((e) => e.scenarioType === type)
}

/* ═══════════════════════════════════════════════
   Insight generator
   ═══════════════════════════════════════════════ */

const IMPACT_LABELS: Record<string, string> = {
  enterpriseValue: "enterprise value",
  revenue: "revenue",
  cashOnHand: "liquidity",
  arr: "ARR",
  growth: "growth",
  runway: "runway",
  burn: "burn rate",
  grossMargin: "gross margin",
  churn: "churn",
}

function pctPositive(entries: ScenarioLibraryEntry[], kpi: KpiKey): number {
  const relevant = entries.filter((e) => e.resultingDeltas[kpi] !== undefined)
  if (relevant.length === 0) return 0
  const positive = relevant.filter((e) => (e.resultingDeltas[kpi] ?? 0) > 0).length
  return Math.round((positive / relevant.length) * 100)
}

function categoryVerb(cat: ScenarioCategory): string {
  switch (cat) {
    case "capital": return "raising capital"
    case "hiring": return "hiring"
    case "pricing": return "adjusting pricing"
    case "growth": return "pursuing growth"
    case "efficiency": return "optimising efficiency"
    case "market": return "entering new markets"
    case "risk": return "this risk event"
    default: return "this scenario"
  }
}

export function generateNetworkInsight(
  entries: ScenarioLibraryEntry[],
  type: ScenarioCategory,
  arrRange: ARRRange,
  growthRange: GrowthRange,
): NetworkInsight | null {
  const similar = querySimilar(entries, type, arrRange, growthRange)
  if (similar.length < 3) return null

  const evPct = pctPositive(similar, "enterpriseValue")
  const revPct = pctPositive(similar, "revenue")
  const cashPct = pctPositive(similar, "cash")

  const verb = categoryVerb(type)
  const headline = `Across ${similar.length} similar companies, ${verb} improved enterprise value in ${evPct}% of cases.`

  const details: string[] = []
  if (revPct > 0) details.push(`Revenue increased in ${revPct}% of similar scenarios.`)
  if (cashPct > 0) details.push(`Liquidity improved in ${cashPct}% of cases.`)

  const kpiKeys = Object.keys(
    similar.reduce<Record<string, boolean>>((acc, e) => {
      for (const k of Object.keys(e.resultingDeltas)) acc[k] = true
      return acc
    }, {}),
  ) as KpiKey[]

  for (const kpi of kpiKeys) {
    if (["enterpriseValue", "revenue", "cash"].includes(kpi)) continue
    const pct = pctPositive(similar, kpi)
    const label = IMPACT_LABELS[kpi] ?? kpi
    if (pct >= 60) details.push(`${label} improved in ${pct}% of scenarios.`)
    else if (pct <= 30 && pct > 0) details.push(`${label} declined in ${100 - pct}% of scenarios — worth monitoring.`)
  }

  return { totalMatches: similar.length, headline, details: details.slice(0, 4) }
}

/* ═══════════════════════════════════════════════
   Zustand store
   ═══════════════════════════════════════════════ */

const MAX_ENTRIES = 500

interface ScenarioLibraryState {
  entries: ScenarioLibraryEntry[]

  record: (entry: Omit<ScenarioLibraryEntry, "id" | "timestamp">) => void
  getInsight: (type: ScenarioCategory, arrRange: ARRRange, growthRange: GrowthRange) => NetworkInsight | null
  clear: () => void
}

export const useScenarioLibraryStore = create<ScenarioLibraryState>()(
  persist(
    (set, get) => ({
      entries: [],

      record: (entry) => {
        const full: ScenarioLibraryEntry = {
          ...entry,
          id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
        }
        set((s) => ({
          entries: [full, ...s.entries].slice(0, MAX_ENTRIES),
        }))
      },

      getInsight: (type, arrRange, growthRange) =>
        generateNetworkInsight(get().entries, type, arrRange, growthRange),

      clear: () => set({ entries: [] }),
    }),
    {
      name: "stratfit-scenario-library-v1",
      version: 1,
      storage: safeLocalStoragePersist(),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
)
