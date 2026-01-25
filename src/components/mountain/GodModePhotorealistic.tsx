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

// CONTOUR-STYLE paths - horizontal lines tracing mountain topology
// Like the reference image with neon lines following elevation bands
const generateContourPath = (elevation: number, scenario: 'baseline' | 'exploration', score: number) => {
  // elevation: 0 = bottom, 1 = peak
  // Score affects vertical offset between scenarios
  const offset = scenario === 'exploration' ? (100 - score) * 0.12 : 0;
  
  // Y position for this elevation level
  const baseY = 600 - (elevation * 500);
  const y = baseY + offset;
  
  // Width narrows toward peak
  const width = 900 * (1 - elevation * 0.6);
  const startX = 500 - width / 2;
  const endX = 500 + width / 2;
  
  // Peak height varies by elevation
  const peakH = 20 + elevation * 50;
  const cx = 500; // center
  
  // Create path following mountain contours with multiple peaks
  return `M ${startX} ${y + 15}
    Q ${startX + width * 0.15} ${y}, ${startX + width * 0.25} ${y - peakH * 0.3}
    Q ${startX + width * 0.35} ${y - peakH * 0.5}, ${startX + width * 0.42} ${y - peakH * 0.35}
    Q ${cx - 20} ${y - peakH * 0.7}, ${cx} ${y - peakH}
    Q ${cx + 20} ${y - peakH * 0.7}, ${startX + width * 0.58} ${y - peakH * 0.35}
    Q ${startX + width * 0.65} ${y - peakH * 0.5}, ${startX + width * 0.75} ${y - peakH * 0.3}
    Q ${startX + width * 0.85} ${y}, ${endX} ${y + 15}`;
};

