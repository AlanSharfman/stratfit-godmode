// src/state/strategyStore.ts
// STRATFIT — Strategy Constitution Store (Truth-Locked)
// Strategy is a versioned contract. NO edit-in-place.
// - Onboarding creates Strategy v1 (constitution)
// - Any deep change creates Strategy v2+
// - Downstream systems reference strategyVersionId (auditability + reproducibility)

import { create } from "zustand";
import { persist } from "zustand/middleware";

// =============================================================================
// Types — Strategy Constitution (Deep, Versioned, Governed)
// =============================================================================

export type StrategyObjective =
  | "SURVIVAL"
  | "GROWTH"
  | "PROFITABILITY"
  | "EXIT"
  | "OPTIONALITY";

export type TimeHorizon = "12_18M" | "24_36M" | "3_5Y" | "5_10Y";

export type CapitalPlan = "BOOTSTRAP" | "EQUITY" | "DEBT" | "MIXED";

export type RiskAppetite = "LOW" | "MEDIUM" | "HIGH";

export type GrowthPosture = "EFFICIENCY_FIRST" | "BALANCED" | "GROWTH_FIRST";

export type MarginPosture = "PROTECT_MARGIN" | "TRADE_MARGIN_FOR_GROWTH";

export type HiringPosture = "CAUTIOUS" | "STEADY" | "ACCELERATE";

export type MarketPosture = "DEFEND_NICHE" | "EXPAND" | "DOMINATE";

export type ExitIntent = "NONE" | "OPTIONAL" | "TARGETED";

export type NonNegotiableKey =
  | "MIN_RUNWAY_MONTHS"
  | "MAX_RISK_SCORE"
  | "MIN_LTV_CAC"
  | "MAX_CAC_PAYBACK_MONTHS"
  | "MIN_GROSS_MARGIN_PCT"
  | "MAX_MONTHLY_BURN"
  | "NO_DOWN_ROUND"
  | "MAINTAIN_OPTIONALITY"
  | "AVOID_DILUTION";

export type KeyRisk =
  | "CHURN"
  | "CAC_INFLATION"
  | "FUNDING_RISK"
  | "DELIVERY_RISK"
  | "MARKET_SHOCK"
  | "REGULATORY"
  | "SECURITY"
  | "CONCENTRATION"
  | "PRICING_PRESSURE";

export type BaselinePolicy = "ACTUAL_TODAY" | "PROMOTABLE";

// Deep constraints used by engine + decision + risk
export interface StrategyConstraints {
  minRunwayMonths?: number; // e.g. 12 / 18 / 24
  maxRiskScore?: number; // 0..100 where higher = worse (your UI uses riskScore = 100 - riskIndex)
  minLtvCac?: number; // e.g. 2 / 3 / 5
  maxCacPaybackMonths?: number; // e.g. 12 / 18 / 24
  minGrossMarginPct?: number; // optional; you may not compute GM yet
  maxMonthlyBurn?: number; // optional; dollars per month
}

// “Operating dials” allowed to change freely without rewriting constitution.
// These are safe, but still stored as part of a version for traceability.
export interface StrategyControls {
  aggressiveness01: number; // 0..1 (execution speed)
  efficiencyBias01: number; // 0..1 (efficiency vs growth)
  riskPosture01: number; // 0..1 (safe vs aggressive)
  optionality01: number; // 0..1 (keep options open)
}

// Full constitution snapshot (deep strategy)
export interface StrategyConstitution {
  objective: StrategyObjective;
  timeHorizon: TimeHorizon;
  capitalPlan: CapitalPlan;
  riskAppetite: RiskAppetite;

  growthPosture: GrowthPosture;
  marginPosture: MarginPosture;
  hiringPosture: HiringPosture;
  marketPosture: MarketPosture;
  exitIntent: ExitIntent;

  constraints: StrategyConstraints;

  nonNegotiables: NonNegotiableKey[]; // 1–3 usually
  keyRisks: KeyRisk[]; // 0–5 usually

  baselinePolicy: BaselinePolicy; // default ACTUAL_TODAY; can be promoted explicitly later
}

// Version metadata — audit trail
export interface StrategyVersionMeta {
  version: number; // 1..n
  createdAtISO: string;
  createdBy: "ONBOARDING" | "USER" | "SYSTEM";
  changeReason?: string; // required for deep revision
  notes?: string;
  parentVersionId?: string; // if derived from prior
}

