// src/App.tsx
// STRATFIT — Scenario Intelligence Platform
// Two Views, One Engine, Same Truth

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { ScenarioId } from "./components/ScenarioSlidePanel";
import KPIConsole from "./components/KPIConsole";
import KPISparklineSection from "./components/KPISparklineSection";

import CenterViewPanel from "@/components/center/CenterViewPanel";
import CenterViewSegmented from "@/components/CenterViewSegmented";
import type { CenterViewId } from "@/types/view";
import { migrateCenterView } from "@/types/view";
import { Moon } from "./components/Moon";
import { ControlDeck, ControlBoxConfig } from "./components/ControlDeck";
import { CommandDeckBezel } from "./components/command/CommandDeckBezel";
import AIPanel from "@/components/terrain/AIPanel";
import ScenarioSelector from "./components/ScenarioSelector";
import ActiveScenario, { type ScenarioType } from "@/components/blocks/ActiveScenario";
import ScenarioBezel from "./components/kpi/ScenarioBezel";
// MonteCarloPanel removed - was compressing AI Intelligence panel
import { useScenarioStore, SCENARIO_COLORS } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";
import { calculateMetrics } from "@/logic/calculateMetrics";
import { emitCausal } from "@/ui/causalEvents";
import TakeTheTour from "@/components/ui/TakeTheTour";
import HeaderControlDeck from "@/components/layout/HeaderControlDeck";

import { deriveArrGrowth, formatUsdCompact } from "@/utils/arrGrowth";
import { getQualityScoreFromKpis, getQualityBandFromKpis } from "@/logic/qualityScore";
import ScenarioMemoPage from "@/pages/ScenarioMemoPage";
import ImpactView from "@/components/compound/impact";
import VariancesView from "@/components/compound/variances/VariancesView";
import { useDebouncedValue, useThrottledValue } from "@/hooks/useDebouncedValue";
import InitializeBaselinePage from "@/pages/initialize/InitializeBaselinePage";
import StrategicAssessmentPage from "@/pages/StrategicAssessmentPage";
import StrategyStudioPage from "@/components/strategy-studio/StrategyStudioPage";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import "@/styles/godmode-align-overrides.css";
import "@/styles/godmode-unified-layout.css";
import "@/styles/performance-optimizations.css";
import { MainNav } from "@/components/navigation";
import type { ViewMode as HeaderViewMode } from "@/components/layout/UnifiedHeader";
import { useUIStore } from "@/state/uiStore";
import { SimulateOverlay } from '@/components/simulate';
import { SaveSimulationModal, LoadSimulationPanel } from '@/components/simulations';
import { ComparePage } from '@/components/compare';
import SimulationTelemetryRibbon from '@/components/simulation/SimulationTelemetryRibbon';
import ProDetailDrawer from '@/components/simulation/ProDetailDrawer';
import AdminEngineConsole from '@/components/admin/AdminEngineConsole';
import { useSimulationStore } from '@/state/simulationStore';

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

// Scenario presets for the 4 strategy-based situations
const SCENARIO_PRESETS: Record<ScenarioType, LeverState> = {
  'current-trajectory': {
    demandStrength: 50,
    pricingPower: 50,
    expansionVelocity: 50,
    costDiscipline: 50,
    hiringIntensity: 50,
    operatingDrag: 50,
    marketVolatility: 50,
    executionRisk: 50,
    fundingPressure: 50,
  },
  'series-b-stress-test': {
    demandStrength: 80,
    pricingPower: 60,
    expansionVelocity: 75,
    costDiscipline: 40,
    hiringIntensity: 70,
    operatingDrag: 60,
    marketVolatility: 50,
    executionRisk: 45,
    fundingPressure: 40,
  },
  'profitability-push': {
    demandStrength: 55,
    pricingPower: 65,
    expansionVelocity: 40,
    costDiscipline: 70,
    hiringIntensity: 40,
    operatingDrag: 20,
    marketVolatility: 50,
    executionRisk: 35,
    fundingPressure: 30,
  },
  'apac-expansion': {
    demandStrength: 65,
    pricingPower: 55,
    expansionVelocity: 70,
    costDiscipline: 60,
    hiringIntensity: 65,
    operatingDrag: 40,
    marketVolatility: 60,
    executionRisk: 50,
    fundingPressure: 45,
  },
};

// Map new scenario types to old scenario IDs (determines mountain color)
// base = Teal (Baseline), upside = Green (Growth), downside = Amber (Caution), stress = Red (Risk)
function mapScenarioTypeToId(type: ScenarioType): ScenarioId {
  switch (type) {
    case 'series-b-stress-test':
      return 'upside';      // Green - Aggressive growth
    case 'profitability-push':
      return 'downside';    // Amber - Cautious/conservative path
    case 'apac-expansion':
      return 'stress';      // Red - High risk expansion
    case 'current-trajectory':
    default:
      return 'base';        // Teal - Baseline trajectory
  }
}

const ALL_SCENARIOS: ScenarioId[] = ["base", "upside", "downside", "stress"];

// SCENARIOS moved to ScenarioSelector component

// ============================================================================
// METRICS CALCULATION
// ============================================================================

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function metricsToDataPoints(m: ReturnType<typeof calculateMetrics>): number[] {
  // Simplified growth fragility calculation for mountain terrain
  // (Full CAC/LTV/Payback computed in engine result for KPIs)
  const burn = m.burnQuality * 1000; // burnQuality is in K
  const marketingSpend = burn * 0.45;
  const avgRevenuePerCustomer = 12_000;
  const grossMargin = 0.74;
  const annualChurn = 0.12;
  
  const arrCurrent = (m.momentum / 10) * 1_000_000;
  const growthRate = Math.max(-0.5, Math.min(0.8, (m.momentum - 50) * 0.006));
  const arrNext12 = arrCurrent * (1 + growthRate);
  const arrDelta = arrNext12 - arrCurrent;
  const newCustomers = Math.max(1, arrDelta / avgRevenuePerCustomer);
  
  const cac = marketingSpend / newCustomers;
  const ltv = (avgRevenuePerCustomer * grossMargin) / annualChurn;
  const ltvCac = ltv / cac;
  const cacPaybackMonths = (cac / (avgRevenuePerCustomer * grossMargin)) * 12;

  // Growth fragility (0 = great, 1 = terrible)
  const growthFragility = Math.min(1, (1 / Math.max(1, ltvCac)) + (cacPaybackMonths / 48));

  // Growth penalty pushes mountain down if growth is weak (up to 25% reduction)
  const growthMultiplier = 1 - (growthFragility * 0.25);

  return [
    clamp01(m.runway / 36) * growthMultiplier,
    clamp01(m.cashPosition / 8) * growthMultiplier,
    clamp01(m.momentum / 100) * growthMultiplier,
    clamp01(m.burnQuality / 100) * growthMultiplier,
    clamp01(1 - m.riskIndex / 100) * growthMultiplier,
    clamp01(m.earningsPower / 100) * growthMultiplier,
    clamp01(m.enterpriseValue / 100) * growthMultiplier,
  ];
}