// Elevation levels for contour lines
const CONTOUR_LEVELS = [0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.84, 0.94];

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
          LAYER 1: CINEMATIC MOUNTAIN BACKPLATE
          CSS-rendered mountain that works immediately
          ═══════════════════════════════════════════════════════════════════ */}
      
      {/* SKY GRADIENT - Dusk atmosphere */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        background: `linear-gradient(180deg, 
          #050a15 0%,
          #0a1525 10%,
          #0f2035 20%,
          #152a45 30%,
          #1a3555 40%,
          #254565 50%,
          #2d5575 58%,
          #254560 65%,
          #1a3548 75%,
          #0f2030 85%,
          #0a1520 95%,
          #050a10 100%
        )`
      }} />
      
      {/* STARS */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: `
          radial-gradient(1.2px 1.2px at 8% 6%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 15% 12%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 25% 4%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 35% 10%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1.3px 1.3px at 48% 7%, rgba(255,255,255,0.8) 0%, transparent 100%),
          radial-gradient(1px 1px at 58% 14%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1.4px 1.4px at 72% 5%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 82% 11%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1.2px 1.2px at 92% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(0.8px 0.8px at 20% 18%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(0.8px 0.8px at 65% 16%, rgba(255,255,255,0.4) 0%, transparent 100%)
        `,
        pointerEvents: 'none'
      }} />
      
      {/* DISTANT MOUNTAIN RANGE - Far background */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '55%',
        zIndex: 2,
        background: 'linear-gradient(180deg, transparent 0%, rgba(20,40,65,0.5) 20%, rgba(15,30,50,0.7) 50%, rgba(12,24,40,0.85) 100%)',
        clipPath: 'polygon(0% 100%, 0% 45%, 8% 40%, 18% 35%, 28% 42%, 38% 32%, 45% 38%, 52% 30%, 58% 36%, 68% 28%, 78% 38%, 88% 32%, 100% 40%, 100% 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* MIDDLE MOUNTAIN RANGE */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65%',
        zIndex: 3,
        background: 'linear-gradient(180deg, transparent 0%, rgba(18,35,55,0.6) 15%, rgba(14,28,45,0.8) 40%, rgba(10,20,35,0.95) 70%, #08141f 100%)',
        clipPath: 'polygon(0% 100%, 0% 50%, 10% 45%, 18% 42%, 25% 48%, 32% 38%, 38% 44%, 44% 32%, 48% 22%, 50% 15%, 52% 22%, 56% 32%, 62% 44%, 68% 38%, 75% 48%, 82% 42%, 90% 48%, 100% 45%, 100% 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* MAIN MOUNTAIN - Central peak */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '72%',
        zIndex: 4,
        background: `linear-gradient(175deg, 
          transparent 0%,
          transparent 12%,
          rgba(45,70,100,0.4) 14%,
          rgba(30,50,75,0.6) 18%,
          rgba(22,40,62,0.8) 25%,
          rgba(15,28,45,0.9) 35%,
          rgba(10,20,35,0.95) 50%,
          #0a1422 70%,
          #060e18 100%
        )`,
        clipPath: 'polygon(0% 100%, 0% 60%, 12% 52%, 22% 48%, 30% 42%, 38% 35%, 44% 26%, 47% 18%, 50% 12%, 53% 18%, 56% 26%, 62% 35%, 70% 42%, 78% 48%, 88% 52%, 100% 58%, 100% 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* SNOW CAP GLOW */}
      <div style={{
        position: 'absolute',
        top: '16%',
        left: '47%',
        width: '6%',
        height: '10%',
        zIndex: 5,
        background: 'radial-gradient(ellipse 100% 80% at 50% 30%, rgba(180,200,230,0.3) 0%, rgba(140,170,210,0.15) 40%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      {/* FOREGROUND RIDGE */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '22%',
        zIndex: 6,
        background: 'linear-gradient(180deg, rgba(6,12,20,0.85) 0%, #040810 40%, #020406 100%)',
        clipPath: 'polygon(0% 100%, 0% 35%, 12% 28%, 25% 38%, 38% 22%, 50% 32%, 62% 18%, 75% 30%, 88% 22%, 100% 35%, 100% 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* HORIZON GLOW */}
      <div style={{
        position: 'absolute',
        bottom: '25%',
        left: 0,
        right: 0,
        height: '30%',
        zIndex: 1,
        background: 'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(40,70,110,0.2) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      
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
          
          {/* GRID OVERLAY - Coordinate system matching mountain contours */}
          <g className="grid-overlay" opacity="0.35" style={{ mixBlendMode: 'screen' }}>
            {/* Curved contour lines following mountain shape */}
            {[0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].map((level, i) => {
              const y = 150 + (1 - level) * 450;
              const spread = (1 - level) * 350;
              return (
                <g key={`contour-${i}`}>
                  <path 
                    d={`M ${100 - spread * 0.3} ${y + 30} Q 500 ${y - 20} ${900 + spread * 0.3} ${y + 30}`}
                    fill="none" 
                    stroke="rgba(80,140,200,0.4)" 
                    strokeWidth="0.8"
                    strokeDasharray="3,6"
                  />
                  {/* Left label */}
                  <text 
                    x={70 - spread * 0.25} 
                    y={y + 35} 
                    fill="rgba(100,160,220,0.6)" 
                    fontSize="11" 
                    fontFamily="monospace"
                  >
                    {level.toFixed(1)}
                  </text>
                  {/* Right label */}
                  <text 
                    x={930 + spread * 0.25} 
                    y={y + 35} 
                    fill="rgba(100,160,220,0.6)" 
                    fontSize="11" 
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {level.toFixed(1)}
                  </text>
                </g>
              );
            })}
            
            {/* Peak marker with glow */}
            <circle cx="500" cy="120" r="6" fill="rgba(255,255,255,0.9)" />
            <circle cx="500" cy="120" r="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <circle cx="500" cy="120" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </g>
          
          {/* CONTOUR-STYLE VISUALIZATION - Multiple elevation bands */}
          {/* Like the reference image with neon lines tracing mountain topology */}
          
          {/* BASELINE CONTOURS (Cyan) */}
          <g className="baseline-contours">
            {CONTOUR_LEVELS.map((elev, i) => (
              <g key={`cyan-${i}`}>
                {/* Glow layer */}
                <path
                  d={generateContourPath(elev, 'baseline', scenarioA.score)}
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity={0.15}
                  filter="url(#neon-bloom-cyan)"
                />
                {/* Core line */}
                <path
                  d={generateContourPath(elev, 'baseline', scenarioA.score)}
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth={2.2 - elev * 0.6}
                  strokeLinecap="round"
                  opacity={0.95 - elev * 0.15}
                  filter="url(#neon-bloom-cyan)"
                  style={{ mixBlendMode: 'screen' }}
                />
                {/* White hot core */}
                <path
                  d={generateContourPath(elev, 'baseline', scenarioA.score)}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={0.6}
                  strokeLinecap="round"
                  opacity={0.5 - elev * 0.15}
                />
                {/* Flow particle */}
                {i % 2 === 0 && (
                  <circle r="3" fill="#00ffff" filter="url(#neon-bloom-cyan)">
                    <animateMotion
                      dur={`${10 + i * 3}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.8}s`}
                      path={generateContourPath(elev, 'baseline', scenarioA.score)}
                    />
                  </circle>
                )}
              </g>
            ))}
          </g>
          
          {/* EXPLORATION CONTOURS (Orange) */}
          <g className="exploration-contours">
            {CONTOUR_LEVELS.map((elev, i) => (
              <g key={`orange-${i}`}>
                {/* Glow layer */}
                <path
                  d={generateContourPath(elev, 'exploration', scenarioB.score)}
                  fill="none"
                  stroke="#ff8800"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity={0.15}
                  filter="url(#neon-bloom-orange)"
                />
                {/* Core line */}
                <path
                  d={generateContourPath(elev, 'exploration', scenarioB.score)}
                  fill="none"
                  stroke="#ff8800"
                  strokeWidth={2.2 - elev * 0.6}
                  strokeLinecap="round"
                  opacity={0.95 - elev * 0.15}
                  filter="url(#neon-bloom-orange)"
                  style={{ mixBlendMode: 'screen' }}
                />
                {/* White hot core */}
                <path
                  d={generateContourPath(elev, 'exploration', scenarioB.score)}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={0.6}
                  strokeLinecap="round"
                  opacity={0.4 - elev * 0.12}
                />
                {/* Flow particle */}
                {i % 2 === 1 && (
                  <circle r="3" fill="#ff8800" filter="url(#neon-bloom-orange)">
                    <animateMotion
                      dur={`${12 + i * 3}s`}
                      repeatCount="indefinite"
                      begin={`${i * 1.2}s`}
                      path={generateContourPath(elev, 'exploration', scenarioB.score)}
                    />
                  </circle>
                )}
              </g>
            ))}
          </g>
          
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
