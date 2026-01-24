// src/components/compare/CompareTab.tsx
// STRATFIT — Complete Compare Tab with Lava Rivers, Timeline, Heatmap

import React, { useMemo, useState } from 'react';
import { useScenarioStore } from '../../state/scenarioStore';
import { useSimulationStore } from '../../state/simulationStore';
import { useLeverStore } from '../../state/leverStore';
import { useViewTogglesStore } from '../../state/viewTogglesStore';
import { useSavedSimulationsStore, type SavedSimulation } from '../../state/savedSimulationsStore';

import CompareHeader from './CompareHeader';
import ScenarioPanel from './ScenarioPanel';
import DeltaPanel from './DeltaPanel';
import DeltaNarrative from './DeltaNarrative';
import ActionPanel from './ActionPanel';
import EmptyCompareState from './EmptyCompareState';
import LavaRiversMountain from './LavaRiversMountain';
import CompareTimeline from './CompareTimeline';
import CompareHeatmap from './CompareHeatmap';
import { LoadSimulationPanel } from '../simulations';

import './CompareStyles.css';

// Convert SavedSimulation to Scenario format for comparison
function savedToScenario(saved: SavedSimulation) {
  return {
    id: saved.id,
    name: saved.name,
    levers: saved.levers,
    simulation: {
      survivalRate: saved.summary.survivalRate,
      medianARR: saved.summary.arrMedian,
      medianRunway: saved.summary.runwayMedian,
      medianCash: saved.summary.cashMedian,
      arrP10: saved.summary.arrP10,
      arrP50: saved.summary.arrMedian,
      arrP90: saved.summary.arrP90,
      runwayP10: saved.summary.runwayP10,
      runwayP50: saved.summary.runwayMedian,
      runwayP90: saved.summary.runwayP90,
      cashP10: saved.summary.cashP10,
      cashP50: saved.summary.cashMedian,
      cashP90: saved.summary.cashP90,
      overallScore: saved.summary.overallScore,
      overallRating: saved.summary.overallRating as 'CRITICAL' | 'CAUTION' | 'STABLE' | 'STRONG' | 'EXCEPTIONAL',
      monthlyARR: saved.monthlyARR || [],
      monthlyRunway: [],
      monthlySurvival: saved.monthlySurvival || [],
      arrBands: saved.arrBands || [],
      leverSensitivity: [],
      simulatedAt: new Date(saved.createdAt),
      iterations: 10000,
      executionTimeMs: 0,
    },
    createdAt: new Date(saved.createdAt),
    updatedAt: new Date(saved.createdAt),
    isBaseline: saved.isBaseline,
  };
}

