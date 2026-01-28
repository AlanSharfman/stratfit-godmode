// src/components/Decision/ThreatRadarView.tsx
// STRATFIT — Threat Radar: What Could Hurt You
// Canvas-based radar visualization with threat cards

import { useRef, useEffect } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { SharedProps, Threat } from './types'

const categoryColors = {
  financial: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  operational: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  market: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  competitive: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
}

const severityColors = {
  critical: 'bg-red-500 text-white',
  high: 'bg-red-500/70 text-white',
  medium: 'bg-amber-500/70 text-white',
  low: 'bg-slate-500/70 text-white',
}

export function ThreatRadarView({ threats }: SharedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw radar chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 300
    const DPR = window.devicePixelRatio || 1
    canvas.width = size * DPR
    canvas.height = size * DPR
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    const cx = size / 2
    const cy = size / 2
    const maxR = size / 2 - 30

    // Clear
    ctx.clearRect(0, 0, size, size)

    // Draw rings
    for (let i = 1; i <= 4; i++) {
      const r = (maxR / 4) * i
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw quadrant lines
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.beginPath()
    ctx.moveTo(cx, cy - maxR)
    ctx.lineTo(cx, cy + maxR)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - maxR, cy)
    ctx.lineTo(cx + maxR, cy)
    ctx.stroke()

    // Draw quadrant labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '10px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('EXTERNAL', cx, 20)
    ctx.fillText('INTERNAL', cx, size - 10)
    ctx.textAlign = 'left'
    ctx.fillText('FINANCIAL', 10, cy)
    ctx.textAlign = 'right'
    ctx.fillText('OPERATIONAL', size - 10, cy)

    // Plot threats
    const categoryAngles: Record<string, number> = {
      market: -Math.PI / 4,
      competitive: Math.PI / 4,
      financial: Math.PI + Math.PI / 4,
      operational: Math.PI - Math.PI / 4,
    }

    // Use seeded random for consistent positions
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000
      return x - Math.floor(x)
    }

    threats.forEach((threat, i) => {
      const angle = categoryAngles[threat.category] + (seededRandom(i) - 0.5) * 0.5
      const severityR = threat.severity === 'critical' ? 0.9 :
                        threat.severity === 'high' ? 0.7 :
                        threat.severity === 'medium' ? 0.5 : 0.3
      const r = severityR * maxR

      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r

      // Draw point
      const pointR = threat.severity === 'critical' ? 10 :
                     threat.severity === 'high' ? 8 : 6

      // Glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointR * 2)
      gradient.addColorStop(0, threat.severity === 'critical' ? 'rgba(239,68,68,0.5)' :
                               threat.severity === 'high' ? 'rgba(239,68,68,0.3)' :
                               'rgba(245,158,11,0.3)')
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, pointR * 2, 0, Math.PI * 2)
      ctx.fill()

      // Point
      ctx.fillStyle = threat.severity === 'critical' ? '#ef4444' :
                      threat.severity === 'high' ? '#f87171' :
                      threat.severity === 'medium' ? '#fbbf24' : '#94a3b8'
      ctx.beginPath()
      ctx.arc(x, y, pointR, 0, Math.PI * 2)
      ctx.fill()
    })

    // Center point
    ctx.fillStyle = '#8b5cf6'
    ctx.beginPath()
    ctx.arc(cx, cy, 8, 0, Math.PI * 2)
    ctx.fill()

  }, [threats])

  const sortedThreats = [...threats].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] text-white/40 tracking-[0.3em] mb-2">THREAT RADAR</div>
          <h1 className="text-2xl text-white font-light">
            What could hurt you?
          </h1>
          <p className="text-white/50 mt-2">
            Early warning system for strategic risks
          </p>
        </div>

        <div className="flex gap-8">
          {/* Radar Visualization */}
          <div className="shrink-0">
            <div className="bg-white/2 border border-white/10 rounded-2xl p-6">
              <canvas ref={canvasRef} className="mx-auto" />
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-[10px] text-white/50">Critical/High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-[10px] text-white/50">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-500 rounded-full" />
                  <span className="text-[10px] text-white/50">Low</span>
                </div>
              </div>
            </div>
          </div>

          {/* Threat List */}
          <div className="flex-1 space-y-4">
            {sortedThreats.map((threat) => (
              <div 
                key={threat.id}
                className={`border rounded-xl p-5 ${
                  threat.severity === 'critical' ? 'bg-red-500/10 border-red-500/40' :
                  threat.severity === 'high' ? 'bg-red-500/5 border-red-500/30' :
                  threat.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                  'bg-white/2 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${
                      threat.severity === 'critical' || threat.severity === 'high' ? 'text-red-400' : 'text-amber-400'
                    }`} />
                    <div>
                      <div className="text-white font-medium">{threat.name}</div>
                      <div className={`text-[10px] mt-0.5 ${categoryColors[threat.category].text}`}>
                        {threat.category.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-1 rounded-full ${severityColors[threat.severity]}`}>
                      {threat.severity.toUpperCase()}
                    </span>
                    {threat.trend === 'worsening' && <TrendingUp className="w-4 h-4 text-red-400" />}
                    {threat.trend === 'improving' && <TrendingDown className="w-4 h-4 text-emerald-400" />}
                    {threat.trend === 'stable' && <Minus className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-[9px] text-white/40">PROBABILITY</div>
                    <div className="text-sm text-white font-mono">{threat.probability}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-white/40">TIME TO IMPACT</div>
                    <div className="text-sm text-white">{threat.timeToImpact}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-white/40">IMPACT</div>
                    <div className="text-sm text-white">{threat.impact}</div>
                  </div>
                </div>

                {threat.leadIndicator && (
                  <div className="bg-white/5 rounded-lg px-3 py-2 mb-3">
                    <div className="text-[9px] text-amber-400">⚡ LEAD INDICATOR</div>
                    <div className="text-sm text-white/70">{threat.leadIndicator}</div>
                  </div>
                )}

                <div className="pt-3 border-t border-white/10">
                  <div className="text-[9px] text-emerald-400 mb-1">RECOMMENDED MITIGATION</div>
                  <div className="text-sm text-white/70">{threat.mitigation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
