// src/components/risk/RiskTimeline.tsx
// STRATFIT — Risk Timeline (36-Month Projection)

import React, { useMemo } from 'react';

interface TimelinePoint {
  month: number;
  risk: number;
  label: string;
}

interface RiskTimelineProps {
  data: TimelinePoint[];
  currentScore: number;
}

export default function RiskTimeline({ data, currentScore }: RiskTimelineProps) {
  // Chart dimensions
  const width = 700;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Scales
  const xScale = (month: number) => padding.left + (month / 36) * chartWidth;
  const yScale = (risk: number) => padding.top + chartHeight - (risk / 100) * chartHeight;
  
  // Generate path
  const linePath = useMemo(() => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.month)} ${yScale(d.risk)}`).join(' ');
  }, [data]);
  
  // Area path (for gradient fill)
  const areaPath = useMemo(() => {
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.month)} ${yScale(d.risk)}`).join(' ');
    return `${line} L ${xScale(36)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;
  }, [data]);
  
  // Find danger zones (risk > 60)
  const dangerZones = useMemo(() => {
    const zones: { start: number; end: number }[] = [];
    let inZone = false;
    let zoneStart = 0;
    
    data.forEach((d, i) => {
      if (d.risk > 60 && !inZone) {
        inZone = true;
        zoneStart = d.month;
      } else if (d.risk <= 60 && inZone) {
        inZone = false;
        zones.push({ start: zoneStart, end: d.month });
      }
    });
    
    if (inZone) {
      zones.push({ start: zoneStart, end: 36 });
    }
    
    return zones;
  }, [data]);
  
  // Get color for risk level
  const getRiskColor = (risk: number) => {
    if (risk <= 30) return '#22d3ee';
    if (risk <= 50) return '#fbbf24';
    if (risk <= 70) return '#f97316';
    return '#ef4444';
  };
  
  // Find key points
  const maxRisk = Math.max(...data.map(d => d.risk));
  const maxRiskPoint = data.find(d => d.risk === maxRisk);
  const minRisk = Math.min(...data.map(d => d.risk));
  
  return (
    <div className="risk-timeline">
      <div className="timeline-header">
        <span className="timeline-icon">◔</span>
        <span className="timeline-title">RISK TRAJECTORY</span>
        <span className="timeline-subtitle">36-month projection based on current strategy</span>
      </div>
      
      <svg width={width} height={height} className="timeline-svg">
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id="riskAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.15)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.05)" />
          </linearGradient>
          
          {/* Line gradient */}
          <linearGradient id="riskLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        
        {/* Danger zone backgrounds */}
        {dangerZones.map((zone, i) => (
          <rect
            key={i}
            x={xScale(zone.start)}
            y={padding.top}
            width={xScale(zone.end) - xScale(zone.start)}
            height={chartHeight}
            fill="rgba(239, 68, 68, 0.1)"
          />
        ))}
        
        {/* Risk level bands */}
        <rect
          x={padding.left}
          y={yScale(100)}
          width={chartWidth}
          height={yScale(70) - yScale(100)}
          fill="rgba(239, 68, 68, 0.05)"
        />
        <rect
          x={padding.left}
          y={yScale(70)}
          width={chartWidth}
          height={yScale(50) - yScale(70)}
          fill="rgba(249, 115, 22, 0.05)"
        />
        <rect
          x={padding.left}
          y={yScale(50)}
          width={chartWidth}
          height={yScale(30) - yScale(50)}
          fill="rgba(251, 191, 36, 0.05)"
        />
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(value => (
          <g key={value}>
            <line
              x1={padding.left}
              y1={yScale(value)}
              x2={width - padding.right}
              y2={yScale(value)}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left - 10}
              y={yScale(value)}
              fill="rgba(255, 255, 255, 0.5)"
              fontSize="10"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {value}
            </text>
          </g>
        ))}
        
        {/* X-axis labels */}
        {data.filter(d => d.label).map(d => (
          <text
            key={d.month}
            x={xScale(d.month)}
            y={height - padding.bottom + 20}
            fill="rgba(255, 255, 255, 0.5)"
            fontSize="10"
            textAnchor="middle"
          >
            {d.label}
          </text>
        ))}
        
        {/* Now marker */}
        <text
          x={xScale(0)}
          y={height - padding.bottom + 20}
          fill="#22d3ee"
          fontSize="10"
          textAnchor="middle"
          fontWeight="600"
        >
          Now
        </text>
        
        {/* Area fill */}
        <path d={areaPath} fill="url(#riskAreaGradient)" />
        
        {/* Main line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#riskLineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          className="risk-line"
        />
        
        {/* Current point */}
        <circle
          cx={xScale(0)}
          cy={yScale(currentScore)}
          r="8"
          fill="#22d3ee"
          stroke="white"
          strokeWidth="2"
          className="current-point"
        />
        
        {/* Max risk point */}
        {maxRiskPoint && (
          <g>
            <circle
              cx={xScale(maxRiskPoint.month)}
              cy={yScale(maxRiskPoint.risk)}
              r="6"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={xScale(maxRiskPoint.month)}
              y={yScale(maxRiskPoint.risk) - 15}
              fill="#ef4444"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
            >
              Peak: {maxRisk}
            </text>
          </g>
        )}
        
        {/* Y-axis label */}
        <text
          x={20}
          y={height / 2}
          fill="rgba(255, 255, 255, 0.5)"
          fontSize="11"
          textAnchor="middle"
          transform={`rotate(-90, 20, ${height / 2})`}
        >
          Risk Score
        </text>
      </svg>
      
      {/* Key insights */}
      <div className="timeline-insights">
        <div className="insight-item">
          <span className="insight-label">Current Risk</span>
          <span className="insight-value" style={{ color: getRiskColor(currentScore) }}>
            {currentScore}
          </span>
        </div>
        <div className="insight-item">
          <span className="insight-label">Peak Risk</span>
          <span className="insight-value" style={{ color: '#ef4444' }}>
            {maxRisk} @ M{maxRiskPoint?.month}
          </span>
        </div>
        <div className="insight-item">
          <span className="insight-label">Minimum Risk</span>
          <span className="insight-value" style={{ color: '#22d3ee' }}>
            {minRisk}
          </span>
        </div>
        <div className="insight-item">
          <span className="insight-label">Danger Periods</span>
          <span className="insight-value danger">
            {dangerZones.length > 0 ? `${dangerZones.length} zone(s)` : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
}
