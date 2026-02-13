// src/logic/objectiveEngine.ts
// STRATFIT — Objective Engine: pure deterministic computation
// Given user-defined outcome targets + mode, derive structural requirements,
// rank constraints, and detect conflicts.

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type ObjectiveMode = "conservative" | "base" | "aggressive";

export interface ObjectiveTargets {
  arr: number;           // Target ARR ($)
  growth: number;        // YoY growth (%)
  grossMargin: number;   // Gross margin target (%)
  burn: number;          // Net monthly burn ($/mo)
  runway: number;        // Runway target (months)
  survival: number;      // Survival probability target (%)
}

export interface ObjectiveInput {
  horizonMonths: number;
  targets: ObjectiveTargets;
  mode: ObjectiveMode;
  baselineSnapshot?: {
    currentARR?: number;
    currentBurn?: number;
    currentMargin?: number;
    cashOnHand?: number;
    headcount?: number;
    nrr?: number;
    churn?: number;
  };
}

export interface DerivedRequirements {
  requiredNRR: number;             // %
  maxChurn: number;                // %
  pipelineCoverage: number;        // x
  cacPaybackMonths: number;        // months
  ltvCacRatio: number;             // x
  requiredSalesVelocity: number;   // deals/mo
  headcountCeiling: number;        // # employees
  operatingDisciplineScore: number; // 0–100
}

export interface ConstraintEntry {
  id: string;
  label: string;
  severity: number;   // 0..1
  note: string;
}

export interface ConflictEntry {
  id: string;
  message: string;
}

export interface ObjectiveResult {
  requirements: DerivedRequirements;
  constraintRank: ConstraintEntry[];
  conflicts: ConflictEntry[];
  primaryConstraint: string;
  successConditions: string[];
  riskFlags: string[];
  feasibilityScore: number; // 0..100
}

// ---------------------------------------------------------------------------
// MODE MULTIPLIERS
// ---------------------------------------------------------------------------

const MODE_FACTORS: Record<ObjectiveMode, { churnTolerance: number; cushion: number; aggression: number }> = {
  conservative: { churnTolerance: 0.7, cushion: 1.3, aggression: 0.8 },
  base:         { churnTolerance: 1.0, cushion: 1.0, aggression: 1.0 },
  aggressive:   { churnTolerance: 1.3, cushion: 0.7, aggression: 1.3 },
};

