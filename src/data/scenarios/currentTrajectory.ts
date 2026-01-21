/**
 * STRATFIT - Current Trajectory Scenario (Base Case)
 * Pre-calculated Monte Carlo simulation results (10,000 simulations)
 * 
 * Strategy: Continue current path with no major strategic changes
 * Risk Profile: Moderate - known trajectory with organic growth
 */

import type { ScenarioData } from './seriesBStressTest';

export const CURRENT_TRAJECTORY: ScenarioData = {
  id: 'current-trajectory',
  name: 'Current Trajectory',
  shortName: 'Current',
  description: 'Continue current path with existing resources and strategy',
  strategy: 'No capital raise, organic growth, maintain current burn rate',
  color: '#94A3B8',      // Slate/Gray - neutral baseline
  colorSecondary: '#64748B',
  
  metrics: {
    initialCash: 2.8,      // $2.8M
    raiseAmount: 0,        // No raise
    postMoneyCash: 2.8,    // Same as initial
    dilution: 0,           // No dilution
    avgBurn: 180,          // $180K/month
    avgRunway: 15,         // 15 months
    peakARR: 8.4,          // $8.4M ARR at month 24
    exitValue: 42.0,       // $42M (5x ARR multiple)
    riskScore: 52,
    riskLevel: 'Med',
    successRate: 0.64,     // 64% probability of success
    breakingPoint: 'Runway < 6 months or Growth < 5% MoM',
  },

  distribution: {
    p10: { exitValue: 18.0, arr: 3.6, runway: 6 },
    p25: { exitValue: 28.0, arr: 5.6, runway: 10 },
    p50: { exitValue: 42.0, arr: 8.4, runway: 15 },
    p75: { exitValue: 58.0, arr: 11.6, runway: 20 },
    p90: { exitValue: 76.0, arr: 15.2, runway: 26 },
  },

  milestones: [
    {
      month: 0,
      label: 'M0 - Today',
      cash: 2.8,
      arr: 3.2,
      burn: 180,
      runway: 15,
      customers: 320,
      riskScore: 45,
      probability: 1.0,
    },
    {
      month: 6,
      label: 'M6',
      cash: 1.9,
      arr: 4.2,
      burn: 175,
      runway: 11,
      customers: 385,
      riskScore: 52,
      probability: 0.92,
    },
    {
      month: 12,
      label: 'M12',
      cash: 1.2,
      arr: 5.6,
      burn: 170,
      runway: 7,
      customers: 460,
      riskScore: 58,
      probability: 0.82,
    },
    {
      month: 18,
      label: 'M18',
      cash: 0.8,
      arr: 7.2,
      burn: 165,
      runway: 5,
      customers: 540,
      riskScore: 62,
      probability: 0.72,
    },
    {
      month: 24,
      label: 'M24 - Target',
      cash: 0.6,
      arr: 8.4,
      burn: 160,
      runway: 4,
      customers: 620,
      riskScore: 55,
      probability: 0.64,
    },
  ],

  riskBreakdown: {
    market: 42,
    execution: 35,
    financial: 68,
    competitive: 48,
  },

  insights: [
    'Runway is the primary constraint at 15 months with current burn',
    'Organic growth of 8-10% MoM is sustainable but limits scale',
    'Financial risk elevated - no buffer for unexpected costs',
    'Profitability achievable at M18 if burn reduces to $140K/month',
    'Optionality limited - harder to raise once runway drops below 6 months',
  ],

  strategicQuestions: [
    'What happens if growth slows to 5% MoM?',
    'At what point does reduced runway make fundraising impossible?',
    'What is the minimum ARR needed to reach profitability?',
    'How does losing one key customer affect survival probability?',
    'What market conditions would force a pivot or shutdown?',
  ],
};

export default CURRENT_TRAJECTORY;

