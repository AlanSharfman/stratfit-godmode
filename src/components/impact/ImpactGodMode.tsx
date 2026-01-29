'use client'

import React, { useMemo, useState } from 'react'
import { 
  Zap, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  Trophy,
  Sparkles,
  ChevronRight,
  Shield,
  DollarSign,
  Users,
  Gauge,
  Flame,
  Lock,
  CheckCircle,
  Info
} from 'lucide-react'
import { useSimulationStore } from '@/state/simulationStore'
import { useLeverStore } from '@/state/leverStore'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Lever {
  id: string
  name: string
  value: number
  impactScore: number
  dollarImpact: number
  effort: 'low' | 'medium' | 'high'
  category: 'growth' | 'operations' | 'risk'
}

interface DangerZone {
  lever: string
  current: number
  threshold: number
  severity: 'warning' | 'critical'
  message: string
}

interface Achievement {
  id: string
  name: string
  description: string
  requirement: string
  progress: number
  unlocked: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ImpactGodMode() {
  const { summary } = useSimulationStore()
  const { levers } = useLeverStore()
  
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null)
  const [showLeverDetail, setShowLeverDetail] = useState<string | null>(null)

  // Calculate lever impacts
  const leverData = useMemo(() => calculateLeverImpacts(levers, summary), [levers, summary])
  const topLever = leverData[0]
  const focusScore = useMemo(() => calculateFocusScore(leverData, levers), [leverData, levers])
  const dangerZones = useMemo(() => calculateDangerZones(levers), [levers])
  const achievements = useMemo(() => calculateAchievements(levers, summary), [levers, summary])
  const quadrants = useMemo(() => categorizeByQuadrant(leverData), [leverData])

  return (
    <div className="min-h-full bg-black p-6 space-y-6">
      {/* Header */}
      <ImpactHeader topLever={topLever} focusScore={focusScore} />

      {/* Lever Power Rankings */}
      <LeverPowerRankings 
        levers={leverData} 
        selectedLever={showLeverDetail}
        onSelectLever={setShowLeverDetail}
      />

      {/* Where To Focus Matrix */}
      <WhereToFocusMatrix 
        quadrants={quadrants}
        selectedQuadrant={selectedQuadrant}
        onSelectQuadrant={setSelectedQuadrant}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Danger Zones */}
        <DangerZonesPanel zones={dangerZones} />

        {/* Achievements */}
        <AchievementsPanel achievements={achievements} />
      </div>

      {/* AI Strategic Advisor */}
      <AIStrategicAdvisor 
        topLever={topLever}
        focusScore={focusScore}
        dangerZones={dangerZones}
        levers={leverData}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function ImpactHeader({ topLever, focusScore }: { topLever: Lever; focusScore: number }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full mb-4">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] text-cyan-400 font-mono tracking-wider">YOUR #1 PRIORITY RIGHT NOW</span>
        </div>
        
        <h1 className="text-4xl font-light text-white mb-2">{topLever.name}</h1>
        <p className="text-white/50 mb-4">
          Your highest leverage growth driver. Each point = new customers.
        </p>
        
        <div className="flex items-baseline gap-2">
          <span className="text-white/40 text-sm">Each 1% improvement =</span>
          <span className="text-3xl font-mono text-white">${formatCompact(topLever.dollarImpact / 100)}</span>
          <span className="text-white/40 text-sm">/ year</span>
        </div>
      </div>

      {/* Focus Score */}
      <div className="text-center">
        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${
          focusScore >= 70 ? 'border-emerald-500 text-emerald-400' :
          focusScore >= 50 ? 'border-amber-500 text-amber-400' :
          'border-red-500 text-red-400'
        }`}>
          <span className="text-3xl font-mono">{focusScore}</span>
        </div>
        <div className="text-[10px] text-white/40 mt-2 tracking-wider">FOCUS</div>
        <div className="text-xs text-white/60 mt-1">
          {focusScore >= 70 ? "You're focused on the right levers. Stay the course." :
           focusScore >= 50 ? "Some optimization needed." :
           "Refocus on high-impact levers."}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVER POWER RANKINGS
// ═══════════════════════════════════════════════════════════════════════════════

function LeverPowerRankings({ 
  levers, 
  selectedLever, 
  onSelectLever 
}: { 
  levers: Lever[]
  selectedLever: string | null
  onSelectLever: (id: string | null) => void
}) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-medium flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          LEVER POWER RANKINGS
        </h2>
        <span className="text-white/40 text-xs">Ranked by impact on your survival and growth</span>
      </div>

      <div className="space-y-3">
        {levers.map((lever, index) => (
          <LeverRow 
            key={lever.id}
            lever={lever}
            rank={index + 1}
            isSelected={selectedLever === lever.id}
            onSelect={() => onSelectLever(selectedLever === lever.id ? null : lever.id)}
          />
        ))}
      </div>
    </div>
  )
}

function LeverRow({ 
  lever, 
  rank, 
  isSelected, 
  onSelect 
}: { 
  lever: Lever
  rank: number
  isSelected: boolean
  onSelect: () => void
}) {
  const effortColors = {
    low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Quick' },
    medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Medium' },
    high: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Hard' },
  }
  
  const effort = effortColors[lever.effort]
  const barWidth = (lever.impactScore / 100) * 100

  return (
    <div 
      className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
        isSelected ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-white/5'
      }`}
      onClick={onSelect}
    >
      {/* Rank */}
      <div className="w-8 text-white/30 font-mono text-sm">#{rank}</div>
      
