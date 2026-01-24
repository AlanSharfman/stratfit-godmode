// src/components/compare/DeltaPanel.tsx
// STRATFIT — Delta/Difference Panel for Compare View

import React from 'react';
import type { ScenarioDelta } from '../../state/scenarioStore';

interface DeltaPanelProps {
  delta: ScenarioDelta | null;
}

export default function DeltaPanel({ delta }: DeltaPanelProps) {
  if (!delta) {
    return (
      <div className="delta-panel">
        <div className="delta-empty">Calculating differences...</div>
      </div>
    );
  }
  
  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    const absValue = Math.abs(value);
    if (absValue >= 1000000) return `${sign}$${(value / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `${sign}$${(value / 1000).toFixed(0)}K`;
    return `${sign}$${value.toFixed(0)}`;
  };
  
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };
  
  const formatMonths = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(0)} mo`;
  };
  
  const getInterpretation = (label: string, value: number, isGood: boolean) => {
    if (Math.abs(value) < 5) return 'Negligible difference';
    const direction = value > 0 ? 'increase' : 'decrease';
    const quality = (value > 0) === isGood ? 'improvement' : 'decline';
    return `${Math.abs(value).toFixed(0)}% ${direction} — ${quality}`;
  };
  
  return (
    <div className="delta-panel">
      {/* Divergence Header */}
      <div className="divergence-header-panel">
        <span className="divergence-label">DIVERGENCE</span>
        <span className="divergence-value">{delta.divergenceScore}%</span>
        <span className="divergence-description">{delta.divergenceLabel}</span>
      </div>
      
      {/* Delta Metrics */}
      <div className="delta-metrics">
        {/* Survival Delta */}
        <div className={`delta-row ${delta.survivalDelta >= 0 ? 'positive' : 'negative'}`}>
          <span className="delta-label">SURVIVAL RATE</span>
          <span className="delta-value">
            {formatPercent(delta.survivalDelta)}
          </span>
          <span className="delta-interpretation">
            {getInterpretation('survival', delta.survivalDelta, true)}
          </span>
        </div>
        
        {/* ARR Delta */}
        <div className={`delta-row ${delta.arrDelta >= 0 ? 'positive' : 'negative'}`}>
          <span className="delta-label">MEDIAN ARR</span>
          <span className="delta-value">
            {formatCurrency(delta.arrDelta)}
            <span className="delta-percent">({formatPercent(delta.arrDeltaPercent)})</span>
          </span>
          <span className="delta-interpretation">
            {getInterpretation('arr', delta.arrDeltaPercent, true)}
          </span>
        </div>
        
        {/* Runway Delta */}
        <div className={`delta-row ${delta.runwayDelta >= 0 ? 'positive' : 'negative'}`}>
          <span className="delta-label">RUNWAY</span>
          <span className="delta-value">
            {formatMonths(delta.runwayDelta)}
            <span className="delta-percent">({formatPercent(delta.runwayDeltaPercent)})</span>
          </span>
          <span className="delta-interpretation">
            {getInterpretation('runway', delta.runwayDeltaPercent, true)}
          </span>
        </div>
        
        {/* Score Delta */}
        <div className={`delta-row ${delta.scoreDelta >= 0 ? 'positive' : 'negative'}`}>
          <span className="delta-label">OVERALL SCORE</span>
          <span className="delta-value">
            {delta.scoreDelta >= 0 ? '+' : ''}{delta.scoreDelta.toFixed(0)} pts
          </span>
          <span className="delta-interpretation">
            {Math.abs(delta.scoreDelta) < 3 
              ? 'Marginal difference' 
              : delta.scoreDelta > 0 
                ? 'Strategic improvement'
                : 'Strategic decline'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
