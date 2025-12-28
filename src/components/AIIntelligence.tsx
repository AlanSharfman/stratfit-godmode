// src/components/AIIntelligence.tsx
// STRATFIT — AI Intelligence Engine + Strategic Questions
// Guided interrogation panel at bottom

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScenarioId } from "./ScenarioSlidePanel";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore, ViewMode } from "@/state/scenarioStore";
import StrategicQuestions from "./StrategicQuestions";

type TerrainDelta = {
  scenarioId: string;
  kpiDelta: Record<string, { from: number; to: number; delta: number }>;
  timestamp: number;
};

type InsightItem = {
  id: string;
  title: string;
  detail: string;
  severity?: "low" | "med" | "high";
};

type InsightsPayload = {
  observation: InsightItem[];
  risks: InsightItem[];
  actions: InsightItem[];
};

// ============================================================================
// KPI ALIASES + THRESHOLDS
// ============================================================================

const KPI_ALIASES: Record<string, string[]> = {
  runway: ["runway", "runwayMonths", "runway_months"],
  burnRate: ["burnRate", "burn_rate", "burn", "burnMonthly", "burn_per_month"],
  cashPosition: ["cashPosition", "cash", "cash_balance", "cashBalance"],
  riskScore: ["riskScore", "riskIndex", "risk", "risk_score"],
  arr: ["arr", "ARR", "annualRecurringRevenue"],
  grossMargin: ["grossMargin", "gm", "gross_margin"],
  enterpriseValue: ["enterpriseValue", "ev", "enterprise_value"],
};

const INSIGHT_THRESHOLDS = {
  runwayCritical: 6, // months
  runwayMaterialMove: 1, // months delta to mention
  burnMaterialMovePct: 0.05, // 5% change triggers mention
  riskHigh: 70, // score
  riskMaterialMove: 5, // points delta to mention
};

interface AIIntelligenceProps {
  commentary: string[];
  risks: string[];
  actions: string[];
  scenario: ScenarioId;

  /**
   * Canonical delta injected from upstream (preferred).
   * If present, this is treated as source-of-truth for insights.
   * Fallback remains: local delta derived from engineResults.
   */
  scenarioDelta?: TerrainDelta | null;
}

// ============================================================================
// TYPEWRITER HOOK - Military-style: constant rhythm, no pauses, smooth flow
// Uses RAF for buttery-smooth timing, no setTimeout jitter
// ============================================================================

function useTypewriter(
  text: string,
  baseSpeed: number = 12, // ms per character (12ms = ~83 chars/sec)
  enabled: boolean = true,
  canStart: boolean = true
) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Refs for RAF-based timing (avoids setTimeout drift/jitter)
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const indexRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !canStart) {
      if (!enabled) {
        setDisplayText("");
        setIsComplete(false);
        setHasStarted(false);
        indexRef.current = 0;
      }
      return;
    }

    // Reset state for new text
    setDisplayText("");
    setIsComplete(false);
    setHasStarted(true);
    indexRef.current = 0;
    lastTickRef.current = 0;

    // RAF-based typing loop - smooth, no jitter
    const tick = (now: number) => {
      // Initialize timestamp on first frame
      if (lastTickRef.current === 0) {
        lastTickRef.current = now;
      }

      const elapsed = now - lastTickRef.current;

      // Check if enough time has passed for next character
      if (elapsed >= baseSpeed) {
        // Calculate how many characters to type based on elapsed time
        // This handles frame drops gracefully
        const charsToType = Math.floor(elapsed / baseSpeed);
        const newIndex = Math.min(indexRef.current + charsToType, text.length);

        if (newIndex !== indexRef.current) {
          indexRef.current = newIndex;
          setDisplayText(text.slice(0, newIndex));
        }

        // Reset timer, accounting for any overshoot
        lastTickRef.current = now - (elapsed % baseSpeed);
      }

      // Continue or complete
      if (indexRef.current < text.length) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsComplete(true);
      }
    };

    // Start immediately - no initial delay
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [text, baseSpeed, enabled, canStart]);

  return { displayText, isComplete, hasStarted };
}

// ============================================================================
// AI SECTION COMPONENT - Typewriter font
// ============================================================================