      {/* Name + Effort */}
      <div className="w-48">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{lever.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${effort.bg} ${effort.text}`}>
            {effort.label}
          </span>
        </div>
        <div className="text-white/40 text-xs">Currently at {lever.value}%</div>
      </div>
      
      {/* Impact Bar */}
      <div className="flex-1 flex items-center gap-4">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              rank <= 2 ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' :
              rank <= 5 ? 'bg-gradient-to-r from-cyan-500/70 to-emerald-500/70' :
              'bg-gradient-to-r from-amber-500/50 to-amber-500/30'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        
        {/* Score + Dollar Impact */}
        <div className="flex items-center gap-4 w-32">
          <span className="text-white font-mono">{lever.impactScore}</span>
          <span className="text-emerald-400 font-mono text-sm">
            +${formatCompact(lever.dollarImpact)}
          </span>
        </div>
      </div>
      
      <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHERE TO FOCUS MATRIX
// ═══════════════════════════════════════════════════════════════════════════════

function WhereToFocusMatrix({ 
  quadrants, 
  selectedQuadrant, 
  onSelectQuadrant 
}: { 
  quadrants: Record<string, Lever[]>
  selectedQuadrant: string | null
  onSelectQuadrant: (q: string | null) => void
}) {
  const quadrantConfig = {
    quickWins: {
      title: 'QUICK WINS',
      subtitle: 'DO THESE FIRST',
      icon: <Zap className="w-4 h-4" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
    },
    strategicBets: {
      title: 'STRATEGIC BETS',
      subtitle: 'PLAN & INVEST',
      icon: <Target className="w-4 h-4" />,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
    },
    fillIns: {
      title: 'FILL-INS',
      subtitle: 'DELEGATE',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-white/40',
      bg: 'bg-white/5',
      border: 'border-white/10',
    },
    moneyPits: {
      title: 'MONEY PITS',
      subtitle: 'AVOID / REDUCE',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
  }

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-medium">WHERE TO FOCUS</h2>
        <span className="text-white/40 text-xs">Effort vs. Impact — prioritize wisely</span>
      </div>

      {/* Axis Labels */}
      <div className="relative">
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-white/30 tracking-wider">
          LOW EFFORT
        </div>
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 rotate-90 text-[10px] text-white/30 tracking-wider">
          HIGH EFFORT
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-[10px] text-white/30 tracking-wider">
          HIGH IMPACT
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 text-[10px] text-white/30 tracking-wider">
          LOW IMPACT
        </div>

        {/* Quadrant Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(quadrantConfig).map(([key, config]) => (
            <QuadrantCell
              key={key}
              config={config}
              levers={quadrants[key] || []}
              isSelected={selectedQuadrant === key}
              onSelect={() => onSelectQuadrant(selectedQuadrant === key ? null : key)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function QuadrantCell({ 
  config, 
  levers, 
  isSelected, 
  onSelect 
}: { 
  config: any
  levers: Lever[]
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div 
      className={`p-4 rounded-xl border cursor-pointer transition-all ${config.bg} ${
        isSelected ? config.border + ' ring-1 ring-current' : 'border-white/5 hover:border-white/20'
      }`}
      onClick={onSelect}
    >
      <div className={`flex items-center gap-2 ${config.color} mb-1`}>
        {config.icon}
        <span className="text-xs font-medium">{config.title}</span>
      </div>
      <div className="text-[10px] text-white/40 mb-3">{config.subtitle}</div>
      
      <div className="flex flex-wrap gap-1.5">
        {levers.map(lever => (
          <span 
            key={lever.id}
            className="px-2 py-1 bg-black/30 rounded text-xs text-white/70"
          >
            {lever.name}
          </span>
        ))}
        {levers.length === 0 && (
          <span className="text-xs text-white/30 italic">None</span>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DANGER ZONES
// ═══════════════════════════════════════════════════════════════════════════════

function DangerZonesPanel({ zones }: { zones: DangerZone[] }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          DANGER ZONES
        </h2>
        <span className="text-white/40 text-xs">Thresholds that trigger accelerated risk</span>
      </div>

      {zones.length === 0 ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 text-sm">All clear — no danger zones triggered</span>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone, i) => (
            <DangerZoneRow key={i} zone={zone} />
          ))}
        </div>
      )}
    </div>
  )
}

function DangerZoneRow({ zone }: { zone: DangerZone }) {
  const progress = (zone.current / zone.threshold) * 100
  const isCritical = zone.severity === 'critical'

  return (
    <div className={`p-4 rounded-xl border ${
      isCritical 
        ? 'bg-red-500/10 border-red-500/30' 
        : 'bg-amber-500/10 border-amber-500/30'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <Flame className="w-4 h-4 text-red-400 animate-pulse" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <span className={isCritical ? 'text-red-400' : 'text-amber-400'}>
            {isCritical ? 'CRITICAL' : 'WARNING'}
          </span>
        </div>
        <span className="text-white/60 text-sm">
          {zone.current}% / {zone.threshold}%
        </span>
      </div>
      
      <div className="text-white font-medium mb-2">{zone.lever} approaching {zone.threshold}%</div>
      
      <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full rounded-full transition-all ${
            isCritical ? 'bg-red-500' : 'bg-amber-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      <div className="text-white/50 text-xs">{zone.message}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

function AchievementsPanel({ achievements }: { achievements: Achievement[] }) {
  const unlocked = achievements.filter(a => a.unlocked).length
  const total = achievements.length

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-medium flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          ACHIEVEMENTS TO UNLOCK
        </h2>
        <span className="text-white/40 text-xs">{unlocked}/{total} milestones on track of</span>
      </div>

      <div className="space-y-3">
        {achievements.map((achievement) => (
          <AchievementRow key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  )
}

function AchievementRow({ achievement }: { achievement: Achievement }) {
  return (
    <div className={`p-3 rounded-xl border ${
      achievement.unlocked 
        ? 'bg-emerald-500/10 border-emerald-500/30' 
        : 'bg-white/[0.02] border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {achievement.unlocked ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <Lock className="w-4 h-4 text-white/30" />
          )}
          <span className={achievement.unlocked ? 'text-white' : 'text-white/60'}>
            {achievement.name}
          </span>
        </div>
        <span className={`text-xs font-mono ${
          achievement.unlocked ? 'text-emerald-400' : 'text-white/40'
        }`}>
          {achievement.progress}%
        </span>
      </div>
      
      <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full rounded-full transition-all ${
            achievement.unlocked 
              ? 'bg-emerald-500' 
              : achievement.progress >= 70 
                ? 'bg-cyan-500' 
                : 'bg-white/20'
          }`}
          style={{ width: `${achievement.progress}%` }}
        />
      </div>
      
      <div className="text-white/40 text-xs">{achievement.requirement}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI STRATEGIC ADVISOR
// ═══════════════════════════════════════════════════════════════════════════════

function AIStrategicAdvisor({ 
  topLever, 
  focusScore,
  dangerZones,
  levers 
}: { 
  topLever: Lever
  focusScore: number
  dangerZones: DangerZone[]
  levers: Lever[]
}) {
  const advice = generateStrategicAdvice(topLever, focusScore, dangerZones, levers)

  return (
    <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-violet-400 mb-4">
        <Sparkles className="w-5 h-5" />
        <span className="text-xs font-mono tracking-wider">AI STRATEGIC ADVISOR</span>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-cyan-400 font-mono text-xs">[PRIMARY INSIGHT]</span>
          <p className="text-white/80 mt-1">{advice.primary}</p>
        </div>

        <div>
          <span className="text-amber-400 font-mono text-xs">[WATCH OUT]</span>
          <p className="text-white/80 mt-1">{advice.warning}</p>
        </div>

        <div>
          <span className="text-emerald-400 font-mono text-xs">[RECOMMENDED ACTION]</span>
          <p className="text-white/80 mt-1">{advice.action}</p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateLeverImpacts(levers: any, summary: any): Lever[] {
  const baseARR = summary?.medianARR ?? 1000000
  
  const leverConfig = [
    { id: 'demandStrength', name: 'Demand Strength', effort: 'high' as const, multiplier: 1.0 },
    { id: 'pricingPower', name: 'Pricing Power', effort: 'low' as const, multiplier: 0.85 },
    { id: 'costDiscipline', name: 'Cost Discipline', effort: 'medium' as const, multiplier: 0.75 },
    { id: 'expansionVelocity', name: 'Expansion Velocity', effort: 'medium' as const, multiplier: 0.72 },
    { id: 'hiringIntensity', name: 'Hiring Intensity', effort: 'high' as const, multiplier: 0.65 },
    { id: 'marketVolatility', name: 'Market Volatility', effort: 'low' as const, multiplier: 0.55 },
    { id: 'executionRisk', name: 'Execution Risk', effort: 'medium' as const, multiplier: 0.50 },
    { id: 'operatingDrag', name: 'Operating Drag', effort: 'medium' as const, multiplier: 0.45 },
  ]

  return leverConfig.map((config, index) => {
    const value = levers?.[config.id] ?? 50
    const impactScore = Math.round(config.multiplier * 100 - index * 5)
    const dollarImpact = Math.round(baseARR * config.multiplier * 0.1)

    return {
      id: config.id,
      name: config.name,
      value,
      impactScore,
      dollarImpact,
      effort: config.effort,
      category: index < 4 ? 'growth' : index < 6 ? 'operations' : 'risk',
    } as Lever
  }).sort((a, b) => b.impactScore - a.impactScore)
}

function calculateFocusScore(levers: Lever[], leverValues: any): number {
  // Higher focus score when high-impact levers are optimized
  const topLevers = levers.slice(0, 3)
  const avgTopLeverValue = topLevers.reduce((sum, l) => sum + (leverValues?.[l.id] ?? 50), 0) / 3
  return Math.round(avgTopLeverValue * 1.2)
}

function calculateDangerZones(levers: any): DangerZone[] {
  const zones: DangerZone[] = []

  const thresholds = [
    { id: 'hiringIntensity', name: 'Hiring Intensity', threshold: 75, message: 'Fast hiring burns cash and risks culture dilution' },
    { id: 'marketVolatility', name: 'Market Volatility', threshold: 70, message: 'High volatility increases forecast uncertainty' },
    { id: 'executionRisk', name: 'Execution Risk', threshold: 65, message: 'Execution risk compounds with team growth' },
    { id: 'operatingDrag', name: 'Operating Drag', threshold: 60, message: 'Operational inefficiency erodes margins' },
  ]

  thresholds.forEach(t => {
    const value = levers?.[t.id] ?? 50
    if (value >= t.threshold * 0.85) {
      zones.push({
        lever: t.name,
        current: value,
        threshold: t.threshold,
        severity: value >= t.threshold ? 'critical' : 'warning',
        message: t.message,
      })
    }
  })

  return zones
}

function calculateAchievements(levers: any, summary: any): Achievement[] {
  const survivalRate = summary?.survivalRate ?? 0.5
  const medianARR = summary?.medianARR ?? 1000000

  return [
    {
      id: 'seriesA',
      name: 'Series A Ready',
      description: 'Meet Series A benchmarks',
      requirement: `Require: Survival >80% and $2M+ ARR trajectory`,
      progress: Math.min(100, Math.round((survivalRate * 100 + medianARR / 40000) / 2)),
      unlocked: survivalRate > 0.8 && medianARR > 2000000,
    },
    {
      id: 'rebootDone',
      name: 'Reboot Done',
      description: 'Complete strategic repositioning',
      requirement: `Require: Cost Discipline >60% without destroying growth`,
      progress: Math.min(100, Math.round((levers?.costDiscipline ?? 50) * 1.5)),
      unlocked: (levers?.costDiscipline ?? 50) > 60 && (levers?.demandStrength ?? 50) > 40,
    },
    {
      id: 'pricingChampion',
      name: 'Pricing Champion',
      description: 'Maximize pricing leverage',
      requirement: `Require: Pricing Power >70% with stable churn`,
      progress: Math.round((levers?.pricingPower ?? 50) * 1.3),
      unlocked: (levers?.pricingPower ?? 50) > 70,
    },
    {
      id: 'growthMachine',
      name: 'Growth Machine',
      description: 'Achieve sustainable growth',
      requirement: `Require: Net Revenue Retention >120%`,
      progress: Math.min(100, Math.round((levers?.expansionVelocity ?? 50) + (levers?.demandStrength ?? 50)) / 2 * 1.2),
      unlocked: (levers?.expansionVelocity ?? 50) > 65 && (levers?.demandStrength ?? 50) > 65,
    },
  ]
}

function categorizeByQuadrant(levers: Lever[]): Record<string, Lever[]> {
  const quadrants: Record<string, Lever[]> = {
    quickWins: [],
    strategicBets: [],
    fillIns: [],
    moneyPits: [],
  }

  levers.forEach(lever => {
    const highImpact = lever.impactScore >= 70
    const lowEffort = lever.effort === 'low'

    if (highImpact && lowEffort) {
      quadrants.quickWins.push(lever)
    } else if (highImpact && !lowEffort) {
      quadrants.strategicBets.push(lever)
    } else if (!highImpact && lowEffort) {
      quadrants.fillIns.push(lever)
    } else {
      quadrants.moneyPits.push(lever)
    }
  })

  return quadrants
}

function generateStrategicAdvice(
  topLever: Lever,
  focusScore: number,
  dangerZones: DangerZone[],
  levers: Lever[]
): { primary: string; warning: string; action: string } {
  const primary = `**${topLever.name}** is your biggest lever right now. A focused 10-point improvement here equals approximately **$${formatCompact(topLever.dollarImpact)}** in annual value.`

  const warning = dangerZones.length > 0
    ? `You have ${dangerZones.length} danger zone${dangerZones.length > 1 ? 's' : ''} approaching threshold. **${dangerZones[0].lever}** at ${dangerZones[0].current}% needs attention before it compounds risk.`
    : focusScore < 60
      ? `Your focus score of ${focusScore} suggests energy may be spread across too many initiatives. Consider doubling down on your top 2-3 levers.`
      : `No immediate threats detected. Maintain discipline and continue optimizing high-impact levers.`

  const action = focusScore >= 70
    ? `Stay the course. Your current focus on "${topLever.name}" is aligned with maximum impact. Consider moving to "Pricing Power" as your secondary focus.`
    : `Reallocate resources to "${topLever.name}" and reduce effort on lower-impact levers like "${levers[levers.length - 1].name}".`

  return { primary, warning, action }
}

function formatCompact(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

export default ImpactGodMode