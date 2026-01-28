// src/components/risk/RiskTab.tsx
// STRATFIT — Risk Intelligence Tab (God Mode)
// Mission Control Layout — Hero Visualization + Contextual Sidebar

import { useEffect } from 'react';
import { useRiskStore, type RiskLevel } from '../../state/riskStore';
import { useLeverStore } from '../../state/leverStore';
import { useSimulationStore } from '../../state/simulationStore';

import RiskHeader from './RiskHeader';
import ThreatRadar from './ThreatRadar';
import RiskTimeline from './RiskTimeline';
import RiskBreakdown from './RiskBreakdown';
import EmptyRiskState from './EmptyRiskState';

import './RiskStyles.css';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT THREAT LEVEL — Horizontal DEFCON Strip
// ═══════════════════════════════════════════════════════════════════════════════
const LEVELS: { level: RiskLevel; color: string; label: string }[] = [
  { level: 'CRITICAL', color: '#dc2626', label: 'CRIT' },
  { level: 'HIGH', color: '#ef4444', label: 'HIGH' },
  { level: 'ELEVATED', color: '#f97316', label: 'ELEV' },
  { level: 'MODERATE', color: '#fbbf24', label: 'MOD' },
  { level: 'LOW', color: '#10b981', label: 'LOW' },
  { level: 'MINIMAL', color: '#22d3ee', label: 'MIN' },
];

