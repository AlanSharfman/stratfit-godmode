// src/components/mountain/GodModePhotorealistic.tsx
// STRATFIT — HOLLYWOOD HYBRID: Cinema-Quality Backplate + Live Data Overlay
// The "VFX Compositor" approach for production-grade visualization

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';
import './GodModePhotorealistic.css';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ScenarioData {
  arr: number;
  survival: number;
  runway: number;
  cash: number;
  score: number;
  trajectory: number[];
}

interface Briefing {
  verdict: string;
  verdictColor: string;
  analysis: string;
  recommendation: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELTA NARRATIVE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const generateBriefing = (scenarioA: ScenarioData, scenarioB: ScenarioData): Briefing => {
  const arrDelta = ((scenarioB.arr - scenarioA.arr) / scenarioA.arr) * 100;
  const survivalDelta = scenarioB.survival - scenarioA.survival;

  if (arrDelta > 30 && survivalDelta < -20) {
    return {
      verdict: "HIGH-STAKES AGGRESSION",
      verdictColor: "#ef4444",
      analysis: `Scenario B accelerates ARR by ${arrDelta.toFixed(0)}%, but creates a 'Survival Gap' of ${Math.abs(survivalDelta).toFixed(0)} points.`,
      recommendation: "Consider staggered hiring intensity to recover 12 months of runway."
    };
  }

  if (arrDelta > 5 && survivalDelta >= 0) {
    return {
      verdict: "OPTIMAL ASCENT",
      verdictColor: "#10b981",
      analysis: "You have found a growth vector that increases revenue without compromising stability.",
      recommendation: "Lock this configuration as your new Baseline Trajectory."
    };
  }

  if (arrDelta < -10 && survivalDelta > 15) {
    return {
      verdict: "DEFENSIVE RETREAT",
      verdictColor: "#3b82f6",
      analysis: `Trading ${Math.abs(arrDelta).toFixed(0)}% ARR for ${survivalDelta.toFixed(0)} points of survival.`,
      recommendation: "Acceptable for bridge periods. Set a 6-month review trigger."
    };
  }

  if (arrDelta < -5 && survivalDelta < -10) {
    return {
      verdict: "CRITICAL DIVERGENCE",
      verdictColor: "#dc2626",
      analysis: "Both growth and stability are declining. This trajectory leads to accelerated runway depletion.",
      recommendation: "Revert to Baseline immediately. Review Cost Discipline and Market Volatility levers."
    };
  }

  return {
    verdict: "MARGINAL VARIANCE",
    verdictColor: "#fbbf24",
    analysis: "Strategic divergence is minimal. Current lever shifts do not significantly alter outcomes.",
    recommendation: "Explore more aggressive Pricing Power or Demand Strength adjustments."
  };
};

// Generate trajectory data (36 months)
const generateTrajectory = (baseArr: number, score: number): number[] => {
  const trajectory: number[] = [];
  let current = baseArr / 1000000;
  const growthRate = 1 + (score / 1000);
  
  for (let i = 0; i < 36; i++) {
    trajectory.push(current);
    current *= growthRate;
    current += (Math.random() - 0.5) * 0.1;
  }
  return trajectory;
};

// Generate lava path with natural curves
const generateLavaPath = (score: number, side: 'left' | 'right') => {
  const drift = (100 - score) / 100;
  const sideMultiplier = side === 'left' ? -1 : 1;
  
  const peakX = 500;
  const peakY = 95;
  
  const points = [
    { x: peakX, y: peakY },
    { x: peakX + sideMultiplier * 15 * drift, y: 140 },
    { x: peakX + sideMultiplier * 40 * drift, y: 200 },
    { x: peakX + sideMultiplier * 70 * drift, y: 260 },
    { x: peakX + sideMultiplier * 100 * drift, y: 320 },
    { x: peakX + sideMultiplier * 130 * drift, y: 380 },
    { x: peakX + sideMultiplier * 160 * drift, y: 440 },
    { x: peakX + sideMultiplier * (180 + drift * 80), y: 520 },
    { x: peakX + sideMultiplier * (200 + drift * 100), y: 600 },
  ];
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    const cpY = prev.y + (curr.y - prev.y) * 0.7;
    path += ` Q ${cpX} ${cpY} ${curr.x} ${curr.y}`;
  }
  
