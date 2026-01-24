// src/components/Decision/DecisionList.tsx
// STRATFIT — Decision List View

import React, { useMemo, useState } from 'react';
import { useDecisionStore, type Decision, type DecisionCategory, type DecisionStatus } from '../../state/decisionStore';

interface DecisionListProps {
  decisions: Decision[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const CATEGORY_ICONS: Record<DecisionCategory, string> = {
  growth: '📈',
  cost: '💰',
  product: '🎨',
  team: '👥',
  funding: '🏦',
  market: '🌍',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  MEDIUM: '#fbbf24',
  LOW: '#22d3ee',
};

export default function DecisionList({ decisions, onSelect, selectedId }: DecisionListProps) {
  const filterCategory = useDecisionStore((s) => s.filterCategory);
  const filterStatus = useDecisionStore((s) => s.filterStatus);
  const setFilterCategory = useDecisionStore((s) => s.setFilterCategory);
  const setFilterStatus = useDecisionStore((s) => s.setFilterStatus);
  const setDecisionStatus = useDecisionStore((s) => s.setDecisionStatus);
  
  // Filter decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter(d => {
      if (filterCategory !== 'all' && d.category !== filterCategory) return false;
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      return true;
    });
  }, [decisions, filterCategory, filterStatus]);
  
  const categories: (DecisionCategory | 'all')[] = ['all', 'growth', 'cost', 'product', 'team', 'funding', 'market'];
  const statuses: (DecisionStatus | 'all')[] = ['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED'];
  
  return (
    <div className="decision-list">
      <div className="list-header">
        <div className="list-title-row">
          <span className="list-icon">≡</span>
          <span className="list-title">ALL DECISIONS</span>
          <span className="list-count">{filteredDecisions.length} of {decisions.length}</span>
        </div>
        
        {/* Filters */}
        <div className="list-filters">
          <div className="filter-group">
            <span className="filter-label">Category:</span>
            <div className="filter-buttons">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat === 'all' ? 'All' : CATEGORY_ICONS[cat]}
                </button>
              ))}
            </div>
          </div>
          
          <div className="filter-group">
            <span className="filter-label">Status:</span>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as DecisionStatus | 'all')}
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="list-content">
        {filteredDecisions.length === 0 ? (
          <div className="list-empty">
            <span className="empty-icon">🔍</span>
            <p>No decisions match the current filters</p>
          </div>
        ) : (
          filteredDecisions.map(decision => (
            <div
              key={decision.id}
              className={`list-item ${selectedId === decision.id ? 'selected' : ''}`}
              onClick={() => onSelect(decision.id)}
            >
              {/* Priority indicator */}
              <div 
                className="item-priority-bar"
                style={{ background: PRIORITY_COLORS[decision.priority] }}
              />
              
              {/* Main content */}
              <div className="item-main">
                <div className="item-header">
                  <span className="item-category">{CATEGORY_ICONS[decision.category]}</span>
                  <h4 className="item-title">{decision.title}</h4>
                  <span 
                    className={`item-priority ${decision.priority.toLowerCase()}`}
                    style={{ color: PRIORITY_COLORS[decision.priority] }}
                  >
                    {decision.priority}
                  </span>
                </div>
                
                <p className="item-description">{decision.description}</p>
                
                <div className="item-footer">
                  <div className="item-tags">
                    <span className={`tag impact-${decision.impact.type}`}>
                      {decision.impact.type}
                    </span>
                    <span className={`tag recommendation-${decision.recommendation.toLowerCase().replace('_', '-')}`}>
                      {decision.recommendation.replace('_', ' ')}
                    </span>
                    <span className="tag timeframe">
                      {decision.impact.timeframe}
                    </span>
                  </div>
                  
                  {/* Quick status change */}
                  <div className="item-status">
                    <select
                      className={`status-select ${decision.status.toLowerCase()}`}
                      value={decision.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setDecisionStatus(decision.id, e.target.value as DecisionStatus)}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="DEFERRED">Deferred</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Confidence gauge */}
              <div className="item-confidence">
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ height: `${decision.confidence}%` }}
                  />
                </div>
                <span className="confidence-value">{decision.confidence}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

