import type { ConstraintItem, DerivedMetrics, LeverConfig } from "./types";

function n(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

export function computeDerivedMetrics(levers: LeverConfig): DerivedMetrics {
  const cash = Math.max(0, n(levers.cashOnHand, 0));
  const burn = Math.max(0, n(levers.monthlyNetBurn, 0));
  const arr = Math.max(0, n(levers.currentARR, 0));
  const headcount = Math.max(0, Math.round(n(levers.headcount, 0)));

  const runwayMonths = burn > 0 ? cash / burn : null;
  const burnMultiple = arr > 0 ? burn / (arr / 12) : null;
  const revenuePerEmployee = headcount > 0 ? arr / headcount : null;

  const headcountCostMonthly = headcount > 0 ? (n(levers.avgFullyLoadedCost, 0) / 12) * headcount : 0;
  const operatingCostMonthly =
    Math.max(0, n(levers.salesMarketingSpendMonthly, 0)) +
    Math.max(0, n(levers.rdSpendMonthly, 0)) +
    Math.max(0, n(levers.operatingCostsMonthly, 0)) +
    headcountCostMonthly;

  const operatingProfitApproxMonthly = arr / 12 - operatingCostMonthly;

  return {
    runwayMonths: runwayMonths != null && Number.isFinite(runwayMonths) ? runwayMonths : null,
    burnMultiple: burnMultiple != null && Number.isFinite(burnMultiple) ? burnMultiple : null,
    revenuePerEmployee: revenuePerEmployee != null && Number.isFinite(revenuePerEmployee) ? revenuePerEmployee : null,
    operatingProfitApproxMonthly:
      Number.isFinite(operatingProfitApproxMonthly) ? operatingProfitApproxMonthly : null,
  };
}

export function computeConstraints(args: {
  baseline: LeverConfig;
  scenario: LeverConfig;
}): ConstraintItem[] {
  const { baseline, scenario } = args;
  const out: ConstraintItem[] = [];

  const churn = clamp(n(scenario.monthlyChurnRate, 0), 0, 1);
  if (churn >= 0.08) {
    out.push({
      id: "churn_high",
      severity: churn >= 0.12 ? "critical" : "warning",
      title: "Churn is elevated",
      detail: `Monthly churn is ${(churn * 100).toFixed(1)}%. Retention risk may dominate growth levers.`,
    });
  }

  const burn = Math.max(0, n(scenario.monthlyNetBurn, 0));
  const cash = Math.max(0, n(scenario.cashOnHand, 0));
  const runway = burn > 0 ? cash / burn : Infinity;
  if (burn > 0 && runway < 6) {
    out.push({
      id: "runway_short",
      severity: runway < 3 ? "critical" : "warning",
      title: "Runway is short",
      detail: `Estimated runway is ${Math.max(0, runway).toFixed(runway < 10 ? 1 : 0)} months.`,
    });
  }

  const growth = clamp(n(scenario.monthlyGrowthRate, 0), 0, 1);
  if (growth >= 0.25) {
    out.push({
      id: "growth_unrealistic",
      severity: growth >= 0.4 ? "critical" : "warning",
      title: "Growth assumption may be aggressive",
      detail: `Monthly growth is ${(growth * 100).toFixed(0)}%. Ensure this is supported by pipeline and retention.`,
    });
  }

  const headcount = Math.max(0, Math.round(n(scenario.headcount, 0)));
  const baselineHeadcount = Math.max(0, Math.round(n(baseline.headcount, 0)));
  if (baselineHeadcount > 0 && headcount >= baselineHeadcount * 1.8) {
    out.push({
      id: "headcount_spike",
      severity: headcount >= baselineHeadcount * 2.5 ? "critical" : "warning",
      title: "Headcount increase is large vs baseline",
      detail: `Headcount is ${headcount} vs baseline ${baselineHeadcount}. Cost load may outpace ARR.`,
    });
  }

  // Informational guardrail: spend breakdown does not reconcile with net burn
  const headcountCostMonthly = headcount > 0 ? (n(scenario.avgFullyLoadedCost, 0) / 12) * headcount : 0;
  const componentSpend =
    Math.max(0, n(scenario.salesMarketingSpendMonthly, 0)) +
    Math.max(0, n(scenario.rdSpendMonthly, 0)) +
    Math.max(0, n(scenario.operatingCostsMonthly, 0)) +
    headcountCostMonthly;
  if (burn > 0 && componentSpend > burn * 1.15) {
    out.push({
      id: "burn_mismatch",
      severity: "info",
      title: "Spend components exceed net burn",
      detail: "Your cost breakdown sums above Monthly Net Burn. This can be fine (e.g., offsets, timing), but double-check inputs.",
    });
  }

  return out;
}