function ThreatStrip({ score, level }: { score: number; level: RiskLevel }) {
  const currentIndex = LEVELS.findIndex(l => l.level === level);
  const currentColor = LEVELS[currentIndex]?.color || '#fbbf24';
  
  return (
    <div className="threat-strip">
      <div className="threat-strip-levels">
        {LEVELS.map((lvl, i) => {
          const isActive = i >= currentIndex;
          const isCurrent = lvl.level === level;
          return (
            <div
              key={lvl.level}
              className={`strip-level ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
              style={{ '--level-color': lvl.color } as React.CSSProperties}
            >
              <span className="level-label">{lvl.label}</span>
              {isCurrent && <span className="level-score">{score}</span>}
            </div>
          );
        })}
      </div>
      <div className="threat-strip-bar">
        <div 
          className="strip-bar-fill" 
          style={{ 
            width: `${score}%`,
            background: `linear-gradient(90deg, #22d3ee, #10b981, #fbbf24, #f97316, #ef4444)`
          }}
        />
        <div className="strip-bar-marker" style={{ left: `${score}%`, background: currentColor }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE THREAT CARD — Compact Threat Display
// ═══════════════════════════════════════════════════════════════════════════════
interface ThreatCardProps {
  rank: number;
  label: string;
  score: number;
  level: string;
  trend: 'improving' | 'stable' | 'worsening';
  controllable?: boolean;
}

function ThreatCard({ rank, label, score, level, trend, controllable }: ThreatCardProps) {
  const levelColors: Record<string, string> = {
    CRITICAL: '#dc2626', HIGH: '#ef4444', ELEVATED: '#f97316',
    MODERATE: '#fbbf24', LOW: '#10b981', MINIMAL: '#22d3ee',
  };
  const color = levelColors[level] || '#64748b';
  const trendIcon = trend === 'improving' ? '↘' : trend === 'worsening' ? '↗' : '→';
  const trendColor = trend === 'improving' ? '#10b981' : trend === 'worsening' ? '#ef4444' : '#64748b';
  
  return (
    <div className="threat-card-compact" style={{ '--threat-color': color } as React.CSSProperties}>
      <span className="threat-rank">#{rank}</span>
      <div className="threat-info">
        <span className="threat-name">{label}</span>
        {controllable && <span className="threat-ctrl">●</span>}
      </div>
      <div className="threat-metrics">
        <span className="threat-score" style={{ color }}>{score}</span>
        <span className="threat-trend" style={{ color: trendColor }}>{trendIcon}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function RiskTab() {
  const riskSnapshot = useRiskStore((s) => s.riskSnapshot);
  const calculateRisk = useRiskStore((s) => s.calculateRisk);
  const viewMode = useRiskStore((s) => s.viewMode);
  const setViewMode = useRiskStore((s) => s.setViewMode);
  
  const levers = useLeverStore((s) => s.levers);
  const simulation = useSimulationStore((s) => s.summary);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  
  useEffect(() => {
    calculateRisk(
      levers as Record<string, number>, 
      simulation ? {
        survivalRate: simulation.survivalRate,
        medianRunway: simulation.runwayMedian,
        medianARR: simulation.arrMedian,
        arrRange: { p10: simulation.arrP10, p90: simulation.arrP90 },
      } : null
    );
  }, [levers, simulation, calculateRisk]);
  
  if (!hasSimulated || !simulation) {
    return (
      <div className="risk-tab risk-tab--godmode">
        <RiskHeader />
        <EmptyRiskState />
      </div>
    );
  }
  
  if (!riskSnapshot) {
    return (
      <div className="risk-tab risk-tab--godmode">
        <RiskHeader />
        <div className="risk-loading">
          <div className="loading-spinner" />
          <span>Analyzing threats...</span>
        </div>
      </div>
    );
  }

  // Compute stats
  const stats = {
    critical: riskSnapshot.factors.filter(f => f.level === 'CRITICAL' || f.level === 'HIGH').length,
    controllable: riskSnapshot.factors.filter(f => f.controllable).length,
    survival: riskSnapshot.factors.filter(f => f.impact === 'survival' || f.impact === 'both').length,
    worsening: riskSnapshot.factors.filter(f => f.trend === 'worsening').length,
  };
  
  return (
    <div className="risk-tab risk-tab--godmode">
      {/* ═══ COMMAND STRIP ═══ */}
      <header className="risk-command-strip">
        <div className="command-left">
          <div className="command-badge" style={{ 
            background: `${LEVELS.find(l => l.level === riskSnapshot.overallLevel)?.color}20`,
            borderColor: LEVELS.find(l => l.level === riskSnapshot.overallLevel)?.color
          }}>
            <span className="badge-dot" style={{ background: LEVELS.find(l => l.level === riskSnapshot.overallLevel)?.color }} />
            <span className="badge-level">{riskSnapshot.overallLevel}</span>
            <span className="badge-score">{riskSnapshot.overallScore}/100</span>
          </div>
          <h1 className="command-title">RISK INTELLIGENCE</h1>
        </div>
        
        <div className="command-center">
          <ThreatStrip score={riskSnapshot.overallScore} level={riskSnapshot.overallLevel} />
        </div>
        
        <div className="command-right">
          <div className="view-tabs">
            {(['radar', 'timeline', 'breakdown'] as const).map((mode) => (
              <button
                key={mode}
                className={`view-tab ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'radar' && '◎'}
                {mode === 'timeline' && '◔'}
                {mode === 'breakdown' && '▤'}
                <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* ═══ CRITICAL ALERTS (if any) ═══ */}
      {riskSnapshot.criticalWarnings.length > 0 && (
        <div className="risk-alerts">
          {riskSnapshot.criticalWarnings.slice(0, 2).map((warning, i) => (
            <div key={i} className="alert-item">
              <span className="alert-icon">⚠</span>
              <span className="alert-text">{warning}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* ═══ MAIN CONTENT: 2:1 SPLIT ═══ */}
      <div className="risk-main">
        {/* PRIMARY: Hero Visualization */}
        <section className="risk-hero">
          <div className="hero-header">
            <h2 className="hero-title">
              {viewMode === 'radar' && '◎ THREAT RADAR'}
              {viewMode === 'timeline' && '◔ RISK TIMELINE'}
              {viewMode === 'breakdown' && '▤ FACTOR BREAKDOWN'}
            </h2>
            <span className="hero-subtitle">
              {viewMode === 'radar' && 'Risk exposure by category'}
              {viewMode === 'timeline' && 'Historical trend analysis'}
              {viewMode === 'breakdown' && 'Detailed risk factors'}
            </span>
          </div>
          
          <div className="hero-content">
            {viewMode === 'radar' && <ThreatRadar data={riskSnapshot.radarData} />}
            {viewMode === 'timeline' && <RiskTimeline data={riskSnapshot.timeline} currentScore={riskSnapshot.overallScore} />}
            {viewMode === 'breakdown' && <RiskBreakdown factors={riskSnapshot.factors} />}
          </div>
        </section>
        
        {/* SIDEBAR: Context Panel */}
        <aside className="risk-sidebar">
          {/* Quick Stats */}
          <div className="sidebar-stats">
            <div className="stat-mini critical">
              <span className="stat-value">{stats.critical}</span>
              <span className="stat-label">Critical</span>
            </div>
            <div className="stat-mini controllable">
              <span className="stat-value">{stats.controllable}</span>
              <span className="stat-label">Controllable</span>
            </div>
            <div className="stat-mini survival">
              <span className="stat-value">{stats.survival}</span>
              <span className="stat-label">Survival</span>
            </div>
            <div className="stat-mini worsening">
              <span className="stat-value">{stats.worsening}</span>
              <span className="stat-label">Worsening</span>
            </div>
          </div>
          
          {/* Top Threats */}
          <div className="sidebar-threats">
            <h3 className="sidebar-title">
              <span className="title-icon">◈</span>
              TOP THREATS
            </h3>
            <div className="threats-list">
              {riskSnapshot.topThreats.slice(0, 6).map((threat, i) => (
                <ThreatCard
                  key={i}
                  rank={i + 1}
                  label={threat.label}
                  score={threat.score}
                  level={threat.level}
                  trend={threat.trend}
                  controllable={threat.controllable}
                />
              ))}
            </div>
          </div>
          
          {/* Insight */}
          <div className="sidebar-insight">
            <span className="insight-label">STATUS</span>
            <p className="insight-text">
              {riskSnapshot.overallLevel === 'MINIMAL' && 'Risks are well-managed. Maintain vigilance.'}
              {riskSnapshot.overallLevel === 'LOW' && 'Minor concerns present. Continue monitoring key indicators.'}
              {riskSnapshot.overallLevel === 'MODERATE' && 'Several risk factors require attention. Review controllable items.'}
              {riskSnapshot.overallLevel === 'ELEVATED' && 'Take proactive measures. Multiple factors trending negatively.'}
              {riskSnapshot.overallLevel === 'HIGH' && 'Immediate action required. Focus on survival-critical factors.'}
              {riskSnapshot.overallLevel === 'CRITICAL' && 'Emergency protocols needed. Company viability at risk.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
