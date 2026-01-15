// src/state/scenarioStore.ts
// STRATFIT — Deterministic Engine State
// Two Views, One Engine, Same Truth

import { create } from "zustand";
import type { LeverId } from "@/logic/mountainPeakModel";
import type { Strategy, StrategyLevers, TimelinePoint, StrategyKpis } from "@/strategy/Strategy";
import { classifyStrategy, findBreakEven, calculateExitValue } from "@/strategy/Strategy";
import { calculateMetrics } from "@/logic/calculateMetrics";
import { 
  createDefaultSAFE, 
  createDefaultTermSheet,
  calculateSAFEDilution,
  calculateEquityDilution,
  calculateIRR,
  calculateInvestorProceeds,
} from "@/finance/TermSheet";

// ============================================================================
// TYPES
// ============================================================================

export type ScenarioId = "base" | "upside" | "downside" | "stress";
export type ViewMode = "operator" | "investor";

// PHASE-IG: Use canonical EngineResult from truth selectors
import type { EngineResult as CanonicalEngineResult, EngineResults as CanonicalEngineResults } from "@/lib/truth/truthSelectors";
export type EngineResult = CanonicalEngineResult;
export type EngineResults = CanonicalEngineResults;

// Solver path step for mountain visualization
export interface SolverPathPoint {
  riskIndex: number;      // 0-100
  enterpriseValue: number; // dollars
  runway: number;         // months
}

// ============================================================================
// SCENARIO COLORS
// ============================================================================

export const SCENARIO_COLORS: Record<ScenarioId, { primary: string; secondary: string; glow: string }> = {
  base: {
    primary: "#22d3ee",
    secondary: "#7c3aed",
    glow: "rgba(34, 211, 238, 0.4)",
  },
  upside: {
    primary: "#34d399",
    secondary: "#22d3ee",
    glow: "rgba(52, 211, 153, 0.4)",
  },
  downside: {
    primary: "#fbbf24",
    secondary: "#f97316",
    glow: "rgba(251, 191, 36, 0.4)",
  },
  stress: {
    primary: "#ef4444",
    secondary: "#fb7185",
    glow: "rgba(239, 68, 68, 0.4)",
  },
};

// ============================================================================
// STORE INTERFACE
// ============================================================================

export type NoteEntry = {
  timestamp: string;
  mode: "operator" | "investor";
  question: string;
  answerBullets: string[];
  comparedToBase: boolean;
  scenarioScope: string;
};

export type ScenarioStoreState = {
  // View Mode: Operator or Investor
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;

  dataPoints: number[];
  setDataPoints: (dp: number[]) => void;

  hoveredKpiIndex: number | null;
  setHoveredKpiIndex: (i: number | null) => void;

  activeLeverId: LeverId | null;
  leverIntensity01: number;
  setActiveLever: (id: LeverId | null, intensity01: number) => void;

  getScenarioColors: () => { primary: string; secondary: string; glow: string };
  
  // Motion amplitude based on view
  getMotionAmplitude: () => number;

  // Scenario Delta Snapshot toggle (persisted to localStorage)
  showScenarioImpact: boolean;
  setShowScenarioImpact: (show: boolean) => void;
  toggleScenarioImpact: () => void;

  activeScenarioId: ScenarioId;
  comparisonTargetScenarioId: ScenarioId | null;
  engineResults: Record<ScenarioId, EngineResult>;
  setEngineResult: (scenarioId: ScenarioId, result: EngineResult) => void;

  // Scenario Notes persistence
  scenarioNotesByScenarioId: Record<string, NoteEntry[]>;
  addScenarioNote: (scenarioId: string, note: NoteEntry) => void;

  // Solver path for mountain visualization
  solverPath: SolverPathPoint[];
  setSolverPath: (path: SolverPathPoint[]) => void;

  // Strategy management
  strategies: Strategy[];
  currentLevers: StrategyLevers | null;
  setCurrentLevers: (levers: StrategyLevers) => void;
  setLeversPartial: (partial: Partial<StrategyLevers>) => void;
  setLeverValue: (id: string, value: number) => void;
  saveStrategy: (name: string, notes?: string) => void;
  deleteStrategy: (id: string) => void;
  loadStrategy: (id: string) => Strategy | null;
}

// ============================================================================
// TIMELINE PROJECTION WITH FUNDING ROUNDS, DILUTION & SAFE/EQUITY
// ============================================================================

