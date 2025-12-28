// src/components/AIIntelligence.tsx
// STRATFIT — AI Strategic Briefing Console
// STEP 2: Structural Authority Pass (Headers + Hierarchy Only)
// Rules:
// - Keep order: OBSERVATION → RISKS → ACTIONS
// - No chat tone, no emojis
// - No KPI strip impact
// - No Mountain Engine impact
// - No content changes beyond labels/structure

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScenarioStore } from "@/state/scenarioStore";
import { shallow } from "zustand/react/shallow";

export type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface AIIntelligenceProps {
  commentary: string;
  risks: string;
  actions: string;
  scenario: ScenarioId;
}

// ============================================================================
// TYPEWRITER HOOK (deterministic, no jitter)
// ============================================================================
function useTypewriter(text: string, baseSpeed: number, enabled: boolean, canStart: boolean) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!enabled || !canStart) {
      setDisplayText("");
      setIsComplete(false);
      setHasStarted(false);
      return;
    }

    setDisplayText("");
    setIsComplete(false);
    setHasStarted(true);

    let idx = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const typeNextChar = () => {
      idx += 1;
      setDisplayText(text.slice(0, idx));

      if (idx >= text.length) {
        setIsComplete(true);
        return;
      }

      timeoutId = setTimeout(typeNextChar, baseSpeed);
    };

    // Start typing
    timeoutId = setTimeout(typeNextChar, 100);

    return () => clearTimeout(timeoutId);
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
  speed = 18,
  onComplete,
  canStart = true,
  contentKey = 0,
  isRiskSection = false
}: {
  title: string;
  content: string;
  isAnalyzing: boolean;
  speed?: number;
  onComplete?: () => void;
  canStart?: boolean;
  contentKey?: number;
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
  const sectionIcon = title === "OBSERVATION" ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ) : title === "RISKS" ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.53 21H20.47A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const headerClass = title === "RISKS"
    ? "risk-header"
    : title === "ACTIONS"
      ? "action-header"
      : "observation-header";

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

const OPERATOR_QUESTIONS = [
  { label: "What moves the needle fastest?", key: "needle" },
  { label: "What should we stop doing?", key: "stop" },
  { label: "What is the single biggest risk?", key: "risk" },
  { label: "What is the next decision to make?", key: "decision" },
];

const INVESTOR_QUESTIONS = [
  { label: "How investable is this scenario?", key: "investable" },
  { label: "What is the key diligence concern?", key: "diligence" },
  { label: "Where is the hidden downside?", key: "downside" },
  { label: "What would improve valuation most?", key: "valuation" },
];

// ============================================================================

