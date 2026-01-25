// src/components/tabs/DecisionTab.tsx
// STRATFIT — Comprehensive Decision Tab
// AI-powered verdict, path recommendations, and actionable insights

import React, { useState, useMemo } from 'react';
import './DecisionTab.css';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SimulationResults {
  survivalProbability: number;
  runwayMonths: number;
  revenueProjection: number;
  burnRate: number;
  topRisks: string[];
  valuationRange: { low: number; high: number; mid: number };
}

export interface PathAnalysis {
  id: 'growth' | 'stability' | 'survival';
  name: string;
  icon: string;
  score: number; // 0-100 compatibility score
  survivalProb: number;
  runwayImpact: string;
  verdict: 'recommended' | 'viable' | 'risky' | 'critical';
  keyActions: string[];
  tradeoffs: { pro: string; con: string }[];
}

export interface DecisionTabProps {
  results: SimulationResults;
  companyName?: string;
  onPathSelect?: (pathId: string) => void;
  onExport?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getAIVerdict(survivalProb: number, runwayMonths: number): {
  status: 'strong' | 'moderate' | 'warning' | 'critical';
  headline: string;
  summary: string;
  confidence: number;
} {
  if (survivalProb >= 75 && runwayMonths >= 12) {
    return {
      status: 'strong',
      headline: 'Strong Position — Growth Viable',
      summary: 'Your fundamentals support aggressive expansion. Consider accelerating growth while conditions are favorable.',
      confidence: 92,
    };
  } else if (survivalProb >= 50 && runwayMonths >= 6) {
    return {
      status: 'moderate',
      headline: 'Stable Position — Balanced Approach',
      summary: 'Your metrics support sustainable growth. Balance expansion with runway preservation.',
      confidence: 85,
    };
  } else if (survivalProb >= 30 && runwayMonths >= 3) {
    return {
      status: 'warning',
      headline: 'Caution Required — Optimize Operations',
      summary: 'Runway constraints suggest focusing on efficiency. Prioritize extending runway before major bets.',
      confidence: 78,
    };
  } else {
    return {
      status: 'critical',
      headline: 'Critical — Survival Mode Recommended',
      summary: 'Immediate action required to preserve runway. Focus on cost reduction and bridge financing.',
      confidence: 88,
    };
  }
}

function analyzePathCompatibility(
  results: SimulationResults
): PathAnalysis[] {
  const { survivalProbability, runwayMonths } = results;

  const growthScore = Math.min(100, survivalProbability * 1.2 - (12 - runwayMonths) * 3);
  const stabilityScore = Math.min(100, survivalProbability * 1.1);
  const survivalScore = Math.min(100, 100 - survivalProbability * 0.3 + (12 - runwayMonths) * 5);

  const paths: PathAnalysis[] = [
    {
      id: 'growth',
      name: 'GROWTH',
      icon: '🚀',
      score: Math.max(0, Math.round(growthScore)),
      survivalProb: Math.min(100, survivalProbability * 0.9),
      runwayImpact: '-3 to -5 months',
      verdict: growthScore >= 70 ? 'recommended' : growthScore >= 50 ? 'viable' : growthScore >= 30 ? 'risky' : 'critical',
      keyActions: [
        'Increase marketing spend 40-60%',
        'Accelerate hiring in revenue teams',
        'Pursue Series A within 6 months',
        'Focus on market share over margins',
      ],
      tradeoffs: [
        { pro: 'Faster market capture', con: 'Higher burn rate' },
        { pro: 'Stronger fundraising position', con: 'Execution risk increases' },
      ],
    },
    {
      id: 'stability',
      name: 'STABILITY',
      icon: '⚖️',
      score: Math.max(0, Math.round(stabilityScore)),
      survivalProb: survivalProbability,
      runwayImpact: '+0 to +2 months',
      verdict: stabilityScore >= 70 ? 'recommended' : stabilityScore >= 50 ? 'viable' : stabilityScore >= 30 ? 'risky' : 'critical',
      keyActions: [
        'Maintain current growth trajectory',
        'Selective hiring for critical roles',
        'Optimize unit economics',
        'Build 12-month runway buffer',
      ],
      tradeoffs: [
        { pro: 'Sustainable growth', con: 'Slower market capture' },
        { pro: 'Better unit economics', con: 'May miss timing windows' },
      ],
    },
    {
      id: 'survival',
      name: 'SURVIVAL',
      icon: '🛡️',
      score: Math.max(0, Math.round(survivalScore)),
      survivalProb: Math.min(100, survivalProbability * 1.2),
      runwayImpact: '+4 to +8 months',
      verdict: survivalScore >= 70 ? 'recommended' : survivalScore >= 50 ? 'viable' : survivalScore >= 30 ? 'risky' : 'critical',
      keyActions: [
        'Reduce operational costs 20-30%',
        'Pause non-essential hiring',
        'Focus on path to profitability',
        'Explore bridge financing options',
      ],
      tradeoffs: [
        { pro: 'Extended runway', con: 'Growth momentum loss' },
        { pro: 'Lower risk profile', con: 'May signal weakness to investors' },
      ],
    },
  ];

  // Sort by score
  return paths.sort((a, b) => b.score - a.score);
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DecisionTab({
  results,
  companyName = 'Your Company',
  onPathSelect,
  onExport,
}: DecisionTabProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const verdict = useMemo(() => 
    getAIVerdict(results.survivalProbability, results.runwayMonths),
    [results.survivalProbability, results.runwayMonths]
  );

  const pathAnalyses = useMemo(() => 
    analyzePathCompatibility(results),
    [results]
  );

  const recommendedPath = pathAnalyses[0];

  const handlePathSelect = (pathId: string) => {
    setSelectedPath(pathId);
    onPathSelect?.(pathId);
  };

  const getVerdictColor = (status: string) => {
    switch (status) {
      case 'strong': return 'var(--decision-emerald)';
      case 'moderate': return 'var(--decision-gold)';
      case 'warning': return 'var(--decision-orange)';
      case 'critical': return 'var(--decision-red)';
      default: return 'var(--decision-cyan)';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'var(--decision-emerald)';
    if (score >= 50) return 'var(--decision-gold)';
    if (score >= 30) return 'var(--decision-orange)';
    return 'var(--decision-red)';
  };

  return (
    <div className="decision-tab">
      {/* Background Effects */}
      <div className="decision-bg">
        <div className="bg-gradient" />
        <div className="bg-grid" />
        <div className="bg-glow" />
      </div>

      {/* Content */}
      <div className="decision-content">
        {/* Header */}
        <div className="decision-header">
          <div className="header-badge">
            <span className="badge-icon">🧠</span>
            <span className="badge-text">AI DECISION ENGINE</span>
          </div>
          <h2 className="decision-title">Strategic Recommendation</h2>
          <p className="decision-subtitle">
            Based on 10,000 Monte Carlo simulations of {companyName}'s trajectory
          </p>
        </div>

        {/* AI Verdict Card */}
        <div 
          className={`verdict-card verdict-${verdict.status}`}
          style={{ '--verdict-color': getVerdictColor(verdict.status) } as React.CSSProperties}
        >
          <div className="verdict-glow" />
          
          <div className="verdict-header">
            <div className="verdict-status">
              <span className="status-indicator" />
              <span className="status-label">{verdict.status.toUpperCase()}</span>
            </div>
            <div className="verdict-confidence">
              <span className="confidence-label">AI Confidence</span>
              <span className="confidence-value">{verdict.confidence}%</span>
            </div>
          </div>

          <h3 className="verdict-headline">{verdict.headline}</h3>
          <p className="verdict-summary">{verdict.summary}</p>

          {/* Quick Stats */}
          <div className="verdict-stats">
            <div className="stat-item">
              <span className="stat-icon">📊</span>
              <span className="stat-label">Survival Probability</span>
              <span className="stat-value" style={{ color: getScoreColor(results.survivalProbability) }}>
                {results.survivalProbability}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">Projected Runway</span>
              <span className="stat-value">{results.runwayMonths} months</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-label">Valuation Range</span>
              <span className="stat-value">
                {formatCurrency(results.valuationRange.low)} - {formatCurrency(results.valuationRange.high)}
              </span>
            </div>
          </div>
        </div>

        {/* Path Comparison Section */}
        <div className="paths-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="title-icon">🔀</span>
              Path Analysis
            </h3>
            <p className="section-subtitle">
              Compare strategic options based on your current position
            </p>
          </div>

          <div className="paths-grid">
            {pathAnalyses.map((path, index) => (
              <div
                key={path.id}
                className={`path-card ${selectedPath === path.id ? 'selected' : ''} ${index === 0 ? 'recommended' : ''}`}
                onClick={() => handlePathSelect(path.id)}
                style={{ '--path-color': getScoreColor(path.score) } as React.CSSProperties}
              >
                {index === 0 && (
                  <div className="recommended-badge">
                    <span>★ RECOMMENDED</span>
                  </div>
                )}

                <div className="path-header">
                  <span className="path-icon">{path.icon}</span>
                  <h4 className="path-name">{path.name}</h4>
                </div>

                {/* Compatibility Score */}
                <div className="path-score">
                  <div className="score-circle">
                    <svg viewBox="0 0 100 100">
                      <circle
                        className="score-bg"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeWidth="8"
                      />
                      <circle
                        className="score-fill"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeWidth="8"
                        strokeDasharray={`${path.score * 2.83} 283`}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <span className="score-value">{path.score}</span>
                  </div>
                  <span className="score-label">Compatibility</span>
                </div>

                {/* Path Metrics */}
                <div className="path-metrics">
                  <div className="metric">
                    <span className="metric-label">Survival Prob</span>
                    <span className="metric-value">{path.survivalProb.toFixed(0)}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Runway Impact</span>
                    <span className="metric-value">{path.runwayImpact}</span>
                  </div>
                </div>

                {/* Verdict Badge */}
                <div className={`path-verdict verdict-${path.verdict}`}>
                  {path.verdict.toUpperCase()}
                </div>

                {/* Expand Button */}
                <button
                  className="expand-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(showDetails === path.id ? null : path.id);
                  }}
                >
                  {showDetails === path.id ? 'Hide Details' : 'View Details'}
                  <span className={`arrow ${showDetails === path.id ? 'up' : 'down'}`}>
                    {showDetails === path.id ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded Details */}
                {showDetails === path.id && (
                  <div className="path-details">
                    <div className="details-section">
                      <h5 className="details-title">Key Actions</h5>
                      <ul className="actions-list">
                        {path.keyActions.map((action, i) => (
                          <li key={i} className="action-item">
                            <span className="action-bullet">→</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="details-section">
                      <h5 className="details-title">Tradeoffs</h5>
                      <div className="tradeoffs-list">
                        {path.tradeoffs.map((tradeoff, i) => (
                          <div key={i} className="tradeoff-item">
                            <div className="tradeoff-pro">
                              <span className="tradeoff-icon">✓</span>
                              {tradeoff.pro}
                            </div>
                            <div className="tradeoff-con">
                              <span className="tradeoff-icon">✗</span>
                              {tradeoff.con}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Items Section */}
        <div className="actions-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="title-icon">✅</span>
              Immediate Action Items
            </h3>
          </div>

          <div className="action-cards">
            <ActionCard
              priority="high"
              title="Extend Runway"
              description="Review and optimize operational costs to extend runway by 2-4 months"
              timeframe="This Week"
              icon="⏳"
            />
            <ActionCard
              priority="medium"
              title="Revenue Focus"
              description="Double down on top 3 revenue-generating channels"
              timeframe="This Month"
              icon="💰"
            />
            <ActionCard
              priority="medium"
              title="Fundraising Prep"
              description="Update pitch deck and financial model for investor conversations"
              timeframe="Next 30 Days"
              icon="📊"
            />
            <ActionCard
              priority="low"
              title="Team Review"
              description="Assess hiring plan against runway and growth targets"
              timeframe="Next Quarter"
              icon="👥"
            />
          </div>
        </div>

        {/* Top Risks Section */}
        <div className="risks-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="title-icon">⚠️</span>
              Top Risk Factors
            </h3>
          </div>

          <div className="risks-list">
            {results.topRisks.map((risk, index) => (
              <div key={index} className="risk-item">
                <span className="risk-number">{index + 1}</span>
                <span className="risk-text">{risk}</span>
                <div className="risk-severity">
                  <div 
                    className="severity-bar"
                    style={{ width: `${90 - index * 15}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="decision-footer">
          <button className="export-button" onClick={onExport}>
            <span className="button-icon">📤</span>
            Export Full Report
          </button>
          <p className="footer-note">
            Analysis generated from 10,000 Monte Carlo simulations • Updated in real-time
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionCardProps {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timeframe: string;
  icon: string;
}

function ActionCard({ priority, title, description, timeframe, icon }: ActionCardProps) {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return 'var(--decision-red)';
      case 'medium': return 'var(--decision-gold)';
      case 'low': return 'var(--decision-emerald)';
    }
  };

  return (
    <div 
      className={`action-card priority-${priority}`}
      style={{ '--priority-color': getPriorityColor() } as React.CSSProperties}
    >
      <div className="action-icon">{icon}</div>
      <div className="action-content">
        <div className="action-header">
          <h4 className="action-title">{title}</h4>
          <span className="priority-badge">{priority.toUpperCase()}</span>
        </div>
        <p className="action-description">{description}</p>
        <span className="action-timeframe">{timeframe}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO DATA FOR STANDALONE TESTING
// ═══════════════════════════════════════════════════════════════════════════════

export const DEMO_RESULTS: SimulationResults = {
  survivalProbability: 67,
  runwayMonths: 8,
  revenueProjection: 2400000,
  burnRate: 85000,
  topRisks: [
    'Revenue growth below target (+12% vs +20% plan)',
    'Customer churn rate trending upward (4.2% → 5.1%)',
    'Cash runway below 12-month threshold',
    'Key hire delays impacting product roadmap',
  ],
  valuationRange: {
    low: 8000000,
    high: 15000000,
    mid: 11500000,
  },
};

export { ActionCard };
