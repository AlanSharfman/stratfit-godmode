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
// TYPEWRITER HOOK
// ============================================================================

function useTypewriter(text: string, speed: number = 18, enabled: boolean = true, startDelay: number = 0) {
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

    const delayTimeout = setTimeout(() => {
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
    }, startDelay);

    return () => clearTimeout(delayTimeout);
  }, [text, speed, enabled, startDelay]);

  return { displayText, isComplete, hasStarted };
}

// ============================================================================
// AI SECTION COMPONENT
// ============================================================================

function AISection({ 
  title, 
  content, 
  isAnalyzing, 
  delay,
  contentKey,
  speed
}: { 
  title: string; 
  content: string; 
  isAnalyzing: boolean;
  delay: number;
  contentKey: number;
  speed: number;
}) {
  const { displayText, isComplete, hasStarted } = useTypewriter(
    content, 
    speed, 
    !isAnalyzing, 
    delay
  );

  return (
    <div className="ai-section">
      <div className="section-header">{title}</div>
      <div className="section-content">
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
                  {!isComplete && <span className="cursor">|</span>}
                </>
              ) : (
                <span className="waiting">—</span>
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
        ? "Time is now the dominant constraint shaping every strategic decision. Current trajectory compresses optionality faster than value creation can offset. The system is approaching a decision boundary where reversibility diminishes rapidly. Capital efficiency metrics indicate structural misalignment between growth ambitions and resource allocation."
        : scenario === "downside"
        ? "Momentum is outrunning resilience. The widening gap between growth rate and structural strength creates asymmetric downside exposure. Burn quality deterioration suggests the current operating model requires recalibration. Leading indicators point to increasing strain on execution capacity."
        : scenario === "upside"
        ? "System performing above baseline expectations. Growth vectors are aligned and mutually reinforcing. Capital efficiency trending positive with sustainable unit economics emerging. Primary opportunity exists in accelerating proven channels while maintaining operational discipline."
        : "System operating within tolerance bands. Primary tension exists between expansion velocity and burn efficiency, but neither metric is at critical threshold. Market conditions remain supportive. Focus should be on identifying the next constraint before it becomes binding.",
      
      risks: scenario === "extreme"
        ? "Runway constraint creates forced-hand scenarios within 6 months. Execution variance amplifies downside asymmetrically—small misses compound into structural problems. Fundraising leverage diminishes as runway shortens, creating adverse selection dynamics. Team retention risk elevates as uncertainty persists."
        : scenario === "downside"
        ? "Efficiency degradation compounds monthly at current trajectory. Hiring intensity is unsustainable relative to revenue certainty. Market timing risk increases if competitors achieve efficiency gains first. Customer concentration may create revenue volatility that stress-tests the current structure."
        : scenario === "upside"
        ? "Success creates its own risks. Rapid scaling may outpace operational infrastructure. Key person dependencies could become critical bottlenecks. Market expectations may exceed sustainable delivery capacity, creating credibility risk."
        : "Market volatility exposure remains moderate. Funding pressure is latent but watchable—monitor for early warning signals. Competitive dynamics stable but subject to disruption. Execution risk within normal parameters assuming current team capacity holds.",
      
      action: scenario === "extreme"
        ? "Immediate: Reduce burn by 25-30% through targeted cuts, not across-the-board. Strategic: Narrow focus to single highest-conviction growth vector. Accept near-term revenue deceleration to extend runway beyond 18 months. Begin investor conversations now, before leverage erodes further."
        : scenario === "downside"
        ? "Rebalance hiring velocity against revenue certainty—pause discretionary roles. Preserve optionality over growth rate for next 2 quarters. Renegotiate vendor contracts while leverage exists. Build scenario models for further deterioration to avoid surprise decision-making."
        : scenario === "upside"
        ? "Accelerate investment in proven channels. Lock in key talent before market competition intensifies. Consider strategic capital raise from position of strength. Document operational playbooks to enable scaling without founder bottlenecks."
        : "Maintain current trajectory with weekly efficiency monitoring. No immediate intervention required. Use stability period to stress-test assumptions and build contingency plans. Identify leading indicators that would trigger mode shift."
    };
  } else {
    return {
      observation: scenario === "extreme"
        ? "Runway constrains all strategic flexibility. Capital efficiency is below sustainable threshold, indicating structural challenges beyond market timing. Management optionality is limited, reducing their ability to navigate uncertainty. Valuation expectations may require recalibration."
        : scenario === "downside"
        ? "Growth-to-efficiency ratio indicates emerging structural pressure. Current trajectory requires recalibration to reach sustainable economics. Leading indicators suggest operating model friction that may persist beyond current cycle."
        : scenario === "upside"
        ? "Operating metrics exceeding plan with sustainable unit economics. Management executing against stated milestones. Capital efficiency supports thesis assumptions. Risk/return profile improving."
        : "Operating metrics within expected range. Capital deployment efficiency acceptable relative to stage. No material deviation from underwriting assumptions. Standard monitoring cadence appropriate.",
      
      risks: scenario === "extreme"
        ? "Risk concentration increases portfolio sensitivity to this position. Downside scenarios have elevated probability—model terminal value scenarios carefully. Management quality becomes critical variable as margin for error narrows. Secondary market liquidity limited if conditions persist."
        : scenario === "downside"
        ? "Margin compression evident in recent cohorts. Burn trajectory inconsistent with stated runway assumptions—verify independently. Competitive position may deteriorate if efficiency gap widens. Reserve allocation assumptions may require revision."
        : scenario === "upside"
        ? "Primary risk is execution scaling—success creates operational complexity. Valuation may expand beyond defensible fundamentals if momentum persists. Governance considerations increase as stakes rise."
        : "Risk factors within normal distribution for stage and sector. No material concerns at current exposure levels. Standard portfolio monitoring appropriate. Thesis intact.",
      
      action: scenario === "extreme"
        ? "Capital preservation priority. Recommend operational restructuring before additional deployment. Request detailed bridge scenario analysis. Consider position sizing relative to portfolio risk tolerance. Governance engagement may be appropriate."
        : scenario === "downside"
        ? "Increase monitoring frequency to monthly. Milestone-based capital release advisable. Request management response plan within 30 days. Model downside scenarios to stress-test reserve adequacy."
        : scenario === "upside"
        ? "Consider follow-on allocation if terms favorable. Engage on governance as position scales. Monitor for overheating indicators. Document value creation thesis for IC."
        : "Continue quarterly monitoring. Standard reporting cadence sufficient. No action required. Maintain reserves per plan."
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
  
  const viewMode = useScenarioStore((s) => s.viewMode);
  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const kpiValues = useScenarioStore((s) => s.kpiValues);
  
  const isAnalyzing = activeLeverId !== null || isProcessingQuestion;

  useEffect(() => {
    setContentKey((k) => k + 1);
    setCustomResponse(null);
  }, [scenario, viewMode]);

  const defaultContent = useMemo(() => getAIContent(viewMode, scenario), [viewMode, scenario]);
  
  // Use custom response if available, otherwise default
  const aiContent = customResponse ? {
    observation: customResponse.observation,
    risks: customResponse.risk,
    action: customResponse.action
  } : defaultContent;
  
  const typingSpeed = viewMode === "operator" ? 12 : 18;

  // Signal states
  const [signal1, setSignal1] = useState(false);
  const [signal2, setSignal2] = useState(false);
  const [signal3, setSignal3] = useState(false);

  useEffect(() => {
    if (isAnalyzing) {
      setSignal1(false);
      setSignal2(false);
      setSignal3(false);
      return;
    }

    const t1 = setTimeout(() => setSignal1(true), 100);
    const t2 = setTimeout(() => setSignal2(true), 800);
    const t3 = setTimeout(() => setSignal3(true), 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isAnalyzing, contentKey]);

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

  // Metrics for badges
  const runway = kpiValues.runway?.value ?? 18;
  const riskIndex = kpiValues.riskIndex?.value ?? 25;

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
          <div className={`signal-dot ${signal1 ? 'active' : ''}`} />
          <div className={`signal-dot ${signal2 ? 'active' : ''}`} />
          <div className={`signal-dot ${signal3 ? 'active' : ''}`} />
        </div>
      </div>

      <div className="panel-content">
        <AISection 
          title="OBSERVATION" 
          content={aiContent.observation}
          isAnalyzing={isAnalyzing}
          delay={0}
          contentKey={contentKey}
          speed={typingSpeed}
        />
        
        <AISection 
          title="RISKS" 
          content={aiContent.risks}
          isAnalyzing={isAnalyzing}
          delay={600}
          contentKey={contentKey}
          speed={typingSpeed}
        />
        
        <AISection 
          title="ACTION" 
          content={aiContent.action}
          isAnalyzing={isAnalyzing}
          delay={1200}
          contentKey={contentKey}
          speed={typingSpeed}
        />

        <div className="metrics-row">
          <div className={`metric-badge ${runway < 10 ? 'status-red' : runway < 15 ? 'status-orange' : 'status-green'}`}>
            <span className="metric-label">Runway</span>
            <span className="metric-value">{runway} mo</span>
            <span className="status-indicator" />
          </div>
          <div className={`metric-badge ${riskIndex > 55 ? 'status-red' : riskIndex > 35 ? 'status-orange' : 'status-green'}`}>
            <span className="metric-label">Risk</span>
            <span className="metric-value">{riskIndex}/100</span>
            <span className="status-indicator" />
          </div>
        </div>
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
          gap: 5px;
        }

        .signal-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          transition: all 0.4s ease;
        }

        .signal-dot.active {
          background: #22c55e;
          border-color: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.7);
          animation: pulse-green 2s ease-in-out infinite;
        }

        .ai-panel.investor .signal-dot.active {
          animation: none;
          box-shadow: 0 0 5px rgba(34, 197, 94, 0.5);
        }

        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 6px rgba(34, 197, 94, 0.6); }
          50% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.9); }
        }

        .panel-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
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

        .ai-panel.investor .section-header {
          text-shadow: none;
          opacity: 0.85;
        }

        .section-content {
          font-size: 12px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.8);
          min-height: 32px;
        }

        .analyzing-text {
          color: rgba(34, 211, 238, 0.5);
          font-style: italic;
        }

        .waiting {
          color: rgba(255, 255, 255, 0.2);
        }

        .cursor {
          color: #22d3ee;
          font-weight: 400;
          animation: blink 0.6s step-end infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .metrics-row {
          display: flex;
          gap: 8px;
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid #21262d;
          flex-shrink: 0;
        }

        .metric-badge {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 10px 8px;
          background: #161b22;
          border-radius: 6px;
          border: 1px solid #21262d;
          position: relative;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .metric-label {
          font-size: 8px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 3px;
        }

        .metric-value {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          transition: color 0.2s;
        }

        .status-indicator {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          border-radius: 2px;
          transition: background 0.2s, box-shadow 0.2s;
        }

        /* GREEN - Good status */
        .metric-badge.status-green {
          border-color: rgba(34, 197, 94, 0.35);
        }
        .metric-badge.status-green .metric-value {
          color: #4ade80;
        }
        .metric-badge.status-green .status-indicator {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
        }

        /* ORANGE - So-so status */
        .metric-badge.status-orange {
          border-color: rgba(251, 146, 60, 0.4);
        }
        .metric-badge.status-orange .metric-value {
          color: #fb923c;
        }
        .metric-badge.status-orange .status-indicator {
          background: #f97316;
          box-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
        }

        /* RED - Poor status */
        .metric-badge.status-red {
          border-color: rgba(239, 68, 68, 0.45);
        }
        .metric-badge.status-red .metric-value {
          color: #f87171;
        }
        .metric-badge.status-red .status-indicator {
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
        }
      `}</style>
    </div>
  );
}
