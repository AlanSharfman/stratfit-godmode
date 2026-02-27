// src/components/Decision/CommandCenter.tsx
// STRATFIT — Command Center: Strategic Overview Dashboard
// Premium Executive View

import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react'
import type { SharedProps } from './types'

function fmtMoney(x: number) {
  if (x >= 1000000) return `$${(x / 1000000).toFixed(1)}M`
  if (x >= 1000) return `$${(x / 1000).toFixed(0)}K`
  return `$${x}`
}

export function CommandCenter({
  companyState,
  threats,
  opportunities,
  actions,
  healthScore,
}: SharedProps) {
  const criticalThreats = threats.filter(t => t.severity === 'critical' || t.severity === 'high')
  const topActions = actions
    .filter(a => a.urgency === 'now' || a.urgency === 'this-week')
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
  
  const topOpportunities = opportunities
    .sort((a, b) => b.potential * b.confidence - a.potential * a.confidence)
    .slice(0, 2)

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* HERO: Strategic Health */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[10px] text-white/40 tracking-[0.3em] mb-2">STRATEGIC COMMAND CENTER</div>
              <h1 className="text-3xl text-white font-light">
                Good morning. Here's what matters.
              </h1>
              <p className="text-white/50 mt-2">
                Last updated 2 hours ago • AI confidence: 87%
              </p>
            </div>
            
            {/* Health Score */}
            <div className="text-right">
              <div className="text-[10px] text-white/40 tracking-[0.2em] mb-2">STRATEGIC HEALTH</div>
              <div className={`text-6xl font-light font-mono ${
                healthScore >= 70 ? 'text-emerald-400' :
                healthScore >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {healthScore}
              </div>
              <div className="text-white/40 text-sm">out of 100</div>
            </div>
          </div>

          {/* Health Bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                healthScore >= 70 ? 'bg-emerald-500' :
                healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30">
            <span>CRITICAL</span>
            <span>STRESSED</span>
            <span>HEALTHY</span>
            <span>OPTIMAL</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* KEY METRICS ROW */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white/2 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-white/40 tracking-wide">RUNWAY</span>
            </div>
            <div className="text-2xl font-light text-emerald-400 font-mono">{companyState.runway} mo</div>
            <div className="text-[11px] text-white/40 mt-1">Strong position</div>
          </div>

          <div className="bg-white/2 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] text-white/40 tracking-wide">GROWTH</span>
            </div>
            <div className="text-2xl font-light text-cyan-400 font-mono">+{companyState.growthRate}%</div>
            <div className="text-[11px] text-white/40 mt-1">MoM • On target</div>
          </div>

          <div className="bg-white/2 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-[10px] text-white/40 tracking-wide">CHURN</span>
            </div>
            <div className="text-2xl font-light text-red-400 font-mono">{companyState.churnRate}%</div>
            <div className="text-[11px] text-red-400/60 mt-1">⚠ Above target</div>
          </div>

          <div className="bg-white/2 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-white/40 tracking-wide">LTV:CAC</span>
            </div>
            <div className="text-2xl font-light text-amber-400 font-mono">
              {(companyState.ltv / companyState.cac).toFixed(1)}x
            </div>
            <div className="text-[11px] text-white/40 mt-1">Acceptable</div>
          </div>

          <div className="bg-white/2 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] text-white/40 tracking-wide">ARR</span>
            </div>
            <div className="text-2xl font-light text-violet-400 font-mono">{fmtMoney(companyState.arr)}</div>
            <div className="text-[11px] text-white/40 mt-1">Seed stage</div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* THREE COLUMN LAYOUT */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-6">
          {/* TOP ACTIONS */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg text-white font-light">Top 3 Actions</h2>
            </div>
            
            <div className="space-y-3">
              {topActions.map((action, i) => (
                <div 
                  key={action.id}
                  className={`border rounded-xl p-4 ${
                    action.urgency === 'now' 
                      ? 'bg-red-500/5 border-red-500/30' 
                      : 'bg-amber-500/5 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-mono ${
                      action.urgency === 'now' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{action.title}</div>
                      <div className={`text-[10px] mt-1 ${
                        action.urgency === 'now' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {action.urgency === 'now' ? 'CRITICAL' : 'THIS WEEK'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-3 border border-violet-500/30 rounded-xl text-violet-400 text-sm hover:bg-violet-500/10 transition-colors flex items-center justify-center gap-2">
              View All Actions <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ACTIVE THREATS */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg text-white font-light">Active Threats</h2>
              {criticalThreats.length > 0 && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full">
                  {criticalThreats.length} HIGH
                </span>
              )}
            </div>

            <div className="space-y-3">
              {threats.slice(0, 3).map((threat) => (
                <div 
                  key={threat.id}
                  className={`border rounded-xl p-4 ${
                    threat.severity === 'critical' ? 'bg-red-500/10 border-red-500/40' :
                    threat.severity === 'high' ? 'bg-red-500/5 border-red-500/30' :
                    'bg-amber-500/5 border-amber-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-white text-sm">{threat.name}</div>
                    <div className={`text-[9px] px-2 py-0.5 rounded-full ${
                      threat.severity === 'critical' ? 'bg-red-500/30 text-red-300' :
                      threat.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {threat.severity.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-3 border border-red-500/30 rounded-xl text-red-400 text-sm hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
              View Threat Radar <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* TOP OPPORTUNITIES */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg text-white font-light">Top Opportunities</h2>
            </div>

            <div className="space-y-3">
              {topOpportunities.map((opp) => (
                <div 
                  key={opp.id}
                  className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4"
                >
                  <div className="text-white text-sm font-medium">{opp.name}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="text-emerald-400 font-mono text-lg">
                      +{fmtMoney(opp.potential)}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {opp.confidence}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-3 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2">
              View All Opportunities <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* AI INSIGHT SUMMARY */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="mt-8 bg-linear-to-r from-violet-500/10 to-transparent border border-violet-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="text-[10px] text-violet-400 tracking-[0.2em] mb-2">AI STRATEGIC ASSESSMENT</div>
              <p className="text-white/80 leading-relaxed">
                Your runway of <span className="text-emerald-400">{companyState.runway} months</span> gives you exceptional strategic flexibility, 
                but <span className="text-red-400">churn at {companyState.churnRate}%</span> is your most pressing issue — it's eroding 18% of new revenue gains. 
                <span className="text-white"> Fix churn first</span>, then you're well-positioned for the <span className="text-emerald-400">pricing opportunity</span> that could add $480K ARR. 
                Your competitive position is stable but <span className="text-amber-400">Competitor X's recent funding</span> warrants attention.
              </p>
              <div className="flex gap-4 mt-4">
                <button className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-300 text-sm hover:bg-violet-500/30 transition-colors">
                  Dive Deeper
                </button>
                <button className="px-4 py-2 text-white/50 text-sm hover:text-white/80 transition-colors">
                  Challenge This Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
