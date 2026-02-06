// src/components/compare/ValueWaterfall.tsx
// STRATFIT — Value Bridge / Waterfall Analysis

import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

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

function fmtMoney(x: number, showSign = false) {
  const sign = showSign && x > 0 ? '+' : ''
  return `${sign}$${Math.abs(x).toFixed(2)}M`
}

interface WaterfallItem {
  name: string
  value: number
  cumulative: number
  type: 'start' | 'positive' | 'negative' | 'end'
}

export function ValueWaterfall({ baseline, exploration, timeline, setTimeline }: Props) {
  const tIndex = Math.round(timeline * 36)

  // Calculate driver contributions
  const { items, baselineValue, explorationValue, drivers } = useMemo(() => {
    const progress = timeline
    
    // Base values
    const base = 3.2 + (baseline.revenueGrowth - 1) * 3 * progress + 
                 (baseline.marketExpansion - 1) * 2 * progress -
                 baseline.operationalRisk * 0.5 * progress
    
    const explore = 3.2 + (exploration.revenueGrowth - 1) * 3 * progress +
                    (exploration.marketExpansion - 1) * 2 * progress -
                    exploration.operationalRisk * 0.5 * progress
    
    // Driver contributions to the gap
    const driverList = [
      { 
        name: 'Revenue Growth', 
        value: (exploration.revenueGrowth - baseline.revenueGrowth) * 2.2 * progress,
        icon: 'revenue'
      },
      { 
        name: 'Market Expansion', 
        value: (exploration.marketExpansion - baseline.marketExpansion) * 1.5 * progress,
        icon: 'market'
      },
      { 
        name: 'Pricing Power', 
        value: 0.35 * progress,
        icon: 'pricing'
      },
      { 
        name: 'CAC Efficiency', 
        value: -0.18 * progress,
        icon: 'cac'
      },
      { 
        name: 'Churn Reduction', 
        value: 0.12 * progress,
        icon: 'churn'
      },
      { 
        name: 'Operational Risk', 
        value: -(exploration.operationalRisk - baseline.operationalRisk) * 1.2 * progress,
        icon: 'risk'
      },
      { 
        name: 'Headcount Cost', 
        value: -0.25 * progress,
        icon: 'headcount'
      },
    ]
    
    // Build waterfall items
    const waterfallItems: WaterfallItem[] = []
    let cumulative = base
    
    waterfallItems.push({
      name: 'BASELINE',
      value: base,
      cumulative: base,
      type: 'start'
    })
    
    // Sort drivers by absolute value (largest first)
    const sortedDrivers = [...driverList].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    
    sortedDrivers.forEach(driver => {
      cumulative += driver.value
      waterfallItems.push({
        name: driver.name,
        value: driver.value,
        cumulative,
        type: driver.value >= 0 ? 'positive' : 'negative'
      })
    })
    
    waterfallItems.push({
      name: 'EXPLORATION',
      value: cumulative,
      cumulative,
      type: 'end'
    })
    
    return { 
      items: waterfallItems, 
      baselineValue: base, 
      explorationValue: cumulative,
      drivers: sortedDrivers
    }
  }, [baseline, exploration, timeline])

  const delta = explorationValue - baselineValue
  const deltaPercent = baselineValue > 0 ? ((explorationValue / baselineValue) - 1) * 100 : 0

  // Find max for scaling
  const maxValue = Math.max(...items.map(i => i.cumulative), baselineValue, explorationValue) * 1.1
  const minValue = Math.min(...items.map(i => i.cumulative), 0) * 0.9
  const range = maxValue - minValue

  const scale = (v: number) => ((v - minValue) / range) * 100

  return (
    <div className="w-full h-full flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-white text-lg font-light">Value Bridge Analysis</h2>
          <p className="text-slate-500 text-sm mt-1">What's creating the gap between scenarios at T+{tIndex}</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[9px] text-slate-500 tracking-[0.2em]">BASELINE</div>
            <div className="text-xl text-cyan-400 font-mono">{fmtMoney(baselineValue)}</div>
          </div>
          
          <ArrowRight className="w-5 h-5 text-slate-600" />
          
          <div className={`px-4 py-2 rounded-lg ${delta >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <div className={`text-2xl font-mono ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {delta >= 0 ? '+' : ''}{deltaPercent.toFixed(1)}%
            </div>
          </div>
          
          <ArrowRight className="w-5 h-5 text-slate-600" />
          
          <div className="text-right">
            <div className="text-[9px] text-slate-500 tracking-[0.2em]">EXPLORATION</div>
            <div className="text-xl text-amber-400 font-mono">{fmtMoney(explorationValue)}</div>
          </div>
        </div>
      </div>

      {/* Waterfall Chart */}
      <div className="flex-1 flex items-end gap-2 pb-16 relative">
        {/* Zero line */}
        <div 
          className="absolute left-0 right-0 border-t border-white/10"
          style={{ bottom: `${scale(baselineValue)}%` }}
        />

        {items.map((item, index) => {
          const isStart = item.type === 'start'
          const isEnd = item.type === 'end'
          const isPositive = item.type === 'positive'
          const isNegative = item.type === 'negative'
          
          // Bar positioning
          const barBottom = isStart || isEnd 
            ? scale(0)
            : scale(Math.min(item.cumulative, item.cumulative - item.value))
          
          const barHeight = isStart || isEnd
            ? scale(item.value) - scale(0)
            : Math.abs(scale(item.value) - scale(0))

          return (
            <div 
              key={item.name}
              className="flex-1 flex flex-col items-center relative group"
            >
              {/* Connector line to previous */}
              {index > 0 && !isEnd && (
                <div 
                  className="absolute left-0 w-full border-t border-dashed border-white/10 -translate-x-1/2"
                  style={{ 
                    bottom: `${scale(items[index - 1].cumulative)}%`,
                  }}
                />
              )}

              {/* Bar */}
              <div 
                className={`w-full max-w-[60px] rounded-t-sm transition-all relative ${
                  isStart ? 'bg-cyan-500/60' :
                  isEnd ? 'bg-amber-500/60' :
                  isPositive ? 'bg-emerald-500/50' : 'bg-red-500/50'
                }`}
                style={{
                  position: 'absolute',
                  bottom: `${barBottom}%`,
                  height: `${Math.max(2, barHeight)}%`,
                }}
              >
                {/* Value label */}
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-mono ${
                  isStart ? 'text-cyan-400' :
                  isEnd ? 'text-amber-400' :
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {isStart || isEnd ? fmtMoney(item.value) : fmtMoney(item.value, true)}
                </div>

                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap">
                    <div className="text-white font-medium">{item.name}</div>
                    <div className={`font-mono ${
                      isPositive ? 'text-emerald-400' : 
                      isNegative ? 'text-red-400' : 
                      isStart ? 'text-cyan-400' : 'text-amber-400'
                    }`}>
                      {fmtMoney(item.value, !isStart && !isEnd)}
                    </div>
                    {!isStart && !isEnd && (
                      <div className="text-slate-400 text-[10px] mt-1">
                        Cumulative: {fmtMoney(item.cumulative)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className={`text-[10px] font-mono text-center ${
                  isStart ? 'text-cyan-400' :
                  isEnd ? 'text-amber-400' :
                  'text-slate-500'
                }`}>
                  {item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Driver Detail Table */}
      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="text-[10px] text-slate-500 tracking-[0.2em] mb-4">DRIVER BREAKDOWN</div>
        <div className="grid grid-cols-2 gap-4">
          {drivers.map(driver => (
            <div 
              key={driver.name}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                driver.value >= 0 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {driver.value >= 0 
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                  : <TrendingDown className="w-4 h-4 text-red-400" />
                }
                <span className="text-sm text-slate-300">{driver.name}</span>
              </div>
              <span className={`font-mono text-sm ${
                driver.value >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {fmtMoney(driver.value, true)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6 pt-4 border-t border-white/5">
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
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:bg-white
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          />
          <span className="text-xl font-light text-white font-mono min-w-[60px] text-right">
            T+{tIndex}
          </span>
        </div>
      </div>
    </div>
  )
}
