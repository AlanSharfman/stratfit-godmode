// src/components/AIIntelligenceWithSimulation.tsx
// STRATFIT — AI Intelligence Panel with Simulation Integration
// Shows real-time insights + Monte Carlo results when available

import React from 'react';
import { useSimulationStore, useHasSimulated, useSimulationSummary } from '@/state/simulationStore';

interface AIIntelligenceWithSimulationProps {
  // Base metrics from lever calculations
  baseMetrics: {
    runway: number;
    growthRate: number;
    burnEfficiency: number;
    riskScore: number;
  };
  className?: string;
}

export default function AIIntelligenceWithSimulation({ 
  baseMetrics,
  className = '' 
}: AIIntelligenceWithSimulationProps) {
  const hasSimulated = useHasSimulated();
  const summary = useSimulationSummary();
  const simulationStatus = useSimulationStore((s) => s.simulationStatus);
  const isSimulating = simulationStatus === "running";
  const lastTime = useSimulationStore((s) => s.lastSimulationTime);

  // Format helpers
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
  
  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status color based on rating
  const getScoreColor = (score: number) => {
    if (score >= 70) return '#22d3ee';
    if (score >= 50) return 'rgba(34, 211, 238, 0.7)';
    return 'rgba(251, 191, 36, 0.8)';
  };

  return (
    <aside className={`ai-intelligence-panel ${className}`}>
      {/* Panel Header */}
      <div className="intel-header">
        <div className="intel-title">
          <span className="intel-icon">◇</span>
          <span>ACTIVE NAVIGATION</span>
        </div>
        {hasSimulated && (
          <div className="simulation-badge">
            <span className="badge-dot" />
            <span>SIMULATED</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <nav className="intel-tabs">
        <button className="intel-tab active">SUMMARY</button>
        <button className="intel-tab">RISK MAP</button>
        <button className="intel-tab">VALUE</button>
        <button className="intel-tab">MODULES</button>
      </nav>

      {/* Simulation Results Section (shown when simulated) */}
      {hasSimulated && summary && (
        <section className="simulation-results-section">
          <div className="section-header">
            <span className="section-icon">◈</span>
            <span className="section-title">SIMULATION RESULTS</span>
          </div>
          
          {/* Score Circle */}
          <div className="simulation-score-display">
            <div 
              className="score-ring"
              style={{ '--score-color': getScoreColor(summary.overallScore) } as React.CSSProperties}
            >
              <span className="score-number">{summary.overallScore}</span>
            </div>
            <div className="score-meta">
              <span className="score-rating">{summary.overallRating}</span>
              <span className="score-survival">{formatPercent(summary.survivalRate)} survival</span>
            </div>
          </div>

          {/* Key Simulation Metrics */}
          <div className="simulation-metrics">
            <div className="sim-metric">
              <span className="sim-label">SURVIVAL PROBABILITY</span>
              <span className="sim-value primary">{formatPercent(summary.survivalRate)}</span>
            </div>
            <div className="sim-metric">
              <span className="sim-label">MEDIAN ARR (36mo)</span>
              <span className="sim-value">{formatCurrency(summary.arrMedian)}</span>
            </div>
            <div className="sim-metric">
              <span className="sim-label">ARR RANGE (P10-P90)</span>
              <span className="sim-value range">
                {formatCurrency(summary.arrP10)} — {formatCurrency(summary.arrP90)}
              </span>
            </div>
            <div className="sim-metric">
              <span className="sim-label">CONFIDENCE</span>
              <span className={`sim-value confidence ${summary.confidenceLevel.toLowerCase()}`}>
                {summary.confidenceLevel}
              </span>
            </div>
          </div>

          {/* Primary Risk */}
          <div className="simulation-insight risk">
            <span className="insight-label">PRIMARY RISK</span>
            <p className="insight-text">{summary.primaryRisk}</p>
          </div>

          {/* Top Recommendation */}
          <div className="simulation-insight recommendation">
            <span className="insight-label">RECOMMENDATION</span>
            <p className="insight-text">{summary.topRecommendation}</p>
          </div>

          {/* Timestamp */}
          <div className="simulation-footer">
            <span>Simulated at {formatTime(lastTime)}</span>
          </div>
        </section>
      )}

      {/* Simulating State */}
      {isSimulating && (
        <section className="simulation-loading-section">
          <div className="loading-spinner" />
          <span className="loading-text">Running 10,000 simulations...</span>
        </section>
      )}

      {/* Original Executive Summary (always shown) */}
      <section className="executive-summary-section">
        <div className="section-header">
          <span className="section-icon">✦</span>
          <span className="section-title">EXECUTIVE SUMMARY</span>
        </div>

        <div className="summary-metrics">
          {/* Runway */}
          <div className="summary-metric">
            <div className="metric-header">
              <span className="metric-dot runway" />
              <span className="metric-name">RUNWAY HORIZON</span>
              <span className="metric-status optimal">OPTIMAL</span>
              <span className="metric-value">{baseMetrics.runway} MONTHS</span>
            </div>
            <p className="metric-description">
              Cash position allows for aggressive R&D cycles and strategic hiring.
            </p>
            {/* Show simulated range if available */}
            {hasSimulated && summary && (
              <div className="metric-simulated-range">
                <span className="range-badge">SIM</span>
                <span className="range-values">
                  P10-P90: {Math.round(summary.runwayP10)} — {Math.round(summary.runwayP90)} mo
                </span>
              </div>
            )}
          </div>

          {/* Growth Velocity */}
          <div className="summary-metric">
            <div className="metric-header">
              <span className="metric-dot growth" />
              <span className="metric-name">GROWTH VELOCITY</span>
              <span className="metric-status stable">STABLE</span>
              <span className="metric-value">{baseMetrics.growthRate > 0 ? '+' : ''}{baseMetrics.growthRate}% MoM</span>
            </div>
            <p className="metric-description">
              Stable momentum. Customer acquisition cost within targets.
            </p>
          </div>

          {/* Burn Efficiency */}
          <div className="summary-metric">
            <div className="metric-header">
              <span className="metric-dot efficiency" />
              <span className="metric-name">BURN EFFICIENCY</span>
              <span className="metric-status efficient">EFFICIENT</span>
              <span className="metric-value">{baseMetrics.burnEfficiency}x MULTIPLE</span>
            </div>
            <p className="metric-description">
              Burn rate is efficient. Unit economics are healthy.
            </p>
          </div>

          {/* Market Exposure */}
          <div className="summary-metric">
            <div className="metric-header">
              <span className="metric-dot risk" />
              <span className="metric-name">MARKET EXPOSURE</span>
              <span className="metric-status elevated">ELEVATED</span>
              <span className="metric-value">HIGH VOLATILITY</span>
            </div>
            <p className="metric-description">
              Elevated risk exposure. Hedge against macro-economic shocks.
            </p>
          </div>
        </div>
      </section>

      {/* AI Commentary */}
      <section className="ai-commentary-section">
        <div className="section-header">
          <span className="section-icon">✧</span>
          <span className="section-title">AI COMMENTARY</span>
        </div>

        <div className="commentary-content">
          {hasSimulated && summary ? (
            <>
              <p className="commentary-paragraph">
                <strong>[SIMULATION]</strong> Based on {formatPercent(summary.survivalRate)} survival probability, 
                your current strategy shows {summary.overallRating.toLowerCase()} positioning. 
                The primary risk factor is <em>cash runway exhaustion</em>.
              </p>
              <p className="commentary-paragraph">
                <strong>[RISK]</strong> {summary.primaryRisk.split('.')[0]}.
              </p>
            </>
          ) : (
            <>
              <p className="commentary-paragraph">
                <strong>[RUNWAY]</strong> With {baseMetrics.runway} months of runway, you have 
                exceptional strategic flexibility. Consider allocating capital toward 
                growth initiatives while maintaining a 12 month minimum reserve buffer.
              </p>
              <p className="commentary-paragraph">
                <strong>[RISK]</strong> Moderate risk exposure at {baseMetrics.riskScore}/100. 
                Scenario shows manageable volatility but limited margin for error. 
                Build contingency buffers where possible.
              </p>
            </>
          )}
        </div>

        {/* Prompt to simulate if not done */}
        {!hasSimulated && !isSimulating && (
          <div className="simulate-prompt">
            <p>Click <strong>SIMULATE</strong> to run 10,000 Monte Carlo scenarios and see probability distributions.</p>
          </div>
        )}
      </section>
    </aside>
  );
}

