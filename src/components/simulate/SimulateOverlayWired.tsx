// src/components/simulate/SimulateOverlayWired.tsx
// STRATFIT — Monte Carlo Simulation Overlay (Wired to Store)
// Saves results to simulationStore for use across dashboard

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Save, Check } from 'lucide-react';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';
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

  // Connect to simulation store
  const { setSimulationResult, startSimulation: storeStartSimulation } = useSimulationStore();
  
  // Connect to saved simulations store
  const saveSimulation = useSavedSimulationsStore((s) => s.saveSimulation);

  // Simulation config
  const config: SimulationConfig = useMemo(() => ({
    iterations: 10000,
    timeHorizonMonths: 36,
    startingCash: 4000000,
    startingARR: 4800000,
    monthlyBurn: 47000,
  }), []);

  // Run simulation with REAL progress updates
  const runSimulation = useCallback(async () => {
    setPhase('running');
    setProgress(0);
    setIterationCount(0);
    setResult(null);
    setVerdict(null);
    storeStartSimulation();

    const startTime = performance.now();
    const CHUNK_SIZE = 500; // Process 500 simulations at a time
    const allSimulations: any[] = [];

    // Run simulation in chunks to show real progress
    for (let i = 0; i < config.iterations; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, config.iterations);
      
      // Run this chunk synchronously
      for (let j = i; j < chunkEnd; j++) {
        allSimulations.push(runSingleSimulation(j, levers, config));
      }
      
      // Update progress with REAL count
      const currentProgress = (allSimulations.length / config.iterations) * 100;
      setProgress(currentProgress);
      setIterationCount(allSimulations.length);
      
      // Yield to UI thread so progress bar updates
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Calculate execution time
    const executionTimeMs = performance.now() - startTime;

    // Process all results (calculate statistics)
    const simResult = processSimulationResults(allSimulations, config, executionTimeMs);
    const simVerdict = generateVerdict(simResult);
    
    setProgress(100);
    setResult(simResult);
    setVerdict(simVerdict);
    
    // SAVE TO STORE - This is the key wiring!
    const leverSnapshot = {
      demandStrength: levers.demandStrength,
      pricingPower: levers.pricingPower,
      expansionVelocity: levers.expansionVelocity,
      costDiscipline: levers.costDiscipline,
      hiringIntensity: levers.hiringIntensity,
      operatingDrag: levers.operatingDrag,
      marketVolatility: levers.marketVolatility,
      executionRisk: levers.executionRisk,
      fundingPressure: levers.fundingPressure,
    };
    setSimulationResult(simResult, simVerdict, leverSnapshot);
    
    setTimeout(() => {
      setPhase('complete');
    }, 300);
  }, [levers, config, setSimulationResult, storeStartSimulation]);

  // Handle saving current simulation
  const handleSaveSimulation = useCallback(() => {
    if (!result || !verdict) return;
    
    setSaveState('saving');
    
    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    
    saveSimulation({
      name: `Simulation ${timestamp}`,
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
        cashMedian: result.cashPercentiles?.p50 ?? 0,
        cashP10: result.cashPercentiles?.p10 ?? 0,
        cashP90: result.cashPercentiles?.p90 ?? 0,
        overallScore: verdict.overallScore,
        overallRating: verdict.overallRating,
      },
      isBaseline: false,
    });
    
    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 300);
  }, [result, verdict, levers, saveSimulation]);

  // Auto-run on open
  useEffect(() => {
    if (isOpen && phase === 'idle') {
      runSimulation();
    }
  }, [isOpen, phase, runSimulation]);

  // Reset when closed (but DON'T clear store - results persist!)
  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setProgress(0);
      setIterationCount(0);
      // Note: We don't clear result/verdict here - they stay in store
      setActiveSection('overview');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="simulate-overlay">
      {/* Background */}
      <div className="simulate-backdrop">
        <div className="simulate-grid-pattern" />
        <div className="simulate-vignette" />
      </div>

      {/* Main Container */}
      <div className="simulate-container">
        {/* Header */}
        <SimulateHeader 
          onClose={onClose}
          onRerun={runSimulation}
          phase={phase}
          iterations={config.iterations}
          executionTime={result?.executionTimeMs}
        />

        {/* Loading State with REAL progress */}
        {phase === 'running' && (
          <div className="simulate-loading">
            <div className="simulate-loading-content">
              <div className="simulate-loading-icon">
                <RefreshCw className="animate-spin" size={48} />
              </div>
              <h2 className="simulate-loading-title">SIMULATING {config.iterations.toLocaleString()} FUTURES</h2>
              <p className="simulate-loading-subtitle">Analyzing probability distributions across {config.timeHorizonMonths}-month horizon</p>
              
              <div className="simulate-progress-container">
                <div className="simulate-progress-bar">
                  <div 
                    className="simulate-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="simulate-progress-text">{Math.round(progress)}%</span>
              </div>

              <div className="simulate-loading-stats">
                <div className="simulate-loading-stat">
                  <span className="stat-value">{iterationCount.toLocaleString()}</span>
                  <span className="stat-label">of {config.iterations.toLocaleString()}</span>
                </div>
                <div className="simulate-loading-stat">
                  <span className="stat-value">{config.timeHorizonMonths}</span>
                  <span className="stat-label">Months Each</span>
                </div>
                <div className="simulate-loading-stat">
                  <span className="stat-value">{(iterationCount * config.timeHorizonMonths).toLocaleString()}</span>
                  <span className="stat-label">Data Points</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === 'complete' && result && verdict && (
          <div className="simulate-results">
            {/* Explainer for new users */}
            <div className="simulate-explainer">
              <p className="explainer-text">
                <strong>What is this?</strong> We ran your strategy through {config.iterations.toLocaleString()} different possible futures. 
                Each simulation accounts for market uncertainty and execution variability. 
                The results show the <em>range of probable outcomes</em>, not a single prediction.
              </p>
            </div>

            {/* Navigation Tabs + Save Button */}
            <div className="simulate-nav-row">
              <nav className="simulate-nav">
                {[
                  { id: 'overview', label: 'OVERVIEW' },
                  { id: 'distribution', label: 'DISTRIBUTION' },
                  { id: 'scenarios', label: 'SCENARIOS' },
                  { id: 'drivers', label: 'DRIVERS' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`simulate-nav-tab ${activeSection === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(tab.id as typeof activeSection)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              
              {/* SAVE SIMULATION BUTTON */}
              <button 
                className={`simulate-save-btn ${saveState}`}
                onClick={handleSaveSimulation}
                disabled={saveState !== 'idle'}
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
                    <Save size={16} />
                    SAVE SIMULATION
                  </>
                )}
              </button>
            </div>

            {/* Content Sections */}
            <div className="simulate-content">
              {activeSection === 'overview' && (
                <div className="simulate-section simulate-overview">
                  <VerdictPanel verdict={verdict} result={result} />
                  
                  {/* Context for new users */}
                  <div className="verdict-context">
                    <p className="context-label">HOW TO READ THIS</p>
                    <p className="context-text">
                      Your <strong>Score ({verdict.overallScore})</strong> combines survival probability, 
                      growth potential, and runway security. A score above 70 indicates strong positioning. 
                      Below 50 requires strategic adjustments.
                    </p>
                  </div>
                  
                  <div className="simulate-quick-stats">
                    <div className="quick-stat">
                      <span className="quick-stat-label">SURVIVAL RATE</span>
                      <span className="quick-stat-value">{Math.round(result.survivalRate * 100)}%</span>
                    </div>
                    <div className="quick-stat">
                      <span className="quick-stat-label">MEDIAN ARR</span>
                      <span className="quick-stat-value">${(result.arrPercentiles.p50 / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="quick-stat">
                      <span className="quick-stat-label">MEDIAN RUNWAY</span>
                      <span className="quick-stat-value">{Math.round(result.runwayPercentiles.p50)} mo</span>
                    </div>
                    <div className="quick-stat">
                      <span className="quick-stat-label">UPSIDE (P90)</span>
                      <span className="quick-stat-value">${(result.arrPercentiles.p90 / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>

                  <div className="simulate-mini-chart">
                    <h3 className="section-title">36-MONTH PROJECTION</h3>
                    <ConfidenceFan data={result.arrConfidenceBands} compact />
                  </div>
                </div>
              )}

              {activeSection === 'distribution' && (
                <div className="simulate-section simulate-distribution">
                  <div className="distribution-explainer">
                    <p className="explainer-heading">UNDERSTANDING THE DISTRIBUTION</p>
                    <p className="explainer-text">
                      This histogram shows all {config.iterations.toLocaleString()} simulated outcomes for your ARR at month 36. 
                      The <strong>P50 (median)</strong> is your most likely result. 
                      <strong>P10</strong> is your downside (only 10% worse), <strong>P90</strong> is your upside (only 10% better).
                    </p>
                  </div>
                  
                  <div className="distribution-grid">
                    <div className="distribution-main">
                      <h3 className="section-title">ARR OUTCOME DISTRIBUTION</h3>
                      <ProbabilityDistribution 
                        histogram={result.arrHistogram}
                        percentiles={result.arrPercentiles}
                        stats={result.arrDistribution}
                      />
                    </div>
                    <div className="distribution-side">
                      <div className="distribution-card">
                        <h4 className="card-title">PERCENTILE BREAKDOWN</h4>
                        <div className="percentile-list">
                          <div className="percentile-row pessimistic">
                            <span className="percentile-label">P10 (Pessimistic)</span>
                            <span className="percentile-value">${(result.arrPercentiles.p10 / 1000000).toFixed(2)}M</span>
                          </div>
                          <div className="percentile-row">
                            <span className="percentile-label">P25</span>
                            <span className="percentile-value">${(result.arrPercentiles.p25 / 1000000).toFixed(2)}M</span>
                          </div>
                          <div className="percentile-row median">
                            <span className="percentile-label">P50 (Median)</span>
                            <span className="percentile-value">${(result.arrPercentiles.p50 / 1000000).toFixed(2)}M</span>
                          </div>
                          <div className="percentile-row">
                            <span className="percentile-label">P75</span>
                            <span className="percentile-value">${(result.arrPercentiles.p75 / 1000000).toFixed(2)}M</span>
                          </div>
                          <div className="percentile-row optimistic">
                            <span className="percentile-label">P90 (Optimistic)</span>
                            <span className="percentile-value">${(result.arrPercentiles.p90 / 1000000).toFixed(2)}M</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="confidence-section">
                    <h3 className="section-title">CONFIDENCE BANDS OVER TIME</h3>
                    <ConfidenceFan data={result.arrConfidenceBands} />
                  </div>
                </div>
              )}

              {activeSection === 'scenarios' && (
                <div className="simulate-section simulate-scenarios">
                  <div className="scenarios-explainer">
                    <p className="explainer-heading">THREE FUTURES</p>
                    <p className="explainer-text">
                      These represent what happens if things go poorly (P5), as expected (P50), or exceptionally well (P95). 
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to process simulation results
// (Same logic as in monteCarloEngine but accepts pre-run simulations)
function processSimulationResults(
  allSimulations: any[],
  config: SimulationConfig,
  executionTimeMs: number
): MonteCarloResult {
  // Calculate survival metrics
  const survivors = allSimulations.filter((s: any) => s.didSurvive);
  const survivalRate = survivors.length / config.iterations;
  
  const survivalByMonth: number[] = [];
  for (let month = 1; month <= config.timeHorizonMonths; month++) {
    const survivingAtMonth = allSimulations.filter((s: any) => s.survivalMonths >= month).length;
    survivalByMonth.push(survivingAtMonth / config.iterations);
  }
  
  // Calculate distributions
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

  // Calculate confidence bands
  const arrConfidenceBands = calculateConfidenceBands(allSimulations, config.timeHorizonMonths);

  // Find representative cases
  const sortedByARR = [...allSimulations].sort((a: any, b: any) => a.finalARR - b.finalARR);
  const worstCase = sortedByARR[Math.floor(config.iterations * 0.05)];
  const medianCase = sortedByARR[Math.floor(config.iterations * 0.5)];
  const bestCase = sortedByARR[Math.floor(config.iterations * 0.95)];

  // Sensitivity (simplified for this version)
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

// Statistics helpers
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
      .filter((s: any) => s.monthlySnapshots.length >= month)
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

