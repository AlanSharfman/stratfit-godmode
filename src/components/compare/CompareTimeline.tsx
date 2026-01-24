// src/components/compare/CompareTimeline.tsx
// STRATFIT — Timeline Visualization for Compare

import React, { useMemo } from 'react';
import type { ScenarioDelta } from '../../state/scenarioStore';

interface CompareTimelineProps {
  delta: ScenarioDelta;
  metricType?: 'arr' | 'survival' | 'divergence';
}

export default function CompareTimeline({ delta, metricType = 'arr' }: CompareTimelineProps) {
  const data = delta.monthlyDivergence;
  
  // Chart dimensions
  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 70, bottom: 40, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate scales
  const { xScale, yScale, maxValue, minValue } = useMemo(() => {
    const allValues = data.flatMap(d => [d.arrA, d.arrB]);
    const max = Math.max(...allValues) * 1.1;
    const min = Math.min(...allValues) * 0.9;
    
    return {
      xScale: (month: number) => padding.left + ((month - 1) / 35) * chartWidth,
      yScale: (value: number) => padding.top + chartHeight - ((value - min) / (max - min)) * chartHeight,
      maxValue: max,
      minValue: min,
    };
  }, [data, chartWidth, chartHeight]);
  
  // Generate path strings
  const pathA = useMemo(() => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.month)} ${yScale(d.arrA)}`).join(' ');
  }, [data, xScale, yScale]);
  
  const pathB = useMemo(() => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.month)} ${yScale(d.arrB)}`).join(' ');
  }, [data, xScale, yScale]);
  
  // Area between paths (divergence zone)
  const areaPath = useMemo(() => {
    const forward = data.map(d => `${xScale(d.month)},${yScale(d.arrA)}`).join(' ');
    const backward = [...data].reverse().map(d => `${xScale(d.month)},${yScale(d.arrB)}`).join(' ');
    return `M ${forward} L ${backward} Z`;
  }, [data, xScale, yScale]);
  
  // Find max divergence point
  const maxDivergencePoint = useMemo(() => {
    let maxGap = 0;
    let maxPoint = data[0];
    for (const d of data) {
      if (Math.abs(d.gap) > maxGap) {
        maxGap = Math.abs(d.gap);
        maxPoint = d;
      }
    }
    return maxPoint;
  }, [data]);
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };
  
  return (
    <div className="compare-timeline">
      <div className="timeline-header">
        <span className="timeline-icon">◈</span>
        <span className="timeline-title">ARR TRAJECTORY — 36 MONTH HORIZON</span>
      </div>
      
      <svg width={width} height={height} className="timeline-svg">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="divergenceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.15)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0.15)" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 6, 12, 18, 24, 30, 36].map(month => (
          <g key={month}>
            <line
              x1={xScale(month || 1)}
              y1={padding.top}
              x2={xScale(month || 1)}
              y2={height - padding.bottom}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="2,2"
            />
            <text
              x={xScale(month || 1)}
              y={height - padding.bottom + 20}
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
              textAnchor="middle"
            >
              {month === 0 ? 'Now' : `M${month}`}
            </text>
          </g>
        ))}
        
        {/* Y-axis labels */}
        {[minValue, (minValue + maxValue) / 2, maxValue].map((value, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={yScale(value)}
            fill="rgba(255,255,255,0.5)"
            fontSize="10"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {formatCurrency(value)}
          </text>
        ))}
        
        {/* Divergence area */}
        <path d={areaPath} fill="url(#divergenceGradient)" />
        
        {/* Scenario A line */}
        <path
          d={pathA}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* Scenario B line */}
        <path
          d={pathB}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* Max divergence marker */}
        <g transform={`translate(${xScale(maxDivergencePoint.month)}, ${(yScale(maxDivergencePoint.arrA) + yScale(maxDivergencePoint.arrB)) / 2})`}>
          <line
            y1={yScale(maxDivergencePoint.arrA) - (yScale(maxDivergencePoint.arrA) + yScale(maxDivergencePoint.arrB)) / 2}
            y2={yScale(maxDivergencePoint.arrB) - (yScale(maxDivergencePoint.arrA) + yScale(maxDivergencePoint.arrB)) / 2}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
            strokeDasharray="3,2"
          />
          <circle r="4" fill="white" />
          <text
            x="8"
            y="4"
            fill="rgba(255,255,255,0.8)"
            fontSize="9"
          >
            Max Δ: {formatCurrency(Math.abs(maxDivergencePoint.gap))}
          </text>
        </g>
        
        {/* End point markers */}
        <circle cx={xScale(36)} cy={yScale(data[35]?.arrA || 0)} r="5" fill="#22d3ee" />
        <circle cx={xScale(36)} cy={yScale(data[35]?.arrB || 0)} r="5" fill="#fbbf24" />
        
        {/* End value labels */}
        <text
          x={xScale(36) + 12}
          y={yScale(data[35]?.arrA || 0) + 4}
          fill="#22d3ee"
          fontSize="11"
          fontWeight="600"
        >
          {formatCurrency(data[35]?.arrA || 0)}
        </text>
        <text
          x={xScale(36) + 12}
          y={yScale(data[35]?.arrB || 0) + 4}
          fill="#fbbf24"
          fontSize="11"
          fontWeight="600"
        >
          {formatCurrency(data[35]?.arrB || 0)}
        </text>
      </svg>
      
      {/* Legend */}
      <div className="timeline-legend">
        <div className="legend-item">
          <span className="legend-line cyan" />
          <span>Scenario A (Baseline)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line amber" />
          <span>Scenario B (Current)</span>
        </div>
        <div className="legend-item">
          <span className="legend-area" />
          <span>Divergence Zone</span>
        </div>
      </div>
    </div>
  );
}
