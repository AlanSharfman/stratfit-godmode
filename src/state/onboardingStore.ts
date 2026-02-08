// src/state/onboardingStore.ts
// STRATFIT — Baseline Truth Store (expanded v1 for full-page Initialize Baseline)

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CurrencyCode =
  | "USD" | "AUD" | "EUR" | "GBP" | "CAD" | "NZD" | "SGD" | "JPY" | "INR" | "CHF"
  | "SEK" | "NOK" | "DKK" | "ZAR" | "PLN" | "CZK" | "HUF" | "ILS" | "AED" | "BRL" | "MXN";

export type AccessToCapital = "Low" | "Moderate" | "Strong";
export type PrimaryObjective = "Runway" | "ARR Growth" | "Efficiency" | "Profitability";
export type RiskAppetite = "Conservative" | "Balanced" | "Aggressive";
export type BurnFlexibility = "Fixed" | "Variable";
export type HiringVelocity = "Low" | "Medium" | "High";

type BaselineIdentity = {
  companyName: string;
  industry: string;
  country: string;
  currency: CurrencyCode;
};

type BaselineFunding = {
  restrictedCash?: number;           // cash not available to burn
  committedCapital?: number;         // signed/committed funding not yet received
  debtOutstanding?: number;
  interestRatePct?: number;
  fundraisingWindowMonths?: number;  // e.g. "6 months"
  accessToCapital?: AccessToCapital;
  covenantLimitsEnabled?: boolean;
};

type BaselineMetrics = {
  cashOnHand: number;
  monthlyBurn: number;               // direct burn input (optional, can be 0)
  currentARR: number;

  // Legacy compatibility (some quarantined modules still reference this)
  arrGrowthPct?: number;

  monthlyGrowthPct?: number;
  monthlyChurnPct?: number;
  nrrPct?: number;

  grossMarginPct?: number;
  acv?: number;                      // average contract value (annual)
  salesCycleMonths?: number;
  pipelineCoverageX?: number;
};

type BaselineCost = {
  cogsPct?: number;
  oneOffMonthly?: number;            // exceptional/one-off monthly costs
};

type BaselineOperating = {
  headcount: number;
  avgFullyLoadedCostAnnual?: number;

  smMonthly?: number;
  rndMonthly?: number;
  gaMonthly?: number;

  hiringVelocity?: HiringVelocity;
  salesRampMonths?: number;
  engineeringVelocityMonths?: number;

  burnFlexibility?: BurnFlexibility;
};

type BaselinePosture = {
  primaryObjective?: PrimaryObjective;
  riskAppetite?: RiskAppetite;
  targetGrowthBandPct?: number;      // “target growth band” slider input (monthly %)
};

type BaselineAnswers = Record<string, { kind: string; value: unknown }>;

export type BaselineTruthSnapshot = {
  version: 1;
  timestampISO: string;
  identity: BaselineIdentity;
  funding: BaselineFunding;
  metrics: BaselineMetrics;
  cost: BaselineCost;
  operating: BaselineOperating;
  posture: BaselinePosture;
  answers: BaselineAnswers;
};

export type BaselineDraft = {
  identity: Partial<BaselineIdentity>;
  funding: Partial<BaselineFunding>;
  metrics: Partial<BaselineMetrics>;
  cost: Partial<BaselineCost>;
  operating: Partial<BaselineOperating>;
  posture: Partial<BaselinePosture>;
  answers: BaselineAnswers;
};