function projectStrategy(
  levers: StrategyLevers,
  scenario: ScenarioId,
  months: number = 36,
  step: number = 3
): TimelinePoint[] {
  const projections: TimelinePoint[] = [];
  const state = { ...levers, fundingPressure: 0 };
  
  // Initialize cash position (default $3M if not set)
  let cash = 3_000_000;
  let totalFunding = 0;
  let fundingRounds = 0;
  let founderOwnership = 1; // 100% - founders start with full ownership
  let lastFundingType: "safe" | "equity" | undefined = undefined;

  for (let t = 0; t <= months; t += step) {
    // Run engine for this time point
    const metrics = calculateMetrics(state, scenario);
    
    // Calculate derived values (similar to App.tsx engine)
    const burnMonthly = metrics.burnQuality * 1000; // burnQuality is in $K
    const marketingSpend = burnMonthly * 0.45;
    const avgRevenuePerCustomer = 12_000;
    const grossMargin = 0.74;
    const annualChurn = 0.12;
    
    const arrCurrent = (metrics.momentum / 10) * 1_000_000;
    const growthRate = Math.max(-0.5, Math.min(0.8, (metrics.momentum - 50) * 0.006));
    const arrNext12 = arrCurrent * (1 + growthRate);
    const arrDelta = arrNext12 - arrCurrent;
    const newCustomers = Math.max(1, arrDelta / avgRevenuePerCustomer);
    
    const cac = marketingSpend / newCustomers;
    const ltv = (avgRevenuePerCustomer * grossMargin) / annualChurn;
    const ltvCac = ltv / cac;
    const cacPaybackMonths = (cac / (avgRevenuePerCustomer * grossMargin)) * 12;

    // Growth risk adjustment
    let growthRisk = 0;
    if (ltvCac < 2) growthRisk += 15;
    if (cacPaybackMonths > 24) growthRisk += 15;
    if (cacPaybackMonths > 36) growthRisk += 10;
    const adjustedRiskIndex = Math.min(100, Math.max(0, metrics.riskIndex + growthRisk));

    // Apply monthly burn (step months at a time)
    cash -= burnMonthly * step;

    // Enterprise value (scaled)
    const enterpriseValue = (metrics.enterpriseValue / 10) * 1_000_000;

    // Trigger funding if cash is low (< $500K)
    if (cash < 500_000) {
      // Raise enough for 18 months of runway, minimum $3M
      const raiseAmount = Math.max(3_000_000, burnMonthly * 18);
      cash += raiseAmount;
      totalFunding += raiseAmount;
      fundingRounds += 1;
      
      // Pre-money valuation (floor at 2x raise to avoid crazy dilution)
      const preMoney = Math.max(enterpriseValue, raiseAmount * 2);
      
      // Determine funding type: Round 1 = SAFE, later rounds = priced equity
      const isSAFE = fundingRounds === 1;
      
      if (isSAFE) {
        // SAFE with standard terms
        const safe = createDefaultSAFE(preMoney, raiseAmount);
        const { dilution } = calculateSAFEDilution(safe, preMoney);
        
        founderOwnership *= (1 - dilution);
        lastFundingType = "safe";
      } else {
        // Priced equity round
        const termSheet = createDefaultTermSheet(preMoney, raiseAmount, fundingRounds);
        const { dilution } = calculateEquityDilution(termSheet);
        
        founderOwnership *= (1 - dilution);
        lastFundingType = "equity";
      }
    }
    
    // Calculate runway based on current cash and burn
    const runway = burnMonthly > 0 ? cash / burnMonthly : 999;

    projections.push({
      month: t,
      arr: arrNext12,
      valuation: enterpriseValue,
      runway,
      cash,
      risk: adjustedRiskIndex,
      fundingRounds,
      totalFunding,
      founderOwnership,
      lastFundingType,
    });

    // Natural drift forward (compounding effects over time)
    state.expansionVelocity = Math.min(100, state.expansionVelocity * 1.02);
    state.costDiscipline = Math.min(100, state.costDiscipline * 1.01);
    state.demandStrength = Math.min(100, state.demandStrength * 1.008);
    state.pricingPower = Math.min(100, state.pricingPower * 1.003);
    // Risk factors naturally decrease slightly with time (learning)
    state.marketVolatility = Math.max(0, state.marketVolatility * 0.995);
    state.executionRisk = Math.max(0, state.executionRisk * 0.99);
  }

  return projections;
}

