// src/state/scenarioStore.ts
// STRATFIT — Scenario Management Store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export interface LeverSnapshot {
  demandStrength: number;
  pricingPower: number;
  expansionVelocity: number;
  costDiscipline: number;
  hiringIntensity: number;
  operatingDrag: number;
  marketVolatility: number;
  executionRisk: number;
  fundingPressure: number;
  // Index signature for Record<string, number> compatibility
  [key: string]: number;
}

export interface SimulationSnapshot {
  // Core metrics
  survivalRate: number;
  medianARR: number;
  medianRunway: number;
  medianCash: number;
  
  // Percentiles
  arrP10: number;
  arrP50: number;
  arrP90: number;
  runwayP10: number;
  runwayP50: number;
  runwayP90: number;
  cashP10: number;
  cashP50: number;
  cashP90: number;
  
  // Score
  overallScore: number;
  overallRating: 'CRITICAL' | 'CAUTION' | 'STABLE' | 'STRONG' | 'EXCEPTIONAL';
  
  // Time series (for Timeline)
  monthlyARR: number[];
  monthlyRunway: number[];
  monthlySurvival: number[];
  
  // Confidence bands
  arrBands: { month: number; p10: number; p50: number; p90: number }[];
  
  // Sensitivity (for Heatmap)
  leverSensitivity: {
    lever: string;
    label: string;
    impact: number;
  }[];
  
  // Meta
  simulatedAt: Date;
  iterations: number;
  executionTimeMs: number;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  levers: LeverSnapshot;
  simulation: SimulationSnapshot | null;
  createdAt: Date;
  updatedAt: Date;
  isBaseline: boolean;
}

export interface ScenarioDelta {
  // Absolute deltas
  survivalDelta: number;
  arrDelta: number;
  runwayDelta: number;
  scoreDelta: number;
  
  // Percentage deltas
  arrDeltaPercent: number;
  runwayDeltaPercent: number;
  
  // Divergence (0-100)
  divergenceScore: number;
  divergenceLabel: string;
  
  // Lever differences (for Heatmap)
  leverDeltas: {
    lever: string;
    label: string;
    valueA: number;
    valueB: number;
    delta: number;
    impactOnDivergence: number;
  }[];
  
