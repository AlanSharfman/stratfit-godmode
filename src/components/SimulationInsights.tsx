// src/components/SimulationInsights.tsx
// STRATFIT — Simulation Insights Panel
// Displays Monte Carlo results in the AI Intelligence section

import React from 'react';
import { 
  useSimulationStore, 
  useSimulationSummary, 
  useHasSimulated,
} from '@/state/simulationStore';

interface SimulationInsightsProps {
  className?: string;
}

export default function SimulationInsights({ className = '' }: SimulationInsightsProps) {
  const hasSimulated = useHasSimulated();
  const summary = useSimulationSummary();
  const lastSimulationTime = useSimulationStore((s) => s.lastSimulationTime);
  const simulationCount = useSimulationStore((s) => s.simulationCount);

  if (!hasSimulated || !summary) {
    return (
      <div className={`simulation-insights not-simulated ${className}`}>
        <div className="insights-placeholder">
          <div className="placeholder-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 17H7A5 5 0 0 1 7 7h2" />
              <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <p className="placeholder-title">NO SIMULATION RUN</p>
          <p className="placeholder-text">
            Click SIMULATE to run 10,000 Monte Carlo scenarios and see probability distributions.
          </p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'var(--color-cyan, #22d3ee)';
    if (score >= 50) return 'rgba(34, 211, 238, 0.7)';
    return 'rgba(251, 191, 36, 0.8)';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`simulation-insights has-results ${className}`}>
      {/* Header with badge */}
      <div className="insights-header">
        <div className="insights-title">
          <span className="title-icon">◈</span>
          SIMULATION RESULTS
        </div>
        <div className="insights-badge">
          <span className="badge-dot" />
          SIMULATED
        </div>
      </div>

      {/* Score display */}
      <div className="insights-score">
        <div 
          className="score-circle"
          style={{ '--score-color': getScoreColor(summary.overallScore) } as React.CSSProperties}
        >
          <span className="score-value">{summary.overallScore}</span>
          <span className="score-label">SCORE</span>
        </div>
        <div className="score-info">
          <span className="score-rating">{summary.overallRating}</span>
          <span className="score-survival">{summary.survivalPercent} survival probability</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="insights-metrics">
        <div className="metric-row">
          <span className="metric-label">SURVIVAL RATE</span>
          <span className="metric-value primary">{summary.survivalPercent}</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">MEDIAN ARR (P50)</span>
          <span className="metric-value">{summary.arrFormatted.p50}</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">ARR RANGE</span>
          <span className="metric-value range">
            {summary.arrFormatted.p10} — {summary.arrFormatted.p90}
          </span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">MEDIAN RUNWAY</span>
          <span className="metric-value">{Math.round(summary.runwayMedian)} months</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">CONFIDENCE</span>
          <span className={`metric-value confidence ${summary.confidenceLevel.toLowerCase()}`}>
            {summary.confidenceLevel}
          </span>
        </div>
      </div>

      {/* Risk insight */}
      <div className="insights-risk">
        <div className="risk-label">PRIMARY RISK</div>
        <p className="risk-text">{summary.primaryRisk}</p>
      </div>

      {/* Recommendation */}
      <div className="insights-recommendation">
        <div className="rec-label">TOP RECOMMENDATION</div>
        <p className="rec-text">{summary.topRecommendation}</p>
      </div>

      {/* Footer */}
      <div className="insights-footer">
        <span className="footer-text">
          Simulation #{simulationCount} at {lastSimulationTime && formatTime(lastSimulationTime)}
        </span>
        <span className="footer-hint">
          Adjust levers and re-simulate to compare
        </span>
      </div>
    </div>
  );
}

