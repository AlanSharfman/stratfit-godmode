// src/components/simulate/SimulateOverlay.tsx
// STRATFIT — Monte Carlo Simulation Overlay
// 10,000 Futures. One Truth. God Mode.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Play, RefreshCw, Download, ChevronRight } from 'lucide-react';
import { useScenarioStore } from '@/state/scenarioStore';
import { 
  runSingleSimulation,
  processSimulationResults,
  type MonteCarloResult, 
  type LeverState,
  type SimulationConfig,
  type SingleSimulationResult
} from '@/logic/monteCarloEngine';
import generateVerdict, { type Verdict } from '@/logic/verdictGenerator';

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

export default function SimulateOverlay({ isOpen, onClose, levers }: SimulateOverlayProps) {
  const [phase, setPhase] = useState<SimulationPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'distribution' | 'scenarios' | 'drivers'>('overview');

  // Simulation config
  const config: SimulationConfig = useMemo(() => ({
    iterations: 10000,
    timeHorizonMonths: 36,
    startingCash: 4000000,
    startingARR: 4800000,
    monthlyBurn: 47000,
  }), []);

  // Run simulation with REAL progress tracking
  const runSimulation = useCallback(async () => {
    setPhase('running');
    setProgress(0);
    setResult(null);
    setVerdict(null);

    const startTime = performance.now();
    const CHUNK_SIZE = 500; // Process 500 iterations at a time
    const allSimulations: SingleSimulationResult[] = [];

    // Run simulation in chunks to show real progress
    for (let i = 0; i < config.iterations; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, config.iterations);
      
      // Run this chunk
      for (let j = i; j < chunkEnd; j++) {
        allSimulations.push(runSingleSimulation(j, levers, config));
      }
      
      // Update progress with REAL count
      const currentProgress = (allSimulations.length / config.iterations) * 100;
      setProgress(currentProgress);
      
      // Yield to UI thread so progress bar updates
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Calculate all the statistics
    const executionTimeMs = performance.now() - startTime;
    const simResult = processSimulationResults(allSimulations, config, levers, executionTimeMs);
    const simVerdict = generateVerdict(simResult);
    
    setProgress(100);
    setResult(simResult);
    setVerdict(simVerdict);
    
    setTimeout(() => {
      setPhase('complete');
    }, 300);
  }, [levers, config]);

  // Auto-run on open
  useEffect(() => {
    if (isOpen && phase === 'idle') {
      runSimulation();
    }
  }, [isOpen, phase, runSimulation]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setProgress(0);
      setResult(null);
      setVerdict(null);
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
      {/* Background with subtle grid */}
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

        {/* Loading State */}
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
                  <span className="stat-value">{Math.round((progress / 100) * config.iterations).toLocaleString()}</span>
                  <span className="stat-label">of {config.iterations.toLocaleString()}</span>
                </div>
                <div className="simulate-loading-stat">
                  <span className="stat-value">{config.timeHorizonMonths}</span>
                  <span className="stat-label">Months Each</span>
                </div>
                <div className="simulate-loading-stat">
                  <span className="stat-value">{Math.round((progress / 100) * config.iterations * config.timeHorizonMonths).toLocaleString()}</span>
                  <span className="stat-label">Data Points</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === 'complete' && result && verdict && (
          <div className="simulate-results">
            {/* Navigation Tabs */}
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

            {/* Intro Explainer */}
            <div className="simulate-explainer">
              <p className="explainer-text">
                <strong>What is this?</strong> We ran your business strategy through {config.iterations.toLocaleString()} different possible futures. 
                Each simulation accounts for market uncertainty, execution variability, and random events that could impact your trajectory. 
                The results show the <em>range of probable outcomes</em>, not a single prediction.
              </p>
            </div>

            {/* Content Sections */}
            <div className="simulate-content">
              {activeSection === 'overview' && (
                <div className="simulate-section simulate-overview">
                  {/* Verdict Panel - Hero */}
                  <VerdictPanel verdict={verdict} result={result} />
                  
                  {/* Context for understanding the verdict */}
                  <div className="verdict-context">
                    <p className="context-label">HOW TO READ THIS</p>
                    <p className="context-text">
                      Your <strong>Score ({verdict.overallScore})</strong> combines survival probability, 
                      growth potential, and runway security. A score above 70 indicates strong positioning. 
                      Below 50 requires strategic adjustments.
                    </p>
        </div>

                  {/* Quick Stats Row */}
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

                  {/* Mini Confidence Fan */}
                  <div className="simulate-mini-chart">
                    <h3 className="section-title">36-MONTH PROJECTION</h3>
                    <ConfidenceFan data={result.arrConfidenceBands} compact />
                  </div>
                </div>
              )}

              {activeSection === 'distribution' && (
                <div className="simulate-section simulate-distribution">
                  {/* Distribution Explainer */}
                  <div className="distribution-explainer">
                    <p className="explainer-heading">UNDERSTANDING THE DISTRIBUTION</p>
                    <p className="explainer-text">
                      This histogram shows all {config.iterations.toLocaleString()} simulated outcomes for your ARR at month {config.timeHorizonMonths}. 
                      The <strong>P50 (median)</strong> is where half the outcomes fall above and half below — 
                      your most likely result. The <strong>P10</strong> is your downside scenario (only 10% of outcomes are worse), 
                      while <strong>P90</strong> is your upside (only 10% are better).
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
                      <div className="distribution-card">
                        <h4 className="card-title">STATISTICS</h4>
                        <div className="stat-list">
                          <div className="stat-row">
                            <span className="stat-label">Mean</span>
                            <span className="stat-value">${(result.arrDistribution.mean / 1000000).toFixed(2)}M</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Std Dev</span>
                            <span className="stat-value">${(result.arrDistribution.stdDev / 1000000).toFixed(2)}M</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Skewness</span>
                            <span className="stat-value">{result.arrDistribution.skewness.toFixed(2)}</span>
            </div>
            </div>
            </div>
          </div>
        </div>

                  {/* Full Confidence Fan */}
                  <div className="confidence-section">
                    <h3 className="section-title">CONFIDENCE BANDS OVER TIME</h3>
                    <ConfidenceFan data={result.arrConfidenceBands} />
                  </div>
                </div>
              )}

              {activeSection === 'scenarios' && (
                <div className="simulate-section simulate-scenarios">
                  {/* Scenarios Explainer */}
                  <div className="scenarios-explainer">
                    <p className="explainer-heading">THREE FUTURES</p>
                    <p className="explainer-text">
                      These cards show representative scenarios from our simulations: what happens if things go 
                      <strong> poorly (P5)</strong>, <strong>as expected (P50)</strong>, or <strong>exceptionally well (P95)</strong>. 
                      Use these to understand the range of outcomes you should prepare for.
                    </p>
                  </div>
                  
                  <ScenarioCards 
                    bestCase={result.bestCase}
                    worstCase={result.worstCase}
                    medianCase={result.medianCase}
                    verdict={verdict}
                  />
                  
                  {/* Survival Curve */}
                  <div className="survival-section">
                    <h3 className="section-title">SURVIVAL PROBABILITY OVER TIME</h3>
                    <div className="survival-chart">
                      <svg viewBox="0 0 800 200" className="survival-svg">
                        <defs>
                          <linearGradient id="survivalGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.3)" />
                            <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map(y => (
                          <line 
                            key={y} 
                            x1="50" 
                            y1={180 - y * 1.6} 
                            x2="780" 
                            y2={180 - y * 1.6} 
                            stroke="rgba(255,255,255,0.1)" 
                            strokeDasharray="4"
                          />
                        ))}
                        
                        {/* Area fill */}
                        <path
                          d={`M50,180 ${result.survivalByMonth.map((rate, i) => {
                            const x = 50 + (i / 36) * 730;
                            const y = 180 - rate * 160;
                            return `L${x},${y}`;
                          }).join(' ')} L780,180 Z`}
                          fill="url(#survivalGradient)"
                        />
                        
                        {/* Line */}
                        <path
                          d={`M50,${180 - result.survivalByMonth[0] * 160} ${result.survivalByMonth.map((rate, i) => {
                            const x = 50 + (i / 36) * 730;
                            const y = 180 - rate * 160;
                            return `L${x},${y}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="2"
                        />
                        
                        {/* Y-axis labels */}
                        {[0, 25, 50, 75, 100].map(y => (
                          <text 
                            key={y} 
                            x="40" 
                            y={185 - y * 1.6} 
                            fill="rgba(255,255,255,0.5)" 
                            fontSize="10" 
                            textAnchor="end"
                          >
                            {y}%
                          </text>
                        ))}
                        
                        {/* X-axis labels */}
                        {[0, 12, 24, 36].map(m => (
                          <text 
                            key={m} 
                            x={50 + (m / 36) * 730} 
                            y="195" 
                            fill="rgba(255,255,255,0.5)" 
                            fontSize="10" 
                            textAnchor="middle"
                          >
                            {m}mo
                          </text>
                        ))}
                      </svg>
        </div>
      </div>
    </div>
              )}

              {activeSection === 'drivers' && (
                <div className="simulate-section simulate-drivers">
                  {/* Drivers Explainer */}
                  <div className="drivers-explainer">
                    <p className="explainer-heading">WHAT MOVES THE NEEDLE</p>
                    <p className="explainer-text">
                      Not all levers are equal. This analysis shows which inputs have the <strong>greatest impact</strong> on your outcomes. 
                      Focus your strategy on the levers at the top of this list — small changes there create the biggest differences in results.
                    </p>
                  </div>
                  
                  <div className="drivers-grid">
                    <div className="drivers-main">
                      <h3 className="section-title">SENSITIVITY ANALYSIS</h3>
                      <p className="section-subtitle">Impact of each lever on simulation outcomes</p>
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
