// src/components/compare/ActionPanel.tsx
// STRATFIT — Action buttons for Compare View

import React, { useCallback } from 'react';
import type { Scenario } from '../../state/scenarioStore';
import { useScenarioStore } from '../../state/scenarioStore';
import { useLeverStore } from '../../state/leverStore';

interface ActionPanelProps {
  scenarioA: Scenario;
  scenarioB: Scenario;
}

export default function ActionPanel({ scenarioA, scenarioB }: ActionPanelProps) {
  const loadSnapshot = useLeverStore((s) => s.loadSnapshot);
  const saveAsBaseline = useScenarioStore((s) => s.saveAsBaseline);
  
  const handleAdoptA = useCallback(() => {
    loadSnapshot(scenarioA.levers);
  }, [scenarioA, loadSnapshot]);
  
  const handleAdoptB = useCallback(() => {
    loadSnapshot(scenarioB.levers);
  }, [scenarioB, loadSnapshot]);
  
  const handleSetBaseline = useCallback(() => {
    if (scenarioB.simulation) {
      saveAsBaseline(scenarioB.name, scenarioB.levers, scenarioB.simulation);
    }
  }, [scenarioB, saveAsBaseline]);
  
  const handleExport = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      scenarioA: {
        name: scenarioA.name,
        levers: scenarioA.levers,
        simulation: scenarioA.simulation,
      },
      scenarioB: {
        name: scenarioB.name,
        levers: scenarioB.levers,
        simulation: scenarioB.simulation,
      },
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratfit-compare-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [scenarioA, scenarioB]);
  
  return (
    <div className="action-panel">
      <div className="action-header">
        <span className="action-icon">⚡</span>
        <span className="action-title">ACTIONS</span>
      </div>
      
      <div className="action-buttons">
        <button className="action-btn adopt-a" onClick={handleAdoptA}>
          <span className="btn-icon">←</span>
          <span className="btn-label">Adopt Baseline</span>
          <span className="btn-sublabel">Load {scenarioA.name} levers</span>
        </button>
        
        <button className="action-btn" onClick={handleSetBaseline}>
          <span className="btn-icon">◎</span>
          <span className="btn-label">Set New Baseline</span>
          <span className="btn-sublabel">Make current the baseline</span>
        </button>
        
        <button className="action-btn adopt-b" onClick={handleAdoptB}>
          <span className="btn-icon">→</span>
          <span className="btn-label">Keep Current</span>
          <span className="btn-sublabel">Continue with {scenarioB.name}</span>
        </button>
      </div>
      
      <div className="action-secondary">
        <button className="action-btn secondary" onClick={handleExport}>
          <span className="btn-icon">↓</span>
          <span className="btn-label">Export Comparison</span>
        </button>
      </div>
    </div>
  );
}
