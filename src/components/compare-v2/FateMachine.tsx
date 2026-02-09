// src/components/compare-v2/FateMachine.tsx
// STRATFIT — Fate Machine: Watch Your Futures Diverge

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface ScenarioConfig {
  id: 'A' | 'B'
  name: string
  tagline: string
  color: string
}

interface SimulationState {
  month: number
  revenue: number
  cash: number
  team: number
  runway: number
  stress: number
  alive: boolean
  milestones: string[]
}

interface Props {
  scenarioA: ScenarioConfig
  scenarioB: ScenarioConfig
  resultsA: SimulationState[][]
  resultsB: SimulationState[][]
  statsA: { survival: number; median: number; p10: number; p90: number }
  statsB: { survival: number; median: number; p10: number; p90: number }
  months: number
}

function fmtMoney(x: number) {
  if (x >= 1000000) return `$${(x / 1000000).toFixed(1)}M`
  if (x >= 1000) return `$${(x / 1000).toFixed(0)}K`
  return `$${x.toFixed(0)}`
}

export function FateMachine({
  scenarioA,
  scenarioB,
  resultsA,
  resultsB,
  statsA,
  statsB,
  months,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [currentMonth, setCurrentMonth] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPaths, setShowPaths] = useState(true)

  // Get median paths for visualization
  const medianPathA = useMemo(() => {
    const sorted = [...resultsA].sort((a, b) => 
      a[months].revenue - b[months].revenue
    )
    return sorted[Math.floor(sorted.length / 2)]
  }, [resultsA, months])

  const medianPathB = useMemo(() => {
    const sorted = [...resultsB].sort((a, b) => 
      b[months].revenue - a[months].revenue
    )
    return sorted[Math.floor(sorted.length / 2)]
  }, [resultsB, months])

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      setCurrentMonth(m => {
        if (m >= months) {
          setIsPlaying(false)
          return months
        }
        return m + 0.5
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [isPlaying, months])

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
    const centerX = W / 2
    const startY = 120
    const endY = H - 100
    const pathHeight = endY - startY
    const splitY = startY + pathHeight * 0.15 // Where paths diverge
    const maxSpread = W * 0.35 // Max horizontal spread

    // Clear with deep black
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    // Subtle radial gradient
    const bgGrad = ctx.createRadialGradient(centerX, H / 2, 0, centerX, H / 2, W * 0.6)
    bgGrad.addColorStop(0, 'rgba(20, 10, 30, 0.5)')
    bgGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Helper: get path position at month
    const getPathPos = (month: number, path: 'A' | 'B') => {
      const progress = month / months
      const y = startY + progress * pathHeight
      
      // Before split: center
      if (y < splitY) {
        return { x: centerX, y }
      }
      
      // After split: diverge
      const splitProgress = (y - splitY) / (endY - splitY)
      const spread = Math.pow(splitProgress, 0.7) * maxSpread
      const x = path === 'A' ? centerX - spread : centerX + spread
      
      return { x, y }
    }

    // Draw ghost paths (all simulations, very faint)
    if (showPaths) {
      ctx.globalAlpha = 0.03
      
      // Sample 50 paths from each
      const sampleA = resultsA.filter((_, i) => i % 10 === 0)
      const sampleB = resultsB.filter((_, i) => i % 10 === 0)
      
      sampleA.forEach(path => {
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let m = 0; m <= Math.min(currentMonth, months); m++) {
          const pos = getPathPos(m, 'A')
          const variance = (path[m].revenue / medianPathA[m].revenue - 1) * 50
          m === 0 ? ctx.moveTo(pos.x + variance, pos.y) : ctx.lineTo(pos.x + variance, pos.y)
        }
        ctx.stroke()
      })
      
      sampleB.forEach(path => {
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let m = 0; m <= Math.min(currentMonth, months); m++) {
          const pos = getPathPos(m, 'B')
          const variance = (path[m].revenue / medianPathB[m].revenue - 1) * 50
          m === 0 ? ctx.moveTo(pos.x + variance, pos.y) : ctx.lineTo(pos.x + variance, pos.y)
        }
        ctx.stroke()
      })
      
      ctx.globalAlpha = 1
    }

    // Draw median paths with glow
    const drawPath = (path: SimulationState[], side: 'A' | 'B', color: string) => {
      const maxMonth = Math.min(Math.floor(currentMonth), months)
      
      // Glow
      ctx.strokeStyle = color.replace(')', ', 0.3)')
      ctx.lineWidth = 12
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (let m = 0; m <= maxMonth; m++) {
        const pos = getPathPos(m, side)
        m === 0 ? ctx.moveTo(pos.x, pos.y) : ctx.lineTo(pos.x, pos.y)
      }
      ctx.stroke()

      // Main line
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let m = 0; m <= maxMonth; m++) {
        const pos = getPathPos(m, side)
        m === 0 ? ctx.moveTo(pos.x, pos.y) : ctx.lineTo(pos.x, pos.y)
      }
      ctx.stroke()

      // Endpoint
      if (maxMonth > 0) {
        const endPos = getPathPos(maxMonth, side)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(endPos.x, endPos.y, 8, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    drawPath(medianPathA, 'A', 'rgb(34, 211, 238)')
    drawPath(medianPathB, 'B', 'rgb(245, 158, 11)')

    // Draw split point
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(centerX, splitY, 6, 0, Math.PI * 2)
    ctx.fill()

    // "THE ASSESSMENT" label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '10px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('THE ASSESSMENT', centerX, splitY - 20)

    // Draw "NOW" at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText('NOW', centerX, startY - 30)

    // Draw time markers
    const timeMarkers = [0, 12, 24, 36]
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '9px ui-monospace, monospace'
    
    timeMarkers.forEach(m => {
      if (m <= months) {
        const y = startY + (m / months) * pathHeight
        ctx.fillText(`T+${m}`, 30, y + 4)
      }
    })

    // Draw current state cards
    const monthIdx = Math.min(Math.floor(currentMonth), months)
    const stateA = medianPathA[monthIdx]
    const stateB = medianPathB[monthIdx]

    // Path A card (left)
    if (currentMonth > months * 0.15) {
      const posA = getPathPos(monthIdx, 'A')
      
      ctx.fillStyle = 'rgba(34, 211, 238, 0.1)'
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(posA.x - 100, posA.y - 60, 90, 50, 8)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#22d3ee'
      ctx.font = '10px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(scenarioA.name, posA.x - 92, posA.y - 42)
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '14px ui-monospace, monospace'
      ctx.fillText(fmtMoney(stateA.revenue) + '/mo', posA.x - 92, posA.y - 22)

      // Survival indicator
      if (!stateA.alive) {
        ctx.fillStyle = '#ef4444'
        ctx.font = '10px ui-monospace, monospace'
        ctx.fillText('💀 FAILED', posA.x - 92, posA.y - 5)
      }
    }

    // Path B card (right)
    if (currentMonth > months * 0.15) {
      const posB = getPathPos(monthIdx, 'B')
      
      ctx.fillStyle = 'rgba(245, 158, 11, 0.1)'
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(posB.x + 10, posB.y - 60, 90, 50, 8)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#f59e0b'
      ctx.font = '10px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(scenarioB.name, posB.x + 18, posB.y - 42)
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '14px ui-monospace, monospace'
      ctx.fillText(fmtMoney(stateB.revenue) + '/mo', posB.x + 18, posB.y - 22)

      if (!stateB.alive) {
        ctx.fillStyle = '#ef4444'
        ctx.font = '10px ui-monospace, monospace'
        ctx.fillText('💀 FAILED', posB.x + 18, posB.y - 5)
      }
    }

    // Draw the GAP indicator at bottom
    if (currentMonth >= months) {
      const gap = stateB.revenue - stateA.revenue
      const gapPercent = stateA.revenue > 0 ? ((stateB.revenue / stateA.revenue) - 1) * 100 : 0
      
      ctx.fillStyle = gap > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
      ctx.strokeStyle = gap > 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(centerX - 100, endY + 20, 200, 60, 12)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = '10px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('VALUE DIFFERENCE', centerX, endY + 40)
      
      ctx.fillStyle = gap > 0 ? '#10b981' : '#ef4444'
      ctx.font = '24px ui-monospace, monospace'
      ctx.fillText(`${gap > 0 ? '+' : ''}${gapPercent.toFixed(0)}%`, centerX, endY + 65)
    }

  }, [currentMonth, medianPathA, medianPathB, months, scenarioA, scenarioB, showPaths, resultsA, resultsB])

  return (
    <div className="w-full h-full flex">
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        <div ref={containerRef} className="flex-1 relative">
          <canvas ref={canvasRef} className="absolute inset-0" />
        </div>

        {/* Controls */}
        <div className="h-24 border-t border-white/10 flex items-center justify-center gap-6 px-8">
          <button
            onClick={() => {
              if (currentMonth >= months) setCurrentMonth(0)
              setIsPlaying(!isPlaying)
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
              isPlaying 
                ? 'bg-violet-500/20 border-violet-500 text-violet-300' 
                : 'bg-white/5 border-white/30 text-white hover:bg-white/10'
            }`}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>

          <button
            onClick={() => { setCurrentMonth(0); setIsPlaying(false) }}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20 text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex-1 max-w-xl">
            <input
              type="range"
              min={0}
              max={months}
              step={0.5}
              value={currentMonth}
              onChange={(e) => setCurrentMonth(parseFloat(e.target.value))}
              className="w-full h-2 appearance-none bg-white/10 rounded-full cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-6
                         [&::-webkit-slider-thumb]:h-6
                         [&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            />
            <div className="flex justify-between mt-2 text-[10px] text-white/30 font-mono">
              <span>NOW</span>
              <span>YEAR 1</span>
              <span>YEAR 2</span>
              <span>YEAR 3</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-light text-white font-mono">
              T+{Math.floor(currentMonth)}
            </div>
            <div className="text-[10px] text-white/40">months</div>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="w-80 border-l border-white/10 bg-black/30 flex flex-col">
        {/* Path A */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-cyan-400 font-medium">{scenarioA.name}</span>
          </div>
          <div className="text-[11px] text-white/50 mb-4">{scenarioA.tagline}</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] text-white/40">SURVIVAL</div>
              <div className="text-2xl font-light text-cyan-400 font-mono">
                {(statsA.survival * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-[9px] text-white/40">MEDIAN REV</div>
              <div className="text-xl font-light text-white font-mono">
                {fmtMoney(statsA.median)}
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-[10px] text-white/30">
            Range: {fmtMoney(statsA.p10)} – {fmtMoney(statsA.p90)}
          </div>
        </div>

        {/* Path B */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-amber-400 font-medium">{scenarioB.name}</span>
          </div>
          <div className="text-[11px] text-white/50 mb-4">{scenarioB.tagline}</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] text-white/40">SURVIVAL</div>
              <div className="text-2xl font-light text-amber-400 font-mono">
                {(statsB.survival * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-[9px] text-white/40">MEDIAN REV</div>
              <div className="text-xl font-light text-white font-mono">
                {fmtMoney(statsB.median)}
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-[10px] text-white/30">
            Range: {fmtMoney(statsB.p10)} – {fmtMoney(statsB.p90)}
          </div>
        </div>

        {/* The Trade-off */}
        <div className="p-6 flex-1">
          <div className="text-[10px] text-white/40 tracking-[0.2em] mb-4">THE TRADE-OFF</div>
          
          <div className={`p-4 rounded-xl ${
            statsB.median > statsA.median ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <div className={`text-2xl font-light font-mono ${statsB.median > statsA.median ? 'text-emerald-400' : 'text-red-400'}`}>
              {statsB.median > statsA.median ? '+' : ''}{(((statsB.median / statsA.median) - 1) * 100).toFixed(0)}%
            </div>
            <div className="text-[11px] text-white/50 mt-1">
              revenue upside
            </div>
          </div>
          
          <div className="text-center my-3 text-white/30 text-sm">in exchange for</div>
          
          <div className={`p-4 rounded-xl ${
            statsB.survival < statsA.survival ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'
          }`}>
            <div className={`text-2xl font-light font-mono ${statsB.survival < statsA.survival ? 'text-red-400' : 'text-emerald-400'}`}>
              {statsB.survival < statsA.survival ? '' : '+'}{((statsB.survival - statsA.survival) * 100).toFixed(0)}%
            </div>
            <div className="text-[11px] text-white/50 mt-1">
              survival probability
            </div>
          </div>
        </div>

        {/* Toggle */}
        <div className="p-4 border-t border-white/10">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showPaths}
              onChange={(e) => setShowPaths(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-10 h-5 rounded-full transition-colors ${showPaths ? 'bg-violet-500' : 'bg-white/20'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${showPaths ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-white/60">Show all simulations</span>
          </label>
        </div>
      </div>
    </div>
  )
}