export interface StrategyVersion {
  id: string; // stable unique id
  name: string; // “Baseline Constitution”, “Board Revision”, etc.
  meta: StrategyVersionMeta;
  constitution: StrategyConstitution;
  controls: StrategyControls;

  // Link to baseline snapshot if you want later. Keep optional to avoid coupling.
  baselineRef?: {
    baselineScenarioId?: string; // e.g. scenario id in scenarioStore, optional
    createdFrom?: "ONBOARDING" | "PROMOTION";
  };
}

// A “diff” structure (minimal, deterministic) used for review + UI confirmation
export interface StrategyDiff {
  changed: Array<{
    path: string; // e.g. "constitution.objective"
    before: unknown;
    after: unknown;
  }>;
}

// =============================================================================
// Helpers
// =============================================================================

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export const DEFAULT_CONTROLS: StrategyControls = {
  aggressiveness01: 0.55,
  efficiencyBias01: 0.55,
  riskPosture01: 0.45,
  optionality01: 0.60,
};

export const DEFAULT_CONSTITUTION: StrategyConstitution = {
  objective: "SURVIVAL",
  timeHorizon: "24_36M",
  capitalPlan: "MIXED",
  riskAppetite: "MEDIUM",

  growthPosture: "BALANCED",
  marginPosture: "PROTECT_MARGIN",
  hiringPosture: "STEADY",
  marketPosture: "EXPAND",
  exitIntent: "OPTIONAL",

  constraints: {
    minRunwayMonths: 18,
    maxRiskScore: 55,
    minLtvCac: 3,
    maxCacPaybackMonths: 18,
  },

  nonNegotiables: ["MIN_RUNWAY_MONTHS"],
  keyRisks: ["FUNDING_RISK", "CAC_INFLATION"],

  baselinePolicy: "ACTUAL_TODAY",
};

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

// Deterministic diff for UI confirmation + logging.
// Not fancy. Just stable.
export function diffStrategy(a: StrategyVersion, b: StrategyVersion): StrategyDiff {
  const changed: StrategyDiff["changed"] = [];

  const walk = (path: string, va: any, vb: any) => {
    if (Object.is(va, vb)) return;

    const ta = typeof va;
    const tb = typeof vb;

    // primitives / null / arrays
    const isObjA = va && ta === "object" && !Array.isArray(va);
    const isObjB = vb && tb === "object" && !Array.isArray(vb);

    if (!isObjA || !isObjB) {
      // array or primitive or null mismatch
      changed.push({ path, before: va, after: vb });
      return;
    }

    const keys = new Set([...Object.keys(va), ...Object.keys(vb)]);
    for (const k of keys) {
      walk(path ? `${path}.${k}` : k, va[k], vb[k]);
    }
  };

  walk("", a, b);

  // remove noisy meta fields by default (keep constitution+controls focus)
  const filtered = changed.filter((c) => {
    return (
      c.path.startsWith("constitution.") ||
      c.path.startsWith("controls.") ||
      c.path === "name"
    );
  });

  return { changed: filtered };
}

// =============================================================================
// Store
// =============================================================================

interface StrategyState {
  // All versions (append-only semantics in practice)
  versions: StrategyVersion[];

  // Pointer to current active version
  activeVersionId: string | null;

  // -------- getters --------
  getActive: () => StrategyVersion | null;
  getById: (id: string) => StrategyVersion | null;

  // -------- lifecycle --------
  // Onboarding creates v1
  createBaselineV1: (args: {
    name?: string;
    constitution?: Partial<StrategyConstitution>;
    controls?: Partial<StrategyControls>;
    notes?: string;
  }) => StrategyVersion;

  // Strategy controls (lightweight) — allowed without "reason" requirement,
  // but still creates a new version for traceability (no edit-in-place).
  reviseControls: (args: {
    patch: Partial<StrategyControls>;
    notes?: string;
  }) => StrategyVersion | null;

  // Deep revision — requires reason; creates v2+
  reviseConstitution: (args: {
    patch: Partial<StrategyConstitution>;
    changeReason: string; // REQUIRED
    notes?: string;
    name?: string;
  }) => StrategyVersion | null;

  // Set active pointer
  setActiveVersion: (id: string) => void;

  // Promote current version as "baseline" reference (optional)
  // This is a hook to link the strategy version to your scenarioStore baseline later.
  setBaselineRef: (args: {
    strategyVersionId: string;
    baselineScenarioId: string;
    createdFrom: "ONBOARDING" | "PROMOTION";
  }) => void;

