// src/components/simulations/SimulationActions.tsx
// STRATFIT — Quick action buttons for saving/loading simulations

import React, { useState } from 'react';
import SaveSimulationModal from './SaveSimulationModal';
import LoadSimulationPanel from './LoadSimulationPanel';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';
import './SimulationStyles.css';

interface SimulationActionsProps {
  variant?: 'full' | 'compact' | 'icon-only';
  className?: string;
}

export default function SimulationActions({ variant = 'full', className = '' }: SimulationActionsProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  const savedCount = useSavedSimulationsStore((s) => s.simulations.length);
  const baseline = useSavedSimulationsStore((s) => s.simulations.find(s => s.isBaseline));
  
  const handleSaved = (id: string) => {
    // Could trigger a toast notification here
    console.log('Simulation saved:', id);
  };
  
  if (variant === 'icon-only') {
    return (
      <>
        <div className={`simulation-actions icon-only ${className}`}>
          <button 
            className="sim-action-btn"
            onClick={() => setShowSaveModal(true)}
            disabled={!hasSimulated}
            title="Save Simulation"
          >
            💾
          </button>
          <button 
            className="sim-action-btn"
            onClick={() => setShowLoadPanel(true)}
            title="Load Simulation"
          >
            📊
            {savedCount > 0 && (
              <span className="action-badge">{savedCount}</span>
            )}
          </button>
        </div>
        
        <SaveSimulationModal 
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSaved={handleSaved}
        />
        <LoadSimulationPanel 
          isOpen={showLoadPanel}
          onClose={() => setShowLoadPanel(false)}
        />
      </>
    );
  }
  
  if (variant === 'compact') {
    return (
      <>
        <div className={`simulation-actions compact ${className}`}>
          <button 
            className="sim-action-btn compact"
            onClick={() => setShowSaveModal(true)}
            disabled={!hasSimulated}
          >
            <span className="btn-emoji">💾</span>
            Save
          </button>
          <button 
            className="sim-action-btn compact"
            onClick={() => setShowLoadPanel(true)}
          >
            <span className="btn-emoji">📊</span>
            Load
            {savedCount > 0 && (
              <span className="action-badge">{savedCount}</span>
            )}
          </button>
        </div>
        
        <SaveSimulationModal 
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSaved={handleSaved}
        />
        <LoadSimulationPanel 
          isOpen={showLoadPanel}
          onClose={() => setShowLoadPanel(false)}
        />
      </>
    );
  }
  
  // Full variant
  return (
    <>
      <div className={`simulation-actions full ${className}`}>
        <div className="actions-header">
          <span className="actions-title">SIMULATIONS</span>
          {baseline && (
            <span className="baseline-indicator" title={`Baseline: ${baseline.name}`}>
              ⭐ {baseline.name}
            </span>
          )}
        </div>
        
        <div className="actions-buttons">
          <button 
            className="sim-action-btn full"
            onClick={() => setShowSaveModal(true)}
            disabled={!hasSimulated}
          >
            <span className="btn-emoji">💾</span>
            <span className="btn-text">
              <span className="btn-label">Save</span>
              <span className="btn-hint">Save current simulation</span>
            </span>
          </button>
          
          <button 
            className="sim-action-btn full"
            onClick={() => setShowLoadPanel(true)}
          >
            <span className="btn-emoji">📊</span>
            <span className="btn-text">
              <span className="btn-label">Load</span>
              <span className="btn-hint">{savedCount} saved simulations</span>
            </span>
            {savedCount > 0 && (
              <span className="action-badge">{savedCount}</span>
            )}
          </button>
        </div>
      </div>
      
      <SaveSimulationModal 
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaved={handleSaved}
      />
      <LoadSimulationPanel 
        isOpen={showLoadPanel}
        onClose={() => setShowLoadPanel(false)}
      />
    </>
  );
}