// ---------------------------------------------------------------------------
// CORE COMPUTATION
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function computeObjective(input: ObjectiveInput): ObjectiveResult {
  const { horizonMonths, targets, mode, baselineSnapshot } = input;
  const mf = MODE_FACTORS[mode];

  const currentARR = baselineSnapshot?.currentARR ?? targets.arr * 0.4;
  const currentBurn = baselineSnapshot?.currentBurn ?? targets.burn;
  const cashOnHand = baselineSnapshot?.cashOnHand ?? targets.burn * targets.runway;
  const headcount = baselineSnapshot?.headcount ?? 25;
  const currentNRR = baselineSnapshot?.nrr ?? 105;
  const currentChurn = baselineSnapshot?.churn ?? 5;

  // --- Required NRR ---
  // To hit ARR growth, need net retention above churn drag
  const growthFactor = targets.arr / currentARR;
  const impliedMonthlyGrowth = Math.pow(growthFactor, 1 / horizonMonths) - 1;
  const impliedAnnualGrowth = Math.pow(1 + impliedMonthlyGrowth, 12) - 1;
  const requiredNRRRaw = 100 + (impliedAnnualGrowth * 100 * 0.4); // 40% from expansion
  const requiredNRR = clamp(Math.round(requiredNRRRaw * 10) / 10, 80, 200);

  // --- Max churn ---
  const baseMaxChurn = Math.max(1, 15 - (targets.growth / 10));
  const maxChurn = clamp(Math.round(baseMaxChurn * mf.churnTolerance * 10) / 10, 0.5, 20);

  // --- Pipeline coverage ---
  const monthlyNewARR = (targets.arr - currentARR * (requiredNRR / 100)) / horizonMonths;
  const avgDealSize = currentARR / Math.max(headcount, 5) * 0.3;
  const pipelineCoverage = clamp(
    Math.round((3 + targets.growth / 25) * mf.cushion * 10) / 10,
    2,
    8
  );

  // --- CAC payback ---
  const targetMarginDecimal = targets.grossMargin / 100;
  const cacPaybackMonths = clamp(
    Math.round((18 - targets.grossMargin / 10 + (100 - targets.survival) / 15) * mf.cushion),
    4,
    36
  );

  // --- LTV/CAC ---
  const ltvCacRatio = clamp(
    Math.round((3.5 + targetMarginDecimal * 2 - maxChurn / 20) * 10) / 10,
    1,
    10
  );

  // --- Required sales velocity ---
  const dealsPerMonth = clamp(
    Math.round(Math.max(monthlyNewARR / Math.max(avgDealSize, 10000), 1) * mf.aggression),
    1,
    200
  );

  // --- Headcount ceiling ---
  const revPerHead = targets.arr / Math.max(headcount, 1);
  const burnPerHead = targets.burn > 0 ? targets.burn / Math.max(headcount, 1) : 15000;
  const maxBurnFromRunway = cashOnHand / Math.max(targets.runway, 1);
  const headcountCeiling = clamp(
    Math.round(maxBurnFromRunway / Math.max(burnPerHead, 5000)),
    1,
    1000
  );

  // --- Operating discipline score ---
  const marginPressure = clamp((targets.grossMargin - 50) / 30, 0, 1);
  const burnPressure = clamp(1 - (targets.burn / Math.max(currentBurn * 1.5, 1)), 0, 1);
  const runwayPressure = clamp(targets.runway / 36, 0, 1);
  const operatingDisciplineScore = clamp(
    Math.round((marginPressure * 35 + burnPressure * 35 + runwayPressure * 30) * mf.cushion),
    0,
    100
  );

  const requirements: DerivedRequirements = {
    requiredNRR,
    maxChurn,
    pipelineCoverage,
    cacPaybackMonths,
    ltvCacRatio,
    requiredSalesVelocity: dealsPerMonth,
    headcountCeiling,
    operatingDisciplineScore,
  };

  // --- Constraint ranking ---
  const constraints: ConstraintEntry[] = [];

  // Growth tension
  const growthStress = clamp(targets.growth / 100, 0, 1);
  constraints.push({
    id: "growth",
    label: "Growth Intensity",
    severity: growthStress,
    note: targets.growth > 80
      ? "Extreme growth target requires exceptional execution"
      : targets.growth > 50
      ? "Aggressive growth demands strong pipeline coverage"
      : "Moderate growth target achievable with discipline",
  });

  // Burn constraint
  const burnStress = clamp(1 - (maxBurnFromRunway / Math.max(targets.burn, 1)), 0, 1);
  constraints.push({
    id: "burn",
    label: "Burn Constraint",
    severity: clamp(burnStress, 0, 1),
    note: burnStress > 0.6
      ? "Burn exceeds sustainable level for target runway"
      : "Burn within acceptable range",
  });

  // Margin pressure
  const marginStress = clamp((targets.grossMargin - 60) / 30, 0, 1);
  constraints.push({
    id: "margin",
    label: "Margin Pressure",
    severity: marginStress,
    note: targets.grossMargin > 75
      ? "High margin target narrows operating flexibility"
      : "Margin target is structurally feasible",
  });

  // Survival tension
  const survivalStress = clamp((targets.survival - 60) / 35, 0, 1);
  constraints.push({
    id: "survival",
    label: "Survival Probability",
    severity: survivalStress,
    note: targets.survival > 85
      ? "High survival target constrains risk-taking capacity"
      : "Survival target is compatible with growth posture",
  });

  // Runway tension
  const runwayStress = clamp((targets.runway - 12) / 24, 0, 1);
  constraints.push({
    id: "runway",
    label: "Runway Requirement",
    severity: runwayStress,
    note: targets.runway > 24
      ? "Long runway target demands extreme capital efficiency"
      : "Runway target is achievable",
  });

  // Sort by severity descending, take top entries
  constraints.sort((a, b) => b.severity - a.severity);

  // --- Conflict detection ---
  const conflicts: ConflictEntry[] = [];

  if (targets.runway > 18 && targets.burn > cashOnHand / 12 && targets.arr < currentARR * 1.5) {
    conflicts.push({
      id: "runway-burn-arr",
      message: "High runway target conflicts with elevated burn and modest ARR growth",
    });
  }

  if (targets.grossMargin < 50 && targets.burn < currentBurn * 0.6) {
    conflicts.push({
      id: "margin-burn",
      message: "Low gross margin target is difficult to reconcile with aggressive burn reduction",
    });
  }

  if (targets.survival > 85 && targets.growth > 80) {
    conflicts.push({
      id: "survival-growth",
      message: "Extreme growth target conflicts with high survival probability requirement",
    });
  }

  if (targets.growth > 100 && targets.runway > 24) {
    conflicts.push({
      id: "growth-runway",
      message: "Hyper-growth with long runway is structurally fragile without external capital",
    });
  }

  if (maxChurn < 3 && targets.growth > 60) {
    conflicts.push({
      id: "churn-growth",
      message: "Near-zero churn tolerance is unrealistic at high growth rates",
    });
  }

  // --- Primary constraint ---
  const primaryConstraint = constraints[0]
    ? `Primary constraint: ${constraints[0].label} (severity ${Math.round(constraints[0].severity * 100)}%) — ${constraints[0].note}`
    : "No dominant constraint detected";

  // --- Success conditions ---
  const successConditions: string[] = [
    `Maintain NRR above ${requiredNRR}% throughout the ${horizonMonths}-month horizon`,
    `Keep monthly churn below ${maxChurn}% to protect expansion revenue`,
    `Pipeline coverage at ${pipelineCoverage}x to sustain deal flow`,
    `CAC payback under ${cacPaybackMonths} months to preserve capital efficiency`,
    `Operating discipline score above ${Math.max(operatingDisciplineScore - 10, 40)} to hold structural integrity`,
  ];

  // --- Risk flags ---
  const riskFlags: string[] = [];
  if (targets.growth > 70 && targets.runway > 18 && targets.burn < cashOnHand / 18) {
    riskFlags.push("Growth + runway targets may require external capital injection");
  }
  if (requiredNRR > 130) {
    riskFlags.push("Required NRR exceeds typical enterprise benchmark (130%)");
  }
  if (headcountCeiling < headcount) {
    riskFlags.push("Headcount must decrease to meet burn/runway constraints");
  }
  if (targets.grossMargin > 80 && targets.growth > 60) {
    riskFlags.push("Simultaneous high margin and high growth is rare outside software");
  }
  if (cacPaybackMonths > 24) {
    riskFlags.push("CAC payback exceeding 24 months indicates capital-intensive growth");
  }

  // --- Feasibility score ---
  const avgSeverity = constraints.reduce((s, c) => s + c.severity, 0) / Math.max(constraints.length, 1);
  const conflictPenalty = conflicts.length * 8;
  const feasibilityScore = clamp(
    Math.round(100 - avgSeverity * 50 - conflictPenalty),
    0,
    100
  );

  return {
    requirements,
    constraintRank: constraints,
    conflicts,
    primaryConstraint,
    successConditions,
    riskFlags,
    feasibilityScore,
  };
}

