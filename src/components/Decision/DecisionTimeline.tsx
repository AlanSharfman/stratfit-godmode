// src/components/Decision/DecisionTimeline.tsx
// STRATFIT — Decision Timeline View

import React from 'react';
import type { Decision } from '../../state/decisionStore';

interface DecisionTimelineProps {
  decisions: Decision[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const TIMEFRAME_ORDER = ['immediate', 'short-term', 'medium-term', 'long-term'] as const;
const TIMEFRAME_LABELS: Record<string, { label: string; duration: string }> = {
  'immediate': { label: 'Immediate', duration: '< 1 week' },
  'short-term': { label: 'Short Term', duration: '1-4 weeks' },
  'medium-term': { label: 'Medium Term', duration: '1-3 months' },
  'long-term': { label: 'Long Term', duration: '3+ months' },
};

export default function DecisionTimeline({ decisions, onSelect, selectedId }: DecisionTimelineProps) {
  // Group by timeframe
  const grouped = TIMEFRAME_ORDER.reduce((acc, timeframe) => {
    acc[timeframe] = decisions.filter(d => d.impact.timeframe === timeframe);
    return acc;
  }, {} as Record<string, Decision[]>);
  
  return (
    <div className="decision-timeline">
      <div className="timeline-header">
        <span className="timeline-icon">◔</span>
        <span className="timeline-title">DECISION TIMELINE</span>
        <span className="timeline-subtitle">Actions organized by timeframe</span>
      </div>
      
      <div className="timeline-track">
        {TIMEFRAME_ORDER.map((timeframe, index) => {
          const items = grouped[timeframe];
          const info = TIMEFRAME_LABELS[timeframe];
          
          return (
            <div key={timeframe} className="timeline-phase">
              {/* Phase header */}
              <div className="phase-header">
                <div className="phase-marker">
                  <span className="marker-number">{index + 1}</span>
                </div>
                <div className="phase-info">
                  <span className="phase-label">{info.label}</span>
                  <span className="phase-duration">{info.duration}</span>
                </div>
                <span className="phase-count">{items.length} actions</span>
              </div>
              
              {/* Phase items */}
              <div className="phase-items">
                {items.length === 0 ? (
                  <div className="phase-empty">No actions in this timeframe</div>
                ) : (
                  items.map(decision => (
                    <div
                      key={decision.id}
                      className={`timeline-card ${decision.priority.toLowerCase()} ${selectedId === decision.id ? 'selected' : ''}`}
                      onClick={() => onSelect(decision.id)}
                    >
                      <div className="card-connector" />
                      <div className="card-body">
                        <div className="card-header">
                          <span className={`priority-tag ${decision.priority.toLowerCase()}`}>
                            {decision.priority}
                          </span>
                          <span className={`status-tag ${decision.status.toLowerCase()}`}>
                            {decision.status}
                          </span>
                        </div>
                        <h4 className="card-title">{decision.title}</h4>
                        <p className="card-description">{decision.description.slice(0, 100)}...</p>
                        <div className="card-footer">
                          <span className={`impact-indicator ${decision.impact.type}`}>
                            {decision.impact.type} impact: {decision.impact.magnitude}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

