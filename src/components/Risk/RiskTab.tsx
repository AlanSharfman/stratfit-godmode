// src/components/risk/RiskTab.tsx
// STRATFIT — Risk Intelligence Tab (God Mode)

import React, { useEffect } from 'react';
import { useRiskStore } from '../../state/riskStore';
import { useLeverStore } from '../../state/leverStore';
import { useSimulationStore } from '../../state/simulationStore';

import RiskHeader from './RiskHeader';
import ThreatLevel from './ThreatLevel';
import ThreatRadar from './ThreatRadar';
import TopThreats from './TopThreats';
import RiskTimeline from './RiskTimeline';
import RiskBreakdown from './RiskBreakdown';
import CriticalAlerts from './CriticalAlerts';
import EmptyRiskState from './EmptyRiskState';

import './RiskStyles.css';

export default function RiskTab() {
  const riskSnapshot = useRiskStore((s) => s.riskSnapshot);
  const calculateRisk = useRiskStore((s) => s.calculateRisk);
  const viewMode = useRiskStore((s) => s.viewMode);
  const setViewMode = useRiskStore((s) => s.setViewMode);
  
  const levers = useLeverStore((s) => s.levers);
  const simulation = useSimulationStore((s) => s.summary);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  
  // Calculate risk whenever levers or simulation changes
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
  
  // Show empty state if no simulation
  if (!hasSimulated || !simulation) {
    return (
      <div className="risk-tab">
        <RiskHeader />
        <EmptyRiskState />
      </div>
    );
  }
  
  if (!riskSnapshot) {
    return (
      <div className="risk-tab">
        <RiskHeader />
        <div className="risk-loading">
          <div className="loading-spinner" />
          <span>Analyzing threats...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="risk-tab">
      {/* Header */}
      <RiskHeader
        overallScore={riskSnapshot.overallScore}
        overallLevel={riskSnapshot.overallLevel}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {/* Critical Alerts Banner */}
      {riskSnapshot.criticalWarnings.length > 0 && (
        <CriticalAlerts warnings={riskSnapshot.criticalWarnings} />
      )}
      
      <div className="risk-content">
        {/* Left Column: Threat Level + Top Threats */}
        <div className="risk-left-column">
          <ThreatLevel
            score={riskSnapshot.overallScore}
            level={riskSnapshot.overallLevel}
          />
          <TopThreats threats={riskSnapshot.topThreats} />
        </div>
        
        {/* Center: Main Visualization */}
        <div className="risk-center">
          {viewMode === 'radar' && (
            <ThreatRadar data={riskSnapshot.radarData} />
          )}
          {viewMode === 'timeline' && (
            <RiskTimeline data={riskSnapshot.timeline} currentScore={riskSnapshot.overallScore} />
          )}
          {viewMode === 'breakdown' && (
            <RiskBreakdown factors={riskSnapshot.factors} />
          )}
        </div>
        
        {/* Right Column: Quick Stats */}
        <div className="risk-right-column">
          <div className="risk-quick-stats">
            <h4 className="stats-title">
              <span className="title-icon">◈</span>
              THREAT SUMMARY
            </h4>
            
            <div className="stat-item">
              <span className="stat-label">Controllable Risks</span>
              <span className="stat-value controllable">
                {riskSnapshot.factors.filter(f => f.controllable).length} of {riskSnapshot.factors.length}
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Survival Threats</span>
              <span className="stat-value survival">
                {riskSnapshot.factors.filter(f => f.impact === 'survival' || f.impact === 'both').length}
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Growth Threats</span>
              <span className="stat-value growth">
                {riskSnapshot.factors.filter(f => f.impact === 'growth' || f.impact === 'both').length}
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Worsening Trends</span>
              <span className="stat-value worsening">
                {riskSnapshot.factors.filter(f => f.trend === 'worsening').length}
              </span>
            </div>
          </div>
          
          {/* View Mode Toggles */}
          <div className="view-mode-panel">
            <h4 className="panel-title">VIEW MODE</h4>
            <div className="view-mode-buttons">
              <button
                className={`mode-btn ${viewMode === 'radar' ? 'active' : ''}`}
                onClick={() => setViewMode('radar')}
              >
                <span className="mode-icon">◎</span>
                Radar
              </button>
              <button
                className={`mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
              >
                <span className="mode-icon">◔</span>
                Timeline
              </button>
              <button
                className={`mode-btn ${viewMode === 'breakdown' ? 'active' : ''}`}
                onClick={() => setViewMode('breakdown')}
              >
                <span className="mode-icon">▤</span>
                Breakdown
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
