// src/components/Decision/DecisionTab.tsx
// STRATFIT — Decision Intelligence Tab
// AI-powered strategic decision recommendations

import React, { useEffect } from 'react';
import { useDecisionStore } from '../../state/decisionStore';
import { useLeverStore } from '../../state/leverStore';
import { useSimulationStore } from '../../state/simulationStore';
import { useRiskStore } from '../../state/riskStore';

import DecisionHeader from './DecisionHeader';
import DecisionMatrix from './DecisionMatrix';
import DecisionTimeline from './DecisionTimeline';
import DecisionList from './DecisionList';
import DecisionSummary from './DecisionSummary';
import DecisionDetail from './DecisionDetail';
import EmptyDecisionState from './EmptyDecisionState';

import './DecisionStyles.css';

export default function DecisionTab() {
  const snapshot = useDecisionStore((s) => s.snapshot);
  const decisions = useDecisionStore((s) => s.decisions);
  const generateDecisions = useDecisionStore((s) => s.generateDecisions);
  const viewMode = useDecisionStore((s) => s.viewMode);
  const selectedDecisionId = useDecisionStore((s) => s.selectedDecisionId);
  const setSelectedDecision = useDecisionStore((s) => s.setSelectedDecision);
  
  const levers = useLeverStore((s) => s.levers);
  const simulation = useSimulationStore((s) => s.summary);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  const riskSnapshot = useRiskStore((s) => s.riskSnapshot);
  
  // Generate decisions when simulation or levers change
  useEffect(() => {
    if (hasSimulated && simulation) {
      generateDecisions(
        levers as Record<string, number>,
        {
          survivalRate: simulation.survivalRate,
          medianRunway: simulation.runwayMedian,
          medianARR: simulation.arrMedian,
          overallScore: simulation.overallScore,
          overallRating: simulation.overallRating,
        },
        riskSnapshot ? {
          topThreats: riskSnapshot.topThreats.map(t => ({
            category: t.category,
            score: t.score,
            label: t.label,
          })),
        } : undefined
      );
    }
  }, [hasSimulated, simulation, levers, riskSnapshot, generateDecisions]);
  
  const selectedDecision = decisions.find(d => d.id === selectedDecisionId);
  
  // Show empty state if no simulation
  if (!hasSimulated || !simulation) {
    return (
      <div className="decision-tab">
        <DecisionHeader />
        <EmptyDecisionState />
      </div>
    );
  }
  
  if (!snapshot || decisions.length === 0) {
    return (
      <div className="decision-tab">
        <DecisionHeader />
        <div className="decision-loading">
          <div className="loading-spinner" />
          <span>Analyzing strategic options...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="decision-tab">
      {/* Header */}
      <DecisionHeader
        totalDecisions={snapshot.summary.totalDecisions}
        criticalCount={snapshot.summary.criticalCount}
        pendingCount={snapshot.summary.pendingCount}
      />
      
      <div className="decision-content">
        {/* Left: Summary Stats */}
        <div className="decision-left">
          <DecisionSummary
            summary={snapshot.summary}
            insights={snapshot.insights}
          />
        </div>
        
        {/* Center: Main View */}
        <div className="decision-center">
          {viewMode === 'matrix' && (
            <DecisionMatrix
              decisions={decisions}
              onSelect={(id) => setSelectedDecision(id)}
              selectedId={selectedDecisionId}
            />
          )}
          {viewMode === 'timeline' && (
            <DecisionTimeline
              decisions={decisions}
              onSelect={(id) => setSelectedDecision(id)}
              selectedId={selectedDecisionId}
            />
          )}
          {viewMode === 'list' && (
            <DecisionList
              decisions={decisions}
              onSelect={(id) => setSelectedDecision(id)}
              selectedId={selectedDecisionId}
            />
          )}
        </div>
        
        {/* Right: Detail Panel */}
        <div className="decision-right">
          {selectedDecision ? (
            <DecisionDetail
              decision={selectedDecision}
              onClose={() => setSelectedDecision(null)}
            />
          ) : (
            <div className="decision-placeholder">
              <div className="placeholder-icon">🎯</div>
              <p className="placeholder-text">
                Select a decision to view details and take action
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

