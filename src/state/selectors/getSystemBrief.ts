import { EngineResult } from "@/state/scenarioStore";
import { getVariances } from "./getVariances";
import { SYSTEM_THRESHOLDS } from "@/config/systemThresholds";

export type SystemBrief = {
  headline: string;
  status: "safe" | "caution" | "critical";
  facts: string[];
  flags: string[];
  metrics: {
    marginOfSafetyMonths: number | null;
    netImprovedCount: number;
  };
};

export function getSystemBrief(
  active: EngineResult,
  base: EngineResult
): SystemBrief {
  const variances = getVariances(active, base);

  const runway = active.kpis.runway?.value ?? null;
  const risk = active.kpis.riskIndex?.value ?? null;

  let status: "safe" | "caution" | "critical" = "safe";

  if (
    runway !== null &&
    runway < SYSTEM_THRESHOLDS.marginOfSafety.caution
  ) {
    status = "critical";
  } else if (
    runway !== null &&
    runway < SYSTEM_THRESHOLDS.marginOfSafety.safe
  ) {
    status = "caution";
  }

  const improvedCount = variances.filter((v) => v.improved).length;

  const facts: string[] = [
    runway !== null
      ? `Margin of safety is ${Math.round(runway)} months`
      : "Margin of safety unavailable",
    `${improvedCount} of ${variances.length} KPIs improved vs baseline`,
  ];

  const flags: string[] = [];

  if (risk !== null && risk > SYSTEM_THRESHOLDS.riskIndex.critical) {
    flags.push("Risk index is in critical territory");
  } else if (risk !== null && risk > SYSTEM_THRESHOLDS.riskIndex.caution) {
    flags.push("Risk index elevated");
  }

  const headline =
    status === "safe"
      ? "System stable"
      : status === "caution"
      ? "System under watch"
      : "System at risk";

  return {
    headline,
    status,
    facts,
    flags,
    metrics: {
      marginOfSafetyMonths: runway,
      netImprovedCount: improvedCount,
    },
  };
}