  // Monthly divergence (for Timeline)
  monthlyDivergence: {
    month: number;
    arrA: number;
    arrB: number;
    gap: number;
    gapPercent: number;
  }[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LEVER_LABELS: Record<string, string> = {
  demandStrength: 'Demand Strength',
  pricingPower: 'Pricing Power',
  expansionVelocity: 'Expansion Velocity',
  costDiscipline: 'Cost Discipline',
  hiringIntensity: 'Hiring Intensity',
  operatingDrag: 'Operating Drag',
  marketVolatility: 'Market Volatility',
  executionRisk: 'Execution Risk',
  fundingPressure: 'Funding Pressure',
};

// Scenario IDs and Colors
export type ScenarioId = 'base' | 'upside' | 'downside' | 'stress';

export const SCENARIO_COLORS: Record<ScenarioId, { primary: string; secondary: string; glow: string }> = {
  base: {
    primary: '#22d3ee',
    secondary: '#0891b2',
    glow: 'rgba(34, 211, 238, 0.3)',
  },
  upside: {
    primary: '#34d399',
    secondary: '#059669',
    glow: 'rgba(52, 211, 153, 0.3)',
  },
  downside: {
    primary: '#fbbf24',
    secondary: '#d97706',
    glow: 'rgba(251, 191, 36, 0.3)',
  },
  stress: {
    primary: '#f87171',
    secondary: '#dc2626',
    glow: 'rgba(248, 113, 113, 0.3)',
  },
};

const LEVER_IMPACT_WEIGHTS: Record<string, number> = {
  demandStrength: 0.85,
  pricingPower: 0.70,
  expansionVelocity: 0.60,
  costDiscipline: 0.65,
  hiringIntensity: 0.55,
  operatingDrag: 0.50,
  marketVolatility: 0.75,
  executionRisk: 0.70,
  fundingPressure: 0.60,
};

const generateId = () => `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// STORE
// ============================================================================

// Strategy type for saved strategies
export interface Strategy {
  id: string;
  name: string;
  levers: LeverSnapshot;
  kpis?: Record<string, number>;
  timeline?: { month: number; valuation: number; arr: number; runway: number; cash: number; risk: number; totalFunding: number }[];
  createdAt: Date;
}

// KPI value type
export interface KPIValue {
  value: number;
  display?: string;
}

// Engine result type
export interface EngineResult {
  kpis: Record<string, KPIValue>;
  ai?: { summary: string };
  timeline?: { month: number; valuation: number; arr: number; runway: number; cash: number; risk: number; totalFunding: number }[];
}

// Solver path point type
export interface SolverPathPoint {
  riskIndex: number;
  enterpriseValue: number;
  runway: number;
}

interface ScenarioState {
  // Scenarios
  baseline: Scenario | null;
  savedScenarios: Scenario[];
  maxScenarios: number;
  
  // View state
  compareViewMode: 'data' | 'terrain';
  viewMode: 'terrain' | 'data';
  hoveredKpiIndex: number | null;
  activeLeverId: string | null;
  leverIntensity01: number;
  activeScenarioId: ScenarioId;
  scenario: ScenarioId; // Alias for activeScenarioId for backward compatibility
  
  // Strategies (for saving/loading user strategies)
  strategies: Strategy[];
  currentLevers: LeverSnapshot | null;
  
  // Engine results per scenario
  engineResults: Record<string, EngineResult>;
  
  // Solver path for visualization
  solverPath: SolverPathPoint[];
  
  // Data points for visualization
  dataPoints: unknown[];
  
  // Actions
  saveAsBaseline: (name: string, levers: LeverSnapshot, simulation: SimulationSnapshot) => void;
  saveScenario: (name: string, levers: LeverSnapshot, simulation: SimulationSnapshot) => Scenario;
  loadScenario: (id: string) => Scenario | null;
  setBaseline: (id: string) => void;
  deleteScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  setCompareViewMode: (mode: 'data' | 'terrain') => void;
  
  // New actions for App.tsx
  setHoveredKpiIndex: (index: number | null) => void;
  setDataPoints: (points: unknown[]) => void;
  setScenario: (id: string) => void;
  setEngineResult: (scenarioId: string, result: EngineResult) => void;
  setSolverPath: (path: SolverPathPoint[]) => void;
  saveStrategy: (name: string) => void;
  setCurrentLevers: (levers: LeverSnapshot) => void;
  setActiveLever: (leverId: string | null, intensity: number) => void;
  
  // Calculations
  calculateDelta: (scenarioA: Scenario, scenarioB: Scenario) => ScenarioDelta;
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      baseline: null,
      savedScenarios: [],
      maxScenarios: 5,
      compareViewMode: 'terrain',
      viewMode: 'terrain',
      hoveredKpiIndex: null,
      activeLeverId: null,
      leverIntensity01: 0.5,
      activeScenarioId: 'base',
      scenario: 'base', // Alias for activeScenarioId
      strategies: [],
      currentLevers: null,
      engineResults: {},
      solverPath: [],
      dataPoints: [],
      
      setHoveredKpiIndex: (index) => set({ hoveredKpiIndex: index }),
      setDataPoints: (points) => set({ dataPoints: points }),
      setScenario: (id) => set({ activeScenarioId: id as ScenarioId, scenario: id as ScenarioId }),
      setEngineResult: (scenarioId, result) => set((state) => ({
        engineResults: { ...state.engineResults, [scenarioId]: result }
      })),
      setSolverPath: (path) => set({ solverPath: path }),
      saveStrategy: (name) => {
        const currentLevers = get().currentLevers;
        if (!currentLevers) return;
        
        const strategy: Strategy = {
          id: generateId(),
          name,
          levers: { ...currentLevers },
          createdAt: new Date(),
        };
        
        set((state) => ({
          strategies: [...state.strategies, strategy]
        }));
      },
      setCurrentLevers: (levers) => set({ currentLevers: levers }),
      setActiveLever: (leverId, intensity) => set({ activeLeverId: leverId, leverIntensity01: intensity }),
      
      saveAsBaseline: (name, levers, simulation) => {
        const scenario: Scenario = {
          id: generateId(),
          name,
          levers: { ...levers },
          simulation: { ...simulation, simulatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date(),
          isBaseline: true,
        };
        
        const updated = get().savedScenarios.map(s => ({ ...s, isBaseline: false }));
        
        set({
          baseline: scenario,
          savedScenarios: [scenario, ...updated.filter(s => s.id !== scenario.id)].slice(0, 5),
        });
      },
      
      saveScenario: (name, levers, simulation) => {
        const scenario: Scenario = {
          id: generateId(),
          name,
          levers: { ...levers },
          simulation: { ...simulation, simulatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date(),
          isBaseline: false,
        };
        
        const scenarios = [scenario, ...get().savedScenarios].slice(0, 5);
        set({ savedScenarios: scenarios });
        
        return scenario;
      },
      
      loadScenario: (id) => {
        return get().savedScenarios.find(s => s.id === id) || null;
      },
      
      setBaseline: (id) => {
        const scenarios = get().savedScenarios.map(s => ({
          ...s,
          isBaseline: s.id === id,
        }));
        const newBaseline = scenarios.find(s => s.id === id) || null;
        set({ baseline: newBaseline, savedScenarios: scenarios });
      },
      
      deleteScenario: (id) => {
        const scenarios = get().savedScenarios.filter(s => s.id !== id);
        const baseline = get().baseline?.id === id ? null : get().baseline;
        set({ savedScenarios: scenarios, baseline });
      },
      
      renameScenario: (id, name) => {
        const scenarios = get().savedScenarios.map(s =>
          s.id === id ? { ...s, name, updatedAt: new Date() } : s
        );
        const baseline = get().baseline?.id === id
          ? { ...get().baseline!, name, updatedAt: new Date() }
          : get().baseline;
        set({ savedScenarios: scenarios, baseline });
      },
      
      setCompareViewMode: (mode) => set({ compareViewMode: mode }),
      
      calculateDelta: (scenarioA, scenarioB) => {
        const simA = scenarioA.simulation;
        const simB = scenarioB.simulation;
        
        if (!simA || !simB) {
          return {
            survivalDelta: 0,
            arrDelta: 0,
            runwayDelta: 0,
            scoreDelta: 0,
            arrDeltaPercent: 0,
            runwayDeltaPercent: 0,
            divergenceScore: 0,
            divergenceLabel: 'No Data',
            leverDeltas: [],
            monthlyDivergence: [],
          };
        }
        
        // Calculate divergence score (0-100)
        const survivalDiff = Math.abs(simA.survivalRate - simB.survivalRate);
        const avgARR = (simA.medianARR + simB.medianARR) / 2;
        const arrDiff = avgARR > 0 ? Math.abs(simA.medianARR - simB.medianARR) / avgARR : 0;
        const runwayDiff = Math.abs(simA.medianRunway - simB.medianRunway) / 48;
        const scoreDiff = Math.abs(simA.overallScore - simB.overallScore) / 100;
        
        const divergenceScore = Math.min(
          Math.round((survivalDiff * 0.35 + arrDiff * 0.30 + runwayDiff * 0.20 + scoreDiff * 0.15) * 100),
          100
        );
        
        // Divergence label
        let divergenceLabel = 'Nearly Identical';
        if (divergenceScore >= 15) divergenceLabel = 'Moderate Differences';
        if (divergenceScore >= 35) divergenceLabel = 'Significant Divergence';
        if (divergenceScore >= 60) divergenceLabel = 'Major Strategic Shift';
        if (divergenceScore >= 85) divergenceLabel = 'Fundamentally Different';
        
        // Lever deltas
        const leverDeltas = Object.keys(scenarioA.levers).map(key => {
          const k = key as keyof LeverSnapshot;
          const valueA = scenarioA.levers[k];
          const valueB = scenarioB.levers[k];
          const delta = valueB - valueA;
          const impactWeight = LEVER_IMPACT_WEIGHTS[key] || 0.5;
          const impactOnDivergence = Math.abs(delta) * impactWeight / 100;
          
          return {
            lever: key,
            label: LEVER_LABELS[key] || key,
            valueA,
            valueB,
            delta,
            impactOnDivergence,
          };
        }).sort((a, b) => Math.abs(b.impactOnDivergence) - Math.abs(a.impactOnDivergence));
        
        // Monthly divergence
        const monthlyDivergence: ScenarioDelta['monthlyDivergence'] = [];
        const arrA = simA.monthlyARR || Array(36).fill(simA.medianARR);
        const arrB = simB.monthlyARR || Array(36).fill(simB.medianARR);
        
        for (let i = 0; i < 36; i++) {
          const a = arrA[i] ?? simA.medianARR;
          const b = arrB[i] ?? simB.medianARR;
          const gap = b - a;
          const gapPercent = a > 0 ? (gap / a) * 100 : 0;
          
          monthlyDivergence.push({
            month: i + 1,
            arrA: a,
            arrB: b,
            gap,
            gapPercent,
          });
        }
        
        return {
          survivalDelta: (simB.survivalRate - simA.survivalRate) * 100,
          arrDelta: simB.medianARR - simA.medianARR,
          runwayDelta: simB.medianRunway - simA.medianRunway,
          scoreDelta: simB.overallScore - simA.overallScore,
          arrDeltaPercent: simA.medianARR > 0
            ? ((simB.medianARR - simA.medianARR) / simA.medianARR) * 100
            : 0,
          runwayDeltaPercent: simA.medianRunway > 0
            ? ((simB.medianRunway - simA.medianRunway) / simA.medianRunway) * 100
            : 0,
          divergenceScore,
          divergenceLabel,
          leverDeltas,
          monthlyDivergence,
        };
      },
    }),
    {
      name: 'stratfit-scenarios',
      version: 2, // Bump version to reset cached state with new structure
      partialize: (state) => ({
        // Only persist these keys - exclude runtime-computed state
        baseline: state.baseline,
        savedScenarios: state.savedScenarios,
        strategies: state.strategies,
        compareViewMode: state.compareViewMode,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<ScenarioState>),
        // Always use fresh runtime state for these (don't persist)
        engineResults: {},
        solverPath: [],
        dataPoints: [],
        hoveredKpiIndex: null,
        activeLeverId: null,
        scenario: 'base' as ScenarioId,
        activeScenarioId: 'base' as ScenarioId,
      }),
    }
  )
);

// Type exports
export type ViewMode = 'terrain' | 'data';

// Selectors
export const useBaseline = () => useScenarioStore((s) => s.baseline);
export const useSavedScenarios = () => useScenarioStore((s) => s.savedScenarios);
export const useCompareViewMode = () => useScenarioStore((s) => s.compareViewMode);
export const useScenario = () => useScenarioStore((s) => s.activeScenarioId);
export const useStrategies = () => useScenarioStore((s) => s.strategies);
export const useEngineResults = () => useScenarioStore((s) => s.engineResults);

export default useScenarioStore;
