// src/components/valuation/ValuationTimeline.tsx
// STRATFIT — Valuation Projection Timeline

import React from 'react';

interface ValuationTimelineProps {
  projections: {
    month: number;
    low: number;
    mid: number;
    high: number;
  }[];
  currentValuation: number;
}

const formatValuation = (value: number): string => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function ValuationTimeline({ projections, currentValuation }: ValuationTimelineProps) {
  if (!projections || projections.length === 0) {
    return (
      <div className="valuation-timeline empty">
        <p>No projection data available</p>
      </div>
    );
  }
  
  // Find max value for scaling
  const maxValue = Math.max(...projections.map(p => p.high));
  const minValue = Math.min(...projections.map(p => p.low));
  const range = maxValue - minValue;
  
  // Scale Y position (inverted because SVG y increases downward)
  const scaleY = (value: number): number => {
    return 280 - ((value - minValue) / range) * 240;
  };
  
  // Generate path points
  const midPath = projections.map((p, i) => {
    const x = 50 + (i / (projections.length - 1)) * 700;
    const y = scaleY(p.mid);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Generate confidence band
  const bandPath = [
    ...projections.map((p, i) => {
      const x = 50 + (i / (projections.length - 1)) * 700;
      return `${i === 0 ? 'M' : 'L'} ${x} ${scaleY(p.high)}`;
    }),
    ...projections.slice().reverse().map((p, i) => {
      const x = 50 + ((projections.length - 1 - i) / (projections.length - 1)) * 700;
      return `L ${x} ${scaleY(p.low)}`;
    }),
    'Z'
  ].join(' ');
  
  const lastProjection = projections[projections.length - 1];
  const growth = ((lastProjection.mid - currentValuation) / currentValuation) * 100;
  
  return (
    <div className="valuation-timeline">
      <div className="timeline-header">
        <div className="header-left">
          <span className="timeline-icon">◔</span>
          <span className="timeline-title">VALUATION TRAJECTORY</span>
        </div>
        <div className="header-right">
          <span className="projection-label">24-month projection</span>
          <span className={`projection-growth ${growth >= 0 ? 'positive' : 'negative'}`}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(0)}%
          </span>
        </div>
      </div>
      
      <div className="timeline-chart">
        <svg viewBox="0 0 800 320" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 40 + i * 60;
            const value = maxValue - (i / 4) * range;
            return (
              <g key={i}>
                <line
                  x1="50"
                  y1={y}
                  x2="750"
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4,4"
                />
                <text
                  x="40"
                  y={y + 4}
                  textAnchor="end"
                  className="grid-label"
                >
                  {formatValuation(value)}
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels */}
          {projections.map((p, i) => {
            const x = 50 + (i / (projections.length - 1)) * 700;
            return (
              <text
                key={i}
                x={x}
                y="305"
                textAnchor="middle"
                className="grid-label"
              >
                {p.month === 0 ? 'Now' : `M${p.month}`}
              </text>
            );
          })}
          
          {/* Confidence band */}
          <path
            d={bandPath}
            fill="rgba(34, 211, 238, 0.1)"
            stroke="none"
          />
          
          {/* High line */}
          <path
            d={projections.map((p, i) => {
              const x = 50 + (i / (projections.length - 1)) * 700;
              return `${i === 0 ? 'M' : 'L'} ${x} ${scaleY(p.high)}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(34, 211, 238, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          
          {/* Low line */}
          <path
            d={projections.map((p, i) => {
              const x = 50 + (i / (projections.length - 1)) * 700;
              return `${i === 0 ? 'M' : 'L'} ${x} ${scaleY(p.low)}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(34, 211, 238, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          
          {/* Main projection line */}
          <path
            d={midPath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {projections.map((p, i) => {
            const x = 50 + (i / (projections.length - 1)) * 700;
            const y = scaleY(p.mid);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#030508"
                  stroke="#22d3ee"
                  strokeWidth="2"
                />
                {(i === 0 || i === projections.length - 1) && (
                  <text
                    x={x}
                    y={y - 15}
                    textAnchor="middle"
                    className="point-label"
                  >
                    {formatValuation(p.mid)}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Current valuation marker */}
          <line
            x1="50"
            y1={scaleY(currentValuation)}
            x2="750"
            y2={scaleY(currentValuation)}
            stroke="#fbbf24"
            strokeWidth="1"
            strokeDasharray="8,4"
            opacity="0.5"
          />
        </svg>
      </div>
      
      {/* Projection summary */}
      <div className="timeline-summary">
        <div className="summary-card">
          <span className="card-label">Low Case</span>
          <span className="card-value low">{formatValuation(lastProjection.low)}</span>
        </div>
        <div className="summary-card highlight">
          <span className="card-label">Base Case</span>
          <span className="card-value">{formatValuation(lastProjection.mid)}</span>
        </div>
        <div className="summary-card">
          <span className="card-label">High Case</span>
          <span className="card-value high">{formatValuation(lastProjection.high)}</span>
        </div>
      </div>
    </div>
  );
}
