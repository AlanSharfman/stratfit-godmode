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
import AIIntelligence from "./components/AIIntelligence";
import ViewToggle from "./components/ViewToggle";
import ScenarioSelector from "./components/ScenarioSelector";
import OnboardingSequence from "./components/OnboardingSequenceNew";
import { useScenarioStore, SCENARIO_COLORS } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";
import { calculateMetrics } from "@/logic/calculateMetrics";

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
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [levers, setLevers] = useState<LeverState>(INITIAL_LEVERS);
  
  // Handle scenario change
  const handleScenarioChange = useCallback((newScenario: ScenarioId) => {
    setScenario(newScenario);
  }, []);
  
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
    const engineResult = {
      kpis: {
        runway: { value: metrics.runway, display: `${Math.round(metrics.runway)} mo` },
        // cashPosition is already in "millions" scale from calculateMetrics()
        // (it ranges ~0.5–5.0). Dividing by 100 forces it to $0.0M.
        cashPosition: { value: metrics.cashPosition, display: `$${metrics.cashPosition.toFixed(1)}M` },
        momentum: { value: metrics.momentum, display: `$${(metrics.momentum / 10).toFixed(1)}M` },
        burnQuality: { value: metrics.burnQuality, display: `$${Math.round(metrics.burnQuality)}K` },
        riskIndex: { value: metrics.riskIndex, display: `${Math.round(metrics.riskIndex)}/100` },
        earningsPower: { value: metrics.earningsPower, display: `${Math.round(metrics.earningsPower)}%` },
        enterpriseValue: { value: metrics.enterpriseValue, display: `$${(metrics.enterpriseValue / 10).toFixed(1)}M` },
      },
    };
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
        <div className="header-center">
          <ViewToggle />
        </div>
        <div className="header-actions">
          <button
            className="take-tour-btn"
            onClick={() => setShowOnboarding(true)}
            disabled={showOnboarding}
            aria-label="Take the Tour"
            title={showOnboarding ? "Tour is running" : "Take the Tour"}
          >
            <svg
              className="take-tour-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l1.2 3.7L17 7l-3.8 1.3L12 12l-1.2-3.7L7 7l3.8-1.3L12 2z" />
              <path d="M19 10l.7 2.2L22 13l-2.3.8L19 16l-.7-2.2L16 13l2.3-.8L19 10z" />
            </svg>
            <span>Take the Tour</span>
          </button>
        </div>
      </header>

      {/* TOP: COMMAND BAND - Scenario + KPIs + System Controls */}
      <section className="command-band">
        {/* SCENARIO SELECTOR */}
        <div className="scenario-area">
          <ScenarioSelector scenario={scenario} onChange={handleScenarioChange} />
        </div>

        {/* KPI CONSOLE */}
        <div className="kpi-section">
          <KPIConsole />
        </div>

        {/* SYSTEM CONTROLS */}
        <div className="system-controls">
          <button className="system-btn">
            <svg className="system-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Save</span>
          </button>
          <button className="system-btn">
            <svg className="system-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            <span>Load</span>
          </button>
        </div>
      </section>

      {/* MIDDLE SECTION */}
      <div className="middle-section">
        {/* LEFT: Sliders Only */}
        <aside className="left-panel">
          <div className="sliders-container">
            <ControlDeck boxes={controlBoxes} onChange={handleLeverChange} />
          </div>
        </aside>

        {/* CENTER: Panel */}
        <CenterViewPanel />

        {/* RIGHT: AI Intelligence */}
        <aside className="right-panel">
          <AIIntelligence
            commentary={[]}
            risks={[]}
            actions={[]}
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

        .header {
          flex-shrink: 0;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background: #0d1117;
          border-bottom: 1px solid #21262d;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .take-tour-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 32px;
          padding: 0 14px;
          /* Nudge lower so it doesn't kiss the top border */
          margin-top: 6px;
          margin-bottom: 0px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          color: rgba(10, 13, 16, 0.92);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          background: linear-gradient(180deg, #7ff6ff 0%, #4fe8ff 100%);
          box-shadow:
            0 8px 22px rgba(34, 211, 238, 0.14),
            0 0 0 1px rgba(34, 211, 238, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.35);
        }

        .take-tour-btn:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .take-tour-icon {
          color: rgba(10, 13, 16, 0.92);
          flex-shrink: 0;
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

        .system-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          letter-spacing: 0.02em;
          padding: 4px 10px 4px 8px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .status-label {
          color: #8b949e;
          font-weight: 500;
        }

        .status-separator {
          color: #484f58;
          margin: 0 1px;
        }

        .status-live {
          color: #d1e8d5;
          font-weight: 600;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3ccb7f;
          margin-left: 2px;
          animation: status-pulse 2.8s ease-in-out infinite;
        }

        .system-status.computing .status-dot {
          animation: status-pulse-fast 1.8s ease-in-out infinite;
        }

        .system-status.paused .status-dot {
          background: #6b7280;
          animation: none;
        }

        @keyframes status-pulse {
          0%, 100% { 
            opacity: 0.65; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.88; 
            transform: scale(1.12); 
          }
        }

        @keyframes status-pulse-fast {
          0%, 100% { 
            opacity: 0.7; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.92; 
            transform: scale(1.08); 
          }
        }

        /* Investor view - more restrained */
        .system-status.investor {
          background: rgba(255, 255, 255, 0.015);
          border-color: rgba(255, 255, 255, 0.03);
        }

        .system-status.investor .status-dot {
          animation: status-pulse-investor 3.2s ease-in-out infinite;
        }

        @keyframes status-pulse-investor {
          0%, 100% { 
            opacity: 0.55; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.75; 
            transform: scale(1.08); 
          }
        }

        .header-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .header-action-btn {
          padding: 6px 16px;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .header-action-btn:hover {
          background: #1c2128;
          color: rgba(255, 255, 255, 0.8);
          border-color: #484f58;
        }

        /* COMMAND BAND */
        .command-band {
          flex-shrink: 0;
          padding: 10px 20px;
          border-bottom: 1px solid #21262d;
          display: flex;
          align-items: center;
          gap: 16px;
          background: linear-gradient(180deg, rgba(13, 17, 23, 1) 0%, rgba(13, 17, 23, 0.95) 100%);
        }

        .scenario-area {
          flex-shrink: 0;
          margin-left: 8px;
        }

        .option-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .option-desc {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
        }

        .kpi-section {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 0 10px;
        }

        /* SYSTEM CONTROLS — Checkpoint/Session Controls */
        .system-controls {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }

        .system-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(30, 35, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
        }

        .system-btn:hover {
          background: rgba(38, 44, 52, 0.95);
          border-color: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
          transform: translateY(-1px);
        }

        .system-btn:active {
          transform: translateY(0);
        }

        .system-icon {
          opacity: 0.5;
          transition: opacity 0.15s ease;
        }

        .system-btn:hover .system-icon {
          opacity: 0.75;
        }

        .middle-section {
          flex: 1;
          display: grid;
          /* Wider AI panel so content doesn't clip/overflow the viewport */
          grid-template-columns: 200px 1fr 340px;
          gap: 16px;
          padding: 12px 20px;
          min-height: 0;
        }

        .left-panel {
          display: flex;
          flex-direction: column;
          overflow: hidden;
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

        .center-panel {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          padding-right: 20px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-bottom: 20px;
          position: relative;
        }

        .center-panel::-webkit-scrollbar {
          width: 8px;
        }

        .center-panel::-webkit-scrollbar-track {
          background: rgba(30, 40, 55, 0.5);
          border-radius: 4px;
        }

        .center-panel::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(56, 189, 248, 0.6) 0%, rgba(34, 211, 238, 0.4) 100%);
          border-radius: 4px;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .center-panel::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(56, 189, 248, 0.8) 0%, rgba(34, 211, 238, 0.6) 100%);
        }

        .mountain-container {
          flex: 1;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #0d1117;
          border: 1px solid #30363d;
          min-height: 300px;
        }

        .mountain-content {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .right-panel {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
        }

        @media (max-width: 1200px) {
          .middle-section {
            grid-template-columns: 180px 1fr 300px;
          }
        }

        @media (max-width: 1000px) {
          .middle-section {
            grid-template-columns: 180px 1fr;
          }
          .right-panel {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
