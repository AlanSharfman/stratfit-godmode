// src/components/valuation/ComparablesBenchmark.tsx
// STRATFIT — Comparable Companies Benchmark

import React from 'react';
import type { ComparableCompany } from '../../state/valuationStore';

interface ComparablesBenchmarkProps {
  comparables: ComparableCompany[];
  currentMultiple: number;
  percentileRank: number;
}

const formatValuation = (value: number): string => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const STAGE_COLORS: Record<string, string> = {
  'pre-seed': '#a78bfa',
  'seed': '#22d3ee',
  'series-a': '#10b981',
  'series-b': '#fbbf24',
  'series-c': '#f97316',
  'series-d': '#f87171',
  'growth': '#ec4899',
};

export default function ComparablesBenchmark({
  comparables,
  currentMultiple,
  percentileRank,
}: ComparablesBenchmarkProps) {
  // Sort by ARR multiple
  const sortedComps = [...comparables].sort((a, b) => b.arrMultiple - a.arrMultiple);
  const maxMultiple = Math.max(...sortedComps.map(c => c.arrMultiple), currentMultiple);
  const avgMultiple = sortedComps.reduce((sum, c) => sum + c.arrMultiple, 0) / sortedComps.length;
  
  return (
    <div className="comparables-benchmark">
      <div className="benchmark-header">
        <div className="header-left">
          <span className="benchmark-icon">⊞</span>
          <span className="benchmark-title">COMPARABLE COMPANIES</span>
        </div>
        <div className="header-right">
          <span className="percentile-badge">
            P{Math.round(percentileRank)} vs Peers
          </span>
        </div>
      </div>
      
      {/* Position indicator */}
      <div className="position-indicator">
        <div className="position-bar">
          <div 
            className="position-marker you"
            style={{ left: `${(currentMultiple / maxMultiple) * 100}%` }}
            title={`Your multiple: ${currentMultiple.toFixed(1)}x`}
          >
            <span className="marker-label">YOU</span>
            <span className="marker-value">{currentMultiple.toFixed(1)}x</span>
          </div>
          <div 
            className="position-marker avg"
            style={{ left: `${(avgMultiple / maxMultiple) * 100}%` }}
          >
            <span className="marker-label">AVG</span>
          </div>
        </div>
        <div className="position-scale">
          <span>0x</span>
          <span>{Math.round(maxMultiple / 2)}x</span>
          <span>{Math.round(maxMultiple)}x</span>
        </div>
      </div>
      
      {/* Comparables table */}
      <div className="comparables-table">
        <div className="table-header">
          <span className="col-name">Company</span>
          <span className="col-stage">Stage</span>
          <span className="col-arr">ARR</span>
          <span className="col-growth">Growth</span>
          <span className="col-multiple">Multiple</span>
        </div>
        
        <div className="table-body">
          {sortedComps.map((comp) => (
            <div 
              key={comp.id} 
              className={`table-row ${comp.arrMultiple > currentMultiple ? 'above' : 'below'}`}
            >
              <span className="col-name">
                <span className="company-name">{comp.name}</span>
                <span className="company-sector">{comp.sector}</span>
              </span>
              <span className="col-stage">
                <span 
                  className="stage-badge"
                  style={{ background: `${STAGE_COLORS[comp.stage]}20`, color: STAGE_COLORS[comp.stage] }}
                >
                  {comp.stage.replace('-', ' ')}
                </span>
              </span>
              <span className="col-arr">{formatValuation(comp.lastARR)}</span>
              <span className="col-growth">
                <span className={`growth-value ${comp.growthRate > 100 ? 'high' : ''}`}>
                  {comp.growthRate}%
                </span>
              </span>
              <span className="col-multiple">
                <div className="multiple-bar">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${(comp.arrMultiple / maxMultiple) * 100}%`,
                      background: comp.arrMultiple > currentMultiple ? '#10b981' : 'rgba(255,255,255,0.2)',
                    }}
                  />
                </div>
                <span className="multiple-value">{comp.arrMultiple}x</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Insights */}
      <div className="benchmark-insights">
        <div className="insight-card">
          <span className="insight-icon">📊</span>
          <div className="insight-content">
            <span className="insight-title">Multiple Analysis</span>
            <span className="insight-text">
              Your {currentMultiple.toFixed(1)}x ARR multiple is 
              {currentMultiple > avgMultiple 
                ? ` ${((currentMultiple / avgMultiple - 1) * 100).toFixed(0)}% above` 
                : ` ${((1 - currentMultiple / avgMultiple) * 100).toFixed(0)}% below`
              } the peer average of {avgMultiple.toFixed(1)}x
            </span>
          </div>
        </div>
        
        <div className="insight-card">
          <span className="insight-icon">💡</span>
          <div className="insight-content">
            <span className="insight-title">Recommendation</span>
            <span className="insight-text">
              {percentileRank > 75 
                ? 'Strong position. Consider aggressive expansion to justify premium.'
                : percentileRank > 50
                ? 'Solid position. Focus on growth acceleration to move up.'
                : 'Room to improve. Prioritize efficiency and growth metrics.'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
