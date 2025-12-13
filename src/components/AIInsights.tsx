// src/components/AIInsights.tsx
// STRATFIT — AI Insights with 3-Column Layout + Typewriter Effect

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================

interface AIInsightsProps {
  insights: {
    highlights: string;
    risks: string;
    suggestions: string; // Changed from recommendations
  };
  mrrValue: number;
  burnValue: number;
  runwayMonths: number;
  onGeneratePDF?: () => void;
}

// ============================================================================
// TYPEWRITER HOOK
// ============================================================================

function useTypewriter(text: string, speed: number = 25, startDelay: number = 0) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const indexRef = useRef(0);
  const textRef = useRef(text);

  useEffect(() => {
    // Reset when text changes
    if (textRef.current !== text) {
      textRef.current = text;
      indexRef.current = 0;
      setDisplayText("");
      setIsComplete(false);
      setHasStarted(false);
    }

    // Start delay
    if (!hasStarted) {
      const delayTimer = setTimeout(() => {
        setHasStarted(true);
      }, startDelay);
      return () => clearTimeout(delayTimer);
    }

    if (indexRef.current >= text.length) {
      setIsComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(text.slice(0, indexRef.current + 1));
      indexRef.current += 1;
    }, speed);

    return () => clearTimeout(timer);
  }, [text, displayText, speed, hasStarted, startDelay]);

  return { displayText, isComplete, hasStarted };
}

// ============================================================================
// INSIGHT CARD COMPONENT
// ============================================================================

interface InsightCardProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  accentColor: string;
  delay: number;
}

function InsightCard({ title, icon, content, accentColor, delay }: InsightCardProps) {
  const { displayText, isComplete, hasStarted } = useTypewriter(content, 20, delay);

  return (
    <motion.div
      className="insight-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      style={{
        "--card-accent": accentColor,
        "--card-glow": `${accentColor}30`,
      } as React.CSSProperties}
    >
      {/* Card border */}
      <div className="insight-card-border" />

      <div className="insight-card-inner">
        {/* Header */}
        <div className="insight-card-header">
          <div className="insight-icon" style={{ color: accentColor }}>
            {icon}
          </div>
          <h3 className="insight-title" style={{ color: accentColor }}>
            {title}
          </h3>
        </div>

        {/* Content with typewriter */}
        <div className="insight-content">
          <p className="insight-text">
            {hasStarted ? displayText : ""}
            {hasStarted && !isComplete && (
              <motion.span
                className="cursor"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.4, repeat: Infinity }}
                style={{ color: accentColor }}
              >
                ▌
              </motion.span>
            )}
          </p>
        </div>

        {/* Decorative line */}
        <motion.div 
          className="insight-line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: hasStarted ? 1 : 0 }}
          transition={{ duration: 0.8, delay: delay / 1000 + 0.3 }}
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// DYNAMIC BADGE
// ============================================================================

interface BadgeProps {
  label: string;
  value: string;
  type: "mrr" | "burn" | "risk";
  isGood: boolean;
}

