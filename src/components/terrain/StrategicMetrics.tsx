import React, { useMemo } from 'react'
import { Shield, TrendingUp, Target, Info } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface StrategicMetricsProps {
  runwayMonths: number
  growthRate: number // MoM as decimal (0.08 = 8%)
  survivalProbability: number // 0-100
  className?: string
}

type HealthStatus = 'critical' | 'warning' | 'healthy' | 'strong'

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function getRunwayHealth(months: number): HealthStatus {
  if (months < 6) return 'critical'
  if (months < 12) return 'warning'
  if (months < 24) return 'healthy'
  return 'strong'
}

function getGrowthHealth(rate: number): HealthStatus {
  if (rate < -0.05) return 'critical'
  if (rate < 0) return 'warning'
  if (rate < 0.1) return 'healthy'
  return 'strong'
}

function getSurvivalHealth(prob: number): HealthStatus {
  if (prob < 50) return 'critical'
  if (prob < 70) return 'warning'
  if (prob < 85) return 'healthy'
  return 'strong'
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLING
// ═══════════════════════════════════════════════════════════════════════════════

const healthColors: Record<HealthStatus, { text: string; bg: string; border: string; glow: string }> = {
  critical: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  },
  warning: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
  },
  healthy: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
  },
  strong: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
  },
}

