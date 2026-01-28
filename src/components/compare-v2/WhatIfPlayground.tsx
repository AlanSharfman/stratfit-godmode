// src/components/compare-v2/WhatIfPlayground.tsx
// STRATFIT — What If Playground: Stress Test Your Assumptions

import { useState, Dispatch, SetStateAction } from 'react'
import { SlidersHorizontal, TrendingDown, RefreshCw } from 'lucide-react'

interface ScenarioConfig {
  id: 'A' | 'B'
  name: string
  tagline: string
  color: string
  revenueGrowth: number
  burnMultiple: number
  hiringRate: number
  riskLevel: number
  marketAggression: number
}

interface Props {
  scenarioA: ScenarioConfig
  scenarioB: ScenarioConfig
  setScenarioB: Dispatch<SetStateAction<ScenarioConfig>>
  statsA: { survival: number; median: number }
  statsB: { survival: number; median: number }
  externalShocks: { month: number; impact: number }[]
  setExternalShocks: Dispatch<SetStateAction<{ month: number; impact: number }[]>>
}

function fmtMoney(x: number) {
  if (x >= 1000000) return `$${(x / 1000000).toFixed(1)}M`
  if (x >= 1000) return `$${(x / 1000).toFixed(0)}K`
  return `$${x.toFixed(0)}`
}

