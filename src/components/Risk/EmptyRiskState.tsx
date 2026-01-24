// src/components/risk/EmptyRiskState.tsx
// STRATFIT — Empty State for Risk Tab

import React from 'react';

export default function EmptyRiskState() {
  const handleNavigate = (tab: string) => {
    window.dispatchEvent(new CustomEvent('stratfit:navigate', { detail: tab }));
  };
  
  return (
    <div className="empty-risk-state">
      <div className="empty-visual">
        <div className="shield-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path
              d="M40 5L10 20V40C10 55 22 68 40 75C58 68 70 55 70 40V20L40 5Z"
              stroke="rgba(34, 211, 238, 0.3)"
              strokeWidth="2"
              fill="rgba(34, 211, 238, 0.05)"
            />
            <path
              d="M40 15L20 25V40C20 50 28 60 40 65C52 60 60 50 60 40V25L40 15Z"
              stroke="rgba(34, 211, 238, 0.5)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4,4"
            />
            <text
              x="40"
              y="45"
              textAnchor="middle"
              fill="rgba(34, 211, 238, 0.5)"
              fontSize="20"
            >
              ?
            </text>
          </svg>
        </div>
        <div className="pulse-ring pulse-1" />
        <div className="pulse-ring pulse-2" />
        <div className="pulse-ring pulse-3" />
      </div>
      
      <h3 className="empty-title">Risk Analysis Unavailable</h3>
      
      <p className="empty-description">
        Run a simulation first to generate your risk intelligence report.
        The analysis will identify threats across 6 key dimensions and provide
        actionable mitigation strategies.
      </p>
      
      <div className="empty-features">
        <div className="feature">
          <span className="feature-icon">◎</span>
          <span className="feature-text">Threat Radar visualization</span>
        </div>
        <div className="feature">
          <span className="feature-icon">◔</span>
          <span className="feature-text">36-month risk timeline</span>
        </div>
        <div className="feature">
          <span className="feature-icon">🎯</span>
          <span className="feature-text">Top 3 threat identification</span>
        </div>
        <div className="feature">
          <span className="feature-icon">✓</span>
          <span className="feature-text">Mitigation recommendations</span>
        </div>
      </div>
      
      <button className="empty-action" onClick={() => handleNavigate('simulate')}>
        Go to Simulate →
      </button>
    </div>
  );
}
