// src/components/compare/OutcomeHistogram.tsx
// STRATFIT — Outcome Distribution Histogram

import React, { useRef, useEffect, useMemo } from 'react'

interface Scenario {
  revenueGrowth: number
  marketExpansion: number
  operationalRisk: number
}

interface Props {
  baseline: Scenario
  exploration: Scenario
  timeline: number
  setTimeline: (t: number) => void
}

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 48271) % 2147483647
    return seed / 2147483647
  }
}

function fmtMoney(x: number) {
  return `$${x.toFixed(1)}M`
}

function generateFinalValue(scenario: Scenario, seed: number, steps: number, startValue: number): number {
  const rand = seededRandom(seed)
  let value = startValue
  
  for (let t = 1; t < steps; t++) {
    const drift = ((scenario.revenueGrowth - 1) / steps) * 1.5 +
                  ((scenario.marketExpansion - 1) / steps) * 0.8
    const vol = scenario.operationalRisk * 0.06
    const shock = (rand() - 0.5) * 2 * vol
    value = Math.max(0.5, value * (1 + drift + shock))
  }
  
  return value
}

function computeHistogram(values: number[], bins: number, min: number, max: number): number[] {
  const histogram = new Array(bins).fill(0)
  const binWidth = (max - min) / bins
  
  values.forEach(v => {
    const binIndex = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / binWidth)))
    histogram[binIndex]++
  })
  
  const maxCount = Math.max(...histogram)
  return histogram.map(h => h / maxCount)
}

