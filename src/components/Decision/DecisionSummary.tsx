// src/components/Decision/DecisionSummary.tsx
// STRATFIT — Decision Summary Panel

import React from 'react';
import type { DecisionSnapshot } from '../../state/decisionStore';

interface DecisionSummaryProps {
  summary: DecisionSnapshot['summary'];
  insights: DecisionSnapshot['insights'];
}

export default function DecisionSummary({ summary, insights }: DecisionSummaryProps) {
  const totalActions = insights.survivalActions + insights.growthActions + 
                       insights.efficiencyActions + insights.riskActions;
  
  return (
    <div className="decision-summary-panel">
      {/* Top Priority Alert */}
      {summary.topPriority && (
        <div className="top-priority-card">
          <div className="priority-header">
            <span className="priority-icon">⚡</span>
            <span className="priority-label">TOP PRIORITY</span>
          </div>
          <h3 className="priority-title">{summary.topPriority.title}</h3>
          <div className="priority-meta">
            <span className={`priority-badge ${summary.topPriority.priority.toLowerCase()}`}>
              {summary.topPriority.priority}
            </span>
            <span className={`recommendation-badge ${summary.topPriority.recommendation.toLowerCase().replace('_', '-')}`}>
              {summary.topPriority.recommendation.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}
      
      {/* Action Breakdown */}
      <div className="action-breakdown">
        <h4 className="breakdown-title">
          <span className="title-icon">◈</span>
          ACTION BREAKDOWN
        </h4>
        
        <div className="breakdown-bars">
          {insights.survivalActions > 0 && (
            <div className="breakdown-item">
              <div className="item-header">
                <span className="item-icon survival">💀</span>
                <span className="item-label">Survival</span>
                <span className="item-count">{insights.survivalActions}</span>
              </div>
              <div className="item-bar">
                <div 
                  className="bar-fill survival"
                  style={{ width: `${(insights.survivalActions / totalActions) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {insights.growthActions > 0 && (
            <div className="breakdown-item">
              <div className="item-header">
                <span className="item-icon growth">📈</span>
                <span className="item-label">Growth</span>
                <span className="item-count">{insights.growthActions}</span>
              </div>
              <div className="item-bar">
                <div 
                  className="bar-fill growth"
                  style={{ width: `${(insights.growthActions / totalActions) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {insights.efficiencyActions > 0 && (
            <div className="breakdown-item">
              <div className="item-header">
                <span className="item-icon efficiency">⚙️</span>
                <span className="item-label">Efficiency</span>
                <span className="item-count">{insights.efficiencyActions}</span>
              </div>
              <div className="item-bar">
                <div 
                  className="bar-fill efficiency"
                  style={{ width: `${(insights.efficiencyActions / totalActions) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {insights.riskActions > 0 && (
            <div className="breakdown-item">
              <div className="item-header">
                <span className="item-icon risk">⚠️</span>
                <span className="item-label">Risk</span>
                <span className="item-count">{insights.riskActions}</span>
              </div>
              <div className="item-bar">
                <div 
                  className="bar-fill risk"
                  style={{ width: `${(insights.riskActions / totalActions) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Summary */}
      <div className="status-summary">
        <h4 className="summary-title">STATUS</h4>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-value pending">{summary.pendingCount}</span>
            <span className="status-label">Pending</span>
          </div>
          <div className="status-item">
            <span className="status-value completed">{summary.completedCount}</span>
            <span className="status-label">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

