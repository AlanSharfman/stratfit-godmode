// src/components/Decision/DecisionMatrix.tsx
// STRATFIT — Decision Priority/Impact Matrix

import React from 'react';
import type { Decision } from '../../state/decisionStore';

interface DecisionMatrixProps {
  decisions: Decision[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

export default function DecisionMatrix({ decisions, onSelect, selectedId }: DecisionMatrixProps) {
  // Group decisions by recommendation
  const doNow = decisions.filter(d => d.recommendation === 'DO_NOW');
  const plan = decisions.filter(d => d.recommendation === 'PLAN');
  const monitor = decisions.filter(d => d.recommendation === 'MONITOR');
  const avoid = decisions.filter(d => d.recommendation === 'AVOID');
  
  const renderDecisionCard = (decision: Decision) => {
    const isSelected = decision.id === selectedId;
    
    return (
      <div
        key={decision.id}
        className={`matrix-card ${decision.priority.toLowerCase()} ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(decision.id)}
      >
        <div className="card-priority">
          <span className={`priority-dot ${decision.priority.toLowerCase()}`} />
        </div>
        <div className="card-content">
          <h4 className="card-title">{decision.title}</h4>
          <div className="card-meta">
            <span className={`impact-badge ${decision.impact.type}`}>
              {decision.impact.type}
            </span>
            <span className="confidence">{decision.confidence}%</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="decision-matrix">
      <div className="matrix-header">
        <span className="matrix-icon">⊞</span>
        <span className="matrix-title">DECISION MATRIX</span>
        <span className="matrix-subtitle">Prioritized by urgency and impact</span>
      </div>
      
      <div className="matrix-grid">
        {/* DO NOW Quadrant */}
        <div className="matrix-quadrant do-now">
          <div className="quadrant-header">
            <span className="quadrant-icon">🔥</span>
            <span className="quadrant-title">DO NOW</span>
            <span className="quadrant-count">{doNow.length}</span>
          </div>
          <div className="quadrant-content">
            {doNow.length === 0 ? (
              <div className="quadrant-empty">No urgent actions</div>
            ) : (
              doNow.map(renderDecisionCard)
            )}
          </div>
        </div>
        
        {/* PLAN Quadrant */}
        <div className="matrix-quadrant plan">
          <div className="quadrant-header">
            <span className="quadrant-icon">📋</span>
            <span className="quadrant-title">PLAN</span>
            <span className="quadrant-count">{plan.length}</span>
          </div>
          <div className="quadrant-content">
            {plan.length === 0 ? (
              <div className="quadrant-empty">No items to plan</div>
            ) : (
              plan.map(renderDecisionCard)
            )}
          </div>
        </div>
        
        {/* MONITOR Quadrant */}
        <div className="matrix-quadrant monitor">
          <div className="quadrant-header">
            <span className="quadrant-icon">👁️</span>
            <span className="quadrant-title">MONITOR</span>
            <span className="quadrant-count">{monitor.length}</span>
          </div>
          <div className="quadrant-content">
            {monitor.length === 0 ? (
              <div className="quadrant-empty">Nothing to monitor</div>
            ) : (
              monitor.map(renderDecisionCard)
            )}
          </div>
        </div>
        
        {/* AVOID Quadrant */}
        <div className="matrix-quadrant avoid">
          <div className="quadrant-header">
            <span className="quadrant-icon">⛔</span>
            <span className="quadrant-title">AVOID</span>
            <span className="quadrant-count">{avoid.length}</span>
          </div>
          <div className="quadrant-content">
            {avoid.length === 0 ? (
              <div className="quadrant-empty">No items to avoid</div>
            ) : (
              avoid.map(renderDecisionCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

