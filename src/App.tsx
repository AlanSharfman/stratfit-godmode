// src/App.tsx
// STRATFIT — Decision Instrument
// AI Insights on right side, mountain shifted left

import { useState, useCallback, useMemo, useEffect } from "react";
import { ScenarioId } from "./components/ScenarioSlidePanel";
import KPIGrid from "./components/KPIGrid";
import ScenarioMountain from "./components/mountain/ScenarioMountain";
import { Moon } from "./components/Moon";
import { ControlDeck, ControlBoxConfig } from "./components/ControlDeck";
import AIIntelligence from "./components/AIIntelligence";
import { useScenarioStore } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface LeverState {
  revenueGrowth: number;
  pricingAdjustment: number;
  marketingSpend: number;
  headcount: number;
  operatingExpenses: number;
  churnSensitivity: number;
  fundingInjection: number;
  cashSensitivity: number;
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

const INITIAL_LEVERS: LeverState = {
  revenueGrowth: 45,
  pricingAdjustment: 10,
  marketingSpend: 60,
  headcount: 24,
  operatingExpenses: 55,
  churnSensitivity: 50,
  fundingInjection: 1.2,
  cashSensitivity: 50,
};

const SLIDER_TO_KPI: Record<keyof LeverState, number> = {
  revenueGrowth: 0,
  pricingAdjustment: 1,
  marketingSpend: 0,
  headcount: 4,
  operatingExpenses: 4,
  churnSensitivity: 6,
  fundingInjection: 3,
  cashSensitivity: 3,
};

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: "base", label: "Base Case" },
  { id: "upside", label: "Upside" },
  { id: "downside", label: "Downside" },
  { id: "extreme", label: "Extreme" },
];

// ============================================================================
// HELPERS
// ============================================================================

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function calculateMetrics(levers: LeverState, scenario: ScenarioId): MetricState {
  const mult = scenario === "upside" ? 1.18 : scenario === "downside" ? 0.86 : scenario === "extreme" ? 0.72 : 1;
  const growth01 = levers.revenueGrowth / 100;
  const priceAdj = levers.pricingAdjustment / 100;
  const mktSpend = levers.marketingSpend;
  const opex = levers.operatingExpenses;
  const head = levers.headcount;
  const churnSens01 = levers.churnSensitivity / 100;
  const fundingM = levers.fundingInjection;
  const cashSens01 = levers.cashSensitivity / 100;

  const mrrK = Math.max(20, 120 * (1 + 1.35 * growth01) * (1 + priceAdj) * (1 + (mktSpend / 200) * 0.55) * (1 - (0.08 + 0.14 * churnSens01))) * mult;
  const mrr = mrrK * 1000;
  const grossMargin = clamp01(0.78 - (opex / 150) * 0.18 - (head / 100) * 0.10) * (scenario === "upside" ? 1.03 : 1);
  const grossProfit = mrr * grossMargin;
  const burnRate = Math.max(0, opex * 1000 + (head / 100) * 100 * 9500 + 38000 * (scenario === "extreme" ? 1.15 : 1) - grossProfit);
  const cashBalance = Math.max(0.2, (2.2 + fundingM + (mktSpend / 200) * 0.6 + cashSens01 * 1.5) * mult) * 1_000_000;
  const runwayMonths = burnRate <= 1 ? 60 : Math.max(0, Math.min(60, cashBalance / burnRate));
  const newCust = Math.max(8, 40 + growth01 * 120) * (scenario === "upside" ? 1.15 : 1) * (scenario === "extreme" ? 0.85 : 1);
  const cac = Math.max(150, (mktSpend * 1000) / newCust);
  const churnRate = Math.max(0.5, Math.min(12, (1.8 + churnSens01 * 4.2 + Math.max(0, priceAdj) * 3.2) * (scenario === "extreme" ? 1.15 : 1)));

  return { mrr, grossProfit, cashBalance, burnRate, runwayMonths, cac, churnRate };
}

