// src/components/Decision/OpportunityScanner.tsx
// STRATFIT — Opportunity Scanner: What Could Help You
// AI-detected opportunities with weighted potential

import { Sparkles, TrendingUp, Clock, Zap, ArrowRight, DollarSign } from 'lucide-react'
import type { SharedProps } from './types'

function fmtMoney(x: number) {
  if (x >= 1000000) return `$${(x / 1000000).toFixed(1)}M`
  if (x >= 1000) return `$${(x / 1000).toFixed(0)}K`
  return `$${x}`
}

const categoryStyles = {
  revenue: { icon: DollarSign, color: 'emerald', hex: '#10b981', bg: 'rgba(16,185,129,0.2)' },
  efficiency: { icon: Zap, color: 'cyan', hex: '#22d3ee', bg: 'rgba(34,211,238,0.2)' },
  expansion: { icon: TrendingUp, color: 'violet', hex: '#8b5cf6', bg: 'rgba(139,92,246,0.2)' },
  strategic: { icon: Sparkles, color: 'amber', hex: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
}

export function OpportunityScanner({ opportunities }: SharedProps) {
  const totalPotential = opportunities.reduce((sum, o) => sum + o.potential * (o.confidence / 100), 0)

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] text-white/40 tracking-[0.3em] mb-2">OPPORTUNITY SCANNER</div>
          <h1 className="text-2xl text-white font-light">
            What could help you?
          </h1>
          <p className="text-white/50 mt-2">
            AI-detected opportunities based on your current position
          </p>
        </div>

        {/* Summary */}
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-emerald-400/60 tracking-[0.2em]">TOTAL WEIGHTED OPPORTUNITY</div>
              <div className="text-sm text-white/50 mt-1">Risk-adjusted potential across all detected opportunities</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-light font-mono text-emerald-400">
                +{fmtMoney(totalPotential)}
              </div>
              <div className="text-sm text-white/40">potential value</div>
            </div>
          </div>
        </div>

        {/* Opportunities Grid */}
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const style = categoryStyles[opp.category]
            const Icon = style.icon
            
            return (
              <div 
                key={opp.id}
                className="rounded-xl p-6 transition-colors"
                style={{
                  background: `${style.hex}08`,
                  border: `1px solid ${style.hex}33`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: style.bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: style.hex }} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-medium text-lg">{opp.name}</h3>
                        <div className="text-[10px] text-white/40 mt-0.5">{opp.category.toUpperCase()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-mono" style={{ color: style.hex }}>
                          +{fmtMoney(opp.potential)}
                        </div>
                        <div className="text-[10px] text-white/40">{opp.confidence}% confidence</div>
                      </div>
                    </div>

                    <p className="text-white/60 text-sm mb-4">{opp.description}</p>

                    <div className="bg-white/5 rounded-lg p-3 mb-4">
                      <div className="text-[9px] text-white/40 mb-1">AI REASONING</div>
                      <p className="text-sm text-white/70">{opp.reasoning}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/40" />
                        <span className="text-sm text-white/60">{opp.timeWindow}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-[10px] px-2 py-1 rounded-full ${
                          opp.effort === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                          opp.effort === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {opp.effort.toUpperCase()} EFFORT
                        </div>
                      </div>
                      <button 
                        className="ml-auto flex items-center gap-2 text-sm hover:underline"
                        style={{ color: style.hex }}
                      >
                        Explore This <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Not Pursued Section */}
        <div className="mt-8 bg-white/2 border border-white/10 rounded-xl p-6">
          <div className="text-[10px] text-white/40 tracking-[0.2em] mb-3">OPPORTUNITIES NOT BEING PURSUED</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/50">
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
              <span className="text-sm">Partnership channel (you haven't explored this)</span>
            </div>
            <div className="flex items-center gap-2 text-white/50">
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
              <span className="text-sm">Product-led growth motion (your metrics support it)</span>
            </div>
            <div className="flex items-center gap-2 text-white/50">
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
              <span className="text-sm">International expansion (your product is ready)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
