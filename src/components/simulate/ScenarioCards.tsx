// src/components/simulate/ScenarioCards.tsx
// STRATFIT — Scenario Outcome Cards

import React from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import type { SingleSimulationResult } from '@/logic/monteCarloEngine';
import type { Verdict } from '@/logic/verdictGenerator';

interface ScenarioCardsProps {
  bestCase: SingleSimulationResult;
  worstCase: SingleSimulationResult;
  medianCase: SingleSimulationResult;
  verdict: Verdict;
}

export default function ScenarioCards({ 
  bestCase, 
  worstCase, 
  medianCase,
  verdict 
}: ScenarioCardsProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const scenarios = [
    {
      id: 'worst',
      label: 'PESSIMISTIC',
      sublabel: 'P5 Scenario',
      data: worstCase,
      narrative: verdict.worstCaseNarrative,
      icon: TrendingDown,
      colorClass: 'pessimistic',
    },
    {
      id: 'median',
      label: 'MOST LIKELY',
      sublabel: 'P50 Scenario',
      data: medianCase,
      narrative: verdict.mostLikelyNarrative,
      icon: Target,
      colorClass: 'median',
    },
    {
      id: 'best',
      label: 'OPTIMISTIC',
      sublabel: 'P95 Scenario',
      data: bestCase,
      narrative: verdict.bestCaseNarrative,
      icon: TrendingUp,
      colorClass: 'optimistic',
    },
  ];

  return (
    <div className="scenario-cards">
      {scenarios.map((scenario) => {
        const Icon = scenario.icon;
        const data = scenario.data;
        
        return (
          <div 
            key={scenario.id} 
            className={`scenario-card ${scenario.colorClass}`}
          >
            {/* Header */}
            <div className="scenario-header">
              <div className="scenario-icon">
                <Icon size={20} />
              </div>
              <div className="scenario-titles">
                <span className="scenario-label">{scenario.label}</span>
                <span className="scenario-sublabel">{scenario.sublabel}</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="scenario-metrics">
              <div className="scenario-metric">
                <span className="metric-label">Final ARR</span>
                <span className="metric-value">{formatCurrency(data.finalARR)}</span>
              </div>
              <div className="scenario-metric">
                <span className="metric-label">Cash Position</span>
                <span className="metric-value">{formatCurrency(data.finalCash)}</span>
              </div>
              <div className="scenario-metric">
                <span className="metric-label">Runway</span>
                <span className="metric-value">
                  {data.didSurvive 
                    ? `${Math.round(data.finalRunway)}+ mo` 
                    : `${data.survivalMonths} mo`
                  }
                </span>
              </div>
              <div className="scenario-metric">
                <span className="metric-label">Status</span>
                <span className={`metric-value status ${data.didSurvive ? 'survived' : 'failed'}`}>
                  {data.didSurvive ? 'SURVIVED' : 'DEPLETED'}
                </span>
              </div>
            </div>

            {/* Mini Trajectory */}
            <div className="scenario-trajectory">
              <svg viewBox="0 0 200 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`grad-${scenario.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                <path
                  d={generateTrajectoryPath(data, true)}
                  fill={`url(#grad-${scenario.id})`}
                />
                
                {/* Line */}
                <path
                  d={generateTrajectoryPath(data, false)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Narrative */}
            <p className="scenario-narrative">{scenario.narrative}</p>
          </div>
        );
      })}
    </div>
  );
}

// Helper function to generate trajectory path
function generateTrajectoryPath(data: SingleSimulationResult, area: boolean): string {
  const snapshots = data.monthlySnapshots;
  if (snapshots.length === 0) return '';

  const maxARR = Math.max(...snapshots.map(s => s.arr));
  const minARR = Math.min(...snapshots.map(s => s.arr));
  const range = maxARR - minARR || 1;

  const points = snapshots.map((snapshot, i) => {
    const x = (i / (snapshots.length - 1)) * 200;
    const y = 35 - ((snapshot.arr - minARR) / range) * 30;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  if (area) {
    return `${points} L200,40 L0,40 Z`;
  }
  return points;
}

