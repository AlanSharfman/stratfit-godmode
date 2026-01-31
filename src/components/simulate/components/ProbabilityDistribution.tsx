// src/components/simulate/components/ProbabilityDistribution.tsx
// STRATFIT — Probability Distribution Histogram

import React, { useMemo } from "react";
import type { HistogramBucket, PercentileSet, DistributionStats } from "@/logic/monteCarloEngine";

interface ProbabilityDistributionProps {
  histogram: HistogramBucket[];
  percentiles: PercentileSet;
  stats: DistributionStats;
}

export default function ProbabilityDistribution({ histogram, percentiles, stats }: ProbabilityDistributionProps) {
  const maxFrequency = useMemo(() => {
    return Math.max(...histogram.map((b) => b.frequency));
  }, [histogram]);

  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  // Find which bucket contains median
  const medianBucketIndex = useMemo(() => {
    return histogram.findIndex((b) => percentiles.p50 >= b.min && percentiles.p50 < b.max);
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
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
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
              <text x="55" y={255 - ratio * 200} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">
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
                <rect x={x} y={50} width={barWidth} height={200} fill="transparent" className="distribution-bar-hover" />
              </g>
            );
          })}

          {/* Percentile markers */}
          {[
            { p: percentiles.p10, label: "P10", color: "rgba(239, 68, 68, 0.8)" },
            { p: percentiles.p50, label: "P50", color: "rgba(255, 255, 255, 0.9)" },
            { p: percentiles.p90, label: "P90", color: "rgba(34, 211, 238, 0.8)" },
          ].map((marker) => {
            const x =
              65 +
              ((marker.p - histogram[0].min) / (histogram[histogram.length - 1].max - histogram[0].min)) * 700;

            return (
              <g key={marker.label}>
                <line x1={x} y1="50" x2={x} y2="250" stroke={marker.color} strokeWidth="2" strokeDasharray="4" />
                <text x={x} y="40" fill={marker.color} fontSize="12" textAnchor="middle" fontWeight="600">
                  {marker.label}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {histogram.filter((_, i) => i % 3 === 0).map((bucket, i) => {
            const idx = i * 3;
            const x = 65 + idx * (700 / histogram.length);
            return (
              <text key={idx} x={x} y="275" fill="rgba(255,255,255,0.4)" fontSize="10">
                {formatValue(bucket.min)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Stats */}
      <div className="distribution-stats">
        <div className="stat">
          <span className="stat-label">Mean</span>
          <span className="stat-value">{formatValue(stats.mean)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Std Dev</span>
          <span className="stat-value">{formatValue(stats.stdDev)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Skew</span>
          <span className="stat-value">{stats.skewness.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}


