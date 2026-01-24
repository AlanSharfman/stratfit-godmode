// src/state/valuationStore.ts
// STRATFIT — Valuation Intelligence Store
// Enterprise value modeling, funding scenarios, and exit analysis

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type FundingStage = 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'series-c' | 'series-d' | 'growth';
export type ValuationMethod = 'arr-multiple' | 'revenue-multiple' | 'dcf' | 'comparables';

export interface FundingRound {
  id: string;
  stage: FundingStage;
  date: string;
  preMoneyValuation: number;
  amountRaised: number;
  postMoneyValuation: number;
  ownership: number; // Founder ownership after round
  dilution: number;
  leadInvestor?: string;
}

export interface ValuationDriver {
  id: string;
  name: string;
  category: 'growth' | 'efficiency' | 'market' | 'team';
  score: number; // 0-100
  weight: number; // Impact weight
  trend: 'up' | 'flat' | 'down';
  description: string;
}

export interface ComparableCompany {
  id: string;
  name: string;
  sector: string;
  stage: FundingStage;
  arrMultiple: number;
  revenueMultiple: number;
  lastValuation: number;
  lastARR: number;
  growthRate: number;
}

export interface DilutionScenario {
  id: string;
  name: string;
  rounds: {
    stage: FundingStage;
    raise: number;
    preMoneyMultiple: number;
    dilution: number;
  }[];
  finalOwnership: number;
  totalRaised: number;
  impliedExitValue: number;
}

export interface ValuationSnapshot {
  // Current valuation estimates
  currentValuation: number;
  valuationRange: { low: number; mid: number; high: number };
  
  // Multiples
  arrMultiple: number;
  revenueMultiple: number;
  impliedMultiples: {
    arr: { low: number; mid: number; high: number };
    revenue: { low: number; mid: number; high: number };
  };
  
  // Drivers
  drivers: ValuationDriver[];
  overallScore: number; // 0-100
  
  // Funding history
  fundingHistory: FundingRound[];
  totalRaised: number;
  currentOwnership: number;
  
  // Projections
  projectedValuations: {
    month: number;
    low: number;
    mid: number;
    high: number;
  }[];
  
  // Comparables
  comparables: ComparableCompany[];
  percentileRank: number; // Where company sits vs comparables
  
  // Exit scenarios
  exitScenarios: {
    type: 'acquisition' | 'ipo' | 'secondary';
    probability: number;
    valuationRange: { low: number; high: number };
    timeframeMonths: number;
  }[];
  
