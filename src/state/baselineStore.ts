// src/state/baselineStore.ts
import { create } from "zustand"
import type { Baseline } from "@/types/baseline"
import { BASELINE_STORAGE_KEY } from "@/types/baseline"

/**
 * Phase 1 canonical source-of-truth:
 * - baseline (Baseline contract)
 *
 * Legacy compatibility surface (do NOT remove yet):
 * - baselineInputs
 * - setBaselineInputs(...)
 *
 * Some existing pages (PositionLeftRail / PositionPage / InitializeForm) still reference
 * legacy fields like runwayMonths, revenue, burnRate, riskProfile.
 * We keep those as aliases in BaselineInputs to keep tsc green while Phase 1 flow is wired.
 */

export type BaselineInputs = {
  // canonical-ish inputs
  cash: number
  monthlyRevenue: number
  monthlyBurn: number
  arr: number
  growthRate: number
  grossMargin: number

  // legacy aliases expected by older consumers
  runwayMonths: number
  revenue: number
  burnRate: number
  riskProfile: string
}

type BaselineState = {
  // NEW canonical
  baseline: Baseline | null
  isHydrated: boolean
  setBaseline: (
    input: Omit<Baseline, "runwayMonths" | "lastUpdated"> &
      Partial<Pick<Baseline, "runwayMonths" | "lastUpdated">>
  ) => void
  clearBaseline: () => void
  hydrate: () => void

  // LEGACY shim surface
  baselineInputs: BaselineInputs
  setBaselineInputs: (inputs: Partial<BaselineInputs>) => void
}

function safeParseBaseline(raw: string | null): Baseline | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Partial<Baseline>
    if (
      typeof v.cash !== "number" ||
      typeof v.monthlyRevenue !== "number" ||
      typeof v.monthlyBurn !== "number" ||
      typeof v.arr !== "number" ||
      typeof v.growthRate !== "number" ||
      typeof v.grossMargin !== "number" ||
      typeof v.runwayMonths !== "number" ||
      typeof v.lastUpdated !== "number"
    ) {
      return null
    }
    return v as Baseline
  } catch {
    return null
  }
}

function computeRunwayMonths(cash: number, monthlyBurn: number): number {
  if (!Number.isFinite(cash) || !Number.isFinite(monthlyBurn)) return 0
  if (monthlyBurn <= 0) return 999
  const runway = cash / monthlyBurn
  if (!Number.isFinite(runway) || runway < 0) return 0
  return Math.round(runway * 10) / 10
}

function persistBaseline(baseline: Baseline | null) {
  try {
    if (!baseline) {
      localStorage.removeItem(BASELINE_STORAGE_KEY)
      return
    }
    localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(baseline))
  } catch {
    // ignore storage failures
  }
}

const DEFAULT_INPUTS: BaselineInputs = {
  cash: 0,
  monthlyRevenue: 0,
  monthlyBurn: 0,
  arr: 0,
  growthRate: 0,
  grossMargin: 0,

  runwayMonths: 0,
  revenue: 0,
  burnRate: 0,
  riskProfile: "unknown",
}

function deriveRiskProfile(runwayMonths: number): string {
  if (!Number.isFinite(runwayMonths)) return "unknown"
  if (runwayMonths >= 18) return "low"
  if (runwayMonths >= 9) return "medium"
  return "high"
}

function baselineToInputs(b: Baseline | null): BaselineInputs {
  if (!b) return { ...DEFAULT_INPUTS }

  const runwayMonths = Number.isFinite(b.runwayMonths) ? b.runwayMonths : computeRunwayMonths(b.cash, b.monthlyBurn)
  const revenue = b.monthlyRevenue
  const burnRate = b.monthlyBurn

  return {
    cash: b.cash,
    monthlyRevenue: b.monthlyRevenue,
    monthlyBurn: b.monthlyBurn,
    arr: b.arr,
    growthRate: b.growthRate,
    grossMargin: b.grossMargin,

    runwayMonths,
    revenue,
    burnRate,
    riskProfile: deriveRiskProfile(runwayMonths),
  }
}

export const useBaselineStore = create<BaselineState>((set, get) => ({
  // NEW canonical
  baseline: null,
  isHydrated: false,

  setBaseline: (input) => {
    const runwayMonths =
      typeof input.runwayMonths === "number"
        ? input.runwayMonths
        : computeRunwayMonths(input.cash, input.monthlyBurn)

    const lastUpdated =
      typeof input.lastUpdated === "number" ? input.lastUpdated : Date.now()

    const baseline: Baseline = {
      cash: input.cash,
      monthlyRevenue: input.monthlyRevenue,
      monthlyBurn: input.monthlyBurn,
      arr: input.arr,
      growthRate: input.growthRate,
      grossMargin: input.grossMargin,
      runwayMonths,
      lastUpdated,
    }

    set({
      baseline,
      baselineInputs: baselineToInputs(baseline), // keep legacy in sync
    })

    persistBaseline(baseline)
  },

  clearBaseline: () => {
    set({ baseline: null, baselineInputs: { ...DEFAULT_INPUTS } })
    persistBaseline(null)
  },

  hydrate: () => {
    const raw = (() => {
      try {
        return localStorage.getItem(BASELINE_STORAGE_KEY)
      } catch {
        return null
      }
    })()

    const baseline = safeParseBaseline(raw)

    set({
      baseline,
      baselineInputs: baselineToInputs(baseline),
      isHydrated: true,
    })
  },

  // LEGACY shim surface
  baselineInputs: { ...DEFAULT_INPUTS },

  setBaselineInputs: (inputs) => {
    // Merge into legacy view first
    const prev = get().baselineInputs
    const merged: BaselineInputs = { ...prev, ...inputs }

    // Normalize legacy aliases into canonical fields
    const normalizedMonthlyRevenue =
      typeof inputs.monthlyRevenue === "number"
        ? inputs.monthlyRevenue
        : typeof inputs.revenue === "number"
          ? inputs.revenue
          : merged.monthlyRevenue

    const normalizedMonthlyBurn =
      typeof inputs.monthlyBurn === "number"
        ? inputs.monthlyBurn
        : typeof inputs.burnRate === "number"
          ? inputs.burnRate
          : merged.monthlyBurn

    const normalizedRunwayMonths =
      typeof inputs.runwayMonths === "number"
        ? inputs.runwayMonths
        : computeRunwayMonths(merged.cash, normalizedMonthlyBurn)

    get().setBaseline({
      cash: merged.cash,
      monthlyRevenue: normalizedMonthlyRevenue,
      monthlyBurn: normalizedMonthlyBurn,
      arr: merged.arr,
      growthRate: merged.growthRate,
      grossMargin: merged.grossMargin,
      runwayMonths: normalizedRunwayMonths,
      // lastUpdated computed in setBaseline unless provided
    })
  },
}))
