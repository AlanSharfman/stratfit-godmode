// src/components/AIIntelligenceEnhanced.tsx
// STRATFIT — GOD-MODE AI COCKPIT
// Signal Widgets, Vitality Gauges, Mini-Risk Map
// "Stop writing reports. Start building a Cockpit."

import React, { useMemo, useEffect, useRef, useState } from "react";
import { useScenarioStore, ViewMode } from "@/state/scenarioStore";
import type { ScenarioId } from "@/state/scenarioStore";
import { LeverState } from "@/logic/calculateMetrics";
import { buildScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";
import { Activity, AlertTriangle, TrendingUp, Shield, Zap, Target, ArrowRight, AlertOctagon, Volume2, VolumeX } from "lucide-react";
import styles from "./AIIntelligenceEnhanced.module.css";
import { StrategicModules } from "./StrategicModules";
import ScenarioIntegrityCheck from "./intelligence/ScenarioIntegrityCheck";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useUIStore, LeverFocusId } from "@/state/uiStore";
import { useVoiceInterface } from "@/hooks/useVoiceInterface";

// ============================================================================
// ORACLE PROTOCOL — Contextual Intelligence Mapping
// ============================================================================

interface OracleIntelligence {
  title: string;
  category: string;
  impact: string;
  warning: string;
  primaryKpi: string;
  secondaryKpi?: string;
  tradeOff: string;
}