  calculatedAt: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STAGE_LABELS: Record<FundingStage, string> = {
  'pre-seed': 'Pre-Seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c': 'Series C',
  'series-d': 'Series D',
  'growth': 'Growth',
};

const STAGE_TYPICAL_MULTIPLES: Record<FundingStage, { arr: number; revenue: number }> = {
  'pre-seed': { arr: 0, revenue: 20 },
  'seed': { arr: 30, revenue: 15 },
  'series-a': { arr: 20, revenue: 12 },
  'series-b': { arr: 15, revenue: 10 },
  'series-c': { arr: 12, revenue: 8 },
  'series-d': { arr: 10, revenue: 6 },
  'growth': { arr: 8, revenue: 5 },
};

const DEFAULT_COMPARABLES: ComparableCompany[] = [
  { id: 'comp1', name: 'FastGrow SaaS', sector: 'B2B SaaS', stage: 'series-b', arrMultiple: 18, revenueMultiple: 12, lastValuation: 180000000, lastARR: 10000000, growthRate: 120 },
  { id: 'comp2', name: 'ScaleUp Inc', sector: 'B2B SaaS', stage: 'series-b', arrMultiple: 15, revenueMultiple: 10, lastValuation: 150000000, lastARR: 10000000, growthRate: 80 },
  { id: 'comp3', name: 'CloudFirst', sector: 'B2B SaaS', stage: 'series-a', arrMultiple: 22, revenueMultiple: 14, lastValuation: 88000000, lastARR: 4000000, growthRate: 150 },
  { id: 'comp4', name: 'DataFlow', sector: 'B2B SaaS', stage: 'series-b', arrMultiple: 12, revenueMultiple: 8, lastValuation: 120000000, lastARR: 10000000, growthRate: 60 },
  { id: 'comp5', name: 'APIStack', sector: 'Developer Tools', stage: 'series-a', arrMultiple: 25, revenueMultiple: 16, lastValuation: 100000000, lastARR: 4000000, growthRate: 200 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const generateId = () => `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const calculateDriverScore = (
  levers: Record<string, number>,
  simulation: { survivalRate: number; medianRunway: number; medianARR: number; overallScore: number } | null
): ValuationDriver[] => {
  const drivers: ValuationDriver[] = [];
  
  // Growth driver
  const demandStrength = levers.demandStrength ?? 50;
  const expansionVelocity = levers.expansionVelocity ?? 50;
  const growthScore = Math.round((demandStrength + expansionVelocity) / 2);
  drivers.push({
    id: 'growth',
    name: 'Growth Velocity',
    category: 'growth',
    score: growthScore,
    weight: 0.35,
    trend: growthScore > 60 ? 'up' : growthScore < 40 ? 'down' : 'flat',
    description: 'Revenue growth rate and market expansion pace',
  });
  
  // Efficiency driver
  const costDiscipline = levers.costDiscipline ?? 50;
  const operatingDrag = 100 - (levers.operatingDrag ?? 50);
  const efficiencyScore = Math.round((costDiscipline + operatingDrag) / 2);
  drivers.push({
    id: 'efficiency',
    name: 'Capital Efficiency',
    category: 'efficiency',
    score: efficiencyScore,
    weight: 0.25,
    trend: efficiencyScore > 60 ? 'up' : efficiencyScore < 40 ? 'down' : 'flat',
    description: 'Burn rate efficiency and path to profitability',
  });
  
  // Market driver
  const marketVolatility = 100 - (levers.marketVolatility ?? 50);
  const pricingPower = levers.pricingPower ?? 50;
  const marketScore = Math.round((marketVolatility + pricingPower) / 2);
  drivers.push({
    id: 'market',
    name: 'Market Position',
    category: 'market',
    score: marketScore,
    weight: 0.25,
    trend: marketScore > 60 ? 'up' : marketScore < 40 ? 'down' : 'flat',
    description: 'Market opportunity size and competitive moat',
  });
  
  // Team driver
  const executionRisk = 100 - (levers.executionRisk ?? 50);
  const hiringIntensity = levers.hiringIntensity ?? 50;
  const teamScore = Math.round((executionRisk + hiringIntensity) / 2);
  drivers.push({
    id: 'team',
    name: 'Team Strength',
    category: 'team',
    score: teamScore,
    weight: 0.15,
    trend: teamScore > 60 ? 'up' : teamScore < 40 ? 'down' : 'flat',
    description: 'Execution capability and talent density',
  });
  
  return drivers;
};

const calculateMultiple = (
  overallScore: number,
  stage: FundingStage,
  growthRate: number
): { arr: { low: number; mid: number; high: number }; revenue: { low: number; mid: number; high: number } } => {
  const baseMultiples = STAGE_TYPICAL_MULTIPLES[stage];
  
  // Adjust based on score (0-100 maps to 0.5x - 1.5x modifier)
  const scoreModifier = 0.5 + (overallScore / 100);
  
  // Growth rate premium (100%+ growth adds premium)
  const growthPremium = growthRate > 100 ? 1 + ((growthRate - 100) / 200) : 1;
  
  const arrMid = Math.round(baseMultiples.arr * scoreModifier * growthPremium);
  const revMid = Math.round(baseMultiples.revenue * scoreModifier * growthPremium);
  
  return {
    arr: { low: Math.round(arrMid * 0.7), mid: arrMid, high: Math.round(arrMid * 1.4) },
    revenue: { low: Math.round(revMid * 0.7), mid: revMid, high: Math.round(revMid * 1.4) },
  };
};

// ============================================================================
// STORE
// ============================================================================

interface ValuationState {
  snapshot: ValuationSnapshot | null;
  isCalculating: boolean;
  
  // Configuration
  currentStage: FundingStage;
  currentARR: number;
  currentRevenue: number;
  growthRate: number;
  
  // Dilution scenarios
  dilutionScenarios: DilutionScenario[];
  selectedScenarioId: string | null;
  
  // View
  viewMode: 'overview' | 'drivers' | 'timeline' | 'comparables';
  
  // Actions
  calculateValuation: (
    levers: Record<string, number>,
    simulation: {
      survivalRate: number;
      medianRunway: number;
      medianARR: number;
      overallScore: number;
    } | null
  ) => ValuationSnapshot;
  
  setCurrentStage: (stage: FundingStage) => void;
  setFinancials: (arr: number, revenue: number, growthRate: number) => void;
  
  addDilutionScenario: (scenario: Omit<DilutionScenario, 'id'>) => void;
  removeDilutionScenario: (id: string) => void;
  selectDilutionScenario: (id: string | null) => void;
  
  setViewMode: (mode: 'overview' | 'drivers' | 'timeline' | 'comparables') => void;
}

export const useValuationStore = create<ValuationState>()(
  persist(
    (set, get) => ({
      snapshot: null,
      isCalculating: false,
      
      currentStage: 'seed',
      currentARR: 1000000,
      currentRevenue: 1200000,
      growthRate: 100,
      
      dilutionScenarios: [],
      selectedScenarioId: null,
      
      viewMode: 'overview',
      
      calculateValuation: (levers, simulation) => {
        set({ isCalculating: true });
        
        const { currentStage, currentARR, currentRevenue, growthRate } = get();
        
        // Calculate drivers
        const drivers = calculateDriverScore(levers, simulation);
        const overallScore = Math.round(
          drivers.reduce((sum, d) => sum + d.score * d.weight, 0)
        );
        
        // Calculate multiples
        const impliedMultiples = calculateMultiple(overallScore, currentStage, growthRate);
        
        // Calculate valuations
        const arrValuation = currentARR * impliedMultiples.arr.mid;
        const valuationRange = {
          low: currentARR * impliedMultiples.arr.low,
          mid: arrValuation,
          high: currentARR * impliedMultiples.arr.high,
        };
        
        // Generate projections (24 months)
        const projectedValuations = [];
        for (let month = 0; month <= 24; month += 3) {
          const projectedARR = currentARR * Math.pow(1 + growthRate / 100, month / 12);
          // Multiples compress slightly as company matures
          const multipleDecay = 1 - (month / 24) * 0.15;
          projectedValuations.push({
            month,
            low: projectedARR * impliedMultiples.arr.low * multipleDecay,
            mid: projectedARR * impliedMultiples.arr.mid * multipleDecay,
            high: projectedARR * impliedMultiples.arr.high * multipleDecay,
          });
        }
        
        // Calculate percentile among comparables
        const avgComparableMultiple = DEFAULT_COMPARABLES.reduce((sum, c) => sum + c.arrMultiple, 0) / DEFAULT_COMPARABLES.length;
        const percentileRank = Math.min(100, Math.max(0, 
          50 + ((impliedMultiples.arr.mid - avgComparableMultiple) / avgComparableMultiple) * 50
        ));
        
        // Exit scenarios
        const exitScenarios = [
          {
            type: 'acquisition' as const,
            probability: overallScore > 70 ? 0.4 : overallScore > 50 ? 0.3 : 0.2,
            valuationRange: { low: valuationRange.mid * 0.8, high: valuationRange.high * 1.2 },
            timeframeMonths: 24,
          },
          {
            type: 'ipo' as const,
            probability: currentARR > 50000000 ? 0.2 : 0.05,
            valuationRange: { low: valuationRange.high, high: valuationRange.high * 2 },
            timeframeMonths: 48,
          },
          {
            type: 'secondary' as const,
            probability: 0.3,
            valuationRange: { low: valuationRange.low, high: valuationRange.mid },
            timeframeMonths: 12,
          },
        ];
        
        const snapshot: ValuationSnapshot = {
          currentValuation: arrValuation,
          valuationRange,
          arrMultiple: impliedMultiples.arr.mid,
          revenueMultiple: impliedMultiples.revenue.mid,
          impliedMultiples,
          drivers,
          overallScore,
          fundingHistory: [],
          totalRaised: 0,
          currentOwnership: 100,
          projectedValuations,
          comparables: DEFAULT_COMPARABLES,
          percentileRank,
          exitScenarios,
          calculatedAt: new Date(),
        };
        
        set({ snapshot, isCalculating: false });
        return snapshot;
      },
      
      setCurrentStage: (stage) => set({ currentStage: stage }),
      
      setFinancials: (arr, revenue, growthRate) => set({
        currentARR: arr,
        currentRevenue: revenue,
        growthRate,
      }),
      
      addDilutionScenario: (scenario) => {
        const newScenario: DilutionScenario = {
          ...scenario,
          id: generateId(),
        };
        set((state) => ({
          dilutionScenarios: [...state.dilutionScenarios, newScenario],
        }));
      },
      
      removeDilutionScenario: (id) => {
        set((state) => ({
          dilutionScenarios: state.dilutionScenarios.filter(s => s.id !== id),
          selectedScenarioId: state.selectedScenarioId === id ? null : state.selectedScenarioId,
        }));
      },
      
      selectDilutionScenario: (id) => set({ selectedScenarioId: id }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: 'stratfit-valuation',
      version: 1,
      partialize: (state) => ({
        currentStage: state.currentStage,
        currentARR: state.currentARR,
        currentRevenue: state.currentRevenue,
        growthRate: state.growthRate,
        dilutionScenarios: state.dilutionScenarios,
      }),
    }
  )
);

// ============================================================================
// EXPORTS
// ============================================================================

export const useValuation = () => useValuationStore((s) => s.snapshot);
export const useValuationDrivers = () => useValuationStore((s) => s.snapshot?.drivers ?? []);
export const STAGE_LABELS_EXPORT = STAGE_LABELS;

export default useValuationStore;
