// src/components/risk/TopThreats.tsx
// STRATFIT — Top 3 Threat Cards

import React, { useState } from 'react';
import type { RiskFactor } from '../../state/riskStore';

interface TopThreatsProps {
  threats: RiskFactor[];
}

const LEVEL_COLORS: Record<string, string> = {
  MINIMAL: '#22d3ee',
  LOW: '#10b981',
  MODERATE: '#fbbf24',
  ELEVATED: '#f97316',
  HIGH: '#ef4444',
  CRITICAL: '#dc2626',
};

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  improving: { icon: '↗', color: '#10b981' },
  stable: { icon: '→', color: '#fbbf24' },
  worsening: { icon: '↘', color: '#ef4444' },
};

export default function TopThreats({ threats }: TopThreatsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  return (
    <div className="top-threats-panel">
      <div className="panel-header">
        <span className="panel-icon">🎯</span>
        <span className="panel-title">TOP THREATS</span>
      </div>
      
      <div className="threats-list">
        {threats.map((threat, index) => {
          const color = LEVEL_COLORS[threat.level];
          const trend = TREND_ICONS[threat.trend];
          const isExpanded = expandedId === threat.id;
          
          return (
            <div
              key={threat.id}
              className={`threat-card ${isExpanded ? 'expanded' : ''}`}
              style={{ '--threat-color': color } as React.CSSProperties}
              onClick={() => setExpandedId(isExpanded ? null : threat.id)}
            >
              {/* Rank badge */}
              <div className="threat-rank">#{index + 1}</div>
              
              {/* Main content */}
              <div className="threat-content">
                <div className="threat-header">
                  <span className="threat-label">{threat.label}</span>
                  <div className="threat-meta">
                    <span className="threat-score" style={{ color }}>
                      {threat.score}
                    </span>
                    <span className="threat-trend" style={{ color: trend.color }}>
                      {trend.icon}
                    </span>
                  </div>
                </div>
                
                {/* Score bar */}
                <div className="threat-bar">
                  <div
                    className="threat-bar-fill"
                    style={{
                      width: `${threat.score}%`,
                      background: `linear-gradient(90deg, ${color}80, ${color})`,
                    }}
                  />
                </div>
                
                {/* Level badge */}
                <div className="threat-badges">
                  <span className="level-badge" style={{ borderColor: color, color }}>
                    {threat.level}
                  </span>
                  <span className={`impact-badge ${threat.impact}`}>
                    {threat.impact === 'survival' && '💀 Survival'}
                    {threat.impact === 'growth' && '📈 Growth'}
                    {threat.impact === 'both' && '⚠️ Both'}
                  </span>
                  {threat.controllable && (
                    <span className="controllable-badge">✓ Controllable</span>
                  )}
                </div>
                
                {/* Expanded content */}
                {isExpanded && (
                  <div className="threat-details">
                    <p className="threat-description">{threat.description}</p>
                    
                    <div className="mitigations">
                      <span className="mitigations-label">MITIGATION ACTIONS:</span>
                      <ul>
                        {threat.mitigations.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Expand indicator */}
              <div className="expand-indicator">
                {isExpanded ? '−' : '+'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
