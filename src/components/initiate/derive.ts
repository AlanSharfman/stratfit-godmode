export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "INR" | "BRL" | "MXN" | "Other";

export type BusinessModel = "SaaS" | "Marketplace" | "Hybrid" | "Services" | "Other";
export type Stage = "Pre-ARR" | "Early ARR" | "Growth" | "Scale";

export interface InitiateEntityContext {
  companyName: string;
  industry: string;
  businessModel: BusinessModel;
  stage: Stage;
  revenueModel: string;
  currency: CurrencyCode;
  purpose: string;
}

export type RevenueInputMode = "ARR" | "MonthlyRevenue";

export interface InitiateCapitalPhysics {
  cashOnHand: number; // currency
  revenueInputMode: RevenueInputMode;
  arr: number; // currency, annual
  monthlyRevenue: number; // currency, monthly
  momGrowthPct: number; // percent
  grossMarginPct: number; // percent
  monthlyOpex: number; // currency
  debtObligationsMonthly: number; // currency
  headcount: number;
  committedFunding: number; // currency (optional, may be 0)
}

export interface InitiateOperatingStructure {
  revenueConcentrationPct: number;
  churnBandPct: number;
  salesCycleDays: number;
  pipelineReliabilityPct: number;
  fixedVsVariableCostRatioPct: number; // % fixed (0..100). Variable = 100 - fixed.
  keyDependencyExposurePct: number;
  hiringPlan12mo: string;
}

export interface DerivedCapitalPhysics {
  monthlyGrossProfit: number;
  cogsMonthly: number;
  totalCostsMonthly: number;
  variableCostsMonthly: number;
  contributionMarginMonthly: number;
  contributionMarginPct: number;

  netBurnMonthly: number;
  burnMultiple: number | null;
  runwayMonths: number | null;
  operatingLeverage: number | null;
  capitalDurabilityBand: "Critical" | "Fragile" | "Stable" | "Durable";
}

export interface StructuralMapping {
  volatilityCoefficient: number; // 0..1
  fragilityIndex: number; // 0..1
  shockAmplificationFactor: number; // 0..1
  structuralSensitivitySlope: number; // 0..1
}

