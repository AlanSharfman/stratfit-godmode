// src/components/simulate/SimulateOverlayWired.tsx
// STRATFIT — Monte Carlo Simulation Overlay (Wired to Store)
// FIXED VERSION - Correct types for all stores and components

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RefreshCw, Save, Check, Star } from 'lucide-react';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';
import { useScenarioStore, type LeverSnapshot } from '@/state/scenarioStore';
import { useLeverStore } from '@/state/leverStore';
import { emitCompute } from '@/engine/computeTelemetry';
import { 
  type MonteCarloResult, 
  type LeverState,
  type SimulationConfig
} from '@/logic/monteCarloEngine';
import type { Verdict } from '@/logic/verdictGenerator';
import type { SimulationOutput } from '@/engine/runSimulation';

// Import sub-components
import SimulateHeader from './SimulateHeader';
import VerdictPanel from './VerdictPanel';
import ProbabilityDistribution from './ProbabilityDistribution';
import ConfidenceFan from './ConfidenceFan';
import ScenarioCards from './ScenarioCards';
import SensitivityBars from './SensitivityBars';
import SimulateNarrative from './SimulateNarrative';

// Import Save/Load components
import LoadScenarioDropdown from '../simulation/LoadScenarioDropdown';

import './SimulateStyles.css';

interface SimulateOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  levers: LeverState;
}

type SimulationPhase = 'idle' | 'running' | 'complete';

const round = (v: number) => Math.round(v);

