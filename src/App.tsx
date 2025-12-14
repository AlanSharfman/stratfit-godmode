// src/App.tsx
// STRATFIT — Decision Instrument
// Layout: TOP KPI Strip → CENTER Mountain Hero → BOTTOM Sliders
// Scenario selector auto-slides after 3s, leaves handle

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import ScenarioSlidePanel, { ScenarioId } from "./components/ScenarioSlidePanel";
import KPIGrid from "./components/KPIGrid";
import ScenarioMountain from "./components/mountain/ScenarioMountain";
import { Moon } from "./components/Moon";
import { ControlDeck, ControlBoxConfig } from "./components/ControlDeck";
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
}

interface MetricState {
  mrr: number;
  grossProfit: number;
  cashBalance: number;
  burnRate: number;
  runwayMonths: number;
  cac: number;
  churnRate: number;
  ltv: number;
  ltvCacRatio: number;
  nrr: number;
}

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

  const mrrK = Math.max(20, 120 * (1 + 1.35 * growth01) * (1 + priceAdj) * (1 + (mktSpend / 200) * 0.55) * (1 - (0.08 + 0.14 * churnSens01))) * mult;
  const mrr = mrrK * 1000;
  const grossMargin = clamp01(0.78 - (opex / 150) * 0.18 - (head / 100) * 0.10) * (scenario === "upside" ? 1.03 : 1);
  const grossProfit = mrr * grossMargin;
  const burnRate = Math.max(0, opex * 1000 + (head / 100) * 100 * 9500 + 38000 * (scenario === "extreme" ? 1.15 : 1) - grossProfit);
  const cashBalance = Math.max(0.2, (2.2 + fundingM + (mktSpend / 200) * 0.6) * mult) * 1_000_000;
  const runwayMonths = burnRate <= 1 ? 60 : Math.max(0, Math.min(60, cashBalance / burnRate));
  const newCust = Math.max(8, 40 + growth01 * 120) * (scenario === "upside" ? 1.15 : 1) * (scenario === "extreme" ? 0.85 : 1);
  const cac = Math.max(150, (mktSpend * 1000) / newCust);
  const churnRate = Math.max(0.5, Math.min(12, (1.8 + churnSens01 * 4.2 + Math.max(0, priceAdj) * 3.2) * (scenario === "extreme" ? 1.15 : 1)));
  
  // Additional KPIs
  const avgRevenuePerUser = mrr / Math.max(100, 500 + growth01 * 800);
  const ltv = avgRevenuePerUser * (1 / (churnRate / 100)) * grossMargin;
  const ltvCacRatio = ltv / Math.max(1, cac);
  const nrr = 100 + (growth01 * 15) - (churnRate * 0.8) + (priceAdj * 5);

  return { mrr, grossProfit, cashBalance, burnRate, runwayMonths, cac, churnRate, ltv, ltvCacRatio, nrr };
}

function metricsToDataPoints(m: MetricState): number[] {
  return [
    clamp01(m.mrr / 350000),
    clamp01(m.grossProfit / 260000),
    clamp01(m.cashBalance / 7000000),
    clamp01(1 - m.burnRate / 420000),
    clamp01(m.runwayMonths / 36),
    clamp01(1 - m.cac / 6000),
    clamp01(1 - m.churnRate / 10),
  ];
}

const formatCurrency = (n: number) =>
  !Number.isFinite(n) ? "—" : Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : Math.abs(n) >= 1e3 ? `$${(n / 1e3).toFixed(0)}k` : `$${Math.round(n)}`;

