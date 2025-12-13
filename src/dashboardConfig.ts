// src/config/dashboardConfig.ts

// ---- Core IDs ----
export type ScenarioId = "base" | "upside" | "downside" | "extreme";

export type MetricId =
  | "runway"
  | "cash"
  | "growth"
  | "ebitda"
  | "burn"
  | "risk"
  | "value";

export type LeverId =
  | "revenueGrowth"
  | "operatingExpenses"
  | "hiringRate"
  | "wageIncrease"
  | "burnRate";

// ---- Definitions ----
export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  color: string;
}

export interface MetricDefinition {
  id: MetricId;
  label: string;
  unit?: string;
}

export interface LeverDefinition {
  id: LeverId;
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  step?: number;
}

// ---- Scenario list (single source of truth) ----
export const SCENARIOS: readonly ScenarioDefinition[] = [
  { id: "base", label: "Base Case", color: "#5eead4" },
  { id: "upside", label: "Upside", color: "#4ade80" },
  { id: "downside", label: "Downside", color: "#fbbf24" },
  { id: "extreme", label: "Extreme", color: "#f87171" },
] as const;

// ---- Metrics (initial finance set) ----
export const METRICS: readonly MetricDefinition[] = [
  { id: "runway", label: "Runway", unit: "months" },
  { id: "cash", label: "Cash", unit: "$m" },
  { id: "growth", label: "Growth", unit: "%" },
  { id: "ebitda", label: "EBITDA", unit: "%" },
  { id: "burn", label: "Burn", unit: "$k/m" },
  { id: "risk", label: "Risk", unit: "/100" },
  { id: "value", label: "Value", unit: "$m" },
] as const;

// ---- Levers (what the sliders will become) ----
export const LEVERS: readonly LeverDefinition[] = [
  {
    id: "revenueGrowth",
    label: "Revenue Growth",
    min: -20,
    max: 80,
    defaultValue: 20,
    step: 1,
  },
  {
    id: "operatingExpenses",
    label: "Operating Expenses",
    min: -40,
    max: 40,
    defaultValue: 0,
    step: 1,
  },
  {
    id: "hiringRate",
    label: "Hiring Rate",
    min: 0,
    max: 50,
    defaultValue: 10,
    step: 1,
  },
  {
    id: "wageIncrease",
    label: "Wage Increase",
    min: 0,
    max: 15,
    defaultValue: 4,
    step: 0.5,
  },
  {
    id: "burnRate",
    label: "Burn Rate",
    min: -50,
    max: 50,
    defaultValue: 0,
    step: 1,
  },
] as const;

