// src/components/valuation/DilutionScenarios.tsx
// STRATFIT — Dilution & Exit Scenarios Panel

import React, { useState } from 'react';
import { useValuationStore, type FundingStage } from '../../state/valuationStore';

interface DilutionScenariosProps {
  currentValuation: number;
  exitScenarios: {
    type: 'acquisition' | 'ipo' | 'secondary';
    probability: number;
    valuationRange: { low: number; high: number };
    timeframeMonths: number;
  }[];
}

const formatValuation = (value: number): string => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const EXIT_ICONS: Record<string, string> = {
  acquisition: '🤝',
  ipo: '🔔',
  secondary: '💱',
};

const EXIT_LABELS: Record<string, string> = {
  acquisition: 'Acquisition',
  ipo: 'IPO',
  secondary: 'Secondary Sale',
};

const STAGE_TYPICAL_DILUTION: Record<FundingStage, number> = {
  'pre-seed': 15,
  'seed': 20,
  'series-a': 20,
  'series-b': 15,
  'series-c': 12,
  'series-d': 10,
  'growth': 8,
};

export default function DilutionScenarios({ currentValuation, exitScenarios }: DilutionScenariosProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedStages, setSelectedStages] = useState<FundingStage[]>(['seed', 'series-a', 'series-b']);
  
  // Calculate cumulative dilution
  const calculateOwnership = (stages: FundingStage[]): number => {
    let ownership = 100;
    stages.forEach(stage => {
      ownership *= (1 - STAGE_TYPICAL_DILUTION[stage] / 100);
    });
    return ownership;
  };
  
  const finalOwnership = calculateOwnership(selectedStages);
  const exitValue = currentValuation * 3; // Assume 3x return scenario
  const founderValue = (exitValue * finalOwnership) / 100;
  
  return (
    <div className="dilution-scenarios">
      {/* Exit Scenarios Section */}
      <div className="exit-scenarios">
        <div className="section-header">
          <span className="section-icon">🎯</span>
          <span className="section-title">EXIT SCENARIOS</span>
        </div>
        
        <div className="exit-list">
          {exitScenarios.map((scenario) => (
            <div key={scenario.type} className="exit-item">
              <div className="exit-header">
                <span className="exit-icon">{EXIT_ICONS[scenario.type]}</span>
                <span className="exit-type">{EXIT_LABELS[scenario.type]}</span>
                <span className="exit-probability">
                  {Math.round(scenario.probability * 100)}%
                </span>
              </div>
              
              <div className="exit-range">
                <div className="range-bar">
                  <div 
                    className="range-fill"
                    style={{ 
                      left: '20%',
                      width: '60%',
                    }}
                  />
                  <div className="range-marker low" style={{ left: '20%' }} />
                  <div className="range-marker high" style={{ left: '80%' }} />
                </div>
                <div className="range-labels">
                  <span>{formatValuation(scenario.valuationRange.low)}</span>
                  <span>{formatValuation(scenario.valuationRange.high)}</span>
                </div>
              </div>
              
              <div className="exit-timeframe">
                {scenario.timeframeMonths} month horizon
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dilution Calculator */}
      <div className="dilution-calculator">
        <div className="section-header">
          <span className="section-icon">📊</span>
          <span className="section-title">DILUTION CALCULATOR</span>
          <button 
            className="toggle-btn"
            onClick={() => setShowCalculator(!showCalculator)}
          >
            {showCalculator ? '−' : '+'}
          </button>
        </div>
        
        {showCalculator && (
          <div className="calculator-content">
            <div className="stage-selector">
              <span className="selector-label">Planned Rounds:</span>
              <div className="stage-chips">
                {(['seed', 'series-a', 'series-b', 'series-c'] as FundingStage[]).map((stage) => (
                  <button
                    key={stage}
                    className={`stage-chip ${selectedStages.includes(stage) ? 'active' : ''}`}
                    onClick={() => {
                      if (selectedStages.includes(stage)) {
                        setSelectedStages(selectedStages.filter(s => s !== stage));
                      } else {
                        setSelectedStages([...selectedStages, stage]);
                      }
                    }}
                  >
                    {stage.replace('-', ' ').toUpperCase()}
                    <span className="chip-dilution">-{STAGE_TYPICAL_DILUTION[stage]}%</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="dilution-waterfall">
              <div className="waterfall-header">
                <span>Starting</span>
                <span>100%</span>
              </div>
              {selectedStages.map((stage, i) => {
                const beforeOwnership = calculateOwnership(selectedStages.slice(0, i));
                const afterOwnership = calculateOwnership(selectedStages.slice(0, i + 1));
                return (
                  <div key={stage} className="waterfall-step">
                    <div className="step-bar">
                      <div 
                        className="bar-before"
                        style={{ width: `${beforeOwnership}%` }}
                      />
                      <div 
                        className="bar-after"
                        style={{ width: `${afterOwnership}%` }}
                      />
                    </div>
                    <div className="step-label">
                      <span>{stage.replace('-', ' ')}</span>
                      <span className="dilution-amount">-{STAGE_TYPICAL_DILUTION[stage]}%</span>
                      <span className="ownership-after">{afterOwnership.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="dilution-result">
              <div className="result-item">
                <span className="result-label">Final Ownership</span>
                <span className="result-value">{finalOwnership.toFixed(1)}%</span>
              </div>
              <div className="result-item highlight">
                <span className="result-label">At 3x Exit ({formatValuation(exitValue)})</span>
                <span className="result-value">{formatValuation(founderValue)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick Stats */}
      <div className="dilution-stats">
        <div className="stat-row">
          <span className="stat-label">Current Valuation</span>
          <span className="stat-value">{formatValuation(currentValuation)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Projected Ownership</span>
          <span className="stat-value">{finalOwnership.toFixed(1)}%</span>
        </div>
        <div className="stat-row highlight">
          <span className="stat-label">Founder Value (3x)</span>
          <span className="stat-value">{formatValuation(founderValue)}</span>
        </div>
      </div>
    </div>
  );
}
