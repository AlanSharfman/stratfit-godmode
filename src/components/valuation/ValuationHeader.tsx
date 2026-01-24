// src/components/valuation/ValuationHeader.tsx
// STRATFIT — Valuation Header with Key Metrics

import React from 'react';
import { useValuationStore } from '../../state/valuationStore';

interface ValuationHeaderProps {
  currentValuation?: number;
  arrMultiple?: number;
  percentileRank?: number;
}

const formatValuation = (value: number): string => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function ValuationHeader({
  currentValuation,
  arrMultiple,
  percentileRank,
}: ValuationHeaderProps) {
  const viewMode = useValuationStore((s) => s.viewMode);
  const setViewMode = useValuationStore((s) => s.setViewMode);
  const currentStage = useValuationStore((s) => s.currentStage);
  const currentARR = useValuationStore((s) => s.currentARR);
  const growthRate = useValuationStore((s) => s.growthRate);
  
  return (
    <header className="valuation-header">
      <div className="header-left">
        <h1 className="header-title">
          <span className="title-icon">💎</span>
          VALUATION INTELLIGENCE
        </h1>
        <p className="header-subtitle">
          Enterprise value modeling • Funding scenarios • Exit analysis
        </p>
      </div>
      
      {currentValuation && (
        <div className="header-center">
          <div className="valuation-stats">
            <div className="stat-badge primary">
              <span className="badge-value">{formatValuation(currentValuation)}</span>
              <span className="badge-label">VALUATION</span>
            </div>
            <div className="stat-badge">
              <span className="badge-value">{arrMultiple?.toFixed(1)}x</span>
              <span className="badge-label">ARR MULTIPLE</span>
            </div>
            <div className="stat-badge">
              <span className="badge-value">P{Math.round(percentileRank || 50)}</span>
              <span className="badge-label">VS PEERS</span>
            </div>
            <div className="stat-badge subtle">
              <span className="badge-value">{formatValuation(currentARR)}</span>
              <span className="badge-label">ARR</span>
            </div>
            <div className="stat-badge subtle">
              <span className="badge-value">{growthRate}%</span>
              <span className="badge-label">GROWTH</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="header-right">
        <div className="view-mode-toggle">
          <button
            className={`mode-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            <span className="mode-icon">◉</span>
            Overview
          </button>
          <button
            className={`mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            <span className="mode-icon">◔</span>
            Timeline
          </button>
          <button
            className={`mode-btn ${viewMode === 'comparables' ? 'active' : ''}`}
            onClick={() => setViewMode('comparables')}
          >
            <span className="mode-icon">⊞</span>
            Comps
          </button>
        </div>
      </div>
    </header>
  );
}
