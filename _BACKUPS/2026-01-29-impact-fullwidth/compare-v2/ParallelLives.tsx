// src/components/compare-v2/ParallelLives.tsx
// STRATFIT — Parallel Lives: Side-by-Side Simulation

import React, { useState, useEffect, useMemo } from 'react'
import { Users, DollarSign, TrendingUp, AlertTriangle, Heart } from 'lucide-react'

interface SimulationState {
  month: number
  revenue: number
  cash: number
  team: number
  customers: number
  churn: number
  runway: number
  stress: number
  alive: boolean
  milestones: string[]
}

interface ScenarioConfig {
  id: 'A' | 'B'
  name: string
  tagline: string
  color: string
}

interface Props {
  scenarioA: ScenarioConfig
  scenarioB: ScenarioConfig
  resultsA: SimulationState[][]
  resultsB: SimulationState[][]
  months: number
}

function fmtMoney(x: number) {
  if (x >= 1000000) return `$${(x / 1000000).toFixed(1)}M`
  if (x >= 1000) return `$${(x / 1000).toFixed(0)}K`
  return `$${x.toFixed(0)}`
}

export function ParallelLives({
  scenarioA,
  scenarioB,
  resultsA,
  resultsB,
  months,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(12)
  const [isPlaying, setIsPlaying] = useState(false)

  // Get median paths
  const medianA = useMemo(() => {
    const sorted = [...resultsA].sort((a, b) => a[months].revenue - b[months].revenue)
    return sorted[Math.floor(sorted.length / 2)]
  }, [resultsA, months])

  const medianB = useMemo(() => {
    const sorted = [...resultsB].sort((a, b) => a[months].revenue - b[months].revenue)
    return sorted[Math.floor(sorted.length / 2)]
  }, [resultsB, months])

  const stateA = medianA[currentMonth]
  const stateB = medianB[currentMonth]

  // Animation
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentMonth(m => {
        if (m >= months) {
          setIsPlaying(false)
          return months
        }
        return m + 1
      })
    }, 500)
    return () => clearInterval(interval)
  }, [isPlaying, months])

  // Milestones up to current month
  const milestonesA = medianA.slice(0, currentMonth + 1).flatMap((s, i) => 
    s.milestones.map(m => ({ month: i, text: m }))
  )
  const milestonesB = medianB.slice(0, currentMonth + 1).flatMap((s, i) => 
    s.milestones.map(m => ({ month: i, text: m }))
  )

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-center gap-4 px-8">
        <span className="text-white/40 text-sm">Viewing month</span>
        <div className="text-3xl font-light text-white font-mono">T+{currentMonth}</div>
        <span className="text-white/40 text-sm">of {months}</span>
        
        <div className="ml-8 flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
              isPlaying 
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                : 'bg-white/5 text-white/60 border border-white/20 hover:bg-white/10'
            }`}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="h-12 border-b border-white/10 flex items-center px-8">
        <input
          type="range"
          min={0}
          max={months}
          value={currentMonth}
          onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
          className="w-full h-1 appearance-none bg-white/10 rounded-full cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:rounded-full"
        />
      </div>

      {/* Split Screen */}
      <div className="flex-1 flex">
        {/* Path A */}
        <div className="flex-1 border-r border-white/10 bg-gradient-to-br from-cyan-500/5 to-transparent flex flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-cyan-400" />
              <h2 className="text-xl text-cyan-400">{scenarioA.name}</h2>
            </div>
            <p className="text-white/50 text-sm mt-1">{scenarioA.tagline}</p>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <MetricCard 
                icon={DollarSign}
                label="REVENUE"
                value={fmtMoney(stateA.revenue)}
                subvalue="/month"
                color="cyan"
              />
              <MetricCard 
                icon={Users}
                label="TEAM"
                value={stateA.team.toString()}
                subvalue="people"
                color="cyan"
              />
              <MetricCard 
                icon={TrendingUp}
                label="CUSTOMERS"
                value={stateA.customers.toString()}
                subvalue="active"
                color="cyan"
              />
              <MetricCard 
                icon={AlertTriangle}
                label="RUNWAY"
                value={stateA.runway.toFixed(0)}
                subvalue="months"
                color={stateA.runway < 12 ? 'red' : 'cyan'}
              />
            </div>

            {/* Stress Meter */}
            <div className="mb-6">
              <div className="text-[10px] text-white/40 mb-2">STRESS LEVEL</div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    stateA.stress > 7 ? 'bg-red-500' :
                    stateA.stress > 4 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${stateA.stress * 10}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-white/30">
                <span>Calm</span>
                <span>Stressful</span>
                <span>Burnout</span>
              </div>
            </div>

            {/* Status */}
            <div className={`p-4 rounded-xl mb-6 ${
              stateA.alive 
                ? 'bg-emerald-500/10 border border-emerald-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <Heart className={`w-5 h-5 ${stateA.alive ? 'text-emerald-400' : 'text-red-400'}`} />
                <span className={`font-medium ${stateA.alive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stateA.alive ? 'Company Alive' : 'Company Failed'}
                </span>
              </div>
            </div>

            {/* Milestones */}
            <div>
              <div className="text-[10px] text-white/40 tracking-[0.2em] mb-3">JOURNEY SO FAR</div>
              <div className="space-y-2">
                {milestonesA.slice(-5).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-cyan-400/60 font-mono text-[10px]">T+{m.month}</span>
                    <span className="text-white/70">{m.text}</span>
                  </div>
                ))}
                {milestonesA.length === 0 && (
                  <div className="text-white/30 text-sm">No major events yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Path B */}
        <div className="flex-1 bg-gradient-to-bl from-amber-500/5 to-transparent flex flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-amber-400" />
              <h2 className="text-xl text-amber-400">{scenarioB.name}</h2>
            </div>
            <p className="text-white/50 text-sm mt-1">{scenarioB.tagline}</p>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <MetricCard 
                icon={DollarSign}
                label="REVENUE"
                value={fmtMoney(stateB.revenue)}
                subvalue="/month"
                color="amber"
              />
              <MetricCard 
                icon={Users}
                label="TEAM"
                value={stateB.team.toString()}
                subvalue="people"
                color="amber"
              />
              <MetricCard 
                icon={TrendingUp}
                label="CUSTOMERS"
                value={stateB.customers.toString()}
                subvalue="active"
                color="amber"
              />
              <MetricCard 
                icon={AlertTriangle}
                label="RUNWAY"
                value={stateB.runway.toFixed(0)}
                subvalue="months"
                color={stateB.runway < 12 ? 'red' : 'amber'}
              />
            </div>

            {/* Stress Meter */}
            <div className="mb-6">
              <div className="text-[10px] text-white/40 mb-2">STRESS LEVEL</div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    stateB.stress > 7 ? 'bg-red-500' :
                    stateB.stress > 4 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${stateB.stress * 10}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-white/30">
                <span>Calm</span>
                <span>Stressful</span>
                <span>Burnout</span>
              </div>
            </div>

            {/* Status */}
            <div className={`p-4 rounded-xl mb-6 ${
              stateB.alive 
                ? 'bg-emerald-500/10 border border-emerald-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <Heart className={`w-5 h-5 ${stateB.alive ? 'text-emerald-400' : 'text-red-400'}`} />
                <span className={`font-medium ${stateB.alive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stateB.alive ? 'Company Alive' : 'Company Failed'}
                </span>
              </div>
            </div>

            {/* Milestones */}
            <div>
              <div className="text-[10px] text-white/40 tracking-[0.2em] mb-3">JOURNEY SO FAR</div>
              <div className="space-y-2">
                {milestonesB.slice(-5).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-amber-400/60 font-mono text-[10px]">T+{m.month}</span>
                    <span className="text-white/70">{m.text}</span>
                  </div>
                ))}
                {milestonesB.length === 0 && (
                  <div className="text-white/30 text-sm">No major events yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Comparison */}
      <div className="h-20 border-t border-white/10 flex items-center justify-center gap-12 px-8">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-mono text-cyan-400">{fmtMoney(stateA.revenue)}</div>
            <div className="text-[10px] text-white/40">Path A Revenue</div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg ${
            stateB.revenue > stateA.revenue ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}>
            <div className={`text-xl font-mono ${
              stateB.revenue > stateA.revenue ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {stateB.revenue > stateA.revenue ? '+' : ''}{(((stateB.revenue / stateA.revenue) - 1) * 100).toFixed(0)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono text-amber-400">{fmtMoney(stateB.revenue)}</div>
            <div className="text-[10px] text-white/40">Path B Revenue</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subvalue, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subvalue: string
  color: string
}) {
  const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  }
  
  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-60" />
        <span className="text-[9px] tracking-wide opacity-60">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-light font-mono">{value}</span>
        <span className="text-[10px] opacity-50">{subvalue}</span>
      </div>
    </div>
  )
}

