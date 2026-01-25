// src/components/impact/ImpactGodMode.tsx
// STRATFIT — GOD MODE IMPACT: Strategic Command Center
// "Stop guessing. Know exactly where to focus."

import React, { useMemo, useState } from 'react';
import { useSimulationStore } from '@/state/simulationStore';
import { useLeverStore } from '@/state/leverStore';
import './ImpactGodMode.css';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface LeverImpact {
  id: string;
  name: string;
  currentValue: number;
  impactScore: number; // 0-100, how much this lever affects outcomes
  dollarImpact: number; // $ value per 1% change
  direction: 'growth' | 'risk'; // Does increasing help or hurt?
  effort: 'low' | 'medium' | 'high'; // How hard to change
  category: 'growth' | 'operational' | 'risk';
  insight: string;
}

interface KillZone {
  lever: string;
  threshold: number;
  currentValue: number;
  consequence: string;
  timeToImpact: string;
  severity: 'warning' | 'critical';
}

interface Unlock {
  name: string;
  requirement: string;
  currentProgress: number;
  targetValue: number;
  reward: string;
  rewardValue: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPACT CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const calculateLeverImpacts = (levers: Record<string, number>, summary: any): LeverImpact[] => {
  const baseARR = summary?.arrMedian || 2000000;
  
  const impacts: LeverImpact[] = [
    {
      id: 'demandStrength',
      name: 'Demand Strength',
      currentValue: levers.demandStrength || 50,
      impactScore: 92,
      dollarImpact: Math.round(baseARR * 0.028), // 2.8% ARR per point
      direction: 'growth' as const,
      effort: 'high' as const,
      category: 'growth' as const,
      insight: 'Your highest-leverage growth driver. Each point = new customers.',
    },
    {
      id: 'pricingPower',
      name: 'Pricing Power',
      currentValue: levers.pricingPower || 50,
      impactScore: 85,
      dollarImpact: Math.round(baseARR * 0.032), // 3.2% ARR per point
      direction: 'growth' as const,
      effort: 'low' as const,
      category: 'growth' as const,
      insight: 'Fastest path to profitability. Increase without losing customers.',
    },
    {
      id: 'costDiscipline',
      name: 'Cost Discipline',
      currentValue: levers.costDiscipline || 50,
      impactScore: 78,
      dollarImpact: Math.round(baseARR * 0.018), // Runway extension value
      direction: 'growth' as const,
      effort: 'medium' as const,
      category: 'operational' as const,
      insight: 'Every dollar saved = dollar available for growth or runway.',
    },
    {
      id: 'expansionVelocity',
      name: 'Expansion Velocity',
      currentValue: levers.expansionVelocity || 50,
      impactScore: 72,
      dollarImpact: Math.round(baseARR * 0.022),
      direction: 'growth' as const,
      effort: 'medium' as const,
      category: 'growth' as const,
      insight: 'Net revenue retention. Grow revenue from existing customers.',
    },
    {
      id: 'hiringIntensity',
      name: 'Hiring Intensity',
      currentValue: levers.hiringIntensity || 50,
      impactScore: 65,
      dollarImpact: Math.round(baseARR * -0.015), // Costs money
      direction: 'risk' as const,
      effort: 'high' as const,
      category: 'operational' as const,
      insight: 'More hires = more burn. Only hire for clear revenue drivers.',
    },
    {
      id: 'marketVolatility',
      name: 'Market Volatility',
      currentValue: levers.marketVolatility || 50,
      impactScore: 58,
      dollarImpact: Math.round(baseARR * -0.025),
      direction: 'risk' as const,
      effort: 'low' as const,
      category: 'risk' as const,
      insight: 'External factor. Build buffers and diversify revenue streams.',
    },
    {
      id: 'executionRisk',
      name: 'Execution Risk',
      currentValue: levers.executionRisk || 50,
      impactScore: 52,
      dollarImpact: Math.round(baseARR * -0.012),
      direction: 'risk' as const,
      effort: 'medium' as const,
      category: 'risk' as const,
      insight: 'Team and process risk. Invest in systems and talent.',
    },
    {
      id: 'operatingDrag',
      name: 'Operating Drag',
      currentValue: levers.operatingDrag || 50,
      impactScore: 45,
      dollarImpact: Math.round(baseARR * -0.008),
      direction: 'risk' as const,
      effort: 'medium' as const,
      category: 'operational' as const,
      insight: 'Hidden inefficiencies. Audit processes quarterly.',
    },
  ];
  
  return impacts.sort((a, b) => b.impactScore - a.impactScore);
};

const calculateKillZones = (levers: Record<string, number>, summary: any): KillZone[] => {
  const zones: KillZone[] = [];
  
  if ((levers.demandStrength || 50) < 40) {
    zones.push({
      lever: 'Demand Strength',
      threshold: 35,
      currentValue: levers.demandStrength || 50,
      consequence: 'Revenue growth stalls, unable to raise next round',
      timeToImpact: '6-9 months',
      severity: levers.demandStrength < 35 ? 'critical' : 'warning',
    });
  }
  
  if ((levers.costDiscipline || 50) < 35) {
    zones.push({
      lever: 'Cost Discipline',
      threshold: 30,
      currentValue: levers.costDiscipline || 50,
      consequence: 'Runway drops below 12 months, forced to raise or cut',
      timeToImpact: '3-6 months',
      severity: levers.costDiscipline < 30 ? 'critical' : 'warning',
    });
  }
  
  if ((levers.marketVolatility || 50) > 70) {
    zones.push({
      lever: 'Market Volatility',
      threshold: 75,
      currentValue: levers.marketVolatility || 50,
      consequence: 'Customer churn accelerates, pipeline becomes unpredictable',
      timeToImpact: '2-4 months',
      severity: levers.marketVolatility > 75 ? 'critical' : 'warning',
    });
  }
  
  if ((levers.executionRisk || 50) > 65) {
    zones.push({
      lever: 'Execution Risk',
      threshold: 70,
      currentValue: levers.executionRisk || 50,
      consequence: 'Key milestones missed, investor confidence drops',
      timeToImpact: '1-3 months',
      severity: levers.executionRisk > 70 ? 'critical' : 'warning',
    });
  }
  
  // Always show at least one potential risk
  if (zones.length === 0) {
    zones.push({
      lever: 'Hiring Intensity',
      threshold: 75,
      currentValue: levers.hiringIntensity || 50,
      consequence: 'Burn rate exceeds growth, unit economics deteriorate',
      timeToImpact: '4-6 months',
      severity: 'warning',
    });
  }
  
  return zones;
};

const calculateUnlocks = (levers: Record<string, number>, summary: any): Unlock[] => {
  return [
    {
      name: 'Series A Ready',
      requirement: 'Demand Strength ≥ 70',
      currentProgress: levers.demandStrength || 50,
      targetValue: 70,
      reward: 'Unlocks institutional investor interest',
      rewardValue: '$2-5M raise potential',
    },
    {
      name: 'Default Alive',
      requirement: 'Cost Discipline ≥ 65 + Runway ≥ 18mo',
      currentProgress: Math.min(levers.costDiscipline || 50, (summary?.runwayMedian || 12) * 3.6),
      targetValue: 65,
      reward: 'Survive without additional funding',
      rewardValue: 'Infinite runway optionality',
    },
    {
      name: 'Pricing Champion',
      requirement: 'Pricing Power ≥ 75',
      currentProgress: levers.pricingPower || 50,
      targetValue: 75,
      reward: 'Premium positioning, margin expansion',
      rewardValue: '+15-25% gross margin',
    },
    {
      name: 'Growth Machine',
      requirement: 'Expansion Velocity ≥ 70',
      currentProgress: levers.expansionVelocity || 50,
      targetValue: 70,
      reward: 'Net Revenue Retention > 120%',
      rewardValue: 'Compound growth unlocked',
    },
  ];
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ImpactGodMode() {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);
  const summary = useSimulationStore((s) => s.summary);
  const levers = useLeverStore((s) => s.levers);
  
  // Calculate all impact data
  const leverImpacts = useMemo(() => calculateLeverImpacts(levers, summary), [levers, summary]);
  const killZones = useMemo(() => calculateKillZones(levers, summary), [levers, summary]);
  const unlocks = useMemo(() => calculateUnlocks(levers, summary), [levers, summary]);
  
  // Find the #1 priority lever
  const topLever = leverImpacts[0];
  
  // Calculate focus score (are they focusing on the right things?)
  const focusScore = useMemo(() => {
    const highImpactLevers = leverImpacts.slice(0, 3);
    const avgHighImpactValue = highImpactLevers.reduce((sum, l) => sum + l.currentValue, 0) / 3;
    const lowImpactLevers = leverImpacts.slice(-3);
    const avgLowImpactValue = lowImpactLevers.reduce((sum, l) => sum + l.currentValue, 0) / 3;
    
    // Good focus = high impact levers are high, low impact are lower (not over-invested)
    const score = Math.round((avgHighImpactValue / 100) * 70 + (1 - avgLowImpactValue / 100) * 30);
    return Math.min(100, Math.max(0, score + 20));
  }, [leverImpacts]);
  
  // Format currency
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };
  
