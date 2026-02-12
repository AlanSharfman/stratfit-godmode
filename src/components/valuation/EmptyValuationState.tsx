// src/components/valuation/EmptyValuationState.tsx
// STRATFIT — Empty State for Valuation Tab

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmptyValuationState() {
  const navigate = useNavigate();
  return (
    <div className="empty-valuation-state">
      <div className="empty-visual">
        <div className="diamond-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            {/* Diamond shape */}
            <path
              d="M40 5 L70 30 L40 75 L10 30 Z"
              stroke="rgba(34, 211, 238, 0.3)"
              strokeWidth="2"
              fill="rgba(34, 211, 238, 0.05)"
            />
            {/* Inner facets */}
            <path
              d="M40 5 L40 75 M10 30 L70 30"
              stroke="rgba(34, 211, 238, 0.2)"
              strokeWidth="1"
            />
            <path
              d="M25 30 L40 5 L55 30 M25 30 L40 75 L55 30"
              stroke="rgba(34, 211, 238, 0.15)"
              strokeWidth="1"
            />
            {/* Shine effect */}
            <path
              d="M25 25 L35 15"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="pulse-ring pulse-1" />
        <div className="pulse-ring pulse-2" />
      </div>
      
      <h3 className="empty-title">Valuation Intelligence Awaits</h3>
      
      <p className="empty-description">
        Run a simulation to unlock enterprise value modeling.
        The Valuation tab analyzes your metrics, market position,
        and growth trajectory to estimate your company's worth.
      </p>
      
      <div className="empty-features">
        <div className="feature">
          <span className="feature-icon">💎</span>
          <span className="feature-text">Enterprise value estimate</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📊</span>
          <span className="feature-text">ARR multiple analysis</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📈</span>
          <span className="feature-text">24-month projections</span>
        </div>
        <div className="feature">
          <span className="feature-icon">🤝</span>
          <span className="feature-text">Peer comparisons</span>
        </div>
      </div>
      
      <button 
        className="empty-action"
        onClick={() => navigate('/simulate')}
      >
        Go to Simulate →
      </button>
    </div>
  );
}
