// src/state/riskStore.ts
// STRATFIT — Risk Intelligence Store

import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = 'MINIMAL' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
export type ThreatCategory = 'runway' | 'market' | 'execution' | 'competition' | 'funding' | 'churn';

export interface RiskFactor {
  id: string;
  category: ThreatCategory;
  label: string;
  description: string;
  score: number;           // 0-100
  level: RiskLevel;
  trend: 'improving' | 'stable' | 'worsening';
  impact: 'survival' | 'growth' | 'both';
  controllable: boolean;
  mitigations: string[];
}

export interface RiskSnapshot {
  overallScore: number;    // 0-100 (higher = more risk)
  overallLevel: RiskLevel;
  factors: RiskFactor[];
  radarData: { category: string; score: number; label: string }[];
  timeline: { month: number; risk: number; label: string }[];
  topThreats: RiskFactor[];
  criticalWarnings: string[];
  calculatedAt: Date;
}

// ============================================================================
// RISK CALCULATION LOGIC
// ============================================================================

const RISK_LABELS: Record<ThreatCategory, string> = {
  runway: 'Runway Risk',
  market: 'Market Risk',
  execution: 'Execution Risk',
  competition: 'Competition Risk',
  funding: 'Funding Risk',
  churn: 'Churn Risk',
};

const RISK_DESCRIPTIONS: Record<ThreatCategory, string> = {
  runway: 'Risk of running out of cash before reaching profitability or next funding',
  market: 'Risk that target market is too small, shrinking, or doesn\'t exist',
  execution: 'Risk that team cannot deliver on product/growth targets',
  competition: 'Risk of losing to competitors or market consolidation',
  funding: 'Risk of inability to raise next funding round when needed',
  churn: 'Risk of customer loss exceeding acquisition rate',
};

const getRiskLevel = (score: number): RiskLevel => {
  if (score <= 15) return 'MINIMAL';
  if (score <= 30) return 'LOW';
  if (score <= 45) return 'MODERATE';
  if (score <= 60) return 'ELEVATED';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
};

const getTrend = (leverValue: number, isInverted: boolean = false): 'improving' | 'stable' | 'worsening' => {
  const adjusted = isInverted ? 100 - leverValue : leverValue;
  if (adjusted > 60) return 'improving';
  if (adjusted < 40) return 'worsening';
  return 'stable';
};

// ============================================================================
// STORE
// ============================================================================

interface RiskState {
  riskSnapshot: RiskSnapshot | null;
  isCalculating: boolean;
  selectedFactor: string | null;
  viewMode: 'radar' | 'timeline' | 'breakdown';
  
  // Actions
  calculateRisk: (
    levers: Record<string, number>,
    simulation: {
      survivalRate: number;
      medianRunway: number;
      medianARR: number;
      arrRange?: { p10: number; p90: number };
    } | null
  ) => RiskSnapshot;
  setSelectedFactor: (id: string | null) => void;
  setViewMode: (mode: 'radar' | 'timeline' | 'breakdown') => void;
}

