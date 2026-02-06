// src/components/compare/ComparePage.tsx
// STRATFIT — Fate Machine: Monte Carlo Scenario Comparison

import { useState, useEffect, useMemo } from 'react'
import { FateMachine } from '../compare-v2/FateMachine'
import { ParallelLives } from '../compare-v2/ParallelLives'
import { SurvivalFilter } from '../compare-v2/SurvivalFilter'
import { WhatIfPlayground } from '../compare-v2/WhatIfPlayground'
import { TheVerdict } from '../compare-v2/TheVerdict'
import { 
  GitBranch,
  Layers,
  Filter,
  SlidersHorizontal,
  Scale,
  Zap
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScenarioConfig {
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

export interface SimulationState {
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

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 48271) % 2147483647
    return seed / 2147483647
  }
}

export function runFullSimulation(
  config: ScenarioConfig,
  seed: number,
  months: number,
  startState: SimulationState,
  externalShocks: { month: number; impact: number }[] = []
): SimulationState[] {
  const rand = seededRandom(seed)
  const states: SimulationState[] = [{ ...startState }]
  
  for (let m = 1; m <= months; m++) {
    const prev = states[m - 1]
    if (!prev.alive) {
      states.push({ ...prev, month: m })
      continue
    }
    
    // External shock
    const shock = externalShocks.find(s => s.month === m)
    const shockMultiplier = shock ? (1 - shock.impact) : 1
    
    // Growth with variance
    const baseGrowth = config.revenueGrowth / 12
    const variance = (rand() - 0.5) * config.riskLevel * 0.1
    const growth = (baseGrowth + variance) * shockMultiplier
    
    // Revenue
    const newRevenue = prev.revenue * (1 + growth)
    
    // Burn (higher aggression = higher burn)
    const baseBurn = prev.revenue * config.burnMultiple * (1 + config.marketAggression * 0.3)
    const burnVariance = (rand() - 0.5) * 0.1 * baseBurn
    const actualBurn = baseBurn + burnVariance
    
    // Cash
    const newCash = prev.cash + newRevenue - actualBurn
    
    // Team growth
    const targetTeam = prev.team * (1 + config.hiringRate / 12)
    const newTeam = Math.round(prev.team + (targetTeam - prev.team) * 0.3)
    
    // Customers
    const newCustomerGrowth = 1 + growth * 1.2
    const churnRate = 0.02 + config.riskLevel * 0.02 + (rand() - 0.5) * 0.01
    const newCustomers = Math.round(prev.customers * newCustomerGrowth * (1 - churnRate))
    
    // Runway
    const monthlyBurn = actualBurn - newRevenue
    const newRunway = monthlyBurn > 0 ? newCash / monthlyBurn : 999
    
    // Stress (composite of risk factors)
    const runwayStress = newRunway < 6 ? (6 - newRunway) * 1.5 : 0
    const growthStress = growth < 0.02 ? 2 : 0
    const burnStress = config.burnMultiple > 1.5 ? (config.burnMultiple - 1.5) * 3 : 0
    const newStress = Math.min(10, prev.stress * 0.9 + runwayStress + growthStress + burnStress + rand() * 0.5)
    
    // Alive check
    const alive = newCash > 0 && newRunway > 1
    
    // Milestones
    const milestones: string[] = []
    if (newRevenue > prev.revenue * 1.5 && m > 6) milestones.push('Revenue 50% up')
    if (newTeam > prev.team * 1.3) milestones.push(`Team hit ${newTeam}`)
    if (newRunway < 6 && prev.runway >= 6) milestones.push('⚠️ Runway warning')
    if (!alive && prev.alive) milestones.push('💀 Ran out of cash')
    if (newCustomers > 1000 && prev.customers <= 1000) milestones.push('🎉 1000 customers!')
    
    states.push({
      month: m,
      revenue: newRevenue,
      cash: newCash,
      team: newTeam,
      customers: newCustomers,
      churn: churnRate * 100,
      runway: Math.max(0, newRunway),
      stress: newStress,
      alive,
      milestones,
    })
  }
  
  return states
}

