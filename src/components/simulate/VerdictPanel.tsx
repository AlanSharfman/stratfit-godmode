// src/components/simulate/VerdictPanel.tsx
// STRATFIT — Verdict Display Panel

import React from 'react';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { Verdict } from '@/logic/verdictGenerator';
import type { MonteCarloResult } from '@/logic/monteCarloEngine';

interface VerdictPanelProps {
  verdict: Verdict;
  result: MonteCarloResult;
}

export default function VerdictPanel({ verdict, result }: VerdictPanelProps) {
  const getRatingColor = (rating: Verdict['overallRating']) => {
    switch (rating) {
      case 'EXCEPTIONAL': return 'var(--color-success)';
      case 'STRONG': return 'var(--color-cyan)';
      case 'STABLE': return 'var(--color-cyan-dim)';
      case 'CAUTION': return 'var(--color-warning)';
      case 'CRITICAL': return 'var(--color-danger)';
    }
  };

  const getRatingIcon = (rating: Verdict['overallRating']) => {
    switch (rating) {
      case 'EXCEPTIONAL':
      case 'STRONG':
        return <CheckCircle size={24} />;
      case 'STABLE':
        return <Shield size={24} />;
      case 'CAUTION':
        return <AlertTriangle size={24} />;
      case 'CRITICAL':
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
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
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
      <div 
        className="verdict-rating"
        style={{ '--rating-color': getRatingColor(verdict.overallRating) } as React.CSSProperties}
      >
        <div className="verdict-rating-icon">
          {getRatingIcon(verdict.overallRating)}
        </div>
        <span className="verdict-rating-text">{verdict.overallRating}</span>
      </div>

      {/* Headline */}
      <h2 className="verdict-headline">{verdict.headline}</h2>

      {/* Summary */}
      <p className="verdict-summary">{verdict.summary}</p>

      {/* Key Metrics */}
      <div className="verdict-metrics">
        <div className="verdict-metric">
          <div className="verdict-metric-bar">
            <div 
              className="verdict-metric-fill survival"
              style={{ width: `${survivalPct}%` }}
            />
          </div>
          <div className="verdict-metric-info">
            <span className="verdict-metric-value">{survivalPct}%</span>
            <span className="verdict-metric-label">Survival Probability</span>
          </div>
        </div>

        <div className="verdict-metric">
          <div className="verdict-metric-bar">
            <div 
              className="verdict-metric-fill growth"
              style={{ width: `${Math.min(100, (result.arrPercentiles.p50 / result.arrPercentiles.p90) * 100)}%` }}
            />
          </div>
          <div className="verdict-metric-info">
            <span className="verdict-metric-value">${(result.arrPercentiles.p50 / 1000000).toFixed(1)}M</span>
            <span className="verdict-metric-label">Median ARR (P50)</span>
          </div>
        </div>

        <div className="verdict-metric">
          <div className="verdict-metric-bar">
            <div 
              className="verdict-metric-fill runway"
              style={{ width: `${Math.min(100, (result.runwayPercentiles.p50 / 36) * 100)}%` }}
            />
          </div>
          <div className="verdict-metric-info">
            <span className="verdict-metric-value">{Math.round(result.runwayPercentiles.p50)} mo</span>
            <span className="verdict-metric-label">Median Runway</span>
          </div>
        </div>
      </div>

      {/* Confidence Badge */}
      <div className={`verdict-confidence ${verdict.confidenceLevel.toLowerCase()}`}>
        <span className="confidence-level">{verdict.confidenceLevel} CONFIDENCE</span>
        <span className="confidence-text">{verdict.confidenceStatement}</span>
      </div>
    </div>
  );
}

