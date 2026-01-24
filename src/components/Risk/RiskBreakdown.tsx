// src/components/risk/RiskBreakdown.tsx
// STRATFIT — Detailed Risk Factor Breakdown

import React, { useState } from 'react';
import type { RiskFactor } from '../../state/riskStore';

interface RiskBreakdownProps {
  factors: RiskFactor[];
}

const LEVEL_COLORS: Record<string, string> = {
  MINIMAL: '#22d3ee',
  LOW: '#10b981',
  MODERATE: '#fbbf24',
  ELEVATED: '#f97316',
  HIGH: '#ef4444',
  CRITICAL: '#dc2626',
};

const CATEGORY_ICONS: Record<string, string> = {
  runway: '💰',
  market: '📊',
  execution: '⚙️',
  competition: '🏆',
  funding: '🏦',
  churn: '📉',
};

export default function RiskBreakdown({ factors }: RiskBreakdownProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'category'>('score');
  
  // Sort factors
  const sortedFactors = [...factors].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    return a.category.localeCompare(b.category);
  });
  
  // Filter if category selected
  const displayedFactors = selectedCategory
    ? sortedFactors.filter(f => f.category === selectedCategory)
    : sortedFactors;
  
  return (
    <div className="risk-breakdown">
      <div className="breakdown-header">
        <div className="header-left">
          <span className="breakdown-icon">▤</span>
          <span className="breakdown-title">RISK BREAKDOWN</span>
        </div>
        
        <div className="header-controls">
          {/* Category filter */}
          <div className="category-filters">
            <button
              className={`filter-btn ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {factors.map(f => (
              <button
                key={f.category}
                className={`filter-btn ${selectedCategory === f.category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(
                  selectedCategory === f.category ? null : f.category
                )}
                style={{
                  '--btn-color': LEVEL_COLORS[f.level],
                } as React.CSSProperties}
              >
                {CATEGORY_ICONS[f.category]}
              </button>
            ))}
          </div>
          
          {/* Sort toggle */}
          <div className="sort-toggle">
            <button
              className={sortBy === 'score' ? 'active' : ''}
              onClick={() => setSortBy('score')}
            >
              By Risk
            </button>
            <button
              className={sortBy === 'category' ? 'active' : ''}
              onClick={() => setSortBy('category')}
            >
              By Type
            </button>
          </div>
        </div>
      </div>
      
      <div className="breakdown-grid">
        {displayedFactors.map((factor) => {
          const color = LEVEL_COLORS[factor.level];
          const icon = CATEGORY_ICONS[factor.category];
          
          return (
            <div
              key={factor.id}
              className="risk-card"
              style={{ '--card-color': color } as React.CSSProperties}
            >
              {/* Card header */}
              <div className="card-header">
                <span className="card-icon">{icon}</span>
                <span className="card-title">{factor.label}</span>
                <span className="card-score" style={{ color }}>
                  {factor.score}
                </span>
              </div>
              
              {/* Score bar */}
              <div className="card-bar">
                <div
                  className="card-bar-fill"
                  style={{
                    width: `${factor.score}%`,
                    background: `linear-gradient(90deg, ${color}40, ${color})`,
                  }}
                />
                <div className="bar-markers">
                  <span className="marker" style={{ left: '30%' }} />
                  <span className="marker" style={{ left: '50%' }} />
                  <span className="marker" style={{ left: '70%' }} />
                </div>
              </div>
              
              {/* Level & trend */}
              <div className="card-meta">
                <span className="level-pill" style={{ borderColor: color, color }}>
                  {factor.level}
                </span>
                <span className={`trend-indicator ${factor.trend}`}>
                  {factor.trend === 'improving' && '↗ Improving'}
                  {factor.trend === 'stable' && '→ Stable'}
                  {factor.trend === 'worsening' && '↘ Worsening'}
                </span>
              </div>
              
              {/* Description */}
              <p className="card-description">{factor.description}</p>
              
              {/* Tags */}
              <div className="card-tags">
                <span className={`tag impact-${factor.impact}`}>
                  {factor.impact === 'survival' && '💀 Survival Impact'}
                  {factor.impact === 'growth' && '📈 Growth Impact'}
                  {factor.impact === 'both' && '⚠️ Full Impact'}
                </span>
                {factor.controllable && (
                  <span className="tag controllable">✓ You Can Control This</span>
                )}
                {!factor.controllable && (
                  <span className="tag uncontrollable">⊘ External Factor</span>
                )}
              </div>
              
              {/* Mitigations */}
              <div className="card-mitigations">
                <span className="mitigations-header">Quick Actions:</span>
                <ul>
                  {factor.mitigations.slice(0, 2).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
