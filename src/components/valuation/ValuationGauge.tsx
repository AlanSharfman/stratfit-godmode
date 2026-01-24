// src/components/valuation/ValuationGauge.tsx
// STRATFIT — Enterprise Value Gauge Visualization

import React from 'react';

interface ValuationGaugeProps {
  valuation: number;
  range: { low: number; mid: number; high: number };
  score: number;
  arrMultiple: number;
}

const formatValuation = (value: number): string => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function ValuationGauge({ valuation, range, score, arrMultiple }: ValuationGaugeProps) {
  // Calculate needle position (0-180 degrees)
  const valueInRange = Math.max(range.low, Math.min(range.high, valuation));
  const normalizedPosition = (valueInRange - range.low) / (range.high - range.low);
  const needleAngle = -90 + (normalizedPosition * 180);
  
  // Score to color
  const getScoreColor = (s: number) => {
    if (s >= 75) return '#10b981';
    if (s >= 50) return '#22d3ee';
    if (s >= 25) return '#fbbf24';
    return '#f87171';
  };
  
  return (
    <div className="valuation-gauge">
      <div className="gauge-header">
        <span className="gauge-icon">💎</span>
        <span className="gauge-title">ENTERPRISE VALUE</span>
      </div>
      
      {/* Main Gauge */}
      <div className="gauge-container">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          
          {/* Value arc gradient */}
          <defs>
            <linearGradient id="valueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="33%" stopColor="#fbbf24" />
              <stop offset="66%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          
          {/* Filled arc based on score */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#valueGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 251.2} 251.2`}
            className="gauge-value-arc"
          />
          
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (-90 + (tick / 100) * 180) * (Math.PI / 180);
            const x1 = 100 + 65 * Math.cos(angle);
            const y1 = 100 + 65 * Math.sin(angle);
            const x2 = 100 + 75 * Math.cos(angle);
            const y2 = 100 + 75 * Math.sin(angle);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
              />
            );
          })}
          
          {/* Needle */}
          <g transform={`rotate(${needleAngle}, 100, 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="8" fill="#22d3ee" />
            <circle cx="100" cy="100" r="4" fill="#030508" />
          </g>
          
          {/* Center value */}
          <text x="100" y="85" textAnchor="middle" className="gauge-value-text">
            {formatValuation(valuation)}
          </text>
        </svg>
        
        {/* Range labels */}
        <div className="gauge-labels">
          <span className="label-low">{formatValuation(range.low)}</span>
          <span className="label-high">{formatValuation(range.high)}</span>
        </div>
      </div>
      
      {/* Score indicator */}
      <div className="gauge-score">
        <div className="score-bar">
          <div 
            className="score-fill"
            style={{ 
              width: `${score}%`,
              background: getScoreColor(score),
            }}
          />
        </div>
        <div className="score-info">
          <span className="score-label">Valuation Score</span>
          <span className="score-value" style={{ color: getScoreColor(score) }}>
            {score}/100
          </span>
        </div>
      </div>
      
      {/* Multiple indicator */}
      <div className="gauge-multiple">
        <div className="multiple-display">
          <span className="multiple-value">{arrMultiple.toFixed(1)}x</span>
          <span className="multiple-label">ARR Multiple</span>
        </div>
        <div className="multiple-context">
          <span className="context-item">
            <span className="dot healthy" />
            15-25x High Growth
          </span>
          <span className="context-item">
            <span className="dot moderate" />
            10-15x Moderate
          </span>
          <span className="context-item">
            <span className="dot low" />
            5-10x Mature
          </span>
        </div>
      </div>
    </div>
  );
}
