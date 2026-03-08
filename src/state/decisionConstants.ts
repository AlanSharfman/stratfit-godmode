// src/state/decisionConstants.ts
// STRATFIT — Decision Intelligence Constants

import type { DecisionCategory, DecisionPriority } from './decisionTypes';

export const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  growth: 'Growth',
  cost: 'Cost Management',
  product: 'Product',
  team: 'Team & Hiring',
  funding: 'Funding',
  market: 'Market Strategy',
};

export const PRIORITY_WEIGHTS: Record<DecisionPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const RISK_TO_DECISION_CATEGORY: Record<string, DecisionCategory> = {
  runway: 'cost',
  market: 'market',
  execution: 'team',
  competition: 'market',
  funding: 'funding',
  churn: 'growth',
};