// ============================================================================
// VIABILITY SOLVER WITH PATH RECORDING
// ============================================================================

interface SolverKpis {
  runway: number;
  ltvCac: number;
  cacPayback: number;
  riskIndex: number;
  enterpriseValue: number;
  arrCurrent: number;
  arrNext12: number;
}

interface SolverPathStep {
  levers: LeverState;
  kpis: SolverKpis;
}

interface SolverResult {
  path: SolverPathStep[];
  final: SolverPathStep;
}

interface SolverStepper {
  stop: (kpis: SolverKpis, iteration: number) => boolean;
  next: (attempt: LeverState, kpis: SolverKpis, iteration: number) => LeverState;
  maxIterations?: number;
}

function computeSolverMetrics(levers: LeverState, scenario: ScenarioId): SolverKpis {
  const metrics = calculateMetrics(levers, scenario);
  
  // Compute CAC/LTV/Payback (same as in engine)
  const burn = metrics.burnQuality * 1000;
  const marketingSpend = burn * 0.45;
  const avgRevenuePerCustomer = 12_000;
  const grossMargin = 0.74;
  const annualChurn = 0.12;
  
  const arrCurrent = (metrics.momentum / 10) * 1_000_000;
  const growthRate = Math.max(-0.5, Math.min(0.8, (metrics.momentum - 50) * 0.006));
  const arrNext12 = arrCurrent * (1 + growthRate);
  const arrDelta = arrNext12 - arrCurrent;
  const newCustomers = Math.max(1, arrDelta / avgRevenuePerCustomer);
  
  const cac = marketingSpend / newCustomers;
  const ltv = (avgRevenuePerCustomer * grossMargin) / annualChurn;
  const ltvCac = ltv / cac;
  const cacPaybackMonths = (cac / (avgRevenuePerCustomer * grossMargin)) * 12;

  // Growth risk adjustment
  let growthRisk = 0;
  if (ltvCac < 2) growthRisk += 15;
  if (cacPaybackMonths > 24) growthRisk += 15;
  if (cacPaybackMonths > 36) growthRisk += 10;
  const adjustedRiskIndex = Math.min(100, Math.max(0, metrics.riskIndex + growthRisk));

  // Enterprise value (from metrics, scaled to dollars)
  const enterpriseValue = (metrics.enterpriseValue / 10) * 1_000_000;

  return {
    runway: metrics.runway,
    ltvCac,
    cacPayback: cacPaybackMonths,
    riskIndex: adjustedRiskIndex,
    enterpriseValue,
    arrCurrent,
    arrNext12,
  };
}

// Generic solver with path recording
function solveWithPath(
  current: LeverState,
  scenario: ScenarioId,
  stepper: SolverStepper
): SolverResult | null {
  const path: SolverPathStep[] = [];
  let attempt = { ...current };
  const maxIter = stepper.maxIterations ?? 50;

  for (let i = 0; i < maxIter; i++) {
    const kpis = computeSolverMetrics(attempt, scenario);
    path.push({ levers: { ...attempt }, kpis });

    if (stepper.stop(kpis, i)) {
      return { path, final: path[path.length - 1] };
    }

    attempt = stepper.next({ ...attempt }, kpis, i);
  }

  // Return the best we found if path exists
  if (path.length > 0) {
    return { path, final: path[path.length - 1] };
  }
  return null;
}

// Solver 1: Find Viable Plan (24mo runway, healthy CAC)
function findViableScenario(current: LeverState, scenario: ScenarioId): SolverResult | null {
  return solveWithPath(current, scenario, {
    maxIterations: 40,
    stop: (kpis) => (
      kpis.runway >= 24 &&
      kpis.ltvCac >= 3 &&
      kpis.cacPayback <= 18 &&
      kpis.riskIndex <= 50
    ),
    next: (a) => ({
      ...a,
      costDiscipline: Math.min(100, a.costDiscipline + 5),
      pricingPower: Math.min(100, a.pricingPower + 4),
      demandStrength: Math.min(100, a.demandStrength + 3),
      expansionVelocity: Math.min(100, a.expansionVelocity + 2),
      operatingDrag: Math.max(0, a.operatingDrag - 4),
      marketVolatility: Math.max(0, a.marketVolatility - 2),
      executionRisk: Math.max(0, a.executionRisk - 2),
    }),
  });
}

// Solver 2: Fastest Path to $100M Valuation
function findFastestTo100M(current: LeverState, scenario: ScenarioId): SolverResult | null {
  return solveWithPath(current, scenario, {
    maxIterations: 60,
    stop: (kpis) => kpis.enterpriseValue >= 100_000_000,
    next: (a, _kpis, i) => ({
      ...a,
      demandStrength: Math.min(100, current.demandStrength + (i + 1) * 3),
      pricingPower: Math.min(100, current.pricingPower + (i + 1) * 2),
      expansionVelocity: Math.min(100, current.expansionVelocity + (i + 1) * 2),
      costDiscipline: Math.min(100, current.costDiscipline + (i + 1) * 1),
    }),
  });
}