export default function SimulateOverlayWired({ isOpen, onClose, levers }: SimulateOverlayProps) {
  const [phase, setPhase] = useState<SimulationPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [iterationCount, setIterationCount] = useState(0);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'distribution' | 'scenarios' | 'drivers'>('overview');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  
  const workerRef = useRef<Worker | null>(null);
  const lastRunLeversSnapshotRef = useRef<LeverSnapshot | null>(null);

  // Guard against rapid re-runs causing stale state writes
  const runIdRef = useRef(0);

  useEffect(() => {
    if (workerRef.current) return;

    workerRef.current = new Worker(
      new URL('../../workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Connect to simulation store
  const { setSimulationResult, beginRun, completeRun, failRun } = useSimulationStore();
  
  // Connect to saved simulations store
  const saveSimulation = useSavedSimulationsStore((s) => s.saveSimulation);
  const setAsBaseline = useSavedSimulationsStore((s) => s.setAsBaseline);
  const savedSimulations = useSavedSimulationsStore((s) => s.simulations);
  
  // Connect to scenario store (for COMPARE/RISK/ASSESSMENT surfaces)
  const saveAsBaselineToScenario = useScenarioStore((s) => s.saveAsBaseline);
  const saveScenarioToStore = useScenarioStore((s) => s.saveScenario);
  const hasLegacyBaseline = useScenarioStore((s) => s.baseline !== null);
  
  // Lever store for loading scenarios
  const setLevers = useLeverStore((s) => s.setLevers);

  // Simulation config
  const config: SimulationConfig = useMemo(() => ({
    iterations: 10000,
    timeHorizonMonths: 36,
    startingCash: 4000000,
    startingARR: 4800000,
    monthlyBurn: 47000,
  }), []);

  // Check if we have a baseline
  const hasBaseline = useMemo(() => {
    const savedBaseline = savedSimulations.find(s => s.isBaseline);
    return !!savedBaseline || hasLegacyBaseline;
  }, [savedSimulations, hasLegacyBaseline]);

  // Convert LeverState to LeverSnapshot for stores
  const leversAsSnapshot = useMemo((): LeverSnapshot => ({
    demandStrength: levers.demandStrength,
    pricingPower: levers.pricingPower,
    expansionVelocity: levers.expansionVelocity,
    costDiscipline: levers.costDiscipline,
    hiringIntensity: levers.hiringIntensity,
    operatingDrag: levers.operatingDrag,
    marketVolatility: levers.marketVolatility,
    executionRisk: levers.executionRisk,
    fundingPressure: levers.fundingPressure,
  }), [levers]);

  const handleWorkerMessage = useCallback(
    (event: MessageEvent<any>) => {
      const { runId, result, duration, error } = event.data ?? {};
      if (runIdRef.current !== runId) return;

      if (error) {
        console.error('Simulation worker error:', error);
        failRun(String(error));
        emitCompute("terrain_simulation", "error");
        setPhase('idle');
        setProgress(0);
        return;
      }

      const typed = result as SimulationOutput | undefined;
      if (!typed?.result || !typed?.verdict) {
        console.error('Worker returned invalid simulation payload:', event.data);
        failRun('Worker returned invalid simulation payload');
        emitCompute("terrain_simulation", "error");
        setPhase('idle');
        setProgress(0);
        return;
      }

      emitCompute("terrain_simulation", "aggregate");
      setProgress(100);
      setIterationCount(config.iterations);
      setResult(typed.result);
      setVerdict(typed.verdict);

      const snapshotForStore = lastRunLeversSnapshotRef.current ?? leversAsSnapshot;
      setSimulationResult(typed.result, typed.verdict, snapshotForStore);
      completeRun(typed.result, typed.verdict);

      emitCompute("terrain_simulation", "complete", {
        durationMs: typeof duration === 'number' ? round(duration) : undefined,
        iterations: config.iterations,
      });

      setTimeout(() => setPhase('complete'), 300);
    },
    [
      completeRun,
      config.iterations,
      failRun,
      leversAsSnapshot,
      setSimulationResult,
    ]
  );

  const handleWorkerError = useCallback(
    (err: ErrorEvent) => {
      console.error('Simulation worker error:', err);
      failRun((err as any)?.message ? String((err as any).message) : 'Worker error');
      emitCompute("terrain_simulation", "error");
      setPhase('idle');
      setProgress(0);
    },
    [failRun]
  );

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    worker.onmessage = handleWorkerMessage;
    worker.onerror = handleWorkerError as any;

    return () => {
      worker.onmessage = null;
      worker.onerror = null;
    };
  }, [handleWorkerError, handleWorkerMessage]);

  // Run simulation off main thread via Web Worker
  const triggerSimulation = useCallback(() => {
    if (!workerRef.current) return;

    const thisRunId = ++runIdRef.current;
    lastRunLeversSnapshotRef.current = leversAsSnapshot;

    setPhase('running');
    setProgress(0);
    setIterationCount(0);
    setResult(null);
    setVerdict(null);

    // ── Telemetry: begin run (single source of truth) ──
    beginRun({
      timeHorizonMonths: config.timeHorizonMonths,
      paths: config.iterations,
      seedLocked: true,
    });
    emitCompute("terrain_simulation", "initialize", { iterations: config.iterations, methodName: "Monte Carlo", target: "Simulation" });
    emitCompute("terrain_simulation", "run_model");

    workerRef.current.postMessage({ runId: thisRunId, levers, baseline: config });
  }, [beginRun, config, levers, leversAsSnapshot]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE AS BASELINE - SAVES TO BOTH STORES
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSaveAsBaseline = useCallback(() => {
    if (!result || !verdict) return;
    
    setSaveState('saving');
    
    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    
    // 1. Save to savedSimulationsStore - CORRECT: summary with all required fields
    const saved = saveSimulation({
      name: `Baseline (${timestamp})`,
      description: `Score: ${verdict.overallScore} | Survival: ${Math.round(result.survivalRate * 100)}%`,
      levers: leversAsSnapshot,
      summary: {
        survivalRate: result.survivalRate,
        survivalPercent: `${Math.round(result.survivalRate * 100)}%`,
        arrMedian: result.arrPercentiles.p50,
        arrP10: result.arrPercentiles.p10,
        arrP90: result.arrPercentiles.p90,
        runwayMedian: result.runwayPercentiles.p50,
        runwayP10: result.runwayPercentiles.p10,
        runwayP90: result.runwayPercentiles.p90,
        cashMedian: result.cashPercentiles.p50,
        cashP10: result.cashPercentiles.p10,
        cashP90: result.cashPercentiles.p90,
        overallScore: verdict.overallScore,
        overallRating: verdict.overallRating,
      },
      isBaseline: true,
    });
    
    // Mark as baseline using the returned ID - CORRECT: string ID
    if (saved?.id) {
      setAsBaseline(saved.id);
    }
    
    // 2. ALSO save to scenarioStore (enables COMPARE/RISK/ASSESSMENT surfaces)
    saveAsBaselineToScenario(
      `Baseline (${timestamp})`,
      leversAsSnapshot,
      {
        survivalRate: result.survivalRate,
        medianARR: result.arrPercentiles.p50,
        medianRunway: result.runwayPercentiles.p50,
        medianCash: result.cashPercentiles.p50,
        arrP10: result.arrPercentiles.p10,
        arrP50: result.arrPercentiles.p50,
        arrP90: result.arrPercentiles.p90,
        runwayP10: result.runwayPercentiles.p10,
        runwayP50: result.runwayPercentiles.p50,
        runwayP90: result.runwayPercentiles.p90,
        cashP10: result.cashPercentiles.p10,
        cashP50: result.cashPercentiles.p50,
        cashP90: result.cashPercentiles.p90,
        overallScore: verdict.overallScore,
        overallRating: verdict.overallRating as 'CRITICAL' | 'CAUTION' | 'STABLE' | 'STRONG' | 'EXCEPTIONAL',
        monthlyARR: [],
        monthlyRunway: [],
        monthlySurvival: [],
        arrBands: result.arrConfidenceBands?.map(b => ({ month: b.month, p10: b.p10, p50: b.p50, p90: b.p90 })) || [],
        leverSensitivity: result.sensitivityFactors?.map(f => ({ lever: String(f.lever), label: f.label, impact: f.impact })) || [],
        simulatedAt: new Date(),
        iterations: config.iterations,
        executionTimeMs: result.executionTimeMs,
      }
    );
    
    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 300);
  }, [result, verdict, leversAsSnapshot, saveSimulation, setAsBaseline, saveAsBaselineToScenario, config.iterations]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE AS NAMED SCENARIO
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSaveScenario = useCallback(() => {
    if (!result || !verdict || !scenarioName.trim()) return;
    
    setSaveState('saving');
    
    // Save to savedSimulationsStore
    saveSimulation({
      name: scenarioName.trim(),
      description: `Score: ${verdict.overallScore} | Survival: ${Math.round(result.survivalRate * 100)}%`,
      levers: leversAsSnapshot,
      summary: {
        survivalRate: result.survivalRate,
        survivalPercent: `${Math.round(result.survivalRate * 100)}%`,
        arrMedian: result.arrPercentiles.p50,
        arrP10: result.arrPercentiles.p10,
        arrP90: result.arrPercentiles.p90,
        runwayMedian: result.runwayPercentiles.p50,
        runwayP10: result.runwayPercentiles.p10,
        runwayP90: result.runwayPercentiles.p90,
        cashMedian: result.cashPercentiles.p50,
        cashP10: result.cashPercentiles.p10,
        cashP90: result.cashPercentiles.p90,
        overallScore: verdict.overallScore,
        overallRating: verdict.overallRating,
      },
      isBaseline: false,
    });
    
    // Also save to scenarioStore
    saveScenarioToStore(
      scenarioName.trim(),
      leversAsSnapshot,
      {
        survivalRate: result.survivalRate,
        medianARR: result.arrPercentiles.p50,
        medianRunway: result.runwayPercentiles.p50,
        medianCash: result.cashPercentiles.p50,
        arrP10: result.arrPercentiles.p10,
        arrP50: result.arrPercentiles.p50,
        arrP90: result.arrPercentiles.p90,
        runwayP10: result.runwayPercentiles.p10,
        runwayP50: result.runwayPercentiles.p50,
        runwayP90: result.runwayPercentiles.p90,
        cashP10: result.cashPercentiles.p10,
        cashP50: result.cashPercentiles.p50,
        cashP90: result.cashPercentiles.p90,
        overallScore: verdict.overallScore,
        overallRating: verdict.overallRating as 'CRITICAL' | 'CAUTION' | 'STABLE' | 'STRONG' | 'EXCEPTIONAL',
        monthlyARR: [],
        monthlyRunway: [],
        monthlySurvival: [],
        arrBands: result.arrConfidenceBands?.map(b => ({ month: b.month, p10: b.p10, p50: b.p50, p90: b.p90 })) || [],
        leverSensitivity: result.sensitivityFactors?.map(f => ({ lever: String(f.lever), label: f.label, impact: f.impact })) || [],
        simulatedAt: new Date(),
        iterations: config.iterations,
        executionTimeMs: result.executionTimeMs,
      }
    );
    
    setTimeout(() => {
      setSaveState('saved');
      setShowSaveModal(false);
      setScenarioName('');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 300);
  }, [result, verdict, leversAsSnapshot, scenarioName, saveSimulation, saveScenarioToStore, config.iterations]);

  // Load scenario - applies levers and re-runs
  const handleLoadScenario = useCallback((scenario: any) => {
    if (scenario.levers) {
      setLevers(scenario.levers);
    }
    setTimeout(() => {
      triggerSimulation();
    }, 100);
  }, [setLevers, triggerSimulation]);

  // Auto-run on open
  useEffect(() => {
    if (isOpen && phase === 'idle') {
      triggerSimulation();
    }
  }, [isOpen, phase, triggerSimulation]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setActiveSection('overview');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="simulate-overlay">
      <div className="simulate-container">
        {/* Header with Load Dropdown */}
        <div className="simulate-header-row">
          <SimulateHeader 
            onClose={onClose}
            onRerun={triggerSimulation}  // FIXED: Added onRerun prop
            phase={phase}
            iterations={config.iterations}
            executionTime={result?.executionTimeMs}
          />
          
          {/* Load Scenario Dropdown - Top Right */}
          <div className="simulate-load-section">
            <LoadScenarioDropdown 
              onLoad={handleLoadScenario}
              showDelete={true}
              showSetBaseline={true}
            />
          </div>
        </div>

        {/* Loading State */}
        {phase === 'running' && (
          <div className="simulate-loading">
            <div className="simulate-loading-content">
              <div className="simulate-loading-icon">
                <RefreshCw className="animate-spin" size={48} />
              </div>
              <div className="simulate-progress-container">
                <div 
                  className="simulate-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="simulate-loading-text">
                Running Monte Carlo simulation...
              </p>
              <p className="simulate-iteration-count">
                {iterationCount.toLocaleString()} / {config.iterations.toLocaleString()} iterations
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === 'complete' && result && verdict && (
          <div className="simulate-results">
            {/* Headline */}
            <div className="simulate-headline">
              <h2 className="simulate-verdict-title">{verdict.headline}</h2>
              <p className="simulate-verdict-summary">
                Based on {config.iterations.toLocaleString()} simulations over {config.timeHorizonMonths} months.
              </p>
            </div>

            {/* Nav Tabs + Save Buttons */}
            <div className="simulate-nav-row">
              <nav className="simulate-nav">
                {[
                  { id: 'overview', label: 'OVERVIEW' },
                  { id: 'distribution', label: 'DISTRIBUTION' },
                  { id: 'scenarios', label: 'SCENARIOS' },
                  { id: 'drivers', label: 'DRIVERS' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`simulate-nav-tab ${activeSection === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(tab.id as any)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              
              {/* SAVE BUTTONS */}
              <div className="simulate-save-actions">
                <button 
                  className={`simulate-save-btn baseline ${saveState}`}
                  onClick={handleSaveAsBaseline}
                  disabled={saveState !== 'idle'}
                >
                  {saveState === 'saved' ? (
                    <><Check size={16} /> SAVED</>
                  ) : saveState === 'saving' ? (
                    <><RefreshCw size={16} className="spin" /> SAVING...</>
                  ) : (
                    <><Star size={16} /> {hasBaseline ? 'UPDATE BASELINE' : 'SET AS BASELINE'}</>
                  )}
                </button>
                
                <button 
                  className="simulate-save-btn scenario"
                  onClick={() => setShowSaveModal(true)}
                  disabled={saveState !== 'idle'}
                >
                  <Save size={16} /> SAVE SCENARIO
                </button>
              </div>
            </div>

            {/* Content Sections */}
            {activeSection === 'overview' && (
              <div className="simulate-section simulate-overview">
                <VerdictPanel verdict={verdict} result={result} />
              </div>
            )}

            {activeSection === 'distribution' && (
              <div className="simulate-section simulate-distribution">
                <div className="distribution-grid">
                  <div className="distribution-main">
                    <h3 className="section-title">ARR DISTRIBUTION</h3>
                    {/* FIXED: Added stats prop */}
                    <ProbabilityDistribution 
                      histogram={result.arrHistogram} 
                      percentiles={result.arrPercentiles}
                      stats={result.arrDistribution}
                    />
                  </div>
                  <div className="distribution-side">
                    <h3 className="section-title">CONFIDENCE BANDS</h3>
                    {/* FIXED: prop is "data" not "bands" */}
                    <ConfidenceFan data={result.arrConfidenceBands} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'scenarios' && (
              <div className="simulate-section simulate-scenarios">
                <ScenarioCards 
                  bestCase={result.bestCase}
                  worstCase={result.worstCase}
                  medianCase={result.medianCase}
                  verdict={verdict}
                />
              </div>
            )}

            {activeSection === 'drivers' && (
              <div className="simulate-section simulate-drivers">
                <div className="drivers-grid">
                  <div className="drivers-main">
                    <h3 className="section-title">SENSITIVITY ANALYSIS</h3>
                    <SensitivityBars factors={result.sensitivityFactors} />
                  </div>
                  <div className="drivers-side">
                    <SimulateNarrative verdict={verdict} />
                  </div>
                </div>
              </div>
            )}

            {/* Baseline Hint */}
            {!hasBaseline && (
              <div className="simulate-baseline-hint">
                <Star size={16} />
                <span>
                  <strong>Tip:</strong> Save as baseline to unlock COMPARE, RISK, and STRATEGIC ASSESSMENT.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Scenario Modal */}
      {showSaveModal && (
        <div className="save-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="save-modal" onClick={e => e.stopPropagation()}>
            <h3 className="save-modal-title">Save Scenario</h3>
            <p className="save-modal-desc">Name this scenario for later comparison.</p>
            
            <input
              type="text"
              className="save-modal-input"
              placeholder="e.g., Aggressive Growth, Conservative..."
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveScenario()}
            />
            
            <div className="save-modal-actions">
              <button className="save-modal-btn cancel" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button 
                className="save-modal-btn save"
                onClick={handleSaveScenario}
                disabled={!scenarioName.trim()}
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
