// src/state/onboardingStore.ts
// STRATFIT — Baseline Truth Store (Truth-Locked, Persisted)
// - Persist key MUST be: "sf.baseline.v1"
// - Baseline becomes immutable after locking (except via explicit reset)

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "INR" | "BRL" | "MXN" | "SGD" | "CHF" | "SEK" | "NOK" | "DKK" | "NZD" | "ZAR" | "PLN" | "CZK" | "HUF" | "ILS" | "AED";

export type SalesMotion = "PLG" | "SLG" | "ENTERPRISE" | "CHANNEL" | "HYBRID" | "UNKNOWN";
export type PricingModel = "SUBSCRIPTION" | "USAGE" | "SEAT_BASED" | "TIERED" | "SERVICES" | "HYBRID" | "UNKNOWN";

export type StrategyObjective = "SURVIVAL" | "GROWTH" | "PROFITABILITY" | "OPTIONALITY" | "EXIT";
export type RiskAppetite = "LOW" | "MEDIUM" | "HIGH";

export type BaselineQuestionId =
  | "primaryObjective"
  | "riskAppetite"
  | "growthUrgency"
  | "marginDiscipline"
  | "hiringPlan"
  | "marketVolatility"
  | "executionConfidence"
  | "fundingConstraint"
  | "pricingPower"
  | "competitivePressure";

export type BaselineAnswer =
  | { kind: "radio"; value: string }
  | { kind: "scale"; value: number } // 0..10
  | { kind: "text"; value: string };

export type BaselineAnswers = Record<BaselineQuestionId, BaselineAnswer>;

export type BaselineIdentity = {
  companyName: string;
  industry: string;
  country: string;
  currency: CurrencyCode;
};

export type BaselineMetrics = {
  cashOnHand: number; // in currency units
  monthlyBurn: number; // in currency units (positive number)
  currentARR: number; // in currency units
  arrGrowthPct?: number; // optional, percent (e.g. 25 for +25%)
  grossMarginPct?: number; // optional, percent (e.g. 72 for 72%)
};

export type BaselineOperatingPosture = {
  headcount: number;
  salesMotion: SalesMotion;
  pricingModel: PricingModel;
};

export type BaselineTruthSnapshot = {
  modelVersion: "sf.baseline.v1";
  createdAtISO: string;
  updatedAtISO: string;

  identity: BaselineIdentity;
  metrics: BaselineMetrics;
  operating: BaselineOperatingPosture;

  answers: BaselineAnswers;
};

export type BaselineDraft = Omit<BaselineTruthSnapshot, "createdAtISO" | "updatedAtISO"> & {
  createdAtISO?: string;
  updatedAtISO?: string;
};

export type BaselineDraftPatch = Omit<
  Partial<BaselineDraft>,
  "identity" | "metrics" | "operating" | "answers"
> & {
  identity?: Partial<BaselineIdentity>;
  metrics?: Partial<BaselineMetrics>;
  operating?: Partial<BaselineOperatingPosture>;
  answers?: Partial<BaselineAnswers>;
};

function nowISO() {
  return new Date().toISOString();
}