const ORACLE_CONTENT: Record<NonNullable<LeverFocusId>, OracleIntelligence> = {
  // GROWTH LEVERS
  revenueGrowth: {
    title: "DEMAND VELOCITY",
    category: "GROWTH",
    impact: "Direct correlation to Top-Line ARR. This is your primary growth engine.",
    warning: "High demand requires matching Ops capacity to prevent delivery failure and customer churn.",
    primaryKpi: "ARR",
    secondaryKpi: "MRR Growth",
    tradeOff: "↑ Demand → ↑ Revenue → ↑ Hiring Pressure → ↓ Runway",
  },
  pricingAdjustment: {
    title: "PRICING POWER",
    category: "GROWTH",
    impact: "Affects ACV (Annual Contract Value) and gross margins. High-leverage growth without hiring.",
    warning: "Over-pricing in competitive markets risks pipeline velocity and deal closure rates.",
    primaryKpi: "Gross Margin",
    secondaryKpi: "ACV",
    tradeOff: "↑ Price → ↑ Margin → ↓ Win Rate → ↓ Volume",
  },
  marketingSpend: {
    title: "EXPANSION VELOCITY",
    category: "GROWTH",
    impact: "Drives pipeline generation and new logo acquisition. Critical for hypergrowth.",
    warning: "CAC inflation risk. Ensure LTV/CAC ratio stays above 3:1 threshold.",
    primaryKpi: "Pipeline Value",
    secondaryKpi: "CAC Payback",
    tradeOff: "↑ Marketing → ↑ Pipeline → ↑ Burn → ↓ Efficiency",
  },
  
  // EFFICIENCY LEVERS
  operatingExpenses: {
    title: "COST DISCIPLINE",
    category: "EFFICIENCY",
    impact: "Direct control over burn rate. Extends runway without revenue dependency.",
    warning: "Aggressive cuts can damage morale, product velocity, and competitive position.",
    primaryKpi: "Burn Rate",
    secondaryKpi: "Runway",
    tradeOff: "↑ Cuts → ↑ Runway → ↓ Velocity → ↓ Morale",
  },
  headcount: {
    title: "HEADCOUNT DEPLOYMENT",
    category: "EFFICIENCY",
    impact: "Increases product velocity and delivery capacity. Essential for scaling.",
    warning: "Burn Rate Impact: CRITICAL. Each hire is a 12-month cash commitment. Monitor Runway closely.",
    primaryKpi: "Burn Rate",
    secondaryKpi: "Product Velocity",
    tradeOff: "↑ Hiring → ↑ Capacity → ↑ Burn → ↓ Runway",
  },
  cashSensitivity: {
    title: "OPERATING DRAG",
    category: "EFFICIENCY",
    impact: "Infrastructure, tooling, and overhead costs. Often hidden runway erosion.",
    warning: "Legacy systems and technical debt compound here. Annual review recommended.",
    primaryKpi: "OpEx Ratio",
    secondaryKpi: "Burn Quality",
    tradeOff: "↓ Drag → ↑ Efficiency → ↑ Investment Capacity",
  },
  
  // RISK LEVERS  
  churnSensitivity: {
    title: "MARKET VOLATILITY",
    category: "RISK",
    impact: "Economic headwinds, competitive pressure, and customer churn risk.",
    warning: "High volatility = unpredictable revenue. Affects valuation multiples severely.",
    primaryKpi: "Churn Rate",
    secondaryKpi: "NRR",
    tradeOff: "↑ Volatility → ↓ Predictability → ↓ Valuation Multiple",
  },
  fundingInjection: {
    title: "EXECUTION RISK",
    category: "RISK",
    impact: "Team capacity, delivery reliability, and operational excellence.",
    warning: "High execution risk signals product-market fit concerns or team capability gaps.",
    primaryKpi: "Quality Score",
    secondaryKpi: "Delivery Rate",
    tradeOff: "↑ Risk → ↓ Investor Confidence → ↓ Fundraising Terms",
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface SignalBullet {
  symbol: "check" | "tilde" | "alert";
  label: string;
  value: string;
  status: "positive" | "neutral" | "critical";
  pulse?: boolean;
}

interface VitalityGauge {
  label: string;
  score: number;
  maxScore: number;
  status: "positive" | "warning" | "critical";
}

interface RiskCell {
  row: number;
  col: number;
  status: "green" | "yellow" | "red" | "empty";
  isPosition?: boolean;
}

interface AIIntelligenceEnhancedProps {
  levers: LeverState;
  scenario: ScenarioId;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const nn = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
const n = (x: unknown, fallback = 0) => (typeof x === "number" && Number.isFinite(x) ? x : fallback);

// ============================================================================
// TYPEWRITER TEXT COMPONENT
// ============================================================================

function TypewriterText({ text, speed = 15, className }: { text: string; speed?: number; className?: string }) {
  const { displayText, isTyping } = useTypewriter({ text, speed, delay: 100 });
  
  return (
    <span className={className}>
      {displayText}
      {isTyping && <span className={styles.cursor}>▌</span>}
    </span>
  );
}

// ============================================================================
// ORACLE OVERLAY — Contextual Intelligence Display
// ============================================================================

function OracleOverlay({ leverId }: { leverId: NonNullable<LeverFocusId> }) {
  const intel = ORACLE_CONTENT[leverId];
  const { displayText: titleText, isTyping: titleTyping } = useTypewriter({ 
    text: intel.title, 
    speed: 30, 
    delay: 0 
  });
  const { displayText: impactText, isTyping: impactTyping } = useTypewriter({ 
    text: intel.impact, 
    speed: 15, 
    delay: 150 
  });
  const { displayText: warningText } = useTypewriter({ 
    text: intel.warning, 
    speed: 12, 
    delay: 400 
  });
  const { displayText: tradeOffText } = useTypewriter({ 
    text: intel.tradeOff, 
    speed: 20, 
    delay: 700 
  });

  const categoryColor = 
    intel.category === "GROWTH" ? "#22d3ee" :
    intel.category === "EFFICIENCY" ? "#10b981" :
    "#f59e0b";

  return (
    <div className={styles.oracleOverlay}>
      {/* Terminal Header */}
      <div className={styles.oracleHeader}>
        {/* Radar Icon — Active Scanning */}
        <div className={styles.radarIconSmall}>
          <div className={styles.radarSweepFast} />
          <div className={styles.radarDotSmall} />
        </div>
        <span className={styles.oracleLabel}>TARGET LOCK</span>
        <span 
          className={styles.oracleCategory}
          style={{ color: categoryColor, borderColor: categoryColor }}
        >
          {intel.category}
        </span>
      </div>

      {/* Title */}
      <div className={styles.oracleTitle}>
        <span className={styles.oracleTitleText}>
          {titleText}
          {titleTyping && <span className={styles.oracleCursor}>▌</span>}
        </span>
      </div>

      {/* Primary KPI Badge */}
      <div className={styles.oracleKpiBadges}>
        <span className={styles.oracleKpiBadge}>
          <Target size={10} />
          {intel.primaryKpi}
        </span>
        {intel.secondaryKpi && (
          <span className={styles.oracleKpiBadgeSecondary}>
            {intel.secondaryKpi}
          </span>
        )}
      </div>

      {/* Impact Section */}
      <div className={styles.oracleSection}>
        <div className={styles.oracleSectionHeader}>
          <ArrowRight size={12} />
          <span>IMPACT</span>
        </div>
        <p className={styles.oracleSectionText}>
          {impactText}
          {impactTyping && <span className={styles.oracleCursor}>▌</span>}
        </p>
      </div>

      {/* Warning Section */}
      <div className={styles.oracleSectionWarning}>
        <div className={styles.oracleSectionHeader}>
          <AlertOctagon size={12} />
          <span>WARNING</span>
        </div>
        <p className={styles.oracleSectionText}>
          {warningText}
        </p>
      </div>

      {/* Trade-off Chain */}
      <div className={styles.oracleTradeOff}>
        <div className={styles.oracleSectionHeader}>
          <Zap size={12} />
          <span>TRADE-OFF CHAIN</span>
        </div>
        <div className={styles.oracleTradeOffText}>
          {tradeOffText}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.oracleFooter}>
        <span className={styles.oracleHint}>
          Release to dismiss • Drag to adjust
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// SIGNAL BULLET COMPONENT
// ============================================================================

function SignalBulletWidget({ bullet }: { bullet: SignalBullet }) {
  const symbolMap = {
    check: "✓",
    tilde: "~",
    alert: "!",
  };
  
  const statusClass = 
    bullet.status === "positive" ? styles.signalPositive :
    bullet.status === "critical" ? styles.signalCritical :
    styles.signalNeutral;

  return (
    <div className={`${styles.signalBullet} ${statusClass} ${bullet.pulse ? styles.signalPulse : ""}`}>
      <span className={styles.signalSymbol}>[{symbolMap[bullet.symbol]}]</span>
      <span className={styles.signalLabel}>{bullet.label}:</span>
      <span className={styles.signalValue}>{bullet.value}</span>
    </div>
  );
}

// ============================================================================
// VITALITY GAUGE COMPONENT — Circular Gauge
// ============================================================================

function VitalityGaugeWidget({ gauge }: { gauge: VitalityGauge }) {
  const percentage = (gauge.score / gauge.maxScore) * 100;
  const circumference = 2 * Math.PI * 36; // r=36
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const strokeColor = 
    gauge.status === "positive" ? "#10b981" :
    gauge.status === "warning" ? "#f59e0b" :
    "#ef4444";

  return (
    <div className={styles.vitalityGauge}>
      <svg className={styles.gaugeRing} viewBox="0 0 80 80">
        {/* Background ring */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        {/* Progress ring */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 40 40)"
          style={{
            filter: `drop-shadow(0 0 8px ${strokeColor})`,
            transition: "stroke-dashoffset 0.6s ease"
          }}
        />
        {/* Center score */}
        <text
          x="40"
          y="40"
          textAnchor="middle"
          dominantBaseline="central"
          className={styles.gaugeScore}
          style={{ fill: strokeColor }}
        >
          {gauge.score}
        </text>
      </svg>
      <div className={styles.gaugeLabel}>{gauge.label}</div>
    </div>
  );
}

// ============================================================================
// MINI RISK MAP COMPONENT — 3x3 Grid
// ============================================================================

function MiniRiskMap({ cells, positionRow, positionCol }: { 
  cells: RiskCell[]; 
  positionRow: number; 
  positionCol: number;
}) {
  return (
    <div className={styles.miniRiskMap}>
      <div className={styles.riskMapHeader}>
        <Shield size={14} />
        <span>RISK TERRAIN</span>
      </div>
      <div className={styles.riskGrid}>
        {cells.map((cell, idx) => {
          const isPosition = cell.row === positionRow && cell.col === positionCol;
          const cellClass = 
            cell.status === "green" ? styles.riskCellGreen :
            cell.status === "yellow" ? styles.riskCellYellow :
            cell.status === "red" ? styles.riskCellRed :
            styles.riskCellEmpty;
          
          return (
            <div 
              key={idx} 
              className={`${styles.riskCell} ${cellClass}`}
            >
              {isPosition && <div className={styles.positionDot} />}
            </div>
          );
        })}
      </div>
      <div className={styles.riskMapLegend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDotBlue} /> YOU
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDotGreen} /> SAFE
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDotRed} /> RISK
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// SYSTEM HEALTH BOX — Full labeled health indicator boxes
// ============================================================================

function SystemHealthBox({ label, status, strain }: { label: string; status: string; strain: number }) {
  const statusClass = 
    status === "CRITICAL" ? styles.healthCritical :
    status === "ELEVATED" ? styles.healthWarning :
    styles.healthStable;
  
  const statusIcon = 
    status === "CRITICAL" ? "⚠" :
    status === "ELEVATED" ? "◐" :
    "✓";

  return (
    <div className={`${styles.healthBox} ${statusClass}`}>
      <div className={styles.healthHeader}>
        <span className={styles.healthLabel}>{label}</span>
        <span className={styles.healthIcon}>{statusIcon}</span>
      </div>
      <div className={styles.healthStatus}>{status}</div>
      <div className={styles.healthBar}>
        <div 
          className={styles.healthFill} 
          style={{ width: `${strain}%` }}
        />
      </div>
      <div className={styles.healthStrain}>{strain}% strain</div>
    </div>
  );
}

// ============================================================================
// ACTION SIGNAL COMPONENT — Compact action items
// ============================================================================

function ActionSignal({ priority, title }: { priority: number; title: string }) {
  return (
    <div className={styles.actionSignal}>
      <span className={styles.actionPriority}>P{priority}</span>
      <span className={styles.actionTitle}>{title}</span>
    </div>
  );
  }

// ============================================================================
// SENSITIVITY BAR COMPONENT — Shows sensitivity level with visual bar
// ============================================================================

interface SensitivityBarProps {
  label: string;
  sensitivity: "low" | "medium" | "high";
  impact: "positive" | "negative";
  value: number; // 0-100
}

function SensitivityBar({ label, sensitivity, impact, value }: SensitivityBarProps) {
  const sensitivityLabel = sensitivity === "high" ? "HIGH" : sensitivity === "medium" ? "MED" : "LOW";
  const barColor = 
    impact === "positive" 
      ? (sensitivity === "high" ? "#10b981" : sensitivity === "medium" ? "#22d3ee" : "#6b7280")
      : (sensitivity === "high" ? "#ef4444" : sensitivity === "medium" ? "#f59e0b" : "#6b7280");
  
  return (
    <div className={styles.sensitivityBar}>
      <div className={styles.sensitivityHeader}>
        <span className={styles.sensitivityLabel}>{label}</span>
        <span className={`${styles.sensitivityBadge} ${
          sensitivity === "high" ? styles.sensitivityHigh :
          sensitivity === "medium" ? styles.sensitivityMed :
          styles.sensitivityLow
        }`}>
          {sensitivityLabel}
        </span>
      </div>
      <div className={styles.sensitivityTrack}>
        <div 
          className={styles.sensitivityFill}
          style={{ 
            width: `${Math.max(8, value)}%`,
            background: `linear-gradient(90deg, ${barColor}88 0%, ${barColor} 100%)`,
            boxShadow: `0 0 8px ${barColor}60`
          }}
        />
        {/* Tick marks */}
        <div className={styles.sensitivityTicks}>
          <span style={{ left: '25%' }} />
          <span style={{ left: '50%' }} />
          <span style={{ left: '75%' }} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXECUTIVE SUMMARY COMPONENT — 5-Point Intelligence Feed
// ============================================================================

interface IntelligenceFeedItem {
  label: string;
  value: string;
  status: string;
  color: string;
  bgColor: string;
  detail: string;
}

function ExecutiveSummary({ 
  metrics, 
  onComplete 
}: { 
  metrics: { runway: number; runwayDelta: number; growth: number; growthDelta: number; risk: number; quality: number };
  onComplete?: () => void;
}) {
  // Build dynamic 5-row intelligence feed based on actual metrics
  const INTELLIGENCE_FEED: IntelligenceFeedItem[] = useMemo(() => {
    // 1. RUNWAY HORIZON
    const runwayStatus = metrics.runway >= 24 ? "OPTIMAL" : metrics.runway >= 12 ? "STABLE" : "CRITICAL";
    const runwayColor = metrics.runway >= 24 ? "text-emerald-400" : metrics.runway >= 12 ? "text-cyan-400" : "text-red-400";
    const runwayBg = metrics.runway >= 24 ? "bg-emerald-400" : metrics.runway >= 12 ? "bg-cyan-400" : "bg-red-400";
    
    // 2. GROWTH VELOCITY
    const growthStatus = metrics.growthDelta >= 5 ? "ACCELERATING" : metrics.growthDelta <= -5 ? "DECLINING" : "STABLE";
    const growthColor = metrics.growthDelta >= 5 ? "text-emerald-400" : metrics.growthDelta <= -5 ? "text-amber-400" : "text-cyan-400";
    const growthBg = metrics.growthDelta >= 5 ? "bg-emerald-400" : metrics.growthDelta <= -5 ? "bg-amber-400" : "bg-cyan-400";
    
    // 3. BURN EFFICIENCY
    const burnMultiple = metrics.runway > 0 ? Math.round((metrics.growth / metrics.runway) * 10) / 10 : 0;
    const burnStatus = burnMultiple <= 1 ? "EFFICIENT" : burnMultiple <= 2 ? "WARNING" : "CRITICAL";
    const burnColor = burnMultiple <= 1 ? "text-emerald-400" : burnMultiple <= 2 ? "text-amber-400" : "text-red-400";
    const burnBg = burnMultiple <= 1 ? "bg-emerald-400" : burnMultiple <= 2 ? "bg-amber-400" : "bg-red-400";
    
    // 4. MARKET EXPOSURE
    const riskStatus = metrics.risk >= 60 ? "ELEVATED" : metrics.risk >= 40 ? "MODERATE" : "SECURE";
    const riskColor = metrics.risk >= 60 ? "text-red-400" : metrics.risk >= 40 ? "text-amber-400" : "text-indigo-400";
    const riskBg = metrics.risk >= 60 ? "bg-red-400" : metrics.risk >= 40 ? "bg-amber-400" : "bg-indigo-400";
    
    // 5. AI PREDICTION
    const qualityScore = metrics.quality;
    const predictionStatus = qualityScore >= 70 ? "SERIES B READY" : qualityScore >= 50 ? "GROWTH STAGE" : "SEED STAGE";
    const predictionColor = qualityScore >= 70 ? "text-fuchsia-400" : qualityScore >= 50 ? "text-violet-400" : "text-slate-400";
    const predictionBg = qualityScore >= 70 ? "bg-fuchsia-400" : qualityScore >= 50 ? "bg-violet-400" : "bg-slate-400";

    return [
      {
        label: "RUNWAY HORIZON",
        value: `${Math.round(metrics.runway)} MONTHS`,
        status: runwayStatus,
        color: runwayColor,
        bgColor: runwayBg,
        detail: metrics.runway >= 24 
          ? "Cash position allows for aggressive R&D cycles and strategic hiring."
          : metrics.runway >= 12
            ? "Adequate runway. Begin planning next round within 6 months."
            : "Critical runway threshold. Immediate action required."
      },
      {
        label: "GROWTH VELOCITY",
        value: `${metrics.growthDelta >= 0 ? "+" : ""}${Math.round(metrics.growthDelta)}% MoM`,
        status: growthStatus,
        color: growthColor,
        bgColor: growthBg,
        detail: metrics.growthDelta >= 5
          ? "Momentum accelerating. Validate ops capacity can sustain trajectory."
          : metrics.growthDelta <= -5
            ? "Deceleration detected. Analyze pipeline conversion and churn."
            : "Stable momentum. Customer acquisition cost within targets."
      },
      {
        label: "BURN EFFICIENCY",
        value: `${burnMultiple}x MULTIPLE`,
        status: burnStatus,
        color: burnColor,
        bgColor: burnBg,
        detail: burnMultiple <= 1
          ? "Burn rate is efficient. Unit economics are healthy."
          : burnMultiple <= 2
            ? "Burn rate elevated. Monitor mid-market segment economics."
            : "Critical burn. Implement immediate cost discipline measures."
      },
      {
        label: "MARKET EXPOSURE",
        value: metrics.risk >= 60 ? "HIGH VOLATILITY" : metrics.risk >= 40 ? "MODERATE" : "LOW VOLATILITY",
        status: riskStatus,
        color: riskColor,
        bgColor: riskBg,
        detail: metrics.risk >= 60
          ? "Elevated risk exposure. Hedge against macro-economic shocks."
          : metrics.risk >= 40
            ? "Moderate exposure. Maintain defensive positioning options."
            : "Defensive positioning strong. Risk-adjusted returns favorable."
      },
      {
        label: "AI PREDICTION",
        value: predictionStatus,
        status: "PROJECTED",
        color: predictionColor,
        bgColor: predictionBg,
        detail: qualityScore >= 70
          ? "Trajectory aligns with top-quartile venture benchmarks."
          : qualityScore >= 50
            ? "Growth stage metrics. Focus on efficiency to unlock next tier."
            : "Early stage indicators. Prioritize product-market fit validation."
      }
    ];
  }, [metrics]);

  // Trigger onComplete after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col gap-2">
      {INTELLIGENCE_FEED.map((item, index) => (
        <div 
          key={index} 
          className="group flex flex-col p-3 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-slate-800/60 transition-all duration-200 hover:border-white/10"
          style={{ 
            animationDelay: `${index * 100}ms`,
            animation: 'fadeInUp 0.4s ease-out forwards',
            opacity: 0,
          }}
        >
          {/* HEADER ROW: LABEL + VALUE */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {/* Status Dot — Glowing */}
              <div 
                className={`w-1.5 h-1.5 rounded-full ${item.bgColor}`}
                style={{ boxShadow: `0 0 8px currentColor` }}
              />
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono text-slate-500 uppercase`}>
                {item.status}
              </span>
              <span className={`text-xs font-bold font-mono ${item.color}`}>
                {item.value}
              </span>
            </div>
          </div>

          {/* DETAIL ROW: The Insight */}
          <div className="text-[11px] text-slate-300/80 leading-tight pl-3.5 border-l border-white/10">
            {item.detail}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// AI COMMENTARY COMPONENT — Comprehensive Analysis
// ============================================================================

function AICommentary({ metrics, systemState, canStart = false }: { 
  metrics: { runway: number; runwayDelta: number; growth: number; growthDelta: number; risk: number; quality: number };
  systemState: Array<{ label: string; status: string; strain: number }>;
  canStart?: boolean;
}) {
  const insights: Array<{ category: string; text: string; severity: "info" | "warning" | "positive" }> = [];
  
  // RUNWAY ANALYSIS
  if (metrics.runway >= 24) {
    insights.push({
      category: "RUNWAY",
      text: `With ${Math.round(metrics.runway)} months of runway, you have exceptional strategic flexibility. Consider allocating capital toward growth initiatives while maintaining a 12-month minimum reserve buffer.`,
      severity: "positive"
    });
  } else if (metrics.runway >= 12) {
    insights.push({
      category: "RUNWAY",
      text: `At ${Math.round(metrics.runway)} months, runway is adequate but warrants monitoring. Begin planning next funding round or profitability path within 6 months to maintain optionality.`,
      severity: "info"
    });
  } else {
    insights.push({
      category: "RUNWAY",
      text: `Critical: ${Math.round(metrics.runway)} months runway requires immediate action. Prioritize path to profitability or initiate fundraising immediately. Consider cost reduction scenarios.`,
      severity: "warning"
    });
  }

  // GROWTH TRAJECTORY
  if (metrics.growthDelta > 10) {
    insights.push({
      category: "GROWTH",
      text: `Exceptional growth acceleration detected (+${Math.round(metrics.growthDelta)}% vs baseline). Validate that operational capacity can sustain this trajectory without quality degradation.`,
      severity: "positive"
    });
  } else if (metrics.growthDelta > 0) {
    insights.push({
      category: "GROWTH",
      text: `Growth trajectory shows positive momentum. Current configuration supports sustainable scaling. Monitor customer acquisition costs to ensure efficient growth.`,
      severity: "info"
    });
  } else if (metrics.growthDelta < -5) {
    insights.push({
      category: "GROWTH",
      text: `Growth deceleration of ${Math.abs(Math.round(metrics.growthDelta))}% signals market friction or execution gaps. Recommend deep-dive into pipeline conversion rates and churn drivers.`,
      severity: "warning"
    });
  }

  // RISK ASSESSMENT
  if (metrics.risk >= 70) {
    insights.push({
      category: "RISK",
      text: `High-risk configuration detected (${Math.round(metrics.risk)}/100). Multiple stress factors are compounding. This profile may concern investors and limit capital access. Prioritize risk mitigation.`,
      severity: "warning"
    });
  } else if (metrics.risk >= 50) {
    insights.push({
      category: "RISK",
      text: `Moderate risk exposure at ${Math.round(metrics.risk)}/100. Scenario shows manageable volatility but limited margin for error. Build contingency buffers where possible.`,
      severity: "info"
    });
  } else {
    insights.push({
      category: "RISK",
      text: `Risk profile is well-contained at ${Math.round(metrics.risk)}/100. Current configuration provides defensive posture while maintaining growth optionality.`,
      severity: "positive"
    });
  }

  // UNIT ECONOMICS
  if (metrics.quality >= 80) {
    insights.push({
      category: "QUALITY",
      text: `Exceptional unit economics (${Math.round(metrics.quality)}/100) indicate strong product-market fit. This foundation supports aggressive growth investment with high confidence.`,
      severity: "positive"
    });
  } else if (metrics.quality >= 50) {
    insights.push({
      category: "QUALITY",
      text: `Unit economics are functional but have optimization potential. Focus on improving gross margins and reducing CAC payback period before scaling spend.`,
      severity: "info"
    });
  } else {
    insights.push({
      category: "QUALITY",
      text: `Warning: Unit economics at ${Math.round(metrics.quality)}/100 are below sustainable thresholds. Growth at this efficiency level will accelerate cash burn without proportional value creation.`,
      severity: "warning"
    });
  }

  // SYSTEM STATE ANALYSIS
  const criticalSystems = systemState.filter(s => s.status === "CRITICAL");
  const elevatedSystems = systemState.filter(s => s.status === "ELEVATED");
  
  if (criticalSystems.length > 0) {
    const systemNames = criticalSystems.map(s => 
      s.label === "FIN" ? "Financial" : s.label === "OPS" ? "Operational" : "Execution"
    );
    insights.push({
      category: "SYSTEMS",
      text: `Critical strain detected in ${systemNames.join(" and ")} systems. Immediate intervention required to prevent cascade failures. Review lever configurations for relief opportunities.`,
      severity: "warning"
    });
  } else if (elevatedSystems.length > 0) {
    const systemNames = elevatedSystems.map(s => 
      s.label === "FIN" ? "Financial" : s.label === "OPS" ? "Operational" : "Execution"
    );
    insights.push({
      category: "SYSTEMS",
      text: `${systemNames.join(" and ")} systems showing elevated strain. Current levels are manageable but leave limited buffer for unexpected challenges.`,
      severity: "info"
    });
  }

  // STRATEGIC RECOMMENDATION
  const warningCount = insights.filter(i => i.severity === "warning").length;
  const positiveCount = insights.filter(i => i.severity === "positive").length;
  
  if (warningCount >= 2) {
    insights.push({
      category: "STRATEGY",
      text: `Multiple warning signals suggest a defensive posture. Recommend focusing on capital efficiency, risk reduction, and operational tightening before pursuing aggressive growth.`,
      severity: "warning"
    });
  } else if (positiveCount >= 3) {
    insights.push({
      category: "STRATEGY",
      text: `Strong fundamentals across key metrics. This is an opportune configuration for strategic investment in growth, talent acquisition, or market expansion.`,
      severity: "positive"
    });
  } else {
    insights.push({
      category: "STRATEGY",
      text: `Balanced scenario with mixed signals. Maintain current trajectory while monitoring key metrics. Consider targeted optimizations rather than major strategic shifts.`,
      severity: "info"
    });
  }

  // Combine all insights into one text for typewriter effect
  const fullCommentary = insights.map(i => `[${i.category}] ${i.text}`).join('\n\n');

  // Only start typing when canStart is true (after Executive Summary completes)
  const { displayText, isTyping } = useTypewriter({ 
    text: fullCommentary, 
    speed: 8, 
    delay: 300,
    enabled: canStart // Only start when Executive Summary is done
  });

  return (
    <div className={styles.commentaryText}>
      <div className={styles.typewriterContainer}>
        {canStart ? (
          <span className={styles.typewriterOutput}>
            {displayText}
            {isTyping && <span className={styles.cursor}>▌</span>}
          </span>
        ) : (
          <span className={styles.typewriterWaiting}>Waiting for summary...</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LOCKED TAB PANEL COMPONENT
// ============================================================================

function LockedTabPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.lockedPanel}>
      <div className={styles.lockedHeader}>
        <span className={styles.lockIcon}>🔒</span>
        <span>{title}</span>
      </div>
      <div className={styles.lockedDesc}>{description}</div>
      <div className={styles.lockedBadge}>LOCKED PREVIEW</div>
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
  const engineResults = useScenarioStore((s) => s.engineResults);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  
  // ORACLE PROTOCOL: Track focused lever for contextual intelligence
  const focusedLever = useUIStore((s) => s.focusedLever);
  
  // VOICE MODE: AI reads intelligence aloud
  const isVoiceEnabled = useUIStore((s) => s.isVoiceEnabled);
  const toggleVoice = useUIStore((s) => s.toggleVoice);
  
  // Prepare voice text from Oracle content
  const voiceText = useMemo(() => {
    if (!focusedLever) return null;
    const data = ORACLE_CONTENT[focusedLever];
    if (!data) return null;
    // Construct a concise tactical readout
    return `${data.title}. ${data.impact} Warning: ${data.warning}`;
  }, [focusedLever]);
  
  // Activate voice interface
  useVoiceInterface(voiceText);

  // Build ledger
  const ledger = useMemo(() => {
    if (!engineResults || !activeScenarioId) return null;
    return buildScenarioDeltaLedger({ engineResults, activeScenario: activeScenarioId });
  }, [engineResults, activeScenarioId]);

  // Extract metrics from ledger
  const metrics = useMemo(() => {
    if (!ledger) return {
      runway: 0,
      runwayDelta: 0,
      arr: 0,
      arrDelta: 0,
      growth: 0,
      growthDelta: 0,
      risk: 50,
      quality: 50,
    };
    
    return {
      runway: n(ledger.runwayMonths?.scenario, 0),
      runwayDelta: n(ledger.runwayMonths?.delta, 0),
      arr: n(ledger.arr12?.scenario, 0),
      arrDelta: n(ledger.arr12?.delta, 0),
      growth: n(ledger.arrGrowthPct?.scenario, 0),
      growthDelta: n(ledger.arrGrowthPct?.delta, 0),
      risk: n(ledger.riskScore?.scenario, 50),
      quality: n(ledger.qualityScore?.scenario, 50),
    };
  }, [ledger]);

  // Generate Signal Bullets from metrics
  const signalBullets: SignalBullet[] = useMemo(() => {
    const runwayBand = metrics.runway >= 18 ? "STRONG" : metrics.runway >= 12 ? "OK" : "LOW";
    const runwayStatus = metrics.runway >= 18 ? "positive" : metrics.runway >= 12 ? "neutral" : "critical";
    
    const momentumBand = metrics.growthDelta >= 5 ? "ACCEL" : metrics.growthDelta <= -5 ? "SLOW" : "STABLE";
    const momentumStatus = metrics.growthDelta >= 5 ? "positive" : metrics.growthDelta <= -5 ? "critical" : "neutral";
    
    const riskBand = metrics.risk >= 60 ? "ELEVATED" : metrics.risk >= 40 ? "MODERATE" : "CONTAINED";
    const riskStatus = metrics.risk >= 60 ? "critical" : metrics.risk >= 40 ? "neutral" : "positive";
    
    return [
      {
        symbol: runwayStatus === "positive" ? "check" : runwayStatus === "critical" ? "alert" : "tilde",
        label: "RUNWAY",
        value: `${runwayBand} (${Math.round(metrics.runway)} MO)`,
        status: runwayStatus,
      },
      {
        symbol: momentumStatus === "positive" ? "check" : momentumStatus === "critical" ? "alert" : "tilde",
        label: "MOMENTUM",
        value: momentumBand,
        status: momentumStatus,
      },
      {
        symbol: riskStatus === "positive" ? "check" : riskStatus === "critical" ? "alert" : "tilde",
        label: "RISK",
        value: riskBand,
        status: riskStatus,
        pulse: riskStatus === "critical",
      },
    ];
  }, [metrics]);

  // Generate Vitality Gauges
  const vitalityGauges: VitalityGauge[] = useMemo(() => {
    // Unit Economics score (based on quality and margins)
    const unitEconScore = Math.round(clamp01(metrics.quality / 100) * 100);
    const unitEconStatus = unitEconScore >= 70 ? "positive" : unitEconScore >= 40 ? "warning" : "critical";
    
    // Execution score (inverse of risk)
    const executionScore = Math.round(clamp01(1 - (metrics.risk / 100)) * 100);
    const executionStatus = executionScore >= 70 ? "positive" : executionScore >= 40 ? "warning" : "critical";

    return [
      { label: "UNIT ECON", score: unitEconScore, maxScore: 100, status: unitEconStatus },
      { label: "EXECUTION", score: executionScore, maxScore: 100, status: executionStatus },
    ];
  }, [metrics]);

  // Generate Mini Risk Map cells
  const riskMapData = useMemo(() => {
    // 3x3 grid representing risk terrain
    // Rows: 0=low risk, 1=medium, 2=high risk
    // Cols: 0=low exposure, 1=medium, 2=high exposure
    const riskLevel = metrics.risk >= 60 ? 2 : metrics.risk >= 40 ? 1 : 0;
    const exposureLevel = Math.abs(metrics.growthDelta) >= 10 ? 2 : Math.abs(metrics.growthDelta) >= 5 ? 1 : 0;
    
    const cells: RiskCell[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Color based on position in grid
        let status: RiskCell["status"] = "empty";
        if (row === 0) status = "green";
        else if (row === 1) status = col === 2 ? "yellow" : col === 1 ? "yellow" : "green";
        else status = col === 0 ? "yellow" : "red";
        
        cells.push({ row, col, status });
      }
    }
    
    return { cells, positionRow: riskLevel, positionCol: exposureLevel };
  }, [metrics]);

  // System state
  const systemState = useMemo(() => {
    const financialStrain = Math.min(100, Math.max(0, 100 - metrics.runway * 4));
    const operationalStrain = Math.min(100, Math.max(0, n((levers as any).hiringIntensity, 0) * 0.6 + n((levers as any).operatingDrag, 0) * 0.4));
    const executionStrain = Math.min(100, Math.max(0, metrics.risk * 0.8));
    
    const getStatus = (strain: number) => strain >= 65 ? "CRITICAL" : strain >= 40 ? "ELEVATED" : "STABLE";
    
    return [
      { label: "FIN", status: getStatus(financialStrain), strain: Math.round(financialStrain) },
      { label: "OPS", status: getStatus(operationalStrain), strain: Math.round(operationalStrain) },
      { label: "EXEC", status: getStatus(executionStrain), strain: Math.round(executionStrain) },
    ];
  }, [metrics, levers]);

  // Recommended actions
  const actions = useMemo(() => {
    const list: Array<{ priority: number; title: string }> = [];
    
    if (metrics.runway < 18) {
      list.push({ priority: 1, title: "Extend runway via OpEx review" });
    }
    if (metrics.risk >= 50) {
      list.push({ priority: list.length + 1, title: "Reduce execution risk exposure" });
    }
    if (metrics.growthDelta < -3) {
      list.push({ priority: list.length + 1, title: "Accelerate demand gen" });
    }
    if (list.length === 0) {
      list.push({ priority: 1, title: "Maintain current trajectory" });
    }
    
    return list.slice(0, 3); // Max 3 actions
  }, [metrics]);

  // Status updating state
  const leverSignal = useMemo(() => JSON.stringify(levers), [levers]);
  const [status, setStatus] = useState<"UPDATING" | "STABLE">("STABLE");
  const settleTimerRef = useRef<number | null>(null);
  
  useEffect(() => {
    setStatus("UPDATING");
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      setStatus("STABLE");
    }, 600);
    return () => {
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    };
  }, [leverSignal]);

  const [activeTab, setActiveTab] = useState<"cockpit" | "risk" | "value" | "modules">("cockpit");
  const panelRef = useRef<HTMLDivElement | null>(null);
  
  // Sequential typewriter state
  const [executiveSummaryComplete, setExecutiveSummaryComplete] = useState(false);
  
  // Reset typewriter sequence when metrics change significantly
  useEffect(() => {
    setExecutiveSummaryComplete(false);
  }, [metrics.runway, metrics.risk, metrics.growth]);

  return (
    <div ref={panelRef} className={styles.aiPanel}>
      <div className={styles.aiPanelWell}>
        
        {/* ORACLE PROTOCOL — Shows when lever is focused */}
        {focusedLever && (
          <OracleOverlay leverId={focusedLever} />
        )}
        
        {/* NORMAL CONTENT — Hidden when Oracle is active */}
        <div className={focusedLever ? styles.contentHidden : ''}>
        
        {/* HEADER — ACTIVE NAVIGATION */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
            <div className={styles.title}>
              {/* Radar Icon — Spinning Scanner */}
              <div className={styles.radarIcon}>
                <div className={styles.radarSweep} />
                <div className={styles.radarDot} />
              </div>
              ACTIVE NAVIGATION
            </div>
          <div className={styles.headerControls}>
            {/* VOICE MODE TOGGLE */}
            <button 
              onClick={toggleVoice}
              className={`${styles.voiceToggle} ${isVoiceEnabled ? styles.voiceOn : styles.voiceOff}`}
              title={isVoiceEnabled ? 'Voice Mode: ON' : 'Voice Mode: OFF'}
            >
              {isVoiceEnabled ? (
                <Volume2 className="w-3 h-3" />
              ) : (
                <VolumeX className="w-3 h-3" />
              )}
              <span className={styles.voiceLabel}>
                {isVoiceEnabled ? 'VOICE' : 'MUTED'}
              </span>
            </button>
            
            {/* STATUS PILL */}
            <div className={`${styles.navStatusPill} ${focusedLever ? styles.maneuvering : styles.autopilot}`}>
              {focusedLever ? 'MANEUVERING' : 'AUTOPILOT'}
            </div>
          </div>
        </div>
      </div>

        {/* TABS */}
      <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "cockpit" ? styles.active : ""}`}
            onClick={() => setActiveTab("cockpit")}
          >
            SUMMARY
          </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "risk" ? styles.active : ""}`}
          onClick={() => setActiveTab("risk")}
        >
            RISK MAP
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
            className={`${styles.tab} ${activeTab === "modules" ? styles.active : ""}`}
            onClick={() => setActiveTab("modules")}
        >
            MODULES
        </button>
      </div>

        {/* CONTENT */}
      <div className={styles.content}>
          {activeTab === "cockpit" && (
          <>
              {/* EXECUTIVE SUMMARY — Types first */}
              <div className={styles.executiveSection}>
            <div className={styles.sectionHeader}>
                  <Activity size={14} />
                  <span>EXECUTIVE SUMMARY</span>
            </div>
                <div className={styles.executiveCard}>
                  <ExecutiveSummary 
                    metrics={metrics} 
                    onComplete={() => setExecutiveSummaryComplete(true)}
                  />
              </div>
            </div>

              {/* AI COMMENTARY — Types after Executive Summary completes */}
              <div className={styles.commentarySection}>
                <div className={styles.sectionHeader}>
                  <Zap size={14} />
                  <span>AI COMMENTARY</span>
                </div>
                <div className={styles.commentaryCard}>
                  <AICommentary 
                    metrics={metrics} 
                    systemState={systemState} 
                    canStart={executiveSummaryComplete}
                  />
                </div>
              </div>

              {/* SCENARIO INTEGRITY CHECK / AUDIT */}
              <ScenarioIntegrityCheck />
            </>
        )}

          {activeTab === "risk" && (
            <>
              {/* EXPANDED RISK MAP */}
              <div className={styles.riskMapExpanded}>
                <MiniRiskMap 
                  cells={riskMapData.cells} 
                  positionRow={riskMapData.positionRow}
                  positionCol={riskMapData.positionCol}
                />
            </div>

              {/* SYSTEM INTEGRITY / AUDIT CHECK */}
              <ScenarioIntegrityCheck />

              {/* RISK SIGNALS */}
              <div className={styles.signalsSection}>
                <div className={styles.sectionHeader}>
                  <Shield size={14} />
                  <span>RISK SIGNALS</span>
                </div>
                <div className={styles.signalsList}>
                  {signalBullets.filter(b => b.label === "RISK").map((bullet, i) => (
                    <SignalBulletWidget key={i} bullet={bullet} />
                  ))}
                  <SignalBulletWidget 
                    bullet={{
                      symbol: metrics.quality >= 70 ? "check" : metrics.quality >= 40 ? "tilde" : "alert",
                      label: "QUALITY",
                      value: metrics.quality >= 70 ? "HIGH" : metrics.quality >= 40 ? "MODERATE" : "LOW",
                      status: metrics.quality >= 70 ? "positive" : metrics.quality >= 40 ? "neutral" : "critical",
                    }}
                  />
                  <SignalBulletWidget 
                    bullet={{
                      symbol: systemState.find(s => s.label === "FIN")?.status === "STABLE" ? "check" : 
                              systemState.find(s => s.label === "FIN")?.status === "CRITICAL" ? "alert" : "tilde",
                      label: "FINANCIAL",
                      value: systemState.find(s => s.label === "FIN")?.status || "UNKNOWN",
                      status: systemState.find(s => s.label === "FIN")?.status === "STABLE" ? "positive" : 
                              systemState.find(s => s.label === "FIN")?.status === "CRITICAL" ? "critical" : "neutral",
                    }}
                  />
              </div>
            </div>

              {/* LOCKED PREVIEW for Advanced Features */}
              <LockedTabPanel
                title="PROPAGATION PATHS"
                description="Risk propagation visualization showing how risks cascade through the model. Unlocks post-demo."
              />
                  </>
                )}

        {activeTab === "value" && (
          <LockedTabPanel
            title="VALUE INTELLIGENCE"
              description="Scenario-driven value ranges, capital efficiency signals, and dilution-aware paths. Unlocks after validation."
            />
          )}

          {activeTab === "modules" && (
          <>
            <LockedTabPanel
                title="STRATEGIC MODULES"
                description="AI-powered strategic prompts and second-order risk analysis. Activates after governance checks."
            />
            <div style={{ marginTop: 12 }}>
              <StrategicModules />
            </div>
          </>
        )}
            </div>
        </div> {/* End NORMAL CONTENT wrapper */}
      </div>
    </div>
  );
}
