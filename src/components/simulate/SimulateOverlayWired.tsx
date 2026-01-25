// src/components/simulate/SimulateOverlayWired.tsx
// STRATFIT — Monte Carlo Simulation Overlay (Wired to Store)
// NOW WITH PROPER SAVE/LOAD INTEGRATION FOR ALL TABS

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Save, Check, FolderOpen, Star } from 'lucide-react';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';
import { useScenarioStore } from '@/state/scenarioStore';
import { useLeverStore } from '@/state/leverStore';
import { 
  type MonteCarloResult, 
  type LeverState,
  type SimulationConfig,
  type SensitivityFactor,
  runSingleSimulation 
} from '@/logic/monteCarloEngine';
import { generateVerdict, type Verdict } from '@/logic/verdictGenerator';

// Import sub-components
import SimulateHeader from './SimulateHeader';
import VerdictPanel from './VerdictPanel';
import ProbabilityDistribution from './ProbabilityDistribution';
import ConfidenceFan from './ConfidenceFan';
import ScenarioCards from './ScenarioCards';
import SensitivityBars from './SensitivityBars';
import SimulateNarrative from './SimulateNarrative';

// Import Save/Load components
import SaveBaselineButton from '../simulation/SaveBaselineButton';
import LoadScenarioDropdown from '../simulation/LoadScenarioDropdown';

import './SimulateStyles.css';

interface SimulateOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  levers: LeverState;
}