export type BaselineDraftPatch = Partial<{
  identity: Partial<BaselineIdentity>;
  funding: Partial<BaselineFunding>;
  metrics: Partial<BaselineMetrics>;
  cost: Partial<BaselineCost>;
  operating: Partial<BaselineOperating>;
  posture: Partial<BaselinePosture>;
  answers: BaselineAnswers;
}>;

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
  funding: {
    restrictedCash: 0,
    committedCapital: 0,
    debtOutstanding: 0,
    interestRatePct: 0,
    fundraisingWindowMonths: 6,
    accessToCapital: "Moderate",
    covenantLimitsEnabled: false,
  },
  metrics: {
    cashOnHand: 0,
    monthlyBurn: 0,
    currentARR: 0,
    monthlyGrowthPct: 0,
    monthlyChurnPct: 0,
    nrrPct: 100,
    grossMarginPct: 75,
    acv: 0,
    salesCycleMonths: 3,
    pipelineCoverageX: 1.0,
  },
  cost: {
    cogsPct: 0,
    oneOffMonthly: 0,
  },
  operating: {
    headcount: 0,
    avgFullyLoadedCostAnnual: 0,
    smMonthly: 0,
    rndMonthly: 0,
    gaMonthly: 0,
    hiringVelocity: "Medium",
    salesRampMonths: 4,
    engineeringVelocityMonths: 4,
    burnFlexibility: "Variable",
  },
  posture: {
    primaryObjective: "Runway",
    riskAppetite: "Balanced",
    targetGrowthBandPct: 8,
  },
  answers: {},
};

function normalizeDraft(draft: Partial<BaselineDraft> | undefined | null): BaselineDraft {
  const d = draft ?? {};
  return {
    ...DEFAULT_DRAFT,
    ...d,
    identity: { ...DEFAULT_DRAFT.identity, ...(d.identity ?? {}) },
    funding: { ...DEFAULT_DRAFT.funding, ...(d.funding ?? {}) },
    metrics: { ...DEFAULT_DRAFT.metrics, ...(d.metrics ?? {}) },
    cost: { ...DEFAULT_DRAFT.cost, ...(d.cost ?? {}) },
    operating: { ...DEFAULT_DRAFT.operating, ...(d.operating ?? {}) },
    posture: { ...DEFAULT_DRAFT.posture, ...(d.posture ?? {}) },
    answers: d.answers ?? DEFAULT_DRAFT.answers,
  };
}

