// src/components/risk/ThreatRadar.tsx
// STRATFIT — Threat Radar (Spider Chart)

import React, { useMemo } from 'react';

interface RadarDataPoint {
  category: string;
  score: number;
  label: string;
}

interface ThreatRadarProps {
  data: RadarDataPoint[];
}

export default function ThreatRadar({ data }: ThreatRadarProps) {
  // SVG dimensions — 60% larger for hero display
  const size = 640;
  const center = size / 2;
  const maxRadius = 240;
  const levels = 5;
  
  // Calculate positions for each data point
  const points = useMemo(() => {
    const angleStep = (2 * Math.PI) / data.length;
    
    return data.map((d, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const radius = (d.score / 100) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      
      // Label position (outside the chart)
      const labelRadius = maxRadius + 40;
      const labelX = center + labelRadius * Math.cos(angle);
      const labelY = center + labelRadius * Math.sin(angle);
      
      return {
        ...d,
        x,
        y,
        labelX,
        labelY,
        angle,
      };
    });
  }, [data, center, maxRadius]);
  
  // Generate polygon path
  const polygonPath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  }, [points]);
  
  // Generate grid circles
  const gridCircles = useMemo(() => {
    return Array.from({ length: levels }, (_, i) => {
      const radius = ((i + 1) / levels) * maxRadius;
      return { radius, value: Math.round(((i + 1) / levels) * 100) };
    });
  }, [levels, maxRadius]);
  
  // Generate axis lines
  const axisLines = useMemo(() => {
    const angleStep = (2 * Math.PI) / data.length;
    return data.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return {
        x2: center + maxRadius * Math.cos(angle),
        y2: center + maxRadius * Math.sin(angle),
      };
    });
  }, [data, center, maxRadius]);
  
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score <= 30) return '#22d3ee';
    if (score <= 50) return '#fbbf24';
    if (score <= 70) return '#f97316';
    return '#ef4444';
  };
  
  return (
    <div className="threat-radar">
      <div className="radar-header">
        <span className="radar-icon">◎</span>
        <span className="radar-title">THREAT RADAR</span>
        <span className="radar-subtitle">Risk exposure by category</span>
      </div>
      
      <svg width={size} height={size} className="radar-svg">
        <defs>
          {/* Gradient for the polygon fill */}
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.1)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.15)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.2)" />
          </radialGradient>
          
          {/* Glow filter */}
          <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background grid circles */}
        {gridCircles.map((circle, i) => (
          <g key={i}>
            <circle
              cx={center}
              cy={center}
              r={circle.radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
            {/* Level labels */}
            <text
              x={center + 5}
              y={center - circle.radius + 4}
              fill="rgba(255, 255, 255, 0.3)"
              fontSize="9"
            >
              {circle.value}
            </text>
          </g>
        ))}
        
        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}
        
        {/* Data polygon */}
        <path
          d={polygonPath}
          fill="url(#radarGradient)"
          stroke="#ef4444"
          strokeWidth="2"
          filter="url(#radarGlow)"
          className="radar-polygon"
        />
        
        {/* Data points */}
        {points.map((point, i) => (
          <g key={i} className="radar-point-group">
            {/* Point */}
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill={getScoreColor(point.score)}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="2"
              className="radar-point"
            />
            
            {/* Score label near point */}
            <text
              x={point.x}
              y={point.y - 12}
              fill={getScoreColor(point.score)}
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              className="point-score"
            >
              {point.score}
            </text>
            
            {/* Category label */}
            <text
              x={point.labelX}
              y={point.labelY}
              fill="rgba(255, 255, 255, 0.8)"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {point.label}
            </text>
          </g>
        ))}
        
        {/* Center point */}
        <circle
          cx={center}
          cy={center}
          r="4"
          fill="#22d3ee"
          className="radar-center"
        />
      </svg>
      
      {/* Legend */}
      <div className="radar-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#22d3ee' }} />
          <span>Low (0-30)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#fbbf24' }} />
          <span>Moderate (31-50)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#f97316' }} />
          <span>High (51-70)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#ef4444' }} />
          <span>Critical (71+)</span>
        </div>
      </div>
    </div>
  );
}
