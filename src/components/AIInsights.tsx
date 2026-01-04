// src/components/AIInsights.tsx
// STRATFIT — AI Insights: COMMENTARY / RISKS / ACTIONS (3 Columns)

import React, { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// TYPES
// ============================================================================

interface InsightItem {
  text: string;
}

interface AIInsightsProps {
  insights: {
    commentary: InsightItem[];
    risks: InsightItem[];
    actions: InsightItem[];
  };
  metrics: {
    mrr: number;
    mrrChange: number;
    burn: number;
    burnChange: number;
    runway: number;
    riskLevel: "Low" | "Med" | "High";
  };
  onGeneratePDF?: () => void;
}

// ============================================================================
// TYPEWRITER HOOK
// ============================================================================

function useTypewriter(text: string, speed: number = 20, delay: number = 0) {
  const [displayText, setDisplayText] = useState("");
  const [started, setStarted] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayText("");
    setStarted(false);

    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [text, delay]);

  useEffect(() => {
    if (!started) return;
    if (indexRef.current >= text.length) return;

    const timer = setTimeout(() => {
      indexRef.current += 1;
      setDisplayText(text.slice(0, indexRef.current));
    }, speed);

    return () => clearTimeout(timer);
  }, [text, displayText, speed, started]);

  return displayText;
}

// ============================================================================
// INSIGHT CARD
// ============================================================================

interface InsightCardProps {
  title: string;
  icon: React.ReactNode; // ✅ fixed: was JSX.Element (can break with some TS/React setups)
  items: InsightItem[];
  accentColor: string;
  delay: number;
}

function InsightCard({ title, icon, items, accentColor, delay }: InsightCardProps) {
  const allText = items.map((i) => i.text).join(" • ");
  const displayText = useTypewriter(allText, 15, delay);

  return (
    <motion.div
      className="insight-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      style={{ "--card-accent": accentColor } as React.CSSProperties}
    >
      <div className="insight-accent" style={{ background: accentColor }} />

      <div className="insight-header">
        <div className="insight-icon" style={{ color: accentColor }}>
          {icon}
        </div>
        <h3 className="insight-title">{title}</h3>
      </div>

      <div className="insight-content">
        <span className="insight-text">{displayText}</span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// METRIC BADGE
// ============================================================================

function MetricBadge({
  label,
  value,
  change,
  type,
  riskLevel,
}: {
  label: string;
  value: string;
  change?: number;
  type: "positive" | "negative" | "neutral" | "risk";
  riskLevel?: "Low" | "Med" | "High";
}) {
  let bgColor = "rgba(255, 255, 255, 0.06)";
  let textColor = "rgba(255, 255, 255, 0.85)";
  let borderColor = "rgba(255, 255, 255, 0.10)";

  if (type === "positive") {
    bgColor = "rgba(52, 211, 153, 0.12)";
    textColor = "#34d399";
    borderColor = "rgba(52, 211, 153, 0.3)";
  } else if (type === "negative") {
    bgColor = "rgba(239, 68, 68, 0.12)";
    textColor = "#ef4444";
    borderColor = "rgba(239, 68, 68, 0.3)";
  } else if (type === "neutral") {
    bgColor = "rgba(251, 191, 36, 0.12)";
    textColor = "#fbbf24";
    borderColor = "rgba(251, 191, 36, 0.3)";
  } else if (type === "risk") {
    if (riskLevel === "High") {
      bgColor = "rgba(239, 68, 68, 0.12)";
      textColor = "#ef4444";
      borderColor = "rgba(239, 68, 68, 0.3)";
    } else if (riskLevel === "Med") {
      bgColor = "rgba(251, 191, 36, 0.12)";
      textColor = "#fbbf24";
      borderColor = "rgba(251, 191, 36, 0.3)";
    } else {
      bgColor = "rgba(52, 211, 153, 0.12)";
      textColor = "#34d399";
      borderColor = "rgba(52, 211, 153, 0.3)";
    }
  }

  return (
    <div className="metric-badge" style={{ background: bgColor, borderColor, color: textColor }}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {change !== undefined && (
        <span className={`metric-change ${change >= 0 ? "positive" : "negative"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
        </span>
      )}
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

const CommentaryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const RisksIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ActionsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIInsights({ insights, metrics, onGeneratePDF }: AIInsightsProps) {
  // Keep this if you use it later; otherwise safe to remove.
  // (It is currently unused in your pasted code, but not harmful.)
  const { scenario } = useScenarioStore(
    useShallow((s) => ({ scenario: s.scenario }))
  );

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${Math.round(n)}`;
  };

  return (
    <div className="ai-insights">
      <div className="ai-header">
        <div className="ai-header-left">
          <motion.div
            className="ai-pulse"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="ai-title">AI INSIGHTS</span>
        </div>

        {onGeneratePDF && (
          <button className="pdf-btn" onClick={onGeneratePDF}>
            Generate PDF
          </button>
        )}
      </div>

      <div className="ai-grid">
        <InsightCard
          title="COMMENTARY"
          icon={<CommentaryIcon />}
          items={insights.commentary}
          accentColor="#34d399"
          delay={0}
        />
        <InsightCard
          title="RISKS"
          icon={<RisksIcon />}
          items={insights.risks}
          accentColor="#fbbf24"
          delay={400}
        />
        <InsightCard
          title="ACTIONS"
          icon={<ActionsIcon />}
          items={insights.actions}
          accentColor="#22d3ee"
          delay={800}
        />
      </div>

      <div className="ai-metrics">
        <MetricBadge
          label="MRR"
          value={formatCurrency(metrics.mrr)}
          change={metrics.mrrChange}
          type={metrics.mrrChange >= 0 ? "positive" : "negative"}
        />
        <MetricBadge
          label="Burn"
          value={formatCurrency(metrics.burn)}
          change={metrics.burnChange}
          type={metrics.burnChange <= 0 ? "positive" : "negative"}
        />
        <MetricBadge
          label="Runway"
          value={`${metrics.runway} mo`}
          type={metrics.runway >= 18 ? "positive" : metrics.runway >= 12 ? "neutral" : "negative"}
        />
        <MetricBadge label="Risk" value={metrics.riskLevel} type="risk" riskLevel={metrics.riskLevel} />
      </div>
    </div>
  );
}
