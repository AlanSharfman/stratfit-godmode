// src/components/compound/variances2/shared.ts
import type { EngineResults } from "@/logic/engineResults";

export type VariancesMode = "overview" | "deepdive";

export type ScenarioKey = "base" | "upside" | "downside" | "stress";

export const SCENARIO_KEYS: ScenarioKey[] = ["base", "upside", "downside", "stress"];

export function titleForScenario(key: ScenarioKey): string {
  switch (key) {
    case "base": return "Base";
    case "upside": return "Upside";
    case "downside": return "Downside";
    case "stress": return "Stress";
    default: return key;
  }
}

// Safe formatter: never guess, show — when missing/invalid
export function fmtNumber(n: unknown, decimals = 0): string {
  if (n === null || n === undefined) return "—";
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

export function fmtMoney(n: unknown, decimals = 0): string {
  if (n === null || n === undefined) return "—";
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  return "$" + v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

export function fmtPct(n: unknown, decimals = 1): string {
  if (n === null || n === undefined) return "—";
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  return (v * 100).toFixed(decimals) + "%";
}

// Minimal metric extraction — NO math changes.
// We only read from EngineResults and show — if missing.
export type CompactMetricRow = {
  label: string;
  base: string;
  upside: string;
  downside: string;
  stress: string;
};

export function buildCompactMetricRows(
  byScenario: Partial<Record<string, EngineResults | undefined>>
): CompactMetricRow[] {
  const get = (key: ScenarioKey) => byScenario[key];

  // NOTE: These field names must match your EngineResults shape.
  // We will not guess if missing; we will display —.
  const base = get("base");
  const up = get("upside");
  const down = get("downside");
  const stress = get("stress");

  // Helper to safely read nested fields by path without crashing.
  const read = (obj: any, path: string): unknown => {
    try {
      return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
    } catch {
      return undefined;
    }
  };

  return [
    {
      label: "Valuation",
      base: fmtMoney(read(base, "valuation.value"), 0),
      upside: fmtMoney(read(up, "valuation.value"), 0),
      downside: fmtMoney(read(down, "valuation.value"), 0),
      stress: fmtMoney(read(stress, "valuation.value"), 0),
    },
    {
      label: "ARR",
      base: fmtMoney(read(base, "kpis.arr"), 0),
      upside: fmtMoney(read(up, "kpis.arr"), 0),
      downside: fmtMoney(read(down, "kpis.arr"), 0),
      stress: fmtMoney(read(stress, "kpis.arr"), 0),
    },
    {
      label: "Runway (months)",
      base: fmtNumber(read(base, "kpis.runwayMonths"), 1),
      upside: fmtNumber(read(up, "kpis.runwayMonths"), 1),
      downside: fmtNumber(read(down, "kpis.runwayMonths"), 1),
      stress: fmtNumber(read(stress, "kpis.runwayMonths"), 1),
    },
    {
      label: "Risk score",
      base: fmtNumber(read(base, "risk.score"), 0),
      upside: fmtNumber(read(up, "risk.score"), 0),
      downside: fmtNumber(read(down, "risk.score"), 0),
      stress: fmtNumber(read(stress, "risk.score"), 0),
    },
  ];
}
