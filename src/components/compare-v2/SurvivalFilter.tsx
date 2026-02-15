// src/components/compare-v2/SurvivalFilter.tsx
// STRATFIT — Survival Filter: Who Makes It?

import React, { useRef, useEffect, useMemo } from 'react'
import { Skull, Shield } from 'lucide-react'

interface SimulationState {
  month: number
  revenue: number
  alive: boolean
}

interface ScenarioConfig {
  id: 'A' | 'B'
  name: string
  color: string
}

interface Props {
  scenarioA: ScenarioConfig
  scenarioB: ScenarioConfig
  resultsA: SimulationState[][]
  resultsB: SimulationState[][]
  statsA: { survival: number }
  statsB: { survival: number }
  months: number
  runs: number
}

export function SurvivalFilter({
  scenarioA,
  scenarioB,
  resultsA,
  resultsB,
  statsA,
  statsB,
  months,
  runs,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate survival over time
  const survivalOverTimeA = useMemo(() => {
    const survival = []
    for (let m = 0; m <= months; m++) {
      const alive = resultsA.filter(r => r[m].alive).length
      survival.push(alive / runs)
    }
    return survival
  }, [resultsA, months, runs])

  const survivalOverTimeB = useMemo(() => {
    const survival = []
    for (let m = 0; m <= months; m++) {
      const alive = resultsB.filter(r => r[m].alive).length
      survival.push(alive / runs)
    }
    return survival
  }, [resultsB, months, runs])

  // Deaths by month
  const deathsByMonthB = useMemo(() => {
    const deaths: number[] = new Array(months + 1).fill(0)
    resultsB.forEach(path => {
      for (let m = 1; m <= months; m++) {
        if (path[m - 1].alive && !path[m].alive) {
          deaths[m]++
        }
      }
    })
    return deaths
  }, [resultsB, months])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const W = container.clientWidth
    const H = container.clientHeight
    const DPR = Math.min(2, window.devicePixelRatio || 1)

    canvas.width = W * DPR
    canvas.height = H * DPR
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    // Layout
    const padL = 60, padR = 40, padT = 40, padB = 60
    const chartW = W - padL - padR
    const chartH = H - padT - padB

    // Clear
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    // Helpers
    const x = (month: number) => padL + (month / months) * chartW
    const y = (survival: number) => padT + (1 - survival) * chartH

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let p = 0; p <= 100; p += 25) {
      const yPos = y(p / 100)
      ctx.beginPath()
      ctx.moveTo(padL, yPos)
      ctx.lineTo(padL + chartW, yPos)
      ctx.stroke()
    }

    // Draw fill areas
    // Path A fill
    ctx.fillStyle = 'rgba(34, 211, 238, 0.1)'
    ctx.beginPath()
    ctx.moveTo(x(0), y(1))
    for (let m = 0; m <= months; m++) {
      ctx.lineTo(x(m), y(survivalOverTimeA[m]))
    }
    ctx.lineTo(x(months), y(1))
    ctx.closePath()
    ctx.fill()

    // Path B fill
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)'
    ctx.beginPath()
    ctx.moveTo(x(0), y(1))
    for (let m = 0; m <= months; m++) {
      ctx.lineTo(x(m), y(survivalOverTimeB[m]))
    }
    ctx.lineTo(x(months), y(1))
    ctx.closePath()
    ctx.fill()

    // Draw survival lines
    // Path A
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let m = 0; m <= months; m++) {
      if (m === 0) ctx.moveTo(x(m), y(survivalOverTimeA[m]))
      else ctx.lineTo(x(m), y(survivalOverTimeA[m]))
    }
    ctx.stroke()

    // Path B
    ctx.strokeStyle = '#f59e0b'
    ctx.beginPath()
    for (let m = 0; m <= months; m++) {
      if (m === 0) ctx.moveTo(x(m), y(survivalOverTimeB[m]))
      else ctx.lineTo(x(m), y(survivalOverTimeB[m]))
    }
    ctx.stroke()

    // Death indicators
    const maxDeaths = Math.max(...deathsByMonthB)
    ctx.globalAlpha = 0.3
    for (let m = 1; m <= months; m++) {
      if (deathsByMonthB[m] > runs * 0.02) {
        const height = (deathsByMonthB[m] / maxDeaths) * 30
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(x(m) - 2, padT - height - 10, 4, height)
      }
    }
    ctx.globalAlpha = 1

    // Axes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.font = '10px ui-monospace, monospace'
    
    // Y axis
    ctx.textAlign = 'right'
    ctx.fillText('100%', padL - 10, padT + 4)
    ctx.fillText('75%', padL - 10, y(0.75) + 4)
    ctx.fillText('50%', padL - 10, y(0.5) + 4)
    ctx.fillText('25%', padL - 10, y(0.25) + 4)
    ctx.fillText('0%', padL - 10, padT + chartH + 4)

    // X axis
    ctx.textAlign = 'center'
    for (let m = 0; m <= months; m += 12) {
      ctx.fillText(`T+${m}`, x(m), padT + chartH + 20)
    }

    // Title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.fillText('SURVIVAL PROBABILITY OVER TIME', padL, 20)

    // Endpoint labels
    ctx.fillStyle = '#22d3ee'
    ctx.textAlign = 'left'
    ctx.fillText(`${(survivalOverTimeA[months] * 100).toFixed(0)}%`, x(months) + 10, y(survivalOverTimeA[months]) + 4)
    
    ctx.fillStyle = '#f59e0b'
    ctx.fillText(`${(survivalOverTimeB[months] * 100).toFixed(0)}%`, x(months) + 10, y(survivalOverTimeB[months]) + 4)

  }, [survivalOverTimeA, survivalOverTimeB, deathsByMonthB, months, runs])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Stats */}
      <div className="h-32 border-b border-white/10 flex items-center justify-center gap-16 px-8">
        {/* Path A Survival */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-cyan-400 text-sm">{scenarioA.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            <div>
              <div className="text-4xl font-light text-cyan-400 font-mono">
                {(statsA.survival * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-white/40">survive to month {months}</div>
            </div>
          </div>
        </div>

        {/* Delta */}
        <div className={`px-6 py-4 rounded-2xl ${
          statsA.survival > statsB.survival 
            ? 'bg-cyan-500/10 border border-cyan-500/30' 
            : 'bg-amber-500/10 border border-amber-500/30'
        }`}>
          <div className="text-center">
            <div className={`text-3xl font-light font-mono ${
              statsA.survival > statsB.survival ? 'text-cyan-400' : 'text-amber-400'
            }`}>
              {Math.abs((statsA.survival - statsB.survival) * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-white/50">
              {statsA.survival > statsB.survival ? 'A safer' : 'B riskier'}
            </div>
          </div>
        </div>

        {/* Path B Survival */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-amber-400 text-sm">{scenarioB.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-400" />
            <div>
              <div className="text-4xl font-light text-amber-400 font-mono">
                {(statsB.survival * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-white/40">survive to month {months}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>

      {/* Death Analysis */}
      <div className="h-32 border-t border-white/10 flex items-center justify-center gap-8 px-8">
        <div className="flex items-center gap-4">
          <Skull className="w-6 h-6 text-red-400" />
          <div>
            <div className="text-white font-medium">Failure Analysis</div>
            <div className="text-[11px] text-white/50">When do companies die?</div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-mono text-cyan-400">
              {((1 - statsA.survival) * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-white/40">Path A failures</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono text-amber-400">
              {((1 - statsB.survival) * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-white/40">Path B failures</div>
          </div>
        </div>

        <div className="text-sm text-white/50 max-w-md">
          {statsB.survival < statsA.survival 
            ? `Path B has ${((statsA.survival - statsB.survival) * 100).toFixed(0)}% more failures, 
               primarily occurring when aggressive burn outpaces revenue growth.`
            : `Path A and B have similar survival rates. The aggressive path doesn't significantly 
               increase failure risk in this scenario.`
          }
        </div>
      </div>
    </div>
  )
}

