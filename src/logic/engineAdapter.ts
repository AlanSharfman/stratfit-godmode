import {
  DEFAULT_INPUTS,
  DEFAULT_LEVERS,
  calculateOutputs,
  calculateDeltas,
  type Inputs,
  type Levers,
  type Outputs,
  type Delta,
} from "@/engine";

// ============================================================================
// UI SLIDER STATE TYPE
// ============================================================================

// Matches App.tsx LeverState exactly
// Used to enforce type safety on slider mapping
export type UiLeverState = {
  // Growth
  demandStrength: number;
  pricingPower: number;
  expansionVelocity: number;
  // Efficiency
  costDiscipline: number;
  hiringIntensity: number;
  operatingDrag: number;
  // Risk
  marketVolatility: number;
  executionRisk: number;
};

// ============================================================================
// KPI DISPLAY VALUES
// ============================================================================

/**
 * UI KPI display contract (matches what App/store currently expects).
 * Raw numbers from engine → UI format (numbers only, no display strings).
 */
export type KpiValues = {
  cashPosition: number;
  runway: number;
  burn: number;
  margin: number;
  revenue: number;
  risk: number;
  valuation: number;
};

// ============================================================================
// BASE CASE LEVER STATE
// ============================================================================

/**
 * Base Case lever values (0-100 scale, matching App.tsx LeverState).
 * Represents the neutral/default scenario position.
 * Phase 3: Will be replaced with true scenario preset system.
 */
export const BASE_UI_LEVERS: UiLeverState = {
  demandStrength: 50,
  pricingPower: 50,
  expansionVelocity: 50,

  costDiscipline: 50,
  hiringIntensity: 50,
  operatingDrag: 50,

  marketVolatility: 50,
  executionRisk: 50,
};

// ============================================================================
// ENGINE MAPPERS
// ============================================================================

export function mapUiToInputs(_ui: any): Inputs {
  // Phase 2: fixed baseline until we expose editable inputs.
  return DEFAULT_INPUTS;
}

export function mapUiToLevers(ui: UiLeverState): Levers {
  // Clamp after dividing to ensure values stay within 0-1
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v / 100));

  // UI slider values are 0-100, convert to 0-1 for engine
  return {
    demandStrength: clamp01(ui.demandStrength),
    pricingPower: clamp01(ui.pricingPower),
    expansionVelocity: clamp01(ui.expansionVelocity),

    costDiscipline: clamp01(ui.costDiscipline),
    hiringIntensity: clamp01(ui.hiringIntensity),
    operatingDrag: clamp01(ui.operatingDrag),

    marketVolatility: clamp01(ui.marketVolatility),
    executionRisk: clamp01(ui.executionRisk),
  };
}

export function outputsToKpiValues(o: Outputs): KpiValues {
  return {
    cashPosition: o.cashOnHand,
    runway: o.runwayMonths,
    burn: o.burnMonthly,
    margin: o.grossMarginPct, // 0..1 (format in UI)
    revenue: o.revenueAnnual,
    risk: o.riskScore, // 0..100
    valuation: o.valuation,
  };
}

// ============================================================================
// MAIN ENGINE RUNNER
// ============================================================================

export function runEngine(uiScenario: UiLeverState): {
  baseOutputs: Outputs;
  scenarioOutputs: Outputs;
  deltas: Delta[];
  kpis: KpiValues;
} {
  const inputs = mapUiToInputs(uiScenario);
  const levers = mapUiToLevers(uiScenario);

  const baseOutputs = calculateOutputs(inputs, DEFAULT_LEVERS);
  const scenarioOutputs = calculateOutputs(inputs, levers);
  const deltas = calculateDeltas(baseOutputs, scenarioOutputs);

  return {
    baseOutputs,
    scenarioOutputs,
    deltas,
    kpis: outputsToKpiValues(scenarioOutputs),
  };
}

// ---------------------------------------------------------------------------
// runEnginePair
// Accepts explicit base UI levers and active UI levers and returns pair outputs
// ---------------------------------------------------------------------------
export function runEnginePair(baseUi: any, activeUi: any) {
  const inputs = mapUiToInputs(activeUi);

  const baseLevers = mapUiToLevers(baseUi);
  const activeLevers = mapUiToLevers(activeUi);

  const baseOutputs = calculateOutputs(inputs, baseLevers);
  const scenarioOutputs = calculateOutputs(inputs, activeLevers);
  const deltas = calculateDeltas(baseOutputs, scenarioOutputs);

  return {
    baseOutputs,
    scenarioOutputs,
    deltas,
    kpis: outputsToKpiValues(scenarioOutputs),
  };
}
