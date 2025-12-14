// src/components/AIIntelligence.tsx
// STRATFIT — AI Intelligence Engine + Strategic Questions
// Guided interrogation panel at bottom

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScenarioId } from "./ScenarioSlidePanel";
import { useScenarioStore, ViewMode } from "@/state/scenarioStore";
import StrategicQuestions from "./StrategicQuestions";

interface AIIntelligenceProps {
  commentary: string[];
  risks: string[];
  actions: string[];
  scenario: ScenarioId;
}

// ============================================================================
// TYPEWRITER HOOK - Sequential typing, one paragraph at a time
// ============================================================================

function useTypewriter(
  text: string, 
  speed: number = 45, 
  enabled: boolean = true, 
  canStart: boolean = true
) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
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
    
    const interval = setInterval(() => {
      if (index < text.length) {
        index += 1;
        setDisplayText(text.slice(0, index));
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled, canStart]);

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
  isRiskSection = false
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

  return (
    <div className="ai-section">
      <div className={`section-header ${isRiskSection ? 'risk-header' : ''}`}>{title}</div>
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
      observation: scenario === "extreme" 
        ? "Time is now the dominant constraint shaping every decision. Optionality compresses faster than value creation. Strategic flexibility erodes weekly."
        : scenario === "downside"
        ? "Momentum is outrunning resilience. The growth-to-strength gap is widening and burn efficiency is declining at current trajectory."
        : scenario === "upside"
        ? "System operating above baseline parameters. Growth vectors aligned with plan, efficiency trending positive. Execution delivering ahead of targets."
        : "Operating within tolerance bands. Tension between velocity and efficiency exists but neither is critical. System stable.",
      
      risks: scenario === "extreme"
        ? "Runway forces binary decisions within 6-month window. Small execution misses now compound structurally into larger shortfalls."
        : scenario === "downside"
        ? "Efficiency degrades monthly without intervention. Current hiring intensity unsustainable at this revenue level. Cash sensitivity elevated."
        : scenario === "upside"
        ? "Scaling velocity may outpace operational infrastructure. Key person dependencies are emerging in critical functions."
        : "Market volatility moderate. Funding pressure latent but manageable. Execution risk within normal operating parameters.",
      
      action: scenario === "extreme"
        ? "Reduce burn by 25-30% immediately. Narrow focus to single highest-conviction growth vector. Extend runway to 18+ months minimum."
        : scenario === "downside"
        ? "Pause all discretionary hiring. Preserve strategic optionality for next 2 quarters. Tighten operating expense controls."
        : scenario === "upside"
        ? "Accelerate investment in proven channels. Lock in critical talent before competition. Consider strategic raise at current momentum."
        : "Maintain current trajectory. Weekly monitoring cadence. No tactical intervention required at this time."
    };
  } else {
    return {
      observation: scenario === "extreme"
        ? "Runway now constrains strategic flexibility. Capital efficiency has fallen below sustainable threshold. Deployment options narrowing."
        : scenario === "downside"
        ? "Growth-to-efficiency pressure is emerging in the portfolio company. Current trajectory requires recalibration within next quarter."
        : scenario === "upside"
        ? "Key metrics exceeding plan assumptions. Unit economics remain sustainable. Original investment thesis intact and strengthening."
        : "Metrics operating within expected range. Deployment efficiency acceptable for stage. Standard monitoring cadence appropriate.",
      
      risks: scenario === "extreme"
        ? "Risk concentration elevated materially. Downside probability has increased. Margin for execution error has narrowed significantly."
        : scenario === "downside"
        ? "Margin compression becoming evident in financials. Current burn rate inconsistent with runway assumptions in model."
        : scenario === "upside"
        ? "Execution scaling risk present as growth accelerates. Current valuation may exceed near-term fundamentals."
        : "Risk factors within normal distribution for stage. No material concerns requiring intervention at current levels.",
      
      action: scenario === "extreme"
        ? "Prioritize capital preservation. Restructure operations before additional deployment. Board governance engagement advised."
        : scenario === "downside"
        ? "Shift to monthly monitoring cycle. Milestone-based capital release recommended. Request detailed response plan."
        : scenario === "upside"
        ? "Evaluate follow-on position at current terms. Monitor for overheating indicators in growth metrics."
        : "Quarterly monitoring cadence sufficient. No portfolio action required at this time."
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
  const [contentKey, setContentKey] = useState(0);
  const [isProcessingQuestion, setIsProcessingQuestion] = useState(false);
  const [customResponse, setCustomResponse] = useState<{observation: string; risk: string; action: string} | null>(null);
  
  // Sequential typing state
  const [observationComplete, setObservationComplete] = useState(false);
  const [risksComplete, setRisksComplete] = useState(false);
  
  const viewMode = useScenarioStore((s) => s.viewMode);
  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
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
  const aiContent = customResponse ? {
    observation: customResponse.observation,
    risks: customResponse.risk,
    action: customResponse.action
  } : defaultContent;
  
  // Slower typewriter speed (45ms per character = ~22 chars/second)
  const typingSpeed = 45;

  // Handle strategic question click
  const handlePromptClick = useCallback((
    response: { observation: string; risk: string; action: string },
    kpis: number[],
    constraint: string
  ) => {
    setIsProcessingQuestion(true);
    
    // Brief analyzing state
    setTimeout(() => {
      setCustomResponse(response);
      setContentKey(k => k + 1);
      setIsProcessingQuestion(false);
      
      // Highlight primary KPI
      if (kpis.length > 0) {
        setHoveredKpiIndex(kpis[0]);
        // Clear highlight after 4 seconds
        setTimeout(() => setHoveredKpiIndex(null), 4000);
      }
    }, 600);
  }, [setHoveredKpiIndex]);

  return (
    <div className={`ai-panel ${viewMode}`}>
      <div className="panel-edge" />
      
      <div className="panel-header">
        <div className="header-left">
          <div className="brain-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5Z"/>
              <path d="M16 8V5c0-1.1.9-2 2-2"/>
              <path d="M12 13h4"/>
              <path d="M12 18h6a2 2 0 0 1 2 2v1"/>
              <path d="M12 8h8"/>
              <path d="M20.5 8.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 1.32 4.24"/>
            </svg>
          </div>
          <div className="header-text">
            <span className="header-title">STRATEGIC BRIEF</span>
            <span className="header-subtitle">
              {viewMode === "operator" ? "Operator View" : "Investor View"}
            </span>
          </div>
        </div>
        <div className="signal-dots">
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
          onComplete={() => setObservationComplete(true)}
        />
        
        <AISection 
          title="RISKS" 
          content={aiContent.risks}
          isAnalyzing={isAnalyzing}
          canStart={observationComplete}
          contentKey={contentKey}
          speed={typingSpeed}
          onComplete={() => setRisksComplete(true)}
          isRiskSection={true}
        />
        
        <AISection 
          title="ACTION" 
          content={aiContent.action}
          isAnalyzing={isAnalyzing}
          canStart={risksComplete}
          contentKey={contentKey}
          speed={typingSpeed}
        />
      </div>

      {/* Strategic Questions Panel */}
      <StrategicQuestions 
        onPromptClick={handlePromptClick}
        isAnalyzing={isAnalyzing}
      />

      <style>{`
        .ai-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #161b22;
          border: 1px solid #0d1117;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }

        .panel-edge {
          position: absolute;
          left: 0;
          top: 16px;
          bottom: 16px;
          width: 3px;
          background: linear-gradient(to bottom, transparent, #22d3ee, transparent);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.5);
          border-radius: 2px;
        }

        .ai-panel.investor .panel-edge {
          opacity: 0.6;
        }

        .panel-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px 10px 18px;
          border-bottom: 1px solid #21262d;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brain-icon {
          color: #22d3ee;
          filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.5));
          animation: brain-glow 3s ease-in-out infinite;
        }

        @keyframes brain-glow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(34, 211, 238, 0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.7)); }
        }

        .ai-panel.investor .brain-icon {
          filter: drop-shadow(0 0 3px rgba(34, 211, 238, 0.3));
          animation: none;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .header-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #22d3ee;
          text-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
        }

        .ai-panel.investor .header-title {
          text-shadow: none;
          opacity: 0.9;
        }

        .header-subtitle {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.35);
        }

        .signal-dots {
          display: flex;
          gap: 6px;
        }

        .signal-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .signal-dot.dot-1 {
          animation: dot-sweep 1.8s ease-in-out infinite;
        }

        .signal-dot.dot-2 {
          animation: dot-sweep 1.8s ease-in-out infinite 0.3s;
        }

        .signal-dot.dot-3 {
          animation: dot-sweep 1.8s ease-in-out infinite 0.6s;
        }

        @keyframes dot-sweep {
          0%, 100% { 
            background: rgba(34, 197, 94, 0.2);
            border-color: rgba(34, 197, 94, 0.3);
            box-shadow: none;
          }
          40%, 60% { 
            background: #22c55e;
            border-color: #22c55e;
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
          }
        }

        .ai-panel.investor .signal-dot {
          animation-duration: 2.4s;
        }

        .panel-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 10px 14px 8px 18px;
          overflow-y: auto;
          min-height: 0;
          max-height: calc(100% - 220px);
        }

        .panel-content::-webkit-scrollbar {
          width: 3px;
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .ai-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .section-header {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #22d3ee;
          text-shadow: 0 0 6px rgba(34, 211, 238, 0.3);
        }

        .section-header.risk-header {
          color: #f87171;
          text-shadow: 0 0 6px rgba(248, 113, 113, 0.3);
        }

        .ai-panel.investor .section-header {
          text-shadow: none;
          opacity: 0.85;
        }

        .ai-panel.investor .section-header.risk-header {
          color: #fca5a5;
        }

        .section-content {
          font-size: 12px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.8);
          min-height: 28px;
        }

        .typewriter-text {
          font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
          font-size: 11px;
          letter-spacing: 0.01em;
        }

        .analyzing-text {
          color: rgba(34, 211, 238, 0.5);
          font-style: italic;
          font-family: 'Inter', sans-serif;
        }

        .waiting {
          color: rgba(255, 255, 255, 0.15);
          font-family: 'Courier New', monospace;
        }

        .cursor {
          color: #22d3ee;
          font-weight: 400;
          margin-left: 1px;
          animation: blink 0.5s step-end infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

      `}</style>
    </div>
  );
}