// Solver 3: Lowest Risk Plan (minimize risk while staying viable)
function findLowestRisk(current: LeverState, scenario: ScenarioId): SolverResult | null {
  let bestRisk = Infinity;
  let foundViable = false;
  
  return solveWithPath(current, scenario, {
    maxIterations: 50,
    stop: (kpis, i) => {
      // Track best viable state
      if (kpis.runway >= 18 && kpis.ltvCac >= 3) {
        foundViable = true;
        if (kpis.riskIndex < bestRisk) {
          bestRisk = kpis.riskIndex;
        }
      }
      // Stop when risk starts increasing after finding viable
      return foundViable && i > 5 && kpis.riskIndex > bestRisk + 5;
    },
    next: (a, _kpis, i) => ({
      ...a,
      costDiscipline: Math.min(100, current.costDiscipline + (i + 1) * 4),
      operatingDrag: Math.max(0, current.operatingDrag - (i + 1) * 3),
      pricingPower: Math.min(100, current.pricingPower + (i + 1) * 1),
      marketVolatility: Math.max(0, current.marketVolatility - (i + 1) * 2),
      executionRisk: Math.max(0, current.executionRisk - (i + 1) * 2),
    }),
  });
}

// Solver 4: Investor-Acceptable Plan (what VCs want)
function findInvestorPlan(current: LeverState, scenario: ScenarioId): SolverResult | null {
  return solveWithPath(current, scenario, {
    maxIterations: 60,
    stop: (kpis) => {
      const arrGrowthPct = kpis.arrCurrent > 0 
        ? ((kpis.arrNext12 - kpis.arrCurrent) / kpis.arrCurrent) * 100 
        : 0;
      return (
        kpis.runway >= 18 &&
        kpis.ltvCac >= 3 &&
        kpis.cacPayback <= 18 &&
        arrGrowthPct >= 40 &&
        kpis.riskIndex <= 60
      );
    },
    next: (a, _kpis, i) => ({
      ...a,
      pricingPower: Math.min(100, current.pricingPower + (i + 1) * 2),
      demandStrength: Math.min(100, current.demandStrength + (i + 1) * 3),
      costDiscipline: Math.min(100, current.costDiscipline + (i + 1) * 2),
      expansionVelocity: Math.min(100, current.expansionVelocity + (i + 1) * 2),
    }),
  });
}

// Solver 5: Trade-off Dial (Risk ↔ Valuation balance)
function findTradeoffPlan(
  current: LeverState, 
  scenario: ScenarioId, 
  tradeoff: number // 0 = minimize risk, 1 = maximize valuation
): SolverResult | null {
  let bestScore = -Infinity;
  let bestStep: SolverPathStep | null = null;
  
  const result = solveWithPath(current, scenario, {
    maxIterations: 50,
    stop: (kpis, i) => {
      // Score = tradeoff * valuation - (1 - tradeoff) * risk * 1M
      const score = 
        tradeoff * kpis.enterpriseValue - 
        (1 - tradeoff) * kpis.riskIndex * 1_000_000;
      
      if (score > bestScore && kpis.runway >= 12) {
        bestScore = score;
        bestStep = { levers: { ...current }, kpis };
      }
      
      // Keep exploring
      return i >= 49;
    },
    next: (a, _kpis, i) => {
      // Blend between growth and safety based on tradeoff
      const growth = tradeoff;
      const safety = 1 - tradeoff;
      
      return {
        ...a,
        demandStrength: Math.min(100, a.demandStrength + growth * 3),
        pricingPower: Math.min(100, a.pricingPower + growth * 2),
        expansionVelocity: Math.min(100, a.expansionVelocity + growth * 2),
        costDiscipline: Math.min(100, a.costDiscipline + safety * 4),
        operatingDrag: Math.max(0, a.operatingDrag - safety * 3),
        marketVolatility: Math.max(0, a.marketVolatility - safety * 2),
        executionRisk: Math.max(0, a.executionRisk - safety * 2),
      };
    },
  });
  
  // Find the step with best score in the path
  if (result && result.path.length > 0) {
    let bestIdx = 0;
    let maxScore = -Infinity;
    result.path.forEach((step, idx) => {
      if (step.kpis.runway >= 12) {
        const score = 
          tradeoff * step.kpis.enterpriseValue - 
          (1 - tradeoff) * step.kpis.riskIndex * 1_000_000;
        if (score > maxScore) {
          maxScore = score;
          bestIdx = idx;
        }
      }
    });
    return {
      path: result.path.slice(0, bestIdx + 1),
      final: result.path[bestIdx],
    };
  }
  
  return result;
}

// Viability check helper
function isViable(kpis: { runway?: { value: number }; ltvCac?: { value: number }; cacPayback?: { value: number }; riskIndex?: { value: number } } | null | undefined): boolean {
  if (!kpis) return false;
  return (
    (kpis.runway?.value ?? 0) >= 24 &&
    (kpis.ltvCac?.value ?? 0) >= 3 &&
    (kpis.cacPayback?.value ?? 999) <= 18 &&
    (kpis.riskIndex?.value ?? 100) <= 50
  );
}

// Export solver path type for mountain visualization
export type { SolverPathStep };

// ============================================================================
// KPI COMMAND BRIDGE — ALWAYS VISIBLE (God Mode Rule)
// The KPI telemetry strip must never be hidden - locked visible on all views
// ============================================================================

