// src/components/compare/DeltaNarrative.tsx
// STRATFIT — AI-Generated Narrative explaining scenario differences

import React, { useMemo } from 'react';
import type { Scenario, ScenarioDelta } from '../../state/scenarioStore';

interface DeltaNarrativeProps {
  scenarioA: Scenario;
  scenarioB: Scenario;
  delta: ScenarioDelta | null;
}

export default function DeltaNarrative({ scenarioA, scenarioB, delta }: DeltaNarrativeProps) {
  if (!delta) return null;
  
  const narrative = useMemo(() => {
    const simA = scenarioA.simulation;
    const simB = scenarioB.simulation;
    
    if (!simA || !simB) return null;
    
    // Determine overall direction
    const isImprovement = delta.scoreDelta > 0;
    const magnitude = Math.abs(delta.divergenceScore);
    
    let headline = '';
    if (magnitude < 10) {
      headline = `${scenarioB.name} represents a marginal adjustment from ${scenarioA.name}, with nearly identical expected outcomes.`;
    } else if (magnitude < 30) {
      headline = isImprovement
        ? `${scenarioB.name} shows moderate improvement over ${scenarioA.name}, with ${Math.abs(delta.arrDeltaPercent).toFixed(0)}% higher projected ARR.`
        : `${scenarioB.name} introduces moderate risk compared to ${scenarioA.name}, trading off ${Math.abs(delta.arrDeltaPercent).toFixed(0)}% ARR for other factors.`;
    } else if (magnitude < 60) {
      headline = isImprovement
        ? `${scenarioB.name} represents a significant strategic shift, projecting ${Math.abs(delta.survivalDelta).toFixed(0)}pp higher survival and ${formatCurrency(Math.abs(delta.arrDelta))} more ARR.`
        : `${scenarioB.name} takes a fundamentally different approach, accepting ${Math.abs(delta.survivalDelta).toFixed(0)}pp lower survival for potential upside.`;
    } else {
      headline = `${scenarioA.name} and ${scenarioB.name} represent fundamentally different strategic paths with ${magnitude}% divergence in outcomes.`;
    }
    
    // Tradeoffs
    const gains: string[] = [];
    const costs: string[] = [];
    
    if (delta.arrDelta > 0) gains.push(`+${formatCurrency(delta.arrDelta)} ARR`);
    else if (delta.arrDelta < 0) costs.push(`${formatCurrency(delta.arrDelta)} ARR`);
    
    if (delta.survivalDelta > 5) gains.push(`+${delta.survivalDelta.toFixed(0)}pp survival`);
    else if (delta.survivalDelta < -5) costs.push(`${delta.survivalDelta.toFixed(0)}pp survival`);
    
    if (delta.runwayDelta > 3) gains.push(`+${delta.runwayDelta.toFixed(0)} months runway`);
    else if (delta.runwayDelta < -3) costs.push(`${Math.abs(delta.runwayDelta).toFixed(0)} months runway`);
    
    // Top lever changes
    const topLevers = delta.leverDeltas
      .filter(l => Math.abs(l.delta) > 5)
      .slice(0, 3);
    
    // Recommendation
    let recommendation = '';
    if (isImprovement && magnitude > 20) {
      recommendation = `Consider adopting ${scenarioB.name} to capture the projected improvements. Monitor the lever changes closely during implementation.`;
    } else if (!isImprovement && magnitude > 20) {
      recommendation = `${scenarioA.name} currently offers better risk-adjusted returns. Only proceed with ${scenarioB.name} if the strategic context has shifted significantly.`;
    } else {
      recommendation = `Both scenarios project similar outcomes. Choose based on execution confidence and market timing rather than projected metrics.`;
    }
    
    return { headline, gains, costs, topLevers, recommendation };
  }, [scenarioA, scenarioB, delta]);
  
  if (!narrative) return null;
  
  return (
    <div className="delta-narrative">
      {/* Headline */}
      <div className="narrative-headline">
        <span className="headline-icon">◈</span>
        <p className="headline-text">{narrative.headline}</p>
      </div>
      
      {/* Tradeoffs */}
      {(narrative.gains.length > 0 || narrative.costs.length > 0) && (
        <div className="narrative-section tradeoff">
          <span className="section-label">STRATEGIC TRADEOFFS</span>
          <div className="tradeoff-columns">
            <div className="tradeoff-column gains">
              <span className="column-label">GAINS</span>
              <ul>
                {narrative.gains.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
                {narrative.gains.length === 0 && <li>No significant gains</li>}
              </ul>
            </div>
            <div className="tradeoff-column costs">
              <span className="column-label">COSTS</span>
              <ul>
                {narrative.costs.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
                {narrative.costs.length === 0 && <li>No significant costs</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Lever Changes */}
      {narrative.topLevers.length > 0 && (
        <div className="narrative-section levers">
          <span className="section-label">KEY LEVER CHANGES</span>
          <div className="lever-changes">
            {narrative.topLevers.map((l) => (
              <div key={l.lever} className="lever-change">
                <span className="lever-name">{l.label}</span>
                <span className={`lever-delta ${l.delta > 0 ? 'positive' : 'negative'}`}>
                  {l.delta > 0 ? '+' : ''}{l.delta}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendation */}
      <div className="narrative-section recommendation">
        <span className="section-label">RECOMMENDATION</span>
        <p className="recommendation-text">{narrative.recommendation}</p>
      </div>
    </div>
  );
}

// Helper function
function formatCurrency(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) return `$${(absValue / 1000000).toFixed(1)}M`;
  if (absValue >= 1000) return `$${(absValue / 1000).toFixed(0)}K`;
  return `$${absValue.toFixed(0)}`;
}