const healthLabels: Record<HealthStatus, string> = {
  critical: 'CRITICAL',
  warning: 'CAUTION',
  healthy: 'HEALTHY',
  strong: 'STRONG',
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI VISUALIZATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function RunwayBar({ months, health }: { months: number; health: HealthStatus }) {
  const maxMonths = 72 // 6 years max display
  const percentage = Math.min(100, (months / maxMonths) * 100)
  
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-500 ${
          health === 'critical' ? 'bg-red-500' :
          health === 'warning' ? 'bg-amber-500' :
          health === 'healthy' ? 'bg-cyan-500' : 'bg-emerald-500'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

function GrowthIndicator({ rate, health }: { rate: number; health: HealthStatus }) {
  const bars = 5
  const filledBars = Math.min(bars, Math.max(0, Math.round((rate + 0.1) / 0.06))) // -10% to +20% range
  
  return (
    <div className="flex items-end gap-0.5 h-5">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm transition-all duration-300 ${
            i < filledBars
              ? health === 'critical' ? 'bg-red-500' :
                health === 'warning' ? 'bg-amber-500' :
                health === 'healthy' ? 'bg-cyan-500' : 'bg-emerald-500'
              : 'bg-white/10'
          }`}
          style={{ height: `${40 + i * 15}%` }}
        />
      ))}
    </div>
  )
}

function SurvivalRing({ probability, health }: { probability: number; health: HealthStatus }) {
  const circumference = 2 * Math.PI * 18 // radius 18
  const strokeDashoffset = circumference - (probability / 100) * circumference
  
  const strokeColor = 
    health === 'critical' ? '#ef4444' :
    health === 'warning' ? '#f59e0b' :
    health === 'healthy' ? '#22d3ee' : '#10b981'
  
  return (
    <svg width="44" height="44" className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="4"
      />
      {/* Progress ring */}
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-500"
        style={{
          filter: `drop-shadow(0 0 6px ${strokeColor})`,
        }}
      />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subvalue: string
  health: HealthStatus
  visual: React.ReactNode
  tooltip: string
}

function MetricCard({ icon, label, value, subvalue, health, visual, tooltip }: MetricCardProps) {
  const colors = healthColors[health]
  
  return (
    <div 
      className={`relative flex-1 p-4 rounded-xl border ${colors.border} ${colors.bg} ${colors.glow} transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`${colors.text} opacity-60`}>
            {icon}
          </div>
          <span className="text-[10px] font-mono tracking-[0.15em] text-white/50">{label}</span>
        </div>
        <div className="group relative">
          <Info className="w-3.5 h-3.5 text-white/20 hover:text-white/40 cursor-help transition-colors" />
          <div className="absolute right-0 top-6 w-48 p-2 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {tooltip}
          </div>
        </div>
      </div>
      
      {/* Value + Visual */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-3xl font-light font-mono ${colors.text}`}>
            {value}
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">
            {subvalue}
          </div>
        </div>
        <div className="opacity-80">
          {visual}
        </div>
      </div>
      
      {/* Health Badge */}
      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-mono tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
        {healthLabels[health]}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function StrategicMetrics({
  runwayMonths,
  growthRate,
  survivalProbability,
  className = '',
}: StrategicMetricsProps) {
  const runwayHealth = useMemo(() => getRunwayHealth(runwayMonths), [runwayMonths])
  const growthHealth = useMemo(() => getGrowthHealth(growthRate), [growthRate])
  const survivalHealth = useMemo(() => getSurvivalHealth(survivalProbability), [survivalProbability])

  return (
    <div className={`flex gap-4 ${className}`}>
      {/* RESILIENCE */}
      <MetricCard
        icon={<Shield className="w-4 h-4" />}
        label="RESILIENCE"
        value={runwayMonths.toString()}
        subvalue="months runway"
        health={runwayHealth}
        visual={<RunwayBar months={runwayMonths} health={runwayHealth} />}
        tooltip="How long you can operate without additional revenue or funding. Based on current cash and burn rate."
      />

      {/* MOMENTUM */}
      <MetricCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="MOMENTUM"
        value={`${growthRate >= 0 ? '+' : ''}${(growthRate * 100).toFixed(0)}%`}
        subvalue="MoM growth"
        health={growthHealth}
        visual={<GrowthIndicator rate={growthRate} health={growthHealth} />}
        tooltip="Month-over-month revenue growth rate. Indicates whether you're accelerating or decelerating."
      />

      {/* SURVIVAL */}
      <MetricCard
        icon={<Target className="w-4 h-4" />}
        label="SURVIVAL"
        value={`${survivalProbability}%`}
        subvalue="probability"
        health={survivalHealth}
        visual={<SurvivalRing probability={survivalProbability} health={survivalHealth} />}
        tooltip="Probability of surviving 36 months based on 10,000 Monte Carlo simulations of your current strategy."
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT (for smaller spaces)
// ═══════════════════════════════════════════════════════════════════════════════

export function StrategicMetricsCompact({
  runwayMonths,
  growthRate,
  survivalProbability,
  className = '',
}: StrategicMetricsProps) {
  const runwayHealth = getRunwayHealth(runwayMonths)
  const growthHealth = getGrowthHealth(growthRate)
  const survivalHealth = getSurvivalHealth(survivalProbability)

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {/* RESILIENCE */}
      <div className="flex items-center gap-2">
        <Shield className={`w-4 h-4 ${healthColors[runwayHealth].text}`} />
        <div>
          <div className={`text-lg font-mono font-light ${healthColors[runwayHealth].text}`}>
            {runwayMonths}
            <span className="text-[10px] text-white/40 ml-1">mo</span>
          </div>
        </div>
      </div>

      <div className="w-px h-6 bg-white/10" />

      {/* MOMENTUM */}
      <div className="flex items-center gap-2">
        <TrendingUp className={`w-4 h-4 ${healthColors[growthHealth].text}`} />
        <div>
          <div className={`text-lg font-mono font-light ${healthColors[growthHealth].text}`}>
            {growthRate >= 0 ? '+' : ''}{(growthRate * 100).toFixed(0)}%
            <span className="text-[10px] text-white/40 ml-1">MoM</span>
          </div>
        </div>
      </div>

      <div className="w-px h-6 bg-white/10" />

      {/* SURVIVAL */}
      <div className="flex items-center gap-2">
        <Target className={`w-4 h-4 ${healthColors[survivalHealth].text}`} />
        <div>
          <div className={`text-lg font-mono font-light ${healthColors[survivalHealth].text}`}>
            {survivalProbability}%
            <span className="text-[10px] text-white/40 ml-1">survival</span>
          </div>
        </div>
      </div>
    </div>
  )
}





