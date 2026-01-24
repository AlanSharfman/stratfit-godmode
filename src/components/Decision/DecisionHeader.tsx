// src/components/Decision/DecisionHeader.tsx
// STRATFIT — Decision Header with View Mode Toggle

import React from 'react';
import { useDecisionStore } from '../../state/decisionStore';

interface DecisionHeaderProps {
  totalDecisions?: number;
  criticalCount?: number;
  pendingCount?: number;
}

export default function DecisionHeader({
  totalDecisions = 0,
  criticalCount = 0,
  pendingCount = 0,
}: DecisionHeaderProps) {
  const viewMode = useDecisionStore((s) => s.viewMode);
  const setViewMode = useDecisionStore((s) => s.setViewMode);
  
  return (
    <header className="decision-header">
      <div className="header-left">
        <h1 className="header-title">
          <span className="title-icon">🎯</span>
          DECISION INTELLIGENCE
        </h1>
        <p className="header-subtitle">
          AI-powered strategic recommendations and action tracking
        </p>
      </div>
      
      {totalDecisions > 0 && (
        <div className="header-center">
          <div className="decision-stats">
            <div className="stat-badge total">
              <span className="badge-value">{totalDecisions}</span>
              <span className="badge-label">Decisions</span>
            </div>
            {criticalCount > 0 && (
              <div className="stat-badge critical">
                <span className="badge-value">{criticalCount}</span>
                <span className="badge-label">Critical</span>
              </div>
            )}
            <div className="stat-badge pending">
              <span className="badge-value">{pendingCount}</span>
              <span className="badge-label">Pending</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="header-right">
        <div className="view-mode-toggle">
          <button
            className={`mode-btn ${viewMode === 'matrix' ? 'active' : ''}`}
            onClick={() => setViewMode('matrix')}
            title="Matrix View"
          >
            <span className="mode-icon">⊞</span>
            Matrix
          </button>
          <button
            className={`mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
            title="Timeline View"
          >
            <span className="mode-icon">◔</span>
            Timeline
          </button>
          <button
            className={`mode-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <span className="mode-icon">≡</span>
            List
          </button>
        </div>
      </div>
    </header>
  );
}

