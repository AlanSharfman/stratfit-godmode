// src/App.tsx
import { useState, useCallback, useMemo, useEffect } from "react";
import CommandBar, { ScenarioId } from "./components/CommandBar";
import KPIGrid from "./components/KPIGrid";
import ScenarioMountain from "./components/mountain/ScenarioMountain";
import { Moon } from "./components/Moon";
import { ControlDeck, ControlBoxConfig, ControlDeckStyles } from "./components/ControlDeck";
import AIInsights from "./components/AIInsights";
import { useScenarioStore } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";

interface LeverState {
  revenueGrowth: number;        // 0–100 (%)
  pricingAdjustment: number;    // -20..+50 (%)
  marketingSpend: number;       // 0–200 ($k/month)
  headcount: number;            // 5–100 (FTE)
  operatingExpenses: number;    // 10–150 ($k/month)
  churnSensitivity: number;     // 0–100 (Low/Med/High)
  fundingInjection: number;     // 0–5 ($M)
}

interface MetricState {
  mrr: number;           // $/month
  grossProfit: number;   // $/month
  cashBalance: number;   // $
  burnRate: number;      // $/month
  runwayMonths: number;  // months
  cac: number;           // $ per customer
  churnRate: number;     // % monthly
}

const SCENARIOS = [
  { id: "base" as ScenarioId, label: "Base Case 2025", color: "#22d3ee" },   // cyan
  { id: "upside" as ScenarioId, label: "Upside 2025", color: "#34d399" },    // emerald
  { id: "downside" as ScenarioId, label: "Downside 2025", color: "#fb7185" },// rose (NO yellow)
  { id: "extreme" as ScenarioId, label: "Extreme Risk", color: "#ef4444" },  // red
];

const INITIAL_LEVERS: LeverState = {
  revenueGrowth: 45,
  pricingAdjustment: 10,
  marketingSpend: 60,
  headcount: 24,
  operatingExpenses: 55,
  churnSensitivity: 50,
  fundingInjection: 1.2,
};

