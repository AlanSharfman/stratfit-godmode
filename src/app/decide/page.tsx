'use client'

import React, { useMemo, useState } from 'react'
import {
  CheckCircle,
  Download,
  Share2,
  Sparkles,
  ChevronRight,
  Clock,
  Users,
  DollarSign,
  Award,
  RefreshCw,
  Shield,
  TrendingUp,
  AlertTriangle,
  Target,
  Eye,
  EyeOff,
  X,
} from 'lucide-react'

import { useScenarioStore } from '@/state/scenarioStore'
import { ScenarioMountain } from '@/components/mountain/ScenarioMountain'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Milestone {
  month: number
  label: string
  type: 'revenue' | 'team' | 'product' | 'funding' | 'risk'
}

interface DecisionState {
  status: 'pending' | 'committed'
  chosenScenarioId: string | null
  rejectedScenarioId: string | null
  committedAt: Date | null
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function formatMoney(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function generateMilestones(scenario: any): Milestone[] {
  const milestones: Milestone[] = []

  const survivalRate = scenario?.simulation?.survivalRate ?? 0.8
  const medianARR = scenario?.simulation?.medianARR ?? 1_000_000

  milestones.push({ month: 6, label: 'Break even on unit economics', type: 'revenue' })
  milestones.push({ month: 12, label: 'Series A target', type: 'funding' })
  milestones.push({ month: 18, label: 'Team expansion complete', type: 'team' })
  milestones.push({ month: 24, label: `${formatMoney(medianARR * 0.5)} MRR target`, type: 'revenue' })

  if (survivalRate < 0.75) {
    milestones.push({ month: 30, label: 'Runway checkpoint', type: 'risk' })
  }

  milestones.push({ month: 36, label: 'Strategic review', type: 'product' })

  return milestones
}

function getScenarioMetrics(scenario: any) {
  const hashColor = (id: string) => {
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
    const hue = h % 360
    return `hsl(${hue} 85% 60%)`
  }
  return {
    survivalRate: scenario?.simulation?.survivalRate ?? 0.85, // 0..1
    medianARR: scenario?.simulation?.medianARR ?? 4_000_000,
    runway: scenario?.simulation?.medianRunway ?? scenario?.simulation?.runwayMonths ?? 24,
    // We don't currently store team size in Scenario; approximate from hiringIntensity if present.
    teamSize:
      scenario?.inputs?.teamSize ??
      (typeof scenario?.levers?.hiringIntensity === 'number'
        ? Math.round(10 + (scenario.levers.hiringIntensity / 100) * 40)
        : 15),
    name: scenario?.name ?? 'Unnamed Scenario',
    description: scenario?.description ?? 'Strategic scenario',
    color: scenario?.color ?? hashColor(String(scenario?.id ?? 'unknown')),
    id: scenario?.id ?? 'unknown',
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DecidePage() {
  const { baseline, savedScenarios } = useScenarioStore()

  const scenarioList = useMemo(() => {
    const list = [
      ...(baseline ? [baseline as any] : []),
      ...((savedScenarios as any[]) || []),
    ]
    // De-dupe by id (baseline may also exist in savedScenarios)
    const seen = new Set<string>()
    const real = list.filter((s) => {
      const id = s?.id
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
    // STRATFIT RULE: never fabricate demo scenarios in Decision.
    // If fewer than 2 real scenarios exist, PendingView will show the empty state.
    return real
  }, [baseline, savedScenarios])

  const scenariosById = useMemo(() => {
    return Object.fromEntries(scenarioList.map((s) => [s.id, s]))
  }, [scenarioList])

  const [decision, setDecision] = useState<DecisionState>({
    status: 'pending',
    chosenScenarioId: null,
    rejectedScenarioId: null,
    committedAt: null,
  })

  const [showCommitModal, setShowCommitModal] = useState(false)
  const [pendingChoice, setPendingChoice] = useState<{ chosenId: string; rejectedId: string } | null>(null)

  const chosenScenario = decision.chosenScenarioId ? scenariosById[decision.chosenScenarioId] : null
  const rejectedScenario = decision.rejectedScenarioId ? scenariosById[decision.rejectedScenarioId] : null
  const pendingScenario = pendingChoice?.chosenId ? scenariosById[pendingChoice.chosenId] : null

  const handleSelect = (chosenId: string, rejectedId: string) => {
    setPendingChoice({ chosenId, rejectedId })
    setShowCommitModal(true)
  }

  const handleConfirm = () => {
    if (pendingChoice) {
      setDecision({
        status: 'committed',
        chosenScenarioId: pendingChoice.chosenId,
        rejectedScenarioId: pendingChoice.rejectedId,
        committedAt: new Date(),
      })
      setShowCommitModal(false)
      setPendingChoice(null)
    }
  }

  const handleReconsider = () => {
    setDecision({
      status: 'pending',
      chosenScenarioId: null,
      rejectedScenarioId: null,
      committedAt: null,
    })
  }

  const handleExport = () => {
    console.log('Exporting decision to PDF...')
  }

  const handleShare = () => {
    console.log('Copying share link...')
  }

  return (
    <div className="h-full bg-black">
      {decision.status === 'pending' && <PendingView scenarios={scenarioList} onSelect={handleSelect} />}

      {decision.status === 'committed' && chosenScenario && (
        <CommittedView
          chosenScenario={chosenScenario}
          rejectedScenario={rejectedScenario}
          committedAt={decision.committedAt!}
          onExport={handleExport}
          onShare={handleShare}
          onReconsider={handleReconsider}
        />
      )}

      {showCommitModal && pendingScenario && (
        <CommitModal
          scenario={pendingScenario}
          onConfirm={handleConfirm}
          onCancel={() => {
            setShowCommitModal(false)
            setPendingChoice(null)
          }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PENDING VIEW — CHOOSE YOUR PATH
// ═══════════════════════════════════════════════════════════════════════════════

interface PendingViewProps {
  scenarios: any[]
  onSelect: (chosenId: string, rejectedId: string) => void
}

function PendingView({ scenarios, onSelect }: PendingViewProps) {
  // Need at least 2 scenarios to compare
  if (!scenarios || scenarios.length < 2) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl text-white font-light mb-4">Need More Scenarios</h1>
          <p className="text-white/50 mb-8 leading-relaxed">
            Create at least two scenarios in the Baseline tab, run simulations, then return here to make your decision.
          </p>
          <a
            href="/baseline"
            className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 hover:bg-cyan-500/30 transition-colors text-lg"
          >
            Go to Baseline
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    )
  }

  // Use first two scenarios (placeholder; selection UI can be expanded)
  const scenarioA = scenarios[0]
  const scenarioB = scenarios[1]

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-violet-400 text-sm">THE MOMENT OF TRUTH</span>
        </div>
        <h1 className="text-5xl text-white font-light mb-4">Make Your Decision</h1>
        <p className="text-white/50 max-w-xl text-lg">
          You've analyzed the simulations. You've seen the futures diverge. Now it's time to commit to your path.
        </p>
      </div>

      {/* Scenario Cards */}
      <div className="flex gap-8 max-w-5xl w-full">
        <ScenarioCard scenario={scenarioA} otherScenarioId={getScenarioMetrics(scenarioB).id} onSelect={onSelect} />

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="my-6 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-white/40 text-lg font-mono">VS</span>
          </div>
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </div>

        <ScenarioCard scenario={scenarioB} otherScenarioId={getScenarioMetrics(scenarioA).id} onSelect={onSelect} />
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="text-white/30 text-sm">
          Need more analysis?{' '}
          <a href="/compare" className="text-cyan-400 hover:underline">
            Return to Compare
          </a>{' '}
          or{' '}
          <a href="/impact" className="text-cyan-400 hover:underline">
            Review Impact
          </a>
        </p>
      </div>
    </div>
  )
}

function ScenarioCard({
  scenario,
  otherScenarioId,
  onSelect,
}: {
  scenario: any
  otherScenarioId: string
  onSelect: (chosenId: string, rejectedId: string) => void
}) {
  const metrics = getScenarioMetrics(scenario)

  return (
    <button
      onClick={() => onSelect(metrics.id, otherScenarioId)}
      className="flex-1 p-8 rounded-2xl border-2 transition-all group text-left hover:scale-[1.02] duration-300"
      style={{
        borderColor: `${metrics.color}40`,
        backgroundColor: `${metrics.color}08`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${metrics.color}80`
        e.currentTarget.style.backgroundColor = `${metrics.color}15`
        e.currentTarget.style.boxShadow = `0 0 60px ${metrics.color}20`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${metrics.color}40`
        e.currentTarget.style.backgroundColor = `${metrics.color}08`
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: metrics.color }} />
        <h3 className="text-2xl font-light" style={{ color: metrics.color }}>
          {metrics.name}
        </h3>
      </div>

      <p className="text-white/50 text-sm mb-8 min-h-[40px]">{metrics.description}</p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <div className="text-4xl font-mono font-light" style={{ color: metrics.color }}>
            {(metrics.survivalRate * 100).toFixed(0)}%
          </div>
          <div className="text-[11px] text-white/40 mt-1">survival probability</div>
        </div>
        <div>
          <div className="text-3xl font-mono font-light text-white">{formatMoney(metrics.medianARR)}</div>
          <div className="text-[11px] text-white/40 mt-1">median ARR</div>
        </div>
        <div>
          <div className="text-2xl font-mono text-white/70">{metrics.runway}mo</div>
          <div className="text-[11px] text-white/40 mt-1">runway</div>
        </div>
        <div>
          <div className="text-2xl font-mono text-white/70">{metrics.teamSize}</div>
          <div className="text-[11px] text-white/40 mt-1">team size</div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: metrics.color }}>
        <span className="text-lg">Choose this path</span>
        <ChevronRight className="w-5 h-5" />
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMIT MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface CommitModalProps {
  scenario: any
  onConfirm: () => void
  onCancel: () => void
}

function CommitModal({ scenario, onConfirm, onCancel }: CommitModalProps) {
  const [confirmed, setConfirmed] = useState(false)
  const metrics = getScenarioMetrics(scenario)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4">
        {/* Close Button */}
        <button onClick={onCancel} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-3xl text-white font-light mb-3">Commit to This Path?</h2>
          <p className="text-white/50">
            You're about to commit to{' '}
            <span className="font-medium" style={{ color: metrics.color }}>
              {metrics.name}
            </span>
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="bg-black/30 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-mono text-emerald-400">{(metrics.survivalRate * 100).toFixed(0)}%</div>
              <div className="text-[11px] text-white/40 mt-1">survival</div>
            </div>
            <div>
              <div className="text-3xl font-mono text-white">{formatMoney(metrics.medianARR)}</div>
              <div className="text-[11px] text-white/40 mt-1">median ARR</div>
            </div>
            <div>
              <div className="text-3xl font-mono text-cyan-400">{metrics.runway}mo</div>
              <div className="text-[11px] text-white/40 mt-1">runway</div>
            </div>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-start gap-4 mb-8 cursor-pointer group">
          <div className="relative mt-1">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                confirmed ? 'bg-cyan-500 border-cyan-500' : 'border-white/30 group-hover:border-white/50'
              }`}
            >
              {confirmed && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
          </div>
          <span className="text-sm text-white/70 leading-relaxed">
            I understand this decision represents my strategic commitment. I've reviewed the simulations and accept the
            associated risks and opportunities.
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-4 border border-white/20 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
            Review Again
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              confirmed
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Commit to Path
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMITTED VIEW — THE CELEBRATORY MOUNTAIN
// ═══════════════════════════════════════════════════════════════════════════════

interface CommittedViewProps {
  chosenScenario: any
  rejectedScenario: any | null
  committedAt: Date
  onExport: () => void
  onShare: () => void
  onReconsider: () => void
}

function CommittedView({
  chosenScenario,
  rejectedScenario,
  committedAt,
  onExport,
  onShare,
  onReconsider,
}: CommittedViewProps) {
  const [showRejected, setShowRejected] = useState(false)

  const metrics = getScenarioMetrics(chosenScenario)
  const rejectedMetrics = rejectedScenario ? getScenarioMetrics(rejectedScenario) : null
  const milestones = generateMilestones(chosenScenario)

  return (
    <div className="h-full flex">
      {/* Left: Mountain Visualization */}
      <div className="flex-1 relative overflow-hidden">
        {/* Celebration Mountain */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${showRejected ? 'opacity-60' : 'opacity-100'}`}>
          <ScenarioMountain scenario={chosenScenario} mode="celebration" glowIntensity={2.2} showPath={true} showMilestones={true} />
        </div>

        {/* Ghost Mountain (rejected path) */}
        {showRejected && rejectedScenario && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <ScenarioMountain scenario={rejectedScenario} mode="ghost" glowIntensity={0.3} showPath={true} />
          </div>
        )}

        {/* Radial Glow Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 60%, ${metrics.color}20 0%, transparent 60%)`,
          }}
        />

        {/* Committed Badge - Top Left */}
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-sm">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Decision Committed</span>
          </div>
          <div className="text-sm text-white/40 mt-3 ml-1">{formatDate(committedAt)}</div>
        </div>

        {/* Scenario Title - Top Center */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-10">
          <h1 className="text-4xl font-light tracking-wide mb-2" style={{ color: metrics.color }}>
            {metrics.name.toUpperCase()}
          </h1>
          <p className="text-white/50">{metrics.description}</p>
        </div>

        {/* Toggle Rejected Path - Bottom Left */}
        {rejectedScenario && (
          <div className="absolute bottom-6 left-6 z-10">
            <button
              onClick={() => setShowRejected(!showRejected)}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all ${
                showRejected
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              {showRejected ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              <span>{showRejected ? 'Hide' : 'Show'} rejected path</span>
            </button>
          </div>
        )}

        {/* "You Are Here" Marker - Bottom Center */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center">
            <div
              className="w-5 h-5 rounded-full animate-pulse"
              style={{
                backgroundColor: 'white',
                boxShadow: '0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.4)',
              }}
            />
            <div className="mt-3 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/10">
              <span className="text-xs text-white/70 font-mono tracking-wider">YOU ARE HERE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Details Panel */}
      <div className="w-[400px] border-l border-white/10 bg-black/50 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${metrics.color}20` }}>
              <Award className="w-6 h-6" style={{ color: metrics.color }} />
            </div>
            <div>
              <h2 className="text-xl text-white font-light">Your Strategy</h2>
              <p className="text-white/40 text-sm">{metrics.description}</p>
            </div>
          </div>
        </div>

        {/* Key Outcomes */}
        <div className="p-6 border-b border-white/10">
          <div className="text-[10px] text-white/40 tracking-[0.2em] mb-5">KEY OUTCOMES (36 MONTHS)</div>

          <div className="space-y-5">
            <MetricRow icon={<Shield className="w-5 h-5" />} label="Survival Probability" value={`${(metrics.survivalRate * 100).toFixed(0)}%`} color="text-emerald-400" bgColor="bg-emerald-500/10" />

            <MetricRow icon={<DollarSign className="w-5 h-5" />} label="Median ARR" value={formatMoney(metrics.medianARR)} color="text-cyan-400" bgColor="bg-cyan-500/10" />

            <MetricRow icon={<Clock className="w-5 h-5" />} label="Runway" value={`${metrics.runway} months`} color="text-amber-400" bgColor="bg-amber-500/10" />

            <MetricRow icon={<Users className="w-5 h-5" />} label="Team Size" value={`${metrics.teamSize} people`} color="text-violet-400" bgColor="bg-violet-500/10" />
          </div>
        </div>

        {/* Milestones */}
        <div className="p-6 border-b border-white/10 flex-1 overflow-auto">
          <div className="text-[10px] text-white/40 tracking-[0.2em] mb-5">YOUR JOURNEY</div>

          <div className="space-y-4">{milestones.map((milestone, i) => <MilestoneRow key={i} milestone={milestone} />)}</div>
        </div>

        {/* Comparison (if rejected scenario exists) */}
        {rejectedMetrics && (
          <div className="p-6 border-b border-white/10 bg-white/2">
            <div className="text-[10px] text-white/40 tracking-[0.2em] mb-3">VS REJECTED PATH</div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-sm">{rejectedMetrics.name}</div>
                <div className="text-white/30 text-xs mt-1">
                  {(rejectedMetrics.survivalRate * 100).toFixed(0)}% survival • {formatMoney(rejectedMetrics.medianARR)}
                </div>
              </div>
              <div
                className={`text-lg font-mono ${
                  metrics.survivalRate > rejectedMetrics.survivalRate ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {metrics.survivalRate > rejectedMetrics.survivalRate ? '+' : ''}
                {((metrics.survivalRate - rejectedMetrics.survivalRate) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 space-y-3">
          <button
            onClick={onExport}
            className="w-full py-4 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 hover:from-cyan-500/30 hover:to-violet-500/30 transition-all flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            Export for Board Deck
          </button>

          <button
            onClick={onShare}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
          >
            <Share2 className="w-5 h-5" />
            Share with Team
          </button>

          <button
            onClick={onReconsider}
            className="w-full py-3 text-white/30 hover:text-white/50 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reconsider Decision
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function MetricRow({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bgColor: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}>
          <span className={color}>{icon}</span>
        </div>
        <span className="text-white/60">{label}</span>
      </div>
      <span className={`font-mono text-lg ${color}`}>{value}</span>
    </div>
  )
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const config = {
    revenue: { icon: <TrendingUp className="w-4 h-4" />, bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    team: { icon: <Users className="w-4 h-4" />, bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    product: { icon: <Target className="w-4 h-4" />, bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    funding: { icon: <DollarSign className="w-4 h-4" />, bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
    risk: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  }

  const c = config[milestone.type]

  return (
    <div className={`flex items-start gap-4 p-3 rounded-xl border ${c.bg} ${c.border}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.bg} ${c.text}`}>
        {c.icon}
      </div>
      <div>
        <div className="text-white text-sm font-medium">{milestone.label}</div>
        <div className="text-xs text-white/40 mt-0.5">Month {milestone.month}</div>
      </div>
    </div>
  )
}


