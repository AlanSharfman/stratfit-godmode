// src/components/compare/LavaRiversMountain.tsx
// STRATFIT — 3D-ish Mountain Visualization showing two strategy paths

import React, { useMemo } from 'react';
import type { Scenario, ScenarioDelta } from '../../state/scenarioStore';

interface LavaRiversMountainProps {
  scenarioA: Scenario;
  scenarioB: Scenario;
  delta: ScenarioDelta;
}

export default function LavaRiversMountain({ scenarioA, scenarioB, delta }: LavaRiversMountainProps) {
  const simA = scenarioA.simulation;
  const simB = scenarioB.simulation;
  
  // SVG dimensions
  const width = 800;
  const height = 500;
  const centerX = width / 2;
  const baseY = height - 60;
  const peakY = 80;
  
  // Generate mountain shape
  const mountainPath = useMemo(() => {
    const peakX = centerX;
    const leftBase = 50;
    const rightBase = width - 50;
    
    // Create a rugged mountain silhouette
    const points = [
      `M ${leftBase} ${baseY}`,
      `L ${leftBase + 80} ${baseY - 40}`,
      `L ${leftBase + 150} ${baseY - 100}`,
      `L ${centerX - 100} ${peakY + 80}`,
      `L ${centerX - 40} ${peakY + 20}`,
      `L ${peakX} ${peakY}`,
      `L ${centerX + 40} ${peakY + 20}`,
      `L ${centerX + 100} ${peakY + 80}`,
      `L ${rightBase - 150} ${baseY - 100}`,
      `L ${rightBase - 80} ${baseY - 40}`,
      `L ${rightBase} ${baseY}`,
      `Z`
    ];
    
    return points.join(' ');
  }, []);
  
  // Generate path curves based on scenario metrics
  const generatePath = (scenario: Scenario, side: 'left' | 'right') => {
    const sim = scenario.simulation;
    if (!sim) return '';
    
    const startX = side === 'left' ? centerX - 20 : centerX + 20;
    const endX = side === 'left' ? 120 : width - 120;
    const endY = baseY - 20;
    
    // Use survival rate and score to determine path curvature
    const score = sim.overallScore;
    const curveFactor = (score - 50) / 50; // -1 to 1
    const curveX = side === 'left' 
      ? startX - 150 + (curveFactor * 50)
      : startX + 150 - (curveFactor * 50);
    const curveY = peakY + 150 + (1 - sim.survivalRate) * 100;
    
    const midX = (startX + endX) / 2 + (side === 'left' ? -30 : 30);
    const midY = (peakY + baseY) / 2;
    
    return `M ${startX} ${peakY + 40} Q ${curveX} ${curveY}, ${midX} ${midY} Q ${midX + (side === 'left' ? -60 : 60)} ${midY + 80}, ${endX} ${endY}`;
  };
  
  const pathA = useMemo(() => generatePath(scenarioA, 'left'), [scenarioA]);
  const pathB = useMemo(() => generatePath(scenarioB, 'right'), [scenarioB]);
  
  return (
    <div className="lava-rivers-container">
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="lava-rivers-svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          {/* Mountain gradient */}
          <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(30, 41, 59, 0.9)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 1)" />
          </linearGradient>
          
          {/* Path A (Cyan) gradient */}
          <linearGradient id="pathAGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          
          {/* Path B (Amber) gradient */}
          <linearGradient id="pathBGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          
          {/* Glow filters */}
          <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="glowAmber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background atmosphere */}
        <rect width={width} height={height} fill="rgba(3, 5, 8, 0.5)" />
        
        {/* Mountain silhouette */}
        <path 
          d={mountainPath}
          fill="url(#mountainGradient)"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
        
        {/* Grid lines on mountain */}
        {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
          <line
            key={i}
            x1={100 + ratio * 100}
            y1={baseY - ratio * (baseY - peakY - 50)}
            x2={width - 100 - ratio * 100}
            y2={baseY - ratio * (baseY - peakY - 50)}
            stroke="rgba(255,255,255,0.03)"
            strokeDasharray="4,8"
          />
        ))}
        
        {/* Path A (Baseline - Cyan) */}
        <path
          d={pathA}
          fill="none"
          stroke="url(#pathAGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#glowCyan)"
          opacity="0.9"
        />
        
        {/* Path B (Current - Amber) */}
        <path
          d={pathB}
          fill="none"
          stroke="url(#pathBGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#glowAmber)"
          opacity="0.9"
        />
        
        {/* Peak marker */}
        <circle
          cx={centerX}
          cy={peakY + 30}
          r="8"
          fill="rgba(255,255,255,0.1)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
        <circle
          cx={centerX}
          cy={peakY + 30}
          r="3"
          fill="white"
        />
        
        {/* Peak label */}
        <text
          x={centerX}
          y={peakY + 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize="10"
          fontWeight="600"
          letterSpacing="0.1em"
        >
          OPTIMAL
        </text>
        
        {/* Path endpoints with scores */}
        {simA && (
          <g transform={`translate(100, ${baseY - 30})`}>
            <circle r="12" fill="#22d3ee" opacity="0.2" />
            <circle r="6" fill="#22d3ee" />
            <text
              y="-20"
              textAnchor="middle"
              fill="#22d3ee"
              fontSize="14"
              fontWeight="700"
            >
              {simA.overallScore}
            </text>
            <text
              y="-6"
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="8"
            >
              SCORE
            </text>
          </g>
        )}
        
        {simB && (
          <g transform={`translate(${width - 100}, ${baseY - 30})`}>
            <circle r="12" fill="#fbbf24" opacity="0.2" />
            <circle r="6" fill="#fbbf24" />
            <text
              y="-20"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="14"
              fontWeight="700"
            >
              {simB.overallScore}
            </text>
            <text
              y="-6"
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="8"
            >
              SCORE
            </text>
          </g>
        )}
      </svg>
      
      {/* Overlay labels */}
      <div className="lava-rivers-overlay">
        <div className="path-label path-a">
          <span className="label-dot cyan" />
          <span>{scenarioA.name}</span>
        </div>
        <div className="path-label path-b">
          <span className="label-dot amber" />
          <span>{scenarioB.name}</span>
        </div>
        
        {/* Divergence badge */}
        <div className="divergence-badge">
          <span className="divergence-value">{delta.divergenceScore}%</span>
          <span className="divergence-label">DIVERGENCE</span>
        </div>
      </div>
    </div>
  );
}