export function runMonteCarloComparison(
  configA: ScenarioConfig,
  configB: ScenarioConfig,
  runs: number,
  months: number,
  startState: SimulationState,
  externalShocks: { month: number; impact: number }[] = []
) {
  const resultsA: SimulationState[][] = []
  const resultsB: SimulationState[][] = []
  
  for (let i = 0; i < runs; i++) {
    resultsA.push(runFullSimulation(configA, 10000 + i * 7919, months, startState, externalShocks))
    resultsB.push(runFullSimulation(configB, 50000 + i * 7919, months, startState, externalShocks))
  }
  
  return { resultsA, resultsB }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

type ViewMode = 'fate' | 'parallel' | 'survival' | 'whatif' | 'verdict'

const views = [
  { id: 'fate' as const, label: 'THE SPLIT', icon: GitBranch, description: 'Watch your futures diverge' },
  { id: 'parallel' as const, label: 'PARALLEL LIVES', icon: Layers, description: 'Side-by-side simulation' },
  { id: 'survival' as const, label: 'SURVIVAL', icon: Filter, description: 'Who makes it?' },
  { id: 'whatif' as const, label: 'WHAT IF', icon: SlidersHorizontal, description: 'Stress test your assumptions' },
  { id: 'verdict' as const, label: 'THE VERDICT', icon: Scale, description: 'AI recommendation' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ComparePage() {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<ViewMode>('fate')
  const [externalShocks, setExternalShocks] = useState<{ month: number; impact: number }[]>([])

  // Scenario configurations
  const [scenarioA] = useState<ScenarioConfig>({
    id: 'A',
    name: 'Steady Growth',
    tagline: 'Controlled. Sustainable. Sleep at night.',
    color: '#22d3ee',
    revenueGrowth: 0.35,
    burnMultiple: 1.2,
    hiringRate: 0.25,
    riskLevel: 0.3,
    marketAggression: 0.3,
  })

  const [scenarioB, setScenarioB] = useState<ScenarioConfig>({
    id: 'B',
    name: 'Aggressive Expansion',
    tagline: 'Bold. Fast. High stakes.',
    color: '#f59e0b',
    revenueGrowth: 0.65,
    burnMultiple: 2.0,
    hiringRate: 0.6,
    riskLevel: 0.7,
    marketAggression: 0.8,
  })

  // Starting state
  const startState: SimulationState = {
    month: 0,
    revenue: 250000,
    cash: 4000000,
    team: 18,
    customers: 340,
    churn: 4.2,
    runway: 24,
    stress: 3,
    alive: true,
    milestones: [],
  }

  // Run simulations
  const MONTHS = 36
  const RUNS = 500

  const { resultsA, resultsB, statsA, statsB } = useMemo(() => {
    const { resultsA, resultsB } = runMonteCarloComparison(
      scenarioA, scenarioB, RUNS, MONTHS, startState, externalShocks
    )
    
    // Compute stats
    const finalA = resultsA.map(r => r[MONTHS])
    const finalB = resultsB.map(r => r[MONTHS])
    
    const survivalA = finalA.filter(s => s.alive).length / RUNS
    const survivalB = finalB.filter(s => s.alive).length / RUNS
    
    const revenueA = finalA.filter(s => s.alive).map(s => s.revenue)
    const revenueB = finalB.filter(s => s.alive).map(s => s.revenue)
    
    const sortedA = [...revenueA].sort((a, b) => a - b)
    const sortedB = [...revenueB].sort((a, b) => a - b)
    
    const medianRevA = sortedA[Math.floor(sortedA.length / 2)] || 0
    const medianRevB = sortedB[Math.floor(sortedB.length / 2)] || 0
    
    const p10A = sortedA[Math.floor(sortedA.length * 0.1)] || 0
    const p90A = sortedA[Math.floor(sortedA.length * 0.9)] || 0
    const p10B = sortedB[Math.floor(sortedB.length * 0.1)] || 0
    const p90B = sortedB[Math.floor(sortedB.length * 0.9)] || 0
    
    return {
      resultsA,
      resultsB,
      statsA: { survival: survivalA, median: medianRevA, p10: p10A, p90: p90A },
      statsB: { survival: survivalB, median: medianRevB, p10: p10B, p90: p90B },
    }
  }, [scenarioA, scenarioB, externalShocks])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-full bg-black" />
  }

  const sharedProps = {
    scenarioA,
    scenarioB,
    setScenarioB,
    resultsA,
    resultsB,
    statsA,
    statsB,
    startState,
    months: MONTHS,
    runs: RUNS,
    externalShocks,
    setExternalShocks,
  }

  return (
    <div className="h-full bg-black overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-400" />
            <span className="text-white font-semibold">STRATFIT</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-violet-400 text-xs font-mono tracking-wide">FATE MACHINE</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-cyan-400 text-xs font-mono">{scenarioA.name}</span>
          </div>
          <span className="text-white/30">vs</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-400 text-xs font-mono">{scenarioB.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg">
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-violet-400 text-[10px] font-mono">{RUNS.toLocaleString()} SIMULATIONS</span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="h-12 border-b border-white/10 flex items-center px-6 gap-1 bg-black/50 shrink-0">
        {views.map((v) => {
          const Icon = v.icon
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                view === v.id
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{v.label}</span>
            </button>
          )
        })}
        
        <div className="ml-auto text-[10px] text-white/30 font-mono">
          {views.find(v => v.id === view)?.description}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {view === 'fate' && <FateMachine {...sharedProps} />}
        {view === 'parallel' && <ParallelLives {...sharedProps} />}
        {view === 'survival' && <SurvivalFilter {...sharedProps} />}
        {view === 'whatif' && <WhatIfPlayground {...sharedProps} />}
        {view === 'verdict' && <TheVerdict {...sharedProps} />}
      </main>
    </div>
  )
}
