// src/components/AIIntelligence.tsx
// STRATFIT — AI Strategic Briefing Console
// "Insight rising out of the terrain — precise, calm, authoritative, quietly cinematic."
//
// Design language:
// - Mountain glows. AI panel glints.
// - Vertical light spine (signature moment)
// - Editorial section headers with teal marker
// - Cinematic typewriter delivery

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScenarioStore } from "@/state/scenarioStore";
import { useShallow } from "zustand/react/shallow";

export type ScenarioId = "base" | "upside" | "downside" | "extreme";

type TextLike = string | string[] | undefined | null;

interface AIIntelligenceProps {
  commentary?: TextLike;
  risks?: TextLike;
  actions?: TextLike;
  scenario: ScenarioId;
}

function normalizeText(input: TextLike): string {
  if (!input) return "";
  if (Array.isArray(input)) return input.filter(Boolean).join(" ");
  return String(input);
}

// ============================================================================
// TYPEWRITER HOOK — Cinematic delivery, not "typing"
// Characters emerge deliberately. Cursor fades when complete.
// ============================================================================
function useTypewriter(
  text: string,
  baseSpeed: number,
  enabled: boolean,
  delayMs: number = 0
) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayText("");
      setIsComplete(false);
      setHasStarted(false);
      return;
    }

    setDisplayText("");
    setIsComplete(false);
    setHasStarted(false);

    let idx = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

    const typeNextChar = () => {
      idx += 1;
      setDisplayText(text.slice(0, idx));

      if (idx >= text.length) {
        setIsComplete(true);
        return;
      }

      timeoutId = setTimeout(typeNextChar, baseSpeed);
    };

    // Initial delay — "The system pauses… then speaks."
    timeoutId = setTimeout(() => {
      setHasStarted(true);
      typeNextChar();
    }, delayMs);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [text, baseSpeed, enabled, delayMs]);

  return { displayText, isComplete, hasStarted };
}

