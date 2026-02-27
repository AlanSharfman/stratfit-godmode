// src/components/Decision/BlindSpotsView.tsx
// STRATFIT — Blind Spot Detection: What Are You Missing
// AI-detected assumptions, biases, and gaps

import { Eye, AlertTriangle, Brain, Link2, HelpCircle, Lightbulb } from 'lucide-react'
import type { SharedProps, BlindSpot } from './types'

const typeConfig = {
  assumption: { icon: HelpCircle, color: 'amber', label: 'ASSUMPTION' },
  bias: { icon: Brain, color: 'red', label: 'BIAS' },
  gap: { icon: Eye, color: 'cyan', label: 'GAP' },
  dependency: { icon: Link2, color: 'violet', label: 'DEPENDENCY' },
}

export function BlindSpotsView({ blindSpots }: SharedProps) {
  const highSeverity = blindSpots.filter(b => b.severity === 'high')
  const otherSeverity = blindSpots.filter(b => b.severity !== 'high')

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] text-white/40 tracking-[0.3em] mb-2">BLIND SPOT DETECTION</div>
          <h1 className="text-2xl text-white font-light">
            What are you missing?
          </h1>
          <p className="text-white/50 mt-2">
            AI-detected assumptions, biases, and gaps in your strategy
          </p>
        </div>

        {/* Cognitive Health Check */}
        <div className="bg-violet-500/5 border border-violet-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-violet-400 tracking-[0.2em]">COGNITIVE HEALTH CHECK</div>
                  <div className="text-white mt-1">Your decision-making patterns</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono text-violet-400">68%</div>
                  <div className="text-[10px] text-white/40">calibration score</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-violet-500/20">
                <div>
                  <div className="text-[9px] text-white/40">DECISION VELOCITY</div>
                  <div className="text-sm text-white">Normal (avg 3 days)</div>
                </div>
                <div>
                  <div className="text-[9px] text-white/40">RECENT BIAS PATTERN</div>
                  <div className="text-sm text-amber-400">Slight optimism</div>
                </div>
                <div>
                  <div className="text-[9px] text-white/40">RECOMMENDATION</div>
                  <div className="text-sm text-emerald-400">Add cooling period</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Severity Blind Spots */}
        {highSeverity.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg text-white font-light">Requires Attention</h2>
            </div>
            
            <div className="space-y-4">
              {highSeverity.map(spot => (
                <BlindSpotCard key={spot.id} spot={spot} />
              ))}
            </div>
          </div>
        )}

        {/* Other Blind Spots */}
        {otherSeverity.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg text-white font-light">Worth Considering</h2>
            </div>
            
            <div className="space-y-4">
              {otherSeverity.map(spot => (
                <BlindSpotCard key={spot.id} spot={spot} />
              ))}
            </div>
          </div>
        )}

        {/* Prompt for Reflection */}
        <div className="mt-8 bg-white/2 border border-white/10 rounded-xl p-6">
          <div className="text-[10px] text-white/40 tracking-[0.2em] mb-3">REFLECTION PROMPT</div>
          <p className="text-white/70 leading-relaxed mb-4">
            "What would have to be true for my current strategy to fail completely? 
            Write down three scenarios, then rate your confidence that they won't happen."
          </p>
          <button className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-300 text-sm hover:bg-violet-500/30 transition-colors">
            Start Reflection Exercise
          </button>
        </div>
      </div>
    </div>
  )
}

function BlindSpotCard({ spot }: { spot: BlindSpot }) {
  const config = typeConfig[spot.type]
  const Icon = config.icon
  
  return (
    <div className={`border rounded-xl p-5 ${
      spot.severity === 'high' ? 'bg-red-500/5 border-red-500/30' :
      spot.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
      'bg-white/2 border-white/10'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          config.color === 'amber' ? 'bg-amber-500/20' :
          config.color === 'red' ? 'bg-red-500/20' :
          config.color === 'cyan' ? 'bg-cyan-500/20' :
          'bg-violet-500/20'
        }`}>
          <Icon className={`w-5 h-5 ${
            config.color === 'amber' ? 'text-amber-400' :
            config.color === 'red' ? 'text-red-400' :
            config.color === 'cyan' ? 'text-cyan-400' :
            'text-violet-400'
          }`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className={`text-[10px] tracking-wide ${
                config.color === 'amber' ? 'text-amber-400' :
                config.color === 'red' ? 'text-red-400' :
                config.color === 'cyan' ? 'text-cyan-400' :
                'text-violet-400'
              }`}>
                {config.label}
              </div>
              <h3 className="text-white font-medium mt-1">{spot.title}</h3>
            </div>
            <span className={`text-[9px] px-2 py-1 rounded-full ${
              spot.severity === 'high' ? 'bg-red-500/20 text-red-400' :
              spot.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {spot.severity.toUpperCase()}
            </span>
          </div>
          
          <p className="text-white/60 text-sm mb-4">{spot.description}</p>
          
          <div className="bg-white/5 rounded-lg p-3 mb-3">
            <div className="text-[9px] text-white/40 mb-1">QUESTION TO ASK YOURSELF</div>
            <p className="text-white/80 text-sm italic">"{spot.question}"</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] text-emerald-400">RECOMMENDATION</div>
              <div className="text-sm text-white/70">{spot.recommendation}</div>
            </div>
            <button className="px-3 py-1.5 border border-white/20 rounded-lg text-white/60 text-sm hover:bg-white/5 transition-colors">
              Address This
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
