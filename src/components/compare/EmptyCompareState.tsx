// src/components/compare/EmptyCompareState.tsx
// STRATFIT — Empty state for Compare Tab

import React from 'react';

interface EmptyCompareStateProps {
  type: 'no-baseline' | 'no-simulation';
  baselineName?: string;
  savedCount?: number;
  onLoadSaved?: () => void;
}

export default function EmptyCompareState({ type, baselineName, savedCount = 0, onLoadSaved }: EmptyCompareStateProps) {
  if (type === 'no-baseline') {
    return (
      <div className="empty-compare-state">
        <div className="empty-icon">◇</div>
        <h2 className="empty-title">No Baseline Set</h2>
        <p className="empty-description">
          To compare scenarios, you first need to save a baseline. This represents your 
          reference point for measuring the impact of strategy changes.
        </p>
        <div className="empty-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span className="step-text">Configure your levers</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span className="step-text">Run a simulation</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-text">Save as baseline</span>
          </div>
        </div>
        <div className="empty-actions">
          <button className="empty-action primary">
            Go to Simulate
          </button>
          {savedCount > 0 && onLoadSaved && (
            <button className="empty-action secondary" onClick={onLoadSaved}>
              📊 Load Saved ({savedCount})
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="empty-compare-state">
      <div className="empty-icon">⟳</div>
      <h2 className="empty-title">Run a Simulation</h2>
      <p className="empty-description">
        Your baseline <strong>"{baselineName}"</strong> is set. Now run a simulation 
        with different lever settings to see how your strategy compares.
      </p>
      <div className="empty-steps">
        <div className="step">
          <span className="step-number">1</span>
          <span className="step-text">Adjust levers</span>
        </div>
        <div className="step">
          <span className="step-number">2</span>
          <span className="step-text">Run simulation</span>
        </div>
        <div className="step">
          <span className="step-number">3</span>
          <span className="step-text">Compare results</span>
        </div>
      </div>
      <div className="empty-actions">
        <button className="empty-action primary">
          Go to Simulate
        </button>
        {savedCount > 0 && onLoadSaved && (
          <button className="empty-action secondary" onClick={onLoadSaved}>
            📊 Load Saved ({savedCount})
          </button>
        )}
      </div>
    </div>
  );
}
