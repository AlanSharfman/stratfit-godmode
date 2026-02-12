// src/logic/metricsModel.ts
import type {
    ScenarioId,
    MetricId,
    LeverId,
    LeverDefinition,
    MetricDefinition,
  } from "@/dashboardConfig";
  import { METRICS, LEVERS } from "@/dashboardConfig";
  
  // ---- State shapes ----
  export type MetricState = Record<MetricId, number>;
  export type LeverState = Record<LeverId, number>;
  
  // ---- Baseline metrics (simple, realistic-ish starting point) ----
  export const BASELINE_METRICS: MetricState = {
    runway: 12,  // months
    cash: 2,     // $m
    growth: 20,  // %
    ebitda: 5,   // %
    burn: 200,   // $k/month
    risk: 50,    // /100
    value: 10,   // $m
  };
  
  // Scenario multipliers – how each scenario bends the world
  const SCENARIO_FACTORS: Record<
    ScenarioId,
    {
      growth: number;
      runway: number;
      burn: number;
      risk: number;
      value: number;
    }
  > = {
    base: {
      growth: 1,
      runway: 1,
      burn: 1,
      risk: 1,
      value: 1,
    },
    upside: {
      growth: 1.3,
      runway: 1.2,
      burn: 0.85,
      risk: 0.7,
      value: 1.5,
    },
    downside: {
      growth: 0.7,
      runway: 0.8,
      burn: 1.2,
      risk: 1.3,
      value: 0.8,
    },
    stress: {
      growth: 0.4,
      runway: 0.5,
      burn: 1.5,
      risk: 1.7,
      value: 0.5,
    },
  };
  
  // ---- Helpers to initialise state ----
  
  export function getInitialLeverState(): LeverState {
    const state: Partial<LeverState> = {};
    LEVERS.forEach((lever: LeverDefinition) => {
      state[lever.id] = lever.defaultValue;
    });
    return state as LeverState;
  }
  
  export function getInitialMetricState(
    scenario: ScenarioId = "base",
    levers: LeverState = getInitialLeverState()
  ): MetricState {
    return calculateMetrics(BASELINE_METRICS, levers, scenario);
  }
  
  // ---- Core calculation engine ----
  
  export function calculateMetrics(
    baseline: MetricState,
    levers: LeverState,
    scenario: ScenarioId
  ): MetricState {
    const f = SCENARIO_FACTORS[scenario];
  
    // Normalise lever values into deltas
    const growthDelta = levers.revenueGrowth / 100;       // -0.2 .. 0.8
    const opexDelta = levers.operatingExpenses / 100;     // -0.4 .. 0.4
    const hiringDelta = levers.hiringRate / 100;          // 0 .. 0.5
    const wageDelta = levers.wageIncrease / 100;          // 0 .. 0.15
    const burnDelta = levers.burnRate / 100;              // -0.5 .. 0.5
  
    // Growth reacts strongly to revenueGrowth, a bit to hiring
    const growth =
      baseline.growth *
      (1 + 1.0 * growthDelta + 0.3 * hiringDelta) *
      f.growth;
  
    // Burn reacts to opex, wage, burn levers
    const burnFactor = 1 + 0.6 * opexDelta + 0.5 * wageDelta + 0.9 * burnDelta;
    const burn = baseline.burn * burnFactor * f.burn;
  
    // Cash is roughly value / 5 plus some effect from burn + growth
    const cash =
      baseline.cash *
      (1 + 0.3 * growthDelta - 0.4 * burnDelta - 0.3 * opexDelta);
  
    // Runway = (cash / burn) scaled back to months, then scenario-adjusted
    const rawRunway = (cash * 1000) / Math.max(burn, 50); // avoid div by zero
    const runway = rawRunway * f.runway;
  
    // EBITDA margin improves with growth and controlled opex, worsens with wages
    const ebitda =
      baseline.ebitda +
      15 * growthDelta -
      10 * opexDelta -
      8 * wageDelta;
  
    // Risk increases with burn & opex, decreases with runway & growth
    const risk =
      baseline.risk +
      40 * burnDelta +
      25 * opexDelta -
      30 * growthDelta -
      0.8 * runway;
  
    // Value reacts to growth, runway, risk
    const value =
      baseline.value *
      (1 + 1.5 * growthDelta + 0.3 * runway / 24 - 0.01 * risk) *
      f.value;
  
    // Clamp everything into sane ranges
    const clamp = (v: number, min: number, max: number) =>
      Math.min(max, Math.max(min, v));
  
    return {
      runway: clamp(runway, 0, 36),
      cash: clamp(cash, 0, 10),
      growth: clamp(growth, -20, 80),
      ebitda: clamp(ebitda, -20, 40),
      burn: clamp(burn, 0, 400),
      risk: clamp(risk, 0, 100),
      value: clamp(value, 0, 50),
    };
  }
  
  // ---- Mapping metrics → 0–100 for the mountain engine ----
  
  const METRIC_RANGES: Record<
    MetricId,
    { min: number; max: number }
  > = {
    runway: { min: 0, max: 36 }, // months
    cash: { min: 0, max: 10 },   // $m
    growth: { min: -20, max: 80 },
    ebitda: { min: -20, max: 40 },
    burn: { min: 0, max: 400 },  // $k/m
    risk: { min: 0, max: 100 },
    value: { min: 0, max: 50 },  // $m
  };
  
  function normaliseTo100(metricId: MetricId, value: number): number {
    const range = METRIC_RANGES[metricId];
    const clamped = Math.min(range.max, Math.max(range.min, value));
    const span = range.max - range.min || 1;
    return ((clamped - range.min) / span) * 100;
  }
  
  export function metricsToDataPoints(metrics: MetricState): number[] {
    return METRICS.map((metric: MetricDefinition) =>
      normaliseTo100(metric.id, metrics[metric.id])
    );
  }
  