'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useScenarioStore } from '@/state/scenarioStore'
import ScenarioMountain from '@/components/mountain/ScenarioMountain'
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
  EyeOff
} from 'lucide-react'

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
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function generateMilestones(scenario: any): Milestone[] {
  // Generate milestones based on scenario data
  const milestones: Milestone[] = []
  
  const survivalRate = scenario.simulationResult?.survivalRate ?? 0.8
  const medianARR = scenario.simulationResult?.medianARR ?? 1000000
  
  // Add milestones based on scenario characteristics
  if (medianARR > 500000) {
    milestones.push({ month: 6, label: 'Break even on unit economics', type: 'revenue' })
  }
  
  milestones.push({ month: 12, label: 'Series A target', type: 'funding' })
  
  if (scenario.inputs?.hiringIntensity > 50) {
    milestones.push({ month: 18, label: 'Team expansion complete', type: 'team' })
  }
  
  milestones.push({ month: 24, label: `${formatMoney(medianARR * 0.5)} MRR target`, type: 'revenue' })
  
  if (survivalRate < 0.75) {
    milestones.push({ month: 30, label: 'Runway checkpoint', type: 'risk' })
  }
  
  milestones.push({ month: 36, label: 'Strategic review', type: 'product' })
  
  return milestones
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
  
  const survivalRate = scenario.simulationResult?.survivalRate ?? 0
  const medianARR = scenario.simulationResult?.medianARR ?? 0
  const runway = scenario.simulationResult?.runwayMonths ?? 0

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4 animate-slide-in-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl text-white font-light mb-2">Commit to This Path?</h2>
          <p className="text-white/50 text-sm">
            You're about to commit to <span className="text-cyan-400 font-medium">{scenario.name}</span>
          </p>
        </div>

        {/* Summary */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-mono text-emerald-400">
                {(survivalRate * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-white/40">survival</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-white">
                {formatMoney(medianARR)}
              </div>
              <div className="text-[10px] text-white/40">median ARR</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-cyan-400">
                {runway}mo
              </div>
              <div className="text-[10px] text-white/40">runway</div>
            </div>
          </div>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
          />
          <span className="text-sm text-white/70">
            I understand this decision represents my strategic commitment. 
            I've reviewed the simulations and accept the associated risks and opportunities.
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-white/20 rounded-xl text-white/60 hover:bg-white/5 transition-colors"
          >
            Review Again
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              confirmed
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90'
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
  onReconsider 
}: CommittedViewProps) {
  const [showRejected, setShowRejected] = useState(false)
  
  const milestones = generateMilestones(chosenScenario)
  
  const survivalRate = chosenScenario.simulationResult?.survivalRate ?? 0
  const medianARR = chosenScenario.simulationResult?.medianARR ?? 0
  const runway = chosenScenario.simulationResult?.runwayMonths ?? 0
  const teamSize = chosenScenario.inputs?.teamSize ?? 20

  return (
    <div className="h-full flex">
      {/* Mountain Visualization */}
      <div className="flex-1 relative">
        {/* Main chosen scenario mountain */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${showRejected ? 'opacity-50' : 'opacity-100'}`}>
          {chosenScenario && (
            <ScenarioMountain 
              scenario={chosenScenario}
              mode="celebration"
              glowIntensity={1.5}
              showPath={true}
              showMilestones={true}
            />
          )}
        </div>
        
        {/* Rejected scenario mountain overlay (faded) */}
        {showRejected && rejectedScenario && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <ScenarioMountain 
              scenario={rejectedScenario}
              mode="ghost"
              glowIntensity={0.3}
              showPath={true}
              showMilestones={false}
            />
          </div>
        )}
        
        {/* Celebration Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Radial glow from center */}
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 60%, ${chosenScenario.color || 'rgba(34, 211, 238, 0.15)'} 0%, transparent 60%)`,
            }}
          />
        </div>
        
        {/* Committed Badge */}
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Decision Committed</span>
          </div>
          <div className="text-[11px] text-white/40 mt-2 ml-1">
            {committedAt.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Scenario Title Overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-10">
          <h1 className="text-3xl font-light text-white mb-1" style={{ color: chosenScenario.color || '#22d3ee' }}>
            {chosenScenario.name?.toUpperCase()}
          </h1>
          <p className="text-white/50 text-sm">{chosenScenario.description || 'Your chosen strategic path'}</p>
        </div>

        {/* Toggle rejected path */}
        <div className="absolute bottom-6 left-6 z-10">
          <button
            onClick={() => setShowRejected(!showRejected)}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
              showRejected 
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            {showRejected ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{showRejected ? 'Hide' : 'Show'} rejected path</span>
          </button>
        </div>

        {/* "You Are Here" Marker */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse" />
            <div className="mt-2 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full">
              <span className="text-[10px] text-white/70 font-mono">YOU ARE HERE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-96 border-l border-white/10 bg-black/30 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl text-white font-light">Your Strategy</h2>
          </div>
          <p className="text-white/50 text-sm">{chosenScenario.description || 'Committed strategic path'}</p>
        </div>

        {/* Key Metrics */}
        <div className="p-6 border-b border-white/10">
          <div className="text-[10px] text-white/40 tracking-[0.2em] mb-4">KEY OUTCOMES (36 MONTHS)</div>
          
          <div className="space-y-4">
            <MetricRow
              icon={<Shield className="w-4 h-4" />}
              label="Survival Probability"
              value={`${(survivalRate * 100).toFixed(0)}%`}
              color="text-emerald-400"
            />
            
            <MetricRow
              icon={<DollarSign className="w-4 h-4" />}
              label="Median ARR"
              value={formatMoney(medianARR)}
              color="text-cyan-400"
            />
            
            <MetricRow
              icon={<Clock className="w-4 h-4" />}
              label="Runway"
              value={`${runway} months`}
              color="text-amber-400"
            />
            
            <MetricRow
              icon={<Users className="w-4 h-4" />}
              label="Team Size"
              value={`${teamSize} people`}
              color="text-violet-400"
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="p-6 border-b border-white/10 flex-1 overflow-auto">
          <div className="text-[10px] text-white/40 tracking-[0.2em] mb-4">YOUR JOURNEY</div>
          
          <div className="space-y-3">
            {milestones.map((milestone, i) => (
              <MilestoneRow key={i} milestone={milestone} />
            ))}
          </div>
        </div>

        {/* Comparison Summary (if rejected scenario exists) */}
        {rejectedScenario && (
          <div className="p-6 border-b border-white/10 bg-white/[0.02]">
            <div className="text-[10px] text-white/40 tracking-[0.2em] mb-3">VS REJECTED PATH</div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/50 text-xs">{rejectedScenario.name}</div>
                <div className="text-white/30 text-[10px]">
                  {((rejectedScenario.simulationResult?.survivalRate ?? 0) * 100).toFixed(0)}% survival
                </div>
              </div>
              <div className={`text-sm font-mono ${
                survivalRate > (rejectedScenario.simulationResult?.survivalRate ?? 0) 
                  ? 'text-emerald-400' 
                  : 'text-amber-400'
              }`}>
                {survivalRate > (rejectedScenario.simulationResult?.survivalRate ?? 0) ? '+' : ''}
                {((survivalRate - (rejectedScenario.simulationResult?.survivalRate ?? 0)) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 space-y-3">
          <button
            onClick={onExport}
            className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export for Board Deck
          </button>
          
          <button
            onClick={onShare}
            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share with Team
          </button>
          
          <button
            onClick={onReconsider}
            className="w-full py-2 text-white/30 hover:text-white/50 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Reconsider Decision
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-white/60 text-sm">{label}</span>
      </div>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  )
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const config = {
    revenue: { icon: <TrendingUp className="w-3 h-3" />, bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    team: { icon: <Users className="w-3 h-3" />, bg: 'bg-blue-500/20', text: 'text-blue-400' },
    product: { icon: <Target className="w-3 h-3" />, bg: 'bg-amber-500/20', text: 'text-amber-400' },
    funding: { icon: <DollarSign className="w-3 h-3" />, bg: 'bg-violet-500/20', text: 'text-violet-400' },
    risk: { icon: <AlertTriangle className="w-3 h-3" />, bg: 'bg-red-500/20', text: 'text-red-400' },
  }
  
  const c = config[milestone.type]
  
  return (
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${c.bg} ${c.text}`}>
        {c.icon}
      </div>
      <div>
        <div className="text-white text-sm">{milestone.label}</div>
        <div className="text-[10px] text-white/40">Month {milestone.month}</div>
      </div>
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
  if (scenarios.length < 2) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl text-white font-light mb-4">Need More Scenarios</h1>
          <p className="text-white/50 max-w-md mb-8">
            Create at least two scenarios in the Terrain tab, then return here to make your decision.
          </p>
          <a 
            href="/terrain"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 hover:bg-cyan-500/30 transition-colors"
          >
            Go to Terrain
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  // Use first two scenarios for now (or let user select)
  const scenarioA = scenarios[0]
  const scenarioB = scenarios[1]

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl text-white font-light mb-4">Make Your Decision</h1>
        <p className="text-white/50 max-w-lg">
          You've analyzed the simulations. You've seen the futures diverge. 
          Now it's time to commit to your path.
        </p>
      </div>

      <div className="flex gap-8 max-w-5xl w-full">
        {/* Scenario A */}
        <ScenarioCard 
          scenario={scenarioA}
          otherScenarioId={scenarioB.id}
          onSelect={onSelect}
        />

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="my-4 px-4 py-2 bg-white/5 rounded-full">
            <span className="text-white/40 text-sm font-mono">VS</span>
          </div>
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </div>

        {/* Scenario B */}
        <ScenarioCard 
          scenario={scenarioB}
          otherScenarioId={scenarioA.id}
          onSelect={onSelect}
        />
      </div>

      <div className="mt-12 text-center">
        <p className="text-white/30 text-sm">
          Need more analysis? <a href="/compare" className="text-cyan-400 hover:underline">Return to Compare</a>
        </p>
      </div>
    </div>
  )
}

function ScenarioCard({ 
  scenario, 
  otherScenarioId,
  onSelect 
}: { 
  scenario: any
  otherScenarioId: string
  onSelect: (chosenId: string, rejectedId: string) => void
}) {
  const survivalRate = scenario.simulationResult?.survivalRate ?? 0
  const medianARR = scenario.simulationResult?.medianARR ?? 0
  const color = scenario.color || '#22d3ee'
  
  return (
    <button
      onClick={() => onSelect(scenario.id, otherScenarioId)}
      className="flex-1 p-8 rounded-2xl border-2 transition-all group text-left hover:scale-[1.02]"
      style={{
        borderColor: `${color}50`,
        backgroundColor: `${color}08`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}80`
        e.currentTarget.style.backgroundColor = `${color}15`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}50`
        e.currentTarget.style.backgroundColor = `${color}08`
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-xl" style={{ color }}>{scenario.name}</h3>
      </div>
      
      <p className="text-white/50 text-sm mb-6">
        {scenario.description || 'Strategic scenario'}
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-3xl font-mono" style={{ color }}>
            {(survivalRate * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-white/40">survival</div>
        </div>
        <div>
          <div className="text-2xl font-mono text-white">
            {formatMoney(medianARR)}
          </div>
          <div className="text-[10px] text-white/40">median ARR</div>
        </div>
      </div>

      <div 
        className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color }}
      >
        <span className="text-sm">Choose this path</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DecidePage() {
  const { savedScenarios, activeScenarioId } = useScenarioStore()
  
  const [decision, setDecision] = useState<DecisionState>({
    status: 'pending',
    chosenScenarioId: null,
    rejectedScenarioId: null,
    committedAt: null,
  })

  const [showCommitModal, setShowCommitModal] = useState(false)
  const [pendingChoice, setPendingChoice] = useState<{ chosenId: string; rejectedId: string } | null>(null)

  // Scenarios are stored as an array in the scenario store
  const scenarioList = savedScenarios || []
  const scenariosById = useMemo(() => {
    return Object.fromEntries(scenarioList.map((s) => [s.id, s]))
  }, [scenarioList])

  // Get chosen and rejected scenarios
  const chosenScenario = decision.chosenScenarioId ? scenariosById?.[decision.chosenScenarioId] : null
  const rejectedScenario = decision.rejectedScenarioId ? scenariosById?.[decision.rejectedScenarioId] : null
  const pendingScenario = pendingChoice?.chosenId ? scenariosById?.[pendingChoice.chosenId] : null

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
    // TODO: Implement export
    console.log('Exporting decision...')
  }

  const handleShare = () => {
    // TODO: Implement share
    console.log('Sharing decision...')
  }

  return (
    <div className="h-full bg-black">
      {decision.status === 'pending' && (
        <PendingView
          scenarios={scenarioList}
          onSelect={handleSelect}
        />
      )}

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