// ============================================================================
// STORE
// ============================================================================

export const useScenarioStore = create<ScenarioStoreState>((set, get) => ({
  viewMode: "operator",
  setViewMode: (v) => set({ viewMode: v }),

  scenario: "base",
  setScenario: (s) => set({ scenario: s, activeScenarioId: s }),

  dataPoints: [],
  setDataPoints: (dp) => set({ dataPoints: Array.isArray(dp) ? dp : [] }),

  hoveredKpiIndex: null,
  setHoveredKpiIndex: (i) => set({ hoveredKpiIndex: i }),

  activeLeverId: null,
  leverIntensity01: 0,
  setActiveLever: (id, intensity01) =>
    set({ activeLeverId: id, leverIntensity01: Math.max(0, Math.min(1, intensity01)) }),

  getScenarioColors: () => {
    const scenario = get().scenario;
    return SCENARIO_COLORS[scenario];
  },

  // Operator: full motion (1.0), Investor: restrained (0.6)
  getMotionAmplitude: () => {
    const viewMode = get().viewMode;
    return viewMode === "operator" ? 1.0 : 0.6;
  },

  // Scenario Delta Snapshot toggle - initialized from localStorage
  showScenarioImpact: (() => {
    try {
      return localStorage.getItem("stratfit_showScenarioImpact") === "true";
    } catch {
      return false;
    }
  })(),
  
  setShowScenarioImpact: (show) => {
    try {
      localStorage.setItem("stratfit_showScenarioImpact", String(show));
    } catch {}
    set({ showScenarioImpact: show });
  },
  
  toggleScenarioImpact: () => {
    const current = get().showScenarioImpact;
    const next = !current;
    try {
      localStorage.setItem("stratfit_showScenarioImpact", String(next));
    } catch {}
    set({ showScenarioImpact: next });
  },

  activeScenarioId: "base",
  comparisonTargetScenarioId: null,
  engineResults: {
    base: {} as EngineResult,
    upside: {} as EngineResult,
    downside: {} as EngineResult,
    stress: {} as EngineResult,
  },
  setEngineResult: (scenarioId, result) =>
    set((state) => ({
      engineResults: {
        ...(state.engineResults ?? {}),
        [scenarioId]: result,
      },
    })),

  scenarioNotesByScenarioId: {},
  addScenarioNote: (scenarioId, note) =>
    set((state) => ({
      scenarioNotesByScenarioId: {
        ...state.scenarioNotesByScenarioId,
        [scenarioId]: [
          ...(state.scenarioNotesByScenarioId[scenarioId] || []),
          note,
        ],
      },
    })),

  // Solver path for mountain visualization
  solverPath: [],
  setSolverPath: (path) => set({ solverPath: path }),

  // Strategy management
  strategies: [],
  currentLevers: null,

  // Whole-object replace (used by existing flows)
  setCurrentLevers: (levers) => set({ currentLevers: levers }),

  // Phase-IG slider perf support (safe partial updates)
  // NOTE: these are intentionally no-ops if currentLevers is null
  setLeversPartial: (partial) =>
    set((state) => {
      if (!state.currentLevers) return {};
      return { currentLevers: { ...state.currentLevers, ...partial } };
    }),

  setLeverValue: (id, value) =>
    set((state) => {
      if (!state.currentLevers) return {};
      return { currentLevers: { ...state.currentLevers, [id]: value } };
    }),
  
  saveStrategy: (name, notes) => {
    const s = get();
    const id = Date.now().toString();
    const scenario = s.scenario;
    const result = s.engineResults[scenario];
    const levers = s.currentLevers;

    if (!levers) {
      console.warn("Cannot save strategy: no levers set");
      return;
    }

    const kpis = (result?.kpis ?? {}) as StrategyKpis;
    
    // Auto-classify the strategy
    const label = classifyStrategy(kpis);
    
    // Generate 36-month timeline projection
    const timeline = projectStrategy(levers, scenario, 36, 3);
    
    // Calculate break-even month
    const breakEvenMonth = findBreakEven(timeline);
    
    // Get funding totals and cap table from final timeline point
    const finalPoint = timeline[timeline.length - 1];
    const totalFunding = finalPoint?.totalFunding ?? 0;
    const fundingRounds = finalPoint?.fundingRounds ?? 0;
    const founderOwnership = finalPoint?.founderOwnership ?? 1;
    
    // Build cap table
    const capTable = {
      founders: founderOwnership,
      investors: 1 - founderOwnership,
    };
    
    // Calculate exit values at 8x ARR
    const exitValue = calculateExitValue({
      timeline,
      capTable,
    } as Strategy, 8);
    
    const founderProceeds = exitValue.founders;
    
    // Calculate investor proceeds with liquidation preference consideration
    const investorProceedsResult = calculateInvestorProceeds(
      exitValue.enterprise,
      capTable.investors,
      totalFunding,
      1 // 1x liquidation preference
    );
    const investorProceeds = investorProceedsResult.proceeds;
    
    // Calculate investor IRR (36 months = 3 years)
    const years = 36 / 12;
    const investorIRR = totalFunding > 0 
      ? calculateIRR(totalFunding, investorProceeds, years)
      : 0;

    const newStrategy: Strategy = {
      id,
      name,
      label,
      scenario,
      levers: { ...levers },
      kpis,
      timeline,
      breakEvenMonth,
      totalFunding,
      fundingRounds,
      capTable,
      investorIRR,
      investorProceeds,
      founderProceeds,
      createdAt: new Date().toISOString(),
      notes,
    };

    // Persist to localStorage
    const updated = [...s.strategies, newStrategy];
    try {
      localStorage.setItem("stratfit_strategies", JSON.stringify(updated));
    } catch {}

    set({ strategies: updated });
  },

  deleteStrategy: (id) => {
    const s = get();
    const updated = s.strategies.filter((strat) => strat.id !== id);
    try {
      localStorage.setItem("stratfit_strategies", JSON.stringify(updated));
    } catch {}
    set({ strategies: updated });
  },

  loadStrategy: (id) => {
    const s = get();
    return s.strategies.find((strat) => strat.id === id) ?? null;
  },
}));

