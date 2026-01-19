/**
 * STRATFIT - Monte Carlo Scenario Card
 * Displays pre-calculated scenario simulation results
 */

import React from 'react';
import type { ScenarioData } from '@/hooks/useMonteCarloScenarios';

interface MonteCarloScenarioCardProps {
  scenario: ScenarioData;
  onSelect?: () => void;
  isActive?: boolean;
}

export default function MonteCarloScenarioCard({ 
  scenario, 
  onSelect, 
  isActive = false 
}: MonteCarloScenarioCardProps) {
  const { name, description, color, metrics, insights } = scenario;
  
  return (
    <div 
      className={`
        rounded-xl border p-6 transition-all cursor-pointer
        ${isActive 
          ? 'border-2 bg-opacity-20' 
          : 'border-white/10 bg-black/30 hover:border-white/30'
        }
      `}
      style={{
        borderColor: isActive ? color : undefined,
        backgroundColor: isActive ? `${color}15` : undefined,
      }}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
          <p className="text-sm text-white/60">{description}</p>
        </div>
        <div 
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {metrics.riskLevel} Risk
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Success Rate
          </div>
          <div className="text-xl font-bold" style={{ color }}>
            {(metrics.successRate * 100).toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Exit Value
          </div>
          <div className="text-xl font-bold text-white">
            ${metrics.exitValue.toFixed(1)}M
          </div>
        </div>
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Avg Runway
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.avgRunway} mo
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div className="mb-4 p-3 rounded-lg bg-black/40">
        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
          Strategy
        </div>
        <div className="text-sm text-white/80">
          {metrics.raiseAmount > 0 
            ? `Raise $${metrics.raiseAmount}M (${(metrics.dilution * 100).toFixed(0)}% dilution)`
            : 'Bootstrap to profitability'
          }
        </div>
      </div>

      {/* Top Insight */}
      {insights[0] && (
        <div className="text-sm text-white/70 italic">
          "{insights[0]}"
        </div>
      )}
    </div>
  );
}