function DynamicBadge({ label, value, type, isGood }: BadgeProps) {
  let bgColor = "";
  let textColor = "";
  let borderColor = "";

  if (type === "mrr") {
    // MRR: Green when good, Yellow when bad
    if (isGood) {
      bgColor = "rgba(52, 211, 153, 0.15)";
      textColor = "#34d399";
      borderColor = "rgba(52, 211, 153, 0.35)";
    } else {
      bgColor = "rgba(251, 191, 36, 0.15)";
      textColor = "#fbbf24";
      borderColor = "rgba(251, 191, 36, 0.35)";
    }
  } else if (type === "burn") {
    // Burn: Green when good (low), Red when bad (high)
    if (isGood) {
      bgColor = "rgba(52, 211, 153, 0.15)";
      textColor = "#34d399";
      borderColor = "rgba(52, 211, 153, 0.35)";
    } else {
      bgColor = "rgba(251, 113, 133, 0.15)";
      textColor = "#fb7185";
      borderColor = "rgba(251, 113, 133, 0.35)";
    }
  } else if (type === "risk") {
    // Risk: Red when High, Yellow when Med, Gray when Low
    if (value === "High") {
      bgColor = "rgba(239, 68, 68, 0.15)";
      textColor = "#ef4444";
      borderColor = "rgba(239, 68, 68, 0.35)";
    } else if (value === "Med") {
      bgColor = "rgba(251, 191, 36, 0.15)";
      textColor = "#fbbf24";
      borderColor = "rgba(251, 191, 36, 0.35)";
    } else {
      bgColor = "rgba(148, 163, 184, 0.15)";
      textColor = "#94a3b8";
      borderColor = "rgba(148, 163, 184, 0.35)";
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="insight-badge"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      <span className="badge-label">{label}:</span>
      <span className="badge-value">{value}</span>
    </motion.div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

const HighlightsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const RisksIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SuggestionsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIInsights({ 
  insights, 
  mrrValue, 
  burnValue, 
  runwayMonths,
  onGeneratePDF 
}: AIInsightsProps) {
  // Determine badge states
  const mrrIsGood = mrrValue > 150000;
  const burnIsGood = burnValue < 200000;
  const riskLevel = runwayMonths < 12 ? "High" : runwayMonths < 18 ? "Med" : "Low";

  // Format values
  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return `$${Math.round(n)}`;
  };

  return (
    <div className="ai-insights-container">
      {/* Header */}
      <div className="ai-insights-header">
        <div className="ai-header-left">
          <motion.div
            className="ai-pulse-dot"
            animate={{
              opacity: [1, 0.4, 1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <span className="ai-title">AI INSIGHTS</span>
        </div>

        <button className="pdf-button" onClick={onGeneratePDF}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Generate PDF
        </button>
      </div>

      {/* 3-Column Cards */}
      <div className="ai-insights-grid">
        <InsightCard
          title="KEY HIGHLIGHTS"
          icon={<HighlightsIcon />}
          content={insights.highlights}
          accentColor="#34d399"
          delay={0}
        />
        <InsightCard
          title="RISKS"
          icon={<RisksIcon />}
          content={insights.risks}
          accentColor="#fb7185"
          delay={300}
        />
        <InsightCard
          title="SUGGESTIONS"
          icon={<SuggestionsIcon />}
          content={insights.suggestions}
          accentColor="#22d3ee"
          delay={600}
        />
      </div>

      {/* Badges */}
      <div className="ai-badges-row">
        <DynamicBadge 
          label="MRR" 
          value={formatCurrency(mrrValue)} 
          type="mrr" 
          isGood={mrrIsGood} 
        />
        <DynamicBadge 
          label="Burn" 
          value={formatCurrency(burnValue)} 
          type="burn" 
          isGood={burnIsGood} 
        />
        <DynamicBadge 
          label="Risk" 
          value={riskLevel} 
          type="risk" 
          isGood={riskLevel === "Low"} 
        />
      </div>

      <style>{`
        .ai-insights-container {
          position: relative;
          padding: 20px 24px;
          background: linear-gradient(
            160deg,
            rgba(15, 20, 30, 0.9) 0%,
            rgba(10, 14, 22, 0.95) 100%
          );
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
        }

        .ai-insights-header {
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

        .ai-pulse-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 12px #34d399;
        }

        .ai-title {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.8);
        }

        .pdf-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.65);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .pdf-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        /* 3-Column Grid */
        .ai-insights-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        @media (max-width: 900px) {
          .ai-insights-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Insight Card */
        .insight-card {
          position: relative;
          border-radius: 14px;
          padding: 2px;
        }

        .insight-card-border {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          background: linear-gradient(
            145deg,
            var(--card-glow) 0%,
            transparent 50%,
            var(--card-glow) 100%
          );
          opacity: 0.6;
        }

        .insight-card-inner {
          position: relative;
          background: rgba(11, 14, 20, 0.8);
          border-radius: 12px;
          padding: 16px;
          min-height: 140px;
          display: flex;
          flex-direction: column;
        }

        .insight-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .insight-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
        }

        .insight-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.15em;
          margin: 0;
        }

        .insight-content {
          flex: 1;
        }

        .insight-text {
          font-size: 13px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .cursor {
          font-weight: 300;
          margin-left: 2px;
        }

        .insight-line {
          height: 2px;
          margin-top: 12px;
          border-radius: 1px;
          transform-origin: left;
        }

        /* Badges Row */
        .ai-badges-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .insight-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
        }

        .badge-label {
          font-weight: 600;
          opacity: 0.9;
        }

        .badge-value {
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}
