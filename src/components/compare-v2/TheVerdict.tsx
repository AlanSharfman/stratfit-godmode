// src/components/compare-v2/TheVerdict.tsx
// STRATFIT — The Verdict: AI Recommendation

import React, { useMemo } from 'react'
import { Scale, CheckCircle, AlertTriangle, Zap, ArrowRight } from 'lucide-react'

interface ScenarioConfig {
  id: 'A' | 'B'
  name: string
  tagline: string
  color: string
}

interface Props {
  scenarioA: ScenarioConfig
  scenarioB: ScenarioConfig
  statsA: { survival: number; median: number; p10: number; p90: number }
  statsB: { survival: number; median: number; p10: number; p90: number }
}

export function TheVerdict({
  scenarioA,
  scenarioB,
  statsA,
  statsB,
}: Props) {
  const analysis = useMemo(() => {
    const revenueDelta = (statsB.median / statsA.median - 1) * 100
    const survivalDelta = (statsB.survival - statsA.survival) * 100
    const riskAdjustedB = statsB.median * statsB.survival
    const riskAdjustedA = statsA.median * statsA.survival
    const riskAdjustedDelta = (riskAdjustedB / riskAdjustedA - 1) * 100
    
    // Determine recommendation
    let recommendation: 'A' | 'B' | 'toss-up'
    let confidence: number
    let reasoning: string[]
    
    if (riskAdjustedDelta > 20 && statsB.survival > 0.7) {
      recommendation = 'B'
      confidence = Math.min(95, 70 + riskAdjustedDelta / 2)
      reasoning = [
        `${scenarioB.name} delivers ${revenueDelta.toFixed(0)}% higher median revenue`,
        `Survival rate of ${(statsB.survival * 100).toFixed(0)}% is acceptable for the upside`,
        `Risk-adjusted value is ${riskAdjustedDelta.toFixed(0)}% higher than conservative path`,
      ]
    } else if (riskAdjustedDelta < -10 || statsB.survival < 0.6) {
      recommendation = 'A'
      confidence = Math.min(95, 70 + Math.abs(riskAdjustedDelta) / 2)
      reasoning = [
        `${scenarioA.name} offers better risk-adjusted returns`,
        `${scenarioB.name}'s ${(statsB.survival * 100).toFixed(0)}% survival rate is concerning`,
        `The extra revenue doesn't justify the additional risk`,
      ]
    } else {
      recommendation = 'toss-up'
      confidence = 50
      reasoning = [
        `Both paths have similar risk-adjusted outcomes`,
        `Your decision should be based on personal risk tolerance`,
        `Consider what failure would mean for you personally`,
      ]
    }
    
    return {
      recommendation,
      confidence,
      reasoning,
      revenueDelta,
      survivalDelta,
      riskAdjustedDelta,
    }
  }, [statsA, statsB, scenarioA, scenarioB])

  const chooseAIf = [
    'You value stability and predictability',
    'You have personal obligations that require steady income',
    'Your runway is limited and you can\'t afford to fail',
    'You\'re optimizing for a specific exit timeline',
  ]

  const chooseBIf = [
    'You have conviction in your ability to execute',
    'Market conditions favor aggressive growth',
    'You have investor backing for the aggressive path',
    'You can personally handle the stress of higher stakes',
  ]

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full mb-6">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 text-sm font-mono">AI VERDICT</span>
          </div>
          
          <h1 className="text-4xl text-white font-light mb-4">
            {analysis.recommendation === 'A' ? (
              <>Lean toward <span className="text-cyan-400">{scenarioA.name}</span></>
            ) : analysis.recommendation === 'B' ? (
              <>Lean toward <span className="text-amber-400">{scenarioB.name}</span></>
            ) : (
              <>This is a <span className="text-violet-400">genuine toss-up</span></>
            )}
          </h1>
          
          <div className="flex items-center justify-center gap-4">
            <span className="text-white/50">AI Confidence:</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    analysis.confidence > 70 ? 'bg-emerald-500' :
                    analysis.confidence > 50 ? 'bg-amber-500' : 'bg-slate-500'
                  }`}
                  style={{ width: `${analysis.confidence}%` }}
                />
              </div>
              <span className="text-white font-mono">{analysis.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Key Reasoning */}
        <div className="bg-white/2 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="text-[10px] text-white/40 tracking-[0.2em] mb-4">KEY REASONING</div>
          <div className="space-y-3">
            {analysis.reasoning.map((reason, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-white/80">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side by Side Comparison */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Choose A If */}
          <div className={`rounded-2xl p-6 ${
            analysis.recommendation === 'A' 
              ? 'bg-cyan-500/10 border-2 border-cyan-500/50' 
              : 'bg-white/2 border border-white/10'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Scale className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-cyan-400 font-medium">Choose {scenarioA.name}</div>
                <div className="text-[11px] text-white/50">if you believe:</div>
              </div>
            </div>
            <div className="space-y-2">
              {chooseAIf.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="w-4 h-4 text-cyan-400/50 shrink-0 mt-0.5" />
                  <span className="text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Choose B If */}
          <div className={`rounded-2xl p-6 ${
            analysis.recommendation === 'B' 
              ? 'bg-amber-500/10 border-2 border-amber-500/50' 
              : 'bg-white/2 border border-white/10'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-amber-400 font-medium">Choose {scenarioB.name}</div>
                <div className="text-[11px] text-white/50">if you believe:</div>
              </div>
            </div>
            <div className="space-y-2">
              {chooseBIf.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="w-4 h-4 text-amber-400/50 shrink-0 mt-0.5" />
                  <span className="text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Numbers Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/2 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-[10px] text-white/40 tracking-wide mb-2">REVENUE DELTA</div>
            <div className={`text-3xl font-light font-mono ${
              analysis.revenueDelta > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {analysis.revenueDelta > 0 ? '+' : ''}{analysis.revenueDelta.toFixed(0)}%
            </div>
            <div className="text-[11px] text-white/40 mt-1">B vs A median</div>
          </div>

          <div className="bg-white/2 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-[10px] text-white/40 tracking-wide mb-2">SURVIVAL DELTA</div>
            <div className={`text-3xl font-light font-mono ${
              analysis.survivalDelta >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {analysis.survivalDelta >= 0 ? '+' : ''}{analysis.survivalDelta.toFixed(0)}%
            </div>
            <div className="text-[11px] text-white/40 mt-1">B vs A survival</div>
          </div>

          <div className="bg-white/2 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-[10px] text-white/40 tracking-wide mb-2">RISK-ADJUSTED</div>
            <div className={`text-3xl font-light font-mono ${
              analysis.riskAdjustedDelta > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {analysis.riskAdjustedDelta > 0 ? '+' : ''}{analysis.riskAdjustedDelta.toFixed(0)}%
            </div>
            <div className="text-[11px] text-white/40 mt-1">B vs A value</div>
          </div>
        </div>

        {/* Final Warning */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <div className="text-amber-400 font-medium mb-2">Important Caveat</div>
              <p className="text-white/60 text-sm leading-relaxed">
                This analysis is based on 500 Monte Carlo simulations with the assumptions you provided. 
                Real-world outcomes depend on factors no model can capture: your execution ability, 
                market timing, team dynamics, and pure luck. Use this as one input to your decision, 
                not the final word. <span className="text-white">Trust your gut, but verify it with data.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button className="px-6 py-3 bg-violet-500/20 border border-violet-500/30 rounded-xl text-violet-300 hover:bg-violet-500/30 transition-colors">
            Export Analysis
          </button>
          <button className="px-6 py-3 bg-white/5 border border-white/20 rounded-xl text-white/60 hover:bg-white/10 transition-colors">
            Challenge This Verdict
          </button>
        </div>
      </div>
    </div>
  )
}

