// src/components/AIIntelligenceEnhanced.tsx
// STRATFIT — NUCLEAR MODE AI Intelligence Panel
// Complete transformation with borders, animations, consistent typography

import React, { useMemo, useEffect, useRef, useState } from "react";
import { useScenarioStore, ViewMode } from "@/state/scenarioStore";
import type { ScenarioId } from "@/state/scenarioStore";
import { calculateMetrics, LeverState } from "@/logic/calculateMetrics";
import { Activity, MessageCircle, FileText, ChevronDown } from "lucide-react";
import styles from "./AIIntelligenceEnhanced.module.css";

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
    trend: 'up' | 'down' | 'neutral';
  }>;
  systemState: Array<{
    label: string;
    status: 'STABLE' | 'ELEVATED' | 'CRITICAL';
    strain: number;
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
// HELPER FUNCTIONS
// ============================================================================

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// ============================================================================
// INSIGHT GENERATION — FULLY REACTIVE TO LEVER CHANGES
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

  // Compute deltas from baseline
  const runwayDelta = metrics.runway - baselineMetrics.runway;
  const momentumDelta = metrics.momentum - baselineMetrics.momentum;
  const riskDelta = metrics.riskIndex - baselineMetrics.riskIndex;
  const burnDelta = metrics.burnQuality - baselineMetrics.burnQuality;

  // Derive dynamic observation text based on current state
  const runwayBand = metrics.runway >= 18 ? 'strong' : metrics.runway >= 12 ? 'adequate' : 'constrained';
  const growthSignal = momentumDelta >= 5 ? 'accelerating' : momentumDelta <= -5 ? 'contracting' : 'stable';
  const riskPosture = metrics.riskIndex >= 60 ? 'elevated' : metrics.riskIndex >= 40 ? 'moderate' : 'contained';
  
  const observation = [
    `Runway posture is ${runwayBand} at ${Math.round(metrics.runway)} months${runwayDelta !== 0 ? ` (${runwayDelta > 0 ? '+' : ''}${Math.round(runwayDelta)} vs baseline)` : ''}.`,
    `Growth momentum is ${growthSignal} with current lever configuration.`,
    riskPosture !== 'contained' ? `Risk exposure is ${riskPosture} and warrants attention.` : `Risk exposure remains contained under current assumptions.`,
  ].join(' ');

  // Derive system state from metrics
  const financialStrain = Math.min(100, Math.max(0, 100 - metrics.runway * 4));
  const operationalStrain = Math.min(100, Math.max(0, levers.hiringIntensity * 0.6 + levers.operatingDrag * 0.4));
  const executionStrain = Math.min(100, Math.max(0, levers.executionRisk * 0.7 + levers.marketVolatility * 0.3));

  const getStatus = (strain: number): 'STABLE' | 'ELEVATED' | 'CRITICAL' => {
    if (strain >= 65) return 'CRITICAL';
    if (strain >= 40) return 'ELEVATED';
    return 'STABLE';
  };

  const systemState = [
    { label: 'FINANCIAL', status: getStatus(financialStrain), strain: Math.round(financialStrain) },
    { label: 'OPERATIONAL', status: getStatus(operationalStrain), strain: Math.round(operationalStrain) },
    { label: 'EXECUTION', status: getStatus(executionStrain), strain: Math.round(executionStrain) },
  ];

  // Derive risks based on current lever values
  const risks: Risk[] = [];
  
  if (momentumDelta < -3) {
    risks.push({
      severity: momentumDelta < -10 ? 'CRITICAL' : 'HIGH',
      emoji: momentumDelta < -10 ? '🔴' : '🟠',
      title: 'ARR growth fragility',
      driver: `Growth momentum is ${Math.abs(Math.round(momentumDelta))}% below baseline`,
      impact: 'Revenue trajectory weakens and recovery requires tighter execution',
    });
  }
  
  if (levers.costDiscipline < 45) {
    risks.push({
      severity: levers.costDiscipline < 30 ? 'CRITICAL' : 'HIGH',
      emoji: levers.costDiscipline < 30 ? '🔴' : '🟠',
      title: 'Burn rate pressure',
      driver: `Cost discipline at ${levers.costDiscipline}% is below optimal threshold`,
      impact: 'Runway compression accelerates without corrective action',
    });
  }
  
  if (metrics.riskIndex > 55) {
    risks.push({
      severity: metrics.riskIndex > 70 ? 'CRITICAL' : 'MODERATE',
      emoji: metrics.riskIndex > 70 ? '🔴' : '🟡',
      title: 'Elevated risk exposure',
      driver: `Combined risk index at ${Math.round(metrics.riskIndex)}/100`,
      impact: 'Scenario volatility increases investor concern',
    });
  }

  if (risks.length === 0) {
    risks.push({
      severity: 'LOW',
      emoji: '🟢',
      title: 'Risk posture stable',
      driver: 'Current lever configuration within acceptable bounds',
      impact: 'Continue monitoring for early signals of drift',
    });
  }

  // Derive recommended actions based on current state
  const actions: Action[] = [];
  
  if (levers.hiringIntensity > 50) {
    actions.push({
      priority: actions.length + 1,
      title: 'Phase hiring into milestone-driven stages',
      impact: `Reduce hiring intensity from ${levers.hiringIntensity}% to extend runway`,
    });
  }
  
  if (levers.operatingDrag > 40) {
    actions.push({
      priority: actions.length + 1,
      title: 'Initiate operational efficiency review',
      impact: `Target ${Math.round(levers.operatingDrag * 0.3)}% OpEx optimization`,
    });
  }
  
  if (levers.demandStrength < 50) {
    actions.push({
      priority: actions.length + 1,
      title: 'Accelerate demand generation initiatives',
      impact: 'Strengthen pipeline to improve revenue trajectory',
    });
  }

  if (actions.length === 0) {
    actions.push({
      priority: 1,
      title: 'Maintain current trajectory',
      impact: 'Lever configuration supports stable execution path',
    });
  }

  return {
    observation,
    metrics: [
      { label: 'RUNWAY', value: `${Math.round(metrics.runway)}mo`, change: `${runwayDelta >= 0 ? '+' : ''}${Math.round(runwayDelta)}mo`, trend: runwayDelta > 0 ? 'up' : runwayDelta < 0 ? 'down' : 'neutral' },
      { label: 'CASH', value: `$${(metrics.cashPosition).toFixed(1)}M`, change: `${((metrics.cashPosition - baselineMetrics.cashPosition) / baselineMetrics.cashPosition * 100).toFixed(0)}%`, trend: metrics.cashPosition > baselineMetrics.cashPosition ? 'up' : metrics.cashPosition < baselineMetrics.cashPosition ? 'down' : 'neutral' },
      { label: 'MOMENTUM', value: `$${(metrics.momentum / 10).toFixed(1)}M`, change: `${momentumDelta >= 0 ? '+' : ''}${Math.round(momentumDelta)}%`, trend: momentumDelta > 0 ? 'up' : momentumDelta < 0 ? 'down' : 'neutral' },
    ],
    systemState,
    risks,
    actions,
    timestamp: new Date(),
  };
}

