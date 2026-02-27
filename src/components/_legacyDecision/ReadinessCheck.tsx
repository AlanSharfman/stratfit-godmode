// src/components/Decision/ReadinessCheck.tsx
// STRATFIT — Readiness Check: Are You Prepared?
// Board meeting preparation and Q&A simulation

import { useState } from 'react'
import { Shield, MessageSquare, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, FileText, Presentation } from 'lucide-react'
import type { SharedProps, BoardQuestion } from './types'

export function ReadinessCheck({ boardQuestions }: SharedProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)
  
  const avgConfidence = boardQuestions.reduce((sum, q) => sum + q.confidence, 0) / boardQuestions.length
  const weakSpots = boardQuestions.filter(q => q.confidence < 70 || q.weakness)

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] text-white/40 tracking-[0.3em] mb-2">READINESS CHECK</div>
          <h1 className="text-2xl text-white font-light">
            Are you prepared?
          </h1>
          <p className="text-white/50 mt-2">
            Board meeting preparation and Q&A simulation
          </p>
        </div>

        {/* Readiness Summary */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2 bg-white/2 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] text-white/40 tracking-[0.2em]">NARRATIVE STRENGTH</div>
                <div className="text-sm text-white/50 mt-1">How well you can defend your strategy</div>
              </div>
              <div className={`text-4xl font-light font-mono ${
                avgConfidence >= 75 ? 'text-emerald-400' :
                avgConfidence >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {avgConfidence.toFixed(0)}/100
              </div>
            </div>
            
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  avgConfidence >= 75 ? 'bg-emerald-500' :
                  avgConfidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${avgConfidence}%` }}
              />
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
            <div className="text-[10px] text-amber-400 tracking-[0.2em] mb-2">WEAK SPOTS</div>
            <div className="text-3xl font-light font-mono text-amber-400">{weakSpots.length}</div>
            <div className="text-sm text-white/40 mt-1">questions need work</div>
          </div>
        </div>

        {/* Next Board Meeting */}
        <div className="bg-violet-500/5 border border-violet-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                <Presentation className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <div className="text-white font-medium">Board Meeting</div>
                <div className="text-white/50 text-sm">February 15, 2026 • 14 days away</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-300 text-sm hover:bg-violet-500/30 transition-colors flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Practice Mode
              </button>
              <button className="px-4 py-2 border border-white/20 rounded-lg text-white/60 text-sm hover:bg-white/5 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Generate Slides
              </button>
            </div>
          </div>
        </div>

        {/* Anticipated Questions */}
        <div className="mb-4">
          <div className="text-[10px] text-white/40 tracking-[0.2em] mb-4">ANTICIPATED QUESTIONS</div>
        </div>

        <div className="space-y-4">
          {boardQuestions.map((q, i) => (
            <div 
              key={i}
              className={`border rounded-xl overflow-hidden ${
                q.confidence < 70 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/2 border-white/10'
              }`}
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    q.confidence >= 70 ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                  }`}>
                    {q.confidence >= 70 ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{q.question}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      Confidence: {q.confidence}%
                      {q.weakness && <span className="text-amber-400 ml-2">• {q.weakness}</span>}
                    </div>
                  </div>
                </div>
                {expandedIndex === i ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </button>
              
              {expandedIndex === i && (
                <div className="px-5 pb-5 border-t border-white/10">
                  <div className="pt-4">
                    <div className="text-[9px] text-emerald-400 tracking-wide mb-2">SUGGESTED ANSWER</div>
                    <p className="text-white/80 leading-relaxed bg-white/5 rounded-lg p-4">
                      "{q.suggestedAnswer}"
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-[9px] text-white/40 tracking-wide mb-2">SUPPORTING DATA</div>
                    <div className="flex flex-wrap gap-2">
                      {q.supportingData.map((data, j) => (
                        <span key={j} className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-white/60">
                          {data}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {q.weakness && (
                    <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <div className="text-[9px] text-amber-400 tracking-wide mb-1">WEAKNESS TO ADDRESS</div>
                      <p className="text-sm text-white/70">{q.weakness}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex gap-3">
                    <button className="px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-300 text-sm hover:bg-violet-500/30 transition-colors">
                      Practice This Answer
                    </button>
                    <button className="px-3 py-1.5 border border-white/20 rounded-lg text-white/60 text-sm hover:bg-white/5 transition-colors">
                      Improve Answer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Weak Spots Summary */}
        {weakSpots.length > 0 && (
          <div className="mt-8 bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium">Weak spots to address before Feb 15</div>
                <ul className="mt-2 space-y-1">
                  {weakSpots.map((q, i) => (
                    <li key={i} className="text-sm text-white/60">
                      • {q.weakness || `Low confidence on "${q.question.substring(0, 40)}..."`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
