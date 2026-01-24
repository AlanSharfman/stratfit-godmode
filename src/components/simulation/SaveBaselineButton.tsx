// src/components/simulation/SaveBaselineButton.tsx
// STRATFIT — Save Baseline Button for Simulate Tab

import React, { useState } from 'react';
import { useScenarioStore } from '../../state/scenarioStore';
import { useLeverStore } from '../../state/leverStore';
import { useSimulationStore } from '../../state/simulationStore';

import './SaveBaselineButton.css';

interface SaveBaselineButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  showSaveAs?: boolean;
  onSaved?: (scenarioId: string) => void;
}

export default function SaveBaselineButton({
  variant = 'primary',
  showSaveAs = true,
  onSaved,
}: SaveBaselineButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  
  const saveAsBaseline = useScenarioStore(s => s.saveAsBaseline);
  const saveScenario = useScenarioStore(s => s.saveScenario);
  const hasBaseline = useScenarioStore(s => s.baseline !== null);
  const baseline = useScenarioStore(s => s.baseline);
  
  const levers = useLeverStore(s => s.levers);
  const simulation = useSimulationStore(s => s.summary);
  const hasSimulated = useSimulationStore(s => s.hasSimulated);
  
  // Quick save as baseline
  const handleQuickSave = () => {
    if (!simulation) return;
    
    setIsSaving(true);
    
    // Map SimulationSummary to SimulationSnapshot format
    saveAsBaseline(
      'Baseline',
      levers,
      {
        survivalRate: simulation.survivalRate,
        medianARR: simulation.arrMedian,
        medianRunway: simulation.runwayMedian,
        medianCash: simulation.cashMedian,
        arrP10: simulation.arrP10,
        arrP50: simulation.arrMedian,
        arrP90: simulation.arrP90,
        runwayP10: simulation.runwayP10,
        runwayP50: simulation.runwayMedian,
        runwayP90: simulation.runwayP90,
        cashP10: simulation.cashP10,
        cashP50: simulation.cashMedian,
        cashP90: simulation.cashP90,
        overallScore: simulation.overallScore,
        overallRating: simulation.overallRating as 'CRITICAL' | 'CAUTION' | 'STABLE' | 'STRONG' | 'EXCEPTIONAL',
        monthlyARR: [],
        monthlyRunway: [],
        monthlySurvival: [],
        arrBands: [],
        leverSensitivity: [],
        simulatedAt: new Date(),
        iterations: 10000,
        executionTimeMs: 0,
      }
    );
    
    setTimeout(() => {
      setIsSaving(false);
      setJustSaved(true);
      onSaved?.('baseline');
      
      // Reset "saved" state after 2 seconds
      setTimeout(() => setJustSaved(false), 2000);
    }, 300);
  };
  
  // Save with custom name
  const handleSaveAs = () => {
    if (!simulation || !scenarioName.trim()) return;
    
    setIsSaving(true);
    
    const saved = saveScenario(
      scenarioName.trim(),
      levers,
      {
        survivalRate: simulation.survivalRate,
        medianARR: simulation.arrMedian,
        medianRunway: simulation.runwayMedian,
        medianCash: simulation.cashMedian,
        arrP10: simulation.arrP10,
        arrP50: simulation.arrMedian,
        arrP90: simulation.arrP90,
        runwayP10: simulation.runwayP10,
        runwayP50: simulation.runwayMedian,
        runwayP90: simulation.runwayP90,
        cashP10: simulation.cashP10,
        cashP50: simulation.cashMedian,
        cashP90: simulation.cashP90,
        overallScore: simulation.overallScore,
        overallRating: simulation.overallRating as 'CRITICAL' | 'CAUTION' | 'STABLE' | 'STRONG' | 'EXCEPTIONAL',
        monthlyARR: [],
        monthlyRunway: [],
        monthlySurvival: [],
        arrBands: [],
        leverSensitivity: [],
        simulatedAt: new Date(),
        iterations: 10000,
        executionTimeMs: 0,
      }
    );
    
    setTimeout(() => {
      setIsSaving(false);
      setShowModal(false);
      setScenarioName('');
      setDescription('');
      setJustSaved(true);
      onSaved?.(saved.id);
      
      setTimeout(() => setJustSaved(false), 2000);
    }, 300);
  };
  
  // Disabled state
  if (!hasSimulated || !simulation) {
    return (
      <button className={`save-baseline-btn ${variant} disabled`} disabled>
        <span className="btn-icon">💾</span>
        <span className="btn-text">Run Simulation First</span>
      </button>
    );
  }
  
  return (
    <>
      <div className="save-baseline-container">
        {/* Main save button */}
        <button
          className={`save-baseline-btn ${variant} ${isSaving ? 'saving' : ''} ${justSaved ? 'saved' : ''}`}
          onClick={handleQuickSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="btn-spinner" />
              <span className="btn-text">Saving...</span>
            </>
          ) : justSaved ? (
            <>
              <span className="btn-icon">✓</span>
              <span className="btn-text">Saved as Baseline!</span>
            </>
          ) : hasBaseline ? (
            <>
              <span className="btn-icon">🔄</span>
              <span className="btn-text">Update Baseline</span>
            </>
          ) : (
            <>
              <span className="btn-icon">💾</span>
              <span className="btn-text">Save as Baseline</span>
            </>
          )}
        </button>
        
        {/* Save As button */}
        {showSaveAs && (
          <button
            className="save-as-btn"
            onClick={() => setShowModal(true)}
            title="Save with custom name"
          >
            ▼
          </button>
        )}
      </div>
      
      {/* Current baseline indicator */}
      {hasBaseline && baseline && (
        <div className="baseline-indicator">
          <span className="indicator-dot" />
          <span className="indicator-text">
            Baseline: {baseline.name}
          </span>
          <span className="indicator-time">
            {new Date(baseline.createdAt).toLocaleTimeString()}
          </span>
        </div>
      )}
      
      {/* Save As Modal */}
      {showModal && (
        <div className="save-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="save-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Save Scenario</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Scenario Name *</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={e => setScenarioName(e.target.value)}
                  placeholder="e.g., Aggressive Growth, Conservative Plan"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Notes about this scenario..."
                  rows={3}
                />
              </div>
              
              {/* Preview */}
              <div className="scenario-preview">
                <span className="preview-label">Saving:</span>
                <div className="preview-stats">
                  <span className="stat">
                    <span className="stat-value">{Math.round(simulation.survivalRate * 100)}%</span>
                    <span className="stat-label">Survival</span>
                  </span>
                  <span className="stat">
                    <span className="stat-value">${(simulation.arrMedian / 1e6).toFixed(1)}M</span>
                    <span className="stat-label">ARR</span>
                  </span>
                  <span className="stat">
                    <span className="stat-value">{Math.round(simulation.runwayMedian)}mo</span>
                    <span className="stat-label">Runway</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveAs}
                disabled={!scenarioName.trim() || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save & Set as Baseline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
