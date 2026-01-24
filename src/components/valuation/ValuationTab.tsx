// src/components/valuation/ValuationTab.tsx
// STRATFIT — Valuation Intelligence Tab
// Enterprise value modeling and investor-grade analysis

import React, { useEffect } from 'react';
import { useValuationStore } from '../../state/valuationStore';
import { useLeverStore } from '../../state/leverStore';
import { useSimulationStore } from '../../state/simulationStore';

import ValuationHeader from './ValuationHeader';
import ValuationGauge from './ValuationGauge';
import ValuationDrivers from './ValuationDrivers';
import DilutionScenarios from './DilutionScenarios';
import ValuationTimeline from './ValuationTimeline';
import ComparablesBenchmark from './ComparablesBenchmark';
import EmptyValuationState from './EmptyValuationState';

import './ValuationStyles.css';

export default function ValuationTab() {
  const snapshot = useValuationStore((s) => s.snapshot);
  const calculateValuation = useValuationStore((s) => s.calculateValuation);
  const viewMode = useValuationStore((s) => s.viewMode);
  const isCalculating = useValuationStore((s) => s.isCalculating);
  
  const levers = useLeverStore((s) => s.levers);
  const simulation = useSimulationStore((s) => s.summary);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  
  // Calculate valuation when simulation or levers change
  useEffect(() => {
    if (hasSimulated && simulation) {
      calculateValuation(
        levers as Record<string, number>,
        {
          survivalRate: simulation.survivalRate,
          medianRunway: simulation.runwayMedian,
          medianARR: simulation.arrMedian,
          overallScore: simulation.overallScore,
        }
      );
    }
  }, [hasSimulated, simulation, levers, calculateValuation]);
  
  // Show empty state if no simulation
  if (!hasSimulated || !simulation) {
    return (
      <div className="valuation-tab">
        <ValuationHeader />
        <EmptyValuationState />
      </div>
    );
  }
  
  if (isCalculating || !snapshot) {
    return (
      <div className="valuation-tab">
        <ValuationHeader />
        <div className="valuation-loading">
          <div className="loading-spinner" />
          <span>Calculating enterprise value...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="valuation-tab">
      <ValuationHeader
        currentValuation={snapshot.currentValuation}
        arrMultiple={snapshot.arrMultiple}
        percentileRank={snapshot.percentileRank}
      />
      
      <div className="valuation-content">
        {/* Main Gauge + Drivers Column */}
        <div className="valuation-main">
          <ValuationGauge
            valuation={snapshot.currentValuation}
            range={snapshot.valuationRange}
            score={snapshot.overallScore}
            arrMultiple={snapshot.arrMultiple}
          />
          
          <ValuationDrivers drivers={snapshot.drivers} />
        </div>
        
        {/* Center: Timeline or Comparables */}
        <div className="valuation-center">
          {(viewMode === 'overview' || viewMode === 'timeline') && (
            <ValuationTimeline
              projections={snapshot.projectedValuations}
              currentValuation={snapshot.currentValuation}
            />
          )}
          
          {viewMode === 'comparables' && (
            <ComparablesBenchmark
              comparables={snapshot.comparables}
              currentMultiple={snapshot.arrMultiple}
              percentileRank={snapshot.percentileRank}
            />
          )}
        </div>
        
        {/* Right: Dilution Scenarios */}
        <div className="valuation-right">
          <DilutionScenarios
            currentValuation={snapshot.currentValuation}
            exitScenarios={snapshot.exitScenarios}
          />
        </div>
      </div>
    </div>
  );
}
