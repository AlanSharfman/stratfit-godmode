// src/components/ScenarioHealthAnimated.tsx
// STRATFIT — Scenario Health Box (EXACT VIDEO REPLICATION)
// Features: 3D tongue facing viewer, bouncing arrow animation

import React, { useState, useEffect } from 'react';

interface ScenarioHealthAnimatedProps {
  health: number;
  scenario: 'base' | 'upside' | 'downside';
  trend: 'strengthening' | 'stable' | 'weakening';
  vsBase: number;
}

export default function ScenarioHealthAnimated({
  health,
  scenario,
  trend,
  vsBase
}: ScenarioHealthAnimatedProps) {
  const [breathPhase, setBreathePhase] = useState(0);
  const [arrowBounce, setArrowBounce] = useState(0);

  useEffect(() => {
    let phase = 0;
    const animate = () => {
      phase += 0.02;
      setBreathePhase(Math.sin(phase) * 8);
      setArrowBounce(Math.abs(Math.sin(phase * 1.5)) * 6);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  const getTrendColor = () => {
    if (trend === 'strengthening') return '#00E5FF';
    if (trend === 'weakening') return '#ef4444';
    return '#f59e0b';
  };

  const getHealthStatus = () => {
    if (health >= 70) return { label: 'Strong', color: '#22c55e' };
    if (health >= 50) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'Weak', color: '#ef4444' };
  };

  const trendColor = getTrendColor();
  const status = getHealthStatus();

  return (
    <div className="scenario-health-animated">
      <div className="health-info-row">
        <div className="health-label">
          <span className="label-eyebrow">SCENARIO</span>
          <span className="label-eyebrow">HEALTH</span>
        </div>
        <div className="scenario-pill" style={{ color: trendColor }}>
          {scenario.toUpperCase()}
        </div>
        <div className="trend-block">
          <span 
            className="trend-arrow" 
            style={{ color: trendColor, transform: `translateY(-${arrowBounce}px)` }}
          >
            ↑
          </span>
          <span className="trend-label" style={{ color: trendColor }}>
            {trend.toUpperCase()}
          </span>
        </div>
        <div className="vs-block" style={{ color: vsBase >= 0 ? '#00E5FF' : '#ef4444' }}>
          {vsBase >= 0 ? '+' : ''}{vsBase}% vs
          <span className="vs-arrow">{vsBase >= 0 ? '↑' : '↓'}</span>
        </div>
        <div className="status-badges">
          <span className="badge base-badge">Base</span>
          <span 
            className="badge status-badge"
            style={{ borderColor: status.color, color: status.color, background: `${status.color}10` }}
          >
            {status.label}
          </span>
          <span className="badge weak-badge">Weak</span>
        </div>
      </div>
      <div className="tongue-3d-container">
        <svg width="100%" height="50" viewBox="0 0 300 50" preserveAspectRatio="none">
          <defs>
            <linearGradient id="tongueGrad3D" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.6"/>
              <stop offset="50%" stopColor={trendColor} stopOpacity="0.4"/>
              <stop offset="100%" stopColor={trendColor} stopOpacity="0.05"/>
            </linearGradient>
            <filter id="glow3D">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path
            d={`M 0,50 L 0,${42 - breathPhase * 0.3} Q 75,${36 - breathPhase * 0.6} 150,${32 - breathPhase} Q 225,${36 - breathPhase * 0.6} 300,${42 - breathPhase * 0.3} L 300,50 Z`}
            fill={trendColor}
            opacity="0.15"
          />
          <path
            d={`M 0,48 L 0,${40 - breathPhase * 0.4} Q 75,${34 - breathPhase * 0.7} 150,${30 - breathPhase} Q 225,${34 - breathPhase * 0.7} 300,${40 - breathPhase * 0.4} L 300,48 Z`}
            fill="url(#tongueGrad3D)"
          />
          <path
            d={`M 0,${40 - breathPhase * 0.4} Q 75,${34 - breathPhase * 0.7} 150,${30 - breathPhase} Q 225,${34 - breathPhase * 0.7} 300,${40 - breathPhase * 0.4}`}
            stroke={trendColor}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow3D)"
            opacity="0.9"
          />
          <path
            d={`M 50,${38 - breathPhase * 0.5} Q 150,${28 - breathPhase} 250,${38 - breathPhase * 0.5}`}
            stroke={trendColor}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>
      <style>{`
        .scenario-health-animated {
          padding: 12px 16px 8px;
          background: rgba(8, 12, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: 10px;
          backdrop-filter: blur(20px);
          width: 360px;
          flex-shrink: 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 229, 255, 0.1) inset;
        }
        .health-info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .health-label {
          display: flex;
          flex-direction: column;
          gap: 0;
          flex-shrink: 0;
          width: 48px;
        }
        .label-eyebrow {
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.35);
          line-height: 1.3;
        }
        .scenario-pill {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
          flex-shrink: 0;
        }
        .trend-block {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .trend-arrow {
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
          display: inline-block;
          transition: transform 0.05s linear;
          text-shadow: 0 0 8px currentColor;
        }
        .trend-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .vs-block {
          font-size: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
        }
        .vs-arrow {
          font-size: 12px;
          font-weight: 700;
        }
        .status-badges {
          display: flex;
          gap: 4px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .badge {
          padding: 3px 7px;
          border-radius: 4px;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.2px;
          border: 1px solid;
        }
        .badge.base-badge {
          background: rgba(0, 229, 255, 0.08);
          border-color: rgba(0, 229, 255, 0.25);
          color: #00E5FF;
        }
        .badge.weak-badge {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.25);
          color: #ef4444;
        }
        .tongue-3d-container {
          margin-top: 6px;
          height: 50px;
          overflow: visible;
        }
      `}</style>
    </div>
  );
}
