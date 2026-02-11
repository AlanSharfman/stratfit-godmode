// src/logic/objectiveEngine.ts

export type RiskPosture = 'conservative' | 'balanced' | 'aggressive'
export type RaiseStrategy = 'none' | 'single' | 'multiple'
export type HiringIntent = 'lean' | 'moderate' | 'expansion'

export interface ObjectiveInput {
  targetARR: number
  timeHorizonMonths: number
  marginTarget: number
  riskPosture: RiskPosture
  raiseStrategy: RaiseStrategy
  hiringIntent: HiringIntent
  currentARR: number
  currentBurn: number
  currentGrossMargin: number
  headcount: number
  cashOnHand: number
}

export interface DerivedKPIs {
  minMonthlyGrowthRate: number
  maxChurnRate: number
  minGrossMargin: number
  maxBurnAllowed: number
  minRunwayMonths: number
  minRevenuePerEmployee: number
  maxCostPerEmployee: number
  feasibilityScore: number
}

export function deriveKPIs(input: ObjectiveInput): DerivedKPIs {
  const {
    targetARR,
    timeHorizonMonths,
    currentARR,
    currentBurn,
    currentGrossMargin,
    headcount,
    cashOnHand,
    marginTarget,
    riskPosture,
    hiringIntent
  } = input

  // Required compound growth
  const growthFactor = targetARR / currentARR
  const minMonthlyGrowthRate =
    Math.pow(growthFactor, 1 / timeHorizonMonths) - 1

  // Risk posture adjusts churn tolerance
  const churnMultiplier =
    riskPosture === 'conservative'
      ? 0.85
      : riskPosture === 'aggressive'
      ? 1.15
      : 1.0

  const maxChurnRate = 0.05 * churnMultiplier

  // Margin floor
  const minGrossMargin = Math.max(marginTarget, currentGrossMargin)

  // Burn constraint (protect runway)
  const minRunwayMonths = riskPosture === 'conservative' ? 12 : 8
  const maxBurnAllowed = cashOnHand / minRunwayMonths

  // Revenue per employee
  const minRevenuePerEmployee = targetARR / headcount

  // Cost per employee ceiling
  const maxCostPerEmployee =
    hiringIntent === 'lean'
      ? 140000
      : hiringIntent === 'expansion'
      ? 180000
      : 160000

  // Feasibility scoring heuristic
  const stressScore =
    minMonthlyGrowthRate * 100 +
    (currentBurn > maxBurnAllowed ? 15 : 0) +
    (currentGrossMargin < minGrossMargin ? 10 : 0)

  const feasibilityScore = Math.max(0, 100 - stressScore)

  return {
    minMonthlyGrowthRate,
    maxChurnRate,
    minGrossMargin,
    maxBurnAllowed,
    minRunwayMonths,
    minRevenuePerEmployee,
    maxCostPerEmployee,
    feasibilityScore
  }
}


