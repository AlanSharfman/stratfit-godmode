// src/components/simulate/ConfidenceFan.tsx
// STRATFIT — Confidence Fan Chart
// Shows probability bands spreading over time

import React, { useMemo } from 'react';
import type { ConfidenceBand } from '@/logic/monteCarloEngine';

interface ConfidenceFanProps {
  data: ConfidenceBand[];
  compact?: boolean;
}

export default function ConfidenceFan({ data, compact = false }: ConfidenceFanProps) {
  const height = compact ? 150 : 280;
  const width = 800;
  const padding = { top: 30, right: 60, bottom: 40, left: 70 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const { minValue, maxValue } = useMemo(() => {
    const allValues = data.flatMap(d => [d.p10, d.p90]);
    return {
      minValue: Math.min(...allValues) * 0.9,
      maxValue: Math.max(...allValues) * 1.1,
    };
  }, [data]);

  const xScale = (month: number) => {
    return padding.left + (month / 36) * chartWidth;
  };

  const yScale = (value: number) => {
    return padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  };

  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  // Generate path data for bands
  const generateBandPath = (upperKey: keyof ConfidenceBand, lowerKey: keyof ConfidenceBand) => {
    const upperPath = data.map((d, i) => {
      const x = xScale(d.month);
      const y = yScale(d[upperKey] as number);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');

    const lowerPath = [...data].reverse().map((d) => {
      const x = xScale(d.month);
      const y = yScale(d[lowerKey] as number);
      return `L${x},${y}`;
    }).join(' ');

    return `${upperPath} ${lowerPath} Z`;
  };

  // Generate line path
  const generateLinePath = (key: keyof ConfidenceBand) => {
    return data.map((d, i) => {
      const x = xScale(d.month);
      const y = yScale(d[key] as number);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  return (
    <div className={`confidence-fan ${compact ? 'compact' : ''}`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Outer band gradient (P10-P90) */}
          <linearGradient id="outerBandGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.15)" />
            <stop offset="50%" stopColor="rgba(34, 211, 238, 0.08)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.15)" />
          </linearGradient>

          {/* Inner band gradient (P25-P75) */}
          <linearGradient id="innerBandGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.25)" />
            <stop offset="50%" stopColor="rgba(34, 211, 238, 0.15)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.25)" />
          </linearGradient>

          {/* Glow filter for median line */}
          <filter id="medianGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {!compact && (
          <>
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const value = minValue + (maxValue - minValue) * ratio;
              const y = yScale(value);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    fill="rgba(255,255,255,0.4)"
                    fontSize="10"
                    textAnchor="end"
                  >
                    {formatValue(value)}
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines (every 12 months) */}
            {[0, 12, 24, 36].map((month) => {
              const x = xScale(month);
              return (
                <g key={month}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 20}
                    fill="rgba(255,255,255,0.5)"
                    fontSize="11"
                    textAnchor="middle"
                  >
                    {month === 0 ? 'Now' : `${month}mo`}
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* P10-P90 band (outer) */}
        <path
          d={generateBandPath('p90', 'p10')}
          fill="url(#outerBandGradient)"
          className="confidence-band outer"
        />

        {/* P25-P75 band (inner) */}
        <path
          d={generateBandPath('p75', 'p25')}
          fill="url(#innerBandGradient)"
          className="confidence-band inner"
        />

        {/* P90 line */}
        <path
          d={generateLinePath('p90')}
          fill="none"
          stroke="rgba(34, 197, 94, 0.5)"
          strokeWidth="1.5"
          strokeDasharray="6,4"
          className="confidence-line p90"
        />

        {/* P10 line */}
        <path
          d={generateLinePath('p10')}
          fill="none"
          stroke="rgba(239, 68, 68, 0.5)"
          strokeWidth="1.5"
          strokeDasharray="6,4"
          className="confidence-line p10"
        />

        {/* P50 line (median) */}
        <path
          d={generateLinePath('p50')}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          filter="url(#medianGlow)"
          className="confidence-line median"
        />

        {/* End point markers */}
        {!compact && data.length > 0 && (
          <>
            {/* P90 end marker */}
            <g transform={`translate(${xScale(36)}, ${yScale(data[data.length - 1].p90)})`}>
              <circle r="4" fill="rgba(34, 197, 94, 0.8)" />
              <text x="10" y="4" fill="rgba(34, 197, 94, 0.9)" fontSize="11" fontWeight="600">
                {formatValue(data[data.length - 1].p90)}
              </text>
            </g>

            {/* P50 end marker */}
            <g transform={`translate(${xScale(36)}, ${yScale(data[data.length - 1].p50)})`}>
              <circle r="5" fill="#22d3ee" />
              <text x="10" y="4" fill="#22d3ee" fontSize="11" fontWeight="600">
                {formatValue(data[data.length - 1].p50)}
              </text>
            </g>

            {/* P10 end marker */}
            <g transform={`translate(${xScale(36)}, ${yScale(data[data.length - 1].p10)})`}>
              <circle r="4" fill="rgba(239, 68, 68, 0.8)" />
              <text x="10" y="4" fill="rgba(239, 68, 68, 0.9)" fontSize="11" fontWeight="600">
                {formatValue(data[data.length - 1].p10)}
              </text>
            </g>
          </>
        )}

        {/* Compact labels */}
        {compact && data.length > 0 && (
          <g transform={`translate(${width - padding.right + 5}, ${padding.top})`}>
            <text y="20" fill="rgba(34, 197, 94, 0.8)" fontSize="10">P90</text>
            <text y="60" fill="#22d3ee" fontSize="10" fontWeight="600">P50</text>
            <text y="100" fill="rgba(239, 68, 68, 0.8)" fontSize="10">P10</text>
          </g>
        )}
      </svg>

      {/* Legend (non-compact only) */}
      {!compact && (
        <div className="fan-legend">
          <div className="legend-item">
            <span className="legend-line pessimistic" />
            <span>P10 (Pessimistic)</span>
          </div>
          <div className="legend-item">
            <span className="legend-band inner" />
            <span>P25-P75 Range</span>
          </div>
          <div className="legend-item">
            <span className="legend-line median" />
            <span>P50 (Median)</span>
          </div>
          <div className="legend-item">
            <span className="legend-band outer" />
            <span>P10-P90 Range</span>
          </div>
          <div className="legend-item">
            <span className="legend-line optimistic" />
            <span>P90 (Optimistic)</span>
          </div>
        </div>
      )}
    </div>
  );
}