export interface StructuralProfile {
  capitalDurability01: number; // 0..1
  marginResilience01: number; // 0..1
  volatilityExposure01: number; // 0..1
  fundingPressure01: number; // 0..1
  operatingLeverage01: number; // 0..1
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeDiv(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

export function deriveCapitalPhysics(input: InitiateCapitalPhysics): DerivedCapitalPhysics {
  const monthlyRevenue = Math.max(0, input.revenueInputMode === "MonthlyRevenue" ? input.monthlyRevenue : input.arr / 12);
  const grossMargin01 = clamp01(input.grossMarginPct / 100);

  const monthlyGrossProfit = monthlyRevenue * grossMargin01;
  const cogsMonthly = monthlyRevenue * (1 - grossMargin01);

  const totalCostsMonthly = Math.max(0, input.monthlyOpex) + Math.max(0, input.debtObligationsMonthly) + cogsMonthly;
  // We treat "fixed vs variable cost ratio" as cost structure, but in capital physics we don’t ask it.
  // For contribution margin we will treat variable costs as 35% of non-COGS costs by default (institutional baseline).
  const assumedVariableShare = 0.35;
  const variableCostsMonthly = (Math.max(0, input.monthlyOpex) + Math.max(0, input.debtObligationsMonthly)) * assumedVariableShare;

  const contributionMarginMonthly = monthlyRevenue - cogsMonthly - variableCostsMonthly;
  const contributionMarginPct = safeDiv(contributionMarginMonthly, monthlyRevenue) ?? 0;

  const netBurnMonthly = Math.max(0, input.monthlyOpex) + Math.max(0, input.debtObligationsMonthly) - monthlyGrossProfit;

  // Burn multiple: annualized net burn / net new ARR. Uses ARR and MoM growth.
  const growth01 = input.momGrowthPct / 100;
  const netNewArrAnnual = Math.max(0, input.arr) * Math.max(0, growth01) * 12;
  const burnMultiple = netNewArrAnnual > 0 ? (netBurnMonthly * 12) / netNewArrAnnual : null;

  const runwayMonths = netBurnMonthly > 0 ? (input.cashOnHand + Math.max(0, input.committedFunding)) / netBurnMonthly : null;
  const operatingLeverage = safeDiv(monthlyGrossProfit, input.monthlyOpex) ?? null;

  const runway = runwayMonths ?? Infinity;
  const capitalDurabilityBand =
    runway < 6 ? "Critical" :
    runway < 12 ? "Fragile" :
    runway < 24 ? "Stable" :
    "Durable";

  return {
    monthlyGrossProfit,
    cogsMonthly,
    totalCostsMonthly,
    variableCostsMonthly,
    contributionMarginMonthly,
    contributionMarginPct,
    netBurnMonthly,
    burnMultiple,
    runwayMonths,
    operatingLeverage,
    capitalDurabilityBand,
  };
}

export function mapOperatingStructureToStructuralFactors(params: {
  operating: InitiateOperatingStructure;
  derived: DerivedCapitalPhysics;
}): StructuralMapping {
  const { operating, derived } = params;

  const conc01 = clamp01(operating.revenueConcentrationPct / 100);
  const churn01 = clamp01(operating.churnBandPct / 100);
  const pipeline01 = clamp01(operating.pipelineReliabilityPct / 100);
  const salesCycle01 = clamp01(operating.salesCycleDays / 180); // 0..180d
  const fixed01 = clamp01(operating.fixedVsVariableCostRatioPct / 100);
  const dep01 = clamp01(operating.keyDependencyExposurePct / 100);

  // Volatility: concentration + churn + unreliable pipeline + long cycle
  const volatilityCoefficient = clamp01(
    0.30 * conc01 +
    0.30 * churn01 +
    0.25 * (1 - pipeline01) +
    0.15 * salesCycle01
  );

  // Fragility: low runway + high volatility + high fixed + high dependency
  const runway = derived.runwayMonths ?? 36;
  const runwayRisk01 = clamp01((24 - Math.min(24, runway)) / 24); // 0 good, 1 bad
  const fragilityIndex = clamp01(
    0.40 * runwayRisk01 +
    0.25 * volatilityCoefficient +
    0.20 * fixed01 +
    0.15 * dep01
  );

  // Shock amplification: fixed cost structure + dependency exposure + low contribution margin
  const cm01 = clamp01(derived.contributionMarginPct);
  const shockAmplificationFactor = clamp01(0.45 * fixed01 + 0.35 * dep01 + 0.20 * (1 - cm01));

  // Structural sensitivity: burn multiple + volatility + concentration
  const burnMult = derived.burnMultiple ?? 0;
  const burn01 = clamp01(burnMult / 4); // 4x ~ high
  const structuralSensitivitySlope = clamp01(0.45 * burn01 + 0.35 * volatilityCoefficient + 0.20 * conc01);

  return { volatilityCoefficient, fragilityIndex, shockAmplificationFactor, structuralSensitivitySlope };
}

export function buildStructuralProfile(params: {
  operating: InitiateOperatingStructure;
  derived: DerivedCapitalPhysics;
}): StructuralProfile {
  const { operating, derived } = params;

  const runway = derived.runwayMonths ?? 0;
  const capitalDurability01 = clamp01(Math.min(36, runway) / 36);

  const cm01 = clamp01(derived.contributionMarginPct);
  const gm01 = clamp01((derived.monthlyGrossProfit > 0 ? 1 : 0) * (operating ? 1 : 1)); // keep deterministic
  const marginResilience01 = clamp01(0.55 * cm01 + 0.45 * clamp01(gm01));

  const volatilityExposure01 = clamp01(
    0.35 * clamp01(operating.revenueConcentrationPct / 100) +
    0.35 * clamp01(operating.churnBandPct / 100) +
    0.20 * (1 - clamp01(operating.pipelineReliabilityPct / 100)) +
    0.10 * clamp01(operating.salesCycleDays / 180)
  );

  const debtPressure01 = clamp01(derived.totalCostsMonthly > 0 ? operating.keyDependencyExposurePct / 100 : 0); // placeholder tie-in
  const fundingPressure01 = clamp01(
    0.60 * clamp01((24 - Math.min(24, runway)) / 24) +
    0.40 * clamp01(debtPressure01)
  );

  const opLev = derived.operatingLeverage ?? 0;
  const fixed01 = clamp01(operating.fixedVsVariableCostRatioPct / 100);
  const operatingLeverage01 = clamp01(0.60 * clamp01(opLev / 1.5) + 0.40 * (1 - fixed01));

  return { capitalDurability01, marginResilience01, volatilityExposure01, fundingPressure01, operatingLeverage01 };
}


