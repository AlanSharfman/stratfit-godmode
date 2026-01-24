// src/components/simulate/SensitivityBars.tsx
// STRATFIT — Sensitivity Analysis Bars

import React from 'react';
import type { SensitivityFactor } from '@/logic/monteCarloEngine';

interface SensitivityBarsProps {
  factors: SensitivityFactor[];
}

export default function SensitivityBars({ factors }: SensitivityBarsProps) {
  // Take top 9 factors (all levers)
  const displayFactors = factors.slice(0, 9);
  
  // Find max absolute impact for scaling
  const maxImpact = Math.max(...displayFactors.map(f => Math.abs(f.impact)));

  return (
    <div className="sensitivity-bars">
      {displayFactors.map((factor, index) => {
        const impactPct = Math.round(Math.abs(factor.impact) * 100);
        const barWidth = (Math.abs(factor.impact) / maxImpact) * 100;
        const isPositive = factor.direction === 'positive';
        
        return (
          <div 
            key={factor.lever} 
            className={`sensitivity-row ${factor.direction}`}
          >
            {/* Rank indicator */}
            <div className="sensitivity-rank">
              {index + 1}
            </div>

            {/* Label */}
            <div className="sensitivity-label">
              <span className="label-name">{factor.label}</span>
              <span className="label-impact">
                {isPositive ? '+' : '-'}{impactPct}%
              </span>
            </div>

            {/* Bar visualization */}
            <div className="sensitivity-bar-container">
              {/* Center line */}
              <div className="sensitivity-center-line" />
              
              {/* Negative side */}
              <div className="sensitivity-negative-zone">
                {!isPositive && (
                  <div 
                    className="sensitivity-bar negative"
                    style={{ width: `${barWidth}%` }}
                  >
                    <div className="bar-glow" />
                  </div>
                )}
              </div>
              
              {/* Positive side */}
              <div className="sensitivity-positive-zone">
                {isPositive && (
                  <div 
                    className="sensitivity-bar positive"
                    style={{ width: `${barWidth}%` }}
                  >
                    <div className="bar-glow" />
                  </div>
                )}
              </div>
            </div>

            {/* Category tag */}
            <div className={`sensitivity-category ${getCategoryClass(factor.lever)}`}>
              {getCategory(factor.lever)}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="sensitivity-legend">
        <div className="legend-item">
          <span className="legend-bar negative" />
          <span className="legend-text">Negative Impact (increasing reduces outcomes)</span>
        </div>
        <div className="legend-item">
          <span className="legend-bar positive" />
          <span className="legend-text">Positive Impact (increasing improves outcomes)</span>
        </div>
      </div>
    </div>
  );
}

function getCategory(lever: string): string {
  if (['demandStrength', 'pricingPower', 'expansionVelocity'].includes(lever)) {
    return 'GROWTH';
  }
  if (['costDiscipline', 'hiringIntensity', 'operatingDrag'].includes(lever)) {
    return 'EFFICIENCY';
  }
  return 'RISK';
}

function getCategoryClass(lever: string): string {
  const category = getCategory(lever);
  return category.toLowerCase();
}

