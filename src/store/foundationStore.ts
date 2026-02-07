import { create } from "zustand";

export type FoundationData = {
  // CORPORATE IDENTITY
  industry: string;
  stage: string;
  currency: string;
  foundingDate: string;

  // TREASURY POSITION
  cash: string;
  burn: string;
  runway: string;

  // REVENUE CORE
  arr: string;
  mrr: string;
  growth: string;
  customerCount: string;

  // UNIT ECONOMICS
  acv: string;
  cac: string;
  ltv: string;
  paybackPeriod: string;

  // RETENTION & EFFICIENCY
  churn: string;
  nrr: string;
  grossMargin: string;
  magicNumber: string;

  // OPERATING MODEL
  headcount: string;
  avgCost: string;
  salesMarketingSpend: string;
  rdSpend: string;

  // CAPITAL STRUCTURE
  debtOutstanding: string;
  interestRate: string;
  nextRaiseMonths: string;
  lastRaiseAmount: string;
};

type FoundationState = {
  draft: FoundationData;
  baseline: FoundationData | null;

  locked: boolean;
  dirtySinceLock: boolean;

  setField: (key: keyof FoundationData, value: string) => void;
  lock: () => void;
  unlock: () => void;
  reset: () => void;
};

const empty: FoundationData = {
  // CORPORATE IDENTITY
  industry: "",
  stage: "",
  currency: "",
  foundingDate: "",

  // TREASURY POSITION
  cash: "",
  burn: "",
  runway: "",

  // REVENUE CORE
  arr: "",
  mrr: "",
  growth: "",
  customerCount: "",

  // UNIT ECONOMICS
  acv: "",
  cac: "",
  ltv: "",
  paybackPeriod: "",

  // RETENTION & EFFICIENCY
  churn: "",
  nrr: "",
  grossMargin: "",
  magicNumber: "",

  // OPERATING MODEL
  headcount: "",
  avgCost: "",
  salesMarketingSpend: "",
  rdSpend: "",

  // CAPITAL STRUCTURE
  debtOutstanding: "",
  interestRate: "",
  nextRaiseMonths: "",
  lastRaiseAmount: "",
};

export const useFoundationStore = create<FoundationState>((set, get) => ({
  draft: { ...empty },
  baseline: null,

  locked: false,
  dirtySinceLock: false,

  setField: (key, value) =>
    set((state) => ({
      draft: { ...state.draft, [key]: value },
      dirtySinceLock: state.locked ? true : state.dirtySinceLock,
    })),

  lock: () =>
    set((state) => ({
      baseline: { ...state.draft },
      locked: true,
      dirtySinceLock: false,
    })),

  unlock: () =>
    set({
      locked: false,
      dirtySinceLock: false,
    }),

  reset: () =>
    set({
      draft: { ...empty },
      baseline: null,
      locked: false,
      dirtySinceLock: false,
    }),
}));