const formatPct = (n: number) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : "—");

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [levers, setLevers] = useState<LeverState>(INITIAL_LEVERS);
  const [dockVisible, setDockVisible] = useState(false);
  const dockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const setDataPoints = useScenarioStore((s) => s.setDataPoints);
  const setScenarioInStore = useScenarioStore((s) => s.setScenario);
  const setKpiValues = useScenarioStore((s) => s.setKpiValues);
  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  const leverIntensity01 = useScenarioStore((s) => s.leverIntensity01);

  const metrics = useMemo(() => calculateMetrics(levers, scenario), [levers, scenario]);
  const dataPoints = useMemo(() => metricsToDataPoints(metrics), [metrics]);

  // Auto-show dock after 3 seconds on first load
  useEffect(() => {
    dockTimerRef.current = setTimeout(() => setDockVisible(true), 3000);
    return () => {
      if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setDataPoints(dataPoints);
  }, [dataPoints, setDataPoints]);

  useEffect(() => {
    setScenarioInStore(scenario);
  }, [scenario, setScenarioInStore]);

  useEffect(() => {
    setKpiValues({
      mrr: { value: metrics.mrr, display: formatCurrency(metrics.mrr) + "/mo" },
      grossProfit: { value: metrics.grossProfit, display: formatCurrency(metrics.grossProfit) + "/mo" },
      cashBalance: { value: metrics.cashBalance, display: formatCurrency(metrics.cashBalance) },
      burnRate: { value: metrics.burnRate, display: formatCurrency(metrics.burnRate) + "/mo" },
      runway: { value: metrics.runwayMonths, display: `${Math.round(metrics.runwayMonths)} mo` },
      cac: { value: metrics.cac, display: `$${Math.round(metrics.cac)}` },
      churnRate: { value: metrics.churnRate, display: formatPct(metrics.churnRate) },
      ltv: { value: metrics.ltv, display: formatCurrency(metrics.ltv) },
      ltvCacRatio: { value: metrics.ltvCacRatio, display: `${metrics.ltvCacRatio.toFixed(1)}x` },
      nrr: { value: metrics.nrr, display: formatPct(metrics.nrr) },
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

  const handleScenarioSelect = useCallback((id: ScenarioId) => {
    setScenario(id);
    setDockVisible(false);
  }, []);

  const controlBoxes: ControlBoxConfig[] = useMemo(
    () => [
      {
        id: "performance",
        title: "Performance",
        sliders: [
          { id: "revenueGrowth", label: "Revenue Growth", value: levers.revenueGrowth, min: 0, max: 100, defaultValue: 45, format: (v) => `${v}%` },
          { id: "pricingAdjustment", label: "Pricing", value: levers.pricingAdjustment, min: -20, max: 50, defaultValue: 10, format: (v) => `${v}%` },
          { id: "marketingSpend", label: "Marketing", value: levers.marketingSpend, min: 0, max: 200, defaultValue: 60, format: (v) => `$${v}k` },
        ],
      },
      {
        id: "financial",
        title: "Financial",
        sliders: [
          { id: "headcount", label: "Headcount", value: levers.headcount, min: 5, max: 100, defaultValue: 24, format: (v) => `${v}` },
          { id: "operatingExpenses", label: "OpEx", value: levers.operatingExpenses, min: 10, max: 150, defaultValue: 55, format: (v) => `$${v}k` },
        ],
      },
      {
        id: "risk",
        title: "Risk",
        sliders: [
          { id: "churnSensitivity", label: "Churn", value: levers.churnSensitivity, min: 0, max: 100, defaultValue: 50, format: (v) => (v < 33 ? "Low" : v < 66 ? "Med" : "High") },
          { id: "fundingInjection", label: "Funding", value: levers.fundingInjection, min: 0, max: 5, step: 0.1, defaultValue: 1.2, format: (v) => `$${v.toFixed(1)}M` },
        ],
      },
    ],
    [levers]
  );

  const handleReset = useCallback(() => {
    setLevers(INITIAL_LEVERS);
    setHoveredKpiIndex(null);
  }, [setHoveredKpiIndex]);

  return (
    <div className="app">
      {/* Scenario Dock — Overlays Mountain */}
      <ScenarioSlidePanel
        selected={scenario}
        onSelect={handleScenarioSelect}
        isVisible={dockVisible}
        onToggle={() => setDockVisible(!dockVisible)}
      />

      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#22c55e" />
            <path d="M2 17L12 22L22 17" stroke="#22c55e" strokeWidth="2" />
            <path d="M2 12L12 17L22 12" stroke="#22c55e" strokeWidth="2" />
          </svg>
          <span>STRATFIT</span>
        </div>
        <div className="actions">
          <button onClick={handleReset}>Reset</button>
          <button>Load</button>
          <button className="primary">Save</button>
        </div>
      </header>

      {/* TOP: KPI STRIP — 10 Horizontal Cards */}
      <section className="kpi-strip">
        <KPIGrid />
      </section>

      {/* CENTER: MOUNTAIN HERO */}
      <section className="mountain-hero">
        {/* Atmospheric Fog */}
        <div className="atmosphere" />
        
        <div className="mountain-container">
          <Moon rightOffset={4} topOffset={3} scale={0.6} />
          <ScenarioMountain
            scenario={scenario}
            dataPoints={dataPoints}
            activeKpiIndex={hoveredKpiIndex}
            activeLeverId={activeLeverId ?? null}
            leverIntensity01={leverIntensity01 ?? 0}
          />
        </div>
      </section>

      {/* BOTTOM: SLIDER CONTROLS */}
      <section className="slider-strip">
        <ControlDeck boxes={controlBoxes} onChange={handleLeverChange} layout="horizontal" />
      </section>

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
          background: #050508;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* HEADER */
        .header {
          flex-shrink: 0;
          height: 44px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px;
          background: rgba(5, 5, 8, 0.98);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .actions button {
          padding: 5px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .actions button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .actions button.primary {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        /* TOP: KPI STRIP */
        .kpi-strip {
          flex-shrink: 0;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        /* CENTER: MOUNTAIN HERO */
        .mountain-hero {
          flex: 1;
          position: relative;
          min-height: 0;
          overflow: hidden;
        }

        .atmosphere {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: 
            radial-gradient(ellipse 100% 50% at 50% 70%, rgba(30, 45, 55, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 70% 35% at 30% 60%, rgba(20, 40, 50, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 70% 35% at 70% 60%, rgba(20, 40, 50, 0.05) 0%, transparent 50%);
        }

        .mountain-container {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* BOTTOM: SLIDER STRIP */
        .slider-strip {
          flex-shrink: 0;
          padding: 10px 16px 12px;
          background: rgba(8, 10, 14, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        /* Responsive */
        @media (max-height: 700px) {
          .kpi-strip {
            padding: 8px 12px;
          }
          .slider-strip {
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
}
