
// src/logic/calculateScenarioHealth.ts
// STRATFIT — Scenario Health State Assessment Engine
import { SYSTEM_THRESHOLDS } from "@/config/systemThresholds";

export interface HealthMetrics {
  health: number;           // 0-100
  trend: 'strengthening' | 'stable' | 'weakening';
  vsBase: number;          // percentage vs baseline
  state: 'strong' | 'stable' | 'fragile' | 'critical';
  breakdown: {
    growth: number;
    efficiency: number;
    risk: number;
  };
}

export interface LeverValues {
  revenueGrowth: number;      // 0-100
  pricingAdjustment: number;  // 0-100
  marketingSpend: number;     // 0-100
  operatingExpenses: number;  // 0-100
  headcount: number;          // 0-100
  cashSensitivity: number;    // 0-100
  churnSensitivity: number;   // 0-100
  fundingInjection: number;   // 0-100
}



export function calculateScenarioHealth(
  levers: LeverValues,
  previousHealth?: number
): HealthMetrics {
  
  // 1. GROWTH SCORE
  const growth = Math.round(
    (levers.revenueGrowth * 0.4) +
    (levers.pricingAdjustment * 0.3) +
    (levers.marketingSpend * 0.3)
  );
  
  // 2. EFFICIENCY SCORE
  const efficiency = Math.round(
    ((100 - levers.operatingExpenses) * 0.5) +
    ((100 - levers.headcount) * 0.3) +
    ((100 - levers.cashSensitivity) * 0.2)
  );
  
  // 3. RISK SCORE (lower is better)
  const risk = Math.round(
    (levers.churnSensitivity * 0.6) +
    ((100 - levers.fundingInjection) * 0.4)
  );
  
  // 4. OVERALL HEALTH (weighted)
  const health = Math.round(
    (growth * 0.35) +
    (efficiency * 0.35) +
    ((100 - risk) * 0.30)
  );
  
  // 5. STATE CLASSIFICATION (threshold-driven)
  const { state: STATE_T, trendDelta } = SYSTEM_THRESHOLDS.health;

  let state: 'strong' | 'stable' | 'fragile' | 'critical';
  if (health >= STATE_T.strong) state = 'strong';
  else if (health >= STATE_T.stable) state = 'stable';
  else if (health >= STATE_T.fragile) state = 'fragile';
  else state = 'critical';

  // 6. TREND DETECTION
  let trend: 'strengthening' | 'stable' | 'weakening' = 'stable';
  if (previousHealth !== undefined) {
    const delta = health - previousHealth;
    if (delta > trendDelta) trend = 'strengthening';
    else if (delta < -trendDelta) trend = 'weakening';
  }

  // 7. VS BASELINE
  const BASELINE_HEALTH = SYSTEM_THRESHOLDS.health.baselineHealth;
  const vsBase = Math.round(((health - BASELINE_HEALTH) / BASELINE_HEALTH) * 100);
  
  return {
    health: Math.max(0, Math.min(100, health)),
    trend,
    vsBase,
    state,
    breakdown: { growth, efficiency, risk }
  };
}

// ============================================================================
// UTILITY: Get color for state
// ============================================================================

export type HealthState = 'strong' | 'stable' | 'fragile' | 'critical';

export function getHealthColor(state: HealthState): string {
  switch (state) {
    case "strong":
      return "#22c55e"; // green-500
    case "stable":
      return "#00E5FF"; // cyan
    case "fragile":
      return "#f59e0b"; // amber-500
    case "critical":
      return "#ef4444"; // red-500
  }
}

export function getHealthBgClass(state: HealthState): string {
  switch (state) {
    case "strong":
      return "bg-emerald-500/20 border-emerald-500/40";
    case "stable":
      return "bg-cyan-500/20 border-cyan-500/40";
    case "fragile":
      return "bg-amber-500/20 border-amber-500/40";
    case "critical":
      return "bg-red-500/20 border-red-500/40";
  }
}

export function getHealthTextClass(state: HealthState): string {
  switch (state) {
    case "strong":
      return "text-emerald-400";
    case "stable":
      return "text-cyan-400";
    case "fragile":
      return "text-amber-400";
    case "critical":
      return "text-red-400";
  }
}
