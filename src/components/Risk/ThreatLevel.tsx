// src/components/risk/ThreatLevel.tsx
// STRATFIT — DEFCON-Style Threat Level Indicator

import React from 'react';
import type { RiskLevel } from '../../state/riskStore';

interface ThreatLevelProps {
  score: number;
  level: RiskLevel;
}

const LEVELS: { level: RiskLevel; threshold: number; color: string; label: string }[] = [
  { level: 'CRITICAL', threshold: 80, color: '#dc2626', label: 'CRITICAL' },
  { level: 'HIGH', threshold: 60, color: '#ef4444', label: 'HIGH' },
  { level: 'ELEVATED', threshold: 45, color: '#f97316', label: 'ELEVATED' },
  { level: 'MODERATE', threshold: 30, color: '#fbbf24', label: 'MODERATE' },
  { level: 'LOW', threshold: 15, color: '#10b981', label: 'LOW' },
  { level: 'MINIMAL', threshold: 0, color: '#22d3ee', label: 'MINIMAL' },
];

export default function ThreatLevel({ score, level }: ThreatLevelProps) {
  const currentLevelIndex = LEVELS.findIndex(l => l.level === level);
  
  return (
    <div className="threat-level-panel">
      <div className="panel-header">
        <span className="panel-icon">⚠</span>
        <span className="panel-title">THREAT LEVEL</span>
      </div>
      
      {/* Vertical level indicator */}
      <div className="level-stack">
        {LEVELS.map((lvl, index) => {
          const isActive = index >= currentLevelIndex;
          const isCurrent = lvl.level === level;
          
          return (
            <div
              key={lvl.level}
              className={`level-bar ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
              style={{
                '--level-color': lvl.color,
              } as React.CSSProperties}
            >
              <div className="bar-fill" style={{ background: isActive ? lvl.color : 'transparent' }} />
              <span className="bar-label">{lvl.label}</span>
              {isCurrent && (
                <div className="current-indicator">
                  <span className="indicator-arrow">◀</span>
                  <span className="indicator-score">{score}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Score gauge */}
      <div className="score-gauge">
        <div className="gauge-track">
          <div
            className="gauge-fill"
            style={{
              width: `${score}%`,
              background: `linear-gradient(90deg, #22d3ee 0%, #10b981 25%, #fbbf24 50%, #f97316 75%, #ef4444 100%)`,
            }}
          />
          <div
            className="gauge-marker"
            style={{ left: `${score}%` }}
          />
        </div>
        <div className="gauge-labels">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>
      
      {/* Interpretation */}
      <div className="level-interpretation">
        {level === 'MINIMAL' && 'Risks are well-managed. Maintain vigilance.'}
        {level === 'LOW' && 'Minor concerns. Continue monitoring.'}
        {level === 'MODERATE' && 'Several risk factors require attention.'}
        {level === 'ELEVATED' && 'Take proactive measures to reduce exposure.'}
        {level === 'HIGH' && 'Immediate action required on multiple fronts.'}
        {level === 'CRITICAL' && 'Company survival at risk. Emergency measures needed.'}
      </div>
    </div>
  );
}
