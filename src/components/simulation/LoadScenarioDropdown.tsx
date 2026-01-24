// src/components/simulation/LoadScenarioDropdown.tsx
// STRATFIT — Load Scenario Dropdown

import React, { useState, useRef, useEffect } from 'react';
import { useScenarioStore, type Scenario } from '../../state/scenarioStore';
import { useLeverStore } from '../../state/leverStore';

import './LoadScenarioDropdown.css';

interface LoadScenarioDropdownProps {
  onLoad?: (scenario: Scenario) => void;
  showDelete?: boolean;
  showSetBaseline?: boolean;
}

export default function LoadScenarioDropdown({
  onLoad,
  showDelete = true,
  showSetBaseline = true,
}: LoadScenarioDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const scenarios = useScenarioStore(s => s.savedScenarios);
  const baseline = useScenarioStore(s => s.baseline);
  const deleteScenario = useScenarioStore(s => s.deleteScenario);
  const setBaseline = useScenarioStore(s => s.setBaseline);
  
  const setLevers = useLeverStore(s => s.setLevers);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setConfirmDelete(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Load scenario - apply levers
  const handleLoad = (scenario: Scenario) => {
    // Apply the saved lever values
    Object.entries(scenario.levers).forEach(([key, value]) => {
      setLevers({ [key]: value });
    });
    
    onLoad?.(scenario);
    setIsOpen(false);
  };
  
  // Set as baseline
  const handleSetBaseline = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBaseline(id);
  };
  
  // Delete scenario
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirmDelete === id) {
      deleteScenario(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };
  
  // Format date
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // No scenarios
  if (scenarios.length === 0) {
    return (
      <div className="load-scenario-dropdown empty">
        <button className="dropdown-trigger disabled" disabled>
          <span className="trigger-icon">📂</span>
          <span className="trigger-text">No Saved Scenarios</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className="load-scenario-dropdown" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="trigger-icon">📂</span>
        <span className="trigger-text">
          Load Scenario ({scenarios.length})
        </span>
        <span className="trigger-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="dropdown-menu">
          <div className="menu-header">
            <span>Saved Scenarios</span>
            <span className="count">{scenarios.length}</span>
          </div>
          
          <div className="menu-list">
            {scenarios.map((scenario: Scenario) => {
              const isBaseline = baseline?.id === scenario.id;
              const isConfirmingDelete = confirmDelete === scenario.id;
              
              return (
                <div
                  key={scenario.id}
                  className={`scenario-item ${isBaseline ? 'is-baseline' : ''}`}
                  onClick={() => handleLoad(scenario)}
                >
                  {/* Main content */}
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-name">
                        {isBaseline && <span className="baseline-badge">BASELINE</span>}
                        {scenario.name}
                      </span>
                      <span className="item-date">{formatDate(scenario.createdAt)}</span>
                    </div>
                    
                    {/* Stats preview */}
                    {scenario.simulation && (
                      <div className="item-stats">
                        <span className="stat">
                          <span className="stat-value">
                            {Math.round(scenario.simulation.survivalRate * 100)}%
                          </span>
                          <span className="stat-label">Survival</span>
                        </span>
                        <span className="stat">
                          <span className="stat-value">
                            ${(scenario.simulation.medianARR / 1e6).toFixed(1)}M
                          </span>
                          <span className="stat-label">ARR</span>
                        </span>
                        <span className="stat">
                          <span className="stat-value">
                            {Math.round(scenario.simulation.medianRunway)}mo
                          </span>
                          <span className="stat-label">Runway</span>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="item-actions">
                    {showSetBaseline && !isBaseline && (
                      <button
                        className="action-btn baseline-btn"
                        onClick={(e) => handleSetBaseline(scenario.id, e)}
                        title="Set as Baseline"
                      >
                        ⚑
                      </button>
                    )}
                    
                    {showDelete && (
                      <button
                        className={`action-btn delete-btn ${isConfirmingDelete ? 'confirm' : ''}`}
                        onClick={(e) => handleDelete(scenario.id, e)}
                        title={isConfirmingDelete ? 'Click again to confirm' : 'Delete'}
                      >
                        {isConfirmingDelete ? '✓' : '×'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="menu-footer">
            <span className="footer-hint">Click to load levers</span>
          </div>
        </div>
      )}
    </div>
  );
}
