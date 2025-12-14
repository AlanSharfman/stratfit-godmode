// src/App.tsx
// STRATFIT — Scenario Intelligence Platform
// Two Views, One Engine, Same Truth

import { useState, useCallback, useMemo, useEffect } from "react";
import { ScenarioId } from "./components/ScenarioSlidePanel";
import KPIGrid from "./components/KPIGrid";
import ScenarioMountain from "./components/mountain/ScenarioMountain";
import { Moon } from "./components/Moon";
import { ControlDeck, ControlBoxConfig } from "./components/ControlDeck";
import AIIntelligence from "./components/AIIntelligence";
import ViewToggle from "./components/ViewToggle";
import { useScenarioStore } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";

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

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: "base", label: "Base Case" },
  { id: "upside", label: "Upside" },
  { id: "downside", label: "Downside" },
  { id: "extreme", label: "Stress Test" },
];

// ============================================================================
// METRICS CALCULATION
// ============================================================================

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function calculateMetrics(levers: LeverState, scenario: ScenarioId) {
  const mult = scenario === "upside" ? 1.15 : scenario === "downside" ? 0.85 : scenario === "extreme" ? 0.70 : 1;
  
  // Growth factors
  const demand = levers.demandStrength / 100;
  const pricing = levers.pricingPower / 100;
  const expansion = levers.expansionVelocity / 100;
  
  // Efficiency factors
  const cost = levers.costDiscipline / 100;
  const hiring = levers.hiringIntensity / 100;
  const drag = levers.operatingDrag / 100;
  
  // Risk factors
  const volatility = levers.marketVolatility / 100;
  const execRisk = levers.executionRisk / 100;
  const funding = levers.fundingPressure / 100;

  // Calculate KPI values
  const runway = Math.round(Math.max(3, (18 + cost * 12 - hiring * 8 - funding * 10) * mult));
  const cashPosition = Math.max(0.5, (3.2 + pricing * 1.5 - drag * 1.2 + cost * 0.8) * mult);
  const momentum = Math.round((demand * 40 + expansion * 30 + pricing * 20) * mult);
  const burnQuality = Math.round((cost * 35 + (1 - hiring) * 25 + (1 - drag) * 20) * mult);
  const riskIndex = Math.round((volatility * 30 + execRisk * 35 + funding * 25) * (2 - mult));
  const earningsPower = Math.round((demand * 25 + pricing * 30 + cost * 25) * mult);
  const enterpriseValue = Math.max(5, (demand * 40 + pricing * 30 + expansion * 20 - volatility * 15) * mult);

  return { runway, cashPosition, momentum, burnQuality, riskIndex, earningsPower, enterpriseValue };
}

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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const viewMode = useScenarioStore((s) => s.viewMode);
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
      runway: { value: metrics.runway, display: `${metrics.runway} mo` },
      cashPosition: { value: metrics.cashPosition * 100, display: `£${metrics.cashPosition.toFixed(1)}M` },
      momentum: { value: metrics.momentum, display: `${metrics.momentum}%` },
      burnQuality: { value: metrics.burnQuality, display: `${metrics.burnQuality}%` },
      riskIndex: { value: metrics.riskIndex, display: `${metrics.riskIndex}/100` },
      earningsPower: { value: metrics.earningsPower, display: `${metrics.earningsPower}%` },
      enterpriseValue: { value: metrics.enterpriseValue, display: `£${metrics.enterpriseValue.toFixed(0)}M` },
    });
  }, [metrics, setKpiValues]);

  const handleLeverChange = useCallback(
    (id: LeverId | "__end__", value: number) => {
      if (id === "__end__") {
        setHoveredKpiIndex(null);
        return;
      }
      setLevers((prev) => ({ ...prev, [id]: value }));
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
          { id: "revenueGrowth" as LeverId, label: "Demand Strength", value: levers.demandStrength, min: 0, max: 100, defaultValue: 60, format: (v) => `${v}%` },
          { id: "pricingAdjustment" as LeverId, label: "Pricing Power", value: levers.pricingPower, min: 0, max: 100, defaultValue: 50, format: (v) => `${v}%` },
          { id: "marketingSpend" as LeverId, label: "Expansion Velocity", value: levers.expansionVelocity, min: 0, max: 100, defaultValue: 45, format: (v) => `${v}%` },
        ],
      },
      {
        id: "efficiency",
        title: "Efficiency",
        sliders: [
          { id: "operatingExpenses" as LeverId, label: "Cost Discipline", value: levers.costDiscipline, min: 0, max: 100, defaultValue: 55, format: (v) => `${v}%` },
          { id: "headcount" as LeverId, label: "Hiring Intensity", value: levers.hiringIntensity, min: 0, max: 100, defaultValue: 40, format: (v) => `${v}%` },
          { id: "cashSensitivity" as LeverId, label: "Operating Drag", value: levers.operatingDrag, min: 0, max: 100, defaultValue: 35, format: (v) => `${v}%` },
        ],
      },
      {
        id: "risk",
        title: "Risk",
        sliders: [
          { id: "churnSensitivity" as LeverId, label: "Market Volatility", value: levers.marketVolatility, min: 0, max: 100, defaultValue: 30, format: (v) => `${v}%` },
          { id: "fundingInjection" as LeverId, label: "Execution Risk", value: levers.executionRisk, min: 0, max: 100, defaultValue: 25, format: (v) => `${v}%` },
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

  const selectedScenario = SCENARIOS.find(s => s.id === scenario) || SCENARIOS[0];

  return (
    <div className="app">
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
          <button className="action-btn">Save</button>
          <button className="action-btn">Load</button>
        </div>
      </header>

      {/* TOP: KPI STRIP */}
      <section className="kpi-strip">
        <KPIGrid />
      </section>

      {/* MIDDLE SECTION */}
      <div className="middle-section">
        {/* LEFT: Scenario + Sliders */}
        <aside className="left-panel">
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

          <div className="sliders-container">
            <ControlDeck boxes={controlBoxes} onChange={handleLeverChange} />
          </div>
        </aside>

        {/* CENTER: Mountain */}
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
        </div>

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
          gap: 24px;
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

        .action-btn {
          padding: 6px 14px;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
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

        .kpi-strip {
          flex-shrink: 0;
          padding: 8px 20px;
          padding-left: 236px;
          padding-right: 316px;
          border-bottom: 1px solid #21262d;
        }

        .middle-section {
          flex: 1;
          display: grid;
          grid-template-columns: 200px 1fr 280px;
          gap: 16px;
          padding: 12px 20px;
          min-height: 0;
        }

        .left-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: hidden;
        }

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

        .center-panel {
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding-right: 20px;
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

        .right-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        @media (max-width: 1200px) {
          .middle-section {
            grid-template-columns: 180px 1fr 240px;
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
