// src/components/AIIntelligenceEnhanced.tsx
// STRATFIT — NUCLEAR MODE AI Intelligence Panel
// Complete transformation with borders, animations, consistent typography

import React, { useMemo, useEffect, useRef, useState } from "react";
import { useScenarioStore, ViewMode } from "@/state/scenarioStore";
import type { ScenarioId } from "@/state/scenarioStore";
import { LeverState } from "@/logic/calculateMetrics";
import { buildScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";
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
// LOCKED TAB PANEL COMPONENT (G-D MODE)
// ============================================================================

function LockedTabPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(120, 220, 255, 0.12)",
      background: "rgba(255,255,255,0.02)",
      padding: "14px 14px 12px",
      color: "rgba(232,240,248,0.86)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontSize: 12,
        color: "rgba(232,240,248,0.92)"
      }}>
        <span style={{ fontSize: 14 }}>🔒</span>
        <span>{title}</span>
      </div>

      <div style={{
        marginTop: 8,
        lineHeight: 1.45,
        fontSize: 12.5,
        color: "rgba(232,240,248,0.70)"
      }}>
        {description}
      </div>

      <div style={{
        marginTop: 10,
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid rgba(34, 211, 238, 0.18)",
        background: "rgba(34, 211, 238, 0.06)",
        color: "rgba(34, 211, 238, 0.85)",
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase"
      }}>
        Locked Preview
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// ============================================================================
// INSIGHT GENERATION — FULLY REACTIVE TO LEVER CHANGES

// ------------------------------------------------------------------------------
// STRUCTURED CLONE HELPER — replaces deepClone
// ------------------------------------------------------------------------------
const structuredCloneSafe = <T,>(obj: T): T => {
  try {
    // modern browsers / Vite generally support structuredClone
    // but we keep JSON fallback for safety
    // @ts-ignore
    if (typeof structuredClone === "function") return structuredClone(obj);
  } catch {}
  try {
    return JSON.parse(JSON.stringify(obj)) as T;
  } catch {
    return obj;
  }
};
// ============================================================================

