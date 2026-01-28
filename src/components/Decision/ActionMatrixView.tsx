// src/components/Decision/ActionMatrixView.tsx
// STRATFIT — Action Matrix: What Should You Do
// 3 views: Matrix, List, Timeline

import { useState } from 'react'
import { Target, Clock, Zap, CheckCircle } from 'lucide-react'
import type { SharedProps, Action } from './types'

const urgencyColors = {
  'now': { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' },
  'this-week': { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
  'this-month': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400' },
  'this-quarter': { bg: 'bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-400' },
}

export function ActionMatrix({ actions }: SharedProps) {
  const [view, setView] = useState<'matrix' | 'list' | 'timeline'>('matrix')

  // Position actions in matrix
  const getQuadrant = (action: Action) => {
    const highImpact = action.impact >= 6
    const lowEffort = action.effort <= 5
    
    if (highImpact && lowEffort) return 'do-now'
    if (highImpact && !lowEffort) return 'plan'
    if (!highImpact && lowEffort) return 'delegate'
    return 'backlog'
  }

  const quadrants = {
    'do-now': actions.filter(a => getQuadrant(a) === 'do-now'),
    'plan': actions.filter(a => getQuadrant(a) === 'plan'),
    'delegate': actions.filter(a => getQuadrant(a) === 'delegate'),
    'backlog': actions.filter(a => getQuadrant(a) === 'backlog'),
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-[10px] text-white/40 tracking-[0.3em] mb-2">ACTION MATRIX</div>
            <h1 className="text-2xl text-white font-light">
              What should you do?
            </h1>
            <p className="text-white/50 mt-2">
              Prioritized actions based on impact and effort
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {(['matrix', 'list', 'timeline'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-md text-xs font-mono transition-all ${
                  view === v
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {view === 'matrix' && (
          <div className="grid grid-cols-2 gap-4">
            {/* DO NOW */}
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg text-emerald-400">DO NOW</h2>
                <span className="text-[10px] text-white/40">High Impact • Low Effort</span>
              </div>
              <div className="space-y-3">
                {quadrants['do-now'].map(action => (
                  <ActionCard key={action.id} action={action} />
                ))}
                {quadrants['do-now'].length === 0 && (
                  <div className="text-white/30 text-sm">No quick wins identified</div>
                )}
              </div>
            </div>

            {/* PLAN CAREFULLY */}
            <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg text-amber-400">PLAN CAREFULLY</h2>
                <span className="text-[10px] text-white/40">High Impact • High Effort</span>
              </div>
              <div className="space-y-3">
                {quadrants['plan'].map(action => (
                  <ActionCard key={action.id} action={action} />
                ))}
                {quadrants['plan'].length === 0 && (
                  <div className="text-white/30 text-sm">No major initiatives queued</div>
                )}
              </div>
            </div>

            {/* DELEGATE */}
            <div className="bg-cyan-500/5 border border-cyan-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg text-cyan-400">DELEGATE</h2>
                <span className="text-[10px] text-white/40">Low Impact • Low Effort</span>
              </div>
              <div className="space-y-3">
                {quadrants['delegate'].map(action => (
                  <ActionCard key={action.id} action={action} />
                ))}
                {quadrants['delegate'].length === 0 && (
                  <div className="text-white/30 text-sm">Nothing to delegate right now</div>
                )}
              </div>
            </div>

            {/* BACKLOG */}
            <div className="bg-slate-500/5 border border-slate-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg text-slate-400">BACKLOG</h2>
                <span className="text-[10px] text-white/40">Low Impact • High Effort</span>
              </div>
              <div className="space-y-3">
                {quadrants['backlog'].map(action => (
                  <ActionCard key={action.id} action={action} />
                ))}
                {quadrants['backlog'].length === 0 && (
                  <div className="text-white/30 text-sm">Backlog is clear</div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="space-y-4">
            {actions
              .sort((a, b) => {
                const urgencyOrder = { 'now': 0, 'this-week': 1, 'this-month': 2, 'this-quarter': 3 }
                if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
                  return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
                }
                return b.impact - a.impact
              })
              .map((action, i) => (
                <div 
                  key={action.id}
                  className={`border rounded-xl p-5 ${urgencyColors[action.urgency].bg} ${urgencyColors[action.urgency].border}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${urgencyColors[action.urgency].bg} ${urgencyColors[action.urgency].text}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-medium">{action.title}</h3>
                          <p className="text-white/50 text-sm mt-1">{action.description}</p>
                        </div>
                        <span className={`text-[10px] px-3 py-1 rounded-full ${urgencyColors[action.urgency].bg} ${urgencyColors[action.urgency].text}`}>
                          {action.urgency.toUpperCase().replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 mt-4">
                        <div>
                          <div className="text-[9px] text-white/40">IMPACT</div>
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(10)].map((_, j) => (
                              <div key={j} className={`w-2 h-4 rounded-sm ${j < action.impact ? 'bg-emerald-500' : 'bg-white/10'}`} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-white/40">EFFORT</div>
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(10)].map((_, j) => (
                              <div key={j} className={`w-2 h-4 rounded-sm ${j < action.effort ? 'bg-amber-500' : 'bg-white/10'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-[9px] text-white/40">EXPECTED OUTCOME</div>
                          <div className="text-sm text-emerald-400">{action.expectedOutcome}</div>
                        </div>
                      </div>

                      {action.dependencies && action.dependencies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-[9px] text-white/40">DEPENDS ON</div>
                          <div className="flex gap-2 mt-1">
                            {action.dependencies.map(dep => (
                              <span key={dep} className="text-[10px] px-2 py-1 bg-white/5 rounded text-white/60">
                                {dep}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {view === 'timeline' && (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-0 left-20 bottom-0 w-px bg-white/10" />
            
            {/* Now */}
            <TimelineSection 
              label="NOW" 
              color="red"
              actions={actions.filter(a => a.urgency === 'now')} 
            />
            
            {/* This Week */}
            <TimelineSection 
              label="THIS WEEK" 
              color="amber"
              actions={actions.filter(a => a.urgency === 'this-week')} 
            />
            
            {/* This Month */}
            <TimelineSection 
              label="1-3 MONTHS" 
              color="cyan"
              actions={actions.filter(a => a.urgency === 'this-month')} 
            />
            
            {/* This Quarter */}
            <TimelineSection 
              label="3-6 MONTHS" 
              color="slate"
              actions={actions.filter(a => a.urgency === 'this-quarter')} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ActionCard({ action }: { action: Action }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="text-white text-sm font-medium">{action.title}</div>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-[9px] px-2 py-0.5 rounded-full ${urgencyColors[action.urgency].bg} ${urgencyColors[action.urgency].text}`}>
          {action.urgency.toUpperCase().replace('-', ' ')}
        </span>
        <span className="text-[10px] text-emerald-400">{action.expectedOutcome}</span>
      </div>
    </div>
  )
}

function TimelineSection({ label, color, actions }: { label: string; color: string; actions: Action[] }) {
  const colors: Record<string, { dot: string; text: string }> = {
    red: { dot: 'bg-red-500', text: 'text-red-400' },
    amber: { dot: 'bg-amber-500', text: 'text-amber-400' },
    cyan: { dot: 'bg-cyan-500', text: 'text-cyan-400' },
    slate: { dot: 'bg-slate-500', text: 'text-slate-400' },
  }
  
  return (
    <div className="flex gap-8 mb-8">
      <div className="w-20 text-right">
        <div className={`text-sm font-mono ${colors[color].text}`}>{label}</div>
      </div>
      <div className={`w-4 h-4 rounded-full ${colors[color].dot} -ml-2 mt-1 relative z-10`} />
      <div className="flex-1 space-y-3">
        {actions.map(action => (
          <div key={action.id} className="bg-white/3 border border-white/10 rounded-lg p-4">
            <div className="text-white font-medium">{action.title}</div>
            <div className="text-sm text-white/50 mt-1">{action.description}</div>
            <div className="text-sm text-emerald-400 mt-2">{action.expectedOutcome}</div>
          </div>
        ))}
        {actions.length === 0 && (
          <div className="text-white/30 text-sm">Nothing scheduled</div>
        )}
      </div>
    </div>
  )
}
