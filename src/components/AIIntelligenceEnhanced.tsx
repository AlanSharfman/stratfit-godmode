// src/components/AIIntelligenceEnhanced.tsx
// STRATFIT — Enhanced AI Intelligence Panel (MVP - No Typewriter)
// Structured: Observation / Risks / Actions - INSTANT updates

import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScenarioStore, ViewMode } from "@/state/scenarioStore";
import type { ScenarioId } from "@/state/scenarioStore";
import { calculateMetrics, LeverState } from "@/logic/calculateMetrics";
import { onCausal } from "@/ui/causalEvents";

// ============================================================================
// TYPEWRITER — “MILITARY MODE” PRESENTATION LAYER (UI ONLY)
// Triggers only on explicit causal events (slider release / scenario switch / save-load)
// ============================================================================

function useTypewriterText(params: {
  text: string;
  enabled: boolean;
  nonce: number;
  startDelayMs?: number;
  baseSpeedMs?: number;
}) {
  const { text, enabled, nonce, startDelayMs = 0, baseSpeedMs = 15 } = params;
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOut(text);
      setDone(true);
      return;
    }

    let cancelled = false;
    let idx = 0;
    let timeoutId: number | undefined;

    setOut("");
    setDone(false);

    const tick = () => {
      if (cancelled) return;
      if (idx >= text.length) {
        setDone(true);
        return;
      }

      // Type 1–3 characters for rhythm
      let n = 1;
      if (Math.random() > 0.75 && idx < text.length - 2) n = Math.random() > 0.5 ? 2 : 3;

      const nextIdx = Math.min(text.length, idx + n);
      const typedChar = text[Math.max(0, nextIdx - 1)] ?? "";
      const nextChar = text[nextIdx] ?? "";
      idx = nextIdx;
      setOut(text.slice(0, idx));

      // Punctuation timing (clear + readable)
      let delay = baseSpeedMs + (Math.random() * 10 - 5);
      if (typedChar === "." || typedChar === "!" || typedChar === "?") delay = baseSpeedMs * 7;
      else if (typedChar === "," || typedChar === ";" || typedChar === ":") delay = baseSpeedMs * 4;
      else if (typedChar === " " && nextChar && /[A-Z]/.test(nextChar)) delay = baseSpeedMs * 3;

      timeoutId = window.setTimeout(tick, Math.max(8, delay));
    };

    timeoutId = window.setTimeout(tick, startDelayMs);
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [text, enabled, nonce, startDelayMs, baseSpeedMs]);

  return { out, done };
}

// ============================================================================
// TYPES
// ============================================================================

interface Risk {
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  emoji: string;
  title: string;
  driver: string;
  impact: string;
}

interface Action {
  priority: number;
  title: string;
  impact: string;
}

interface AIInsights {
  observation: string;
  metrics: Array<{
    label: string;
    value: string;
    change: string;
  }>;
  risks: Risk[];
  actions: Action[];
  timestamp: Date;
}

interface AIIntelligenceEnhancedProps {
  levers: LeverState;
  scenario: ScenarioId;
}

// ============================================================================
// INSIGHT GENERATION (Pattern-Based - Fast)
// ============================================================================

function generateInsights(
  levers: LeverState,
  scenario: ScenarioId,
  viewMode: ViewMode
): AIInsights {
  const metrics = calculateMetrics(levers, scenario);
  const baselineMetrics = calculateMetrics(
    {
      demandStrength: 60,
      pricingPower: 50,
      expansionVelocity: 45,
      costDiscipline: 55,
      hiringIntensity: 40,
      operatingDrag: 35,
      marketVolatility: 30,
      executionRisk: 25,
      fundingPressure: 20,
    },
    "base"
  );

  // Calculate deltas
  const runwayDelta = metrics.runway - baselineMetrics.runway;
  const cashDelta = metrics.cashPosition - baselineMetrics.cashPosition;
  const momentumDelta = metrics.momentum - baselineMetrics.momentum;
  
  // Determine overall strain level
  const strainLevel = calculateOverallStrain(metrics, levers);

  // Generate observation
  const observation = generateObservation(
    metrics,
    baselineMetrics,
    runwayDelta,
    cashDelta,
    momentumDelta,
    strainLevel,
    scenario,
    viewMode
  );

  // Generate key metrics summary
  const metricsSummary = [
    {
      label: "Runway",
      value: `${metrics.runway}mo`,
      change: runwayDelta > 0 ? `+${runwayDelta}mo` : `${runwayDelta}mo`
    },
    {
      label: "Cash",
      value: `$${metrics.cashPosition.toFixed(1)}M`,
      change: cashDelta > 0 ? `+${(cashDelta * 100 / baselineMetrics.cashPosition).toFixed(0)}%` : `${(cashDelta * 100 / baselineMetrics.cashPosition).toFixed(0)}%`
    },
    {
      label: "Momentum",
      value: `$${(metrics.momentum / 10).toFixed(1)}M`,
      change: momentumDelta > 0 ? `+${(momentumDelta * 100 / baselineMetrics.momentum).toFixed(0)}%` : `${(momentumDelta * 100 / baselineMetrics.momentum).toFixed(0)}%`
    }
  ];

  // Generate risks
  const risks = generateRisks(metrics, levers, scenario);

  // Generate actions
  const actions = generateActions(metrics, levers, risks, scenario);

  return {
    observation,
    metrics: metricsSummary,
    risks,
    actions,
    timestamp: new Date()
  };
}

