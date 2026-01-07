// src/App.tsx
// STRATFIT — Scenario Intelligence Platform
// Two Views, One Engine, Same Truth

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { ScenarioId } from "./components/ScenarioSlidePanel";
import KPIConsole from "./components/KPIConsole";
import CenterViewPanel from "@/components/center/CenterViewPanel";
import { Moon } from "./components/Moon";
import { ControlDeck, ControlBoxConfig } from "./components/ControlDeck";
import AIIntelligence from "./components/AIIntelligenceEnhanced";
import ScenarioSelector from "./components/ScenarioSelector";
import OnboardingSequence from "./components/OnboardingSequenceNew";
import { useScenarioStore, SCENARIO_COLORS } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";
import { calculateMetrics } from "@/logic/calculateMetrics";
import { emitCausal } from "@/ui/causalEvents";
import TakeTheTour from "@/components/ui/TakeTheTour";
import ScenarioIntelligencePanel from "@/components/ui/ScenarioIntelligencePanel";
import { deriveArrGrowth, formatUsdCompact } from "@/utils/arrGrowth";
import ScenarioMemoPage from "@/pages/ScenarioMemoPage";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface LeverState {
  // Growth
  demandStrength: number;
  pricingPower: number;
  expansionVelocity: number;
  // Efficiency
  costDiscipline: number;
  hiringIntensity: number;
  operatingDrag: number;
  // Risk
  marketVolatility: number;
  executionRisk: number;
  fundingPressure: number;
}

const INITIAL_LEVERS: LeverState = {
  demandStrength: 60,
  pricingPower: 50,
  expansionVelocity: 45,
  costDiscipline: 55,
  hiringIntensity: 40,
  operatingDrag: 35,
  marketVolatility: 30,
  executionRisk: 25,
  fundingPressure: 20,
};

// SCENARIOS moved to ScenarioSelector component

