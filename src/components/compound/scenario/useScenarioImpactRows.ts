// src/components/compound/scenario/useScenarioImpactRows.ts
// Phase IG: Truth-lock — NO .display usage. Values derive from numeric .value only.


import { useMemo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";

// Phase IG: Truth-lock — NO .display usage. Values derive from numeric .value only.

import type { MetricRow } from "./ScenarioImpactPanel";

type ImpactRow = MetricRow;

function row(
  label: string,
  id: string,
  unit: string,
  fmt: (n: number) => string,
  higherIsBetter: boolean,
  format: "ratio" | "percent"
): ImpactRow {
  return {
    id,
    label,
    format: format === "percent" ? "percent" : unit === "$" ? "currency" : unit === "mo" ? "months" : "number",
    base: null,
    scenario: null,
    direction: higherIsBetter ? "higherIsBetter" : "lowerIsBetter",
  };
}

function fmtNumber(n: number, digits = 0) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${abs.toFixed(digits)}`;
}

function fmtMoney(n: number, digits = 0) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(digits)}`;
}

function fmtPct(n: number, digits = 0) {
  return `${n.toFixed(digits)}%`;
}

export function useScenarioImpactRows(engineResults: any, scenario: any) {
  return useMemo(() => {
    const rows: ImpactRow[] = [
      // "Momentum" is acting as your revenue proxy in the UI
      row("Momentum", "momentum", "", (n) => fmtNumber(n, 0), true, "ratio"),

      // ARR next 12 (money-ish)
      row("ARR (Next 12)", "arrNext12", "$", (n) => fmtMoney(n, 0), true, "ratio"),

      // Enterprise Value (money-ish)
      row("Enterprise Value", "enterpriseValue", "$", (n) => fmtMoney(n, 0), true, "ratio"),

      // Earnings Power / Margin (% points)
      row("Earnings Power", "earningsPower", "%", (n) => fmtPct(n, 0), true, "percent"),

      // Burn Quality (higher is better)
      row("Burn Quality", "burnQuality", "", (n) => fmtNumber(n, 0), true, "ratio"),

      // CAC (lower is better)
      row("CAC", "cac", "$", (n) => fmtMoney(n, 0), false, "ratio"),

      // CAC Payback (lower is better, months)
      row("CAC Payback", "cacPayback", "mo", (n) => fmtNumber(n, 1) + " mo", false, "ratio"),

      // LTV/CAC (higher is better)
      row("LTV / CAC", "ltvCac", "", (n) => fmtNumber(n, 1), true, "ratio"),

      // Safety CAC (if present; higher is better)
      row("Safe CAC", "safeCac", "", (n) => fmtNumber(n, 1), true, "ratio"),

      // Cash position (money)
      row("Cash", "cashPosition", "$", (n) => fmtMoney(n, 0), true, "ratio"),

      // Runway (months; higher is better)
      row("Runway", "runway", "mo", (n) => fmtNumber(n, 1) + " mo", true, "ratio"),

      // Risk index (lower is better if 0=good,100=bad; your engine uses riskIndex value)
      row("Risk Index", "riskIndex", "", (n) => fmtNumber(n, 0), false, "ratio"),
    ];
    return rows;
  }, [engineResults, scenario]);
}