export default function AIIntelligence({
  commentary,
  risks,
  actions,
  scenario,
}: AIIntelligenceProps) {
  const [contentKey, setContentKey] = useState(0);
  const [isProcessingQuestion, setIsProcessingQuestion] = useState(false);
  const [customResponse, setCustomResponse] = useState<{observation: string; risk: string; action: string} | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  // Sequential typing state
  const [observationComplete, setObservationComplete] = useState(false);
  const [riskComplete, setRiskComplete] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);

  const { viewMode } = useScenarioStore(
    (s) => ({ viewMode: s.viewMode }),
    shallow
  );

  const isInvestor = viewMode === "investor";

  const questions = isInvestor ? INVESTOR_QUESTIONS : OPERATOR_QUESTIONS;

  // Reset sequential typing when content changes
  useEffect(() => {
    setObservationComplete(false);
    setRiskComplete(false);
    setActionComplete(false);
  }, [contentKey, scenario]);

  const effectiveObservation = useMemo(() => {
    if (customResponse?.observation) return customResponse.observation;
    return commentary;
  }, [customResponse?.observation, commentary]);

  const effectiveRisk = useMemo(() => {
    if (customResponse?.risk) return customResponse.risk;
    return risks;
  }, [customResponse?.risk, risks]);

  const effectiveAction = useMemo(() => {
    if (customResponse?.action) return customResponse.action;
    return actions;
  }, [customResponse?.action, actions]);

  const handleQuestionClick = async (qKey: string) => {
    setIsProcessingQuestion(true);
    setCustomResponse(null);
    setContentKey((k) => k + 1);

    try {
      // This is placeholder behavior — keeping existing flow exactly as-is.
      // If your codebase wires this to OpenAI elsewhere, that integration remains unchanged.
      await new Promise((r) => setTimeout(r, 600));

      // Simple deterministic response swap (existing style)
      const prefix = isInvestor ? "[INVESTOR]" : "[OPERATOR]";
      setCustomResponse({
        observation: `${prefix} ${effectiveObservation}`,
        risk: `${prefix} ${effectiveRisk}`,
        action: `${prefix} ${effectiveAction}`,
      });

      setContentKey((k) => k + 1);
    } finally {
      setIsProcessingQuestion(false);
    }
  };

  const panelClass = `ai-panel ${isInvestor ? "investor" : "operator"}`;

  return (
    <div className={panelClass}>
      <div className="panel-header">
        <div className="header-left">
          <div className="brain-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C8.5 3 5.7 5.5 5.7 8.6c0 1 .3 2 .9 2.8-.9.7-1.5 1.8-1.5 3.1 0 2.1 1.5 3.8 3.4 4.3.5 1.8 2.1 3.2 4.1 3.2s3.6-1.4 4.1-3.2c1.9-.5 3.4-2.2 3.4-4.3 0-1.3-.6-2.4-1.5-3.1.6-.8.9-1.8.9-2.8C18.3 5.5 15.5 3 12 3Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 3v18" stroke="currentColor" strokeWidth="2" />
              <path d="M8 8h8" stroke="currentColor" strokeWidth="2" />
              <path d="M8 14h8" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="title-wrap">
            <div className="panel-title">STRATEGIC BRIEF</div>
            <div className="panel-subtitle">
              {isInvestor ? "Investor Lens" : "Operator Lens"} • {scenario.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="signal-dots">
          <div className={`signal-dot ${isProcessingQuestion ? "active" : ""}`} />
          <div className={`signal-dot ${isProcessingQuestion ? "active" : ""}`} />
          <div className={`signal-dot ${isProcessingQuestion ? "active" : ""}`} />
        </div>
      </div>

      <div className="panel-content">
        <AISection
          title="OBSERVATION"
          content={effectiveObservation}
          isAnalyzing={isProcessingQuestion}
          speed={14}
          onComplete={() => setObservationComplete(true)}
          canStart={true}
          contentKey={contentKey}
        />

        <AISection
          title="RISKS"
          content={effectiveRisk}
          isAnalyzing={isProcessingQuestion}
          speed={16}
          onComplete={() => setRiskComplete(true)}
          canStart={observationComplete}
          contentKey={contentKey}
          isRiskSection={true}
        />

        <AISection
          title="ACTIONS"
          content={effectiveAction}
          isAnalyzing={isProcessingQuestion}
          speed={14}
          onComplete={() => setActionComplete(true)}
          canStart={riskComplete}
          contentKey={contentKey}
        />
      </div>

      <div className="panel-footer">
        <button
          className={`questions-toggle ${showQuestions ? "open" : ""}`}
          onClick={() => setShowQuestions((v) => !v)}
          type="button"
        >
          <span className="toggle-label">{isInvestor ? "Investor prompts" : "Operator prompts"}</span>
          <span className="toggle-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d={showQuestions ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        <AnimatePresence>
          {showQuestions && (
            <motion.div
              className="questions-grid"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {questions.map((q) => (
                <button
                  key={q.key}
                  className="question-btn"
                  onClick={() => handleQuestionClick(q.key)}
                  disabled={isProcessingQuestion}
                  type="button"
                >
                  {q.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .ai-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: rgba(12, 14, 18, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
          backdrop-filter: blur(14px);
        }

        .panel-header {
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
          color: rgba(34, 211, 238, 0.55);
        }

        .panel-title {
          font-size: 11px;
          letter-spacing: 0.12em;
          font-weight: 700;
          color: rgba(220, 240, 255, 0.92);
        }

        .panel-subtitle {
          margin-top: 4px;
          font-size: 11px;
          color: rgba(180, 200, 220, 0.7);
          font-weight: 500;
        }

        .signal-dots {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }

        .signal-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(80, 90, 105, 0.45);
          box-shadow: 0 0 0 rgba(0, 0, 0, 0);
          transition: all 0.2s ease;
        }

        .signal-dot.active {
          background: rgba(0, 255, 136, 0.9);
          box-shadow: 0 0 12px rgba(0, 255, 136, 0.55);
        }

        .panel-content {
          flex: 1;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: auto;
        }

        .panel-content::-webkit-scrollbar {
          width: 6px;
        }

        .panel-content::-webkit-scrollbar-track {
          background: transparent;
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
          padding: 16px;
        }

        .ai-section.risk-section {
          background: rgba(40, 30, 35, 0.35);
        }

        .section-header-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 2px;
        }

        .section-icon {
          color: rgba(140, 160, 180, 0.6);
          display: flex;
          align-items: center;
        }

        .ai-section.risk-section .section-icon {
          color: rgba(248, 113, 113, 0.5);
        }

        .section-header {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: rgba(160, 180, 200, 0.85);
        }

        .section-header.risk-header {
          color: rgba(248, 150, 150, 0.85);
        }

        .section-header.action-header {
          color: rgba(134, 195, 160, 0.85);
        }

        .ai-panel.investor .section-header {
          opacity: 0.9;
        }

        .ai-panel.investor .section-header.risk-header {
          color: rgba(220, 140, 140, 0.8);
        }

        .ai-panel.investor .section-header.action-header {
          color: rgba(120, 175, 145, 0.8);
        }

        .section-content {
          font-size: 13.5px;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.84);
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

        .cursor {
          margin-left: 2px;
          opacity: 0.5;
        }

        .waiting {
          opacity: 0.3;
        }

        .panel-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 10px 12px 12px;
          background: rgba(20, 24, 30, 0.45);
        }

        .questions-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
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
          border-color: rgba(34, 211, 238, 0.22);
          color: rgba(220, 240, 255, 0.9);
        }

        .toggle-icon {
          display: flex;
          align-items: center;
          opacity: 0.8;
        }

        .questions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-top: 10px;
        }

        .question-btn {
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          background: rgba(18, 22, 28, 0.55);
          border: 1px solid rgba(50, 60, 75, 0.28);
          border-radius: 6px;
          color: rgba(200, 220, 240, 0.85);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .question-btn:hover {
          border-color: rgba(34, 211, 238, 0.28);
          background: rgba(18, 22, 28, 0.7);
        }

        .question-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