export function WhatIfPlayground({
  scenarioA,
  scenarioB,
  setScenarioB,
  statsA,
  statsB,
  setExternalShocks,
}: Props) {
  const [activeShock, setActiveShock] = useState<string | null>(null)

  const shockPresets = [
    { id: 'market-crash', name: 'Market Crash', description: '30% revenue drop at month 12', month: 12, impact: 0.3 },
    { id: 'competitor', name: 'Competitor Launches', description: '20% impact at month 18', month: 18, impact: 0.2 },
    { id: 'recession', name: 'Recession', description: '25% sustained drop from month 8', month: 8, impact: 0.25 },
    { id: 'key-customer', name: 'Lose Key Customer', description: '15% revenue hit at month 6', month: 6, impact: 0.15 },
  ]

  const applyShock = (preset: typeof shockPresets[0]) => {
    if (activeShock === preset.id) {
      setActiveShock(null)
      setExternalShocks([])
    } else {
      setActiveShock(preset.id)
      setExternalShocks([{ month: preset.month, impact: preset.impact }])
    }
  }

  const updateScenarioB = (key: keyof ScenarioConfig, value: number) => {
    setScenarioB({ ...scenarioB, [key]: value })
  }

  return (
    <div className="w-full h-full flex">
      {/* Controls Panel */}
      <div className="w-96 border-r border-white/10 bg-black/30 flex flex-col overflow-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg text-white font-light">Adjust Assumptions</h2>
          </div>
          <p className="text-[11px] text-white/50">
            Drag sliders to see how changes affect both paths
          </p>
        </div>

        {/* Path B Sliders */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-amber-400 text-sm">{scenarioB.name} Parameters</span>
          </div>

          <div className="space-y-5">
            <SliderControl
              label="Revenue Growth"
              value={scenarioB.revenueGrowth}
              min={0.1}
              max={1.0}
              step={0.05}
              format={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => updateScenarioB('revenueGrowth', v)}
              color="amber"
            />
            
            <SliderControl
              label="Burn Multiple"
              value={scenarioB.burnMultiple}
              min={0.8}
              max={3.0}
              step={0.1}
              format={(v) => `${v.toFixed(1)}x`}
              onChange={(v) => updateScenarioB('burnMultiple', v)}
              color="amber"
              inverted
            />
            
            <SliderControl
              label="Hiring Rate"
              value={scenarioB.hiringRate}
              min={0}
              max={1.0}
              step={0.05}
              format={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => updateScenarioB('hiringRate', v)}
              color="amber"
            />
            
            <SliderControl
              label="Risk Level"
              value={scenarioB.riskLevel}
              min={0.1}
              max={1.0}
              step={0.05}
              format={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => updateScenarioB('riskLevel', v)}
              color="amber"
              inverted
            />
            
            <SliderControl
              label="Market Aggression"
              value={scenarioB.marketAggression}
              min={0.1}
              max={1.0}
              step={0.05}
              format={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => updateScenarioB('marketAggression', v)}
              color="amber"
            />
          </div>
        </div>

        {/* External Shocks */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">Stress Test Scenarios</span>
          </div>

          <div className="space-y-3">
            {shockPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyShock(preset)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  activeShock === preset.id
                    ? 'bg-red-500/20 border-2 border-red-500/50'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{preset.name}</span>
                  {activeShock === preset.id && (
                    <span className="text-[10px] text-red-400 px-2 py-0.5 bg-red-500/20 rounded">ACTIVE</span>
                  )}
                </div>
                <div className="text-[11px] text-white/50 mt-1">{preset.description}</div>
              </button>
            ))}
          </div>

          {activeShock && (
            <button
              onClick={() => { setActiveShock(null); setExternalShocks([]) }}
              className="w-full mt-4 py-2 border border-white/20 rounded-lg text-white/60 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Baseline
            </button>
          )}
        </div>
      </div>

      {/* Results Display */}
      <div className="flex-1 flex flex-col">
        {/* Impact Header */}
        <div className="h-32 border-b border-white/10 flex items-center justify-center gap-16 px-8">
          <ResultCard
            label={scenarioA.name}
            survival={statsA.survival}
            revenue={statsA.median}
            color="cyan"
          />
          
          <div className="text-center">
            <div className="text-[10px] text-white/40 tracking-[0.2em] mb-2">SURVIVAL DELTA</div>
            <div className={`text-4xl font-light font-mono ${
              statsB.survival >= statsA.survival ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {statsB.survival >= statsA.survival ? '+' : ''}{((statsB.survival - statsA.survival) * 100).toFixed(0)}%
            </div>
          </div>
          
          <ResultCard
            label={scenarioB.name}
            survival={statsB.survival}
            revenue={statsB.median}
            color="amber"
          />
        </div>

        {/* Insights */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-2xl mx-auto">
            <div className="text-[10px] text-white/40 tracking-[0.2em] mb-4">AI INSIGHTS</div>
            
            <div className="space-y-4">
              <InsightCard
                type={statsB.survival < 0.7 ? 'warning' : 'info'}
                title={statsB.survival < 0.7 ? 'High Failure Risk' : 'Acceptable Risk Level'}
                description={
                  statsB.survival < 0.7
                    ? `With current settings, ${scenarioB.name} has a ${((1 - statsB.survival) * 100).toFixed(0)}% chance of failure. Consider reducing burn multiple or risk level.`
                    : `${scenarioB.name} maintains a ${(statsB.survival * 100).toFixed(0)}% survival rate, which is within acceptable bounds for an aggressive strategy.`
                }
              />
              
              {scenarioB.burnMultiple > 2 && (
                <InsightCard
                  type="warning"
                  title="Burn Multiple Warning"
                  description={`A ${scenarioB.burnMultiple.toFixed(1)}x burn multiple is aggressive. Most successful startups maintain 1.5x or below at this stage.`}
                />
              )}
              
              {scenarioB.revenueGrowth < 0.3 && (
                <InsightCard
                  type="info"
                  title="Growth Moderation"
                  description="With growth below 30%, the aggressive stance may not justify the added risk. Consider a more conservative approach."
                />
              )}
              
              {activeShock && (
                <InsightCard
                  type="stress"
                  title="Stress Test Active"
                  description={`The "${shockPresets.find(p => p.id === activeShock)?.name}" scenario is applied. Watch how both paths respond to this external shock.`}
                />
              )}

              <InsightCard
                type="recommendation"
                title="Optimal Configuration"
                description={
                  statsB.median > statsA.median * 1.3 && statsB.survival > 0.75
                    ? `Current settings achieve ${((statsB.median / statsA.median - 1) * 100).toFixed(0)}% more revenue with acceptable risk. This is a good trade-off.`
                    : `Try adjusting growth to ${Math.min(0.7, scenarioB.revenueGrowth + 0.1).toFixed(0)}% while keeping burn at 1.5x for optimal risk-adjusted returns.`
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  color,
  inverted = false,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  color: string
  inverted?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-white/60">{label}</span>
        <span className={`text-sm font-mono ${color === 'amber' ? 'text-amber-400' : 'text-cyan-400'}`}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1.5 appearance-none rounded-full cursor-pointer ${
          inverted ? 'bg-gradient-to-r from-emerald-500/30 to-red-500/30' : 'bg-gradient-to-r from-red-500/30 to-emerald-500/30'
        }
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-white
                   [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
      />
    </div>
  )
}

function ResultCard({
  label,
  survival,
  revenue,
  color,
}: {
  label: string
  survival: number
  revenue: number
  color: string
}) {
  return (
    <div className="text-center">
      <div className={`text-sm mb-2 ${color === 'cyan' ? 'text-cyan-400' : 'text-amber-400'}`}>{label}</div>
      <div className="flex gap-6">
        <div>
          <div className={`text-3xl font-light font-mono ${color === 'cyan' ? 'text-cyan-400' : 'text-amber-400'}`}>
            {(survival * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-white/40">survival</div>
        </div>
        <div>
          <div className="text-2xl font-light font-mono text-white">
            {fmtMoney(revenue)}
          </div>
          <div className="text-[10px] text-white/40">median revenue</div>
        </div>
      </div>
    </div>
  )
}

function InsightCard({
  type,
  title,
  description,
}: {
  type: 'info' | 'warning' | 'stress' | 'recommendation'
  title: string
  description: string
}) {
  const styles: Record<string, string> = {
    info: 'bg-cyan-500/5 border-cyan-500/30 text-cyan-400',
    warning: 'bg-amber-500/5 border-amber-500/30 text-amber-400',
    stress: 'bg-red-500/5 border-red-500/30 text-red-400',
    recommendation: 'bg-violet-500/5 border-violet-500/30 text-violet-400',
  }
  
  return (
    <div className={`p-4 rounded-xl border ${styles[type]}`}>
      <div className="font-medium mb-1">{title}</div>
      <div className="text-sm text-white/60">{description}</div>
    </div>
  )
}

