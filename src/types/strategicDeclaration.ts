// src/types/strategicDeclaration.ts

export type IntentType =
  | 'Controlled Growth'
  | 'Aggressive Expansion'
  | 'Margin Optimization'
  | 'Survival & Stabilization'
  | 'Market Domination'
  | 'Exit Preparation';

export type GrowthDriver =
  | 'Pricing Power'
  | 'Volume Expansion'
  | 'New Product Launch'
  | 'Geographic Expansion'
  | 'Operational Efficiency'
  | 'M&A'
  | 'Channel Expansion';

export type LeadershipBandwidth = 'Fully Focused' | 'Stretched' | 'Fragmented';

export type TeamDepth = 'Strong Bench' | 'Adequate' | 'Thin';

export type CapitalAccess = 'Confirmed' | 'Likely' | 'Uncertain' | 'None';

export type SupplierDependency = 'Diversified' | 'Moderate' | 'High';

export interface StrategicDeclarationInput {
  // Section 1
  intentType: IntentType;
  targetRevenue: number;
  targetMargin: number;
  growthDrivers: GrowthDriver[];

  // Section 2
  currentRevenue: number;
  grossMargin: number;
  recurringRevenueRatio: number;
  fixedCosts: number;
  variableCostRatio: number;
  cash: number;
  netDebt: number;

  // Section 3
  leadershipBandwidth: LeadershipBandwidth;
  teamDepth: TeamDepth;
  capitalAccess: CapitalAccess;
  clientConcentration: number;
  supplierDependency: SupplierDependency;
}

export interface DerivedMetrics {
  runwayMonths: number;
  operatingLeverageRatio: number;
  volatilityIndex: number;
  liquidityBuffer: number;
}

export interface StrategicDeclarationPayload {
  strategy_profile: {
    intent_type: IntentType;
    growth_driver_vector: GrowthDriver[];
  };
  financial_baseline: {
    baseline_revenue: number;
    gross_margin: number;
    recurring_ratio: number;
    fixed_costs: number;
    variable_ratio: number;
    cash: number;
    net_debt: number;
  };
  target_structure: {
    target_revenue: number;
    target_margin: number;
  };
  execution_posture: {
    leadership_bandwidth: LeadershipBandwidth;
    team_depth: TeamDepth;
    capital_access: CapitalAccess;
    client_concentration: number;
    supplier_dependency: SupplierDependency;
  };
  derived_metrics: DerivedMetrics;
}