function AISection({
  title,
  content,
  isAnalyzing,
  canStart,
  contentKey,
  speed,
  onComplete,
  isRiskSection = false,
}: {
  title: string;
  content: string;
  isAnalyzing: boolean;
  canStart: boolean;
  contentKey: number;
  speed: number;
  onComplete?: () => void;
  isRiskSection?: boolean;
}) {
  const { displayText, isComplete, hasStarted } = useTypewriter(
    content,
    speed,
    !isAnalyzing,
    canStart
  );

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  // Icons for each section type
  const sectionIcon =
    title === "OBSERVATION" ? (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ) : title === "RISKS" ? (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ) : (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );

  const headerClass = isRiskSection
    ? "risk-header"
    : title === "ACTIONS"
    ? "action-header"
    : "";

  return (
    <div className={`ai-section ${isRiskSection ? "risk-section" : ""}`}>
      <div className="section-header-row">
        <span className="section-icon">{sectionIcon}</span>
        <span className={`section-header ${headerClass}`}>{title}</span>
      </div>
      <div className="section-content typewriter-text">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.span
              key="analyzing"
              className="analyzing-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
            >
              Analyzing...
            </motion.span>
          ) : (
            <motion.span
              key={`text-${contentKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {hasStarted ? (
                <>
                  {displayText}
                  {!isComplete && <span className="cursor">▌</span>}
                </>
              ) : (
                <span className="waiting">_</span>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
// ============================================================================
// AI CONTENT BASED ON VIEW MODE
// ============================================================================

function getAIContent(viewMode: ViewMode, scenario: ScenarioId) {
  if (viewMode === "operator") {
    return {
      observation:
        scenario === "extreme"
          ? "Runway has become the binding constraint. Cash position critical. Current burn rate unsustainable beyond 6-month horizon without intervention."
          : scenario === "downside"
          ? "Growth-to-efficiency ratio has deteriorated. Burn rate exceeds revenue scaling. Cost structure requires recalibration."
          : scenario === "upside"
          ? "Metrics trending above plan. Growth and efficiency aligned. Execution capacity adequate for current trajectory."
          : "Core metrics remain within operating tolerance. Cash position and runway are stable. Growth and efficiency are balanced, with no immediate pressure points.",

      risks:
        scenario === "extreme"
          ? "Limited runway eliminates margin for error. Any execution miss compounds into structural deficit. Optionality severely constrained."
          : scenario === "downside"
          ? "Cost discipline has eroded. Hiring velocity inconsistent with revenue base. Cash sensitivity elevated."
          : scenario === "upside"
          ? "Scaling velocity may outpace operational capacity. Key dependencies emerging in critical functions."
          : "Sustained growth acceleration would increase execution complexity. Hiring velocity and cost discipline require continued monitoring. External market volatility remains a secondary risk.",

      action:
        scenario === "extreme"
          ? "Reduce burn 25-30% within 30 days. Narrow to single growth vector. Extend runway to 18+ months before any expansion."
          : scenario === "downside"
          ? "Freeze discretionary hiring. Tighten operating expense controls. Preserve optionality for next 2 quarters."
          : scenario === "upside"
          ? "Accelerate proven channels. Secure critical talent. Evaluate opportunistic capital raise."
          : "Maintain current operating posture. Continue weekly metric review cadence. No structural changes required at this time.",
    };
  } else {
    return {
      observation:
        scenario === "extreme"
          ? "Portfolio company runway critically constrained. Capital efficiency below sustainable threshold. Deployment risk elevated."
          : scenario === "downside"
          ? "Growth-to-efficiency pressure emerging. Current trajectory requires recalibration within next quarter."
          : scenario === "upside"
          ? "Metrics exceeding plan assumptions. Unit economics remain sustainable. Investment thesis intact."
          : "Metrics within expected range. Deployment efficiency acceptable for stage. No anomalies detected.",

      risks:
        scenario === "extreme"
          ? "Material risk concentration. Downside probability increased. Execution margin minimal."
          : scenario === "downside"
          ? "Margin compression evident. Burn rate inconsistent with model assumptions."
          : scenario === "upside"
          ? "Execution scaling risk present. Valuation may exceed near-term fundamentals."
          : "Risk factors within normal distribution. No material concerns at current levels.",

      action:
        scenario === "extreme"
          ? "Prioritize capital preservation. Restructure before additional deployment. Board engagement advised."
          : scenario === "downside"
          ? "Shift to monthly monitoring. Milestone-based capital release. Request response plan."
          : scenario === "upside"
          ? "Evaluate follow-on at current terms. Monitor for overheating indicators."
          : "Quarterly monitoring cadence sufficient. No portfolio action required.",
    };
  }
}

// ============================================================================
// RULES ENGINE - Build insights from terrain deltas
// ============================================================================

function getDelta(
  delta: TerrainDelta | null,
  canonicalKey: keyof typeof KPI_ALIASES
) {
  const aliases = KPI_ALIASES[canonicalKey] ?? [canonicalKey as string];
  for (const k of aliases) {
    const v = delta?.kpiDelta?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
}

function buildInsightsFromDelta(delta: TerrainDelta | null): InsightsPayload {
  if (!delta) {
    return { observation: [], risks: [], actions: [] };
  }

  const obs: InsightItem[] = [];
  const risks: InsightItem[] = [];
  const acts: InsightItem[] = [];

  // ---- Runway (material move gating) ----
  const runway = getDelta(delta, "runway");
  if (runway && Math.abs(runway.delta) >= INSIGHT_THRESHOLDS.runwayMaterialMove) {
    obs.push({
      id: "runway-change",
      title: `Runway ${runway.delta < 0 ? "compressed" : "extended"}`,
      detail: `Runway moved from ${runway.from} to ${runway.to} (${
        runway.delta > 0 ? "+" : ""
      }${runway.delta}).`,
      severity: runway.delta < 0 ? "med" : "low",
    });

    if (runway.to <= INSIGHT_THRESHOLDS.runwayCritical) {
      risks.push({
        id: "runway-critical",
        title: "Runway approaching critical threshold",
        detail: `Runway is now ${runway.to}. Liquidity risk rises sharply below ~${INSIGHT_THRESHOLDS.runwayCritical} months.`,
        severity: "high",
      });
      acts.push({
        id: "runway-action",
        title: "Stabilise runway immediately",
        detail:
          "Freeze discretionary spend, review burn drivers, and validate near-term revenue commitments. Prioritise actions that add 60–90 days runway.",
        severity: "high",
      });
    }
  }

  // ---- Burn Rate (percentage-based gating) ----
  const burn = getDelta(delta, "burnRate");
  if (burn && burn.from) {
    const pct = (burn.to - burn.from) / Math.max(Math.abs(burn.from), 1);
    if (Math.abs(pct) >= INSIGHT_THRESHOLDS.burnMaterialMovePct) {
      obs.push({
        id: "burn-change",
        title: `Burn ${burn.delta > 0 ? "increased" : "decreased"}`,
        detail: `Burn moved from ${burn.from} to ${burn.to} (${
          burn.delta > 0 ? "+" : ""
        }${burn.delta}, ${(pct * 100).toFixed(1)}%).`,
        severity: burn.delta > 0 ? "med" : "low",
      });

      if (burn.delta > 0) {
        risks.push({
          id: "burn-pressure",
          title: "Burn pressure rising",
          detail:
            "Higher burn reduces margin for execution error. If sustained, this will compress runway and constrain strategic flexibility.",
          severity: "med",
        });
        acts.push({
          id: "burn-mitigation",
          title: "Identify the burn driver",
          detail:
            "Segment burn into: headcount, hosting/tools, marketing, and overhead. Target the fastest reversible driver first.",
          severity: "med",
        });
      }
    }
  }

  // ---- Risk Score (material move gating) ----
  const risk = getDelta(delta, "riskScore");
  if (risk && Math.abs(risk.delta) >= INSIGHT_THRESHOLDS.riskMaterialMove) {
    const isHigh = risk.to >= INSIGHT_THRESHOLDS.riskHigh;
    risks.push({
      id: "risk-up",
      title: risk.delta > 0 ? "Risk score deteriorated" : "Risk score improved",
      detail: `Risk moved from ${risk.from} to ${risk.to} (${
        risk.delta > 0 ? "+" : ""
      }${risk.delta}).`,
      severity: isHigh ? "high" : "med",
    });

    if (risk.delta > 0) {
      acts.push({
        id: "risk-plan",
        title: "Reduce top 1–2 risk drivers",
        detail:
          "Pick the two highest contributors (market, execution, concentration, cash). Define mitigation owners + next review date.",
        severity: isHigh ? "high" : "med",
      });
    }
  }

  // Fallback if nothing matched (still deterministic)
  if (obs.length === 0 && risks.length === 0 && acts.length === 0) {
    obs.push({
      id: "no-material",
      title: "No material delta detected",
      detail:
        "Inputs changed, but KPI deltas did not pass thresholds for a strategic note.",
      severity: "low",
    });
  }

  return { observation: obs, risks, actions: acts };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIIntelligence({
  commentary,
  risks,
  actions,
  scenario,
  scenarioDelta,
}: AIIntelligenceProps) {
  const [contentKey, setContentKey] = useState(0);
  const [isProcessingQuestion, setIsProcessingQuestion] = useState(false);
  const [customResponse, setCustomResponse] = useState<{
    observation: string;
    risk: string;
    action: string;
  } | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  // Sequential typing state
  const [observationComplete, setObservationComplete] = useState(false);
  const [risksComplete, setRisksComplete] = useState(false);

  // Consolidated store selectors to prevent rerender cascades
  const {
    viewMode,
    activeLeverId,
    setHoveredKpiIndex,
    engineResults,
    activeScenarioId,
  } = useScenarioStore(
    useShallow((s) => ({
      viewMode: s.viewMode,
      activeLeverId: s.activeLeverId,
      setHoveredKpiIndex: s.setHoveredKpiIndex,
      engineResults: s.engineResults,
      activeScenarioId: s.activeScenarioId,
    }))
  );

  // Terrain delta tracking
  const previousEngineResultsRef = useRef<any>(null);
  const previousKpisRef = useRef<Record<string, number> | null>(null);
  const previousKpisSigRef = useRef<string>("");

  const [terrainDelta, setTerrainDelta] = useState<TerrainDelta | null>(null);
  const [insights, setInsights] = useState<InsightsPayload>({
    observation: [],
    risks: [],
    actions: [],
  });

  const isAnalyzing = activeLeverId !== null || isProcessingQuestion;

  useEffect(() => {
    setContentKey((k) => k + 1);
    setCustomResponse(null);
    // Reset sequential state
    setObservationComplete(false);
    setRisksComplete(false);
  }, [scenario, viewMode]);

  // Reset sequential state when analyzing
  useEffect(() => {
    if (isAnalyzing) {
      setObservationComplete(false);
      setRisksComplete(false);
    }
  }, [isAnalyzing]);

  // Keep internal refs sane when scenario changes
  useEffect(() => {
    previousEngineResultsRef.current = null;
    previousKpisRef.current = null;
    previousKpisSigRef.current = "";
  }, [activeScenarioId]);

  // NEW: Prefer canonical upstream scenarioDelta when provided
  useEffect(() => {
    if (!scenarioDelta) return;

    setTerrainDelta((prev) => {
      if (!prev) return scenarioDelta;
      if (
        prev.timestamp === scenarioDelta.timestamp &&
        prev.scenarioId === scenarioDelta.scenarioId
      ) {
        return prev;
      }
      return scenarioDelta;
    });
  }, [scenarioDelta]);

  // Current KPI snapshot (do NOT memo on engineResults identity; lever moves already re-render via activeLeverId)
  const currentKpis: Record<string, unknown> | null =
    activeScenarioId && engineResults?.[activeScenarioId]?.kpis
      ? engineResults[activeScenarioId].kpis
      : null;

  // Build a stable signature that changes when KPI values change (even if engineResults is mutated in-place)
  const currentKpisSignature = useMemo(() => {
    if (!activeScenarioId || !currentKpis) return "";

    const keys = Object.keys(currentKpis).sort();
    // Fixed precision for signature stability; numeric coercion only
    return keys
      .map((k) => {
        const raw = (currentKpis as any)[k];
        const n = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(n)) return `${k}:NaN`;
        return `${k}:${n.toFixed(6)}`;
      })
      .join("|");
    // IMPORTANT: include activeLeverId to recompute while dragging, even if store mutates in place
  }, [activeScenarioId, activeLeverId, currentKpis]);

  // Terrain delta tracking effect (fallback only; bypass when scenarioDelta is provided)
  useEffect(() => {
    if (scenarioDelta) {
      // Still update ref so fallback is sane if upstream delta is removed later.
      previousEngineResultsRef.current = engineResults;
      return;
    }

    if (!activeScenarioId) return;
    if (!currentKpis) return;

    // If signature hasn't changed, nothing to do.
    if (currentKpisSignature && currentKpisSignature === previousKpisSigRef.current) {
      return;
    }

    const prevKpis = previousKpisRef.current;

    // First snapshot — just store and wait for next change.
    if (!prevKpis) {
      const snapshot: Record<string, number> = {};
      for (const k of Object.keys(currentKpis)) {
        const raw = (currentKpis as any)[k];
        const n = typeof raw === "number" ? raw : Number(raw);
        if (Number.isFinite(n)) snapshot[k] = n;
      }
      previousKpisRef.current = snapshot;
      previousKpisSigRef.current = currentKpisSignature;
      previousEngineResultsRef.current = engineResults;
      return;
    }

    const kpiDelta: TerrainDelta["kpiDelta"] = {};

    for (const key of Object.keys(currentKpis)) {
      const raw = (currentKpis as any)[key];
      const to = typeof raw === "number" ? raw : Number(raw);
      const from = prevKpis[key];

      if (typeof from === "number" && Number.isFinite(to) && from !== to) {
        kpiDelta[key] = { from, to, delta: to - from };
      }
    }

    if (Object.keys(kpiDelta).length > 0) {
      setTerrainDelta({
        scenarioId: activeScenarioId,
        kpiDelta,
        timestamp: Date.now(),
      });
    }

    // Update snapshots
    const nextSnapshot: Record<string, number> = {};
    for (const k of Object.keys(currentKpis)) {
      const raw = (currentKpis as any)[k];
      const n = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(n)) nextSnapshot[k] = n;
    }
    previousKpisRef.current = nextSnapshot;
    previousKpisSigRef.current = currentKpisSignature;
    previousEngineResultsRef.current = engineResults;
  }, [
    scenarioDelta,
    activeScenarioId,
    activeLeverId,
    currentKpisSignature,
    currentKpis,
    engineResults,
  ]);

  // Build insights from terrain delta
  useEffect(() => {
    setInsights(buildInsightsFromDelta(terrainDelta));
  }, [terrainDelta]);

  const defaultContent = useMemo(
    () => getAIContent(viewMode, scenario),
    [viewMode, scenario]
  );

  // Transform insights into lines for display
  const insightLines = useMemo(
    () => ({
      observation: insights.observation.map((x) => `${x.title}: ${x.detail}`),
      risks: insights.risks.map((x) => `${x.title}: ${x.detail}`),
      actions: insights.actions.map((x) => `${x.title}: ${x.detail}`),
    }),
    [insights]
  );

  // Use custom response if available, then insights if present, otherwise default
  const aiContent = useMemo(() => {
    if (customResponse) {
      return {
        observation: customResponse.observation,
        risks: customResponse.risk,
        action: customResponse.action,
      };
    }
    // If insights have content, use them
    if (
      insightLines.observation.length > 0 ||
      insightLines.risks.length > 0 ||
      insightLines.actions.length > 0
    ) {
      return {
        observation:
          insightLines.observation.join(" ") || defaultContent.observation,
        risks: insightLines.risks.join(" ") || defaultContent.risks,
        action: insightLines.actions.join(" ") || defaultContent.action,
      };
    }
    return defaultContent;
  }, [customResponse, defaultContent, insightLines]);

  // Typewriter speed - military comms style: constant, rapid, no hesitation
  // 14ms = ~71 chars/sec - fast but readable, like teletype output
  const typingSpeed = 14;

  // Stable callbacks for AISection to prevent re-renders
  const handleObservationComplete = useCallback(
    () => setObservationComplete(true),
    []
  );
  const handleRisksComplete = useCallback(() => setRisksComplete(true), []);

  // Handle strategic question click
  const handlePromptClick = useCallback(
    (
      response: { observation: string; risk: string; action: string },
      kpis: number[],
      constraint: string
    ) => {
      setIsProcessingQuestion(true);
      setShowQuestions(false); // Close questions panel

      // Brief analyzing state
      setTimeout(() => {
        setCustomResponse(response);
        setContentKey((k) => k + 1);
        setIsProcessingQuestion(false);

        // Highlight primary KPI
        if (kpis.length > 0) {
          setHoveredKpiIndex(kpis[0]);
          // Clear highlight after 4 seconds
          setTimeout(() => setHoveredKpiIndex(null), 4000);
        }
      }, 600);
    },
    [setHoveredKpiIndex]
  );

  const toggleQuestions = () => {
    setShowQuestions(!showQuestions);
  };
  return (
    <div className={`ai-panel ${viewMode}`}>
      <div className="panel-edge" />

      <div className="panel-header">
        <div className="header-left">
          <div className="brain-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5Z" />
              <path d="M16 8V5c0-1.1.9-2 2-2" />
              <path d="M12 13h4" />
              <path d="M12 18h6a2 2 0 0 1 2 2v1" />
              <path d="M12 8h8" />
              <path d="M20.5 8.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 1.32 4.24" />
            </svg>
          </div>
          <div className="header-text">
            <span className="header-title">STRATEGIC INSIGHTS</span>
            <span className="header-subtitle">
              {viewMode === "operator" ? "Operator View" : "Investor View"}
            </span>
          </div>
        </div>
        <div className={`signal-dots ${isAnalyzing ? "active" : ""}`}>
          <div className="signal-dot dot-1" />
          <div className="signal-dot dot-2" />
          <div className="signal-dot dot-3" />
        </div>
      </div>

      <div className="panel-content">
        <AISection
          title="OBSERVATION"
          content={aiContent.observation}
          isAnalyzing={isAnalyzing}
          canStart={true}
          contentKey={contentKey}
          speed={typingSpeed}
          onComplete={handleObservationComplete}
        />

        <AISection
          title="RISKS"
          content={aiContent.risks}
          isAnalyzing={isAnalyzing}
          canStart={observationComplete}
          contentKey={contentKey}
          speed={typingSpeed}
          onComplete={handleRisksComplete}
          isRiskSection={true}
        />

        <AISection
          title="ACTIONS"
          content={aiContent.action}
          isAnalyzing={isAnalyzing}
          canStart={risksComplete}
          contentKey={contentKey}
          speed={typingSpeed}
        />
      </div>

      {/* Strategic Questions Toggle */}
      <div className="questions-toggle-container">
        <button
          className={`questions-toggle ${showQuestions ? "open" : ""}`}
          onClick={toggleQuestions}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          <span>
            {showQuestions
              ? "Hide Strategic Questions"
              : "Nominated Strategic Questions"}
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            className="chevron"
            style={{
              transform: showQuestions ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Collapsible Strategic Questions Panel */}
      <AnimatePresence>
        {showQuestions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <StrategicQuestions
              onPromptClick={handlePromptClick}
              isAnalyzing={isAnalyzing}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .ai-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #14181e;
          border: 1px solid #1e2530;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }

        .panel-edge {
          display: none;
        }

        .panel-header {
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 16px 16px 12px;
          border-bottom: 1px solid #1e2530;
          background: rgba(20, 24, 30, 0.5);
        }

        .header-left {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .brain-icon {
          color: rgba(34, 211, 238, 0.6);
          margin-top: 2px;
        }

        .ai-panel.investor .brain-icon {
          opacity: 0.5;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .header-title {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(226, 232, 240, 0.85);
        }

        .ai-panel.investor .header-title {
          color: rgba(226, 232, 240, 0.8);
        }

        .header-subtitle {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: rgba(148, 163, 184, 0.55);
        }

        .signal-dots {
          display: flex;
          gap: 6px;
        }

        .signal-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.25);
          border: none;
          transition: all 0.3s ease;
        }

        /* Idle state - subtle */
        .signal-dots:not(.active) .signal-dot {
          animation: none;
          opacity: 0.3;
        }

        /* Active state - NEON BRIGHT when AI is typing */
        .signal-dots.active .signal-dot {
          background: #00ff88;
          box-shadow: 0 0 8px #00ff88, 0 0 16px rgba(0, 255, 136, 0.5);
        }

        .signal-dots.active .signal-dot.dot-1 {
          animation: neon-pulse 0.8s ease-in-out infinite;
        }

        .signal-dots.active .signal-dot.dot-2 {
          animation: neon-pulse 0.8s ease-in-out infinite 0.2s;
        }

        .signal-dots.active .signal-dot.dot-3 {
          animation: neon-pulse 0.8s ease-in-out infinite 0.4s;
        }

        @keyframes neon-pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.8) translateX(0);
            box-shadow: 0 0 2px rgba(0, 255, 136, 0.2);
          }
          50% {
            opacity: 1;
            transform: scale(1.3) translateX(4px);
            box-shadow: 0 0 12px #00ff88, 0 0 24px rgba(0, 255, 136, 0.8);
          }
        }

        .ai-panel.investor .signal-dots.active .signal-dot {
          animation-duration: 1s;
        }

        .panel-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 16px 16px;
          overflow-y: auto;
          min-height: 0;
        }

        .panel-content::-webkit-scrollbar {
          width: 3px;
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
        }

        /* Memo-style sections with subtle backgrounds */
        .ai-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(30, 37, 48, 0.4);
          border-radius: 6px;
          padding: 14px;
        }

        .ai-section.risk-section {
          background: rgba(40, 30, 35, 0.35);
        }

        .section-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.10);
        }

        .ai-section.risk-section .section-header-row {
          border-bottom-color: rgba(248, 113, 113, 0.10);
        }

        .section-icon {
          color: rgba(140, 160, 180, 0.6);
          display: flex;
          align-items: center;
        }

        .ai-section.risk-section .section-icon {
          color: rgba(248, 113, 113, 0.5);
        }

        /* HEADER AUTHORITY (Step 2) */
        .section-header {
          display: inline-flex;
          align-items: center;
          height: 20px;
          padding: 0 10px;
          border-radius: 9999px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.55);

          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(226, 232, 240, 0.86);
        }

        .section-header.risk-header {
          border-color: rgba(248, 113, 113, 0.18);
          background: rgba(40, 20, 24, 0.38);
          color: rgba(248, 150, 150, 0.88);
        }

        .section-header.action-header {
          border-color: rgba(34, 197, 94, 0.18);
          background: rgba(16, 32, 24, 0.35);
          color: rgba(134, 195, 160, 0.88);
        }

        .ai-panel.investor .section-header {
          opacity: 0.92;
        }

        .ai-panel.investor .section-header.risk-header {
          color: rgba(220, 140, 140, 0.82);
        }

        .ai-panel.investor .section-header.action-header {
          color: rgba(120, 175, 145, 0.82);
        }

        .section-content {
          font-size: 13.5px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.82);
          min-height: 32px;
        }

        .typewriter-text {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 13.5px;
          letter-spacing: 0.01em;
        }

        .analyzing-text {
          color: rgba(140, 160, 180, 0.5);
          font-style: italic;
        }

        .waiting {
          color: rgba(255, 255, 255, 0.1);
        }

        .cursor {
          color: rgba(34, 211, 238, 0.6);
          font-weight: 400;
          margin-left: 1px;
          animation: blink 0.6s step-end infinite;
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        /* Questions Toggle Button */
        .questions-toggle-container {
          padding: 12px 16px;
          border-top: 1px solid rgba(30, 37, 48, 0.6);
          flex-shrink: 0;
        }

        .questions-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(25, 30, 40, 0.5);
          border: 1px solid rgba(50, 60, 75, 0.35);
          border-radius: 6px;
          color: rgba(140, 160, 180, 0.75);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .questions-toggle:hover {
          background: rgba(30, 38, 48, 0.6);
          border-color: rgba(56, 189, 248, 0.3);
          color: rgba(180, 200, 220, 0.9);
        }

        .questions-toggle.open {
          background: rgba(34, 211, 238, 0.08);
          border-color: rgba(34, 211, 238, 0.3);
          color: rgba(34, 211, 238, 0.85);
        }

        .questions-toggle .chevron {
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
}