// ============================================================================
// METRICS CALCULATION
// ============================================================================

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function metricsToDataPoints(m: ReturnType<typeof calculateMetrics>): number[] {
  return [
    clamp01(m.runway / 36),
    clamp01(m.cashPosition / 8),
    clamp01(m.momentum / 100),
    clamp01(m.burnQuality / 100),
    clamp01(1 - m.riskIndex / 100),
    clamp01(m.earningsPower / 100),
    clamp01(m.enterpriseValue / 100),
  ];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function App() {
  // Simple memo route (no router) — used for Print-to-PDF export.
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/memo/")) {
    return <ScenarioMemoPage />;
  }

  // FEATURE FLAG — Scenario Intelligence (Cold Brief) — reversible, UI-only
  // Enable via: localStorage.setItem("ENABLE_SCENARIO_INTELLIGENCE","1"); location.reload();
  const ENABLE_SCENARIO_INTELLIGENCE =
    typeof window !== "undefined" &&
    window.localStorage.getItem("ENABLE_SCENARIO_INTELLIGENCE") === "1";

  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [levers, setLevers] = useState<LeverState>(INITIAL_LEVERS);
  const didMountRef = useRef(false);
  
  // Handle scenario change
  const handleScenarioChange = useCallback((newScenario: ScenarioId) => {
    setScenario(newScenario);
  }, []);

  // Scenario switch causal highlight — fire AFTER state update (and never on initial mount)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    emitCausal({
      source: "scenario_switch",
      bandStyle: "wash",
      color: "rgba(34,211,238,0.18)",
    });
  }, [scenario]);
  
  // Consolidated store selectors to prevent rerender cascades
  const {
    viewMode,
    hoveredKpiIndex,
    setHoveredKpiIndex,
    setDataPoints,
    setScenarioInStore,
    activeLeverId,
    leverIntensity01,
    activeScenarioId,
    setEngineResult,
  } = useScenarioStore(
    useShallow((s) => ({
      viewMode: s.viewMode,
      hoveredKpiIndex: s.hoveredKpiIndex,
      setHoveredKpiIndex: s.setHoveredKpiIndex,
      setDataPoints: s.setDataPoints,
      setScenarioInStore: s.setScenario,
      activeLeverId: s.activeLeverId,
      leverIntensity01: s.leverIntensity01,
      activeScenarioId: s.activeScenarioId,
      setEngineResult: s.setEngineResult,
    }))
  );

  const metrics = useMemo(() => calculateMetrics(levers, scenario), [levers, scenario]);
  const dataPoints = useMemo(() => metricsToDataPoints(metrics), [metrics]);

  useEffect(() => {
    setDataPoints(dataPoints);
  }, [dataPoints, setDataPoints]);

  useEffect(() => {
    setScenarioInStore(scenario);
  }, [scenario, setScenarioInStore]);

  useEffect(() => {
    if (!metrics) return;

    const cashRaw =
      (metrics as any)?.cashPosition ??
      (metrics as any)?.cash ??
      (metrics as any)?.cashBalance ??
      (metrics as any)?.cashOnHand ??
      (metrics as any)?.balanceSheet?.cash ??
      (metrics as any)?.series?.cash?.[0] ??
      (metrics as any)?.timeline?.cash?.[0] ??
      0;

    const cashValue = Number.isFinite(cashRaw) ? Number(cashRaw) : 0;
    const cashValueDollars = cashValue > 0 && cashValue < 1_000_000 ? cashValue * 1_000_000 : cashValue;

    // ARR proxy (today): momentum is already displayed as $X.XM in the KPI console.
    // Until we have a true projection in the engine output, we derive ARR_next12 deterministically from the same signal.
    const arrCurrent = (metrics.momentum / 10) * 1_000_000;
    const growthRate = Math.max(-0.5, Math.min(0.8, (metrics.momentum - 50) * 0.006));
    const arrNext12 = arrCurrent * (1 + growthRate);
    const arrGrowth = deriveArrGrowth({ arrCurrent, arrNext12 });

    const engineResult = {
      kpis: {
        runway: { value: metrics.runway, display: `${Math.round(metrics.runway)} mo` },
        cashPosition: {
          value: cashValueDollars,
          display: `$${(cashValueDollars / 1_000_000).toFixed(1)}M`,
        },
        momentum: { value: metrics.momentum, display: `$${(metrics.momentum / 10).toFixed(1)}M` },
        arrCurrent: { value: arrCurrent, display: formatUsdCompact(arrCurrent) },
        arrNext12: { value: arrNext12, display: formatUsdCompact(arrNext12) },
        arrDelta: { value: arrGrowth.arrDelta ?? 0, display: arrGrowth.displayDelta },
        arrGrowthPct: { value: arrGrowth.arrGrowthPct ?? 0, display: arrGrowth.displayPct },
        burnQuality: { value: metrics.burnQuality, display: `$${Math.round(metrics.burnQuality)}K` },
        riskIndex: { value: metrics.riskIndex, display: `${Math.round(metrics.riskIndex)}/100` },
        earningsPower: { value: metrics.earningsPower, display: `${Math.round(metrics.earningsPower)}%` },
        enterpriseValue: { value: metrics.enterpriseValue, display: `$${(metrics.enterpriseValue / 10).toFixed(1)}M` },
      },
    };
    console.log("[ENGINE RESULT]", engineResult);
    console.log("[ENGINE RESULT KEYS]", Object.keys(engineResult ?? {}));

    // Option A — Engine contract enforcement (cashPosition must exist)
    if (
      !engineResult?.kpis?.cashPosition ||
      typeof engineResult.kpis.cashPosition.value !== "number"
    ) {
      throw new Error("ENGINE CONTRACT VIOLATION: cashPosition missing");
    }

    setEngineResult(activeScenarioId, engineResult);
  }, [activeScenarioId, metrics, setEngineResult]);
    
  // Map lever IDs to state keys
  const leverIdToStateKey: Record<string, keyof LeverState> = {
    revenueGrowth: "demandStrength",
    pricingAdjustment: "pricingPower",
    marketingSpend: "expansionVelocity",
    operatingExpenses: "costDiscipline",
    headcount: "hiringIntensity",
    cashSensitivity: "operatingDrag",
    churnSensitivity: "marketVolatility",
    fundingInjection: "executionRisk",
  };
  
  const handleLeverChange = useCallback(
    (id: LeverId | "__end__", value: number) => {
      if (id === "__end__") {
        setHoveredKpiIndex(null);
        // CRITICAL: end drag in the store so AI stops "analyzing"
        useScenarioStore.getState().setActiveLever(null, 0);
        return;
      }
      const stateKey = leverIdToStateKey[id] || id;
      setLevers((prev) => ({ ...prev, [stateKey]: value }));
    },
    [setHoveredKpiIndex]
  );

  // Slider configuration based on view mode
  const controlBoxes: ControlBoxConfig[] = useMemo(() => {
    const boxes: ControlBoxConfig[] = [
      {
        id: "growth",
        title: "Growth",
        sliders: [
          { 
            id: "revenueGrowth" as LeverId, 
            label: "Demand Strength", 
            value: levers.demandStrength, 
            min: 0, 
            max: 100, 
            defaultValue: 60, 
            format: (v) => `${v}%`,
            tooltip: {
              description: "Marketing spend, sales velocity, product-market fit strength",
              impact: "Higher = more inbound leads, faster customer acquisition"
            }
          },
          { 
            id: "pricingAdjustment" as LeverId, 
            label: "Pricing Power", 
            value: levers.pricingPower, 
            min: 0, 
            max: 100, 
            defaultValue: 50, 
            format: (v) => `${v}%`,
            tooltip: {
              description: "Ability to raise prices without losing customers",
              impact: "Higher = better margins, stronger revenue per customer"
            }
          },
          { 
            id: "marketingSpend" as LeverId, 
            label: "Expansion Velocity", 
            value: levers.expansionVelocity, 
            min: 0, 
            max: 100, 
            defaultValue: 45, 
            format: (v) => `${v}%`,
            tooltip: {
              description: "Speed of entering new markets, launching products, scaling teams",
              impact: "Higher = faster growth, more burn, higher execution risk"
            }
          },
        ],
      },
      {
        id: "efficiency",
        title: "Efficiency",
        sliders: [
          { 
            id: "operatingExpenses" as LeverId, 
            label: "Cost Discipline", 
            value: levers.costDiscipline, 
            min: 0, 
            max: 100, 
            defaultValue: 55, 
            format: (v) => `${v}%`,
            tooltip: {
              description: "Vendor management, infrastructure optimization, spending control",
              impact: "Higher = lower burn rate, longer runway, better unit economics"
            }
          },
          { 
            id: "headcount" as LeverId, 
            label: "Hiring Intensity", 
            value: levers.hiringIntensity, 
            min: 0, 
            max: 100, 
            defaultValue: 40, 
            format: (v) => `${v}%`,
            tooltip: {
              description: "Pace of team growth across all departments",
              impact: "Higher = faster execution, steeper burn, culture risk"
            }
          },
          { 
            id: "cashSensitivity" as LeverId, 
            label: "Operating Drag", 
            value: levers.operatingDrag, 
            min: 0, 
            max: 100, 
            defaultValue: 35, 
            format: (v) => `${v}%`,
            tooltip: {
              description: "Overhead, process friction, technical debt, administrative burden",
              impact: "Lower = better capital efficiency, faster decision-making"
            }
          },
        ],
      },
      {
        id: "risk",
        title: "Risk",
        sliders: [
          { 
            id: "churnSensitivity" as LeverId, 
            label: "Market Volatility", 
            value: levers.marketVolatility, 
            min: 0, 
            max: 100, 
            defaultValue: 30, 
            format: (v) => `${v}%`,
            tooltip: {
              description: "Economic headwinds, competitive pressure, customer churn risk",
              impact: "Higher = unpredictable revenue, lower valuation multiples"
            }
          },
          { 
            id: "fundingInjection" as LeverId, 
            label: "Execution Risk", 
            value: levers.executionRisk, 
            min: 0, 
            max: 100, 
            defaultValue: 25, 
            format: (v) => `${v}%`,
            tooltip: {
              description: "Product delays, team turnover, operational breakdowns",
              impact: "Higher = missed targets, emergency fundraising, runway compression"
            }
          },
        ],
      },
    ];

    // Investor view: fewer sliders (only key controls)
    if (viewMode === "investor") {
      return boxes.map(box => ({
        ...box,
        sliders: box.sliders.slice(0, 2) // Only first 2 sliders per group
      }));
    }

    return boxes;
  }, [levers, viewMode]);
  
  // Onboarding state - ALWAYS SHOW FOR DEMO
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);
  
  return (
    <div className="app">
      {/* ONBOARDING SEQUENCE */}
      {showOnboarding && <OnboardingSequence onComplete={handleOnboardingComplete} />}
      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#22d3ee" />
              <path d="M2 17L12 22L22 17" stroke="#22d3ee" strokeWidth="2" />
              <path d="M2 12L12 17L22 12" stroke="#22d3ee" strokeWidth="2" />
            </svg>
            <span>STRATFIT</span>
          </div>
          <div className={`system-status ${activeLeverId ? 'computing' : ''} ${viewMode === 'investor' ? 'investor' : ''}`}>
            <span className="status-label">System Status</span>
            <span className="status-separator">·</span>
            <span className="status-live">Live</span>
            <span className="status-dot" />
          </div>
        </div>
        <div className="header-actions">
          <div className="header-action-buttons">
            <TakeTheTour />
            <button
              className="header-action-btn"
              title="Load scenario"
              onClick={() => {
                emitCausal({
                  source: "scenario_load",
                  bandStyle: "wash",
                  color: "rgba(34,211,238,0.18)",
                });
              }}
            >
              <svg className="header-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span className="header-action-text">Load</span>
            </button>
            <button
              className="header-action-btn"
              title="Save scenario"
              onClick={() => {
                emitCausal({
                  source: "scenario_save",
                  bandStyle: "wash",
                  color: "rgba(34,211,238,0.18)",
                });
              }}
            >
              <svg className="header-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span className="header-action-text">Save</span>
            </button>
          </div>
        </div>
      </header>

      {/* TOP: COMMAND BAND - Scenario + KPIs + System Controls */}
      <section className="command-band">
        {/* ACTIVE SCENARIO (TOP-LEFT, next to KPI bezels — per spec) */}
        <div className="scenario-area">
          <ScenarioSelector scenario={scenario} onChange={handleScenarioChange} />
        </div>

        {/* KPI CONSOLE */}
        <div className="kpi-section" data-tour="kpis">
          <KPIConsole />
        </div>
      </section>

      {/* MIDDLE SECTION */}
      <div className="middle-section">
        {/* LEFT: Sliders Only */}
        <aside className="left-panel" data-tour="sliders">
          <div className="sliders-container">
            <ControlDeck boxes={controlBoxes} onChange={handleLeverChange} />
          </div>
        </aside>

        {/* CENTER: Panel */}
        <CenterViewPanel />

        {/* RIGHT: AI Intelligence */}
        <aside className="right-panel" data-tour="intel">
          {ENABLE_SCENARIO_INTELLIGENCE ? (
            <ScenarioIntelligencePanel />
          ) : (
            <AIIntelligence levers={levers} scenario={scenario} />
          )}
        </aside>
    </div></div>
  );
}