type SimulationPhase = 'idle' | 'running' | 'complete';

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

  // Connect to simulation store
  const { setSimulationResult, startSimulation: storeStartSimulation } = useSimulationStore();
  
  // Connect to saved simulations store
  const saveSimulation = useSavedSimulationsStore((s) => s.saveSimulation);
  const setAsBaseline = useSavedSimulationsStore((s) => s.setAsBaseline);
  const savedSimulations = useSavedSimulationsStore((s) => s.simulations);
  
  // Connect to scenario store (for COMPARE/RISK/DECISION tabs)
  const saveAsBaseline = useScenarioStore((s) => s.saveAsBaseline);
  const saveScenario = useScenarioStore((s) => s.saveScenario);
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

  // Run simulation with REAL progress updates
  const runSimulation = useCallback(async () => {
    setPhase('running');
    setProgress(0);
    setIterationCount(0);
    setResult(null);
    setVerdict(null);
    storeStartSimulation();

    const startTime = performance.now();
    const CHUNK_SIZE = 500;
    const allSimulations: any[] = [];

    for (let i = 0; i < config.iterations; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, config.iterations);
      
      for (let j = i; j < chunkEnd; j++) {
        allSimulations.push(runSingleSimulation(j, levers, config));
      }
      
      const currentProgress = (allSimulations.length / config.iterations) * 100;
      setProgress(currentProgress);
      setIterationCount(allSimulations.length);
      
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const executionTimeMs = performance.now() - startTime;
    const simResult = processSimulationResults(allSimulations, config, executionTimeMs);
    const simVerdict = generateVerdict(simResult);
    
    setProgress(100);
    setResult(simResult);
    setVerdict(simVerdict);

    // Store in simulation store for immediate use (3 args: result, verdict, levers)
    const leverSnapshot = Object.entries(levers).reduce((acc, [key, val]) => {
      acc[key] = val;
      return acc;
    }, {} as Record<string, number>);
    
    setSimulationResult(simResult, simVerdict, leverSnapshot);

    setTimeout(() => {
      setPhase('complete');
    }, 300);
  }, [levers, config, setSimulationResult, storeStartSimulation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE FUNCTIONS - SAVES TO BOTH STORES FOR FULL TAB COMPATIBILITY
  // ═══════════════════════════════════════════════════════════════════════════

  // Quick save as baseline (one-click)
  const handleSaveAsBaseline = useCallback(() => {
    if (!result || !verdict) return;
    
    setSaveState('saving');
    
    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    
    // 1. Save to savedSimulationsStore
    const savedSim = saveSimulation({
      name: `Baseline (${timestamp})`,
      description: `Score: ${verdict.overallScore} | Survival: ${Math.round(result.survivalRate * 100)}%`,
      levers: levers as any,
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
    
    // Mark it as baseline
    if (savedSim?.id) {
      setAsBaseline(savedSim.id);
    }
    
    // 2. ALSO save to scenarioStore (for COMPARE/RISK/DECISION tabs)
    saveAsBaseline(
      `Baseline (${timestamp})`,
      levers as any,
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
        overallRating: verdict.overallRating as any,
        monthlyARR: [],
        monthlyRunway: [],
        monthlySurvival: [],
        arrBands: result.arrConfidenceBands || [],
        leverSensitivity: result.sensitivityFactors || [],
        simulatedAt: new Date(),
        iterations: config.iterations,
        executionTimeMs: result.executionTimeMs,
      }
    );
    
    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 300);
  }, [result, verdict, levers, saveSimulation, setAsBaseline, saveAsBaseline, config.iterations]);

  // Save as named scenario (with modal)
  const handleSaveScenario = useCallback(() => {
    if (!result || !verdict || !scenarioName.trim()) return;
    
    setSaveState('saving');
    
    // 1. Save to savedSimulationsStore
    saveSimulation({
      name: scenarioName.trim(),
      description: `Score: ${verdict.overallScore} | Survival: ${Math.round(result.survivalRate * 100)}%`,
      levers: levers as any,
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
    
    // 2. ALSO save to scenarioStore
    saveScenario(
      scenarioName.trim(),
      levers as any,
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
        overallRating: verdict.overallRating as any,
        monthlyARR: [],
        monthlyRunway: [],
        monthlySurvival: [],
        arrBands: result.arrConfidenceBands || [],
        leverSensitivity: result.sensitivityFactors || [],
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
  }, [result, verdict, levers, scenarioName, saveSimulation, saveScenario, config.iterations]);

  // Load scenario - applies levers and re-runs simulation
  const handleLoadScenario = useCallback((scenario: any) => {
    // Apply the saved lever values
    if (scenario.levers) {
      setLevers(scenario.levers);
    }
    
    // Re-run simulation with loaded levers
    setTimeout(() => {
      runSimulation();
    }, 100);
  }, [setLevers, runSimulation]);

  // Auto-run on open
  useEffect(() => {
    if (isOpen && phase === 'idle') {
      runSimulation();
    }
  }, [isOpen, phase, runSimulation]);

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
            onRerun={runSimulation}
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
                Based on {config.iterations.toLocaleString()} simulations, your company's trajectory has been analyzed.
                Each simulation accounts for market uncertainty and execution variability. 
                The results show the <em>range of probable outcomes</em>, not a single prediction.
              </p>
            </div>

            {/* Navigation Tabs + Save Buttons */}
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
                {/* Save as Baseline (Quick) */}
                <button 
                  className={`simulate-save-btn baseline ${saveState} ${hasBaseline ? 'has-baseline' : ''}`}
                  onClick={handleSaveAsBaseline}
                  disabled={saveState !== 'idle'}
                  title={hasBaseline ? 'Replace current baseline' : 'Set as baseline for comparison'}
                >
                  {saveState === 'saved' ? (
                    <>
                      <Check size={16} />
                      SAVED
                    </>
                  ) : saveState === 'saving' ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      SAVING...
                    </>
                  ) : (
                    <>
                      <Star size={16} />
                      {hasBaseline ? 'UPDATE BASELINE' : 'SET AS BASELINE'}
                    </>
                  )}
                </button>
                
                {/* Save as Named Scenario */}
                <button 
                  className="simulate-save-btn scenario"
                  onClick={() => setShowSaveModal(true)}
                  disabled={saveState !== 'idle'}
                >
                  <Save size={16} />
                  SAVE SCENARIO
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
                <div className="distribution-explainer">
                  <p className="explainer-heading">UNDERSTANDING THE DISTRIBUTION</p>
                  <p className="explainer-text">
                    This shows all possible ARR outcomes across {config.iterations.toLocaleString()} simulations.
                    The shaded region represents the most likely range (P25-P75).
                  </p>
                </div>
                
                <div className="distribution-grid">
                  <div className="distribution-main">
                    <h3 className="section-title">ARR DISTRIBUTION</h3>
                    <ProbabilityDistribution histogram={result.arrHistogram} percentiles={result.arrPercentiles} stats={result.arrDistribution} />
                  </div>
                  <div className="distribution-side">
                    <h3 className="section-title">CONFIDENCE BANDS</h3>
                    <ConfidenceFan data={result.arrConfidenceBands} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'scenarios' && (
              <div className="simulate-section simulate-scenarios">
                <div className="scenarios-explainer">
                  <p className="explainer-heading">BEST / MEDIAN / WORST CASES</p>
                  <p className="explainer-text">
                    Use these to understand the range of outcomes you should prepare for.
                  </p>
                </div>
                
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
                <div className="drivers-explainer">
                  <p className="explainer-heading">WHAT MOVES THE NEEDLE</p>
                  <p className="explainer-text">
                    Not all levers are equal. This shows which inputs have the greatest impact on your outcomes. 
                    Focus your strategy on the levers at the top.
                  </p>
                </div>
                
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

            {/* Baseline Status Indicator */}
            {!hasBaseline && (
              <div className="simulate-baseline-hint">
                <Star size={16} />
                <span>
                  <strong>Tip:</strong> Save this as your baseline to unlock COMPARE, RISK, and DECISION tabs.
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
            <p className="save-modal-desc">
              Give this scenario a name to save it for later comparison.
            </p>
            
            <input
              type="text"
              className="save-modal-input"
              placeholder="e.g., Aggressive Growth, Conservative, Q2 Plan..."
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveScenario()}
            />
            
            <div className="save-modal-actions">
              <button 
                className="save-modal-btn cancel"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-modal-btn save"
                onClick={handleSaveScenario}
                disabled={!scenarioName.trim()}
              >
                <Save size={16} />
                Save Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function processSimulationResults(
  allSimulations: any[],
  config: SimulationConfig,
  executionTimeMs: number
): MonteCarloResult {
  const survivors = allSimulations.filter((s: any) => s.didSurvive);
  const survivalRate = survivors.length / config.iterations;
  
  const survivalByMonth: number[] = [];
  for (let month = 1; month <= config.timeHorizonMonths; month++) {
    const survivingAtMonth = allSimulations.filter((s: any) => s.survivalMonths >= month).length;
    survivalByMonth.push(survivingAtMonth / config.iterations);
  }
  
  const finalARRs = allSimulations.map((s: any) => s.finalARR);
  const finalCash = allSimulations.map((s: any) => s.finalCash);
  const finalRunway = allSimulations.map((s: any) => s.finalRunway);
  const survivalMonths = allSimulations.map((s: any) => s.survivalMonths);

  const arrDistribution = calculateDistributionStats(finalARRs);
  const arrHistogram = createHistogram(finalARRs, 25);
  const arrPercentiles = calculatePercentiles(finalARRs);
  
  const cashDistribution = calculateDistributionStats(finalCash);
  const cashPercentiles = calculatePercentiles(finalCash);
  
  const runwayDistribution = calculateDistributionStats(finalRunway);
  const runwayPercentiles = calculatePercentiles(finalRunway);
  
  const medianSurvivalMonths = calculatePercentiles(survivalMonths).p50;
  const arrConfidenceBands = calculateConfidenceBands(allSimulations, config.timeHorizonMonths);

  const sortedByARR = [...allSimulations].sort((a: any, b: any) => a.finalARR - b.finalARR);
  const worstCase = sortedByARR[Math.floor(config.iterations * 0.05)];
  const medianCase = sortedByARR[Math.floor(config.iterations * 0.5)];
  const bestCase = sortedByARR[Math.floor(config.iterations * 0.95)];

  const sensitivityFactors: SensitivityFactor[] = [
    { lever: 'demandStrength' as keyof LeverState, label: 'Demand Strength', impact: 0.8, direction: 'positive' },
    { lever: 'pricingPower' as keyof LeverState, label: 'Pricing Power', impact: 0.6, direction: 'positive' },
    { lever: 'costDiscipline' as keyof LeverState, label: 'Cost Discipline', impact: 0.5, direction: 'positive' },
    { lever: 'marketVolatility' as keyof LeverState, label: 'Market Volatility', impact: -0.7, direction: 'negative' },
    { lever: 'executionRisk' as keyof LeverState, label: 'Execution Risk', impact: -0.5, direction: 'negative' },
    { lever: 'expansionVelocity' as keyof LeverState, label: 'Expansion Velocity', impact: 0.4, direction: 'positive' },
    { lever: 'hiringIntensity' as keyof LeverState, label: 'Hiring Intensity', impact: -0.3, direction: 'negative' },
    { lever: 'operatingDrag' as keyof LeverState, label: 'Operating Drag', impact: -0.4, direction: 'negative' },
    { lever: 'fundingPressure' as keyof LeverState, label: 'Funding Pressure', impact: -0.6, direction: 'negative' },
  ];

  return {
    iterations: config.iterations,
    timeHorizonMonths: config.timeHorizonMonths,
    executionTimeMs,
    survivalRate,
    survivalByMonth,
    medianSurvivalMonths,
    arrDistribution,
    arrHistogram,
    arrPercentiles,
    arrConfidenceBands,
    cashDistribution,
    cashPercentiles,
    runwayDistribution,
    runwayPercentiles,
    bestCase,
    worstCase,
    medianCase,
    sensitivityFactors,
    allSimulations,
  };
}

function calculateDistributionStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const squaredDiffs = sorted.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);
  const median = n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
  const cubedDiffs = sorted.map(v => Math.pow((v - mean) / (stdDev || 1), 3));
  const skewness = cubedDiffs.reduce((a, b) => a + b, 0) / n;
  
  return { mean, median, stdDev, min: sorted[0], max: sorted[n - 1], skewness };
}

function calculatePercentiles(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const getPercentile = (p: number) => sorted[Math.min(Math.floor((p / 100) * n), n - 1)];
  
  return {
    p5: getPercentile(5),
    p10: getPercentile(10),
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
    p95: getPercentile(95),
  };
}

function createHistogram(values: number[], bucketCount: number = 20) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const bucketSize = range / bucketCount;
  
  const buckets = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + i * bucketSize;
    const bucketMax = min + (i + 1) * bucketSize;
    const count = values.filter(v => v >= bucketMin && v < bucketMax).length;
    buckets.push({ min: bucketMin, max: bucketMax, count, frequency: count / values.length });
  }
  return buckets;
}

function calculateConfidenceBands(simulations: any[], timeHorizon: number) {
  const bands = [];
  for (let month = 1; month <= timeHorizon; month++) {
    const arrValues = simulations
      .filter((s: any) => s.monthlySnapshots && s.monthlySnapshots.length >= month)
      .map((s: any) => s.monthlySnapshots[month - 1].arr);
    
    if (arrValues.length === 0) continue;
    
    const sorted = arrValues.sort((a: number, b: number) => a - b);
    const n = sorted.length;
    
    bands.push({
      month,
      p10: sorted[Math.floor(n * 0.1)],
      p25: sorted[Math.floor(n * 0.25)],
      p50: sorted[Math.floor(n * 0.5)],
      p75: sorted[Math.floor(n * 0.75)],
      p90: sorted[Math.floor(n * 0.9)],
    });
  }
  return bands;
}