export const useRiskStore = create<RiskState>((set, get) => ({
  riskSnapshot: null,
  isCalculating: false,
  selectedFactor: null,
  viewMode: 'radar',
  
  setSelectedFactor: (id) => set({ selectedFactor: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  calculateRisk: (levers, simulation) => {
    set({ isCalculating: true });
    
    // Default values if no simulation
    const survivalRate = simulation?.survivalRate ?? 0.5;
    const medianRunway = simulation?.medianRunway ?? 18;
    const medianARR = simulation?.medianARR ?? 1000000;
    
    // Calculate individual risk factors
    const factors: RiskFactor[] = [];
    
    // 1. RUNWAY RISK
    const runwayRisk = Math.max(0, Math.min(100,
      (1 - survivalRate) * 40 +
      Math.max(0, (24 - medianRunway) / 24) * 40 +
      (100 - (levers.costDiscipline || 50)) * 0.2
    ));
    factors.push({
      id: 'runway',
      category: 'runway',
      label: RISK_LABELS.runway,
      description: RISK_DESCRIPTIONS.runway,
      score: Math.round(runwayRisk),
      level: getRiskLevel(runwayRisk),
      trend: medianRunway > 18 ? 'improving' : medianRunway < 12 ? 'worsening' : 'stable',
      impact: 'survival',
      controllable: true,
      mitigations: [
        'Reduce burn rate by 15-20%',
        'Accelerate revenue timeline',
        'Secure bridge financing',
        'Cut non-essential expenses',
      ],
    });
    
    // 2. MARKET RISK
    const marketRisk = Math.max(0, Math.min(100,
      (100 - (levers.demandStrength || 50)) * 0.5 +
      (levers.marketVolatility || 50) * 0.4 +
      (100 - (levers.pricingPower || 50)) * 0.1
    ));
    factors.push({
      id: 'market',
      category: 'market',
      label: RISK_LABELS.market,
      description: RISK_DESCRIPTIONS.market,
      score: Math.round(marketRisk),
      level: getRiskLevel(marketRisk),
      trend: getTrend(levers.demandStrength || 50),
      impact: 'growth',
      controllable: false,
      mitigations: [
        'Diversify target segments',
        'Build stronger moat',
        'Increase customer research',
        'Monitor market signals closely',
      ],
    });
    
    // 3. EXECUTION RISK
    const executionRisk = Math.max(0, Math.min(100,
      (levers.executionRisk || 50) * 0.6 +
      (levers.operatingDrag || 50) * 0.3 +
      (100 - (levers.hiringIntensity || 50)) * 0.1
    ));
    factors.push({
      id: 'execution',
      category: 'execution',
      label: RISK_LABELS.execution,
      description: RISK_DESCRIPTIONS.execution,
      score: Math.round(executionRisk),
      level: getRiskLevel(executionRisk),
      trend: getTrend(100 - (levers.executionRisk || 50)),
      impact: 'both',
      controllable: true,
      mitigations: [
        'Strengthen key hires',
        'Improve processes & ops',
        'Set clearer milestones',
        'Increase accountability',
      ],
    });
    
    // 4. COMPETITION RISK
    const competitionRisk = Math.max(0, Math.min(100,
      (100 - (levers.pricingPower || 50)) * 0.4 +
      (levers.marketVolatility || 50) * 0.3 +
      (100 - (levers.expansionVelocity || 50)) * 0.3
    ));
    factors.push({
      id: 'competition',
      category: 'competition',
      label: RISK_LABELS.competition,
      description: RISK_DESCRIPTIONS.competition,
      score: Math.round(competitionRisk),
      level: getRiskLevel(competitionRisk),
      trend: getTrend(levers.pricingPower || 50),
      impact: 'growth',
      controllable: false,
      mitigations: [
        'Accelerate product differentiation',
        'Lock in key customers',
        'Build switching costs',
        'Monitor competitor moves',
      ],
    });
    
    // 5. FUNDING RISK
    const fundingRisk = Math.max(0, Math.min(100,
      (levers.fundingPressure || 50) * 0.5 +
      (1 - survivalRate) * 30 +
      Math.max(0, (18 - medianRunway) / 18) * 20
    ));
    factors.push({
      id: 'funding',
      category: 'funding',
      label: RISK_LABELS.funding,
      description: RISK_DESCRIPTIONS.funding,
      score: Math.round(fundingRisk),
      level: getRiskLevel(fundingRisk),
      trend: getTrend(100 - (levers.fundingPressure || 50)),
      impact: 'survival',
      controllable: true,
      mitigations: [
        'Start fundraising earlier',
        'Build investor relationships now',
        'Hit key milestones before raise',
        'Prepare backup funding options',
      ],
    });
    
    // 6. CHURN RISK
    const churnRisk = Math.max(0, Math.min(100,
      (100 - (levers.expansionVelocity || 50)) * 0.4 +
      (100 - (levers.demandStrength || 50)) * 0.3 +
      (levers.operatingDrag || 50) * 0.3
    ));
    factors.push({
      id: 'churn',
      category: 'churn',
      label: RISK_LABELS.churn,
      description: RISK_DESCRIPTIONS.churn,
      score: Math.round(churnRisk),
      level: getRiskLevel(churnRisk),
      trend: getTrend(levers.expansionVelocity || 50),
      impact: 'growth',
      controllable: true,
      mitigations: [
        'Improve onboarding experience',
        'Increase customer success investment',
        'Build stickier features',
        'Implement early warning system',
      ],
    });
    
    // Calculate overall risk (weighted average)
    const weights = {
      runway: 0.25,
      market: 0.15,
      execution: 0.20,
      competition: 0.10,
      funding: 0.20,
      churn: 0.10,
    };
    
    const overallScore = Math.round(
      factors.reduce((sum, f) => sum + f.score * weights[f.category], 0)
    );
    
    // Build radar data
    const radarData = factors.map(f => ({
      category: f.category,
      score: f.score,
      label: f.label.replace(' Risk', ''),
    }));
    
    // Build timeline (risk projection over 36 months)
    const timeline: RiskSnapshot['timeline'] = [];
    for (let month = 1; month <= 36; month++) {
      // Risk typically increases as runway depletes, then drops if survival improves
      const runwayEffect = medianRunway > 0 
        ? Math.max(0, (month - medianRunway * 0.5) / (medianRunway * 0.5)) * 20
        : 30;
      const baseRisk = overallScore;
      const monthlyRisk = Math.min(100, Math.max(0, 
        baseRisk + runwayEffect - (survivalRate * 10 * (month / 36))
      ));
      
      let label = '';
      if (month === 6) label = '6mo';
      if (month === 12) label = '1yr';
      if (month === 24) label = '2yr';
      if (month === 36) label = '3yr';
      
      timeline.push({ month, risk: Math.round(monthlyRisk), label });
    }
    
    // Get top threats (sorted by score)
    const topThreats = [...factors]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    // Generate critical warnings
    const criticalWarnings: string[] = [];
    if (medianRunway < 6) {
      criticalWarnings.push('CRITICAL: Less than 6 months runway remaining');
    }
    if (survivalRate < 0.4) {
      criticalWarnings.push('WARNING: Survival probability below 40%');
    }
    if (factors.find(f => f.category === 'funding')!.score > 70) {
      criticalWarnings.push('ALERT: High funding risk — start raising now');
    }
    if (factors.filter(f => f.level === 'CRITICAL' || f.level === 'HIGH').length >= 3) {
      criticalWarnings.push('DANGER: Multiple high-risk factors detected');
    }
    
    const snapshot: RiskSnapshot = {
      overallScore,
      overallLevel: getRiskLevel(overallScore),
      factors,
      radarData,
      timeline,
      topThreats,
      criticalWarnings,
      calculatedAt: new Date(),
    };
    
    set({ riskSnapshot: snapshot, isCalculating: false });
    return snapshot;
  },
}));

// Selectors
export const useRiskSnapshot = () => useRiskStore((s) => s.riskSnapshot);
export const useSelectedFactor = () => useRiskStore((s) => s.selectedFactor);
export const useRiskViewMode = () => useRiskStore((s) => s.viewMode);

export default useRiskStore;
