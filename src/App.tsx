// src/App.tsx
// STRATFIT — God Mode FINAL with all fixes

import { useState, useCallback, useMemo, useEffect } from "react";
import ScenarioHeroBar, { ScenarioId } from "./components/ScenarioHeroBar";
import KPIGrid from "./components/KPIGrid";
import KPIConnector from "./components/KPIConnector";
import ScenarioMountain from "./components/mountain/ScenarioMountain";
import { Moon } from "./components/Moon";
import { ControlDeck, ControlBoxConfig } from "./components/ControlDeck";
import AIInsights from "./components/AIInsights";
import { useScenarioStore } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";

// ============================================================================
// TYPES
// ============================================================================

interface LeverState {
  revenueGrowth: number;
  pricingAdjustment: number;
  marketingSpend: number;
  headcount: number;
  operatingExpenses: number;
  churnSensitivity: number;
  fundingInjection: number;
}

interface MetricState {
  mrr: number;
  grossProfit: number;
  cashBalance: number;
  burnRate: number;
  runwayMonths: number;
  cac: number;
  churnRate: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

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

// ============================================================================
// HELPERS
// ============================================================================

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

  return { mrr, grossProfit, cashBalance, burnRate, runwayMonths, cac, churnRate };
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

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [levers, setLevers] = useState<LeverState>(INITIAL_LEVERS);
  const [baselineMetrics, setBaselineMetrics] = useState<MetricState | null>(null);

  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const setDataPoints = useScenarioStore((s) => s.setDataPoints);
  const setScenarioInStore = useScenarioStore((s) => s.setScenario);
  const setKpiValues = useScenarioStore((s) => s.setKpiValues);

  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  const leverIntensity01 = useScenarioStore((s) => s.leverIntensity01);

  const metrics = useMemo(() => calculateMetrics(levers, scenario), [levers, scenario]);
  const dataPoints = useMemo(() => metricsToDataPoints(metrics), [metrics]);

  // Capture baseline on first render
  useEffect(() => {
    if (!baselineMetrics) {
      setBaselineMetrics(metrics);
    }
  }, []);