// ============================================================================
// BRIEFING SECTION — Editorial header + typewriter content
// STEP: Header Arrival Motion (Genesis) — snap/settle before text
// ============================================================================
function BriefingSection({
  label,
  content,
  isAnalyzing,
  variant,
  speed = 18, // Slightly slower than chat UIs
  delayMs = 0,
  contentKey = 0,
}: {
  label: string;
  content: string;
  isAnalyzing: boolean;
  variant: "observation" | "risks" | "actions";
  speed?: number;
  delayMs?: number;
  contentKey?: number;
}) {
  const enabled = !isAnalyzing && content.length > 0;

  // Header Arrival Motion contract:
  // header arrives 50ms before the first character of this section starts typing.
  const [headerArmed, setHeaderArmed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHeaderArmed(false);
      return;
    }

    setHeaderArmed(false);

    const t = Math.max(0, (delayMs ?? 0) - 50);
    const id = setTimeout(() => setHeaderArmed(true), t);

    return () => clearTimeout(id);
  }, [enabled, delayMs, contentKey]);

  const { displayText, isComplete, hasStarted } = useTypewriter(
    content,
    speed,
    enabled,
    delayMs
  );

  return (
    <div className={`briefing-section variant-${variant}`}>
      <div className="section-header" aria-label={label}>
        {/* Visual anchor (pipe) + label share the same arrival motion */}
        <span
          className={`section-pipe ${headerArmed ? "sf-header-arrival" : ""}`}
          aria-hidden="true"
        />
        <span
          className={`section-label ${headerArmed ? "sf-header-arrival" : ""}`}
        >
          {label}
        </span>
      </div>

      <div className="section-body">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.span
              key="analyzing"
              className="state-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              Analyzing…
            </motion.span>
          ) : content.length === 0 ? (
            <motion.span
              key="empty"
              className="state-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              —
            </motion.span>
          ) : (
            <motion.span
              key={`content-${contentKey}`}
              className="content-text"
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {hasStarted ? (
                <>
                  {displayText}
                  <span className={`cursor ${isComplete ? "fade-out" : ""}`}>
                    │
                  </span>
                </>
              ) : (
                <span className="waiting" />
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// DEFAULT CONTENT
// ============================================================================
function getFallback(viewMode: "operator" | "investor", scenario: ScenarioId) {
  const isInvestor = viewMode === "investor";

  if (!isInvestor) {
    return {
      observation:
        scenario === "extreme"
          ? "Runway is critically constrained and volatility is elevated. The margin of safety is thin under current burn dynamics."
          : scenario === "downside"
          ? "Runway improved slightly, but volatility has increased. Momentum remains positive, driven by conversion lift and tighter burn discipline."
          : scenario === "upside"
          ? "Momentum is strong and runway is expanding. Efficiency is improving without sacrificing growth velocity."
          : "System is stabilizing with improving efficiency. Margin of safety is positive but remains sensitive to churn and payroll creep.",
      risks:
        scenario === "extreme"
          ? "Liquidity risk is elevated and execution optionality is limited. Any shock to conversion or collections amplifies downside."
          : scenario === "downside"
          ? "Churn sensitivity remains high. Cost creep can erase runway gains quickly. Monitor CAC payback weekly."
          : scenario === "upside"
          ? "Scaling speed may outpace ops capacity. Watch fulfillment, onboarding, and support load to prevent churn rebound."
          : "Primary risk is slow drift in burn and hiring velocity. Secondary risk is pricing pressure from market noise.",
      actions:
        scenario === "extreme"
          ? "Reduce burn immediately. Freeze non-critical spend and rebase the plan to 18+ months runway. Tighten weekly cash controls."
          : scenario === "downside"
          ? "Lock cost controls for 30 days. Focus one growth vector. Implement churn watchlist and weekly pipeline hygiene."
          : scenario === "upside"
          ? "Double down on proven channels. Protect unit economics. Add capacity in the highest-leverage constraint area."
          : "Maintain cadence. Reinforce cost discipline. Prioritize one constraint and ship one operational improvement this week.",
    };
  }

  return {
    observation:
      scenario === "extreme"
        ? "Portfolio runway is critically constrained. Capital efficiency below sustainable threshold. Deployment risk elevated."
        : scenario === "downside"
        ? "Growth-to-efficiency pressure emerging. Trajectory requires recalibration within the next quarter."
        : scenario === "upside"
        ? "Metrics exceed plan assumptions. Unit economics remain sustainable. Investment thesis intact."
        : "Metrics within expected range. Deployment efficiency acceptable. No anomalies detected.",
    risks:
      scenario === "extreme"
        ? "Material risk concentration. Downside probability increased. Execution margin minimal."
        : scenario === "downside"
        ? "Margin compression evident. Burn rate inconsistent with model assumptions."
        : scenario === "upside"
        ? "Execution scaling risk present. Valuation may exceed near-term fundamentals."
        : "Risk factors within normal distribution. No material concerns at current levels.",
    actions:
      scenario === "extreme"
        ? "Prioritize capital preservation. Restructure before additional deployment. Board engagement advised."
        : scenario === "downside"
        ? "Shift to monthly monitoring. Milestone-based capital release. Request response plan."
        : scenario === "upside"
        ? "Evaluate follow-on at current terms. Monitor overheating indicators."
        : "Quarterly monitoring cadence sufficient. No portfolio action required.",
  };
}

const DEFAULT_QUESTIONS = [
  "What signal moved most in the last 30 days?",
  "Which metric diverged furthest from baseline?",
  "Is the change driven by price, volume, churn, or cost?",
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AIIntelligence({
  commentary,
  risks,
  actions,
  scenario,
}: AIIntelligenceProps) {
  const [contentKey, setContentKey] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);

  const { viewMode, activeLeverId } = useScenarioStore(
    useShallow((s) => ({
      viewMode: s.viewMode,
      activeLeverId: s.activeLeverId,
    }))
  );

  const isAnalyzing = activeLeverId !== null;

  useEffect(() => {
    setContentKey((k) => k + 1);
    setShowQuestions(false);
  }, [scenario, viewMode]);

  const fallback = useMemo(
    () => getFallback(viewMode, scenario),
    [viewMode, scenario]
  );

  const observationText = useMemo(() => {
    const t = normalizeText(commentary);
    return t.trim().length > 0 ? t : fallback.observation;
  }, [commentary, fallback.observation]);

  const risksText = useMemo(() => {
    const t = normalizeText(risks);
    return t.trim().length > 0 ? t : fallback.risks;
  }, [risks, fallback.risks]);

  const actionsText = useMemo(() => {
    const t = normalizeText(actions);
    return t.trim().length > 0 ? t : fallback.actions;
  }, [actions, fallback.actions]);

  const openQuestions = useCallback(() => {
    setShowQuestions(true);
  }, []);

  const closeQuestions = useCallback(() => {
    setShowQuestions(false);
  }, []);

  return (
    <div className={`ai-panel ${viewMode}`}>
      <style>{`
        /* ================================================================
           STRATFIT AI Panel — Signature Moment
           "Insight rising out of the terrain"

           Palette: Same black as app. Desaturated mountain teal accent.
           The mountain glows. The AI panel glints.
           ================================================================ */

        .ai-panel {
          /* Core palette — native to app, not a new shade */
          --bg-app: #08090b;
          --bg-surface: rgba(255, 255, 255, 0.018);
          --border-dim: rgba(255, 255, 255, 0.045);
          --border-subtle: rgba(255, 255, 255, 0.07);

          /* Text hierarchy — pure white to neutral grey */
          --text-primary: rgba(255, 255, 255, 0.94);
          --text-secondary: rgba(255, 255, 255, 0.68);
          --text-tertiary: rgba(255, 255, 255, 0.38);

          /* Accent — mountain teal, desaturated 25% for calm authority */
          --accent-teal: #4a9a9a;
          --accent-teal-dim: rgba(74, 154, 154, 0.55);
          --accent-teal-glow: rgba(74, 154, 154, 0.12);

          /* Section color variants */
          --label-observation: rgba(255, 255, 255, 0.88);
          --label-risks: rgba(220, 220, 230, 0.82);
          --label-actions: rgba(200, 235, 220, 0.86);

          --ease-out: cubic-bezier(0.16, 0, 0.1, 1);

          /* Genesis motion kernel */
          --ease-stratfit-snap: cubic-bezier(0.22, 1, 0.36, 1);

          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          background: var(--bg-app);
          border: 1px solid var(--border-dim);
          contain: layout paint;
        }

        /* ================================================================
           HEADER ARRIVAL MOTION — "Positronic Snap"
           ================================================================ */
        .sf-header-arrival {
          will-change: transform, opacity;
          animation: sfSlideInSnap 450ms var(--ease-stratfit-snap) forwards;
        }

        @keyframes sfSlideInSnap {
          0% {
            opacity: 0;
            transform: translateY(-6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        /* ================================================================
           VERTICAL LIGHT SPINE — The signature moment
           "Insight is being drawn upward from the terrain."
           ================================================================ */
        .ai-panel::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 1.5px;
          background: linear-gradient(
            to top,
            transparent 0%,
            var(--accent-teal-dim) 30%,
            var(--accent-teal) 70%,
            transparent 100%
          );
          opacity: 0.6;
          filter: blur(0.5px);
          z-index: 5;
          pointer-events: none;
        }

        /* ---- HEADER ---- */
        .panel-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-dim);
        }

        .header-icon {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          background: var(--accent-teal-glow);
          border: 1px solid rgba(74, 154, 154, 0.2);
          color: var(--accent-teal);
          flex-shrink: 0;
        }

        .header-icon svg {
          width: 14px;
          height: 14px;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .header-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-primary);
        }

        .header-subtitle {
          font-size: 11px;
          font-weight: 450;
          color: var(--text-tertiary);
          letter-spacing: 0.01em;
        }

        /* ---- BODY — Generous vertical rhythm ---- */
        .panel-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 24px 20px;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
        }

        /* ---- BRIEFING SECTION — Editorial authority ---- */
        .briefing-section {
          padding: 0 0 28px 0;
        }

        .briefing-section + .briefing-section {
          padding-top: 24px;
          border-top: 1px solid var(--border-dim);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          overflow: hidden; /* prevents snap motion from peeking outside */
        }

        /* Genesis visual anchor: pipe */
        .section-pipe {
          width: 2px;
          height: 10px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 1px;
          flex-shrink: 0;
        }

        /* Section label — architectural header */
        .section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          opacity: 0.9; /* baseline; variants tune below */
        }

        .variant-observation .section-label {
          color: var(--label-observation);
        }

        .variant-risks .section-label {
          color: var(--label-risks);
        }

        .variant-actions .section-label {
          color: var(--label-actions);
        }

        /* Content body */
        .section-body {
          font-size: 14px;
          line-height: 1.75;
          color: var(--text-secondary);
          min-height: 52px;
          padding-left: 12px;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .content-text {
          color: var(--text-primary);
        }

        .state-text {
          font-style: italic;
          color: var(--text-tertiary);
        }

        /* Cursor — thin, slow, fades when done */
        .cursor {
          display: inline;
          margin-left: 1px;
          color: var(--accent-teal);
          font-weight: 300;
          opacity: 0.7;
          animation: cursor-blink 1.2s ease-in-out infinite;
        }

        .cursor.fade-out {
          animation: cursor-fade 0.6s ease-out forwards;
        }

        @keyframes cursor-blink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0; }
        }

        @keyframes cursor-fade {
          to { opacity: 0; }
        }

        .waiting {
          display: inline-block;
          width: 1px;
          height: 1em;
        }

        /* ---- ASK A QUESTION — Console affordance ---- */
        .cta-row {
          padding: 16px 20px 20px 20px;
          border-top: 1px solid var(--border-dim);
        }

        .ask-btn {
          appearance: none;
          width: 100%;
          padding: 13px 18px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-surface);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 550;
          letter-spacing: 0.01em;
          cursor: pointer;
          text-align: center;
          transition:
            color 120ms var(--ease-out),
            border-color 120ms var(--ease-out);
        }

        .ask-btn:hover {
          color: var(--text-primary);
          border-color: var(--accent-teal-dim);
        }

        .ask-btn:active {
          opacity: 0.92;
        }

        .ask-btn:focus-visible {
          outline: 1px solid var(--accent-teal);
          outline-offset: 2px;
        }

        /* ---- QUESTIONS PANEL ---- */
        .questions-overlay {
          position: absolute;
          inset: 0;
          background: rgba(8, 9, 11, 0.85);
          display: flex;
          align-items: flex-end;
          padding: 16px;
          z-index: 10;
        }

        .questions-card {
          width: 100%;
          background: var(--bg-app);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          overflow: hidden;
        }

        .questions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border-dim);
        }

        .questions-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-tertiary);
        }

        .close-btn {
          appearance: none;
          padding: 6px 12px;
          border: 1px solid var(--border-subtle);
          border-radius: 5px;
          background: transparent;
          color: var(--text-tertiary);
          font-size: 11px;
          font-weight: 550;
          cursor: pointer;
          transition: color 100ms var(--ease-out), border-color 100ms var(--ease-out);
        }

        .close-btn:hover {
          color: var(--text-secondary);
          border-color: var(--border-subtle);
        }

        .close-btn:focus-visible {
          outline: 1px solid var(--accent-teal);
          outline-offset: 2px;
        }

        /* Questions list — analyst prompt style, not help text */
        .questions-list {
          padding: 14px 16px 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .question-item {
          appearance: none;
          width: 100%;
          padding: 12px 14px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 480;
          line-height: 1.4;
          text-align: left;
          cursor: pointer;
          transition: color 100ms var(--ease-out), background 100ms var(--ease-out);
        }

        .question-item:hover {
          color: var(--text-primary);
          background: var(--bg-surface);
        }

        .question-item:focus-visible {
          outline: 1px solid var(--accent-teal);
          outline-offset: 1px;
        }
      `}</style>

      {/* Header */}
      <div className="panel-header">
        <div className="header-icon" aria-hidden="true">
          <svg
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
            <path d="M20.5 8.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58" />
          </svg>
        </div>
        <div className="header-text">
          <div className="header-title">Strategic Briefing</div>
          <div className="header-subtitle">
            {viewMode === "investor" ? "Investor View" : "Operator View"}
          </div>
        </div>
      </div>

      {/* Body — Vertical sections with generous rhythm */}
      <div className="panel-body">
        <BriefingSection
          label="Observation"
          variant="observation"
          content={observationText}
          isAnalyzing={isAnalyzing}
          delayMs={100}
          contentKey={contentKey}
        />
        <BriefingSection
          label="Risks"
          variant="risks"
          content={risksText}
          isAnalyzing={isAnalyzing}
          delayMs={observationText.length * 18 + 300}
          contentKey={contentKey + 1}
        />
        <BriefingSection
          label="Actions"
          variant="actions"
          content={actionsText}
          isAnalyzing={isAnalyzing}
          delayMs={observationText.length * 18 + risksText.length * 18 + 500}
          contentKey={contentKey + 2}
        />
      </div>

      {/* Console affordance — Ask a question */}
      <div className="cta-row">
        <button
          type="button"
          className="ask-btn"
          onClick={openQuestions}
          aria-haspopup="dialog"
        >
          Ask a question
        </button>
      </div>

      {/* Questions overlay */}
      <AnimatePresence>
        {showQuestions && (
          <motion.div
            className="questions-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            onClick={closeQuestions}
          >
            <motion.div
              className="questions-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.16, ease: [0.16, 0, 0.1, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Strategic questions"
            >
              <div className="questions-header">
                <div className="questions-title">Query</div>
                <button
                  type="button"
                  className="close-btn"
                  onClick={closeQuestions}
                >
                  Close
                </button>
              </div>
              <div className="questions-list">
                {DEFAULT_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="question-item"
                    onClick={() => setShowQuestions(false)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
