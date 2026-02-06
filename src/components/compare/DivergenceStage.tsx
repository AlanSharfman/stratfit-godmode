// src/components/compare/DivergenceStage.tsx
// STRATFIT — Divergence Stage with Driver Panel

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 48271) % 2147483647
    return seed / 2147483647
  }
}

function fmtMoney(x: number) {
  return `$${Math.abs(x).toFixed(1)}M`
}

function fmtPercent(x: number) {
  return `${x >= 0 ? '+' : ''}${x.toFixed(1)}%`
}

function generatePath(scenario: Scenario, seed: number, steps: number, startValue: number): number[] {
  const rand = seededRandom(seed)
  const values: number[] = [startValue]
  
  for (let t = 1; t < steps; t++) {
    const prev = values[t - 1]
    const drift = ((scenario.revenueGrowth - 1) / steps) * 1.5 +
                  ((scenario.marketExpansion - 1) / steps) * 0.8
    const vol = scenario.operationalRisk * 0.06
    const shock = (rand() - 0.5) * 2 * vol
    values.push(Math.max(0.5, prev * (1 + drift + shock)))
  }
  
  return values
}

function computePercentiles(paths: number[][]): { p05: number[]; p50: number[]; p95: number[] } {
  const steps = paths[0].length
  const p05: number[] = [], p50: number[] = [], p95: number[] = []
  
  for (let t = 0; t < steps; t++) {
    const col = paths.map(p => p[t]).sort((a, b) => a - b)
    p05.push(col[Math.floor(col.length * 0.05)])
    p50.push(col[Math.floor(col.length * 0.50)])
    p95.push(col[Math.floor(col.length * 0.95)])
  }
  
  return { p05, p50, p95 }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRIVER PULSE
// ═══════════════════════════════════════════════════════════════════════════════

function DriverPulse({ name, value, isActive }: { name: string; value: number; isActive: boolean }) {
  const width = Math.abs(value) * 100
  const isPositive = value >= 0
  
  return (
    <div className={`flex items-center gap-3 py-2 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
      <div className="w-20 text-[10px] text-slate-400 text-right font-mono">{name}</div>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-cyan-400/60' : 'bg-amber-400/60'}`}
          style={{ 
            width: `${width}%`,
            boxShadow: isActive ? `0 0 12px ${isPositive ? 'rgba(34,211,238,0.5)' : 'rgba(245,158,11,0.5)'}` : 'none'
          }}
        />
      </div>
      <div className={`w-12 text-[10px] font-mono ${isPositive ? 'text-cyan-400' : 'text-amber-400'}`}>
        {isPositive ? '+' : ''}{(value * 100).toFixed(0)}%
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function DivergenceStage({ baseline, exploration, timeline, setTimeline }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const STEPS = 37
  const START_VALUE = 3.2
  const SURVIVAL_THRESHOLD = 1.5
  
  const [isPlaying, setIsPlaying] = useState(false)

  // Generate simulations
  const { pathsA, pathsB, bandsA, bandsB } = useMemo(() => {
    const pA: number[][] = []
    const pB: number[][] = []
    
    for (let i = 0; i < 8; i++) {
      pA.push(generatePath(baseline, 1000 + i * 1337, STEPS, START_VALUE))
      pB.push(generatePath(exploration, 5000 + i * 1337, STEPS, START_VALUE))
    }
    
    const manyA: number[][] = []
    const manyB: number[][] = []
    for (let i = 0; i < 500; i++) {
      manyA.push(generatePath(baseline, 10000 + i * 7, STEPS, START_VALUE))
      manyB.push(generatePath(exploration, 50000 + i * 7, STEPS, START_VALUE))
    }
    
    return {
      pathsA: pA,
      pathsB: pB,
      bandsA: computePercentiles(manyA),
      bandsB: computePercentiles(manyB),
    }
  }, [baseline, exploration])

  // Metrics
  const tIndex = Math.round(timeline * (STEPS - 1))
  const valueA = bandsA.p50[tIndex]
  const valueB = bandsB.p50[tIndex]
  const delta = valueB - valueA
  const deltaPercent = valueA > 0 ? ((valueB / valueA) - 1) * 100 : 0
  const confidence = Math.max(10, Math.min(95, 100 - (bandsB.p95[tIndex] - bandsB.p05[tIndex]) * 15))

  // Divergence point
  const divergenceT = useMemo(() => {
    for (let t = 0; t < STEPS; t++) {
      if (Math.abs(bandsB.p50[t] - bandsA.p50[t]) > 0.3) return t
    }
    return 8
  }, [bandsA, bandsB])

  // Drivers
  const drivers = useMemo(() => {
    const progress = timeline
    return [
      { name: 'Pricing', value: 0.35 * progress },
      { name: 'Demand', value: 0.28 * progress },
      { name: 'CAC', value: -0.22 * progress },
      { name: 'Churn', value: -0.15 * progress },
      { name: 'Headcount', value: -0.18 * progress },
      { name: 'Capital', value: 0.12 * progress },
    ]
  }, [timeline])

  // Insight
  const insight = useMemo(() => {
    const divergeMonth = Math.round(divergenceT / STEPS * 36)
    const topDriver = drivers.reduce((a, b) => Math.abs(a.value) > Math.abs(b.value) ? a : b)
    
    if (delta > 0) {
      return `Exploration accelerates after Month ${divergeMonth}, widening the value gap to ${fmtMoney(delta)} (${fmtPercent(deltaPercent)}) driven primarily by ${topDriver.name}.`
    } else {
      return `Baseline outperforms Exploration by ${fmtMoney(Math.abs(delta))} at T+${tIndex}, with ${topDriver.name} as the key differentiator.`
    }
  }, [delta, deltaPercent, divergenceT, tIndex, drivers])

  // Animation
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      if (timeline >= 1) {
        setIsPlaying(false)
        setTimeline(1)
      } else {
        setTimeline(timeline + 0.008)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [isPlaying, timeline, setTimeline])

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
    const padL = 60, padR = 40, padT = 40, padB = 60
    const chartW = W - padL - padR
    const chartH = H - padT - padB

    // Y domain
    let yMin = Infinity, yMax = -Infinity
    for (let t = 0; t < STEPS; t++) {
      yMin = Math.min(yMin, bandsA.p05[t], bandsB.p05[t], SURVIVAL_THRESHOLD)
      yMax = Math.max(yMax, bandsA.p95[t], bandsB.p95[t])
    }
    yMin -= (yMax - yMin) * 0.15
    yMax += (yMax - yMin) * 0.15

    const x = (t: number) => padL + (t / (STEPS - 1)) * chartW
    const y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * chartH

    // Clear
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    // Vignette
    const vignette = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7)
    vignette.addColorStop(0, 'transparent')
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, W, H)

    // Survival line
    const survivalY = y(SURVIVAL_THRESHOLD)
    ctx.strokeStyle = 'rgba(239,68,68,0.25)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(padL, survivalY)
    ctx.lineTo(padL + chartW, survivalY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = 'rgba(239,68,68,0.4)'
    ctx.font = '9px ui-monospace, monospace'
    ctx.fillText('SURVIVAL THRESHOLD', padL + 8, survivalY - 8)

    // Monte Carlo threads
    const drawThreads = (paths: number[][], color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      paths.forEach(path => {
        ctx.beginPath()
        for (let t = 0; t < STEPS; t++) {
          t === 0 ? ctx.moveTo(x(t), y(path[t])) : ctx.lineTo(x(t), y(path[t]))
        }
        ctx.stroke()
      })
    }

    drawThreads(pathsA, 'rgba(34,211,238,0.07)')
    drawThreads(pathsB, 'rgba(245,158,11,0.07)')

    // Confidence bands
    const drawBand = (bands: { p05: number[]; p95: number[] }, color: string) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x(0), y(bands.p05[0]))
      for (let t = 1; t < STEPS; t++) ctx.lineTo(x(t), y(bands.p05[t]))
      for (let t = STEPS - 1; t >= 0; t--) ctx.lineTo(x(t), y(bands.p95[t]))
      ctx.closePath()
      ctx.fill()
    }

    drawBand(bandsA, 'rgba(34,211,238,0.05)')
    drawBand(bandsB, 'rgba(245,158,11,0.05)')

    // Opportunity gap
    const currentT = Math.round(timeline * (STEPS - 1))
    
    ctx.beginPath()
    ctx.moveTo(x(0), y(bandsA.p50[0]))
    for (let t = 1; t <= currentT; t++) ctx.lineTo(x(t), y(bandsA.p50[t]))
    for (let t = currentT; t >= 0; t--) ctx.lineTo(x(t), y(bandsB.p50[t]))
    ctx.closePath()

    const gapGradient = ctx.createLinearGradient(x(0), 0, x(currentT), 0)
    gapGradient.addColorStop(0, 'rgba(255,255,255,0)')
    gapGradient.addColorStop(0.3, 'rgba(16,185,129,0.06)')
    gapGradient.addColorStop(1, delta > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)')
    ctx.fillStyle = gapGradient
    ctx.fill()

    // Main lines
    const drawMainLine = (values: number[], color: string, glow: string) => {
      ctx.strokeStyle = glow
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (let t = 0; t <= currentT; t++) {
        t === 0 ? ctx.moveTo(x(t), y(values[t])) : ctx.lineTo(x(t), y(values[t]))
      }
      ctx.stroke()

      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let t = 0; t <= currentT; t++) {
        t === 0 ? ctx.moveTo(x(t), y(values[t])) : ctx.lineTo(x(t), y(values[t]))
      }
      ctx.stroke()
    }

    drawMainLine(bandsA.p50, '#22d3ee', 'rgba(34,211,238,0.12)')
    drawMainLine(bandsB.p50, '#f59e0b', 'rgba(245,158,11,0.12)')

    // Divergence marker
    if (currentT >= divergenceT) {
      const divX = x(divergenceT)
      const divYA = y(bandsA.p50[divergenceT])
      const divYB = y(bandsB.p50[divergenceT])
      
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(divX, (divYA + divYB) / 2, 12, 0, Math.PI * 2)
      ctx.stroke()
      
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '9px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('DIVERGENCE', divX, (divYA + divYB) / 2 - 20)
    }

    // Time marker
    const currentX = x(currentT)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(currentX, padT)
    ctx.lineTo(currentX, padT + chartH)
    ctx.stroke()
    ctx.setLineDash([])

    // Endpoint dots
    ctx.fillStyle = '#22d3ee'
    ctx.beginPath()
    ctx.arc(currentX, y(bandsA.p50[currentT]), 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(currentX, y(bandsB.p50[currentT]), 6, 0, Math.PI * 2)
    ctx.fill()

    // Axis labels
    ctx.fillStyle = 'rgba(148,163,184,0.35)'
    ctx.font = '10px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('NOW', x(0), padT + chartH + 18)
    ctx.fillText('T+12', x(12), padT + chartH + 18)
    ctx.fillText('T+24', x(24), padT + chartH + 18)
    ctx.fillText('HORIZON', x(36), padT + chartH + 18)

    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const v = yMin + (i / 4) * (yMax - yMin)
      ctx.fillText(`$${v.toFixed(1)}M`, padL - 8, y(v) + 3)
    }

  }, [timeline, bandsA, bandsB, pathsA, pathsB, divergenceT, delta, STEPS, SURVIVAL_THRESHOLD])

  return (
    <div className="w-full h-full flex">
      {/* Main Stage */}
      <div className="flex-1 flex flex-col">
        {/* Floating Metrics */}
        <div className="h-20 flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-[9px] text-slate-500 tracking-[0.2em] mb-1">BASELINE</div>
            <div className="text-2xl font-light text-cyan-400 font-mono">{fmtMoney(valueA)}</div>
          </div>
          
          <div className={`px-6 py-3 rounded-xl ${delta >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <div className="text-[9px] text-slate-500 tracking-[0.2em] mb-1 text-center">OPPORTUNITY GAP</div>
            <div className={`text-3xl font-light font-mono text-center ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmtPercent(deltaPercent)}
            </div>
            <div className={`text-sm font-mono text-center ${delta >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
              {fmtMoney(delta)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-[9px] text-slate-500 tracking-[0.2em] mb-1">EXPLORATION</div>
            <div className="text-2xl font-light text-amber-400 font-mono">{fmtMoney(valueB)}</div>
          </div>
          
          <div className="text-center pl-8 border-l border-white/10">
            <div className="text-[9px] text-slate-500 tracking-[0.2em] mb-1">CONFIDENCE</div>
            <div className="text-xl font-light text-slate-300 font-mono">{confidence.toFixed(0)}%</div>
          </div>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative">
          <canvas ref={canvasRef} className="absolute inset-0" />
        </div>

        {/* Insight */}
        <div className="h-14 flex items-center justify-center px-12 bg-black/30">
          <p className="text-sm text-slate-400 text-center max-w-3xl">{insight}</p>
        </div>

        {/* Timeline */}
        <div className="h-20 flex items-center justify-center gap-6 px-8 border-t border-white/5">
          <button
            onClick={() => { if (timeline >= 1) setTimeline(0); setIsPlaying(!isPlaying) }}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
              isPlaying ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/20 text-white/70'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => { setTimeline(0); setIsPlaying(false) }}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-white/40"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex-1 max-w-2xl flex flex-col gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={timeline}
              onChange={(e) => setTimeline(parseFloat(e.target.value))}
              className="w-full h-1 appearance-none bg-white/10 rounded-full cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            />
            <div className="flex justify-between text-[9px] text-slate-600 font-mono">
              <span>NOW</span>
              <span>T+12</span>
              <span>T+24</span>
              <span>HORIZON</span>
            </div>
          </div>

          <div className="text-3xl font-light text-white font-mono min-w-[80px] text-right">
            T+{tIndex}
          </div>
        </div>
      </div>

      {/* Driver Panel */}
      <div className="w-64 border-l border-white/5 bg-black/30 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="text-[10px] text-slate-500 tracking-[0.2em]">DRIVER SENSITIVITY</div>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          {drivers.map(d => (
            <DriverPulse key={d.name} name={d.name} value={d.value} isActive={Math.abs(d.value) > 0.15} />
          ))}
        </div>
        <div className="p-4 border-t border-white/5">
          <div className="text-[9px] text-slate-600 mb-2">RISK INDICATORS</div>
          <div className="flex gap-2">
            <div className={`flex-1 p-2 rounded-lg ${bandsB.p05[tIndex] < SURVIVAL_THRESHOLD ? 'bg-red-500/10' : 'bg-white/5'}`}>
              <div className="text-[8px] text-slate-500">P05</div>
              <div className={`text-sm font-mono ${bandsB.p05[tIndex] < SURVIVAL_THRESHOLD ? 'text-red-400' : 'text-slate-300'}`}>
                {fmtMoney(bandsB.p05[tIndex])}
              </div>
            </div>
            <div className="flex-1 p-2 rounded-lg bg-white/5">
              <div className="text-[8px] text-slate-500">P95</div>
              <div className="text-sm font-mono text-slate-300">{fmtMoney(bandsB.p95[tIndex])}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