const SLIDER_TO_KPI: Record<keyof LeverState, number> = {
  revenueGrowth: 0,
  pricingAdjustment: 0,
  marketingSpend: 5,
  headcount: 3,
  operatingExpenses: 3,
  churnSensitivity: 6,
  fundingInjection: 2,
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function calculateMetrics(levers: LeverState, scenario: ScenarioId): MetricState {
  const mult =
    scenario === "upside" ? 1.18 :
    scenario === "downside" ? 0.86 :
    scenario === "extreme" ? 0.72 : 1;

  const growth01 = levers.revenueGrowth / 100;
  const priceAdj = levers.pricingAdjustment / 100;
  const mktSpend = levers.marketingSpend;
  const opex = levers.operatingExpenses;
  const head = levers.headcount;
  const churnSens01 = levers.churnSensitivity / 100;
  const fundingM = levers.fundingInjection;

  const baseMrrK = 120;
  const growthLift = 1 + 1.35 * growth01;
  const priceLift = 1 + priceAdj;
  const marketingLift = 1 + (mktSpend / 200) * 0.55;
  const churnPenalty = 1 - (0.08 + 0.14 * churnSens01);

  const mrrK = Math.max(20, baseMrrK * growthLift * priceLift * marketingLift * churnPenalty) * mult;
  const mrr = mrrK * 1000;

  const grossMargin = clamp01(0.78 - (opex / 150) * 0.18 - (head / 100) * 0.10) * (scenario === "upside" ? 1.03 : 1);
  const grossProfit = mrr * grossMargin;

  const headCostK = 9.5;
  const peopleCost = (head / 100) * 100 * headCostK * 1000;
  const opexCost = opex * 1000;
  const fixedInfra = 38_000 * (scenario === "extreme" ? 1.15 : 1);
  const burnRate = Math.max(0, opexCost + peopleCost + fixedInfra - grossProfit);

  const baseCashM = 2.2;
  const cashBalance = Math.max(0.2, (baseCashM + fundingM + (mktSpend / 200) * 0.6) * mult) * 1_000_000;

  const runwayMonths = burnRate <= 1 ? 60 : Math.max(0, Math.min(60, cashBalance / burnRate));

  const newCust = Math.max(8, 40 + growth01 * 120) * (scenario === "upside" ? 1.15 : 1) * (scenario === "extreme" ? 0.85 : 1);
  const cac = Math.max(150, (mktSpend * 1000) / newCust);

  const churnBase = 1.8 + churnSens01 * 4.2 + Math.max(0, priceAdj) * 3.2;
  const churnRate = Math.max(0.5, Math.min(12, churnBase * (scenario === "extreme" ? 1.15 : 1)));

  return {
    mrr,
    grossProfit,
    cashBalance,
    burnRate,
    runwayMonths,
    cac,
    churnRate,
  };
}

function metricsToDataPoints(metrics: MetricState): number[] {
  const mrr01 = clamp01(metrics.mrr / 350_000);
  const gp01 = clamp01(metrics.grossProfit / 260_000);
  const cash01 = clamp01(metrics.cashBalance / 7_000_000);

  const burn01 = clamp01(1 - metrics.burnRate / 420_000);
  const runway01 = clamp01(metrics.runwayMonths / 36);
  const cac01 = clamp01(1 - metrics.cac / 6_000);
  const churn01 = clamp01(1 - metrics.churnRate / 10);

  return [mrr01, gp01, cash01, burn01, runway01, cac01, churn01];
}

function formatCurrencyUSD(n: number, opts?: { compact?: boolean }) {
  const compact = opts?.compact ?? true;
  if (!Number.isFinite(n)) return "—";
  if (!compact) return `$${Math.round(n).toLocaleString("en-US")}`;

  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}
function formatPct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [levers, setLevers] = useState<LeverState>(INITIAL_LEVERS);

  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const setDataPoints = useScenarioStore((s) => s.setDataPoints);
  const setScenarioInStore = useScenarioStore((s) => s.setScenario);
  const setKpiValues = useScenarioStore((s) => s.setKpiValues);

  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  const leverIntensity01 = useScenarioStore((s) => s.leverIntensity01);

  const metrics = useMemo(() => calculateMetrics(levers, scenario), [levers, scenario]);
  const baselinePoints = useMemo(() => metricsToDataPoints(metrics), [metrics]);

  useEffect(() => {
    setDataPoints(baselinePoints);
  }, [baselinePoints, setDataPoints]);

  useEffect(() => {
    setScenarioInStore(scenario);
  }, [scenario, setScenarioInStore]);

  useEffect(() => {
    setKpiValues({
      mrr: { value: metrics.mrr, display: formatCurrencyUSD(metrics.mrr) + "/mo" },
      grossProfit: { value: metrics.grossProfit, display: formatCurrencyUSD(metrics.grossProfit) + "/mo" },
      cashBalance: { value: metrics.cashBalance, display: formatCurrencyUSD(metrics.cashBalance) },
      burnRate: { value: metrics.burnRate, display: formatCurrencyUSD(metrics.burnRate) + "/mo" },
      runway: { value: metrics.runwayMonths, display: `${Math.round(metrics.runwayMonths)} mo` },
      cac: { value: metrics.cac, display: formatCurrencyUSD(metrics.cac, { compact: false }) },
      churnRate: { value: metrics.churnRate, display: formatPct(metrics.churnRate) },
    });
  }, [metrics, setKpiValues]);

  const handleLeverChange = useCallback(
    (id: LeverId | "__end__", value: number) => {
      if (id === "__end__") {
        setHoveredKpiIndex(null);
        return;
      }

      setLevers((prev) => ({ ...prev, [id]: value }));

      const key = id as keyof LeverState;
      const kpiIndex = SLIDER_TO_KPI[key];
      if (kpiIndex !== undefined) setHoveredKpiIndex(kpiIndex);
    },
    [setHoveredKpiIndex]
  );

  const handleReset = useCallback(() => {
    setLevers(INITIAL_LEVERS);
    setHoveredKpiIndex(null);
  }, [setHoveredKpiIndex]);

  const controlBoxes: ControlBoxConfig[] = useMemo(
    () => [
      {
        id: "growth",
        title: "Performance",
        sliders: [
          { id: "revenueGrowth", label: "Revenue Growth", value: levers.revenueGrowth, min: 0, max: 100, defaultValue: INITIAL_LEVERS.revenueGrowth, format: (v) => `${v}%` },
          { id: "pricingAdjustment", label: "Pricing Adjustment", value: levers.pricingAdjustment, min: -20, max: 50, defaultValue: INITIAL_LEVERS.pricingAdjustment, format: (v) => `${v}%` },
          { id: "marketingSpend", label: "Marketing Spend", value: levers.marketingSpend, min: 0, max: 200, defaultValue: INITIAL_LEVERS.marketingSpend, format: (v) => `$${v}k/mo` },
        ],
      },
      {
        id: "cost",
        title: "Financial",
        sliders: [
          { id: "headcount", label: "Headcount", value: levers.headcount, min: 5, max: 100, defaultValue: INITIAL_LEVERS.headcount, format: (v) => `${v} FTE` },
          { id: "operatingExpenses", label: "Operating Expenses", value: levers.operatingExpenses, min: 10, max: 150, defaultValue: INITIAL_LEVERS.operatingExpenses, format: (v) => `$${v}k/mo` },
        ],
      },
      {
        id: "risk",
        title: "People & Risk",
        sliders: [
          { id: "churnSensitivity", label: "Churn Sensitivity", value: levers.churnSensitivity, min: 0, max: 100, defaultValue: INITIAL_LEVERS.churnSensitivity, format: (v) => (v < 33 ? "Low" : v < 66 ? "Med" : "High") },
          { id: "fundingInjection", label: "Funding Injection", value: levers.fundingInjection, min: 0, max: 5, defaultValue: INITIAL_LEVERS.fundingInjection, format: (v) => `$${v.toFixed(1)}M` },
        ],
      },
    ],
    [levers]
  );

  const aiInsights = useMemo(
    () => ({
      highlights: `Base SaaS view: ${formatCurrencyUSD(metrics.mrr)}/mo MRR, ${Math.round(metrics.runwayMonths)} months runway, churn ${metrics.churnRate.toFixed(1)}%.`,
      risks: metrics.runwayMonths < 12 ? `Runway is tight (${Math.round(metrics.runwayMonths)} months).` : `Runway is stable (${Math.round(metrics.runwayMonths)} months).`,
      recommendations: `1) Improve churn & CAC efficiency. 2) Reduce burn or raise capital. 3) Stress-test pricing and opex.`,
    }),
    [metrics]
  );

  const aiBadges = useMemo(
    () => [
      { label: "MRR", value: formatCurrencyUSD(metrics.mrr), color: "#22d3ee" },
      { label: "Burn", value: formatCurrencyUSD(metrics.burnRate), color: "#fb7185" },
      { label: "Risk", value: metrics.runwayMonths < 12 ? "High" : metrics.runwayMonths < 18 ? "Med" : "Low", color: metrics.runwayMonths < 12 ? "#ef4444" : metrics.runwayMonths < 18 ? "#fb7185" : "#34d399" },
    ],
    [metrics]
  );

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0B1020 0%, #05060A 55%)",
        color: "#fff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        paddingTop: 80,
      }}
    >
      <CommandBar
        scenario={scenario}
        scenarios={SCENARIOS}
        onScenarioChange={setScenario}
        onSave={() => console.log("Save scenario")}
        onLoad={() => console.log("Load scenario")}
        onReset={handleReset}
      />

      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        <KPIGrid />

        <div
          style={{
            position: "relative",
            height: 450,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 25px 70px rgba(0,0,0,0.55)",
            background: "radial-gradient(1200px 500px at 30% 30%, rgba(34,211,238,0.12), transparent 60%)",
          }}
        >
          <Moon rightOffset={10} topOffset={8} scale={1.2} />

          <ScenarioMountain
            scenario={scenario}
            dataPoints={baselinePoints}
            activeKpiIndex={hoveredKpiIndex}
            activeLeverId={activeLeverId ?? null}
            leverIntensity01={leverIntensity01 ?? 0}
            className=""
          />
        </div>

        <ControlDeck boxes={controlBoxes} onChange={handleLeverChange} />

        <AIInsights insights={aiInsights} badges={aiBadges} onGeneratePDF={() => console.log("Generate PDF")} />
      </div>

      <style>{ControlDeckStyles}</style>
    </div>
  );
}