function calculateOverallStrain(metrics: any, levers: LeverState): number {
  // Financial strain (runway-based)
  const financialStrain = metrics.runway < 12 ? 0.8 : metrics.runway < 18 ? 0.5 : 0.2;
  
  // Operational strain (hiring + drag)
  const operationalStrain = (levers.hiringIntensity / 100) * 0.6 + (levers.operatingDrag / 100) * 0.4;
  
  // Risk strain
  const riskStrain = metrics.riskIndex / 100;
  
  // Weighted aggregate
  return financialStrain * 0.4 + operationalStrain * 0.35 + riskStrain * 0.25;
}

function generateObservation(
  metrics: any,
  baseline: any,
  runwayDelta: number,
  cashDelta: number,
  momentumDelta: number,
  strain: number,
  scenario: ScenarioId,
  viewMode: ViewMode
): string {
  const strainLabel = strain < 0.3 ? "low" : strain < 0.6 ? "moderate" : "high";
  
  if (viewMode === "operator") {
    // Operator view: tactical, direct
    if (scenario === "extreme") {
      return `Runway critical at ${metrics.runway} months. Cash position requires immediate intervention. Current trajectory unsustainable without structural changes.`;
    } else if (scenario === "downside") {
      return `Conservative scenario shows ${metrics.runway}mo runway with reduced burn. Growth velocity constrained but stability prioritized. Execution strain ${strainLabel} at ${(strain * 100).toFixed(0)}%.`;
    } else if (scenario === "upside") {
      return `Aggressive growth trajectory projects ${Math.abs(momentumDelta * 100 / baseline.momentum).toFixed(0)}% momentum increase. Runway ${runwayDelta > 0 ? 'extends' : 'compresses'} to ${metrics.runway}mo. Execution strain ${strainLabel} at ${(strain * 100).toFixed(0)}%.`;
    } else {
      return `Base case maintains ${metrics.runway}mo runway with ${strainLabel} operational strain (${(strain * 100).toFixed(0)}%). Cash position stable at $${metrics.cashPosition.toFixed(1)}M. Growth and efficiency balanced.`;
    }
  } else {
    // Investor view: strategic, outcomes-focused
    if (scenario === "extreme") {
      return `Liquidity constraints limit strategic optionality. Runway compression to ${metrics.runway} months creates urgency for intervention or capital raise.`;
    } else if (scenario === "downside") {
      return `Conservative case prioritizes capital preservation over growth velocity. ${metrics.runway}-month runway provides buffer for market volatility.`;
    } else if (scenario === "upside") {
      return `Growth acceleration scenario delivers ${Math.abs(momentumDelta * 100 / baseline.momentum).toFixed(0)}% revenue upside with ${strainLabel} execution risk. ${metrics.runway}-month runway sufficient for current pace.`;
    } else {
      return `Base case projects sustainable growth with ${metrics.runway} months capital cushion. Operational efficiency and growth trajectory aligned with market expectations.`;
    }
  }
}

