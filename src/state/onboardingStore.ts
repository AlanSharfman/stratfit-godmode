// src/state/onboardingStore.ts
// STRATFIT — Baseline Truth Store (minimal v1 for full-page Initialize Baseline)

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CurrencyCode =
  | "USD" | "AUD" | "EUR" | "GBP" | "CAD" | "NZD" | "SGD" | "JPY" | "INR" | "CHF"
  | "SEK" | "NOK" | "DKK" | "ZAR" | "PLN" | "CZK" | "HUF" | "ILS" | "AED" | "BRL" | "MXN";

type BaselineIdentity = {
  companyName: string;
  industry: string;
  country: string;
  currency: CurrencyCode;
};

type BaselineMetrics = {
  cashOnHand: number;
  monthlyBurn: number;
  currentARR: number;
  arrGrowthPct?: number;
  monthlyGrowthPct?: number;
  monthlyChurnPct?: number;
  nrrPct?: number;
};

type BaselineOperating = {
  headcount: number;
  avgFullyLoadedCostAnnual?: number;
  smMonthly?: number;
  rndMonthly?: number;
  gaMonthly?: number;
};

type BaselineAnswers = Record<string, { kind: string; value: unknown }>;

export type BaselineTruthSnapshot = {
  version: 1;
  timestampISO: string;
  identity: BaselineIdentity;
  metrics: BaselineMetrics;
  operating: BaselineOperating;
  answers: BaselineAnswers;
};

export type BaselineDraft = {
  identity: Partial<BaselineIdentity>;
  metrics: Partial<BaselineMetrics>;
  operating: Partial<BaselineOperating>;
  answers: BaselineAnswers;
};

export type BaselineDraftPatch = {
  identity?: Partial<BaselineIdentity>;
  metrics?: Partial<BaselineMetrics>;
  operating?: Partial<BaselineOperating>;
  answers?: BaselineAnswers;
};

type BaselineState = {
  hydrated: boolean;
  markHydrated: () => void;

  baselineLocked: boolean;
  baseline: BaselineTruthSnapshot | null;
  draft: BaselineDraft;

  setDraft: (patch: BaselineDraftPatch) => void;
  lockBaselineFromDraft: () => BaselineTruthSnapshot | null;
  resetBaseline: () => void;
};

const DEFAULT_DRAFT: BaselineDraft = {
  identity: {
    companyName: "",
    industry: "",
    country: "",
    currency: "USD",
  },
  metrics: {
    cashOnHand: 0,
    monthlyBurn: 0,
    currentARR: 0,
  },
  operating: {
    headcount: 0,
    avgFullyLoadedCostAnnual: 0,
    smMonthly: 0,
    rndMonthly: 0,
    gaMonthly: 0,
  },
  answers: {},
};

function clampNum(n: unknown, min: number, max: number) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(min, Math.min(max, v));
}

export const useBaselineStore = create<BaselineState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      markHydrated: () => set({ hydrated: true }),

      baselineLocked: false,
      baseline: null,
      draft: DEFAULT_DRAFT,

      setDraft: (patch) => {
        set((state) => ({
          draft: {
            ...state.draft,
            identity: { ...state.draft.identity, ...(patch.identity ?? {}) },
            metrics: { ...state.draft.metrics, ...(patch.metrics ?? {}) },
            operating: { ...state.draft.operating, ...(patch.operating ?? {}) },
            answers: patch.answers ? { ...state.draft.answers, ...patch.answers } : state.draft.answers,
          },
        }));
      },

      lockBaselineFromDraft: () => {
        const d = get().draft;

        const companyName = String(d.identity.companyName ?? "").trim();
        const currency = (d.identity.currency ?? "USD") as CurrencyCode;

        const anySignal =
          clampNum(d.metrics.cashOnHand, 0, 1e15) > 0 ||
          clampNum(d.metrics.monthlyBurn, 0, 1e15) > 0 ||
          clampNum(d.metrics.currentARR, 0, 1e15) > 0 ||
          clampNum(d.operating.headcount, 0, 1e9) > 0;

        if (!companyName) return null;
        if (!currency) return null;
        if (!anySignal) return null;

        const snap: BaselineTruthSnapshot = {
          version: 1,
          timestampISO: new Date().toISOString(),
          identity: {
            companyName,
            industry: String(d.identity.industry ?? ""),
            country: String(d.identity.country ?? ""),
            currency,
          },
          metrics: {
            cashOnHand: clampNum(d.metrics.cashOnHand, 0, 1e15),
            monthlyBurn: clampNum(d.metrics.monthlyBurn, 0, 1e15),
            currentARR: clampNum(d.metrics.currentARR, 0, 1e15),
            arrGrowthPct:
              d.metrics.arrGrowthPct === undefined
                ? undefined
                : clampNum(d.metrics.arrGrowthPct, 0, 1000),
            monthlyGrowthPct:
              d.metrics.monthlyGrowthPct === undefined
                ? undefined
                : clampNum(d.metrics.monthlyGrowthPct, 0, 1000),
            monthlyChurnPct:
              d.metrics.monthlyChurnPct === undefined
                ? undefined
                : clampNum(d.metrics.monthlyChurnPct, 0, 1000),
            nrrPct:
              d.metrics.nrrPct === undefined
                ? undefined
                : clampNum(d.metrics.nrrPct, 0, 1000),
          },
          operating: {
            headcount: clampNum(d.operating.headcount, 0, 1e9),
            avgFullyLoadedCostAnnual:
              d.operating.avgFullyLoadedCostAnnual === undefined
                ? undefined
                : clampNum(d.operating.avgFullyLoadedCostAnnual, 0, 1e15),
            smMonthly:
              d.operating.smMonthly === undefined
                ? undefined
                : clampNum(d.operating.smMonthly, 0, 1e15),
            rndMonthly:
              d.operating.rndMonthly === undefined
                ? undefined
                : clampNum(d.operating.rndMonthly, 0, 1e15),
            gaMonthly:
              d.operating.gaMonthly === undefined
                ? undefined
                : clampNum(d.operating.gaMonthly, 0, 1e15),
          },
          answers: d.answers ?? {},
        };

        set({
          baselineLocked: true,
          baseline: snap,
        });

        return snap;
      },

      resetBaseline: () => {
        set({
          baselineLocked: false,
          baseline: null,
          draft: DEFAULT_DRAFT,
        });
      },
    }),
    {
      name: "sf.baseline.v1",
      version: 1,
      partialize: (s) => ({
        baselineLocked: s.baselineLocked,
        baseline: s.baseline,
        draft: s.draft,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);


