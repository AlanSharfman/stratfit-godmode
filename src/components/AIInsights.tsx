// src/components/AIInsights.tsx
// STRATFIT — AI Insights: COMMENTARY / RISKS / ACTIONS (3 Columns)

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

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
  icon: React.ReactNode;
  items: InsightItem[];
  accentColor: string;
  delay: number;
}

function InsightCard({ title, icon, items, accentColor, delay }: InsightCardProps) {
  const allText = items.map(i => i.text).join(" • ");
  const displayText = useTypewriter(allText, 15, delay);

  return (
    <motion.div
      className="insight-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      style={{ "--card-accent": accentColor } as React.CSSProperties}
    >
      {/* Top accent line */}
      <div className="insight-accent" style={{ background: accentColor }} />
      
      {/* Header */}
      <div className="insight-header">
        <div className="insight-icon" style={{ color: accentColor }}>
          {icon}
        </div>
        <h3 className="insight-title">{title}</h3>
      </div>

      {/* Content */}
      <div className="insight-content">
        {items.map((item, i) => {
          const startIdx = items.slice(0, i).reduce((acc, it) => acc + it.text.length + 3, 0);
          const endIdx = startIdx + item.text.length;
          const itemText = displayText.slice(startIdx, Math.min(displayText.length, endIdx));
          const showBullet = displayText.length > startIdx;
          
          return (
            <div key={i} className="insight-item" style={{ opacity: showBullet ? 1 : 0.3 }}>
              <span className="insight-bullet" style={{ color: accentColor }}>•</span>
              <span className="insight-text">{itemText || item.text.slice(0, 0)}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================================
// METRIC BADGE
// ============================================================================

interface MetricBadgeProps {
  label: string;
  value: string;
  change?: number;
  type: "positive" | "negative" | "neutral" | "risk";
  riskLevel?: "Low" | "Med" | "High";
}

function MetricBadge({ label, value, change, type, riskLevel }: MetricBadgeProps) {
  let bgColor = "rgba(148, 163, 184, 0.15)";
  let textColor = "#94a3b8";
  let borderColor = "rgba(148, 163, 184, 0.3)";

  if (type === "positive") {
    bgColor = "rgba(52, 211, 153, 0.12)";
    textColor = "#34d399";
    borderColor = "rgba(52, 211, 153, 0.3)";
  } else if (type === "negative") {
    bgColor = "rgba(251, 113, 133, 0.12)";
    textColor = "#fb7185";
    borderColor = "rgba(251, 113, 133, 0.3)";
  } else if (type === "risk") {
    if (riskLevel === "High") {
      bgColor = "rgba(239, 68, 68, 0.12)";
      textColor = "#ef4444";
      borderColor = "rgba(239, 68, 68, 0.3)";
    } else if (riskLevel === "Med") {
      bgColor = "rgba(251, 191, 36, 0.12)";
      textColor = "#fbbf24";
      borderColor = "rgba(251, 191, 36, 0.3)";
    }
  }

  return (
    <div
      className="metric-badge"
      style={{ background: bgColor, borderColor, color: textColor }}
    >
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {change !== undefined && (
        <span className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
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
  // Format currency
  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return `$${Math.round(n)}`;
  };

  return (
    <div className="ai-insights">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-left">
          <motion.div
            className="ai-pulse"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="ai-title">AI INSIGHTS</span>
        </div>
        <button className="pdf-btn" onClick={onGeneratePDF}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Generate PDF
        </button>
      </div>

      {/* 3-Column Grid */}
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

      {/* Metrics Bar */}
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
        <MetricBadge
          label="Risk"
          value={metrics.riskLevel}
          type="risk"
          riskLevel={metrics.riskLevel}
        />
      </div>

      <style>{`
        .ai-insights {
          background: rgba(11, 14, 20, 0.8);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px 24px;
          backdrop-filter: blur(20px);
        }

        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .ai-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-pulse {
          width: 10px;
          height: 10px;
          background: #34d399;
          border-radius: 50%;
          box-shadow: 0 0 12px #34d399;
        }

        .ai-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.8);
        }

        .pdf-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pdf-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        /* 3-Column Grid */
        .ai-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        @media (max-width: 900px) {
          .ai-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Insight Card */
        .insight-card {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
          min-height: 160px;
        }

        .insight-accent {
          height: 3px;
          width: 100%;
        }

        .insight-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px 10px;
        }

        .insight-icon {
          display: flex;
          align-items: center;
        }

        .insight-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .insight-content {
          padding: 0 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .insight-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          transition: opacity 0.2s;
        }

        .insight-bullet {
          font-size: 16px;
          line-height: 1.4;
          flex-shrink: 0;
        }

        .insight-text {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.75);
        }

        /* Metrics Bar */
        .ai-metrics {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .metric-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid;
          font-size: 13px;
        }

        .metric-label {
          font-weight: 600;
          opacity: 0.8;
        }

        .metric-value {
          font-weight: 700;
        }

        .metric-change {
          font-size: 11px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: #34d399;
        }

        .metric-change.negative {
          color: #fb7185;
        }
      `}</style>
    </div>
  );
}