function clampNum(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export const DEFAULT_BASELINE_DRAFT: BaselineDraft = {
  modelVersion: "sf.baseline.v1",
  identity: {
    companyName: "",
    industry: "",
    country: "United States",
    currency: "USD",
  },
  metrics: {
    cashOnHand: 0,
    monthlyBurn: 0,
    currentARR: 0,
    arrGrowthPct: undefined,
    grossMarginPct: undefined,
  },
  operating: {
    headcount: 0,
    salesMotion: "UNKNOWN",
    pricingModel: "UNKNOWN",
  },
  answers: {
    primaryObjective: { kind: "radio", value: "SURVIVAL" },
    riskAppetite: { kind: "radio", value: "MEDIUM" },
    growthUrgency: { kind: "scale", value: 5 },
    marginDiscipline: { kind: "scale", value: 5 },
    hiringPlan: { kind: "radio", value: "STEADY" },
    marketVolatility: { kind: "scale", value: 5 },
    executionConfidence: { kind: "scale", value: 6 },
    fundingConstraint: { kind: "scale", value: 5 },
    pricingPower: { kind: "scale", value: 5 },
    competitivePressure: { kind: "scale", value: 5 },
  },
};

interface BaselineState {
  baseline: BaselineTruthSnapshot | null;
  baselineLocked: boolean;
  hydrated: boolean;

  // Draft convenience (UI can stage edits without locking)
  draft: BaselineDraft;

  // Actions
  setDraft: (patch: BaselineDraftPatch) => void;
  lockBaselineFromDraft: () => BaselineTruthSnapshot | null;
  resetBaseline: () => void;
}

export const useBaselineStore = create<BaselineState>()(
  persist(
    (set, get) => ({
      baseline: null,
      baselineLocked: false,
      hydrated: false,
      draft: DEFAULT_BASELINE_DRAFT,

      setDraft: (patch) => {
        set((s) => ({
          draft: {
            ...s.draft,
            ...patch,
            identity: { ...s.draft.identity, ...(patch.identity ?? {}) },
            metrics: { ...s.draft.metrics, ...(patch.metrics ?? {}) },
            operating: { ...s.draft.operating, ...(patch.operating ?? {}) },
            answers: { ...s.draft.answers, ...(patch.answers ?? {}) },
          },
        }));
      },

      lockBaselineFromDraft: () => {
        const d = get().draft;

        const cashOnHand = clampNum(Number(d.metrics.cashOnHand ?? 0), 0, 1e15);
        const monthlyBurn = clampNum(Math.abs(Number(d.metrics.monthlyBurn ?? 0)), 0, 1e15);
        const currentARR = clampNum(Number(d.metrics.currentARR ?? 0), 0, 1e15);

        const arrGrowthPctRaw =
          d.metrics.arrGrowthPct === undefined || d.metrics.arrGrowthPct === null || d.metrics.arrGrowthPct === ("" as any)
            ? undefined
            : Number(d.metrics.arrGrowthPct);
        const grossMarginPctRaw =
          d.metrics.grossMarginPct === undefined || d.metrics.grossMarginPct === null || d.metrics.grossMarginPct === ("" as any)
            ? undefined
            : Number(d.metrics.grossMarginPct);

        const snapshot: BaselineTruthSnapshot = {
          modelVersion: "sf.baseline.v1",
          createdAtISO: d.createdAtISO ?? nowISO(),
          updatedAtISO: nowISO(),
          identity: {
            companyName: String(d.identity.companyName ?? "").trim(),
            industry: String(d.identity.industry ?? "").trim(),
            country: String(d.identity.country ?? "").trim(),
            currency: d.identity.currency ?? "USD",
          },
          metrics: {
            cashOnHand,
            monthlyBurn,
            currentARR,
            arrGrowthPct: Number.isFinite(arrGrowthPctRaw as number) ? (arrGrowthPctRaw as number) : undefined,
            grossMarginPct: Number.isFinite(grossMarginPctRaw as number) ? (grossMarginPctRaw as number) : undefined,
          },
          operating: {
            headcount: clampNum(Number(d.operating.headcount ?? 0), 0, 10_000_000),
            salesMotion: d.operating.salesMotion ?? "UNKNOWN",
            pricingModel: d.operating.pricingModel ?? "UNKNOWN",
          },
          answers: d.answers,
        };

        set({
          baseline: snapshot,
          baselineLocked: true,
          draft: snapshot,
        });

        return snapshot;
      },

      resetBaseline: () => {
        try {
          window.localStorage.removeItem("sf.baseline.v1");
        } catch {}
        set({
          baseline: null,
          baselineLocked: false,
          draft: DEFAULT_BASELINE_DRAFT,
        });
      },
    }),
    {
      name: "sf.baseline.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        baseline: s.baseline,
        baselineLocked: s.baselineLocked,
        draft: s.draft,
      }),
      merge: (persistedState, currentState) => {
        const p = (persistedState as any) ?? {};
        const baseline = p.baseline ?? null;
        const baselineLocked = !!p.baselineLocked;
        const draft = p.draft ?? (baseline ?? DEFAULT_BASELINE_DRAFT);
        return {
          ...currentState,
          baseline,
          baselineLocked,
          draft,
          hydrated: true,
        };
      },
    }
  )
);

export const useBaselineLocked = () => useBaselineStore((s) => s.baselineLocked);
export const useBaselineSnapshot = () => useBaselineStore((s) => s.baseline);
export const useBaselineHydrated = () => useBaselineStore((s) => s.hydrated);