  return path;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT - HOLLYWOOD HYBRID TECHNIQUE
// ═══════════════════════════════════════════════════════════════════════════════

export default function GodModePhotorealistic() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; svgX: number } | null>(null);
  
  // Get simulation data
  const summary = useSimulationStore((s) => s.summary);
  const savedBaseline = useSavedSimulationsStore((s) => s.simulations.find(sim => sim.isBaseline));
  
  // Scenario data
  const scenarioA: ScenarioData = useMemo(() => {
    const score = savedBaseline?.summary.overallScore || 72;
    const arr = savedBaseline?.summary.arrMedian || 2100000;
    return {
      arr,
      survival: savedBaseline?.summary.survivalRate ? savedBaseline.summary.survivalRate * 100 : 78,
      runway: savedBaseline?.summary.runwayMedian || 18,
      cash: savedBaseline?.summary.cashMedian || 4500000,
      score,
      trajectory: generateTrajectory(arr, score),
    };
  }, [savedBaseline]);
  
  const scenarioB: ScenarioData = useMemo(() => {
    const score = summary?.overallScore || 65;
    const arr = summary?.arrMedian || 2400000;
    return {
      arr,
      survival: summary?.survivalRate ? summary.survivalRate * 100 : 72,
      runway: summary?.runwayMedian || 16,
      cash: summary?.cashMedian || 4200000,
      score,
      trajectory: generateTrajectory(arr, score),
    };
  }, [summary]);
  
  // Generate briefing
  const briefing = useMemo(() => generateBriefing(scenarioA, scenarioB), [scenarioA, scenarioB]);
  
  // Check if paths are converged
  const isConverged = Math.abs(scenarioA.score - scenarioB.score) < 5;
  
  // Format currency
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };
  
  // Delta Blade hover
  const getMonthFromX = (svgX: number): number => {
    const normalized = (svgX - 100) / 800;
    return Math.max(0, Math.min(35, Math.round(normalized * 35)));
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const svgX = (x / rect.width) * 1000;
    const svgY = (y / rect.height) * 700;
    
    if (svgX > 100 && svgX < 900 && svgY > 80 && svgY < 600) {
      setHoverPosition({ x, y, svgX });
    } else {
      setHoverPosition(null);
    }
  };
  
  const deltaBladeData = useMemo(() => {
    if (!hoverPosition) return null;
    const month = getMonthFromX(hoverPosition.svgX);
    const valA = scenarioA.trajectory[month] || 0;
    const valB = scenarioB.trajectory[month] || 0;
    const delta = valB - valA;
    return { month, valA, valB, delta };
  }, [hoverPosition, scenarioA.trajectory, scenarioB.trajectory]);

  return (
    <div 
      className="godmode-hybrid-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '500px',
        overflow: 'hidden',
        background: '#030508'
      }}
    >
      
      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 1: CINEMATIC BACKPLATE (The Realism)
          Multi-layered CSS gradients creating photorealistic mountain
          ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="cinema-backplate" 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: `
            radial-gradient(1px 1px at 10% 8%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 25% 12%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 40% 5%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1.2px 1.2px at 70% 8%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 4%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(ellipse 8% 4% at 50% 12%, rgba(200,220,255,0.3) 0%, transparent 70%),
            linear-gradient(145deg, transparent 0%, transparent 10%, rgba(140,160,200,0.08) 11%, rgba(100,130,180,0.12) 14%, rgba(80,110,160,0.08) 18%, transparent 22%),
            linear-gradient(168deg, transparent 0%, transparent 9%, #1a2540 10%, #162035 15%, #0f1625 25%, #0a1018 40%, #050810 60%),
            linear-gradient(155deg, transparent 0%, transparent 12%, #14203a 13%, #0f1828 25%, #080f18 45%, #040608 70%),
            linear-gradient(185deg, transparent 0%, transparent 11%, #16223c 12%, #101a2a 24%, #0a1018 42%, #050810 65%),
            linear-gradient(160deg, transparent 0%, transparent 28%, rgba(20,35,60,0.6) 30%, rgba(15,25,45,0.4) 40%, transparent 55%),
            linear-gradient(200deg, transparent 0%, transparent 26%, rgba(22,38,65,0.5) 28%, rgba(16,28,50,0.3) 38%, transparent 50%),
            radial-gradient(ellipse 120% 35% at 50% 85%, rgba(15,40,80,0.4) 0%, rgba(8,20,45,0.2) 40%, transparent 70%),
            linear-gradient(180deg, #020408 0%, #050a14 15%, #081020 35%, #0a1830 60%, #0c2040 100%)
          `
        }}
      />
      
      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 2: VOLUMETRIC FOG (Depth Enhancement)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="volumetric-fog" />
      <div className="top-atmosphere" />
      
      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 3: LIVE DATA SVG (Neon Light Projection)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="data-projection-layer">
        <svg 
          ref={svgRef}
          viewBox="0 0 1000 700" 
          className="data-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPosition(null)}
        >
          <defs>
            {/* POWERFUL NEON BLOOM - Makes lines look like "light" not "paint" */}
            <filter id="neon-bloom-cyan" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <filter id="neon-bloom-orange" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <filter id="neon-bloom-white" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* CONVERGED STATE - Single white/blue glowing path */}
          {isConverged ? (
            <g className="converged-path">
              <path
                d={generateLavaPath((scenarioA.score + scenarioB.score) / 2, 'left')}
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#neon-bloom-white)"
                className="neon-line converged"
              />
              {/* Animated particles */}
              {[0, 1.2, 2.4].map((delay, i) => (
                <circle key={i} r="4" fill="#ffffff" className="flow-particle">
                  <animateMotion
                    dur="4s"
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                    path={generateLavaPath((scenarioA.score + scenarioB.score) / 2, 'left')}
                  />
                </circle>
              ))}
            </g>
          ) : (
            <>
              {/* SCENARIO A (Cyan) - Baseline */}
              <g className="scenario-path cyan">
                {/* Outer glow halo */}
                <path
                  d={generateLavaPath(scenarioA.score, 'left')}
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.15"
                  filter="url(#neon-bloom-cyan)"
                />
                {/* Core neon line */}
                <path
                  d={generateLavaPath(scenarioA.score, 'left')}
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#neon-bloom-cyan)"
                  className="neon-line cyan"
                />
                {/* Hot white core */}
                <path
                  d={generateLavaPath(scenarioA.score, 'left')}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                {/* Animated particles */}
                {[0, 1.5, 3].map((delay, i) => (
                  <circle key={i} r="4" fill="#00ffff" filter="url(#neon-bloom-cyan)" className="flow-particle">
                    <animateMotion
                      dur="5s"
                      repeatCount="indefinite"
                      begin={`${delay}s`}
                      path={generateLavaPath(scenarioA.score, 'left')}
                    />
                  </circle>
                ))}
              </g>
              
              {/* SCENARIO B (Orange) - Exploration */}
              <g className="scenario-path orange">
                {/* Outer glow halo */}
                <path
                  d={generateLavaPath(scenarioB.score, 'right')}
                  fill="none"
                  stroke="#ffaa00"
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.15"
                  filter="url(#neon-bloom-orange)"
                />
                {/* Core neon line */}
                <path
                  d={generateLavaPath(scenarioB.score, 'right')}
                  fill="none"
                  stroke="#ffaa00"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#neon-bloom-orange)"
                  className="neon-line orange"
                />
                {/* Hot white core */}
                <path
                  d={generateLavaPath(scenarioB.score, 'right')}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                {/* Animated particles */}
                {[0, 1.5, 3].map((delay, i) => (
                  <circle key={i} r="4" fill="#ffaa00" filter="url(#neon-bloom-orange)" className="flow-particle">
                    <animateMotion
                      dur="5s"
                      repeatCount="indefinite"
                      begin={`${delay}s`}
                      path={generateLavaPath(scenarioB.score, 'right')}
                    />
                  </circle>
                ))}
              </g>
            </>
          )}
          
          {/* DELTA BLADE - Vertical scan line */}
          {hoverPosition && (
            <g className="delta-blade-svg">
              <line 
                x1={hoverPosition.svgX} y1="80" 
                x2={hoverPosition.svgX} y2="620" 
                stroke="rgba(255,255,255,0.4)" 
                strokeWidth="1"
                strokeDasharray="6,4"
              />
              <line 
                x1={hoverPosition.svgX} y1="80" 
                x2={hoverPosition.svgX} y2="620" 
                stroke="rgba(255,255,255,0.8)" 
                strokeWidth="0.5"
              />
            </g>
          )}
        </svg>
        
        {/* Delta Blade HUD Overlay */}
        {hoverPosition && deltaBladeData && (
          <div 
            className="delta-blade-hud"
            style={{ 
              left: hoverPosition.x + 20, 
              top: Math.min(hoverPosition.y, 400)
            }}
          >
            <div className="blade-month">Month {deltaBladeData.month}</div>
            <div className="blade-values">
              <div className="blade-val a">
                <span className="label">Baseline</span>
                <span className="value">${deltaBladeData.valA.toFixed(1)}M</span>
              </div>
              <div className="blade-val b">
                <span className="label">Current</span>
                <span className="value">${deltaBladeData.valB.toFixed(1)}M</span>
              </div>
            </div>
            <div className={`blade-delta ${deltaBladeData.delta >= 0 ? 'positive' : 'negative'}`}>
              <span className="arrow">{deltaBladeData.delta >= 0 ? '▲' : '▼'}</span>
              <span className="delta-val">${Math.abs(deltaBladeData.delta).toFixed(2)}M</span>
            </div>
          </div>
        )}
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 4: GLASS HUD PANELS
          ═══════════════════════════════════════════════════════════════════ */}
      
      {/* KPI Comparison Bar */}
      <div className="hud-kpi-bar">
        <div className="kpi-scenario scenario-a">
          <span className="scenario-tag">BASELINE (A)</span>
          <div className="kpi-metrics">
            <div className="kpi"><span className="label">ARR</span><span className="value">{formatCurrency(scenarioA.arr)}</span></div>
            <div className="kpi"><span className="label">Survival</span><span className="value">{scenarioA.survival.toFixed(0)}%</span></div>
            <div className="kpi"><span className="label">Runway</span><span className="value">{scenarioA.runway.toFixed(0)} Mo</span></div>
            <div className="kpi"><span className="label">Score</span><span className="value cyan">{scenarioA.score}</span></div>
          </div>
        </div>
        
        <div className={`divergence-badge ${isConverged ? 'converged' : ''}`}>
          <span className="div-label">{isConverged ? 'SYNCED' : 'DELTA'}</span>
          <span className="div-value" style={{ color: isConverged ? '#ffffff' : briefing.verdictColor }}>
            {isConverged ? '✓' : `${scenarioB.score - scenarioA.score >= 0 ? '+' : ''}${(scenarioB.score - scenarioA.score).toFixed(0)}`}
          </span>
        </div>
        
        <div className="kpi-scenario scenario-b">
          <span className="scenario-tag">EXPLORATION (B)</span>
          <div className="kpi-metrics">
            <div className="kpi"><span className="label">ARR</span><span className="value">{formatCurrency(scenarioB.arr)}</span></div>
            <div className="kpi"><span className="label">Survival</span><span className="value">{scenarioB.survival.toFixed(0)}%</span></div>
            <div className="kpi"><span className="label">Runway</span><span className="value">{scenarioB.runway.toFixed(0)} Mo</span></div>
            <div className="kpi"><span className="label">Score</span><span className="value orange">{scenarioB.score}</span></div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="hud-legend">
        <div className="legend-item">
          <span className="legend-dot cyan" />
          <span>Baseline (A)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot orange" />
          <span>Exploration (B)</span>
        </div>
      </div>
      
      {/* Strategic Autopilot */}
      <div className="hud-autopilot">
        <div className="autopilot-header">
          <span className="icon">🎯</span>
          <span className="title">STRATEGIC AUTOPILOT</span>
        </div>
        <div className="autopilot-content">
          <div 
            className="verdict-badge" 
            style={{ background: briefing.verdictColor + '20', borderColor: briefing.verdictColor }}
          >
            <span style={{ color: briefing.verdictColor }}>{briefing.verdict}</span>
          </div>
          <p className="analysis">{briefing.analysis}</p>
          <div className="recommendation">
            <span className="rec-label">RECOMMENDATION:</span>
            <span className="rec-text">{briefing.recommendation}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