function generateRisks(
  metrics: any,
  levers: LeverState,
  scenario: ScenarioId
): Risk[] {
  const risks: Risk[] = [];

  // RISK 1: Cash runway
  if (metrics.runway < 12) {
    risks.push({
      severity: 'CRITICAL',
      emoji: '🔴',
      title: 'Runway below 12-month threshold',
      driver: `Current burn rate and cash position project ${metrics.runway}mo runway`,
      impact: 'Limited optionality for strategic pivots; requires immediate intervention'
    });
  } else if (metrics.runway < 18) {
    risks.push({
      severity: 'HIGH',
      emoji: '🟠',
      title: 'Runway below recommended 18-month buffer',
      driver: `${metrics.runway}mo runway with current spend trajectory`,
      impact: 'Constrains ability to weather market volatility or execution delays'
    });
  }

  // RISK 2: Hiring velocity
  if (levers.hiringIntensity > 60) {
    risks.push({
      severity: 'HIGH',
      emoji: '🟠',
      title: 'Aggressive hiring velocity',
      driver: `Hiring intensity at ${levers.hiringIntensity}% creates coordination complexity`,
      impact: 'Management bandwidth strain; quality dilution risk; cultural integration challenges'
    });
  } else if (levers.hiringIntensity > 40 && metrics.runway < 18) {
    risks.push({
      severity: 'MODERATE',
      emoji: '🟡',
      title: 'Hiring pace vs. runway tension',
      driver: `${levers.hiringIntensity}% hiring intensity with ${metrics.runway}mo runway`,
      impact: 'Burn rate acceleration may compress runway faster than revenue scales'
    });
  }

  // RISK 3: Operational drag
  if (levers.operatingDrag > 60) {
    risks.push({
      severity: 'MODERATE',
      emoji: '🟡',
      title: 'Operational inefficiency elevated',
      driver: `Operating drag at ${levers.operatingDrag}% indicates process friction`,
      impact: 'Reduced execution velocity; higher than optimal cost per output unit'
    });
  }

  // RISK 4: Market volatility
  if (levers.marketVolatility > 50 && scenario !== "downside") {
    risks.push({
      severity: 'MODERATE',
      emoji: '🟡',
      title: 'Market volatility exposure',
      driver: `${levers.marketVolatility}% market uncertainty in current scenario`,
      impact: 'Revenue predictability reduced; customer acquisition costs may spike'
    });
  }

  // RISK 5: Scenario-specific
  if (scenario === "extreme") {
    risks.push({
      severity: 'CRITICAL',
      emoji: '🔴',
      title: 'Structural deficit trajectory',
      driver: 'Burn exceeds revenue scaling by significant margin',
      impact: 'Path to sustainability unclear without major structural changes'
    });
  }

  // Sort by severity
  const severityOrder = { CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
  return risks.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]).slice(0, 3);
}

function generateActions(
  metrics: any,
  levers: LeverState,
  risks: Risk[],
  scenario: ScenarioId
): Action[] {
  const actions: Action[] = [];

  // ACTION 1: If runway is tight
  if (metrics.runway < 18) {
    if (levers.hiringIntensity > 40) {
      actions.push({
        priority: 1,
        title: 'Phase hiring into 2-3 stages',
        impact: `Extend runway by ~${Math.round(levers.hiringIntensity / 20)}mo; preserve strategic optionality`
      });
    }
    
    if (levers.costDiscipline < 60) {
      actions.push({
        priority: 1,
        title: 'Implement cost optimization review',
        impact: `Target 15-20% OpEx reduction; adds 2-3mo runway without impacting core product`
      });
    }
  }

  // ACTION 2: If hiring is aggressive
  if (levers.hiringIntensity > 60) {
    actions.push({
      priority: 2,
      title: 'Strengthen management layer before next hiring wave',
      impact: 'Reduces coordination strain; improves new hire integration and ramp time'
    });
  }

  // ACTION 3: If drag is high
  if (levers.operatingDrag > 60) {
    actions.push({
      priority: 2,
      title: 'Process audit on highest-friction workflows',
      impact: 'Unlock 10-15% productivity gain; reduce toil and context switching'
    });
  }

  // ACTION 4: Revenue acceleration (if runway OK)
  if (metrics.runway >= 18 && levers.demandStrength < 70) {
    actions.push({
      priority: 2,
      title: 'Accelerate demand generation initiatives',
      impact: 'Capitalize on runway buffer to test high-velocity growth channels'
    });
  }

  // ACTION 5: Monitoring
  if (metrics.runway < 24) {
    actions.push({
      priority: 3,
      title: `Monitor cash weekly; set alert at $${(metrics.cashPosition * 0.8).toFixed(1)}M`,
      impact: 'Provides 2-month early warning window for course correction'
    });
  }

  return actions.slice(0, 3);
}

