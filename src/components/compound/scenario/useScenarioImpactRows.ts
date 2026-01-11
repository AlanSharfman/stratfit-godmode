import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import type { MetricRow } from "./ScenarioImpactPanel";
import type { ScenarioId } from "@/state/scenarioStore";

function kpiValue(engine: any, key: string): number | null {
  const v = engine?.kpis?.[key]?.value;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function kpiDisplay(engine: any, key: string): string | undefined {
  const d = engine?.kpis?.[key]?.display;
  return typeof d === "string" ? d : undefined;
}

// Map your engine KPI keys → the table rows you want.
// (These are the actual keys present in App.tsx engineResult)
export function useScenarioImpactRows(): MetricRow[] {
  const { scenario, engineResults } = useScenarioStore(
    useShallow((s) => ({
      scenario: s.scenario as ScenarioId,
      engineResults: s.engineResults,
    }))
  );

  const base = engineResults?.base;
  const selected = engineResults?.[scenario];

  return useMemo<MetricRow[]>(() => {
    // NOTE: your engine currently provides:
    // runway, cashPosition, momentum, arrCurrent, arrNext12,
    // burnQuality, riskIndex, earningsPower, enterpriseValue

    const rows: MetricRow[] = [
      {
        id: "revenue",
        label: "Revenue",
        format: "currency",
        // Using "momentum" as the revenue proxy (it's your $X.XM top-line style KPI)
        base: kpiValue(base, "momentum"),
        scenario: kpiValue(selected, "momentum"),
        commentary: undefined,
      },
      {
        id: "arr",
        label: "ARR",
        format: "currency",
        // Prefer arrNext12 as "Projection ARR"
        base: kpiValue(base, "arrNext12"),
        scenario: kpiValue(selected, "arrNext12"),
        commentary: undefined,
      },
      {
        id: "valuation",
        label: "Valuation",
        format: "currency",
        base: kpiValue(base, "enterpriseValue"),
        scenario: kpiValue(selected, "enterpriseValue"),
        commentary: undefined,
      },
      {
        id: "grossMargin",
        label: "Gross Margin",
        format: "percent",
        // earningsPower is % in your engine (closest match to GM-style %)
        base: kpiValue(base, "earningsPower"),
        scenario: kpiValue(selected, "earningsPower"),
        commentary: undefined,
      },
      {
        id: "burnRate",
        label: "Burn Rate",
        format: "currency",
        direction: "lowerIsBetter",
        // burnQuality is numeric in your engine; used here as burn-rate proxy
        base: kpiValue(base, "burnQuality"),
        scenario: kpiValue(selected, "burnQuality"),
        commentary: undefined,
      },
      {
        id: "cac",
        label: "Customer Acquisition Cost",
        format: "currency",
        direction: "lowerIsBetter",
        base: kpiValue(base, "cac"),
        scenario: kpiValue(selected, "cac"),
        commentary: undefined,
      },
      {
        id: "cacPayback",
        label: "CAC Payback",
        format: "months",
        direction: "lowerIsBetter",
        base: kpiValue(base, "cacPayback"),
        scenario: kpiValue(selected, "cacPayback"),
        commentary: undefined,
      },
      {
        id: "ltvCac",
        label: "LTV / CAC",
        format: "number",
        direction: "higherIsBetter",
        base: kpiValue(base, "ltvCac"),
        scenario: kpiValue(selected, "ltvCac"),
        commentary: undefined,
      },
      {
        id: "safeCac",
        label: "Max Sustainable CAC",
        format: "currency",
        direction: "lowerIsBetter",
        base: kpiValue(base, "safeCac"),
        scenario: kpiValue(selected, "safeCac"),
        commentary: undefined,
      },
      {
        id: "cashBalance",
        label: "Cash Balance",
        format: "currency",
        base: kpiValue(base, "cashPosition"),
        scenario: kpiValue(selected, "cashPosition"),
        commentary: undefined,
      },
      {
        id: "runway",
        label: "Runway",
        format: "months",
        base: kpiValue(base, "runway"),
        scenario: kpiValue(selected, "runway"),
        commentary: undefined,
      },
      {
        id: "riskScore",
        label: "Risk Score",
        format: "score",
        direction: "lowerIsBetter",
        base: kpiValue(base, "riskIndex"),
        scenario: kpiValue(selected, "riskIndex"),
        commentary: undefined,
      },
    ];

    return rows;
  }, [base, selected]);
}
