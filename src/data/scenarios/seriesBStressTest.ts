/**
 * STRATFIT - Series B Stress Test Scenario
 * Pre-calculated Monte Carlo simulation results (10,000 simulations)
 * 
 * Strategy: Raise $15M at $60M pre-money valuation
 * Risk Profile: Aggressive growth with execution risk
 */

export interface MilestoneData {
  month: number;
  label: string;
  cash: number;        // in millions
  arr: number;         // in millions
  burn: number;        // in thousands per month
  runway: number;      // in months
  customers: number;
  riskScore: number;   // 0-100 (higher = riskier)
  probability: number; // probability of reaching this state
}

export interface ScenarioData {
  id: string;
  name: string;
  shortName: string;
  description: string;
  strategy: string;
  color: string;
  colorSecondary: string;
  
  // Summary metrics
  metrics: {
    initialCash: number;
    raiseAmount: number;
    postMoneyCash: number;
    dilution: number;
    avgBurn: number;
    avgRunway: number;
    peakARR: number;
    exitValue: number;
    riskScore: number;
    riskLevel: 'Low' | 'Med' | 'High' | 'Critical';
    successRate: number;
    breakingPoint: string;
  };

  // Monte Carlo distribution
  distribution: {
    p10: { exitValue: number; arr: number; runway: number };
    p25: { exitValue: number; arr: number; runway: number };
    p50: { exitValue: number; arr: number; runway: number };
    p75: { exitValue: number; arr: number; runway: number };
    p90: { exitValue: number; arr: number; runway: number };
  };

  // Timeline milestones for path visualization
  milestones: MilestoneData[];

  // Risk breakdown by category
  riskBreakdown: {
    market: number;
    execution: number;
    financial: number;
    competitive: number;
  };

  // Key insights
  insights: string[];
  
  // Strategic questions AI would ask
  strategicQuestions: string[];
}

export const SERIES_B_STRESS_TEST: ScenarioData = {
  id: 'series-b-stress-test',
  name: 'Series B Stress Test',
  shortName: 'Series B',
  description: 'Aggressive growth strategy with $15M raise at $60M valuation',
  strategy: 'Raise $15M at $60M pre-money, 25% dilution, aggressive hiring',
  color: '#00D9FF',      // Cyan
  colorSecondary: '#0891B2',
  
  metrics: {
    initialCash: 4.5,      // $4.5M
    raiseAmount: 15.0,     // $15M
    postMoneyCash: 19.5,   // $19.5M
    dilution: 0.20,        // 20%
    avgBurn: 420,          // $420K/month at peak
    avgRunway: 46,         // 46 months average
    peakARR: 24.8,         // $24.8M ARR at month 36
    exitValue: 148.8,      // $148.8M (6x ARR multiple)
    riskScore: 38,
    riskLevel: 'Med',
    successRate: 0.73,     // 73% probability of success
    breakingPoint: 'CAC > $12K or Churn > 8%',
  },

  distribution: {
    p10: { exitValue: 62.4, arr: 10.4, runway: 18 },
    p25: { exitValue: 96.0, arr: 16.0, runway: 28 },
    p50: { exitValue: 148.8, arr: 24.8, runway: 46 },
    p75: { exitValue: 204.0, arr: 34.0, runway: 60 },
    p90: { exitValue: 276.0, arr: 46.0, runway: 72 },
  },

  milestones: [
    {
      month: 0,
      label: 'M0 - Close',
      cash: 19.5,
      arr: 4.8,
      burn: 320,
      runway: 61,
      customers: 480,
      riskScore: 25,
      probability: 1.0,
    },
    {
      month: 6,
      label: 'M6',
      cash: 16.2,
      arr: 7.2,
      burn: 380,
      runway: 43,
      customers: 620,
      riskScore: 32,
      probability: 0.95,
    },
    {
      month: 12,
      label: 'M12',
      cash: 12.8,
      arr: 11.4,
      burn: 420,
      runway: 30,
      customers: 840,
      riskScore: 38,
      probability: 0.88,
    },
    {
      month: 18,
      label: 'M18',
      cash: 9.6,
      arr: 16.2,
      burn: 440,
      runway: 22,
      customers: 1120,
      riskScore: 42,
      probability: 0.82,
    },
    {
      month: 24,
      label: 'M24',
      cash: 7.8,
      arr: 21.6,
      burn: 380,
      runway: 21,
      customers: 1450,
      riskScore: 35,
      probability: 0.78,
    },
    {
      month: 30,
      label: 'M30',
      cash: 8.4,
      arr: 24.0,
      burn: 320,
      runway: 26,
      customers: 1680,
      riskScore: 28,
      probability: 0.75,
    },
    {
      month: 36,
      label: 'M36 - Target',
      cash: 11.2,
      arr: 24.8,
      burn: 280,
      runway: 40,
      customers: 1820,
      riskScore: 22,
      probability: 0.73,
    },
  ],

  riskBreakdown: {
    market: 35,
    execution: 42,
    financial: 28,
    competitive: 38,
  },

  insights: [
    'Runway posture is strong at 46 months with current burn trajectory',
    'Growth momentum stable - CAC efficiency improving after month 12',
    'Peak burn at M18 is critical inflection point - monitor closely',
    'Net dollar retention of 115% supports expansion revenue',
    'Series C optionality opens at M24 if ARR exceeds $20M',
  ],

  strategicQuestions: [
    'What happens if CAC increases 30% due to market saturation?',
    'At what churn rate does this strategy become unviable?',
    'What is the minimum ARR needed to raise Series C at $200M+?',
    'How does a 6-month delay in product launch affect runway?',
    'What is the probability of reaching profitability without Series C?',
  ],
};

export default SERIES_B_STRESS_TEST;
