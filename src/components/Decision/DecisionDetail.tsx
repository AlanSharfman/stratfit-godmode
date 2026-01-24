// src/components/Decision/DecisionDetail.tsx
// STRATFIT — Decision Detail Panel

import React, { useState } from 'react';
import { useDecisionStore, type Decision, type DecisionStatus } from '../../state/decisionStore';

interface DecisionDetailProps {
  decision: Decision;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  growth: 'Growth',
  cost: 'Cost Management',
  product: 'Product',
  team: 'Team & Hiring',
  funding: 'Funding',
  market: 'Market Strategy',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  MEDIUM: '#fbbf24',
  LOW: '#22d3ee',
};

export default function DecisionDetail({ decision, onClose }: DecisionDetailProps) {
  const [notes, setNotes] = useState(decision.notes || '');
  const setDecisionStatus = useDecisionStore((s) => s.setDecisionStatus);
  const completeDecision = useDecisionStore((s) => s.completeDecision);
  const updateDecision = useDecisionStore((s) => s.updateDecision);
  
  const handleStatusChange = (status: DecisionStatus) => {
    if (status === 'COMPLETED') {
      completeDecision(decision.id, notes);
    } else {
      setDecisionStatus(decision.id, status);
    }
  };
  
  const handleSaveNotes = () => {
    updateDecision(decision.id, { notes });
  };
  
  return (
    <div className="decision-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="header-top">
          <span className={`priority-badge ${decision.priority.toLowerCase()}`}>
            {decision.priority}
          </span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <h2 className="detail-title">{decision.title}</h2>
        <div className="detail-meta">
          <span className="meta-item category">
            {CATEGORY_LABELS[decision.category]}
          </span>
          <span className="meta-item source">
            {decision.source === 'AI' ? '🤖 AI Generated' : '👤 User Added'}
          </span>
        </div>
      </div>
      
      {/* Description */}
      <div className="detail-section">
        <h4 className="section-title">Description</h4>
        <p className="detail-description">{decision.description}</p>
      </div>
      
      {/* Impact Assessment */}
      <div className="detail-section">
        <h4 className="section-title">Impact Assessment</h4>
        <div className="impact-grid">
          <div className="impact-item">
            <span className="impact-label">Type</span>
            <span className={`impact-value ${decision.impact.type}`}>
              {decision.impact.type.charAt(0).toUpperCase() + decision.impact.type.slice(1)}
            </span>
          </div>
          <div className="impact-item">
            <span className="impact-label">Magnitude</span>
            <div className="magnitude-bar">
              <div 
                className="magnitude-fill"
                style={{ width: `${decision.impact.magnitude}%` }}
              />
              <span className="magnitude-value">{decision.impact.magnitude}%</span>
            </div>
          </div>
          <div className="impact-item">
            <span className="impact-label">Timeframe</span>
            <span className="impact-value">{decision.impact.timeframe}</span>
          </div>
          <div className="impact-item">
            <span className="impact-label">Confidence</span>
            <span className="impact-value">{decision.confidence}%</span>
          </div>
        </div>
      </div>
      
      {/* Recommendation */}
      <div className="detail-section">
        <h4 className="section-title">AI Recommendation</h4>
        <div className={`recommendation-card ${decision.recommendation.toLowerCase().replace('_', '-')}`}>
          <span className="recommendation-icon">
            {decision.recommendation === 'DO_NOW' && '🔥'}
            {decision.recommendation === 'PLAN' && '📋'}
            {decision.recommendation === 'MONITOR' && '👁️'}
            {decision.recommendation === 'AVOID' && '⛔'}
          </span>
          <span className="recommendation-text">
            {decision.recommendation.replace('_', ' ')}
          </span>
        </div>
      </div>
      
      {/* Trade-offs */}
      {decision.tradeoffs.length > 0 && (
        <div className="detail-section">
          <h4 className="section-title">Trade-offs to Consider</h4>
          <ul className="tradeoff-list">
            {decision.tradeoffs.map((tradeoff, i) => (
              <li key={i} className="tradeoff-item">
                <span className="tradeoff-icon">⚖️</span>
                {tradeoff}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Dependencies */}
      {decision.dependencies.length > 0 && (
        <div className="detail-section">
          <h4 className="section-title">Dependencies</h4>
          <ul className="dependency-list">
            {decision.dependencies.map((dep, i) => (
              <li key={i} className="dependency-item">
                <span className="dependency-icon">🔗</span>
                {dep}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Notes */}
      <div className="detail-section">
        <h4 className="section-title">Notes</h4>
        <textarea
          className="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your notes..."
          rows={3}
        />
        <button className="save-notes-btn" onClick={handleSaveNotes}>
          Save Notes
        </button>
      </div>
      
      {/* Actions */}
      <div className="detail-actions">
        <h4 className="section-title">Status</h4>
        <div className="status-buttons">
          <button
            className={`status-btn pending ${decision.status === 'PENDING' ? 'active' : ''}`}
            onClick={() => handleStatusChange('PENDING')}
          >
            Pending
          </button>
          <button
            className={`status-btn in-progress ${decision.status === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => handleStatusChange('IN_PROGRESS')}
          >
            In Progress
          </button>
          <button
            className={`status-btn completed ${decision.status === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => handleStatusChange('COMPLETED')}
          >
            ✓ Complete
          </button>
          <button
            className={`status-btn deferred ${decision.status === 'DEFERRED' ? 'active' : ''}`}
            onClick={() => handleStatusChange('DEFERRED')}
          >
            Defer
          </button>
        </div>
      </div>
      
      {/* Timestamps */}
      <div className="detail-timestamps">
        <span className="timestamp">Created: {new Date(decision.createdAt).toLocaleDateString()}</span>
        {decision.completedAt && (
          <span className="timestamp completed">
            Completed: {new Date(decision.completedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

