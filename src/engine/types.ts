export type Money = number;
export type Percent = number;

export type Inputs = {
  // Core financial baseline (deterministic inputs)
  revenueAnnual: Money;
  grossMarginPct: Percent;     // 0..1
  opexAnnual: Money;

  cashOnHand: Money;

  // Simple valuation inputs (defensible v1)
  revenueMultiple: number;     // e.g. 2..12
};

export type Levers = {
  // Sliders (0..1 or explicit ranges set by UI)
  demandStrength: number;      // 0..1
  pricingPower: number;        // 0..1
  expansionVelocity: number;   // 0..1

  costDiscipline: number;      // 0..1
  hiringIntensity: number;     // 0..1
  operatingDrag: number;       // 0..1

  marketVolatility: number;    // 0..1
  executionRisk: number;       // 0..1
};

export type Outputs = {
  // Observable system signals (KPIs)
  revenueAnnual: Money;
  grossMarginPct: Percent;
  opexAnnual: Money;

  burnAnnual: Money;           // positive = burning cash
  burnMonthly: Money;

  runwayMonths: number;        // cash / burnMonthly (guarded)
  cashOnHand: Money;

  riskScore: number;           // 0..100

  valuation: Money;            // revenueAnnual * revenueMultiple
};

export type ScenarioRun = {
  inputs: Inputs;
  levers: Levers;
  outputs: Outputs;
};

export type Delta = {
  key: keyof Outputs;
  base: number;
  scenario: number;
  deltaAbs: number;
  deltaPct: number | null; // null when base is 0
};