// Initialize strategies from localStorage
try {
  const stored = localStorage.getItem("stratfit_strategies");
  if (stored) {
    const parsed = JSON.parse(stored) as Strategy[];
    useScenarioStore.setState({ strategies: parsed });
  }
} catch {}

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useScenario = () => useScenarioStore((s) => s.scenario);
export const useViewMode = () => useScenarioStore((s) => s.viewMode);
export const useDataPoints = () => useScenarioStore((s) => s.dataPoints);
export const useHoveredKpiIndex = () => useScenarioStore((s) => s.hoveredKpiIndex);
export const useScenarioColors = () => {
  const scenario = useScenarioStore((s) => s.scenario);
  return SCENARIO_COLORS[scenario];
};

// ============================================================================
// DEBUG: Expose store to window for console inspection
// ============================================================================
if (typeof window !== "undefined") {
  // Lazy import to avoid circular dependency
  const getRiskScore = (er: EngineResult | null | undefined) => {
    const riskIndex = er?.kpis?.riskIndex?.value ?? 50;
    return Math.round(100 - riskIndex);
  };

  const getQualityScore = (er: EngineResult | null | undefined) => {
    const kpis = er?.kpis;
    if (!kpis) return 0.5;
    const normalize = (x: number, min: number, max: number) => Math.max(0, Math.min(1, (x - min) / (max - min)));
    const ltvCac = kpis.ltvCac?.value ?? 3;
    const cacPayback = kpis.cacPayback?.value ?? 18;
    const earningsPower = kpis.earningsPower?.value ?? 50;
    const burnQuality = kpis.burnQuality?.value ?? 50;
    return Math.round((
      0.35 * normalize(ltvCac, 2, 6) +
      0.25 * (1 - normalize(cacPayback, 6, 36)) +
      0.25 * normalize(earningsPower, 20, 80) +
      0.15 * normalize(burnQuality, 20, 80)
    ) * 100) / 100;
  };

  (window as any).__STRATFIT__ = {
    scenarioStore: useScenarioStore,
    get engineResults() {
      return useScenarioStore.getState().engineResults;
    },
    getRiskScore,
    getQualityScore,
  };
  // Shortcut for quick console access
  Object.defineProperty(window, "engineResults", {
    get: () => useScenarioStore.getState().engineResults,
    configurable: true,
  });
}