  // Get effort/impact quadrant for each lever
  const getQuadrant = (lever: LeverImpact): string => {
    const highImpact = lever.impactScore >= 65;
    const lowEffort = lever.effort === 'low' || lever.effort === 'medium';
    
    if (highImpact && lowEffort) return 'quick-wins';
    if (highImpact && !lowEffort) return 'strategic-bets';
    if (!highImpact && lowEffort) return 'fill-ins';
    return 'money-pits';
  };

  return (
    <div className="impact-godmode">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO: THE ONE THING
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-left">
          <span className="hero-label">YOUR #1 PRIORITY RIGHT NOW</span>
          <h1 className="hero-lever">{topLever.name}</h1>
          <p className="hero-insight">{topLever.insight}</p>
          <div className="hero-value">
            <span className="value-label">Each 1% improvement =</span>
            <span className="value-amount">{formatCurrency(topLever.dollarImpact)}</span>
            <span className="value-period">/ year</span>
          </div>
        </div>
        
        <div className="hero-right">
          <div className="focus-score-ring">
            <svg viewBox="0 0 120 120" className="score-ring-svg">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={focusScore >= 70 ? '#10b981' : focusScore >= 50 ? '#fbbf24' : '#ef4444'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(focusScore / 100) * 339} 339`}
                transform="rotate(-90 60 60)"
                className="score-ring-progress"
              />
            </svg>
            <div className="score-ring-content">
              <span className="score-value">{focusScore}</span>
              <span className="score-label">FOCUS</span>
            </div>
          </div>
          <p className="focus-description">
            {focusScore >= 70 
              ? "You're focused on the right levers. Stay the course."
              : focusScore >= 50
              ? "Good focus, but room to optimize your priorities."
              : "Refocus effort on high-impact levers below."
            }
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          POWER RANKINGS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="power-rankings">
        <div className="section-header">
          <h2>LEVER POWER RANKINGS</h2>
          <p className="section-subtitle">Ranked by impact on your survival and growth</p>
        </div>
        
        <div className="rankings-list">
          {leverImpacts.map((lever, index) => (
            <div 
              key={lever.id} 
              className={`ranking-item ${lever.direction} ${getQuadrant(lever)}`}
            >
              <div className="rank-number">#{index + 1}</div>
              
              <div className="lever-info">
                <div className="lever-name-row">
                  <span className="lever-name">{lever.name}</span>
                  <span className={`effort-badge ${lever.effort}`}>
                    {lever.effort === 'low' ? '⚡ Quick' : lever.effort === 'medium' ? '⏱️ Medium' : '🏋️ Hard'}
                  </span>
                </div>
                <div className="lever-current">
                  Currently at <strong>{lever.currentValue}%</strong>
                </div>
              </div>
              
              <div className="impact-bar-section">
                <div className="impact-bar-bg">
                  <div 
                    className={`impact-bar-fill ${lever.direction}`}
                    style={{ width: `${lever.impactScore}%` }}
                  />
                </div>
                <span className="impact-score">{lever.impactScore}</span>
              </div>
              
              <div className="dollar-impact">
                <span className={`impact-direction ${lever.direction}`}>
                  {lever.direction === 'growth' ? '▲' : '▼'}
                </span>
                <span className="impact-value">{formatCurrency(Math.abs(lever.dollarImpact))}</span>
                <span className="impact-unit">/pt</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          EFFORT vs IMPACT MATRIX
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="matrix-section">
        <div className="section-header">
          <h2>WHERE TO FOCUS</h2>
          <p className="section-subtitle">Effort vs. Impact — prioritize wisely</p>
        </div>
        
        <div className="effort-impact-matrix">
          <div className="matrix-labels">
            <span className="label-y-top">HIGH IMPACT</span>
            <span className="label-y-bottom">LOW IMPACT</span>
            <span className="label-x-left">LOW EFFORT</span>
            <span className="label-x-right">HIGH EFFORT</span>
          </div>
          
          <div className="matrix-grid">
            {/* Quick Wins - Top Left */}
            <div 
              className={`matrix-quadrant quick-wins ${selectedQuadrant === 'quick-wins' ? 'selected' : ''}`}
              onClick={() => setSelectedQuadrant(selectedQuadrant === 'quick-wins' ? null : 'quick-wins')}
            >
              <div className="quadrant-header">
                <span className="quadrant-icon">🎯</span>
                <span className="quadrant-title">QUICK WINS</span>
              </div>
              <span className="quadrant-action">DO THESE FIRST</span>
              <div className="quadrant-levers">
                {leverImpacts.filter(l => getQuadrant(l) === 'quick-wins').map(l => (
                  <span key={l.id} className="lever-pill">{l.name}</span>
                ))}
              </div>
            </div>
            
            {/* Strategic Bets - Top Right */}
            <div 
              className={`matrix-quadrant strategic-bets ${selectedQuadrant === 'strategic-bets' ? 'selected' : ''}`}
              onClick={() => setSelectedQuadrant(selectedQuadrant === 'strategic-bets' ? null : 'strategic-bets')}
            >
              <div className="quadrant-header">
                <span className="quadrant-icon">🚀</span>
                <span className="quadrant-title">STRATEGIC BETS</span>
              </div>
              <span className="quadrant-action">PLAN & INVEST</span>
              <div className="quadrant-levers">
                {leverImpacts.filter(l => getQuadrant(l) === 'strategic-bets').map(l => (
                  <span key={l.id} className="lever-pill">{l.name}</span>
                ))}
              </div>
            </div>
            
            {/* Fill-ins - Bottom Left */}
            <div 
              className={`matrix-quadrant fill-ins ${selectedQuadrant === 'fill-ins' ? 'selected' : ''}`}
              onClick={() => setSelectedQuadrant(selectedQuadrant === 'fill-ins' ? null : 'fill-ins')}
            >
              <div className="quadrant-header">
                <span className="quadrant-icon">📋</span>
                <span className="quadrant-title">FILL-INS</span>
              </div>
              <span className="quadrant-action">DELEGATE</span>
              <div className="quadrant-levers">
                {leverImpacts.filter(l => getQuadrant(l) === 'fill-ins').map(l => (
                  <span key={l.id} className="lever-pill">{l.name}</span>
                ))}
              </div>
            </div>
            
            {/* Money Pits - Bottom Right */}
            <div 
              className={`matrix-quadrant money-pits ${selectedQuadrant === 'money-pits' ? 'selected' : ''}`}
              onClick={() => setSelectedQuadrant(selectedQuadrant === 'money-pits' ? null : 'money-pits')}
            >
              <div className="quadrant-header">
                <span className="quadrant-icon">⚠️</span>
                <span className="quadrant-title">MONEY PITS</span>
              </div>
              <span className="quadrant-action">AVOID / REDUCE</span>
              <div className="quadrant-levers">
                {leverImpacts.filter(l => getQuadrant(l) === 'money-pits').map(l => (
                  <span key={l.id} className="lever-pill">{l.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bottom-row">
        {/* ═══════════════════════════════════════════════════════════════════
            KILL ZONES
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="kill-zones">
          <div className="section-header">
            <h2>⚠️ DANGER ZONES</h2>
            <p className="section-subtitle">Thresholds that trigger existential risk</p>
          </div>
          
          <div className="kill-zones-list">
            {killZones.map((zone, i) => (
              <div key={i} className={`kill-zone-card ${zone.severity}`}>
                <div className="zone-header">
                  <span className={`severity-badge ${zone.severity}`}>
                    {zone.severity === 'critical' ? '🔴 CRITICAL' : '🟡 WARNING'}
                  </span>
                  <span className="zone-time">{zone.timeToImpact}</span>
                </div>
                <div className="zone-lever">
                  {zone.lever} {zone.severity === 'critical' ? '<' : 'approaching'} {zone.threshold}%
                </div>
                <div className="zone-progress">
                  <div className="zone-bar-bg">
                    <div 
                      className="zone-bar-fill"
                      style={{ 
                        width: `${zone.currentValue}%`,
                        background: zone.currentValue > zone.threshold 
                          ? 'linear-gradient(90deg, #10b981, #34d399)' 
                          : 'linear-gradient(90deg, #ef4444, #f87171)'
                      }}
                    />
                    <div 
                      className="zone-threshold-marker"
                      style={{ left: `${zone.threshold}%` }}
                    />
                  </div>
                  <div className="zone-values">
                    <span>Current: {zone.currentValue}%</span>
                    <span className="threshold">Threshold: {zone.threshold}%</span>
                  </div>
                </div>
                <div className="zone-consequence">{zone.consequence}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            UNLOCKS
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="unlocks-section">
          <div className="section-header">
            <h2>🏆 ACHIEVEMENTS TO UNLOCK</h2>
            <p className="section-subtitle">Hit these milestones to level up</p>
          </div>
          
          <div className="unlocks-list">
            {unlocks.map((unlock, i) => {
              const progress = Math.min(100, (unlock.currentProgress / unlock.targetValue) * 100);
              const isUnlocked = progress >= 100;
              
              return (
                <div key={i} className={`unlock-card ${isUnlocked ? 'unlocked' : ''}`}>
                  <div className="unlock-header">
                    <span className="unlock-name">{unlock.name}</span>
                    {isUnlocked && <span className="unlocked-badge">✓ UNLOCKED</span>}
                  </div>
                  <div className="unlock-requirement">{unlock.requirement}</div>
                  <div className="unlock-progress">
                    <div className="unlock-bar-bg">
                      <div 
                        className="unlock-bar-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="unlock-percent">{Math.round(progress)}%</span>
                  </div>
                  <div className="unlock-reward">
                    <span className="reward-label">Reward:</span>
                    <span className="reward-text">{unlock.reward}</span>
                  </div>
                  <div className="unlock-value">{unlock.rewardValue}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          AI STRATEGIC ADVISOR
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="ai-advisor">
        <div className="advisor-header">
          <span className="advisor-icon">🧠</span>
          <span className="advisor-title">AI STRATEGIC ADVISOR</span>
        </div>
        <div className="advisor-content">
          <div className="advisor-insight">
            <strong>Primary Insight:</strong> {topLever.name} is your biggest lever right now. 
            A focused 10-point improvement would add approximately {formatCurrency(topLever.dollarImpact * 10)} in annual value.
          </div>
          
          <div className="advisor-recommendation">
            <strong>This Week's Focus:</strong>
            {focusScore >= 70 
              ? ` Maintain momentum on ${topLever.name}. Consider running experiments on ${leverImpacts[1].name} as your second priority.`
              : focusScore >= 50
              ? ` Shift attention from lower-impact activities to ${topLever.name} and ${leverImpacts[1].name}. These two levers control 65% of your outcomes.`
              : ` Stop. You're spreading effort too thin. This week, focus ONLY on ${topLever.name}. Everything else can wait.`
            }
          </div>
          
          {killZones.some(z => z.severity === 'critical') && (
            <div className="advisor-warning">
              <strong>⚠️ Urgent:</strong> You have critical risk zones that need immediate attention. 
              Address these before pursuing growth initiatives.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

