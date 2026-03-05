// src/state/baselineStore.ts
import { create } from "zustand"
import type { Baseline } from "@/types/baseline"
import { BASELINE_STORAGE_KEY } from "@/onboard/baseline"

/**
 * TEMP legacy-compatible input shape used by older pages/components.
 * Keep this until we finish Phase 1 migrations.
 */
export type RiskSeverity = "low" | "medium" | "high" | "unknown"

export type BaselineInputs = {
  // Canonical Phase 1 fields (8 numeric + optional stage)
  cash: number
  monthlyBurn: number
  revenue: number
  grossMargin: number
  growthRate: number
  churnRate: number
  headcount: number
  arpa: number
  stage?: string

  // TEMP legacy aliases (shim)
  runwayMonths?: number
  burnRate?: number
  lastUpdated?: number
  riskProfile?: RiskSeverity
}

export type BaselineState = {
  baseline: Baseline | null
  isHydrated: boolean

  // Phase 1 canonical API
  setBaseline: (inputs: BaselineInputs) => void
  clearBaseline: () => void
  hydrate: () => void

  // TEMP legacy shim API (remove later)
  baselineInputs: BaselineInputs
  setBaselineInputs: (inputs: Partial<BaselineInputs>) => void
}

const clampNumber = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

export function computeRunwayMonths(cash: number, monthlyBurn: number) {
  const c = clampNumber(cash)
  const b = clampNumber(monthlyBurn)
  if (b <= 0) return Infinity
  return c / b
}

export function deriveRiskProfile(runwayMonths: number): RiskSeverity {
  if (!Number.isFinite(runwayMonths)) return "unknown"
  if (runwayMonths >= 18) return "low"
  if (runwayMonths >= 9) return "medium"
  return "high"
}

function persistBaseline(baseline: Baseline | null) {
  try {
    if (!baseline) {
      localStorage.removeItem(BASELINE_STORAGE_KEY)
      return
    }
    localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(baseline))
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

function safeParseBaseline(raw: string | null): Baseline | null {
  if (!raw) return null
  try {
    const obj = JSON.parse(raw) as any
    // Handle BaselineV1 (nested format written by InitializeBaselinePage)
    if (obj?.version === 1 && obj?.financial) {
      const f = obj.financial
      const o = obj.operating ?? {}
      return {
        cash:        Number(f.cashOnHand)    || 0,
        monthlyBurn: Number(f.monthlyBurn)   || 0,
        revenue:     (Number(f.arr) || 0) / 12,
        grossMargin: (Number(f.grossMarginPct) || 0) / 100,
        growthRate:  (Number(f.growthRatePct)  || 0) / 100,
        churnRate:   (Number(o.churnPct)       || 0) / 100,
        headcount:   Number(f.headcount)     || 0,
        arpa:        Number(o.acv)           || 0,
        stage:       obj.company?.industry   || undefined,
      }
    }
    // Legacy flat format
    const required: (keyof Baseline)[] = [
      "cash", "monthlyBurn", "revenue", "grossMargin",
      "growthRate", "churnRate", "headcount", "arpa",
    ]
    for (const k of required) {
      const v = obj[k]
      if (typeof v !== "number" || !Number.isFinite(v)) return null
    }
    return obj as Baseline
  } catch {
    return null
  }
}

export const DEFAULT_INPUTS: BaselineInputs = {
  cash: 0,
  monthlyBurn: 0,
  revenue: 0,
  grossMargin: 0,
  growthRate: 0,
  churnRate: 0,
  headcount: 0,
  arpa: 0,
  riskProfile: "unknown",
  runwayMonths: 0,
  burnRate: 0,
  lastUpdated: Date.now(),
}

function inputsToBaseline(inputs: BaselineInputs): Baseline {
  const b: Baseline = {
    cash: clampNumber(inputs.cash),
    monthlyBurn: clampNumber(inputs.monthlyBurn),
    revenue: clampNumber(inputs.revenue),
    grossMargin: clampNumber(inputs.grossMargin),
    growthRate: clampNumber(inputs.growthRate),
    churnRate: clampNumber(inputs.churnRate),
    headcount: clampNumber(inputs.headcount),
    arpa: clampNumber(inputs.arpa),
  }
  if (inputs.stage) b.stage = inputs.stage
  return b
}

function baselineToInputs(baseline: Baseline | null): BaselineInputs {
  if (!baseline) return { ...DEFAULT_INPUTS }
  const runwayMonths = computeRunwayMonths(baseline.cash, baseline.monthlyBurn)
  return {
    ...baseline,
    burnRate: baseline.monthlyBurn,
    runwayMonths: Number.isFinite(runwayMonths) ? runwayMonths : 0,
    riskProfile: deriveRiskProfile(runwayMonths),
    lastUpdated: Date.now(),
  }
}

export const useBaselineStore = create<BaselineState>((set, get) => ({
  baseline: null,
  isHydrated: false,

  // Legacy shim values (until we migrate all callers)
  baselineInputs: { ...DEFAULT_INPUTS },

  setBaseline: (inputs) => {
    const baseline = inputsToBaseline(inputs)

    // Compute legacy shim values
    const nextInputs = baselineToInputs(baseline)

    set({
      baseline,
      baselineInputs: nextInputs,

      // CRITICAL: if the user is setting baseline now, we are effectively hydrated.
      isHydrated: true,
    })

    persistBaseline(baseline)
  },

  clearBaseline: () => {
    set({
      baseline: null,
      baselineInputs: { ...DEFAULT_INPUTS },
      // Keep hydrated true so UI doesn't hang on "Loading..."
      isHydrated: true,
    })
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
      // CRITICAL: always flip this, even if there is no baseline
      isHydrated: true,
    })
  },

  setBaselineInputs: (partial) => {
    const prev = get().baselineInputs
    const merged: BaselineInputs = { ...prev, ...partial }

    // Normalize aliases -> canonical
    if (typeof merged.burnRate === "number" && !Number.isFinite(merged.monthlyBurn)) {
      merged.monthlyBurn = merged.burnRate
    }
    if (typeof merged.monthlyBurn !== "number") merged.monthlyBurn = clampNumber(merged.burnRate)

    // Drive canonical setter (single source of truth)
    get().setBaseline(merged)
  },
}))