export function OutcomeHistogram({ baseline, exploration, timeline, setTimeline }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const STEPS = 37
  const START_VALUE = 3.2
  const NUM_SIMS = 2000
  const BINS = 40

  // Generate final values at current timeline
  const { valuesA, valuesB, histA, histB, binMin, binMax, statsA, statsB } = useMemo(() => {
    const currentSteps = Math.max(2, Math.round(timeline * (STEPS - 1)) + 1)
    
    const vA: number[] = []
    const vB: number[] = []
    
    for (let i = 0; i < NUM_SIMS; i++) {
      vA.push(generateFinalValue(baseline, 10000 + i * 7, currentSteps, START_VALUE))
      vB.push(generateFinalValue(exploration, 50000 + i * 7, currentSteps, START_VALUE))
    }
    
    const allValues = [...vA, ...vB]
    const min = Math.min(...allValues) * 0.9
    const max = Math.max(...allValues) * 1.1
    
    const hA = computeHistogram(vA, BINS, min, max)
    const hB = computeHistogram(vB, BINS, min, max)
    
    // Stats
    const sortedA = [...vA].sort((a, b) => a - b)
    const sortedB = [...vB].sort((a, b) => a - b)
    
    const sA = {
      p05: sortedA[Math.floor(NUM_SIMS * 0.05)],
      p50: sortedA[Math.floor(NUM_SIMS * 0.50)],
      p95: sortedA[Math.floor(NUM_SIMS * 0.95)],
      mean: vA.reduce((a, b) => a + b, 0) / NUM_SIMS,
    }
    
    const sB = {
      p05: sortedB[Math.floor(NUM_SIMS * 0.05)],
      p50: sortedB[Math.floor(NUM_SIMS * 0.50)],
      p95: sortedB[Math.floor(NUM_SIMS * 0.95)],
      mean: vB.reduce((a, b) => a + b, 0) / NUM_SIMS,
    }
    
    return { valuesA: vA, valuesB: vB, histA: hA, histB: hB, binMin: min, binMax: max, statsA: sA, statsB: sB }
  }, [baseline, exploration, timeline])

  // P(B > A)
  const probBWins = useMemo(() => {
    let wins = 0
    for (let i = 0; i < NUM_SIMS; i++) {
      if (valuesB[i] > valuesA[i]) wins++
    }
    return (wins / NUM_SIMS) * 100
  }, [valuesA, valuesB])

  const tIndex = Math.round(timeline * (STEPS - 1))

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const W = container.clientWidth
    const H = container.clientHeight
    const DPR = Math.min(2, window.devicePixelRatio || 1)

    canvas.width = Math.floor(W * DPR)
    canvas.height = Math.floor(H * DPR)
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    // Layout
    const padL = 70, padR = 40, padT = 60, padB = 80
    const chartW = W - padL - padR
    const chartH = H - padT - padB
    const barWidth = chartW / BINS

    // Clear
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    // Vignette
    const vignette = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7)
    vignette.addColorStop(0, 'transparent')
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, W, H)

    // Title
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`OUTCOME DISTRIBUTION AT T+${tIndex}`, W / 2, 30)

    // Draw histograms
    for (let i = 0; i < BINS; i++) {
      const x = padL + i * barWidth
      const heightA = histA[i] * chartH * 0.9
      const heightB = histB[i] * chartH * 0.9

      // Baseline (cyan) - from bottom
      ctx.fillStyle = 'rgba(34,211,238,0.4)'
      ctx.fillRect(x + 2, padT + chartH - heightA, barWidth - 4, heightA)

      // Exploration (amber) - from bottom, overlapping
      ctx.fillStyle = 'rgba(245,158,11,0.4)'
      ctx.fillRect(x + 2, padT + chartH - heightB, barWidth - 4, heightB)
    }

    // Overlap area highlight
    for (let i = 0; i < BINS; i++) {
      const x = padL + i * barWidth
      const heightA = histA[i] * chartH * 0.9
      const heightB = histB[i] * chartH * 0.9
      const overlapH = Math.min(heightA, heightB)

      if (overlapH > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.fillRect(x + 2, padT + chartH - overlapH, barWidth - 4, overlapH)
      }
    }

    // Median markers
    const xVal = (v: number) => padL + ((v - binMin) / (binMax - binMin)) * chartW

    // Baseline median
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(xVal(statsA.p50), padT)
    ctx.lineTo(xVal(statsA.p50), padT + chartH + 10)
    ctx.stroke()

    // Exploration median
    ctx.strokeStyle = '#f59e0b'
    ctx.beginPath()
    ctx.moveTo(xVal(statsB.p50), padT)
    ctx.lineTo(xVal(statsB.p50), padT + chartH + 10)
    ctx.stroke()

    // P5/P95 markers (dashed)
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1

    ctx.strokeStyle = 'rgba(34,211,238,0.4)'
    ctx.beginPath()
    ctx.moveTo(xVal(statsA.p05), padT + chartH * 0.3)
    ctx.lineTo(xVal(statsA.p05), padT + chartH)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(xVal(statsA.p95), padT + chartH * 0.3)
    ctx.lineTo(xVal(statsA.p95), padT + chartH)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(245,158,11,0.4)'
    ctx.beginPath()
    ctx.moveTo(xVal(statsB.p05), padT + chartH * 0.3)
    ctx.lineTo(xVal(statsB.p05), padT + chartH)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(xVal(statsB.p95), padT + chartH * 0.3)
    ctx.lineTo(xVal(statsB.p95), padT + chartH)
    ctx.stroke()

    ctx.setLineDash([])

    // X axis labels
    ctx.fillStyle = 'rgba(148,163,184,0.5)'
    ctx.font = '10px ui-monospace, monospace'
    ctx.textAlign = 'center'

    const numLabels = 6
    for (let i = 0; i <= numLabels; i++) {
      const v = binMin + (i / numLabels) * (binMax - binMin)
      const xPos = xVal(v)
      ctx.fillText(fmtMoney(v), xPos, padT + chartH + 25)
    }

    // Axis title
    ctx.fillText('VALUATION ($M)', W / 2, padT + chartH + 50)

    // Legend
    ctx.textAlign = 'left'
    ctx.fillStyle = '#22d3ee'
    ctx.fillRect(padL, H - 35, 12, 12)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillText('BASELINE', padL + 18, H - 26)

    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(padL + 100, H - 35, 12, 12)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillText('EXPLORATION', padL + 118, H - 26)

    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(padL + 220, H - 35, 12, 12)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillText('OVERLAP', padL + 238, H - 26)

  }, [timeline, histA, histB, binMin, binMax, statsA, statsB, tIndex, BINS])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Metrics Header */}
      <div className="h-28 flex items-center justify-center gap-6 border-b border-white/5">
        {/* Baseline Stats */}
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-6 py-4">
          <div className="text-[9px] text-cyan-400/60 tracking-[0.2em] mb-2">BASELINE</div>
          <div className="flex gap-4">
            <div>
              <div className="text-[8px] text-slate-500">P05</div>
              <div className="text-sm font-mono text-cyan-400/70">{fmtMoney(statsA.p05)}</div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500">MEDIAN</div>
              <div className="text-xl font-mono text-cyan-400">{fmtMoney(statsA.p50)}</div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500">P95</div>
              <div className="text-sm font-mono text-cyan-400/70">{fmtMoney(statsA.p95)}</div>
            </div>
          </div>
        </div>

        {/* P(B > A) */}
        <div className={`px-8 py-4 rounded-xl ${probBWins > 50 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          <div className="text-[9px] text-slate-500 tracking-[0.2em] mb-1 text-center">P(EXPLORATION WINS)</div>
          <div className={`text-4xl font-light font-mono text-center ${probBWins > 50 ? 'text-emerald-400' : 'text-red-400'}`}>
            {probBWins.toFixed(0)}%
          </div>
        </div>

        {/* Exploration Stats */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-6 py-4">
          <div className="text-[9px] text-amber-400/60 tracking-[0.2em] mb-2">EXPLORATION</div>
          <div className="flex gap-4">
            <div>
              <div className="text-[8px] text-slate-500">P05</div>
              <div className="text-sm font-mono text-amber-400/70">{fmtMoney(statsB.p05)}</div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500">MEDIAN</div>
              <div className="text-xl font-mono text-amber-400">{fmtMoney(statsB.p50)}</div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500">P95</div>
              <div className="text-sm font-mono text-amber-400/70">{fmtMoney(statsB.p95)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>

      {/* Timeline */}
      <div className="h-20 flex items-center justify-center gap-6 px-8 border-t border-white/5">
        <div className="flex-1 max-w-2xl flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-500 tracking-[0.15em]">HORIZON</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={timeline}
              onChange={(e) => setTimeline(parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none bg-white/10 rounded-full cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            />
            <span className="text-2xl font-light text-white font-mono min-w-[70px] text-right">
              T+{tIndex}
            </span>
          </div>
          <div className="flex justify-between text-[9px] text-slate-600 font-mono px-16">
            <span>NOW</span>
            <span>T+12</span>
            <span>T+24</span>
            <span>T+36</span>
          </div>
        </div>
      </div>
    </div>
  )
}