export default function CompareTab() {
  // Load panel state
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  
  // Saved simulations store (new)
  const savedSimulations = useSavedSimulationsStore((s) => s.simulations);
  const savedBaseline = useSavedSimulationsStore((s) => s.simulations.find(sim => sim.isBaseline));
  
  // Scenario store (legacy support)
  const legacyBaseline = useScenarioStore((s) => s.baseline);
  const calculateDelta = useScenarioStore((s) => s.calculateDelta);
  const viewMode = useScenarioStore((s) => s.compareViewMode);
  const setViewMode = useScenarioStore((s) => s.setCompareViewMode);
  
  // Use saved baseline if available, otherwise fall back to legacy
  const baseline = useMemo(() => {
    if (savedBaseline) {
      return savedToScenario(savedBaseline);
    }
    return legacyBaseline;
  }, [savedBaseline, legacyBaseline]);
  
  // Toggles
  const { timelineEnabled, heatmapEnabled, currentTab } = useViewTogglesStore();
  const showTimeline = timelineEnabled && currentTab === 'compare';
  const showHeatmap = heatmapEnabled && currentTab === 'compare';
  
  // Current state as Scenario B
  const currentLevers = useLeverStore((s) => s.levers);
  const currentSimulation = useSimulationStore((s) => s.summary);
  const fullResult = useSimulationStore((s) => s.fullResult);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  
  // Build current scenario object
  const currentScenario = useMemo(() => {
    if (!currentSimulation || !fullResult) return null;
    
    return {
      id: 'current',
      name: 'Current Strategy',
      levers: { ...currentLevers },
      simulation: {
        survivalRate: currentSimulation.survivalRate,
        medianARR: currentSimulation.arrMedian,
        medianRunway: currentSimulation.runwayMedian,
        medianCash: currentSimulation.cashMedian,
        arrP10: currentSimulation.arrP10 || 0,
        arrP50: currentSimulation.arrMedian,
        arrP90: currentSimulation.arrP90 || 0,
        runwayP10: currentSimulation.runwayP10 || 0,
        runwayP50: currentSimulation.runwayMedian,
        runwayP90: currentSimulation.runwayP90 || 0,
        cashP10: currentSimulation.cashP10 || 0,
        cashP50: currentSimulation.cashMedian,
        cashP90: currentSimulation.cashP90 || 0,
        overallScore: currentSimulation.overallScore,
        overallRating: currentSimulation.overallRating as 'CRITICAL' | 'CAUTION' | 'STABLE' | 'STRONG' | 'EXCEPTIONAL',
        monthlyARR: fullResult.arrConfidenceBands?.map((b: { p50: number }) => b.p50) || [],
        monthlyRunway: [],
        monthlySurvival: fullResult.survivalByMonth || [],
        arrBands: fullResult.arrConfidenceBands || [],
        leverSensitivity: fullResult.sensitivityFactors || [],
        simulatedAt: new Date(),
        iterations: fullResult.iterations || 10000,
        executionTimeMs: fullResult.executionTimeMs || 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isBaseline: false,
    };
  }, [currentLevers, currentSimulation, fullResult]);
  
  // Calculate delta
  const delta = useMemo(() => {
    if (!baseline || !currentScenario) return null;
    return calculateDelta(baseline, currentScenario as any);
  }, [baseline, currentScenario, calculateDelta]);
  
  // ============================================================================
  // EMPTY STATES
  // ============================================================================
  
  if (!baseline) {
    return (
      <div className="compare-tab">
        <CompareHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <EmptyCompareState 
          type="no-baseline" 
          savedCount={savedSimulations.length}
          onLoadSaved={() => setShowLoadPanel(true)}
        />
        <LoadSimulationPanel 
          isOpen={showLoadPanel}
          onClose={() => setShowLoadPanel(false)}
          mode="compare"
        />
      </div>
    );
  }
  
  if (!hasSimulated || !currentScenario) {
    return (
      <div className="compare-tab">
        <CompareHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <EmptyCompareState 
          type="no-simulation" 
          baselineName={baseline.name}
          savedCount={savedSimulations.length}
          onLoadSaved={() => setShowLoadPanel(true)}
        />
        <LoadSimulationPanel 
          isOpen={showLoadPanel}
          onClose={() => setShowLoadPanel(false)}
          mode="compare"
        />
      </div>
    );
  }
  
  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <div className="compare-tab">
      {/* Header with view toggles */}
      <CompareHeader
        scenarioAName={baseline.name}
        scenarioBName="Current Strategy"
        divergence={delta?.divergenceScore || 0}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <div className="compare-content">
        {/* Main comparison area */}
        <div className="compare-main">
          {viewMode === 'terrain' ? (
            /* LAVA RIVERS VIEW */
            <div className="compare-terrain-view">
              <div className="terrain-center">
                <LavaRiversMountain
                  scenarioA={baseline}
                  scenarioB={currentScenario as any}
                  delta={delta!}
                />
              </div>
              
              {/* Side panels overlay on terrain */}
              <div className="terrain-panels">
                <ScenarioPanel
                  scenario={baseline}
                  label="SCENARIO A"
                  sublabel="BASELINE"
                  isBaseline={true}
                  color="cyan"
                  compact={true}
                />
                <ScenarioPanel
                  scenario={currentScenario as any}
                  label="SCENARIO B"
                  sublabel="CURRENT"
                  isBaseline={false}
                  color="amber"
                  compact={true}
                />
              </div>
            </div>
          ) : (
            /* DATA VIEW */
            <div className="compare-data-view">
              <ScenarioPanel
                scenario={baseline}
                label="SCENARIO A"
                sublabel="BASELINE"
                isBaseline={true}
                color="cyan"
              />
              <DeltaPanel delta={delta} />
              <ScenarioPanel
                scenario={currentScenario as any}
                label="SCENARIO B"
                sublabel="CURRENT"
                isBaseline={false}
                color="amber"
              />
            </div>
          )}
        </div>
        
        {/* View toggle buttons */}
        <div className="view-toggle-container">
          <button
            className={`view-toggle-btn ${viewMode === 'data' ? 'active' : ''}`}
            onClick={() => setViewMode('data')}
          >
            <span className="toggle-icon">▤</span>
            Data View
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'terrain' ? 'active' : ''}`}
            onClick={() => setViewMode('terrain')}
          >
            <span className="toggle-icon">▲</span>
            Terrain View
          </button>
        </div>
        
        {/* Timeline (if enabled) */}
        {showTimeline && delta && (
          <CompareTimeline delta={delta} />
        )}
        
        {/* Heatmap (if enabled) */}
        {showHeatmap && delta && (
          <CompareHeatmap delta={delta} />
        )}
        
        {/* Narrative */}
        <DeltaNarrative
          scenarioA={baseline}
          scenarioB={currentScenario as any}
          delta={delta}
        />
        
        {/* Actions */}
        <ActionPanel
          scenarioA={baseline}
          scenarioB={currentScenario as any}
        />
      </div>
    </div>
  );
}