// ============================================================================
// TYPEWRITER HOOK — RESTARTS ON TEXT CHANGE
// ============================================================================

function useTypewriter(text: string, contentKey: string, speed: number = 20): string {
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Reset displayed text
    setDisplayedText('');
    let index = 0;

    // Start typing
    intervalRef.current = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, speed);

    // Cleanup on unmount or text change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [contentKey, speed, text]);

  return displayedText;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIIntelligenceEnhanced({ 
  levers, 
  scenario 
}: AIIntelligenceEnhancedProps) {
  const viewMode = useScenarioStore((s) => s.viewMode);
  
  const insights = useMemo(
    () => generateInsights(levers, scenario, viewMode),
    [levers, scenario, viewMode]
  );

  // LIVE UPDATE SIGNAL (sliders): `levers` prop updates on every slider move
  const leverSignal = useMemo(() => JSON.stringify(levers), [levers]);

  const [activeTab, setActiveTab] = useState<"executive" | "risk" | "value" | "questions">("executive");

  // Typewriter key: restart only when the displayed brief text changes (or mode changes)
  const briefText = insights.observation;
  const briefContentKey = useMemo(() => `${activeTab}:${briefText}`, [activeTab, briefText]);

  const typedObservation = useTypewriter(briefText, briefContentKey, 15);

  // Status pill: UPDATING on slider change, settles to STABLE after 600ms
  const [status, setStatus] = useState<"UPDATING" | "STABLE">("STABLE");
  const settleTimerRef = useRef<number | null>(null);
  useEffect(() => {
    setStatus("UPDATING");
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      setStatus("STABLE");
      settleTimerRef.current = null;
    }, 600);
    return () => {
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    };
  }, [leverSignal]);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [openRiskIndex, setOpenRiskIndex] = useState<number | null>(0);
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(0);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (showScrollHint && e.currentTarget.scrollTop > 20) setShowScrollHint(false);
  };

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const check = () => {
      setHasOverflow(el.scrollHeight > el.clientHeight + 1);
    };

    const raf = requestAnimationFrame(check);
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", check);
    };
  }, [activeTab, insights]);

  const horizonFromSeverity = (sev?: string) => {
    const s = (sev ?? "").toUpperCase();
    if (s === "CRITICAL") return "Now–30 days";
    if (s === "HIGH") return "30–90 days";
    if (s === "MODERATE") return "90–180 days";
    if (s === "LOW") return "180+ days";
    return "90–180 days";
  };

  const sensitivityFromSeverity = (sev?: string) => {
    const s = (sev ?? "").toUpperCase();
    if (s === "CRITICAL" || s === "HIGH") return "High sensitivity";
    if (s === "MODERATE") return "Medium sensitivity";
    if (s === "LOW") return "Low sensitivity";
    return "Medium sensitivity";
  };

  const categoryFromRisk = (risk: any) => {
    if (typeof risk?.category === "string" && risk.category.trim().length > 0) return risk.category.trim();
    const text = `${risk?.title ?? ""} ${risk?.driver ?? ""} ${risk?.impact ?? ""}`.toLowerCase();
    if (text.includes("arr") || text.includes("revenue") || text.includes("growth")) return "Revenue";
    if (text.includes("burn") || text.includes("opex") || text.includes("cost") || text.includes("margin")) return "Efficiency";
    if (text.includes("execution")) return "Execution";
    if (text.includes("risk") || text.includes("volatility")) return "Risk";
    return "General";
  };

  const severityWeight01 = (sev?: string) => {
    const s = (sev ?? "").toUpperCase();
    if (s === "CRITICAL") return 1.0;
    if (s === "HIGH") return 0.82;
    if (s === "MODERATE") return 0.58;
    if (s === "LOW") return 0.28;
    return 0.58;
  };

  const severityToCardAccent = (sev: Risk["severity"]) => {
    if (sev === "CRITICAL") return styles.accentCritical;
    if (sev === "HIGH" || sev === "MODERATE") return styles.accentWarning;
    return styles.accentPositive;
  };

  const statusToCardAccent = (status: AIInsights["systemState"][number]["status"]) => {
    if (status === "CRITICAL") return styles.accentCritical;
    if (status === "ELEVATED") return styles.accentWarning;
    return styles.accentPositive;
  };

  const cueFromSeverity = (sev?: string) => {
    const s = (sev ?? "").toUpperCase();
    if (s === "CRITICAL") return "Escalate";
    if (s === "HIGH") return "Watch";
    if (s === "MODERATE") return "Monitor";
    if (s === "LOW") return "Contained";
    return "Monitor";
  };

  const confidenceFromSeverity = (sev?: string) => {
    const s = (sev ?? "").toUpperCase();
    if (s === "CRITICAL" || s === "HIGH") return { label: "Lower confidence", className: styles.bandCritical };
    if (s === "MODERATE") return { label: "Medium confidence", className: styles.bandWarning };
    if (s === "LOW") return { label: "Higher confidence", className: styles.bandPositive };
    return { label: "Medium confidence", className: styles.bandWarning };
  };

  const riskScore = (() => {
    if (!insights.risks || insights.risks.length === 0) return 0;
    const sum = insights.risks.reduce((acc, r) => {
      if (!r?.severity) return acc;
      if (r.severity === "CRITICAL") return acc - 3;
      if (r.severity === "HIGH") return acc - 2;
      if (r.severity === "MODERATE") return acc - 1;
      return acc + 0;
    }, 0);
    return Math.max(-6, Math.min(3, sum));
  })();

  const valuationPosture =
    !insights.risks || insights.risks.length === 0
      ? "Neutral"
      : riskScore <= -4
        ? "Compression"
        : riskScore >= -3 && riskScore <= -2
          ? "Mild compression"
          : riskScore >= -1 && riskScore <= 1
            ? "Neutral"
            : "Expansion";

  const hasElevatedOrCriticalSystem =
    Array.isArray(insights.systemState) &&
    insights.systemState.some((s) => s.status === "ELEVATED" || s.status === "CRITICAL");
  const hasAllStableSystem =
    Array.isArray(insights.systemState) &&
    insights.systemState.length > 0 &&
    insights.systemState.every((s) => s.status === "STABLE");

  // --------------------------------------------------------------------------
  // RISK MAP (RADAR) — derived deterministically from existing `insights.risks`
  // --------------------------------------------------------------------------
  type Axis = {
    key: string;
    label: string;
    keywords: string[];
  };

  const axes: Axis[] = useMemo(
    () => [
      { key: "financial", label: "Financial strain", keywords: ["burn", "cash", "runway", "margin", "opex", "cost"] },
      { key: "operational", label: "Operational complexity", keywords: ["operational", "hiring", "headcount", "process", "drag"] },
      { key: "execution", label: "Execution risk", keywords: ["execution", "delivery", "pipeline", "sales cycle"] },
      { key: "market", label: "Market volatility", keywords: ["market", "volatility", "macro", "churn"] },
      { key: "runway", label: "Runway pressure", keywords: ["runway", "burn", "cash"] },
      { key: "growth", label: "Growth fragility", keywords: ["growth", "arr", "revenue", "momentum"] },
    ],
    []
  );

  const overallExposure01 = useMemo(() => {
    const rs = Array.isArray(insights.risks) ? insights.risks : [];
    if (rs.length === 0) return 0.5;
    const avg = rs.reduce((acc, r) => acc + severityWeight01(r?.severity), 0) / rs.length;
    return clamp01(avg);
  }, [insights.risks]);

  const axisValues01 = useMemo(() => {
    const rs = Array.isArray(insights.risks) ? insights.risks : [];
    const values = axes.map((axis) => {
      const hits = rs.filter((r) => {
        const t = `${r?.title ?? ""} ${r?.driver ?? ""} ${r?.impact ?? ""}`.toLowerCase();
        return axis.keywords.some((k) => t.includes(k));
      });
      if (hits.length === 0) return overallExposure01;
      const avg = hits.reduce((acc, r) => acc + severityWeight01(r?.severity), 0) / hits.length;
      return clamp01(avg);
    });
    return values;
  }, [axes, insights.risks, overallExposure01]);

  const bandFrom01 = (v01: number) => (v01 < 0.34 ? "Low" : v01 < 0.67 ? "Med" : "High");

  const radar = useMemo(() => {
    const cx = 170;
    const cy = 120;
    const r = 84;
    const rings = [0.33, 0.66, 1.0];
    const n = axes.length;

    const angleAt = (i: number) => (-Math.PI / 2) + (i * (2 * Math.PI) / n);
    const pointAt = (i: number, v01: number, radiusScale = 1) => {
      const a = angleAt(i);
      const rr = r * clamp01(v01) * radiusScale;
      return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
    };

    const gridPaths = rings.map((k) => {
      const pts = Array.from({ length: n }, (_, i) => pointAt(i, k, 1));
      const d = pts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
      return d;
    });

    const axesLines = Array.from({ length: n }, (_, i) => {
      const p = pointAt(i, 1, 1.15);
      return { x2: p.x, y2: p.y };
    });

    const polyPts = axisValues01.map((v, i) => pointAt(i, v, 1));
    const polyD = polyPts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

    const hasCritical = (insights.risks ?? []).some((r) => r?.severity === "CRITICAL");
    const hasHigh = (insights.risks ?? []).some((r) => r?.severity === "HIGH");
    const fillClass = hasCritical ? styles.radarFillCritical : hasHigh ? styles.radarFillWarning : styles.radarFillWarning;

    return { cx, cy, r, gridPaths, axesLines, polyPts, polyD, fillClass };
  }, [axes.length, axisValues01, insights.risks]);

  // --------------------------------------------------------------------------
  // QUESTIONS — deterministic Q&A when no dedicated dataset exists
  // --------------------------------------------------------------------------
  const topAxisIndex = useMemo(() => {
    let best = 0;
    for (let i = 1; i < axisValues01.length; i++) {
      if (axisValues01[i] > axisValues01[best]) best = i;
    }
    return best;
  }, [axisValues01]);

  const questions = useMemo(() => {
    const exposureBand = bandFrom01(overallExposure01);
    const focalAxis = axes[topAxisIndex]?.label ?? "Risk exposure";
    const posture = valuationPosture;
    const leverLine =
      Array.isArray(insights.actions) && insights.actions.length > 0
        ? "Several execution levers are available; prioritize the ones that reduce concentrated exposure first."
        : "Execution levers are limited; focus on stabilizing the dominant exposure driver first.";

    return [
      {
        q: "What must be true to preserve optionality under current conditions?",
        a:
          posture === "Compression"
            ? "Maintain resilience and reduce fragility in the highest-pressure area. Keep scope tight, minimize reversible commitments, and prioritize containment over expansion."
            : posture === "Expansion"
              ? "Protect execution quality while scaling. Prioritize controlled investment where signals are strongest, and keep risk containment mechanisms active."
              : "Maintain execution discipline and keep optionality intact. Allocate investment selectively and tighten risk containment where exposure is rising.",
      },
      {
        q: "Where is exposure concentrated right now, and how should we interpret it?",
        a: `Overall exposure is ${exposureBand}. The map shows the largest pressure in “${focalAxis}”. A larger footprint indicates broader exposure; spikes indicate concentrated pressure points.`,
      },
      {
        q: "Which actions are most credible to shift posture within the current envelope?",
        a: `${leverLine} Use the Risk Map to target the axis with the highest band first, then validate that the footprint contracts as sliders move.`,
      },
    ];
  }, [axes, insights.actions, overallExposure01, topAxisIndex, valuationPosture]);

  const openAnswerText = openQuestionIndex === null ? "" : (questions[openQuestionIndex]?.a ?? "");
  const answerContentKey = useMemo(
    () => `${leverSignal}:${activeTab}:${openQuestionIndex ?? "none"}:${openAnswerText}`,
    [activeTab, leverSignal, openAnswerText, openQuestionIndex]
  );
  const typedAnswer = useTypewriter(openAnswerText, answerContentKey, 14);

  // --------------------------------------------------------------------------
  // ENTERPRISE VALUE — drivers diagram + directional signal trends (no raw numbers)
  // --------------------------------------------------------------------------
  const postureConfidence = useMemo(() => {
    const mag = Math.abs(riskScore);
    if (mag <= 1) return { label: "Higher confidence", className: styles.bandPositive };
    if (mag <= 3) return { label: "Medium confidence", className: styles.bandWarning };
    return { label: "Lower confidence", className: styles.bandCritical };
  }, [riskScore]);

  const driverTone = useMemo(() => {
    if (valuationPosture === "Expansion") {
      return {
        revenue: styles.nodePositive,
        growth: styles.nodePositive,
        margin: styles.nodePositive,
        optionality: styles.nodePositive,
      };
    }
    if (valuationPosture === "Compression") {
      return {
        revenue: styles.nodeWarning,
        growth: styles.nodeCritical,
        margin: styles.nodeWarning,
        optionality: styles.nodeWarning,
      };
    }
    return {
      revenue: styles.nodeCyan,
      growth: styles.nodeCyan,
      margin: styles.nodeCyan,
      optionality: styles.nodeCyan,
    };
  }, [valuationPosture]);

  const spark = useMemo(() => {
    const up = "M6 18 L16 14 L26 16 L36 10 L46 12 L56 8";
    const down = "M6 8 L16 12 L26 10 L36 16 L46 14 L56 18";
    const flat = "M6 14 L16 14 L26 13 L36 14 L46 14 L56 13";
    const d = valuationPosture === "Expansion" ? up : valuationPosture === "Compression" ? down : flat;
    return {
      d,
      label: valuationPosture === "Expansion" ? "Positive bias" : valuationPosture === "Compression" ? "Defensive bias" : "Balanced bias",
    };
  }, [valuationPosture]);

  return (
    <div ref={panelRef} className={styles.aiPanel} onScroll={handleScroll}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.title}>SCENARIO INTELLIGENCE</div>
          <div className={`${styles.statusPill} ${status === "UPDATING" ? styles.updating : styles.stable}`}>
            {status}
          </div>
        </div>
        <div className={styles.timestamp}>Last updated 2m ago</div>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "executive" ? styles.active : ""}`}
          onClick={() => setActiveTab("executive")}
        >
          BRIEF
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "risk" ? styles.active : ""}`}
          onClick={() => setActiveTab("risk")}
        >
          Risk Map
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "value" ? styles.active : ""}`}
          onClick={() => setActiveTab("value")}
        >
          VALUE
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "questions" ? styles.active : ""}`}
          onClick={() => setActiveTab("questions")}
        >
          QUESTIONS
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "executive" && (
          <>
            <div className={styles.sectionHeader}>
              <Activity className={styles.sectionIcon} />
              <span>EXECUTIVE BRIEF</span>
            </div>

            <div className={styles.card}>
              <div className={`${styles.cardLabel} ${styles.neutral}`}>Executive Summary</div>
              <div className={styles.cardText}>
                {typedObservation}
                {status === "UPDATING" ? <span className={styles.cursor} /> : null}
              </div>
            </div>

            <div className={styles.sectionHeader}>
              <Activity className={styles.sectionIcon} />
              <span>SIGNALS</span>
            </div>

            {insights.systemState.slice(0, 3).map((state, i) => {
              const conf =
                state.status === "CRITICAL"
                  ? { label: "Lower confidence", className: styles.bandCritical }
                  : state.status === "ELEVATED"
                    ? { label: "Medium confidence", className: styles.bandWarning }
                    : { label: "Higher confidence", className: styles.bandPositive };
              const cue = state.status === "CRITICAL" ? "Escalate" : state.status === "ELEVATED" ? "Watch" : "Contained";

              return (
                <div key={`sys-${i}`} className={`${styles.card} ${statusToCardAccent(state.status)}`}>
                  <div className={styles.chipRow}>
                    <span className={`${styles.chip} ${styles.chipNeutral}`}>{state.label}</span>
                    <span className={`${styles.chip} ${styles.chipCyan}`}>Cue: {cue}</span>
                    <span className={`${styles.chip} ${conf.className}`}>{conf.label}</span>
                  </div>
                  <div className={styles.cardText}>{state.status}</div>
                  <div className={styles.cardMeta}>{state.strain}% strain</div>
                </div>
              );
            })}

            {insights.risks.slice(0, 4).map((risk, i) => {
              const conf = confidenceFromSeverity(risk?.severity);
              return (
                <div key={`risk-signal-${i}`} className={`${styles.card} ${severityToCardAccent(risk.severity)}`}>
                  <div className={styles.chipRow}>
                    <span className={`${styles.chip} ${styles.chipNeutral}`}>{categoryFromRisk(risk)}</span>
                    <span className={`${styles.chip} ${styles.chipCyan}`}>Cue: {cueFromSeverity(risk?.severity)}</span>
                    <span className={`${styles.chip} ${conf.className}`}>{conf.label}</span>
                  </div>
                  <div className={styles.cardText}>{risk.title}</div>
                  <div className={styles.cardSubtext}>{risk.driver}</div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === "risk" && (
          <>
            <div className={styles.sectionHeader}>
              <Activity className={styles.sectionIcon} />
              <span>RISK MAP</span>
            </div>

            <div className={`${styles.card} ${styles.radarCard}`}>
              <div className={`${styles.cardLabel} ${styles.neutral}`}>Exposure footprint</div>
              <div className={styles.radarWrap}>
                <svg className={styles.radarSvg} viewBox="0 0 340 220" role="img" aria-label="Risk radar map">
                  {/* Grid rings */}
                  {radar.gridPaths.map((d, i) => (
                    <path key={`g-${i}`} d={d} className={styles.radarGrid} />
                  ))}
                  {/* Axes */}
                  {radar.axesLines.map((l, i) => (
                    <line
                      key={`a-${i}`}
                      x1={radar.cx}
                      y1={radar.cy}
                      x2={l.x2}
                      y2={l.y2}
                      className={styles.radarAxis}
                    />
                  ))}
                  {/* Polygon */}
                  <path d={radar.polyD} className={`${styles.radarPoly} ${radar.fillClass}`} />
                  {/* Points */}
                  {radar.polyPts.map((p, i) => (
                    <circle key={`p-${i}`} cx={p.x} cy={p.y} r={3.4} className={styles.radarPoint} />
                  ))}
                  {/* Labels */}
                  {axes.map((axis, i) => {
                    const a = (-Math.PI / 2) + (i * (2 * Math.PI) / axes.length);
                    const rx = radar.cx + Math.cos(a) * (radar.r * 1.28);
                    const ry = radar.cy + Math.sin(a) * (radar.r * 1.28);
                    const band = bandFrom01(axisValues01[i] ?? overallExposure01);
                    return (
                      <text key={`t-${axis.key}`} x={rx} y={ry} className={styles.radarLabel}>
                        <title>{`${axis.label}: ${band}`}</title>
                        {axis.label}
                      </text>
                    );
                  })}
                </svg>
              </div>
              <div className={styles.cardSubtext}>
                Larger footprint indicates broader risk exposure. Spikes indicate concentrated pressure points.
                This map is derived from current risk signals (directional), not raw financials.
              </div>
            </div>

            {insights.risks.map((risk, i) => {
              const category = categoryFromRisk(risk);
              const horizon =
                typeof (risk as any)?.horizon === "string" && (risk as any).horizon.trim().length > 0
                  ? (risk as any).horizon.trim()
                  : horizonFromSeverity(risk?.severity);
              const sensitivity =
                typeof (risk as any)?.sensitivity === "string" && (risk as any).sensitivity.trim().length > 0
                  ? (risk as any).sensitivity.trim()
                  : sensitivityFromSeverity(risk?.severity);

              return (
                <div key={`risk-map-${i}`} className={`${styles.card} ${severityToCardAccent(risk.severity)}`}>
                  <div className={styles.chipRow}>
                    <span className={`${styles.chip} ${styles.chipNeutral}`}>{category}</span>
                    <span className={`${styles.chip} ${styles.chipCyan}`}>{risk.severity}</span>
                    <span className={`${styles.chip} ${styles.chipNeutral}`}>{horizon}</span>
                    <span className={`${styles.chip} ${styles.chipNeutral}`}>{sensitivity}</span>
                  </div>

                  <div className={styles.cardText}>{risk.title}</div>

                  <div className={styles.kvGrid}>
                    <div className={styles.kvItem}>
                      <div className={styles.kvKey}>Trigger</div>
                      <div className={styles.kvValue}>{risk.driver}</div>
                    </div>
                    <div className={styles.kvItem}>
                      <div className={styles.kvKey}>Impact</div>
                      <div className={styles.kvValue}>{risk.impact}</div>
                    </div>
                    <div className={styles.kvItem}>
                      <div className={styles.kvKey}>Time horizon</div>
                      <div className={styles.kvValue}>{horizon}</div>
                    </div>
                    <div className={styles.kvItem}>
                      <div className={styles.kvKey}>Sensitivity</div>
                      <div className={styles.kvValue}>{sensitivity}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === "value" && (
          <>
            <div className={styles.sectionHeader}>
              <FileText className={styles.sectionIcon} />
              <span>ENTERPRISE VALUE</span>
            </div>

            <div className={`${styles.card} ${styles.accentCyan}`}>
              <div className={`${styles.cardLabel} ${styles.neutral}`}>Valuation posture</div>
              <div className={styles.cardText}>{valuationPosture}</div>
              <div className={styles.chipRow}>
                <span className={`${styles.chip} ${postureConfidence.className}`}>{postureConfidence.label}</span>
                <span className={`${styles.chip} ${styles.chipNeutral}`}>Directional only</span>
              </div>

              {(hasElevatedOrCriticalSystem || hasAllStableSystem) ? (
                <div className={styles.chipRow}>
                  {hasElevatedOrCriticalSystem ? (
                    <span className={`${styles.chip} ${styles.chipWarning}`}>Risk premium rising</span>
                  ) : null}
                  {hasAllStableSystem ? (
                    <span className={`${styles.chip} ${styles.chipPositive}`}>Stability supports value</span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className={styles.card}>
              <div className={`${styles.cardLabel} ${styles.neutral}`}>Value Drivers</div>
              <div className={styles.valueDiagramWrap}>
                <svg className={styles.valueDiagram} viewBox="0 0 360 220" role="img" aria-label="Value drivers diagram">
                  {/* Frame */}
                  <rect x="10" y="10" width="340" height="200" rx="12" className={styles.valueFrame} />
                  {/* Links */}
                  <path d="M180 54 L120 106" className={styles.valueLink} />
                  <path d="M180 54 L240 106" className={styles.valueLink} />
                  <path d="M120 128 L180 176" className={styles.valueLink} />
                  <path d="M240 128 L180 176" className={styles.valueLink} />
                  <path d="M120 118 L240 118" className={styles.valueLinkStrong} />

                  {/* Nodes */}
                  <g className={`${styles.valueNode} ${driverTone.revenue}`}>
                    <circle cx="180" cy="54" r="10" />
                    <text x="180" y="38" className={styles.valueLabel} textAnchor="middle">Revenue Quality</text>
                  </g>
                  <g className={`${styles.valueNode} ${driverTone.growth}`}>
                    <circle cx="120" cy="118" r="10" />
                    <text x="86" y="118" className={styles.valueLabel} textAnchor="end" dominantBaseline="middle">Growth</text>
                    <text x="86" y="138" className={styles.valueLabel} textAnchor="end" dominantBaseline="middle">Efficiency</text>
                  </g>
                  <g className={`${styles.valueNode} ${driverTone.margin}`}>
                    <circle cx="240" cy="118" r="10" />
                    <text x="274" y="118" className={styles.valueLabel} textAnchor="start" dominantBaseline="middle">Margin</text>
                    <text x="274" y="138" className={styles.valueLabel} textAnchor="start" dominantBaseline="middle">Durability</text>
                  </g>
                  <g className={`${styles.valueNode} ${driverTone.optionality}`}>
                    <circle cx="180" cy="176" r="10" />
                    <text x="180" y="202" className={styles.valueLabel} textAnchor="middle">Optionality</text>
                  </g>
                </svg>
              </div>
              <div className={styles.cardSubtext}>
                Highlighting is derived from current posture. This is directional, not a valuation model.
              </div>
            </div>

            <div className={styles.card}>
              <div className={`${styles.cardLabel} ${styles.neutral}`}>Signal trend</div>
              <div className={styles.sparkGrid}>
                {["Revenue Quality", "Growth Efficiency", "Optionality"].map((label) => (
                  <div key={label} className={styles.sparkRow}>
                    <div className={styles.sparkLabel}>{label}</div>
                    <svg className={styles.sparkSvg} viewBox="0 0 64 24" role="img" aria-label="Directional signal sparkline">
                      <path d={spark.d} className={styles.sparkPath} />
                    </svg>
                  </div>
                ))}
              </div>
              <div className={styles.cardMeta}>{spark.label}</div>
            </div>

            <div className={`${styles.card} ${styles.methodCard}`}>
              <div className={`${styles.cardLabel} ${styles.neutral}`}>Method</div>
              <div className={styles.cardText}>
                Derived from risk severity mix and system state posture. Directional only; no raw financial outputs.
              </div>
            </div>

            <div className={styles.card}>
              <div className={`${styles.cardLabel} ${styles.neutral}`}>Strategic implications</div>
              <ul className={styles.bulletList}>
                {valuationPosture === "Compression" ? (
                  <>
                    <li className={styles.bulletItem}>Prioritize resilience and downside protection.</li>
                    <li className={styles.bulletItem}>Tighten efficiency and reduce execution drag.</li>
                  </>
                ) : valuationPosture === "Mild compression" ? (
                  <>
                    <li className={styles.bulletItem}>Balance efficiency actions with selective momentum bets.</li>
                    <li className={styles.bulletItem}>Contain risk drivers to protect optionality.</li>
                  </>
                ) : valuationPosture === "Expansion" ? (
                  <>
                    <li className={styles.bulletItem}>Lean into scalable momentum with controlled investment.</li>
                    <li className={styles.bulletItem}>Protect execution quality while increasing throughput.</li>
                  </>
                ) : (
                  <>
                    <li className={styles.bulletItem}>Maintain execution discipline to preserve optionality.</li>
                    <li className={styles.bulletItem}>Allocate investment selectively with risk containment.</li>
                  </>
                )}
                {Array.isArray(insights.actions) && insights.actions.length > 0 ? (
                  <li className={styles.bulletItem}>Execution levers available: several action options available.</li>
                ) : (
                  <li className={styles.bulletItem}>Execution levers available: action options identified.</li>
                )}
              </ul>
            </div>
          </>
        )}

        {activeTab === "questions" && (
          <>
            <div className={styles.sectionHeader}>
              <MessageCircle className={styles.sectionIcon} />
              <span>STRATEGIC QUESTIONS</span>
            </div>

            {questions.map((item, i) => (
              <div key={`q-${i}`} className={styles.accordion}>
                <button
                  type="button"
                  className={styles.accordionHeader}
                  onClick={() => setOpenQuestionIndex(openQuestionIndex === i ? null : i)}
                >
                  <div className={styles.accordionQuestion}>{item.q}</div>
                  <ChevronDown className={`${styles.accordionIcon} ${openQuestionIndex === i ? styles.open : ""}`} />
                </button>
                {openQuestionIndex === i ? (
                  <div className={styles.accordionContent}>
                    {typedAnswer}
                    {status === "UPDATING" ? <span className={styles.cursor} /> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </>
        )}
      </div>

      {hasOverflow && showScrollHint ? <div className={styles.scrollHint}>Scroll for more</div> : null}
      {hasOverflow ? <div className={styles.bottomFade} /> : null}
    </div>
  );
}
