// src/components/AIIntelligence.tsx
// STRATFIT — AI Intelligence Engine + Strategic Questions
// Guided interrogation panel at bottom

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScenarioId } from "./ScenarioSlidePanel";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore, ViewMode } from "@/state/scenarioStore";
import StrategicQuestions from "./StrategicQuestions";
import AIColdPanel from "./AIColdPanel";
import { KPI_CONFIG } from "./KPIGrid";
import { KPI_META } from "@/config/kpiMeta";

interface AIIntelligenceProps {
  commentary: string[];
  risks: string[];
  actions: string[];
  scenario: ScenarioId;
}

type AIIntelligencePanelMode = "cold" | "legacy";

// ============================================================================
// TYPEWRITER HOOK - Sequential typing, one paragraph at a time
// ============================================================================

function useTypewriter(
  text: string,
  baseSpeed: number = 18,
  enabled: boolean = true,
  canStart: boolean = true,
  panelMode: AIIntelligencePanelMode = "cold"
) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (panelMode !== "legacy") return;
    if (!enabled || !canStart) {
      if (!enabled) {
        setDisplayText("");
        setIsComplete(false);
        setHasStarted(false);
      }
      return;
    }

    setDisplayText("");
    setIsComplete(false);
    setHasStarted(true);

    let index = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeNextChar = () => {
      if (index >= text.length) {
        setIsComplete(true);
        return;
      }

      const char = text[index];
      const nextChar = text[index + 1];

      // Type 1-3 characters at once for rhythm variation
      let charsToType = 1;
      if (Math.random() > 0.7 && index < text.length - 2) {
        charsToType = Math.random() > 0.5 ? 2 : 3;
      }

      index += charsToType;
      index = Math.min(index, text.length);
      setDisplayText(text.slice(0, index));

      // Calculate delay based on character type
      let delay = baseSpeed;

      // Longer pause after punctuation (typewriter rhythm)
      if (char === "." || char === "!" || char === "?") {
        delay = baseSpeed * 8; // Sentence pause
      } else if (char === "," || char === ";" || char === ":") {
        delay = baseSpeed * 4; // Clause pause
      } else if (char === " " && nextChar && /[A-Z]/.test(nextChar)) {
        delay = baseSpeed * 3; // Before capital letter
      } else {
        // Add slight random variation for natural rhythm
        delay = baseSpeed + Math.random() * 12 - 6;
      }

      if (index < text.length) {
        timeoutId = setTimeout(typeNextChar, delay);
      } else {
        setIsComplete(true);
      }
    };

    // Start typing
    timeoutId = setTimeout(typeNextChar, 100);

    return () => clearTimeout(timeoutId);
  }, [text, baseSpeed, enabled, canStart, panelMode]);

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
  panelMode,
}: {
  title: string;
  content: string;
  isAnalyzing: boolean;
  canStart: boolean;
  contentKey: number;
  speed: number;
  onComplete?: () => void;
  isRiskSection?: boolean;
  panelMode: AIIntelligencePanelMode;
}) {
  const { displayText, isComplete, hasStarted } = useTypewriter(
    content,
    speed,
    !isAnalyzing,
    canStart,
    panelMode
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
// MAIN COMPONENT
// ============================================================================

export default function AIIntelligence({
  commentary,
  risks,
  actions,
  scenario,
}: AIIntelligenceProps) {
  const [panelMode, setPanelMode] = useState<AIIntelligencePanelMode>(() => {
    const saved = window.localStorage.getItem("stratfit.aiPanelMode");
    if (saved === "cold" || saved === "legacy") return saved;
    return "cold";
  });

  useEffect(() => {
    window.localStorage.setItem("stratfit.aiPanelMode", panelMode);
  }, [panelMode]);

  // Consolidated store selectors to prevent rerender cascades
  const { viewMode, activeLeverId, activeScenarioId, engineResults } = useScenarioStore(
    useShallow((s) => ({
      viewMode: s.viewMode,
      activeLeverId: s.activeLeverId,
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
    }))
  );

  const isAnalyzing = activeLeverId !== null;

  const liveKpis = engineResults?.[activeScenarioId]?.kpis;

  // HOLD LAST GOOD KPI MAP — prevents Cold blanking mid-drag / on release
  const lastGoodKpisRef = useRef<Record<string, any> | null>(null);

  const liveKpisValid =
    !!liveKpis && typeof liveKpis === "object" && Object.keys(liveKpis).length > 0;

  useEffect(() => {
    if (liveKpisValid) lastGoodKpisRef.current = liveKpis as any;
  }, [liveKpisValid, liveKpis]);

  const stableKpiValues = (liveKpisValid ? liveKpis : lastGoodKpisRef.current) ?? null;
  const visibleKpiConfig = KPI_CONFIG;
  const kpis = useMemo(() => {
    if (!stableKpiValues) return [];
    return visibleKpiConfig.map(
      (cfg) => stableKpiValues?.[cfg.kpiKey]?.value ?? 0
    );
  }, [stableKpiValues, visibleKpiConfig]);

  // Store previous KPI snapshot for delta computation
  const prevKpisRef = useRef<number[] | null>(null);
  const lastColdPanelRef = useRef<any>(null);

  // Compute deltas each render (cheap + deterministic)
  const kpiDeltas = useMemo(() => {
    if (!kpis || kpis.length === 0) return [];
    const prev = prevKpisRef.current;
    return kpis.map((v, i) => (typeof prev?.[i] === "number" ? v - (prev as number[])[i] : 0));
  }, [kpis]);

  // Update the ref when kpis change
  useEffect(() => {
    if (stableKpiValues && kpis.length) prevKpisRef.current = kpis;
  }, [stableKpiValues, kpis, scenario, viewMode]);

  const scenarioName =
    scenario === "extreme"
      ? "Extreme Scenario"
      : scenario === "downside"
      ? "Downside Scenario"
      : scenario === "upside"
      ? "Upside Scenario"
      : "Current Scenario";

  useEffect(() => {
    window.localStorage.setItem("stratfit.aiPanelMode", panelMode);
  }, [panelMode]);

  const isCold = panelMode === "cold";

  // Cold panel mapping (deterministic; no LLM)
  const coldPanel = useMemo(() => {
    const thresholdsByKey: Partial<Record<string, { low: number; med: number; high: number }>> = {
      runway: { low: 0.5, med: 1, high: 3 },
      cashPosition: { low: 20, med: 50, high: 150 },
      momentum: { low: 2, med: 5, high: 15 },
      burnQuality: { low: 10, med: 25, high: 75 },
      riskIndex: { low: 2, med: 5, high: 15 },
      earningsPower: { low: 1, med: 3, high: 8 },
      enterpriseValue: { low: 5, med: 10, high: 30 },
    };

    const eps = 1e-6;

    const coldKpis: Array<{
      key: string;
      label: string;
      value: string;
      delta?: string;
      direction?: "UP" | "DOWN" | "FLAT";
      severity?: "LOW" | "MED" | "HIGH";
    }> = [];

    const traceKpiDeltas: Array<{ label: string; from: string; to: string }> = [];

    for (let i = 0; i < visibleKpiConfig.length; i++) {
      const cfg = visibleKpiConfig[i];
      const data = stableKpiValues?.[cfg.kpiKey as keyof typeof stableKpiValues];
      const valueNum = kpis[i] ?? 0;
      const display =
        data?.display ?? KPI_META[cfg.kpiKey as keyof typeof KPI_META]?.format?.(valueNum) ?? "—";
      const d = kpiDeltas[i] ?? 0;

      const direction: "UP" | "DOWN" | "FLAT" = d > eps ? "UP" : d < -eps ? "DOWN" : "FLAT";

      const higherIsBetter =
        KPI_META[cfg.kpiKey as keyof typeof KPI_META]?.higherIsBetter ?? true;
      const badDelta = higherIsBetter ? -d : d; // positive means "worse"

      const t = thresholdsByKey[cfg.kpiKey] ?? { low: 1, med: 3, high: 8 };
      let severity: "LOW" | "MED" | "HIGH" | undefined;
      if (Math.abs(d) <= eps) {
        severity = undefined;
      } else if (badDelta >= t.high) {
        severity = "HIGH";
      } else if (badDelta >= t.med) {
        severity = "MED";
      } else if (badDelta >= t.low) {
        severity = "LOW";
      } else {
        severity = undefined;
      }

      coldKpis.push({
        key: cfg.id,
        label: cfg.label,
        value: display,
        delta:
          Math.abs(d) > eps
            ? KPI_META[cfg.kpiKey as keyof typeof KPI_META]?.format?.(Math.abs(d)) ?? d.toFixed(2)
            : undefined,
        direction,
        severity,
      });

      if (severity) {
        const prev = prevKpisRef.current?.[i];
        const prevDisplay =
          typeof prev === "number"
            ? KPI_META[cfg.kpiKey as keyof typeof KPI_META]?.format?.(prev) ?? String(prev)
            : "—";
        traceKpiDeltas.push({ label: cfg.label, from: prevDisplay, to: display });
      }
    }

    let driversForCold = commentary.map((c) => ({ label: c }));
    let actionsForCold = actions.map((a) => ({ label: a }));

    driversForCold = driversForCold.filter((d) => d.label?.trim());
    actionsForCold = actionsForCold.filter((a) => a.label?.trim()).slice(0, 3);

    return {
      coldKpis,
      driversForCold,
      actionsForCold,
      trace: {
        notes: risks.length ? risks : undefined,
        kpiDeltas: traceKpiDeltas.slice(0, 7),
      },
    };
  }, [actions, commentary, kpiDeltas, kpis, risks, stableKpiValues, visibleKpiConfig]);

  useEffect(() => {
    const hasKpis = Array.isArray(coldPanel?.coldKpis) && coldPanel.coldKpis.length > 0;
    const hasAnyValue =
      hasKpis && coldPanel.coldKpis.some((k: any) => k && k.value && k.value !== "—");

    const hasSignals = hasKpis && coldPanel.coldKpis.some((k: any) => k && k.severity);

    if (hasAnyValue || hasSignals) {
      lastColdPanelRef.current = coldPanel;
    }
  }, [coldPanel]);

  const resolvedColdPanel =
    (Array.isArray(coldPanel?.coldKpis) &&
      coldPanel.coldKpis.some((k: any) => k?.value && k.value !== "—"))
      ? coldPanel
      : (lastColdPanelRef.current ?? coldPanel);

  if (isCold && !stableKpiValues) {
    return (
      <div className="cold-panel">
        <div className="cold-muted">Awaiting engine output.</div>
      </div>
    );
  }

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
        <div className="header-right">
          <div className={`signal-dots ${isAnalyzing ? "active" : ""}`}>
            <div className="signal-dot dot-1" />
            <div className="signal-dot dot-2" />
            <div className="signal-dot dot-3" />
          </div>
          <div className="mode-toggle" role="tablist" aria-label="AI panel mode">
            <button
              type="button"
              className={`mode-btn ${isCold ? "active" : ""}`}
              onClick={() => setPanelMode("cold")}
            >
              Cold
            </button>
            <button
              type="button"
              className={`mode-btn ${panelMode === "legacy" ? "active" : ""}`}
              onClick={() => setPanelMode("legacy")}
            >
              Legacy
            </button>
          </div>
        </div>
      </div>

      {isCold ? (
        <div className="panel-content">
          <AIColdPanel
            scenarioName={scenarioName}
            kpis={resolvedColdPanel.coldKpis}
            drivers={resolvedColdPanel.driversForCold}
            actions={resolvedColdPanel.actionsForCold}
            trace={resolvedColdPanel.trace}
          />
        </div>
      ) : (
        <div className="panel-content">
          <AIIntelligenceLegacy
            scenario={scenario}
            viewMode={viewMode}
            activeLeverId={activeLeverId}
            panelMode={panelMode}
          />
        </div>
      )}

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

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mode-toggle {
          display: inline-flex;
          gap: 0;
          border-radius: 9999px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.35);
        }

        .mode-btn {
          appearance: none;
          border: 0;
          background: transparent;
          color: rgba(148, 163, 184, 0.72);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 6px 10px;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }

        .mode-btn:hover {
          background: rgba(148, 163, 184, 0.10);
          color: rgba(226, 232, 240, 0.82);
        }

        .mode-btn.active {
          background: rgba(34, 211, 238, 0.14);
          color: rgba(34, 211, 238, 0.92);
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
          0%, 100% { 
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
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
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

function AIIntelligenceLegacy({
  scenario,
  viewMode,
  activeLeverId,
  panelMode,
}: {
  scenario: ScenarioId;
  viewMode: ViewMode;
  activeLeverId: string | null;
  panelMode: AIIntelligencePanelMode;
}) {
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

  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);

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

  const defaultContent = useMemo(() => getAIContent(viewMode, scenario), [viewMode, scenario]);

  // Use custom response if available, otherwise default
  const aiContent = useMemo(
    () =>
      customResponse
        ? {
            observation: customResponse.observation,
            risks: customResponse.risk,
            action: customResponse.action,
          }
        : defaultContent,
    [customResponse, defaultContent]
  );

  // Typewriter speed - fast base with rhythm variation (18ms base = ~55 chars/second burst)
  const typingSpeed = 18;

  // Stable callbacks for AISection to prevent re-renders
  const handleObservationComplete = useCallback(() => setObservationComplete(true), []);
  const handleRisksComplete = useCallback(() => setRisksComplete(true), []);

  // Handle strategic question click (includes hover-highlight timers)
  const handlePromptClick = useCallback(
    (response: { observation: string; risk: string; action: string }, kpis: number[], _constraint: string) => {
      if (panelMode !== "legacy") return;
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
    [panelMode, setHoveredKpiIndex]
  );

  const toggleQuestions = () => {
    setShowQuestions(!showQuestions);
  };

  return (
    <>
      <div className="panel-content">
        <AISection
          title="OBSERVATION"
          content={aiContent.observation}
          isAnalyzing={isAnalyzing}
          canStart={true}
          contentKey={contentKey}
          speed={typingSpeed}
          onComplete={handleObservationComplete}
          panelMode={panelMode}
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
          panelMode={panelMode}
        />

        <AISection
          title="ACTIONS"
          content={aiContent.action}
          isAnalyzing={isAnalyzing}
          canStart={risksComplete}
          contentKey={contentKey}
          speed={typingSpeed}
          panelMode={panelMode}
        />
      </div>

      <div className="questions-toggle-container">
        <button className={`questions-toggle ${showQuestions ? "open" : ""}`} onClick={toggleQuestions}>
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
          <span>{showQuestions ? "Hide Strategic Questions" : "Nominated Strategic Questions"}</span>
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

      <AnimatePresence>
        {showQuestions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <StrategicQuestions onPromptClick={handlePromptClick} isAnalyzing={isAnalyzing} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