function generateInsights(
    levers: LeverState,
    scenario: ScenarioId,
    viewMode: ViewMode,
    ledger: any // we'll keep 'any' for now to avoid importing types; optional improvement later
  ): AIInsights | null {
    if (!ledger) return null;

    // --- null-safe helpers ---
    const n = (x: unknown, fallback = 0) => (typeof x === "number" && Number.isFinite(x) ? x : fallback);
    const nn = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
    const fmtSigned = (x: number, decimals = 0) => `${x >= 0 ? "+" : ""}${x.toFixed(decimals)}`;

    // Example: runway
    const runway = nn(ledger.runwayMonths?.scenario);
    const runwayDelta = n(ledger.runwayMonths?.delta, 0);
    // Example: ARR
    const arr12 = nn(ledger.arr12?.scenario);
    const arr12Delta = n(ledger.arr12?.delta, 0);
    // Example: Growth
    const arrGrowthPct = nn(ledger.arrGrowthPct?.scenario);
    const arrGrowthDelta = n(ledger.arrGrowthPct?.delta, 0);
    // Example: Risk
    const riskScore = nn(ledger.riskScore?.scenario);
    const riskScoreDelta = n(ledger.riskScore?.delta, 0);
    // Example: Quality
    const qualityScore = nn(ledger.qualityScore?.scenario);
    const qualityScoreDelta = n(ledger.qualityScore?.delta, 0);

    // Derive dynamic observation text based on current state
    const runwayVal = runway ?? 0;
    const runwayBand = runwayVal >= 18 ? "strong" : runwayVal >= 12 ? "adequate" : "constrained";
    const growthSignal = arrGrowthDelta >= 5 ? "accelerating" : arrGrowthDelta <= -5 ? "contracting" : "stable";
    const riskPosture = (riskScore ?? 0) >= 60 ? "elevated" : (riskScore ?? 0) >= 40 ? "moderate" : "contained";

    const observation = [
      `Runway posture is ${runwayBand} at ${Math.round(runwayVal)} months${
        runwayDelta !== 0 ? ` (${runwayDelta > 0 ? "+" : ""}${Math.round(runwayDelta)} vs base)` : ""
      }.`,
      `Growth momentum is ${growthSignal} with current lever configuration.`,
      riskPosture !== "contained"
        ? `Risk exposure is ${riskPosture} and warrants attention.`
        : `Risk exposure remains contained under current assumptions.`,
    ].join(" ");

    // Derive system state from ledger + levers
    const financialStrain = Math.min(100, Math.max(0, 100 - runwayVal * 4));
    const operationalStrain = Math.min(
      100,
      Math.max(0, n((levers as any).hiringIntensity, 0) * 0.6 + n((levers as any).operatingDrag, 0) * 0.4)
    );
    const executionStrain = Math.min(
      100,
      Math.max(0, n((levers as any).executionRisk, 0) * 0.7 + n((levers as any).marketVolatility, 0) * 0.3)
    );

    const getStatus = (strain: number): "STABLE" | "ELEVATED" | "CRITICAL" => {
      if (strain >= 65) return "CRITICAL";
      if (strain >= 40) return "ELEVATED";
      return "STABLE";
    };

    const systemState = [
      { label: "FINANCIAL", status: getStatus(financialStrain), strain: Math.round(financialStrain) },
      { label: "OPERATIONAL", status: getStatus(operationalStrain), strain: Math.round(operationalStrain) },
      { label: "EXECUTION", status: getStatus(executionStrain), strain: Math.round(executionStrain) },
    ];

    // Derive risks based on current ledger values
    const risks: Risk[] = [];
    if (arrGrowthDelta < -3) {
      risks.push({
        severity: arrGrowthDelta < -10 ? "CRITICAL" : "HIGH",
        emoji: arrGrowthDelta < -10 ? "🔴" : "🟠",
        title: "ARR growth fragility",
        driver: `Growth momentum is ${Math.abs(Math.round(arrGrowthDelta))}% below base`,
        impact: "Revenue trajectory weakens and recovery requires tighter execution",
      });
    }
    if (n((levers as any).costDiscipline, 100) < 45) {
      const cd = n((levers as any).costDiscipline, 100);
      risks.push({
        severity: cd < 30 ? "CRITICAL" : "HIGH",
        emoji: cd < 30 ? "🔴" : "🟠",
        title: "Burn rate pressure",
        driver: `Cost discipline at ${Math.round(cd)}% is below optimal threshold`,
        impact: "Runway compression accelerates without corrective action",
      });
    }
    if ((riskScore ?? 0) > 55) {
      risks.push({
        severity: (riskScore ?? 0) > 70 ? "CRITICAL" : "MODERATE",
        emoji: (riskScore ?? 0) > 70 ? "🔴" : "🟡",
        title: "Elevated risk exposure",
        driver: `Risk score at ${Math.round(riskScore ?? 0)}/100`,
        impact: "Scenario volatility increases investor concern",
      });
    }
    if (risks.length === 0) {
      risks.push({
        severity: "LOW",
        emoji: "🟢",
        title: "Risk posture stable",
        driver: "Current lever configuration within acceptable bounds",
        impact: "Continue monitoring for early signals of drift",
      });
    }

    // Derive recommended actions based on current state
    const actions: Action[] = [];
    if (n((levers as any).hiringIntensity, 0) > 50) {
      const hi = n((levers as any).hiringIntensity, 0);
      actions.push({
        priority: actions.length + 1,
        title: "Phase hiring into milestone-driven stages",
        impact: `Reduce hiring intensity from ${Math.round(hi)}% to extend runway`,
      });
    }
    if (n((levers as any).operatingDrag, 0) > 40) {
      const od = n((levers as any).operatingDrag, 0);
      actions.push({
        priority: actions.length + 1,
        title: "Initiate operational efficiency review",
        impact: `Target ${Math.round(od * 0.3)}% OpEx optimization`,
      });
    }
    if (n((levers as any).demandStrength, 100) < 50) {
      actions.push({
        priority: actions.length + 1,
        title: "Accelerate demand generation initiatives",
        impact: "Strengthen pipeline to improve revenue trajectory",
      });
    }
    if (actions.length === 0) {
      actions.push({
        priority: 1,
        title: "Maintain current trajectory",
        impact: "Lever configuration supports stable execution path",
      });
    }

    // Metrics display (null-safe)
    const runwayDisp = `${Math.round(runwayVal)}mo`;
    const arr12Disp = arr12 == null ? "—" : `$${arr12.toFixed(1)}M`;
    const growthDisp = arrGrowthPct == null ? "—" : `${arrGrowthPct.toFixed(1)}%`;
    const riskDisp = riskScore == null ? "—" : `${riskScore.toFixed(1)}`;
    const qualDisp = qualityScore == null ? "—" : `${qualityScore.toFixed(1)}`;

    return {
      observation,
      metrics: [
        { label: "RUNWAY", value: runwayDisp, change: `${fmtSigned(runwayDelta, 0)}mo`, trend: runwayDelta > 0 ? "up" : runwayDelta < 0 ? "down" : "neutral" },
        { label: "ARR12", value: arr12Disp, change: fmtSigned(arr12Delta, 1) + "M", trend: arr12Delta > 0 ? "up" : arr12Delta < 0 ? "down" : "neutral" },
        { label: "GROWTH", value: growthDisp, change: fmtSigned(arrGrowthDelta, 1) + "%", trend: arrGrowthDelta > 0 ? "up" : arrGrowthDelta < 0 ? "down" : "neutral" },
        { label: "RISK", value: riskDisp, change: fmtSigned(riskScoreDelta, 1), trend: riskScoreDelta > 0 ? "up" : riskScoreDelta < 0 ? "down" : "neutral" },
        { label: "QUALITY", value: qualDisp, change: fmtSigned(qualityScoreDelta, 1), trend: qualityScoreDelta > 0 ? "up" : qualityScoreDelta < 0 ? "down" : "neutral" },
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


  // --- EXPLICIT DIAGNOSTIC LOGGING ---
  // Log all key values on every render for deep visibility
  const viewMode = useScenarioStore((s) => s.viewMode);
  const engineResults = useScenarioStore((s) => s.engineResults);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);

  const cfoSummary = useScenarioStore((s) => (s.engineResults?.[scenario] as any)?.ai?.summary);

  // Canonical: build from the one true engineResults object only
  const ledger = useMemo(() => {
    if (!engineResults || !activeScenarioId) return null;
    return buildScenarioDeltaLedger({ engineResults, activeScenario: activeScenarioId });
  }, [engineResults, activeScenarioId]);

  // Keep existing vars used below (minimal disruption)
  const scenarioKey = activeScenarioId;
  const baseResult = engineResults?.base;
  const engineResultForScenario = scenarioKey ? engineResults?.[scenarioKey] : undefined;

  // Log on every render for these values
  // (This is safe in dev, remove or gate behind process.env.NODE_ENV for prod)

  // ============================================================================
  // SECTION 1: SCENARIO TRUTH SIGNATURE + INSIGHTS + SAFE INSIGHTS
  // ============================================================================

  const scenarioTruthSig = useMemo(() => {
    const baseKpis = (baseResult as any)?.kpis ?? null;
    const scKpis = (engineResultForScenario as any)?.kpis ?? null;

    const pick = (x: any) => (x == null ? "" : typeof x === "number" ? x : String(x));

    const baseArr = pick(baseKpis?.arr12 ?? baseKpis?.arr ?? baseKpis?.revenue);
    const scArr = pick(scKpis?.arr12 ?? scKpis?.arr ?? scKpis?.revenue);

    const baseRunway = pick(baseKpis?.runwayMonths ?? baseKpis?.runway);
    const scRunway = pick(scKpis?.runwayMonths ?? scKpis?.runway);

    const baseGrowth = pick(baseKpis?.growthRate ?? baseKpis?.growth);
    const scGrowth = pick(scKpis?.growthRate ?? scKpis?.growth);

    const baseMargin = pick(baseKpis?.grossMargin ?? baseKpis?.margin);
    const scMargin = pick(scKpis?.grossMargin ?? scKpis?.margin);

    return [
      scenarioKey,
      baseArr, scArr,
      baseRunway, scRunway,
      baseGrowth, scGrowth,
      baseMargin, scMargin,
    ].join("|");
  }, [scenarioKey, baseResult, engineResultForScenario]);

  const insights = useMemo(
    () => generateInsights(levers, scenario, viewMode, ledger),
    [levers, scenario, viewMode, ledger, scenarioTruthSig]
  );

  // Always-defined safeInsights — AND ensure fresh array references so memos re-trigger
  const safeInsights = useMemo(() => {
    const base = insights ?? {
      observation: "",
      metrics: [],
      systemState: [],
      risks: [],
      actions: [],
      timestamp: new Date(0),
    };

    return {
      ...base,
      metrics: Array.isArray((base as any).metrics) ? [...(base as any).metrics] : [],
      systemState: Array.isArray((base as any).systemState) ? [...(base as any).systemState] : [],
      risks: Array.isArray((base as any).risks) ? [...(base as any).risks] : [],
      actions: Array.isArray((base as any).actions) ? [...(base as any).actions] : [],
    };
  }, [insights, scenarioTruthSig]);
  // IMPORTANT: never early-return before all hooks (Rules of Hooks).
  // If insights is null (eg initial render), keep hooks stable and render a safe fallback later.
  const hasInsights = !!insights;

  // LIVE UPDATE SIGNAL (sliders): `levers` prop updates on every slider move
  const leverSignal = useMemo(() => JSON.stringify(levers), [levers]);

  const [activeTab, setActiveTab] = useState<"executive" | "risk" | "value" | "questions">("executive");

  // Typewriter key: restart only when the displayed brief text changes (or mode changes)
  const briefText = safeInsights.observation;
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
    if (!safeInsights.risks || safeInsights.risks.length === 0) return 0;
    const sum = safeInsights.risks.reduce((acc, r) => {
      if (!r?.severity) return acc;
      if (r.severity === "CRITICAL") return acc - 3;
      if (r.severity === "HIGH") return acc - 2;
      if (r.severity === "MODERATE") return acc - 1;
      return acc + 0;
    }, 0);
    return Math.max(-6, Math.min(3, sum));
  })();

  const valuationPosture =
    !safeInsights.risks || safeInsights.risks.length === 0
      ? "Neutral"
      : riskScore <= -4
        ? "Compression"
        : riskScore >= -3 && riskScore <= -2
          ? "Mild compression"
          : riskScore >= -1 && riskScore <= 1
            ? "Neutral"
            : "Expansion";

  const hasElevatedOrCriticalSystem =
    Array.isArray(safeInsights.systemState) &&
    safeInsights.systemState.some((s) => s.status === "ELEVATED" || s.status === "CRITICAL");
  const hasAllStableSystem =
    Array.isArray(safeInsights.systemState) &&
    safeInsights.systemState.length > 0 &&
    safeInsights.systemState.every((s) => s.status === "STABLE");

  // --------------------------------------------------------------------------
  // RISK MAP (RADAR) — derived deterministically from existing `safeInsights.risks`
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
    const rs = Array.isArray(safeInsights.risks) ? safeInsights.risks : [];
    if (rs.length === 0) return 0.5;
    const avg = rs.reduce((acc, r) => acc + severityWeight01(r?.severity), 0) / rs.length;
    return clamp01(avg);
  }, [scenarioTruthSig, safeInsights.risks]);


  const axisValues01 = useMemo(() => {
    const rs = Array.isArray(safeInsights.risks) ? safeInsights.risks : [];
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
  }, [scenarioTruthSig, axes, safeInsights.risks, overallExposure01]);



  // --- RADAR INPUT SIGNATURE (primitive-based) ---
  // This signature is a stable, JSON-stringified array of the primitive values that drive the radar
  const radarInputSig = useMemo(() => {
    // Use only the primitive values that affect the radar: axisValues01, axes.length, and risk severities
    const riskSeverities = Array.isArray(safeInsights.risks)
      ? safeInsights.risks.map(r => r?.severity || "")
      : [];
    return JSON.stringify([
      scenarioTruthSig,
      ...axisValues01,
      axes.length,
      ...riskSeverities,
    ]);
  }, [scenarioTruthSig, axisValues01, axes.length, safeInsights.risks]);

  // Log axisValues01 and radarInputSig after they are computed
  console.log("[AIIntelligenceEnhanced] axisValues01", structuredCloneSafe(axisValues01));
  console.log("[AIIntelligenceEnhanced] radarInputSig", radarInputSig);

  const bandFrom01 = (v01: number) => (v01 < 0.34 ? "Low" : v01 < 0.67 ? "Med" : "High");

  // --------------------------------------------------------------------------
  // RADAR OBJECT (minimal, safe, typed)
  // --------------------------------------------------------------------------
  type RadarAxisLine = { x1: number; y1: number; x2: number; y2: number };
  const radar = useMemo(() => {
    const cx = 140;
    const cy = 140;
    const r = 92;
    const n = axes.length;
    const pointAtLocal = (i: number, k: number, scale = 1) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      return {
        x: cx + Math.cos(a) * (r * k * scale),
        y: cy + Math.sin(a) * (r * k * scale),
      };
    };
    const gridPaths = [0.25, 0.5, 0.75, 1].map((k) => {
      const pts = Array.from({ length: n }, (_, i) => pointAtLocal(i, k, 1));
      return pts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
    });
    const axesLines: RadarAxisLine[] = Array.from({ length: n }, (_, i) => {
      const p = pointAtLocal(i, 1, 1);
      return { x1: cx, y1: cy, x2: p.x, y2: p.y };
    });
    const polyPts = axisValues01.map((v, i) => pointAtLocal(i, clamp01(v), 1));
    const polyD =
      polyPts.length === 0
        ? ""
        : polyPts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
    const hasCritical = (safeInsights?.risks ?? []).some((rr: any) => rr?.severity === "CRITICAL");
    const hasHigh = (safeInsights?.risks ?? []).some((rr: any) => rr?.severity === "HIGH");
    const fillClass = hasCritical ? styles.radarCritical : hasHigh ? styles.radarHigh : styles.radarStable;
    return { cx, cy, r, gridPaths, axesLines, polyPts, polyD, fillClass };
  }, [scenarioTruthSig, axes.length, axisValues01, safeInsights?.risks]);

  // --------------------------------------------------------------------------
  // QUESTIONS — deterministic Q&A when no dedicated dataset exists
  // --------------------------------------------------------------------------
  type QA = { q: string; a: string };
  const questions: QA[] = useMemo(() => {
    // If safeInsights provides questions, map them here.
    // Otherwise return empty list.
    const raw = (safeInsights as any)?.questions;
    if (Array.isArray(raw)) {
      return raw.map((x: any) => ({
        q: String(x?.q ?? x?.question ?? ""),
        a: String(x?.a ?? x?.answer ?? ""),
      }));
    }
    return [];
  }, [safeInsights, scenarioTruthSig]);


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

  // Now it is safe to bail out (after all hooks are declared)
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

            {cfoSummary && (
              <div className={styles.card}>
                <div className={`${styles.cardLabel} ${styles.neutral}`}>CFO Intelligence</div>
                <div className={styles.cardText} style={{ whiteSpace: "pre-line" }}>
                  {cfoSummary}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "risk" && (
          <LockedTabPanel
            title="RISK MAP"
            description="Visualises how risk propagates across scenarios — concentration, escalation paths, and hidden fragility. This becomes interactive post-demo."
          />
        )}

        {activeTab === "risk-DISABLED" && (
          <>
            <div className={styles.sectionHeader}>
              <Activity className={styles.sectionIcon} />
              <span>RISK MAP</span>
            </div>

            <div className={`${styles.card} ${styles.radarCard}`}>
              <div style={{position: 'absolute', right: 12, top: 8, zIndex: 2, fontSize: 11, color: '#0ff', fontWeight: 600, letterSpacing: 0.5, background: '#222', borderRadius: 4, padding: '2px 6px', opacity: 0.85}}>
                SIG: {radarInputSig}
              </div>
              <div className={`${styles.cardLabel} ${styles.neutral}`}>Exposure footprint</div>
              <div className={styles.radarWrap}>
                {/* Proof badge for scenarioTruthSig (visible for 2 minutes) */}
                <div style={{ opacity: 0.6, fontSize: 11, marginBottom: 6 }}>
                  truthSig: {scenarioTruthSig}
                </div>
                {/* Force remount of radar SVG when radarInputSig changes */}
                <svg key={radarInputSig} className={styles.radarSvg} viewBox="0 0 340 220" role="img" aria-label="Risk radar map">
                  {/* Grid rings */}
                  {radar.gridPaths.map((d: string, i: number) => (
                    <path key={`g-${i}`} d={d} className={styles.radarGrid} />
                  ))}
                  {/* Axes */}
                  {radar.axesLines.map((l: { x1: number; y1: number; x2: number; y2: number }, i: number) => (
                    <line
                      key={`a-${i}`}
                      x1={l.x1}
                      y1={l.y1}
                      x2={l.x2}
                      y2={l.y2}
                      className={styles.radarAxis}
                    />
                  ))}
                  {/* Polygon */}
                  <path d={radar.polyD} className={`${styles.radarPoly} ${radar.fillClass}`} />
                  {/* Points */}
                  {radar.polyPts.map((p: { x: number; y: number }, i: number) => (
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

            {safeInsights.risks.map((risk, i) => {
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
          <LockedTabPanel
            title="VALUE INTELLIGENCE"
            description="Translates scenario outcomes into value ranges, capital efficiency signals, and dilution-aware decision paths. Activation follows baseline validation."
          />
        )}

        {activeTab === "value-DISABLED" && (
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
                {Array.isArray(safeInsights.actions) && safeInsights.actions.length > 0 ? (
                  <li className={styles.bulletItem}>Execution levers available: several action options available.</li>
                ) : (
                  <li className={styles.bulletItem}>Execution levers available: action options identified.</li>
                )}
              </ul>
            </div>
          </>
        )}

        {activeTab === "questions" && (
          <LockedTabPanel
            title="STRATEGIC QUESTIONS"
            description="AI prompts designed to surface second-order risks and non-obvious trade-offs based on scenario divergence. Unlocks after governance checks."
          />
        )}

        {activeTab === "questions-DISABLED" && (
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
