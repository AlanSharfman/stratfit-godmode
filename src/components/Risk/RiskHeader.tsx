// src/components/risk/RiskHeader.tsx
// STRATFIT — Risk Header with Overall Level

import React from 'react';
import type { RiskLevel } from '../../state/riskStore';

interface RiskHeaderProps {
  overallScore?: number;
  overallLevel?: RiskLevel;
  viewMode?: 'radar' | 'timeline' | 'breakdown';
  onViewModeChange?: (mode: 'radar' | 'timeline' | 'breakdown') => void;
}

const LEVEL_COLORS: Record<RiskLevel, string> = {
  MINIMAL: '#22d3ee',
  LOW: '#10b981',
  MODERATE: '#fbbf24',
  ELEVATED: '#f97316',
  HIGH: '#ef4444',
  CRITICAL: '#dc2626',
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  MINIMAL: 'All Clear',
  LOW: 'Low Risk',
  MODERATE: 'Monitor Closely',
  ELEVATED: 'Take Action',
  HIGH: 'High Alert',
  CRITICAL: 'Critical Danger',
};

export default function RiskHeader({
  overallScore,
  overallLevel = 'MODERATE',
  viewMode,
  onViewModeChange,
}: RiskHeaderProps) {
  const color = LEVEL_COLORS[overallLevel];
  const label = LEVEL_LABELS[overallLevel];
  
  return (
    <header className="risk-header">
      <div className="header-left">
        <h1 className="header-title">
          <span className="title-icon">⚡</span>
          RISK INTELLIGENCE
        </h1>
        <p className="header-subtitle">
          Real-time threat analysis and mitigation pathways
        </p>
      </div>
      
      {overallScore !== undefined && (
        <div className="header-center">
          <div className="threat-status" style={{ borderColor: color }}>
            <div className="status-indicator" style={{ background: color }} />
            <div className="status-info">
              <span className="status-level" style={{ color }}>
                {overallLevel}
              </span>
              <span className="status-label">{label}</span>
            </div>
            <div className="status-score" style={{ color }}>
              {overallScore}
              <span className="score-suffix">/100</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="header-right">
        <div className="last-updated">
          <span className="update-dot" />
          <span>Live Analysis</span>
        </div>
      </div>
    </header>
  );
}
