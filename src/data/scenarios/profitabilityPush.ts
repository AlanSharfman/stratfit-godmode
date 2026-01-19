/**
 * STRATFIT - Profitability Push Scenario
 * Pre-calculated Monte Carlo simulation results (10,000 simulations)
 * 
 * Strategy: Bootstrap to profitability, controlled burn
 * Risk Profile: Conservative with lower upside, higher stability
 */

import type { ScenarioData } from './seriesBStressTest';

export const PROFITABILITY_PUSH: ScenarioData = {
  id: 'profitability-push',
  name: 'Profitability Push',
  shortName: 'Profitability',
  description: 'Conservative path to profitability without external funding',
  strategy: 'No new funding, reduce burn to $120K/month, focus on margins',
  color: '#FF9500',      // Orange
  colorSecondary: '#D97706',
  
  metrics: {
    initialCash: 2.8,      // $2.8M
    raiseAmount: 0,        // No raise
    postMoneyCash: 2.8,    // $2.8M (unchanged)
    dilution: 0,           // 0% dilution
    avgBurn: 95,           // $95K/month average (declining to breakeven)
    avgRunway: 36,         // 36 months to profitability
    peakARR: 8.4,          // $8.4M ARR at month 36
    exitValue: 42.0,       // $42M (5x ARR multiple - lower multiple for slower growth)
    riskScore: 28,
    riskLevel: 'Low',
    successRate: 0.89,     // 89% probability of success
    breakingPoint: 'Churn > 5% or Growth < 4%/month',
  },

  distribution: {
    p10: { exitValue: 24.0, arr: 4.8, runway: 18 },
    p25: { exitValue: 33.0, arr: 6.6, runway: 26 },
    p50: { exitValue: 42.0, arr: 8.4, runway: 36 },
    p75: { exitValue: 52.5, arr: 10.5, runway: 48 },
    p90: { exitValue: 66.0, arr: 13.2, runway: 60 },
  },

  milestones: [
    {
      month: 0,
      label: 'M0 - Start',
      cash: 2.8,
      arr: 2.8,
      burn: 140,
      runway: 20,
      customers: 280,
      riskScore: 35,
      probability: 1.0,
    },
    {
      month: 6,
      label: 'M6',
      cash: 2.1,
      arr: 3.6,
      burn: 120,
      runway: 18,
      customers: 340,
      riskScore: 32,
      probability: 0.96,
    },
    {
      month: 12,
      label: 'M12',
      cash: 1.8,
      arr: 4.6,
      burn: 100,
      runway: 18,
      customers: 420,
      riskScore: 28,
      probability: 0.94,
    },
    {
      month: 18,
      label: 'M18',
      cash: 1.9,
      arr: 5.8,
      burn: 80,
      runway: 24,
      customers: 520,
      riskScore: 24,
      probability: 0.92,
    },
    {
      month: 24,
      label: 'M24',
      cash: 2.4,
      arr: 7.0,
      burn: 50,
      runway: 48,
      customers: 640,
      riskScore: 20,
      probability: 0.91,
    },
    {
      month: 30,
      label: 'M30',
      cash: 3.2,
      arr: 7.8,
      burn: 20,
      runway: 160,
      customers: 720,
      riskScore: 15,
      probability: 0.90,
    },
    {
      month: 36,
      label: 'M36 - Profitable',
      cash: 4.6,
      arr: 8.4,
      burn: -40,  // Profitable! Negative burn = cash generation
      runway: 999, // Infinite runway
      customers: 780,
      riskScore: 12,
      probability: 0.89,
    },
  ],

  riskBreakdown: {
    market: 22,
    execution: 18,
    financial: 32,
    competitive: 25,
  },

  insights: [
    'Path to profitability at M32 with current trajectory',
    'Lower growth but significantly reduced dilution (0%)',
    'Customer acquisition focused on high-LTV enterprise accounts',
    'Operational efficiency improving - gross margin reaches 78%',
    'Founder control maintained - no board seats given up',
  ],

  strategicQuestions: [
    'What is the opportunity cost of not raising (slower market capture)?',
    'How does competitor funding affect our market position?',
    'At what point should we reconsider external funding?',
    'What is the minimum growth rate to remain competitive?',
    'Can we accelerate to $10M ARR without compromising profitability?',
  ],
};

export default PROFITABILITY_PUSH;
