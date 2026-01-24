// src/components/simulate/ProbabilityDistribution.tsx
// STRATFIT — Probability Distribution Histogram

import React, { useMemo } from 'react';
import type { HistogramBucket, PercentileSet, DistributionStats } from '@/logic/monteCarloEngine';

interface ProbabilityDistributionProps {
  histogram: HistogramBucket[];
  percentiles: PercentileSet;
  stats: DistributionStats;
}

export default function ProbabilityDistribution({ 
  histogram, 
  percentiles, 
  stats 
}: ProbabilityDistributionProps) {
  const maxFrequency = useMemo(() => {
    return Math.max(...histogram.map(b => b.frequency));
  }, [histogram]);

  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  // Find which bucket contains median
  const medianBucketIndex = useMemo(() => {
    return histogram.findIndex(b => 
      percentiles.p50 >= b.min && percentiles.p50 < b.max
    );
  }, [histogram, percentiles]);

  return (
    <div className="probability-distribution">
      {/* Chart */}
      <div className="distribution-chart">
        <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Gradient for bars */}
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(34, 211, 238, 0.8)" />
              <stop offset="100%" stopColor="rgba(34, 211, 238, 0.3)" />
            </linearGradient>
            
            {/* Gradient for median bar */}
            <linearGradient id="medianGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
              <stop offset="100%" stopColor="rgba(34, 211, 238, 0.6)" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="barGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line
                x1="60"
                y1={250 - ratio * 200}
                x2="780"
                y2={250 - ratio * 200}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="4"
              />
              <text
                x="55"
                y={255 - ratio * 200}
                fill="rgba(255,255,255,0.4)"
                fontSize="10"
                textAnchor="end"
              >
                {(ratio * maxFrequency * 100).toFixed(0)}%
              </text>
            </g>
          ))}

          {/* Histogram bars */}
          {histogram.map((bucket, i) => {
            const barWidth = 700 / histogram.length - 2;
            const barHeight = (bucket.frequency / maxFrequency) * 200;
            const x = 65 + i * (700 / histogram.length);
            const y = 250 - barHeight;
            const isMedian = i === medianBucketIndex;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={isMedian ? "url(#medianGradient)" : "url(#barGradient)"}
                  rx="2"
                  className="distribution-bar"
                  filter={isMedian ? "url(#barGlow)" : undefined}
                />
                {/* Hover tooltip area */}
                <rect
                  x={x}
                  y={50}
                  width={barWidth}
                  height={200}
                  fill="transparent"
                  className="distribution-bar-hover"
                />
              </g>
            );
          })}

          {/* Percentile markers */}
          {[
            { p: percentiles.p10, label: 'P10', color: 'rgba(239, 68, 68, 0.8)' },
            { p: percentiles.p50, label: 'P50', color: 'rgba(255, 255, 255, 0.9)' },
            { p: percentiles.p90, label: 'P90', color: 'rgba(34, 197, 94, 0.8)' },
          ].map(({ p, label, color }) => {
            const x = 65 + ((p - stats.min) / (stats.max - stats.min)) * 700;
            return (
              <g key={label}>
                <line
                  x1={x}
                  y1={50}
                  x2={x}
                  y2={250}
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray={label === 'P50' ? 'none' : '6,4'}
                />
                <text
                  x={x}
                  y={40}
                  fill={color}
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {label}
                </text>
                <text
                  x={x}
                  y={270}
                  fill={color}
                  fontSize="10"
                  textAnchor="middle"
                >
                  {formatValue(p)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          <text x="60" y="285" fill="rgba(255,255,255,0.4)" fontSize="10">
            {formatValue(stats.min)}
          </text>
          <text x="780" y="285" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">
            {formatValue(stats.max)}
          </text>
          <text x="420" y="295" fill="rgba(255,255,255,0.5)" fontSize="11" textAnchor="middle">
            Final ARR at Month 36
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="distribution-legend">
        <div className="legend-item">
          <span className="legend-color pessimistic" />
          <span className="legend-label">P10 (Pessimistic)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color median" />
          <span className="legend-label">P50 (Median)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color optimistic" />
          <span className="legend-label">P90 (Optimistic)</span>
        </div>
      </div>
    </div>
  );
}

