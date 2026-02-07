import type { ScenarioId } from "@/state/scenarioStore";

export type StudioScenarioStatus = "draft" | "saved";

export type StudioScenarioTag = string;

export type LeverConfig = {
  cashOnHand: number; // $
  monthlyNetBurn: number; // $ (positive burn)
  currentARR: number; // $ annual recurring revenue
  monthlyGrowthRate: number; // 0..1 (e.g. 0.05 = 5%/mo)
  monthlyChurnRate: number; // 0..1
  netRevenueRetention: number; // 0..2 (e.g. 1.10 = 110%)
  headcount: number; // integer
  avgFullyLoadedCost: number; // $ annual
  salesMarketingSpendMonthly: number; // $
  rdSpendMonthly: number; // $
  operatingCostsMonthly: number; // $ (G&A)
};

export type DerivedMetrics = {
  runwayMonths: number | null;
  burnMultiple: number | null;
  revenuePerEmployee: number | null;
  operatingProfitApproxMonthly: number | null;
};

export type ConstraintSeverity = "info" | "warning" | "critical";

export type ConstraintItem = {
  id: string;
  severity: ConstraintSeverity;
  title: string;
  detail: string;
};

export type StudioScenarioModel = {
  id: ScenarioId; // we use existing app scenario IDs (base|upside|downside|stress)
  name: string;
  createdAtISO: string;
  updatedAtISO: string;
  tags: StudioScenarioTag[];
  notes?: string;
  status: StudioScenarioStatus;
  hasUnsavedChanges: boolean;
  leverConfig: LeverConfig;
  savedLeverConfig?: LeverConfig; // snapshot taken at last explicit save
  lastRunAtISO?: string;
};

export type StudioBaselineModel = {
  id: "base";
  name: string;
  leverConfig: LeverConfig;
};