function OrbitalKPISection({ kpiAnimState }: { kpiAnimState: "visible" | "closing" | "hidden" }) {
  const hasInteracted = useUIStore((s) => s.hasInteracted);
  
  return (
    <div 
      className={`kpi-section kpi-section--animated kpi-section--visible ${hasInteracted ? 'orbital-active' : ''}`} 
      data-tour="kpis"
    >
      <KPISparklineSection />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function App() {
  // Simple memo route (no router) — used for Print-to-PDF export.
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/memo/")) {
    return <ScenarioMemoPage />;
  }

  // Initialize Baseline route — canonical baseline truth capture.
  // Renders with MainNav so Initialize feels first-class.
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/initialize")) {
    return (
      <div className="app">
        <MainNav
          activeItemId="initialize"
          onNavigate={(id) => {
            if (id === "initialize") return;
            window.location.assign("/");
          }}
        />
        <InitializeBaselinePage />
      </div>
    );
  }

  // Strategic Assessment route — Institutional intelligence brief (post-simulation)
  if (typeof window !== "undefined" && window.location.pathname === "/assessment") {
    return (
      <div className="app">
        <MainNav
          activeItemId="assessment"
          onNavigate={(id) => {
            if (id === "assessment") return;
            if (id === "initialize") return window.location.assign("/initialize");
            window.location.assign("/");
          }}
        />
        <StrategicAssessmentPage />
      </div>
    );
  }

  // Compare route — Production-ready Risk Topography Instrument
  if (typeof window !== "undefined" && window.location.pathname === "/compare") {
    return <ComparePage />;
  }

  // Admin Engine Console — gated route (requires ENABLE_ADMIN_CONSOLE=1)
  if (typeof window !== "undefined" && window.location.pathname === "/admin/engine") {
    return (
      <div className="app">
        <MainNav
          activeItemId="terrain"
          onNavigate={(id) => {
            if (id === "initialize") return;
            window.location.assign("/");
          }}
        />
        <AdminEngineConsole />
      </div>
    );
  }


  // FEATURE FLAG — Scenario Intelligence (Cold Brief) — reversible, UI-only
  // Enable via: localStorage.setItem("ENABLE_SCENARIO_INTELLIGENCE","1"); location.reload();
  const ENABLE_SCENARIO_INTELLIGENCE =
    typeof window !== "undefined" &&
    window.localStorage.getItem("ENABLE_SCENARIO_INTELLIGENCE") === "1";

  // ── RECALIBRATION STATE — structural compute signal (single source of truth) ──
  // IMPORTANT: We key stage-isolation off simulationStatus to avoid "stuck UI" if isSimulating ever desyncs.
  const simulationStatusGlobal = useSimulationStore((s) => s.simulationStatus);
  const isSimulatingGlobal = simulationStatusGlobal === "running";

  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [activeScenarioType, setActiveScenarioType] = useState<ScenarioType>("current-trajectory");
  const [levers, setLevers] = useState<LeverState>(INITIAL_LEVERS);
  
  // 🚀 PERFORMANCE OPTIMIZATION: Debounce expensive calculations
  // - immediateLevers: Used for visual feedback (sliders feel instant)
  // - debouncedLevers: Used for heavy engine calculations (prevents lag)
  const [immediateLevers, debouncedLevers] = useDebouncedValue(levers, 100);
  const throttledLevers = useThrottledValue(levers);
  
  // Canonical center view state
  // DEFAULT: "terrain" for investor demo
  const CENTER_VIEW_KEY = "sf.centerView.v1";
  const [centerView, setCenterView] = useState<CenterViewId>(() => {
    try {
      const raw = window.localStorage.getItem(CENTER_VIEW_KEY);
      return migrateCenterView(raw);
    } catch {}
    return "terrain"; // Demo default: Show terrain view on load
  });
  const didMountRef = useRef(false);
  
  // Inner view mode from CenterViewPanel (for KPI animation)
  // This tracks what tab is selected INSIDE the mountain panel
  const [innerViewMode, setInnerViewMode] = useState<"terrain" | "impact" | "compare">("terrain");
  
  // GOD MODE: Header-controlled view mode (navigation tabs in header)
  const [headerViewMode, setHeaderViewMode] = useState<HeaderViewMode>("terrain");

  // BASELINE: canonical provider — used for gating other modules
  const { baseline: systemBaseline } = useSystemBaseline();
  const hasBaseline = !!systemBaseline;
  
  // GOD MODE: Monte Carlo Simulation Overlay
  const [showSimulate, setShowSimulate] = useState(false);
  
  // GOD MODE: Save/Load Simulation Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  
  // GOD MODE: Terrain toggles (moved from CenterViewPanel to header)
  const [timelineEnabled, setTimelineEnabled] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  
  // KPI Section - ALWAYS VISIBLE (GOD MODE RULE: KPI line must always be shown)
  // Locked to "visible" - never hide the command bridge telemetry
  const kpiAnimState = "visible" as const;
  
  // ORACLE PROTOCOL: focusedLever tracked in ControlDeck and AIIntelligenceEnhanced
  // No dimming overlay - screen stays 100% lit at all times
  
  // GOD MODE RULE: KPI Section is ALWAYS VISIBLE
  // No hiding, no animations, no exceptions - telemetry must always be shown
  // (Previously had garage door animation that hid KPIs on non-terrain views)
  // This is now disabled - KPIs stay visible on ALL views

  // Persist centerView to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(CENTER_VIEW_KEY, centerView);
    } catch {}
  }, [centerView]);

  // Investor Pitch Mode - auto-applies investor-ready configuration
  const [pitchMode, setPitchMode] = useState(false);
  const baseLeversRef = useRef<LeverState>(INITIAL_LEVERS);

  // Set data attribute for CSS styling based on current view
  useEffect(() => {
    document.documentElement.setAttribute("data-sf-mode", centerView);
    return () => {
      document.documentElement.removeAttribute("data-sf-mode");
    };
  }, [centerView]);

  // Global navigation + simulation trigger (used by empty states across tabs)
  useEffect(() => {
    const onNav = (evt: Event) => {
      const detail = (evt as CustomEvent).detail;
      const id = String(detail ?? "").trim();
      if (!id) return;

      if (id === "simulate") {
        // Simulation is a separate tool (overlay). Opening it also shows real progress.
        setShowSimulate(true);
        return;
      }

      // Allow modules to request navigation by id
      if (
        id === "initialize" ||
        id === "terrain" ||
        id === "compare" ||
        id === "risk" ||
        id === "valuation" ||
        id === "impact" ||
        id === "simulate"
      ) {
        setHeaderViewMode(id as any);
      }
    };

    window.addEventListener("stratfit:navigate", onNav as EventListener);
    return () => window.removeEventListener("stratfit:navigate", onNav as EventListener);
  }, []);

  
  // Handle scenario change from old selector
  const handleScenarioChange = useCallback((newScenario: ScenarioId) => {
    setScenario(newScenario);
  }, []);

  // Handle new scenario type change with presets
  const handleScenarioTypeChange = useCallback((newType: ScenarioType) => {
    setActiveScenarioType(newType);
    
    // Apply preset levers for this scenario
    const presets = SCENARIO_PRESETS[newType];
    setLevers(presets);
    
    // Map to old scenario ID for compatibility
    const mappedScenario = mapScenarioTypeToId(newType);
    setScenario(mappedScenario);
    
    // CRITICAL: Also update the global store so mountain changes color
    useScenarioStore.getState().setScenario(mappedScenario);
    
    // Emit causal event for visual feedback
    emitCausal({
      source: "scenario_switch",
      bandStyle: "wash",
      color: "rgba(34,211,238,0.18)",
    });
  }, []);

  // Investor Pitch Mode effect - auto-apply investor-ready plan
  useEffect(() => {
    if (pitchMode) {
      // Store current levers as base for restoration
      baseLeversRef.current = { ...levers };
      
      // Find and apply investor-ready plan
      const plan = findInvestorPlan(levers, scenario);
      if (plan && plan.final) {
        setLevers(plan.final.levers);
        setSolverPath(plan.path);
        
        // Push to store for mountain visualization
        const pathPoints = plan.path.map(step => ({
          riskIndex: step.kpis.riskIndex,
          enterpriseValue: step.kpis.enterpriseValue,
          runway: step.kpis.runway,
        }));
        useScenarioStore.getState().setSolverPath(pathPoints);
        
        emitCausal({
          source: "scenario_switch",
          bandStyle: "wash",
          color: "rgba(168,85,247,0.35)", // Purple for investor mode
        });
      }
    } else {
      // When exiting pitch mode, clear solver path
      setSolverPath([]);
      useScenarioStore.getState().setSolverPath([]);
    }
  }, [pitchMode, scenario]);

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
    engineResults,
    setSolverPathInStore,
    strategies,
    saveStrategy,
    setCurrentLevers,
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
      engineResults: s.engineResults,
      setSolverPathInStore: s.setSolverPath,
      strategies: s.strategies,
      saveStrategy: s.saveStrategy,
      setCurrentLevers: s.setCurrentLevers,
    }))
  );

  // Current scenario's KPIs for viability check
  const currentKpis = engineResults?.[scenario]?.kpis;
  const viable = isViable(currentKpis);

  // Sync current levers to store for strategy saving (use debounced to reduce store updates)
  useEffect(() => {
    setCurrentLevers(debouncedLevers as import('@/state/scenarioStore').LeverSnapshot);
  }, [debouncedLevers, setCurrentLevers]);

  // Handle save strategy
  const handleSaveStrategy = useCallback(() => {
    const name = prompt("Strategy name:", `Strategy ${strategies.length + 1}`);
    if (name) {
      saveStrategy(name);
      emitCausal({
        source: "scenario_switch",
        bandStyle: "wash",
        color: "rgba(52,211,153,0.25)",
      });
    }
  }, [saveStrategy, strategies.length]);

  // Local solver path state (for UI display)
  const [solverPath, setSolverPath] = useState<SolverPathStep[]>([]);
  const [riskTradeoff, setRiskTradeoff] = useState(0.5); // 0 = safer, 1 = aggressive

  // Solver handlers with path recording
  const applySolverResult = useCallback((
    result: SolverResult | null, 
    successColor: string, 
    failMsg: string
  ) => {
    if (result && result.final) {
      setLevers(result.final.levers);
      setSolverPath(result.path);
      
      // Push simplified path to store for mountain visualization
      const pathPoints = result.path.map(step => ({
        riskIndex: step.kpis.riskIndex,
        enterpriseValue: step.kpis.enterpriseValue,
        runway: step.kpis.runway,
      }));
      setSolverPathInStore(pathPoints);
      
      emitCausal({
        source: "scenario_switch",
        bandStyle: "wash",
        color: successColor,
      });
    } else {
      console.warn(failMsg);
      setSolverPath([]);
      setSolverPathInStore([]);
    }
  }, [setSolverPathInStore]);

  const handleFindViable = useCallback(() => {
    applySolverResult(
      findViableScenario(levers, scenario),
      "rgba(52,211,153,0.25)",
      "Could not find a viable configuration"
    );
  }, [levers, scenario, applySolverResult]);

  const handleFastestTo100M = useCallback(() => {
    applySolverResult(
      findFastestTo100M(levers, scenario),
      "rgba(250,204,21,0.25)", // Gold for ambitious
      "Could not find a path to $100M valuation"
    );
  }, [levers, scenario, applySolverResult]);

  const handleLowestRisk = useCallback(() => {
    applySolverResult(
      findLowestRisk(levers, scenario),
      "rgba(96,165,250,0.25)", // Blue for safety
      "Could not find a low-risk configuration"
    );
  }, [levers, scenario, applySolverResult]);

  const handleInvestorPlan = useCallback(() => {
    applySolverResult(
      findInvestorPlan(levers, scenario),
      "rgba(168,85,247,0.25)", // Purple for VC
      "Could not find an investor-acceptable configuration"
    );
  }, [levers, scenario, applySolverResult]);

  const handleTradeoffChange = useCallback((value: number) => {
    setRiskTradeoff(value);
    const result = findTradeoffPlan(levers, scenario, value);
    if (result && result.final) {
      setLevers(result.final.levers);
      setSolverPath(result.path);
      emitCausal({
        source: "scenario_switch",
        bandStyle: "wash",
        color: `rgba(${Math.round(255 * value)},${Math.round(180 - 80 * value)},${Math.round(120 + 130 * (1 - value))},0.25)`,
      });
    }
  }, [levers, scenario]);

  // Clear solver path when levers change manually
  useEffect(() => {
    // Only clear if we have a path (to avoid clearing on initial load)
    // Use debounced levers to avoid clearing path during drag
    if (solverPath.length > 0) {
      // Check if current levers differ from the final solver step
      const finalLevers = solverPath[solverPath.length - 1]?.levers;
      if (finalLevers && JSON.stringify(debouncedLevers) !== JSON.stringify(finalLevers)) {
        setSolverPath([]);
        setSolverPathInStore([]);
      }
    }
  }, [debouncedLevers, solverPath, setSolverPathInStore]);

  // 🚀 Use debounced levers for expensive calculations (prevents stutter)
  const metrics = useMemo(() => calculateMetrics(debouncedLevers, scenario), [debouncedLevers, scenario]);
  const dataPoints = useMemo(() => metricsToDataPoints(metrics), [metrics]);

  useEffect(() => {
    setDataPoints(dataPoints);
  }, [dataPoints, setDataPoints]);

  useEffect(() => {
    setScenarioInStore(scenario);
  }, [scenario, setScenarioInStore]);

  // ✅ Always populate engineResults for all scenarios (so Variances can compare)
  useEffect(() => {
    // buildEngineResult must be deterministic from (levers, scenarioId)
    function buildEngineResultForScenario(sid: ScenarioId) {
      const m = calculateMetrics(throttledLevers, sid);
      if (sid === (activeScenarioId ?? "base")) {
        console.log("[IG] engine recompute for active", sid, {
          demand: throttledLevers.demandStrength,
          pricing: throttledLevers.pricingPower,
          momentum: (m as any)?.momentum,
          riskIndex: (m as any)?.riskIndex,
        });
      }
      console.log("[IG] sid", sid, "momentum", (m as any)?.momentum, "riskIndex", (m as any)?.riskIndex);

      // --- EVERYTHING BELOW HERE is your existing KPI derivation logic ---
      // Replace references to `metrics` with `m`
      // Replace references to `scenario` with `sid`
      // Keep using store baseKpis comparisons if you want.

      const cashRaw =
        (m as any)?.cashPosition ??
        (m as any)?.cash ??
        (m as any)?.cashBalance ??
        (m as any)?.cashOnHand ??
        (m as any)?.balanceSheet?.cash ??
        (m as any)?.series?.cash?.[0] ??
        (m as any)?.timeline?.cash?.[0] ??
        0;

      const cashValue = Number.isFinite(cashRaw) ? Number(cashRaw) : 0;
      const cashValueDollars = cashValue > 0 && cashValue < 1_000_000 ? cashValue * 1_000_000 : cashValue;

      const arrCurrent = (m.momentum / 10) * 1_000_000;
      const growthRate = Math.max(-0.5, Math.min(0.8, (m.momentum - 50) * 0.006));
      const arrNext12 = arrCurrent * (1 + growthRate);
      const arrGrowth = deriveArrGrowth({ arrCurrent, arrNext12 });

      const avgRevenuePerCustomer = 12_000;
      const grossMargin = 0.74;
      const annualChurn = 0.12;

      const burn = m.burnQuality * 1000; // monthly burn in dollars
      const marketingSpend = burn * 0.45;

      // ✅ TRUTH: Runway = cashflow survival (single source)
      // First month where cumulative cash < 0 = cash / burn
      const runwaySurvivalMonths = burn > 0 ? Math.floor(cashValueDollars / burn) : 999;

      const arrDeltaValue = arrGrowth.arrDelta ?? 0;
      const newCustomers = Math.max(1, arrDeltaValue / avgRevenuePerCustomer);

      const cac = marketingSpend / newCustomers;
      const ltv = (avgRevenuePerCustomer * grossMargin) / annualChurn;
      const cacPaybackMonths = (cac / (avgRevenuePerCustomer * grossMargin)) * 12;
      const ltvCac = ltv / cac;

      let cacScore = 0;
      let cacLabel = "Poor";
      if (ltvCac >= 5) cacScore += 50;
      else if (ltvCac >= 3) cacScore += 30;
      else if (ltvCac >= 2) cacScore += 15;

      if (cacPaybackMonths <= 12) cacScore += 50;
      else if (cacPaybackMonths <= 18) cacScore += 30;
      else if (cacPaybackMonths <= 24) cacScore += 15;

      if (cacScore >= 70) cacLabel = "Strong";
      else if (cacScore >= 40) cacLabel = "Moderate";

      let growthRisk = 0;
      if (ltvCac < 2) growthRisk += 15;
      if (cacPaybackMonths > 24) growthRisk += 15;
      if (cacPaybackMonths > 36) growthRisk += 10;

      const adjustedRiskIndex = Math.min(100, Math.max(0, m.riskIndex + growthRisk));

      const targetRunway = 24;
      const safeCac = (cashValueDollars / targetRunway) / newCustomers;

      const growthStress = Math.min(1, (1 / Math.max(1, ltvCac)) + (cacPaybackMonths / 36));

      const kpis = {
        runway: { value: runwaySurvivalMonths, display: `${runwaySurvivalMonths} mo` },
        cashPosition: { value: cashValueDollars, display: `$${(cashValueDollars / 1_000_000).toFixed(1)}M` },
        momentum: { value: m.momentum, display: `$${(m.momentum / 10).toFixed(1)}M` },
        arrCurrent: { value: arrCurrent, display: formatUsdCompact(arrCurrent) },
        arrNext12: { value: arrNext12, display: formatUsdCompact(arrNext12) },
        arrDelta: { value: arrGrowth.arrDelta ?? 0, display: arrGrowth.displayDelta },
        arrGrowthPct: { value: arrGrowth.arrGrowthPct ?? 0, display: arrGrowth.displayPct },
        burnQuality: { value: m.burnQuality, display: `$${Math.round(m.burnQuality)}K` },
        // riskIndex = health (higher = healthier) - keep for internal calculations
        riskIndex: { value: adjustedRiskIndex, display: `${Math.round(adjustedRiskIndex)}/100` },
        // riskScore = danger (higher = more dangerous) - use for UI display
        riskScore: { value: 100 - adjustedRiskIndex, display: `${Math.round(100 - adjustedRiskIndex)}/100` },
        earningsPower: { value: m.earningsPower, display: `${Math.round(m.earningsPower)}%` },
        enterpriseValue: { value: m.enterpriseValue, display: `$${(m.enterpriseValue / 10).toFixed(1)}M` },
        cac: { value: cac, display: `$${Math.round(cac).toLocaleString()}` },
        cacPayback: { value: cacPaybackMonths, display: `${Math.round(cacPaybackMonths)} mo` },
        ltvCac: { value: ltvCac, display: `${ltvCac.toFixed(1)}x` },
        cacQuality: { value: cacScore, display: cacLabel },
        safeCac: { value: safeCac, display: `$${Math.round(safeCac).toLocaleString()}` },
        growthStress: { value: growthStress, display: `${Math.round(growthStress * 100)}%` },
      };

      // ✅ QUALITY SCORE: Canonical composite (locked formula)
      const qualityScore = getQualityScoreFromKpis(kpis);
      const qualityBand = getQualityBandFromKpis(kpis);
      (kpis as any).qualityScore = { value: qualityScore, display: `${Math.round(qualityScore * 100)}%` };
      (kpis as any).qualityBand = { value: qualityBand === "green" ? 1 : qualityBand === "amber" ? 0.5 : 0, display: qualityBand.toUpperCase() };

      // Compare to base (once base exists this becomes meaningful)
      const baseKpis = useScenarioStore.getState().engineResults?.base?.kpis;

      function pctDelta(current: number, baseline: number | undefined) {
        if (!baseline || baseline === 0) return 0;
        return ((current - baseline) / Math.abs(baseline)) * 100;
      }

      const cacDelta = pctDelta(cac, baseKpis?.cac?.value);
      const paybackDelta = pctDelta(cacPaybackMonths, baseKpis?.cacPayback?.value);
      const ltvCacDelta = pctDelta(ltvCac, baseKpis?.ltvCac?.value);

      let growthQuality = "neutral";
      if (cacDelta < -10 && ltvCacDelta > 10) growthQuality = "strong";
      if (cacDelta > 10 || ltvCacDelta < -10) growthQuality = "weak";

      let capitalEfficiency = "stable";
      if (paybackDelta < -15) capitalEfficiency = "improving";
      if (paybackDelta > 15) capitalEfficiency = "deteriorating";

      const cfoSummary = `Customer economics in this scenario show ${growthQuality} growth quality.

Customer acquisition cost ${cacDelta < 0 ? "fell" : "rose"} by ${Math.abs(cacDelta).toFixed(0)}%, while LTV/CAC ${ltvCacDelta > 0 ? "improved" : "deteriorated"} by ${Math.abs(ltvCacDelta).toFixed(0)}%.

Capital recovery time is ${capitalEfficiency}, with CAC payback ${paybackDelta < 0 ? "shortening" : "lengthening"}.

This materially ${growthQuality === "strong" ? "strengthens" : growthQuality === "weak" ? "weakens" : "maintains"} the company's ability to scale without external capital pressure.`;

      const engineResult = { kpis, ai: { summary: cfoSummary } };

      // Contract enforcement (keep)
      if (!engineResult?.kpis?.cashPosition || typeof engineResult.kpis.cashPosition.value !== "number") {
        throw new Error("ENGINE CONTRACT VIOLATION: cashPosition missing");
      }

      return engineResult;
    }

    // ✅ Populate all scenarios every time throttledLevers changes
    for (const sid of ALL_SCENARIOS) {
      const engineResult = buildEngineResultForScenario(sid);
      setEngineResult(sid, engineResult);
      if (sid === (activeScenarioId ?? "base")) {
        const snap = useScenarioStore.getState().engineResults?.[sid]?.kpis;
        console.log("[IG] engineResults stored for active", sid, {
          runway: snap?.runway?.value,
          arrGrowth: snap?.arrGrowthPct?.value,
          risk: snap?.riskScore?.value,
          quality: (snap as any)?.qualityScore?.value,
        });
      }
    }
  }, [throttledLevers, setEngineResult]);
    
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
        title: "GROWTH VECTOR",
        sliders: [
          { 
            id: "revenueGrowth" as LeverId, 
            label: "Demand Strength", 
            value: immediateLevers.demandStrength, 
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
            value: immediateLevers.pricingPower, 
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
            value: immediateLevers.expansionVelocity, 
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
        title: "OPERATIONAL ENGINE",
        sliders: [
          { 
            id: "operatingExpenses" as LeverId, 
            label: "Cost Discipline", 
            value: immediateLevers.costDiscipline, 
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
            value: immediateLevers.hiringIntensity, 
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
            value: immediateLevers.operatingDrag, 
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
        title: "RISK PRESSURE",
        sliders: [
          { 
            id: "churnSensitivity" as LeverId, 
            label: "Market Volatility", 
            value: immediateLevers.marketVolatility, 
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
            value: immediateLevers.executionRisk, 
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

    // Data view: fewer sliders (only key controls)
    if (viewMode === "data") {
      return boxes.map(box => ({
        ...box,
        sliders: box.sliders.slice(0, 2) // Only first 2 sliders per group
      }));
    }

    return boxes;
  }, [immediateLevers, viewMode]);

  // Full-page Initialize Baseline: render inline (no redirect, no page reload).
  // Baseline is always editable — no lock state.
  if (headerViewMode === "initialize") {
    return (
      <div className="app">
        <MainNav
          activeScenario={{
            name: activeScenarioType ?? "New Scenario",
            lastModified: "Active",
          }}
          activeItemId="initialize"
          onNavigate={(id) => {
            if (id === "assessment") return window.location.assign("/assessment");
            setHeaderViewMode(
              id === "initialize" ? "initialize"
              : id === "simulate" ? "simulate"
              : id === "valuation" ? "valuation"
              : id === "compare" ? "compare"
              : id === "risk" ? "risk"
              : id === "impact" ? "impact"
              : "terrain"
            );
            setShowSimulate(false);
          }}
          onSave={() => setShowSaveModal(true)}
          onLoad={() => setShowLoadPanel(true)}
          onExport={() => console.log("Export")}
          onShare={() => console.log("Share")}
        />
        <InitializeBaselinePage />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STRATEGY STUDIO — Institutional God Mode 3-zone layout
  // Replaces the old 3-column ControlDeck/CenterViewPanel/AIPanel layout
  // ══════════════════════════════════════════════════════════════════════════
  if (headerViewMode === "simulate") {
    return (
      <div className="app">
        <MainNav
          activeScenario={{
            name: activeScenarioType ?? "New Scenario",
            lastModified: "Active",
          }}
          activeItemId="simulate"
          onNavigate={(id) => {
            setShowSimulate(false);
            if (id === "initialize") return setHeaderViewMode("initialize");
            if (id === "simulate") return setHeaderViewMode("simulate");
            if (id === "valuation") return setHeaderViewMode("valuation");
            if (id === "compare") return setHeaderViewMode("compare");
            if (id === "risk") return setHeaderViewMode("risk");
            if (id === "assessment") return window.location.assign("/assessment");
            return setHeaderViewMode("terrain");
          }}
          onSave={() => setShowSaveModal(true)}
          onLoad={() => setShowLoadPanel(true)}
          onExport={() => console.log("Export")}
          onShare={() => console.log("Share")}
        />
        <StrategyStudioPage
          levers={levers}
          setLevers={setLevers}
          scenario={scenario}
          dataPoints={dataPoints}
          onSimulateRequest={() => setShowSimulate(true)}
        />
        {/* Monte Carlo Overlay (still accessible) */}
        <SimulateOverlay
          isOpen={showSimulate}
          onClose={() => setShowSimulate(false)}
          levers={levers}
        />
        <SaveSimulationModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSaved={(id) => {
            console.log('Simulation saved:', id);
            emitCausal({ source: "simulation_saved", bandStyle: "solid", color: "rgba(34, 211, 153, 0.3)" });
          }}
        />
        <LoadSimulationPanel
          isOpen={showLoadPanel}
          onClose={() => setShowLoadPanel(false)}
          onLoad={(simulation) => {
            console.log('Simulation loaded:', simulation.name);
            emitCausal({ source: "simulation_loaded", bandStyle: "solid", color: "rgba(34, 211, 238, 0.3)" });
          }}
        />
        {/* Telemetry ribbon — visible across all views */}
        <SimulationTelemetryRibbon />
        {/* Pro detail drawer — gated (pro/enterprise only) */}
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 800, width: 380 }}>
          <ProDetailDrawer />
        </div>

        {/* ── RECALIBRATION STAGE ISOLATION ── */}
        <div className={`recalibration-dim-veil${isSimulatingGlobal ? ' active' : ''}`} />
        <div className={`recalibration-signal${isSimulatingGlobal ? ' active' : ''}`}>
          Recalculating structural behaviour…
        </div>
      </div>
    );
  }
  
  return (
    <div className="app">
      {/* MAIN NAV (5 items) */}
      <MainNav
        activeScenario={{
          name: activeScenarioType ?? "New Scenario",
          lastModified: "Active",
        }}
        activeItemId={
          headerViewMode === "valuation"
            ? "valuation"
            : headerViewMode === "compare"
              ? "compare"
              : headerViewMode === "risk"
                ? "risk"
                : headerViewMode === "impact"
                  ? "impact"
                  : headerViewMode === "assessment"
                    ? "assessment"
                    : (headerViewMode as string) === "simulate"
                      ? "simulate"
                      : "terrain"
        }
        onNavigate={(id) => {
          // close overlay if user navigates elsewhere
          setShowSimulate(false);
          if (id === "initialize") return setHeaderViewMode("initialize");
          if (id === "simulate") return setHeaderViewMode("simulate");
          if (id === "valuation") return setHeaderViewMode("valuation");
          if (id === "compare") return setHeaderViewMode("compare");
          if (id === "risk") return setHeaderViewMode("risk");
          if (id === "impact") return setHeaderViewMode("impact");
          if (id === "assessment") return window.location.assign("/assessment");
          return setHeaderViewMode("terrain");
        }}
        onSave={() => setShowSaveModal(true)}
        onLoad={() => setShowLoadPanel(true)}
        onExport={() => console.log("Export")}
        onShare={() => console.log("Share")}
      />

      {/* OPTION 1: UNIFIED 3-COLUMN LAYOUT (Compare mode = full-width center only) */}
      <div className={`main-content mode-${headerViewMode}`}>
        
        {/* CENTER COLUMN: KPIs + Mountain OR Scenario Impact OR Variances */}
        <main className="center-column">
          {/* KPI COMMAND BRIDGE — Avionics strip visible on Terrain view */}
          {headerViewMode === 'terrain' && (
            <OrbitalKPISection kpiAnimState={kpiAnimState} />
          )}
          
          
          {/* BASELINE GATING — inline panel when baseline is missing */}
          {!hasBaseline ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '400px', padding: '3rem',
              background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))',
              border: '1px solid rgba(100,116,139,0.2)', borderRadius: '1rem',
              margin: '2rem auto', maxWidth: '520px',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
                border: '1px solid rgba(139,92,246,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, color: 'rgba(165,143,255,0.9)',
              }}>◆</div>
              <h2 style={{
                fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600,
                fontSize: '1.25rem', color: 'rgba(226,232,240,0.95)',
                marginBottom: '0.75rem', letterSpacing: '-0.01em',
              }}>Baseline Required</h2>
              <p style={{
                fontFamily: "'Inter', system-ui, sans-serif", fontSize: '0.875rem',
                color: 'rgba(148,163,184,0.85)', textAlign: 'center',
                lineHeight: 1.6, marginBottom: '2rem', maxWidth: '360px',
              }}>
                Initialize your company's financial and operational truth to unlock the STRATFIT platform.
              </p>
              <button
                type="button"
                onClick={() => setHeaderViewMode("initialize")}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600,
                  fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '0.75rem 2rem', borderRadius: '0.5rem', border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; }}
              >
                Go to Initialize
              </button>
            </div>
          ) : (
            /* View content based on header navigation */
            <CenterViewPanel 
              viewMode={headerViewMode as "terrain" | "impact" | "compare" | "risk" | "valuation"}
              timelineEnabled={timelineEnabled}
              heatmapEnabled={heatmapEnabled}
              onSimulateRequest={() => setShowSimulate(true)}
            />
          )}
        </main>

        {/* RIGHT COLUMN: AI Intelligence — now handled by StrategyStudioPage when simulate */}
      </div>
      
      {/* MONTE CARLO SIMULATION OVERLAY */}
      <SimulateOverlay 
        isOpen={showSimulate} 
        onClose={() => setShowSimulate(false)}
        levers={levers}
      />
      
      {/* SAVE/LOAD SIMULATION MODALS */}
      <SaveSimulationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaved={(id) => {
          console.log('Simulation saved:', id);
          emitCausal({
            source: "simulation_saved",
            bandStyle: "solid",
            color: "rgba(34, 211, 153, 0.3)",
          });
        }}
      />
      <LoadSimulationPanel
        isOpen={showLoadPanel}
        onClose={() => setShowLoadPanel(false)}
        onLoad={(simulation) => {
          console.log('Simulation loaded:', simulation.name);
          emitCausal({
            source: "simulation_loaded",
            bandStyle: "solid",
            color: "rgba(34, 211, 238, 0.3)",
          });
        }}
      />

      {/* SIMULATION TELEMETRY RIBBON — top-right overlay (instrument readout) */}
      <SimulationTelemetryRibbon />

      {/* PRO DETAIL DRAWER — gated expandable (pro/enterprise only) */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 800, width: 380 }}>
        <ProDetailDrawer />
      </div>

      {/* ── RECALIBRATION STAGE ISOLATION ── */}
      <div className={`recalibration-dim-veil${isSimulatingGlobal ? ' active' : ''}`} />
      <div className={`recalibration-signal${isSimulatingGlobal ? ' active' : ''}`}>
        Recalculating structural behaviour…
      </div>
    </div>
  );
}