// ---------------------------------------------------------------------------
// PSEUDO-HISTORY GENERATOR (for sparklines)
// ---------------------------------------------------------------------------

export function generatePseudoHistory(currentValue: number, length: number = 12): number[] {
  const points: number[] = [];
  let v = currentValue * 0.6;
  const step = (currentValue - v) / length;
  for (let i = 0; i < length; i++) {
    const noise = (Math.sin(i * 2.7 + currentValue * 0.01) * 0.08 + Math.cos(i * 1.3) * 0.04) * currentValue;
    v += step + noise;
    points.push(Math.max(0, v));
  }
  // Ensure last point matches current value
  points[points.length - 1] = currentValue;
  return points;
}

// ---------------------------------------------------------------------------
// LEGACY COMPAT — used by scenarioStore.ts
// ---------------------------------------------------------------------------

export interface DerivedKPIs {
  minMonthlyGrowthRate: number;
  maxChurnRate: number;
  minGrossMargin: number;
  maxBurnAllowed: number;
  minRunwayMonths: number;
  minRevenuePerEmployee: number;
  maxCostPerEmployee: number;
  feasibilityScore: number;
}

export function deriveKPIs(input: {
  targetARR: number;
  timeHorizonMonths: number;
  marginTarget: number;
  riskPosture: "conservative" | "balanced" | "aggressive";
  raiseStrategy: string;
  hiringIntent: "lean" | "moderate" | "expansion";
  currentARR: number;
  currentBurn: number;
  currentGrossMargin: number;
  headcount: number;
  cashOnHand: number;
}): DerivedKPIs {
  const {
    targetARR, timeHorizonMonths, currentARR, currentBurn,
    currentGrossMargin, headcount, cashOnHand, marginTarget,
    riskPosture, hiringIntent,
  } = input;

  const growthFactor = targetARR / Math.max(currentARR, 1);
  const minMonthlyGrowthRate = Math.pow(growthFactor, 1 / timeHorizonMonths) - 1;

  const churnMultiplier = riskPosture === "conservative" ? 0.85 : riskPosture === "aggressive" ? 1.15 : 1.0;
  const maxChurnRate = 0.05 * churnMultiplier;

  const minGrossMargin = Math.max(marginTarget, currentGrossMargin);
  const minRunwayMonths = riskPosture === "conservative" ? 12 : 8;
  const maxBurnAllowed = cashOnHand / Math.max(minRunwayMonths, 1);

  const minRevenuePerEmployee = targetARR / Math.max(headcount, 1);
  const maxCostPerEmployee = hiringIntent === "lean" ? 140000 : hiringIntent === "expansion" ? 180000 : 160000;

  const stressScore = minMonthlyGrowthRate * 100 + (currentBurn > maxBurnAllowed ? 15 : 0) + (currentGrossMargin < minGrossMargin ? 10 : 0);
  const feasibilityScore = Math.max(0, 100 - stressScore);

  return {
    minMonthlyGrowthRate, maxChurnRate, minGrossMargin, maxBurnAllowed,
    minRunwayMonths, minRevenuePerEmployee, maxCostPerEmployee, feasibilityScore,
  };
}


