// src/stores/strategicDeclarationStore.ts

import { create } from 'zustand';
import type {
  DerivedMetrics,
  StrategicDeclarationInput,
  StrategicDeclarationPayload,
} from '@/types/strategicDeclaration';

interface StrategicDeclarationState {
  input: Partial<StrategicDeclarationInput>;
  locked: boolean;
  setField: <K extends keyof StrategicDeclarationInput>(
    key: K,
    value: StrategicDeclarationInput[K]
  ) => void;
  calculateDerived: () => DerivedMetrics | null;
  buildPayload: () => StrategicDeclarationPayload | null;
  lock: () => void;
  reset: () => void;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function hasAllForPayload(
  input: Partial<StrategicDeclarationInput>
): input is StrategicDeclarationInput {
  return (
    typeof input.intentType === 'string' &&
    Array.isArray(input.growthDrivers) &&
    input.growthDrivers.length > 0 &&
    isFiniteNumber(input.targetRevenue) &&
    isFiniteNumber(input.targetMargin) &&
    isFiniteNumber(input.currentRevenue) &&
    isFiniteNumber(input.grossMargin) &&
    isFiniteNumber(input.recurringRevenueRatio) &&
    isFiniteNumber(input.fixedCosts) &&
    isFiniteNumber(input.variableCostRatio) &&
    isFiniteNumber(input.cash) &&
    isFiniteNumber(input.netDebt) &&
    typeof input.leadershipBandwidth === 'string' &&
    typeof input.teamDepth === 'string' &&
    typeof input.capitalAccess === 'string' &&
    isFiniteNumber(input.clientConcentration) &&
    typeof input.supplierDependency === 'string'
  );
}

export const useStrategicDeclarationStore = create<StrategicDeclarationState>((set, get) => ({
  input: {},
  locked: false,

  setField: (key, value) =>
    set((state) => ({
      input: { ...state.input, [key]: value },
    })),

  calculateDerived: () => {
    const i = get().input;
    if (
      !isFiniteNumber(i.currentRevenue) ||
      i.currentRevenue <= 0 ||
      !isFiniteNumber(i.grossMargin) ||
      !isFiniteNumber(i.fixedCosts) ||
      !isFiniteNumber(i.cash) ||
      !isFiniteNumber(i.recurringRevenueRatio) ||
      !isFiniteNumber(i.netDebt)
    ) {
      return null;
    }

    const grossProfit = i.currentRevenue * (i.grossMargin / 100);
    const annualBurn = i.fixedCosts - grossProfit;
    const runway = annualBurn > 0 ? (i.cash / annualBurn) * 12 : 999;

    return {
      runwayMonths: Number(runway.toFixed(1)),
      operatingLeverageRatio: i.fixedCosts / i.currentRevenue,
      volatilityIndex: (100 - i.recurringRevenueRatio) / 100,
      liquidityBuffer: i.cash - i.netDebt,
    };
  },

  buildPayload: () => {
    const i = get().input;
    const derived = get().calculateDerived();
    if (!derived) return null;
    if (!hasAllForPayload(i)) return null;

    return {
      strategy_profile: {
        intent_type: i.intentType,
        growth_driver_vector: i.growthDrivers,
      },
      financial_baseline: {
        baseline_revenue: i.currentRevenue,
        gross_margin: i.grossMargin,
        recurring_ratio: i.recurringRevenueRatio,
        fixed_costs: i.fixedCosts,
        variable_ratio: i.variableCostRatio,
        cash: i.cash,
        net_debt: i.netDebt,
      },
      target_structure: {
        target_revenue: i.targetRevenue,
        target_margin: i.targetMargin,
      },
      execution_posture: {
        leadership_bandwidth: i.leadershipBandwidth,
        team_depth: i.teamDepth,
        capital_access: i.capitalAccess,
        client_concentration: i.clientConcentration,
        supplier_dependency: i.supplierDependency,
      },
      derived_metrics: derived,
    };
  },

  lock: () => set({ locked: true }),
  reset: () => set({ input: {}, locked: false }),
}));


