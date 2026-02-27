// src/components/Decision/DecisionLogView.tsx
// STRATFIT — Decision Log: Learning From Yourself
// Track decisions, outcomes, and patterns over time

import { History, CheckCircle, XCircle, AlertCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import type { SharedProps, Decision } from './types'

const outcomeConfig = {
  good: { icon: CheckCircle, color: 'emerald', label: 'GOOD' },
  mixed: { icon: AlertCircle, color: 'amber', label: 'MIXED' },
  poor: { icon: XCircle, color: 'red', label: 'POOR' },
  pending: { icon: Clock, color: 'slate', label: 'PENDING' },
}

export function DecisionLogView({ decisions }: SharedProps) {
  const completed = decisions.filter(d => d.outcome && d.outcome !== 'pending')
  const goodDecisions = completed.filter(d => d.outcome === 'good').length
  const accuracy = completed.length > 0 ? (goodDecisions / completed.length) * 100 : 0

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] text-white/40 tracking-[0.3em] mb-2">DECISION LOG</div>
          <h1 className="text-2xl text-white font-light">
            Learning from yourself
          </h1>
          <p className="text-white/50 mt-2">
            Track decisions, outcomes, and patterns over time
          </p>
        </div>

        {/* Pattern Analysis */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white/2 border border-white/10 rounded-xl p-5">
            <div className="text-[10px] text-white/40 tracking-wide mb-2">DECISION ACCURACY</div>
            <div className={`text-3xl font-light font-mono ${
              accuracy >= 70 ? 'text-emerald-400' :
              accuracy >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {accuracy.toFixed(0)}%
            </div>
            <div className="text-sm text-white/40 mt-1">{goodDecisions} of {completed.length} good outcomes</div>
          </div>

          <div className="bg-white/2 border border-white/10 rounded-xl p-5">
            <div className="text-[10px] text-white/40 tracking-wide mb-2">BEST DECISIONS</div>
            <div className="text-white text-sm">When you waited for more data</div>
            <div className="text-emerald-400 text-[11px] mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Patience pays off
            </div>
          </div>

          <div className="bg-white/2 border border-white/10 rounded-xl p-5">
            <div className="text-[10px] text-white/40 tracking-wide mb-2">WORST DECISIONS</div>
            <div className="text-white text-sm">When you rushed under pressure</div>
            <div className="text-red-400 text-[11px] mt-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Speed killed quality
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute top-0 left-[72px] bottom-0 w-px bg-white/10" />
          
          {decisions.map((decision) => {
            const config = decision.outcome ? outcomeConfig[decision.outcome] : outcomeConfig.pending
            const Icon = config.icon
            
            return (
              <div key={decision.id} className="flex gap-6 mb-6">
                <div className="w-16 text-right shrink-0">
                  <div className="text-[11px] text-white/40">{new Date(decision.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                
                <div className={`w-4 h-4 rounded-full -ml-2 mt-1 relative z-10 ${
                  config.color === 'emerald' ? 'bg-emerald-500' :
                  config.color === 'amber' ? 'bg-amber-500' :
                  config.color === 'red' ? 'bg-red-500' :
                  'bg-slate-500'
                }`} />
                
                <div className={`flex-1 border rounded-xl p-5 ${
                  decision.outcome === 'good' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  decision.outcome === 'mixed' ? 'bg-amber-500/5 border-amber-500/20' :
                  decision.outcome === 'poor' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-white/2 border-white/10'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">{decision.title}</h3>
                      <p className="text-white/50 text-sm mt-1">{decision.reasoning}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40">Conf: {decision.confidenceAtTime}%</span>
                      <span className={`text-[9px] px-2 py-1 rounded-full flex items-center gap-1 ${
                        config.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                        config.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                        config.color === 'red' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                  </div>
                  
                  {decision.actualResult && (
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <div className="text-[9px] text-white/40 mb-1">ACTUAL RESULT</div>
                      <p className="text-sm text-white/70">{decision.actualResult}</p>
                    </div>
                  )}
                  
                  {decision.learning && (
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-[9px] text-emerald-400 mb-1">KEY LEARNING</div>
                      <p className="text-sm text-white/70">{decision.learning}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Decision Button */}
        <div className="mt-8 text-center">
          <button className="px-6 py-3 bg-violet-500/20 border border-violet-500/30 rounded-xl text-violet-300 hover:bg-violet-500/30 transition-colors">
            Log New Decision
          </button>
        </div>
      </div>
    </div>
  )
}