// ============================================================================
// COMPONENTS
// ============================================================================

function RiskCard({
  risk,
  typing,
  nonce,
  startDelayMs,
}: {
  risk: Risk;
  typing: boolean;
  nonce: number;
  startDelayMs: number;
}) {
  const typedDriver = useTypewriterText({
    text: risk.driver,
    enabled: typing,
    nonce,
    startDelayMs,
    baseSpeedMs: 13,
  });
  const typedImpact = useTypewriterText({
    text: risk.impact,
    enabled: typing,
    nonce,
    startDelayMs: startDelayMs + 220,
    baseSpeedMs: 13,
  });

  const severityColors = {
    CRITICAL: 'rgba(239, 68, 68, 0.15)',
    HIGH: 'rgba(251, 146, 60, 0.15)',
    MODERATE: 'rgba(251, 191, 36, 0.15)',
    LOW: 'rgba(74, 222, 128, 0.15)'
  };

  const borderColors = {
    CRITICAL: '#ef4444',
    HIGH: '#fb923c',
    MODERATE: '#fbbf24',
    LOW: '#4ade80'
  };

  return (
    <div
      style={{
        background: severityColors[risk.severity],
        borderLeft: `3px solid ${borderColors[risk.severity]}`,
        padding: '12px 14px',
        marginBottom: '10px',
        borderRadius: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px' }}>{risk.emoji}</span>
        <span style={{ 
          fontSize: '11px',
          fontWeight: 600,
          color: borderColors[risk.severity],
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {risk.severity}
        </span>
        <span style={{ 
          fontSize: '13px', 
          fontWeight: 600, 
          color: 'rgba(255, 255, 255, 0.9)',
          flex: 1
        }}>
          {risk.title}
        </span>
      </div>
      <div style={{ 
        fontSize: '12px', 
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: '1.5',
        marginLeft: '22px'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <strong style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Driver:</strong>{" "}
          {typing ? <span className="sf-typed">{typedDriver.out}</span> : risk.driver}
        </div>
        <div>
          <strong style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Impact:</strong>{" "}
          {typing ? <span className="sf-typed">{typedImpact.out}</span> : risk.impact}
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  action,
  index,
  typing,
  nonce,
  startDelayMs,
}: {
  action: Action;
  index: number;
  typing: boolean;
  nonce: number;
  startDelayMs: number;
}) {
  const typedTitle = useTypewriterText({
    text: action.title,
    enabled: typing,
    nonce,
    startDelayMs,
    baseSpeedMs: 13,
  });
  const typedImpact = useTypewriterText({
    text: action.impact,
    enabled: typing,
    nonce,
    startDelayMs: startDelayMs + 220,
    baseSpeedMs: 13,
  });

  return (
    <div
      style={{
        padding: '12px 0',
        borderBottom: index < 2 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: '10px' }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'rgba(34, 211, 238, 0.6)',
          minWidth: '20px'
        }}>
          {action.priority}.
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '4px'
          }}>
            {typing ? <span className="sf-typed">{typedTitle.out}</span> : action.title}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: '1.4'
          }}>
            {typing ? <span className="sf-typed">{typedImpact.out}</span> : action.impact}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIIntelligenceEnhanced({ 
  levers, 
  scenario 
}: AIIntelligenceEnhancedProps) {
  const viewMode = useScenarioStore((s) => s.viewMode);
  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [typingNonce, setTypingNonce] = useState(0);
  const [typingActive, setTypingActive] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const didMountRef = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Generate insights instantly
  const insights = useMemo(() => {
    return generateInsights(levers, scenario, viewMode);
  }, [levers, scenario, viewMode]);

  // Respect reduced motion: show instantly.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduceMotion(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true);
  }, []);

  // Show brief "analyzing" state when dragging slider
  useEffect(() => {
    if (activeLeverId !== null) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => setIsAnalyzing(false), 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnalyzing(false);
    }
  }, [activeLeverId]);

  // Typewriter triggers ONLY on explicit causal events (no page load / no idle / no drag tick).
  const startTypewriter = useCallback(() => {
    if (reduceMotion) return;
    if (!didMountRef.current) {
      didMountRef.current = true;
    }
    setTypingNonce((n) => n + 1);
    setTypingActive(true);

    // Auto-release typing mode so subsequent live updates stay responsive while dragging.
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    const est = Math.min(3200, 700 + insights.observation.length * 14);
    typingTimeoutRef.current = window.setTimeout(() => setTypingActive(false), est);
  }, [insights.observation.length, reduceMotion]);

  useEffect(() => {
    const off = onCausal(() => startTypewriter());
    return () => {
      off();
      if (typingTimeoutRef.current !== null) window.clearTimeout(typingTimeoutRef.current);
    };
  }, [startTypewriter]);

  const typing = typingActive && !isAnalyzing && !reduceMotion;
  const typedObservation = useTypewriterText({
    text: insights.observation,
    enabled: typing,
    nonce: typingNonce,
    startDelayMs: 50,
    baseSpeedMs: 14,
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(13, 17, 23, 0.6)',
      borderRadius: '8px',
      border: '1px solid rgba(48, 54, 61, 0.6)',
      overflow: 'hidden'
    }}>
      {/* HEADER */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid rgba(48, 54, 61, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(34, 211, 238, 0.8)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: 'rgba(255, 255, 255, 0.85)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            SCENARIO INTELLIGENCE
          </span>
        </div>
        
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: 'rgba(34, 211, 238, 0.6)',
              fontWeight: 500
            }}
          >
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(34, 211, 238, 0.8)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            ANALYZING
          </motion.div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '18px',
        fontFamily: typing ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : undefined,
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${scenario}:${viewMode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {/* OBSERVATION */}
            <section style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                OBSERVATION
              </h4>
              <p style={{ 
                fontSize: '13.5px', 
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '12px'
              }}>
                {typing ? (
                  <>
                    <span className="sf-typed">{typedObservation.out}</span>
                    {!typedObservation.done ? <span className="sf-caret" /> : null}
                  </>
                ) : (
                  insights.observation
                )}
              </p>
              
              {/* Key Metrics */}
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                marginTop: '12px'
              }}>
                {insights.metrics.map((metric, i) => (
                  <div key={i} style={{
                    flex: 1,
                    padding: '8px 10px',
                    background: 'rgba(34, 211, 238, 0.05)',
                    border: '1px solid rgba(34, 211, 238, 0.15)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ 
                      fontSize: '10px', 
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginBottom: '3px'
                    }}>
                      {metric.label}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>
                      {metric.value}
                    </div>
                    <div style={{ 
                      fontSize: '10px',
                      color: metric.change.startsWith('+') 
                        ? 'rgba(74, 222, 128, 0.8)' 
                        : metric.change.startsWith('-')
                        ? 'rgba(248, 113, 113, 0.8)'
                        : 'rgba(255, 255, 255, 0.5)',
                      fontWeight: 600
                    }}>
                      {metric.change}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* RISKS */}
            {insights.risks.length > 0 && (
              <section style={{ marginBottom: '24px' }}>
                <h4 style={{ 
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  RISKS ({insights.risks.length})
                </h4>
                {insights.risks.map((risk, i) => (
                  <RiskCard
                    key={i}
                    risk={risk}
                    typing={typing}
                    nonce={typingNonce}
                    startDelayMs={Math.max(120, 220 + i * 140)}
                  />
                ))}
              </section>
            )}

            {/* ACTIONS */}
            {insights.actions.length > 0 && (
              <section>
                <h4 style={{ 
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  RECOMMENDED ACTIONS
                </h4>
                {insights.actions.map((action, i) => (
                  <ActionCard
                    key={i}
                    action={action}
                    index={i}
                    typing={typing}
                    nonce={typingNonce}
                    startDelayMs={Math.max(220, 520 + i * 160)}
                  />
                ))}
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div style={{
        padding: '10px 18px',
        borderTop: '1px solid rgba(48, 54, 61, 0.4)',
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          Updated {new Date(insights.timestamp).toLocaleTimeString()}
        </span>
        <span style={{ color: 'rgba(34, 211, 238, 0.4)' }}>
          Pattern Analysis
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .sf-typed { letter-spacing: 0.01em; }
        .sf-caret{
          display:inline-block;
          width: 8px;
          height: 14px;
          margin-left: 4px;
          background: rgba(34, 211, 238, 0.65);
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.25);
          transform: translateY(2px);
          animation: sfCaretBlink 900ms steps(1,end) infinite;
        }
        @keyframes sfCaretBlink{
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}