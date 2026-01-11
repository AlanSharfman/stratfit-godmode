// src/strategy/Strategy.ts
// STRATFIT — Strategy Type Definition

import type { ScenarioId } from "@/state/scenarioStore";

// ============================================================================
// STRATEGY LABELS
// ============================================================================

export type StrategyLabel =
  | "Conservative"
  | "Balanced"
  | "Aggressive"
  | "VC-Ready"
  | "Survival";

export const STRATEGY_LABEL_COLORS: Record<StrategyLabel, string> = {
  Survival: "#ef4444",     // Red
  Conservative: "#3b82f6", // Blue
  Balanced: "#a855f7",     // Purple
  Aggressive: "#f59e0b",   // Amber
  "VC-Ready": "#10b981",   // Emerald
};

// ============================================================================
// LEVER STATE
// ============================================================================

export interface StrategyLevers {
  demandStrength: number;
  pricingPower: number;
  expansionVelocity: number;
  costDiscipline: number;
  hiringIntensity: number;
  operatingDrag: number;
  marketVolatility: number;
  executionRisk: number;
}

// ============================================================================
// KPI SNAPSHOT
// ============================================================================

export interface StrategyKpis {
  enterpriseValue?: { value: number; display: string };
  arrNext12?: { value: number; display: string };
  arrCurrent?: { value: number; display: string };
  arrDelta?: { value: number; display: string };
  runway?: { value: number; display: string };
  cashPosition?: { value: number; display: string };
  momentum?: { value: number; display: string };
  burnQuality?: { value: number; display: string };
  riskIndex?: { value: number; display: string };
  earningsPower?: { value: number; display: string };
  cac?: { value: number; display: string };
  cacPayback?: { value: number; display: string };
  ltvCac?: { value: number; display: string };
  cacQuality?: { value: number; display: string };
  safeCac?: { value: number; display: string };
  [key: string]: { value: number; display: string } | undefined;
}

// ============================================================================
// TIMELINE PROJECTION
// ============================================================================

export interface TimelinePoint {
  month: number;
  arr: number;
  valuation: number;
  runway: number;
  cash: number;
  risk: number;
  fundingRounds: number;
  totalFunding: number;
  founderOwnership: number;
  lastFundingType?: "safe" | "equity";
}

// ============================================================================
// CAP TABLE
// ============================================================================

export interface CapTable {
  founders: number;
  investors: number;
}

// ============================================================================
// STRATEGY
// ============================================================================

export interface Strategy {
  id: string;
  name: string;
  label: StrategyLabel;
  scenario: ScenarioId;
  levers: StrategyLevers;
  kpis: StrategyKpis;
  timeline: TimelinePoint[];
  breakEvenMonth: number | null;
  totalFunding: number;
  fundingRounds: number;
  capTable: CapTable;
  investorIRR: number;         // Internal Rate of Return for investors
  investorProceeds: number;    // Investor proceeds at 8x exit
  founderProceeds: number;     // Founder proceeds at 8x exit
  createdAt: string;
  notes?: string;
}

// ============================================================================
// EXIT MODELING
// ============================================================================

export interface ExitValue {
  enterprise: number;
  founders: number;
  investors: number;
}

export function calculateExitValue(strategy: Strategy, multiple: number = 8): ExitValue {
  const finalPoint = strategy.timeline[strategy.timeline.length - 1];
  const finalARR = finalPoint?.arr ?? 0;
  const enterprise = finalARR * multiple;
  
  const founders = enterprise * strategy.capTable.founders;
  const investors = enterprise * strategy.capTable.investors;
  
  return { enterprise, founders, investors };
}

// ============================================================================
// BREAK-EVEN CALCULATION
// ============================================================================

export function findBreakEven(timeline: TimelinePoint[]): number | null {
  const grossMargin = 0.74;
  
  for (const p of timeline) {
    // Break-even: ARR × Gross Margin ≥ Annual Burn
    const annualBurn = p.runway > 0 ? (p.cash / p.runway) * 12 : Infinity;
    if (p.arr * grossMargin >= annualBurn) {
      return p.month;
    }
  }
  
  return null;
}

// ============================================================================
// CLASSIFICATION LOGIC
// ============================================================================

export function classifyStrategy(kpis: StrategyKpis): StrategyLabel {
  const runway = kpis.runway?.value ?? 0;
  const ltvCac = kpis.ltvCac?.value ?? 0;
  const cacPayback = kpis.cacPayback?.value ?? 999;
  const riskIndex = kpis.riskIndex?.value ?? 100;
  const enterpriseValue = kpis.enterpriseValue?.value ?? 0;

  // Priority order matters
  if (runway < 12) return "Survival";
  if (ltvCac >= 3 && cacPayback <= 18 && runway >= 18) return "VC-Ready";
  if (riskIndex < 40) return "Conservative";
  if (enterpriseValue > 80_000_000) return "Aggressive";
  return "Balanced";
}

