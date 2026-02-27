// src/components/Decision/EmptyDecisionState.tsx
// STRATFIT — Empty State for Decision Tab

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmptyDecisionState() {
  const navigate = useNavigate();
  return (
    <div className="empty-decision-state">
      <div className="empty-visual">
        <div className="target-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            {/* Outer ring */}
            <circle
              cx="40"
              cy="40"
              r="35"
              stroke="rgba(34, 211, 238, 0.2)"
              strokeWidth="2"
              fill="none"
            />
            {/* Middle ring */}
            <circle
              cx="40"
              cy="40"
              r="25"
              stroke="rgba(34, 211, 238, 0.3)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4,4"
            />
            {/* Inner ring */}
            <circle
              cx="40"
              cy="40"
              r="15"
              stroke="rgba(34, 211, 238, 0.5)"
              strokeWidth="2"
              fill="rgba(34, 211, 238, 0.1)"
            />
            {/* Center dot */}
            <circle
              cx="40"
              cy="40"
              r="5"
              fill="#22d3ee"
            />
            {/* Crosshairs */}
            <line x1="40" y1="0" x2="40" y2="15" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
            <line x1="40" y1="65" x2="40" y2="80" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
            <line x1="0" y1="40" x2="15" y2="40" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
            <line x1="65" y1="40" x2="80" y2="40" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
          </svg>
        </div>
        <div className="pulse-ring pulse-1" />
        <div className="pulse-ring pulse-2" />
        <div className="pulse-ring pulse-3" />
      </div>
      
      <h3 className="empty-title">Decision Intelligence Awaits</h3>
      
      <p className="empty-description">
        Run a simulation to unlock AI-powered strategic recommendations.
        The Decision tab analyzes your scenario to identify key actions,
        prioritize opportunities, and guide your strategy.
      </p>
      
      <div className="empty-features">
        <div className="feature">
          <span className="feature-icon">🎯</span>
          <span className="feature-text">Priority matrix</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📋</span>
          <span className="feature-text">Action recommendations</span>
        </div>
        <div className="feature">
          <span className="feature-icon">⚖️</span>
          <span className="feature-text">Trade-off analysis</span>
        </div>
        <div className="feature">
          <span className="feature-icon">✓</span>
          <span className="feature-text">Progress tracking</span>
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

