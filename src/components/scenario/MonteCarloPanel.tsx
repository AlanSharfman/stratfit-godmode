/**
 * STRATFIT - Monte Carlo Scenarios Panel
 * Shows pre-calculated simulation results for available scenarios
 */

import React, { useState } from 'react';
import { useMonteCarloScenarios } from '@/hooks/useMonteCarloScenarios';
import MonteCarloScenarioCard from './MonteCarloScenarioCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function MonteCarloPanel() {
  const { scenarios, scenarioOptions } = useMonteCarloScenarios();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedId, setSelectedId] = useState('series-b-stress-test');

  const selectedScenario = scenarios.find(s => s.id === selectedId);

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-black/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">📊</div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Monte Carlo Scenarios
            </h3>
            <p className="text-xs text-white/50">
              10,000 simulations • Pre-calculated results
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-white/50" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/50" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-6">
          {/* Scenario Tabs */}
          <div className="flex gap-2 mb-4">
            {scenarioOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={`
                  flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all
                  ${selectedId === option.id
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-black/40 text-white/60 hover:bg-white/5 border border-white/5'
                  }
                `}
                style={{
                  borderColor: selectedId === option.id ? option.color : undefined,
                  color: selectedId === option.id ? option.color : undefined,
                }}
              >
                {option.shortName}
              </button>
            ))}
          </div>

          {/* Selected Scenario Card */}
          {selectedScenario && (
            <MonteCarloScenarioCard 
              scenario={selectedScenario}
              isActive={true}
            />
          )}

          {/* Quick Comparison Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {scenarios.map((s) => (
              <div 
                key={s.id}
                className="p-3 rounded-lg bg-black/60 border border-white/5 text-center"
              >
                <div className="text-xs text-white/50 mb-1">{s.shortName}</div>
                <div 
                  className="text-lg font-bold"
                  style={{ color: s.color }}
                >
                  ${s.metrics.exitValue.toFixed(0)}M
                </div>
                <div className="text-xs text-white/40">
                  {(s.metrics.successRate * 100).toFixed(0)}% success
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

