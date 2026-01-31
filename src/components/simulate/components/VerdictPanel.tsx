// src/components/simulate/components/VerdictPanel.tsx
// STRATFIT — Verdict Display Panel

import React from "react";
import { Shield, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { Verdict } from "@/logic/verdictGenerator";
import type { MonteCarloResult } from "@/logic/monteCarloEngine";

interface VerdictPanelProps {
  verdict: Verdict;
  result: MonteCarloResult;
}

export default function VerdictPanel({ verdict, result }: VerdictPanelProps) {
  const getRatingColor = (rating: Verdict["overallRating"]) => {
    switch (rating) {
      case "EXCEPTIONAL":
        return "var(--color-success)";
      case "STRONG":
        return "var(--color-cyan)";
      case "STABLE":
        return "var(--color-cyan-dim)";
      case "CAUTION":
        return "var(--color-warning)";
      case "CRITICAL":
        return "var(--color-danger)";
    }
  };

  const getRatingIcon = (rating: Verdict["overallRating"]) => {
    switch (rating) {
      case "EXCEPTIONAL":
      case "STRONG":
        return <CheckCircle size={24} />;
      case "STABLE":
        return <Shield size={24} />;
      case "CAUTION":
        return <AlertTriangle size={24} />;
      case "CRITICAL":
        return <XCircle size={24} />;
    }
  };

  const survivalPct = Math.round(result.survivalRate * 100);

  return (
    <div className="verdict-panel">
      {/* Score Circle */}
      <div className="verdict-score-container">
        <svg className="verdict-score-ring" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={getRatingColor(verdict.overallRating)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${verdict.overallScore * 3.39} 339`}
            transform="rotate(-90 60 60)"
            className="verdict-score-progress"
          />
        </svg>
        <div className="verdict-score-inner">
          <span className="verdict-score-number">{verdict.overallScore}</span>
          <span className="verdict-score-label">SCORE</span>
        </div>
      </div>

      {/* Rating Badge */}
      <div className="verdict-rating" style={{ "--rating-color": getRatingColor(verdict.overallRating) } as React.CSSProperties}>
        <div className="verdict-rating-icon">{getRatingIcon(verdict.overallRating)}</div>
        <div className="verdict-rating-text">
          <span className="rating-label">{verdict.overallRating}</span>
          <span className="rating-confidence">{verdict.confidenceLevel}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="verdict-metrics">
        <div className="metric-item">
          <span className="metric-label">SURVIVAL</span>
          <span className="metric-value survival">{survivalPct}%</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">MEDIAN ARR</span>
          <span className="metric-value">
            ${(result.arrPercentiles.p50 / 1000000).toFixed(1)}M
          </span>
        </div>
        <div className="metric-item">
          <span className="metric-label">RUNWAY</span>
          <span className="metric-value">{Math.round(result.runwayPercentiles.p50)} mo</span>
        </div>
      </div>

      {/* Primary Risk */}
      <div className="verdict-risk">
        <AlertTriangle size={16} />
        <span>{verdict.primaryRisk}</span>
      </div>

      {/* Top Recommendation */}
      <div className="verdict-recommendation">
        <TrendingUp size={16} />
        <span>{verdict.recommendations[0]?.action}</span>
      </div>
    </div>
  );
}