  // Hard reset (dev safety)
  resetAll: () => void;
}

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set, get) => ({
      versions: [],
      activeVersionId: null,

      getActive: () => {
        const id = get().activeVersionId;
        if (!id) return null;
        return get().versions.find((v) => v.id === id) ?? null;
      },

      getById: (id) => {
        return get().versions.find((v) => v.id === id) ?? null;
      },

      createBaselineV1: ({ name, constitution, controls, notes }) => {
        const v1: StrategyVersion = {
          id: uid("strategy_v"),
          name: name ?? "Baseline Constitution (v1)",
          meta: {
            version: 1,
            createdAtISO: new Date().toISOString(),
            createdBy: "ONBOARDING",
            notes,
          },
          constitution: {
            ...deepClone(DEFAULT_CONSTITUTION),
            ...(constitution ?? {}),
          },
          controls: {
            ...deepClone(DEFAULT_CONTROLS),
            ...(controls ?? {}),
          },
        };

        set((state) => ({
          versions: [v1, ...state.versions],
          activeVersionId: v1.id,
        }));

        return v1;
      },

      reviseControls: ({ patch, notes }) => {
        const active = get().getActive();
        if (!active) return null;

        const nextVersionNum = (active.meta.version ?? 1) + 1;

        const vNext: StrategyVersion = {
          ...deepClone(active),
          id: uid("strategy_v"),
          name: `${active.name.split(" (v")[0]} (v${nextVersionNum})`,
          meta: {
            version: nextVersionNum,
            createdAtISO: new Date().toISOString(),
            createdBy: "USER",
            parentVersionId: active.id,
            notes,
          },
          controls: {
            ...deepClone(active.controls),
            ...patch,
            aggressiveness01: clamp01(patch.aggressiveness01 ?? active.controls.aggressiveness01),
            efficiencyBias01: clamp01(patch.efficiencyBias01 ?? active.controls.efficiencyBias01),
            riskPosture01: clamp01(patch.riskPosture01 ?? active.controls.riskPosture01),
            optionality01: clamp01(patch.optionality01 ?? active.controls.optionality01),
          },
          // constitution unchanged
          constitution: deepClone(active.constitution),
        };

        set((state) => ({
          versions: [vNext, ...state.versions],
          activeVersionId: vNext.id,
        }));

        return vNext;
      },

      reviseConstitution: ({ patch, changeReason, notes, name }) => {
        const active = get().getActive();
        if (!active) return null;

        const nextVersionNum = (active.meta.version ?? 1) + 1;

        const vNext: StrategyVersion = {
          ...deepClone(active),
          id: uid("strategy_v"),
          name: name ?? `${active.name.split(" (v")[0]} (v${nextVersionNum})`,
          meta: {
            version: nextVersionNum,
            createdAtISO: new Date().toISOString(),
            createdBy: "USER",
            parentVersionId: active.id,
            changeReason,
            notes,
          },
          constitution: {
            ...deepClone(active.constitution),
            ...patch,
            constraints: {
              ...deepClone(active.constitution.constraints),
              ...(patch.constraints ?? {}),
            },
            nonNegotiables:
              patch.nonNegotiables ?? deepClone(active.constitution.nonNegotiables),
            keyRisks: patch.keyRisks ?? deepClone(active.constitution.keyRisks),
          },
          // controls carry forward unchanged
          controls: deepClone(active.controls),
        };

        set((state) => ({
          versions: [vNext, ...state.versions],
          activeVersionId: vNext.id,
        }));

        return vNext;
      },

      setActiveVersion: (id) => set({ activeVersionId: id }),

      setBaselineRef: ({ strategyVersionId, baselineScenarioId, createdFrom }) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === strategyVersionId
              ? {
                  ...v,
                  baselineRef: {
                    baselineScenarioId,
                    createdFrom,
                  },
                }
              : v
          ),
        }));
      },

      resetAll: () => set({ versions: [], activeVersionId: null }),
    }),
    {
      name: "sf.strategy.v1",
      version: 1,
      partialize: (s) => ({
        versions: s.versions,
        activeVersionId: s.activeVersionId,
      }),
    }
  )
);

// Convenience selectors
export const useActiveStrategy = () => useStrategyStore((s) => s.getActive());
export const useStrategyVersions = () => useStrategyStore((s) => s.versions);