  useEffect(() => { setDataPoints(dataPoints); }, [dataPoints, setDataPoints]);
  useEffect(() => { setScenarioInStore(scenario); }, [scenario, setScenarioInStore]);

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
    setBaselineMetrics(calculateMetrics(INITIAL_LEVERS, scenario));
  }, [scenario, setHoveredKpiIndex]);

  const controlBoxes: ControlBoxConfig[] = useMemo(
    () => [
      {
        id: "performance",
        title: "Performance",
        sliders: [
          { id: "revenueGrowth", label: "Revenue Growth", value: levers.revenueGrowth, min: 0, max: 100, defaultValue: INITIAL_LEVERS.revenueGrowth, format: (v) => `${v}%` },
          { id: "pricingAdjustment", label: "Pricing Adjustment", value: levers.pricingAdjustment, min: -20, max: 50, defaultValue: INITIAL_LEVERS.pricingAdjustment, format: (v) => `${v}%` },
          { id: "marketingSpend", label: "Marketing Spend", value: levers.marketingSpend, min: 0, max: 200, defaultValue: INITIAL_LEVERS.marketingSpend, format: (v) => `$${v}k/mo` },
        ],
      },
      {
        id: "financial",
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
          { id: "fundingInjection", label: "Funding Injection", value: levers.fundingInjection, min: 0, max: 5, step: 0.1, defaultValue: INITIAL_LEVERS.fundingInjection, format: (v) => `$${v.toFixed(1)}M` },
        ],
      },
    ],
    [levers]
  );

  // AI Insights data
  const aiInsights = useMemo(() => ({
    commentary: [
      { text: `Strong MRR at ${formatCurrencyUSD(metrics.mrr)}/mo with ${((metrics.grossProfit / metrics.mrr) * 100).toFixed(0)}% gross margin` },
      { text: `Cash position healthy at ${formatCurrencyUSD(metrics.cashBalance)}` },
      { text: `Current trajectory supports ${Math.round(metrics.runwayMonths)} months runway` },
    ],
    risks: metrics.runwayMonths < 12 
      ? [
          { text: `Critical: Only ${Math.round(metrics.runwayMonths)} months runway` },
          { text: `Burn rate ${formatCurrencyUSD(metrics.burnRate)}/mo unsustainable` },
          { text: `Immediate cost reduction required` },
        ]
      : metrics.runwayMonths < 18
      ? [
          { text: `Runway at ${Math.round(metrics.runwayMonths)} months needs monitoring` },
          { text: `CAC efficiency declining at ${formatCurrencyUSD(metrics.cac)}` },
          { text: `Churn trending at ${metrics.churnRate.toFixed(1)}%` },
        ]
      : [
          { text: `Low risk profile with ${Math.round(metrics.runwayMonths)} months runway` },
          { text: `Monitor CAC efficiency (${formatCurrencyUSD(metrics.cac)})` },
          { text: `Churn stable at ${metrics.churnRate.toFixed(1)}%` },
        ],
    actions: [
      { text: `Reduce burn by 15% to extend runway to ${Math.round(metrics.runwayMonths * 1.15)} months` },
      { text: `Implement retention program to reduce churn below 4%` },
      { text: `Optimize CAC through channel diversification` },
      { text: `Review pricing strategy for margin improvement` },
    ],
  }), [metrics]);

  const aiMetrics = useMemo(() => {
    const base = baselineMetrics || metrics;
    const mrrChange = ((metrics.mrr - base.mrr) / base.mrr) * 100;
    const burnChange = ((metrics.burnRate - base.burnRate) / (base.burnRate || 1)) * 100;
    
    return {
      mrr: metrics.mrr,
      mrrChange: isFinite(mrrChange) ? mrrChange : 0,
      burn: metrics.burnRate,
      burnChange: isFinite(burnChange) ? burnChange : 0,
      runway: Math.round(metrics.runwayMonths),
      riskLevel: (metrics.runwayMonths < 12 ? "High" : metrics.runwayMonths < 18 ? "Med" : "Low") as "Low" | "Med" | "High",
    };
  }, [metrics, baselineMetrics]);

  return (
    <div className="app-container">
      {/* LOGO HEADER */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#22d3ee" />
              <path d="M2 17L12 22L22 17" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 12L12 17L22 12" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="logo-text">STRATFIT</span>
        </div>
        
        <div className="header-actions">
          <button className="header-btn" onClick={handleReset}>Reset</button>
          <button className="header-btn">Load</button>
          <button className="header-btn primary">Save</button>
        </div>
      </header>

      {/* HERO SCENARIO BAR */}
      <ScenarioHeroBar selected={scenario} onSelect={setScenario} />

      <main className="main-content">
        {/* KPI Section */}
        <section className="kpi-section">
          <KPIGrid />
        </section>

        {/* Mountain Section with Connector Overlay */}
        <section className="controls-mountain-section">
          <aside className="sliders-panel">
            <ControlDeck boxes={controlBoxes} onChange={handleLeverChange} />
          </aside>

          <div className="mountain-wrapper">
            {/* KPI Connector Line */}
            <KPIConnector />
            
            <div className="mountain-panel">
              <Moon rightOffset={10} topOffset={8} scale={1.2} />
              <ScenarioMountain
                scenario={scenario}
                dataPoints={dataPoints}
                activeKpiIndex={hoveredKpiIndex}
                activeLeverId={activeLeverId ?? null}
                leverIntensity01={leverIntensity01 ?? 0}
                className="mountain-canvas"
              />
            </div>
          </div>
        </section>

        {/* AI Insights */}
        <section className="ai-section">
          <AIInsights 
            insights={aiInsights}
            metrics={aiMetrics}
            onGeneratePDF={() => console.log("Generate PDF")} 
          />
        </section>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .app-container {
          width: 100vw;
          min-height: 100vh;
          max-width: 100%;
          overflow-x: hidden;
          background: linear-gradient(180deg, #0B1020 0%, #05060A 100%);
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .app-header {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: rgba(11, 14, 20, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(34, 211, 238, 0.1);
        }

        .logo-text {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #fff;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .header-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .header-btn.primary {
          background: rgba(34, 211, 238, 0.15);
          border-color: rgba(34, 211, 238, 0.3);
          color: #22d3ee;
        }

        .main-content {
          padding-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 1920px;
          margin: 0 auto;
        }

        .kpi-section {
          padding: 16px 24px 0;
        }

        .controls-mountain-section {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 20px;
          padding: 0 24px;
          min-height: 450px;
        }

        .sliders-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mountain-wrapper {
          position: relative;
        }

        .mountain-panel {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 420px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: radial-gradient(ellipse 900px 400px at 50% 60%, rgba(34,211,238,0.06), transparent 70%), #0B0E14;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .mountain-canvas {
          width: 100%;
          height: 100%;
        }

        .ai-section {
          padding: 0 24px;
        }

        @media (max-width: 1100px) {
          .controls-mountain-section {
            grid-template-columns: 1fr;
          }

          .sliders-panel {
            order: 2;
          }

          .mountain-wrapper {
            order: 1;
          }

          .mountain-panel {
            min-height: 350px;
          }
        }

        @media (max-width: 768px) {
          .main-content {
            gap: 12px;
          }

          .kpi-section,
          .controls-mountain-section,
          .ai-section {
            padding-left: 12px;
            padding-right: 12px;
          }

          .mountain-panel {
            min-height: 280px;
          }

          .app-header {
            padding: 10px 12px;
          }

          .logo-text {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
