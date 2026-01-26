// src/components/compare/StrategicAutopilotPanel.tsx
// Strategic Autopilot Panel - AI executive verdict for Compare view

import React, { useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScenarioData {
  arr: number;
  survival: number;
  runway: number;
  score: number;
}

interface StrategicVerdict {
  verdict: string;
  color: string;
  analysis: string;
  recommendation: string;
}

interface DivergenceMetrics {
  totalArea: number;
  maxDivergence: number;
  maxDivergenceMonth: number;
  momentum: 'accelerating' | 'decelerating' | 'stable';
  crossoverPoints: number[];
  earlyDivergence: number;
  lateDivergence: number;
}

interface StrategicBriefing extends StrategicVerdict {
  divergenceMetrics: DivergenceMetrics;
  executiveSummary: string;
  keyInsight: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATH DIVERGENCE CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

const calculatePathDivergence = (
  scoreA: number, 
  scoreB: number,
  arrA: number,
  arrB: number
): DivergenceMetrics => {
  const MONTHS = 36;
  const divergences: number[] = [];
  const crossoverPoints: number[] = [];
  
  const driftA = (1 - scoreA / 100) * 3.0;
  const driftB = (1 - scoreB / 100) * 3.0;
  
  let prevDiff = 0;
  for (let month = 0; month <= MONTHS; month++) {
    const t = month / MONTHS;
    
    const spreadA = t * t * 2.0;
    const driftTermA = driftA * t * 1.5;
    const xA = -1 * (0.2 + spreadA + driftTermA);
    
    const spreadB = t * t * 2.0;
    const driftTermB = driftB * t * 1.5;
    const xB = 1 * (0.2 + spreadB + driftTermB);
    
    const arrWeight = 1 + (arrB - arrA) / arrA * t;
    const divergence = Math.abs(xB - xA) * arrWeight;
    divergences.push(divergence);
    
    const currentDiff = xB - xA;
    if (month > 0 && Math.sign(currentDiff) !== Math.sign(prevDiff)) {
      crossoverPoints.push(month);
    }
    prevDiff = currentDiff;
  }
  
  const totalArea = divergences.reduce((sum, d) => sum + d, 0);
  const maxDivergence = Math.max(...divergences);
  const maxDivergenceMonth = divergences.indexOf(maxDivergence);
  
  const earlyDivergence = divergences.slice(0, 12).reduce((sum, d) => sum + d, 0);
  const lateDivergence = divergences.slice(24, 36).reduce((sum, d) => sum + d, 0);
  
  const firstHalfGrowth = divergences[18] - divergences[0];
  const secondHalfGrowth = divergences[36] - divergences[18];
  const momentum = secondHalfGrowth > firstHalfGrowth * 1.2 ? 'accelerating' 
    : secondHalfGrowth < firstHalfGrowth * 0.8 ? 'decelerating' 
    : 'stable';
  
  return {
    totalArea,
    maxDivergence,
    maxDivergenceMonth,
    momentum,
    crossoverPoints,
    earlyDivergence,
    lateDivergence
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGIC VERDICT ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const getStrategicVerdict = (scenarioA: ScenarioData, scenarioB: ScenarioData): StrategicVerdict => {
  const arrDelta = ((scenarioB.arr - scenarioA.arr) / scenarioA.arr) * 100;
  const survivalDelta = scenarioB.survival - scenarioA.survival;

  if (arrDelta > 30 && survivalDelta < -20) {
    return {
      verdict: "HIGH-STAKES AGGRESSION",
      color: "#ef4444",
      analysis: `Scenario B accelerates ARR by ${arrDelta.toFixed(0)}%, but creates a 'Survival Gap' of ${Math.abs(survivalDelta).toFixed(0)} points.`,
      recommendation: "Stagger hiring intensity to recover 12 months of runway."
    };
  }

  if (arrDelta > 5 && survivalDelta >= 0) {
    return {
      verdict: "OPTIMAL ASCENT",
      color: "#10b981",
      analysis: "You have found a growth vector that increases revenue without compromising stability.",
      recommendation: "Lock this as your new Baseline Trajectory."
    };
  }

  if (arrDelta < -10 && survivalDelta > 15) {
    return {
      verdict: "DEFENSIVE RETREAT",
      color: "#3b82f6",
      analysis: `Trading ${Math.abs(arrDelta).toFixed(0)}% ARR for ${survivalDelta.toFixed(0)} points of survival.`,
      recommendation: "Acceptable for bridge periods. Set a 6-month review trigger."
    };
  }

  if (arrDelta < -5 && survivalDelta < -10) {
    return {
      verdict: "CRITICAL DIVERGENCE",
      color: "#dc2626",
      analysis: "Both growth and stability are declining. This trajectory leads to accelerated runway depletion.",
      recommendation: "Revert to Baseline immediately. Review Cost Discipline and Market Volatility levers."
    };
  }

  return {
    verdict: "MARGINAL VARIANCE",
    color: "#fbbf24",
    analysis: "Strategic divergence is minimal. Current lever shifts do not significantly alter outcomes.",
    recommendation: "Explore more aggressive Pricing Power or Demand Strength."
  };
};

const getStrategicBriefing = (scenarioA: ScenarioData, scenarioB: ScenarioData): StrategicBriefing => {
  const baseVerdict = getStrategicVerdict(scenarioA, scenarioB);
  const divergence = calculatePathDivergence(scenarioA.score, scenarioB.score, scenarioA.arr, scenarioB.arr);
  
  const arrDeltaPercent = ((scenarioB.arr - scenarioA.arr) / scenarioA.arr) * 100;
  const survivalDelta = scenarioB.survival - scenarioA.survival;
  
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  if (survivalDelta < -15 || divergence.momentum === 'accelerating' && arrDeltaPercent < 0) {
    riskLevel = 'CRITICAL';
  } else if (survivalDelta < -5 || divergence.maxDivergence > 8) {
    riskLevel = 'HIGH';
  } else if (Math.abs(arrDeltaPercent) > 10 || divergence.lateDivergence > divergence.earlyDivergence * 2) {
    riskLevel = 'MODERATE';
  } else {
    riskLevel = 'LOW';
  }
  
  let executiveSummary: string;
  let keyInsight: string;
  
  if (divergence.momentum === 'accelerating') {
    executiveSummary = `Path divergence is ACCELERATING. The gap between trajectories widens significantly after Month ${divergence.maxDivergenceMonth}, reaching ${divergence.maxDivergence.toFixed(1)} units of strategic separation.`;
    keyInsight = `⚠️ Late-stage divergence (${divergence.lateDivergence.toFixed(1)}) is ${(divergence.lateDivergence / divergence.earlyDivergence).toFixed(1)}x higher than early-stage. Decision impact compounds over time.`;
  } else if (divergence.momentum === 'decelerating') {
    executiveSummary = `Path divergence is STABILIZING. Initial separation of ${divergence.earlyDivergence.toFixed(1)} units narrows to ${divergence.lateDivergence.toFixed(1)} units by Month 36.`;
    keyInsight = `✓ Trajectories are converging. Strategic choices become less critical after Month ${Math.floor(divergence.maxDivergenceMonth)}.`;
  } else {
    executiveSummary = `Path divergence is STABLE at ${divergence.totalArea.toFixed(1)} cumulative units over 36 months. Peak separation occurs at Month ${divergence.maxDivergenceMonth}.`;
    keyInsight = `→ Consistent ${Math.abs(arrDeltaPercent).toFixed(0)}% ARR variance maintained throughout projection period.`;
  }
  
  if (divergence.crossoverPoints.length > 0) {
    keyInsight += ` Paths intersect at Month ${divergence.crossoverPoints[0]} — critical decision point.`;
  }
  
  return {
    ...baseVerdict,
    divergenceMetrics: divergence,
    executiveSummary,
    keyInsight,
    riskLevel
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGIC AUTOPILOT PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function StrategicAutopilotPanel({ scenarioA, scenarioB }: { scenarioA: ScenarioData; scenarioB: ScenarioData }) {
  const briefing = useMemo(() => getStrategicBriefing(scenarioA, scenarioB), [scenarioA, scenarioB]);
  const { divergenceMetrics: dm } = briefing;

  const riskColors = {
    'LOW': '#10b981',
    'MODERATE': '#fbbf24', 
    'HIGH': '#f97316',
    'CRITICAL': '#ef4444'
  };

  return (
    <div 
      className="w-full overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, rgba(10,15,25,0.98) 0%, rgba(5,8,15,0.99) 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
        border: '1px solid rgba(0,217,255,0.15)',
        borderRadius: '12px',
      }}
    >
      {/* Header with Risk Indicator */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-transparent border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(0,217,255,0.5)]">
            ⚡
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/70 block">STRATEGIC AUTOPILOT</span>
            <span className="text-[8px] text-cyan-400/60 tracking-wider">PATH DIVERGENCE ANALYSIS</span>
          </div>
        </div>
        <div 
          className="px-2 py-1 rounded text-[9px] font-black tracking-wider"
          style={{ 
            backgroundColor: `${riskColors[briefing.riskLevel]}20`,
            color: riskColors[briefing.riskLevel],
            border: `1px solid ${riskColors[briefing.riskLevel]}40`
          }}
        >
          {briefing.riskLevel} RISK
        </div>
      </div>
      
      <div className="p-4">
        {/* Verdict Badge */}
        <div 
          className="inline-block px-4 py-2 rounded-lg text-xs font-black tracking-wider mb-3"
          style={{ 
            backgroundColor: `${briefing.color}15`, 
            color: briefing.color,
            border: `1px solid ${briefing.color}40`,
            boxShadow: `0 0 20px ${briefing.color}25`
          }}
        >
          {briefing.verdict}
        </div>
        
        {/* Executive Summary */}
        <p className="text-xs text-white/85 leading-relaxed mb-3">
          {briefing.executiveSummary}
        </p>
        
        {/* Divergence Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-wider text-white/40 mb-1">TOTAL AREA</div>
            <div className="text-sm font-black text-cyan-400">{dm.totalArea.toFixed(1)}</div>
            <div className="text-[7px] text-white/30">units²</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-wider text-white/40 mb-1">MAX GAP</div>
            <div className="text-sm font-black text-amber-400">{dm.maxDivergence.toFixed(1)}</div>
            <div className="text-[7px] text-white/30">@ Month {dm.maxDivergenceMonth}</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-wider text-white/40 mb-1">MOMENTUM</div>
            <div className={`text-sm font-black ${
              dm.momentum === 'accelerating' ? 'text-red-400' : 
              dm.momentum === 'decelerating' ? 'text-emerald-400' : 'text-white/60'
            }`}>
              {dm.momentum === 'accelerating' ? '↗' : dm.momentum === 'decelerating' ? '↘' : '→'}
            </div>
            <div className="text-[7px] text-white/30">{dm.momentum}</div>
          </div>
        </div>
        
        {/* Key Insight */}
        <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 mb-3">
          <p className="text-[10px] text-cyan-300/90 leading-relaxed">
            {briefing.keyInsight}
          </p>
        </div>
        
        {/* Original Analysis */}
        <p className="text-xs text-white/70 leading-relaxed mb-3">
          {briefing.analysis}
        </p>
        
        {/* Recommendation */}
        <div className="pt-3 border-t border-white/10">
          <div className="text-[9px] font-bold tracking-[0.15em] text-white/40 mb-2">
            ⟐ BOARD RECOMMENDATION
          </div>
          <p className="text-xs text-white/80 leading-relaxed font-medium">
            {briefing.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

export default StrategicAutopilotPanel;

