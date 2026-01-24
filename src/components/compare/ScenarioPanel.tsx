// src/components/compare/ScenarioPanel.tsx
// STRATFIT — Scenario Summary Panel for Compare View

import React from 'react';
import type { Scenario } from '../../state/scenarioStore';

interface ScenarioPanelProps {
  scenario: Scenario;
  label: string;
  sublabel: string;
  isBaseline: boolean;
  color: 'cyan' | 'amber';
  compact?: boolean;
}

export default function ScenarioPanel({
  scenario,
  label,
  sublabel,
  isBaseline,
  color,
  compact = false,
}: ScenarioPanelProps) {
  const sim = scenario.simulation;
  
  if (!sim) {
    return (
      <div className={`scenario-panel ${color} ${compact ? 'compact' : ''}`}>
        <div className="panel-empty">No simulation data</div>
      </div>
    );
  }
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };
  
  const getRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      EXCEPTIONAL: '#22d3ee',
      STRONG: '#34d399',
      STABLE: '#fbbf24',
      CAUTION: '#fb923c',
      CRITICAL: '#f87171',
    };
    return colors[rating] || '#94a3b8';
  };
  
  return (
    <div className={`scenario-panel ${color} ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="panel-header">
        <div className="panel-labels">
          <span className="panel-label">{label}</span>
          <span className="panel-sublabel">{sublabel}</span>
        </div>
        {isBaseline && (
          <span className="baseline-badge">BASELINE</span>
        )}
      </div>
      
      {/* Name */}
      <div className="panel-name">{scenario.name}</div>
      
      {/* Score */}
      <div className="panel-score">
        <div 
          className="score-circle"
          style={{ borderColor: getRatingColor(sim.overallRating) }}
        >
          <span className="score-value">{sim.overallScore}</span>
        </div>
        <div className="score-info">
          <span 
            className="score-rating"
            style={{ color: getRatingColor(sim.overallRating) }}
          >
            {sim.overallRating}
          </span>
          <span className="score-label">Overall Score</span>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="panel-metrics">
        {/* Survival */}
        <div className="metric-row">
          <span className="metric-label">SURVIVAL RATE</span>
          <span className="metric-value">
            {Math.round(sim.survivalRate * 100)}%
          </span>
          <div className="metric-bar">
            <div 
              className="metric-fill"
              style={{ width: `${sim.survivalRate * 100}%` }}
            />
          </div>
        </div>
        
        {/* ARR */}
        <div className="metric-row">
          <span className="metric-label">MEDIAN ARR</span>
          <span className="metric-value">{formatCurrency(sim.medianARR)}</span>
          <span className="metric-range">
            {formatCurrency(sim.arrP10)} – {formatCurrency(sim.arrP90)}
          </span>
        </div>
        
        {/* Runway */}
        <div className="metric-row">
          <span className="metric-label">RUNWAY</span>
          <span className="metric-value">{sim.medianRunway.toFixed(0)} mo</span>
          <div className="metric-bar">
            <div 
              className="metric-fill"
              style={{ width: `${Math.min(sim.medianRunway / 48, 1) * 100}%` }}
            />
          </div>
        </div>
        
        {!compact && (
          <>
            {/* Cash */}
            <div className="metric-row">
              <span className="metric-label">CASH POSITION</span>
              <span className="metric-value">{formatCurrency(sim.medianCash)}</span>
              <span className="metric-range">
                {formatCurrency(sim.cashP10)} – {formatCurrency(sim.cashP90)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
