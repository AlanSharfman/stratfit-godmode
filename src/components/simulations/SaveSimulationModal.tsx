// src/components/simulations/SaveSimulationModal.tsx
// STRATFIT — Save Simulation Modal
// God Mode styled modal for saving current simulation

import React, { useState, useEffect, useRef } from 'react';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';
import { useSimulationStore } from '@/state/simulationStore';
import { useLeverStore } from '@/state/leverStore';
import './SimulationStyles.css';

interface SaveSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

export default function SaveSimulationModal({ isOpen, onClose, onSaved }: SaveSimulationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [setAsBaseline, setSetAsBaseline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get current simulation data
  const summary = useSimulationStore((s) => s.summary);
  const fullResult = useSimulationStore((s) => s.fullResult);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  const levers = useLeverStore((s) => s.levers);
  
  // Save action
  const saveSimulation = useSavedSimulationsStore((s) => s.saveSimulation);
  const setAsBaselineAction = useSavedSimulationsStore((s) => s.setAsBaseline);
  const existingBaseline = useSavedSimulationsStore((s) => s.simulations.find(sim => sim.isBaseline));
  
  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Require an explicit user-provided name (no auto-generated defaults)
      setName('');
    }
  }, [isOpen]);
  
  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setSetAsBaseline(false);
      setIsSaving(false);
    }
  }, [isOpen]);
  
  const handleSave = () => {
    if (!name.trim() || !summary || !hasSimulated) return;
    
    setIsSaving(true);
    
    // Build saved simulation object
    const saved = saveSimulation({
      name: name.trim(),
      description: description.trim() || undefined,
      levers: { ...levers },
      summary: {
        survivalRate: summary.survivalRate,
        survivalPercent: summary.survivalPercent,
        arrMedian: summary.arrMedian,
        arrP10: summary.arrP10,
        arrP90: summary.arrP90,
        runwayMedian: summary.runwayMedian,
        runwayP10: summary.runwayP10,
        runwayP90: summary.runwayP90,
        cashMedian: summary.cashMedian,
        cashP10: summary.cashP10,
        cashP90: summary.cashP90,
        overallScore: summary.overallScore,
        overallRating: summary.overallRating,
      },
      monthlyARR: fullResult?.arrConfidenceBands?.map(b => b.p50) || [],
      monthlySurvival: fullResult?.survivalByMonth || [],
      arrBands: fullResult?.arrConfidenceBands || [],
      isBaseline: setAsBaseline,
      tags: [],
    });
    
    // If setting as baseline, update
    if (setAsBaseline) {
      setAsBaselineAction(saved.id);
    }
    
    setTimeout(() => {
      setIsSaving(false);
      onSaved?.(saved.id);
      onClose();
    }, 300);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  const canSave = name.trim().length > 0 && hasSimulated && summary;
  
  return (
    <div className="simulation-modal-overlay" onClick={onClose}>
      <div 
        className="simulation-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon">💾</span>
            <h2 className="modal-title">SAVE SIMULATION</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        {/* Content */}
        <div className="modal-content">
          {!hasSimulated ? (
            <div className="modal-warning">
              <span className="warning-icon">⚠️</span>
              <p>Run a simulation first before saving.</p>
            </div>
          ) : (
            <>
              {/* Preview current simulation */}
              <div className="simulation-preview">
                <div className="preview-header">CURRENT SIMULATION</div>
                <div className="preview-metrics">
                  <div className="preview-metric">
                    <span className="metric-label">SURVIVAL</span>
                    <span className="metric-value survival">{summary?.survivalPercent}</span>
                  </div>
                  <div className="preview-metric">
                    <span className="metric-label">ARR (P50)</span>
                    <span className="metric-value">{summary?.arrFormatted?.p50}</span>
                  </div>
                  <div className="preview-metric">
                    <span className="metric-label">SCORE</span>
                    <span className="metric-value score">{summary?.overallScore}</span>
                  </div>
                  <div className="preview-metric">
                    <span className="metric-label">RATING</span>
                    <span className={`metric-value rating ${summary?.overallRating?.toLowerCase()}`}>
                      {summary?.overallRating}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Name input */}
              <div className="input-group">
                <label className="input-label">SIMULATION NAME</label>
                <input
                  ref={inputRef}
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Aggressive Growth Q1"
                  maxLength={50}
                />
              </div>
              
              {/* Description input */}
              <div className="input-group">
                <label className="input-label">DESCRIPTION (OPTIONAL)</label>
                <textarea
                  className="input-field textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief notes about this strategy..."
                  maxLength={200}
                  rows={2}
                />
              </div>
              
              {/* Baseline toggle */}
              <div className="baseline-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={setAsBaseline}
                    onChange={(e) => setSetAsBaseline(e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">Set as Baseline</span>
                </label>
                {existingBaseline && setAsBaseline && (
                  <p className="baseline-warning">
                    This will replace "{existingBaseline.name}" as the baseline
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`modal-btn primary ${isSaving ? 'saving' : ''}`}
            onClick={handleSave}
            disabled={!canSave || isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <span className="btn-icon">💾</span>
                Save Simulation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