function metricsToDataPoints(m: MetricState): number[] {
  return [
    clamp01(m.mrr / 350000),
    clamp01(m.grossProfit / 260000),
    clamp01(m.runwayMonths / 36),
    clamp01(m.cashBalance / 7000000),
    clamp01(1 - m.burnRate / 420000),
    clamp01(1 - m.cac / 6000),
    clamp01(1 - m.churnRate / 10),
  ];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [levers, setLevers] = useState<LeverState>(INITIAL_LEVERS);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const setDataPoints = useScenarioStore((s) => s.setDataPoints);
  const setScenarioInStore = useScenarioStore((s) => s.setScenario);
  const setKpiValues = useScenarioStore((s) => s.setKpiValues);
  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  const leverIntensity01 = useScenarioStore((s) => s.leverIntensity01);

  const metrics = useMemo(() => calculateMetrics(levers, scenario), [levers, scenario]);
  const dataPoints = useMemo(() => metricsToDataPoints(metrics), [metrics]);

  useEffect(() => {
    setDataPoints(dataPoints);
  }, [dataPoints, setDataPoints]);

  useEffect(() => {
    setScenarioInStore(scenario);
  }, [scenario, setScenarioInStore]);

  useEffect(() => {
    setKpiValues({
      mrr: { value: metrics.mrr, display: `£${(metrics.mrr / 1000).toFixed(0)}k/mo` },
      grossProfit: { value: metrics.grossProfit, display: `£${(metrics.grossProfit / 1000).toFixed(0)}k` },
      cashBalance: { value: metrics.cashBalance, display: `£${(metrics.cashBalance / 1000000).toFixed(1)}M` },
      burnRate: { value: metrics.burnRate, display: `£${(metrics.burnRate / 1000).toFixed(0)}k/mo` },
      runway: { value: metrics.runwayMonths, display: `${Math.round(metrics.runwayMonths)} Months` },
      cac: { value: metrics.cac, display: `${((metrics.grossProfit / metrics.mrr) * 100).toFixed(0)}%` },
      churnRate: { value: metrics.churnRate, display: `${Math.round(15 - metrics.churnRate)}%` },
    });
  }, [metrics, setKpiValues]);

  const handleLeverChange = useCallback(
    (id: LeverId | "__end__", value: number) => {
      if (id === "__end__") {
        setHoveredKpiIndex(null);
        return;
      }
      setLevers((prev) => ({ ...prev, [id]: value }));
      const kpiIndex = SLIDER_TO_KPI[id as keyof LeverState];
      if (kpiIndex !== undefined) setHoveredKpiIndex(kpiIndex);
    },
    [setHoveredKpiIndex]
  );

  const controlBoxes: ControlBoxConfig[] = useMemo(
    () => [
      {
        id: "performance",
        title: "Performance",
        sliders: [
          { id: "revenueGrowth", label: "Market Share", value: levers.revenueGrowth, min: 0, max: 100, defaultValue: 45, format: (v) => `${v}%` },
          { id: "pricingAdjustment", label: "Growth Rate", value: levers.pricingAdjustment + 50, min: 0, max: 100, defaultValue: 60, format: (v) => `${v - 50}` },
        ],
      },
      {
        id: "financial",
        title: "Financial",
        sliders: [
          { id: "marketingSpend", label: "Growth Rate", value: levers.marketingSpend, min: 0, max: 200, defaultValue: 60, format: (v) => `${Math.round(v / 2)}%` },
          { id: "operatingExpenses", label: "COGS", value: levers.operatingExpenses, min: 10, max: 150, defaultValue: 55, format: (v) => `${Math.round(v / 15)}` },
          { id: "cashSensitivity", label: "Cash Sensitivity", value: levers.cashSensitivity, min: 0, max: 100, defaultValue: 50, format: (v) => `${v}%` },
        ],
      },
      {
        id: "people",
        title: "People",
        sliders: [
          { id: "headcount", label: "Headcount", value: levers.headcount, min: 5, max: 100, defaultValue: 24, format: (v) => `${v * 10}%` },
          { id: "churnSensitivity", label: "Churn Rate", value: levers.churnSensitivity, min: 0, max: 100, defaultValue: 50, format: (v) => `${Math.round(v / 10)}%` },
        ],
      },
    ],
    [levers]
  );

  const aiContent = useMemo(
    () => ({
      commentary: [
        `The see position forecast that medium-latent development for all business transformational is driven via all metrics established.`,
        `Primary schedule to be fit market test sector established themes several strategy for established set the partnered.`,
        `Mature market asset distribution rate active scenario model strategic particularly managed for established set the scope.`,
      ],
      risks: [],
      actions: [],
    }),
    []
  );

  const selectedScenario = SCENARIOS.find(s => s.id === scenario) || SCENARIOS[0];

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#22d3ee" />
            <path d="M2 17L12 22L22 17" stroke="#22d3ee" strokeWidth="2" />
            <path d="M2 12L12 17L22 12" stroke="#22d3ee" strokeWidth="2" />
          </svg>
          <span>STRATFIT</span>
        </div>
      </header>

      {/* TOP: KPI STRIP */}
      <section className="kpi-strip">
        <KPIGrid />
      </section>

      {/* MIDDLE SECTION - 3 column layout */}
      <div className="middle-section">
        {/* LEFT: Scenario + Sliders */}
        <aside className="left-panel">
          {/* Scenario Dropdown */}
          <div className="scenario-dropdown-container">
            <button 
              className="scenario-dropdown"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="dropdown-label">Scenario</span>
              <span className="dropdown-value">{selectedScenario.label}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                {SCENARIOS.map(s => (
                  <button 
                    key={s.id}
                    className={`dropdown-item ${s.id === scenario ? 'active' : ''}`}
                    onClick={() => { setScenario(s.id); setDropdownOpen(false); }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sliders */}
          <div className="sliders-container">
            <ControlDeck boxes={controlBoxes} onChange={handleLeverChange} />
          </div>
        </aside>

        {/* CENTER: Mountain (shifted left) */}
        <div className="center-panel">
          <div className="mountain-container">
            <div className="mountain-content">
              <Moon rightOffset={5} topOffset={4} scale={0.5} />
              <ScenarioMountain
                scenario={scenario}
                dataPoints={dataPoints}
                activeKpiIndex={hoveredKpiIndex}
                activeLeverId={activeLeverId ?? null}
                leverIntensity01={leverIntensity01 ?? 0}
              />
            </div>
          </div>
          
          {/* Action buttons below mountain */}
          <div className="action-row">
            <button className="action-btn">Save</button>
            <button className="action-btn">Load</button>
          </div>
        </div>

        {/* RIGHT: AI Intelligence Panel */}
        <aside className="right-panel">
          <AIIntelligence
            commentary={aiContent.commentary}
            risks={aiContent.risks}
            actions={aiContent.actions}
            scenario={scenario}
          />
        </aside>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .app {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #0d1117;
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* HEADER */
        .header {
          flex-shrink: 0;
          height: 44px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          background: #0d1117;
          border-bottom: 1px solid #21262d;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #fff;
        }

        /* KPI STRIP */
        .kpi-strip {
          flex-shrink: 0;
          padding: 12px 20px;
          border-bottom: 1px solid #21262d;
        }

        /* MIDDLE SECTION - 3 columns */
        .middle-section {
          flex: 1;
          display: grid;
          grid-template-columns: 200px 1fr 280px;
          gap: 16px;
          padding: 12px 20px;
          min-height: 0;
        }

        /* LEFT PANEL */
        .left-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: hidden;
        }

        /* Scenario Dropdown */
        .scenario-dropdown-container {
          position: relative;
          flex-shrink: 0;
        }

        .scenario-dropdown {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 6px;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .scenario-dropdown:hover {
          border-color: #484f58;
        }

        .dropdown-label {
          color: rgba(255, 255, 255, 0.5);
        }

        .dropdown-value {
          color: #22d3ee;
          font-weight: 600;
          margin-left: auto;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 6px;
          overflow: hidden;
          z-index: 100;
        }

        .dropdown-item {
          width: 100%;
          padding: 10px 14px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.1s;
        }

        .dropdown-item:hover {
          background: #21262d;
          color: #fff;
        }

        .dropdown-item.active {
          background: rgba(34, 211, 238, 0.1);
          color: #22d3ee;
        }

        .sliders-container {
          flex: 1;
          overflow-y: auto;
        }

        .sliders-container::-webkit-scrollbar {
          width: 3px;
        }

        .sliders-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        /* CENTER PANEL - Mountain shifted left */
        .center-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
          padding-right: 40px; /* Shift mountain left by adding right padding */
        }

        .mountain-container {
          flex: 1;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #0d1117;
          border: 1px solid #30363d;
        }

        .mountain-content {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .action-row {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .action-btn {
          padding: 8px 20px;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: #21262d;
          color: #fff;
          border-color: #484f58;
        }

        /* RIGHT PANEL - AI Intelligence */
        .right-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .middle-section {
            grid-template-columns: 180px 1fr 240px;
          }
          .center-panel {
            padding-right: 20px;
          }
        }

        @media (max-width: 1000px) {
          .middle-section {
            grid-template-columns: 180px 1fr;
          }
          .right-panel {
            display: none;
          }
          .center-panel {
            padding-right: 0;
          }
        }
      `}</style>
    </div>
  );
}
