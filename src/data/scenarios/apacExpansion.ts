/**
 * STRATFIT - APAC Expansion Scenario
 * Pre-calculated Monte Carlo simulation results (10,000 simulations)
 * 
 * Strategy: Raise $8M, expand to Singapore/Sydney markets
 * Risk Profile: Moderate risk with geographic diversification
 */

import type { ScenarioData } from './seriesBStressTest';

export const APAC_EXPANSION: ScenarioData = {
  id: 'apac-expansion',
  name: 'APAC Expansion',
  shortName: 'APAC',
  description: 'Geographic expansion into Singapore and Sydney markets',
  strategy: 'Raise $8M, establish APAC HQ in Singapore, Sydney sales office',
  color: '#10B981',      // Emerald/Green
  colorSecondary: '#059669',
  
  metrics: {
    initialCash: 3.2,      // $3.2M
    raiseAmount: 8.0,      // $8M
    postMoneyCash: 11.2,   // $11.2M
    dilution: 0.15,        // 15%
    avgBurn: 280,          // $280K/month average
    avgRunway: 40,         // 40 months average
    peakARR: 14.8,         // $14.8M ARR at month 36
    exitValue: 81.4,       // $81.4M (5.5x ARR multiple)
    riskScore: 45,
    riskLevel: 'Med',
    successRate: 0.68,     // 68% probability of success
    breakingPoint: 'APAC CAC > 2x US or FX volatility > 15%',
  },

  distribution: {
    p10: { exitValue: 36.0, arr: 6.5, runway: 14 },
    p25: { exitValue: 55.0, arr: 10.0, runway: 24 },
    p50: { exitValue: 81.4, arr: 14.8, runway: 40 },
    p75: { exitValue: 110.0, arr: 20.0, runway: 52 },
    p90: { exitValue: 148.5, arr: 27.0, runway: 64 },
  },

  milestones: [
    {
      month: 0,
      label: 'M0 - Close',
      cash: 11.2,
      arr: 3.5,
      burn: 180,
      runway: 62,
      customers: 350,
      riskScore: 35,
      probability: 1.0,
    },
    {
      month: 6,
      label: 'M6 - SG Launch',
      cash: 9.4,
      arr: 4.8,
      burn: 260,
      runway: 36,
      customers: 420,
      riskScore: 48,
      probability: 0.92,
    },
    {
      month: 12,
      label: 'M12 - SYD Launch',
      cash: 7.2,
      arr: 7.2,
      burn: 320,
      runway: 23,
      customers: 580,
      riskScore: 52,
      probability: 0.82,
    },
    {
      month: 18,
      label: 'M18',
      cash: 5.4,
      arr: 10.2,
      burn: 300,
      runway: 18,
      customers: 760,
      riskScore: 48,
      probability: 0.76,
    },
    {
      month: 24,
      label: 'M24',
      cash: 4.8,
      arr: 12.4,
      burn: 260,
      runway: 18,
      customers: 920,
      riskScore: 42,
      probability: 0.72,
    },
    {
      month: 30,
      label: 'M30',
      cash: 5.2,
      arr: 13.8,
      burn: 220,
      runway: 24,
      customers: 1040,
      riskScore: 38,
      probability: 0.70,
    },
    {
      month: 36,
      label: 'M36 - Established',
      cash: 6.4,
      arr: 14.8,
      burn: 180,
      runway: 36,
      customers: 1150,
      riskScore: 32,
      probability: 0.68,
    },
  ],

  riskBreakdown: {
    market: 48,
    execution: 55,
    financial: 38,
    competitive: 42,
  },

  insights: [
    'APAC market entry increases TAM by 40% but adds execution complexity',
    'Singapore launch at M6 is critical - determines APAC viability',
    'FX hedging required for AUD/SGD exposure',
    'APAC CAC typically 1.4x US in first 12 months, normalizes by M24',
    'Regional partnerships accelerate enterprise sales post M18',
  ],

  strategicQuestions: [
    'What happens if Singapore launch is delayed by 6 months?',
    'At what APAC CAC multiple should we pause expansion?',
    'How does AUD depreciation affect our Australian runway?',
    'Can we achieve APAC product-market fit without local team?',
    'What is the minimum APAC revenue to justify the investment?',
  ],
};

export default APAC_EXPANSION;