function normalizeBaseline(
  baseline: Partial<BaselineTruthSnapshot> | BaselineTruthSnapshot | null | undefined
): BaselineTruthSnapshot | null {
  if (!baseline) return null;
  const b: any = baseline;
  return {
    version: 1,
    timestampISO: String(b.timestampISO ?? new Date().toISOString()),
    identity: { ...(DEFAULT_DRAFT.identity as BaselineIdentity), ...(b.identity ?? {}) },
    funding: { ...DEFAULT_DRAFT.funding, ...(b.funding ?? {}) },
    metrics: { ...(DEFAULT_DRAFT.metrics as BaselineMetrics), ...(b.metrics ?? {}) },
    cost: { ...DEFAULT_DRAFT.cost, ...(b.cost ?? {}) },
    operating: { ...(DEFAULT_DRAFT.operating as BaselineOperating), ...(b.operating ?? {}) },
    posture: { ...DEFAULT_DRAFT.posture, ...(b.posture ?? {}) },
    answers: (b.answers ?? {}) as BaselineAnswers,
  };
}

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
            funding: { ...state.draft.funding, ...(patch.funding ?? {}) },
            metrics: { ...state.draft.metrics, ...(patch.metrics ?? {}) },
            cost: { ...state.draft.cost, ...(patch.cost ?? {}) },
            operating: { ...state.draft.operating, ...(patch.operating ?? {}) },
            posture: { ...state.draft.posture, ...(patch.posture ?? {}) },
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
          funding: {
            restrictedCash: clampNum(d.funding.restrictedCash, 0, 1e15),
            committedCapital: clampNum(d.funding.committedCapital, 0, 1e15),
            debtOutstanding: clampNum(d.funding.debtOutstanding, 0, 1e15),
            interestRatePct: clampNum(d.funding.interestRatePct, 0, 100),
            fundraisingWindowMonths: clampNum(d.funding.fundraisingWindowMonths, 0, 120),
            accessToCapital: (d.funding.accessToCapital ?? "Moderate") as AccessToCapital,
            covenantLimitsEnabled: Boolean(d.funding.covenantLimitsEnabled ?? false),
          },
          metrics: {
            cashOnHand: clampNum(d.metrics.cashOnHand, 0, 1e15),
            monthlyBurn: clampNum(d.metrics.monthlyBurn, 0, 1e15),
            currentARR: clampNum(d.metrics.currentARR, 0, 1e15),

            monthlyGrowthPct: d.metrics.monthlyGrowthPct === undefined ? undefined : clampNum(d.metrics.monthlyGrowthPct, 0, 1000),
            monthlyChurnPct: d.metrics.monthlyChurnPct === undefined ? undefined : clampNum(d.metrics.monthlyChurnPct, 0, 100),
            nrrPct: d.metrics.nrrPct === undefined ? undefined : clampNum(d.metrics.nrrPct, 0, 300),

            grossMarginPct: d.metrics.grossMarginPct === undefined ? undefined : clampNum(d.metrics.grossMarginPct, 0, 100),
            acv: d.metrics.acv === undefined ? undefined : clampNum(d.metrics.acv, 0, 1e15),
            salesCycleMonths: d.metrics.salesCycleMonths === undefined ? undefined : clampNum(d.metrics.salesCycleMonths, 0, 60),
            pipelineCoverageX: d.metrics.pipelineCoverageX === undefined ? undefined : clampNum(d.metrics.pipelineCoverageX, 0, 100),
          },
          cost: {
            cogsPct: d.cost.cogsPct === undefined ? undefined : clampNum(d.cost.cogsPct, 0, 100),
            oneOffMonthly: d.cost.oneOffMonthly === undefined ? undefined : clampNum(d.cost.oneOffMonthly, 0, 1e15),
          },
          operating: {
            headcount: clampNum(d.operating.headcount, 0, 1e9),
            avgFullyLoadedCostAnnual: d.operating.avgFullyLoadedCostAnnual === undefined ? undefined : clampNum(d.operating.avgFullyLoadedCostAnnual, 0, 1e15),
            smMonthly: d.operating.smMonthly === undefined ? undefined : clampNum(d.operating.smMonthly, 0, 1e15),
            rndMonthly: d.operating.rndMonthly === undefined ? undefined : clampNum(d.operating.rndMonthly, 0, 1e15),
            gaMonthly: d.operating.gaMonthly === undefined ? undefined : clampNum(d.operating.gaMonthly, 0, 1e15),

            hiringVelocity: (d.operating.hiringVelocity ?? "Medium") as HiringVelocity,
            salesRampMonths: d.operating.salesRampMonths === undefined ? undefined : clampNum(d.operating.salesRampMonths, 0, 36),
            engineeringVelocityMonths: d.operating.engineeringVelocityMonths === undefined ? undefined : clampNum(d.operating.engineeringVelocityMonths, 0, 36),
            burnFlexibility: (d.operating.burnFlexibility ?? "Variable") as BurnFlexibility,
          },
          posture: {
            primaryObjective: (d.posture.primaryObjective ?? "Runway") as PrimaryObjective,
            riskAppetite: (d.posture.riskAppetite ?? "Balanced") as RiskAppetite,
            targetGrowthBandPct: d.posture.targetGrowthBandPct === undefined ? undefined : clampNum(d.posture.targetGrowthBandPct, 0, 100),
          },
          answers: d.answers ?? {},
        };

        set({ baselineLocked: true, baseline: snap });
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
      // Back-compat: old persisted snapshots may miss new nested objects (funding/cost/posture).
      // Merge defaults in so the UI never crashes on undefined access after deploy.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<BaselineState>;
        return {
          ...current,
          ...p,
          baselineLocked: Boolean(p.baselineLocked),
          baseline: normalizeBaseline(p.baseline as any),
          draft: normalizeDraft(p.draft as any),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);


