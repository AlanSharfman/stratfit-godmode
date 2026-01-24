// src/components/compare/CompareHeatmap.tsx
// STRATFIT — Heatmap showing WHY scenarios diverge

import React from 'react';
import type { ScenarioDelta } from '../../state/scenarioStore';

interface CompareHeatmapProps {
  delta: ScenarioDelta;
}

export default function CompareHeatmap({ delta }: CompareHeatmapProps) {
  const leverDeltas = delta.leverDeltas;
  
  // Only show levers that actually changed
  const changedLevers = leverDeltas.filter(l => l.delta !== 0);
  
  // Sort by absolute impact
  const sortedLevers = [...changedLevers].sort(
    (a, b) => Math.abs(b.impactOnDivergence) - Math.abs(a.impactOnDivergence)
  );
  
  // Find max impact for scaling
  const maxImpact = Math.max(...sortedLevers.map(l => Math.abs(l.impactOnDivergence)), 0.01);
  
  // Calculate total impact for percentage
  const totalImpact = sortedLevers.reduce((sum, l) => sum + Math.abs(l.impactOnDivergence), 0);
  
  const getBarWidth = (impact: number) => {
    return `${(Math.abs(impact) / maxImpact) * 100}%`;
  };
  
  const formatDelta = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(0)}%`;
  };
  
  const getImpactPercent = (impact: number) => {
    return totalImpact > 0 ? Math.round((Math.abs(impact) / totalImpact) * 100) : 0;
  };
  
  return (
    <div className="compare-heatmap">
      <div className="heatmap-header">
        <span className="heatmap-icon">◈</span>
        <span className="heatmap-title">WHY SCENARIOS DIVERGE</span>
        <span className="heatmap-subtitle">Lever Impact Analysis</span>
      </div>
      
      {changedLevers.length === 0 ? (
        <div className="heatmap-empty">
          <p>Scenarios use identical lever settings. No divergence in inputs.</p>
        </div>
      ) : (
        <div className="heatmap-content">
          {/* Header row */}
          <div className="heatmap-row header">
            <span className="col-rank">#</span>
            <span className="col-lever">LEVER</span>
            <span className="col-values">SCENARIO A → B</span>
            <span className="col-impact">IMPACT ON DIVERGENCE</span>
          </div>
          
          {/* Lever rows */}
          {sortedLevers.map((lever, index) => {
            const impactPercent = getImpactPercent(lever.impactOnDivergence);
            const isTopDriver = index === 0;
            
            return (
              <div
                key={lever.lever}
                className={`heatmap-row data ${isTopDriver ? 'top-driver' : ''}`}
              >
                <span className="col-rank">#{index + 1}</span>
                <span className="col-lever">{lever.label}</span>
                <span className="col-values">
                  <span className="value-a">{lever.valueA}%</span>
                  <span className="arrow">→</span>
                  <span className="value-b">{lever.valueB}%</span>
                  <span className={`delta ${lever.delta > 0 ? 'positive' : 'negative'}`}>
                    ({formatDelta(lever.delta)})
                  </span>
                </span>
                <div className="col-impact">
                  <div className="impact-bar-container">
                    <div
                      className={`impact-bar ${lever.delta > 0 ? 'positive' : 'negative'}`}
                      style={{ width: getBarWidth(lever.impactOnDivergence) }}
                    />
                  </div>
                  <span className="impact-percent">{impactPercent}%</span>
                  {isTopDriver && (
                    <span className="top-driver-badge">TOP DRIVER</span>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Summary */}
          <div className="heatmap-summary">
            <div className="summary-icon">💡</div>
            <div className="summary-text">
              <strong>{sortedLevers[0]?.label || 'Unknown'}</strong> is the primary driver
              of divergence between scenarios, accounting for approximately
              <strong> {getImpactPercent(sortedLevers[0]?.impactOnDivergence || 0)}%</strong> of
              the difference in outcomes.
              {sortedLevers[0]?.delta > 0
                ? ` Increasing this lever by ${sortedLevers[0].delta}% drives the strategic shift.`
                : sortedLevers[0]?.delta < 0
                ? ` Decreasing this lever by ${Math.abs(sortedLevers[0].delta)}% drives the strategic shift.`
                : ''
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
