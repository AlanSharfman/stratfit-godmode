// ============================================================================
// STRATFIT DASHBOARD — Main Orchestrator
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, DollarSign, TrendingUp, TrendingDown, BarChart3, Shield, Download } from 'lucide-react';
import * as THREE from 'three';

// Components
import NeonSplineMountain from './NeonSplineMountain.js';
import SynchronizedTimeline from './SynchronizedTimeline.js';
import ScenarioDock from './ScenarioDock.js';
import KPICardRow from './KPICardRow.js';
import SliderPanel from './SliderPanel.js';
import AIInsightsPanel from './AIInsightsPanel.js';

// Hooks
import { useSplineData, type TimePeriod } from '../hooks/useSplineData';
import type { Scenario } from '../hooks/useScenarioColors';
import type { KPIData } from './KPICard';

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export default function StratfitDashboard() {
  // Core State
  const [activeKPI, setActiveKPI] = useState<number | null>(null);
  const [scenario, setScenario] = useState<Scenario>('base');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');

  // Slider State
  const [revGrowth, setRevGrowth] = useState(18);
  const [opex, setOpex] = useState(45);
  const [hiring, setHiring] = useState(12);
  const [wage, setWage] = useState(5);
  const [burn, setBurn] = useState(120);
  const [cogs, setCogs] = useState(35);
  const [churn, setChurn] = useState(8);
  const [price, setPrice] = useState(0);
  const [wacc, setWacc] = useState(12);
  const [termGrowth, setTermGrowth] = useState(3);
  const [revMult, setRevMult] = useState(8);
  const [ebitdaMult, setEbitdaMult] = useState(12);

  // Spline Data
  const { dataPoints, labels } = useSplineData({
    timePeriod,
    scenario,
    revenueGrowth: revGrowth,
    opex,
    burnRate: burn,
    hiringRate: hiring,
    wageInflation: wage,
  });

  // Calculations
  const calc = useMemo(() => {
    const mult = { base: 1, upside: 1.35, downside: 0.7, extreme: 1.8 }[scenario];
    const rev = 2.5 * (1 + revGrowth / 100) * mult;
    const margin = (100 - cogs) / 100;
    const ebitda = rev * margin - rev * (opex / 100) * 0.4;
    const cash = 2500 + rev * 400;
    const runway = burn > 0 ? Math.round(cash / burn) : 60;
    const risk = Math.max(1, Math.min(10, 5 + burn / 50 + churn / 10 - revGrowth / 30));
    const val = ((rev * revMult + Math.max(0, ebitda) * ebitdaMult) / 2) * mult;
    return { rev, ebitda, cash, runway, risk, val, burn };
  }, [revGrowth, opex, burn, cogs, churn, scenario, revMult, ebitdaMult]);

  // KPIs
  const kpis: KPIData[] = useMemo(
    () => [
      { id: 'runway', label: 'Runway', value: calc.runway, format: (v) => `${Math.min(60, v)}`, unit: 'Mo', icon: <Zap className="w-3.5 h-3.5" />, relatedSliders: ['burnRate', 'revenueGrowth'], trend: calc.runway > 24 ? 'up' : calc.runway > 12 ? 'neutral' : 'down' },
      { id: 'cash', label: 'Cash', value: calc.cash, format: (v) => `$${(v / 1000).toFixed(1)}M`, unit: '', icon: <DollarSign className="w-3.5 h-3.5" />, relatedSliders: ['revenueGrowth', 'burnRate'], trend: 'up' },
      { id: 'growth', label: 'Growth', value: revGrowth, format: (v) => `+${v}`, unit: '%', icon: <TrendingUp className="w-3.5 h-3.5" />, relatedSliders: ['revenueGrowth'], trend: revGrowth > 15 ? 'up' : 'neutral' },
      { id: 'ebitda', label: 'EBITDA', value: calc.ebitda, format: (v) => `$${v.toFixed(1)}M`, unit: '', icon: <BarChart3 className="w-3.5 h-3.5" />, relatedSliders: ['opex', 'wageInflation'], trend: calc.ebitda > 0 ? 'up' : 'down' },
      { id: 'burn', label: 'Burn', value: calc.burn, format: (v) => `$${v}K`, unit: '/mo', icon: <TrendingDown className="w-3.5 h-3.5" />, relatedSliders: ['burnRate', 'hiringRate'], trend: burn < 100 ? 'up' : burn < 150 ? 'neutral' : 'down' },
      { id: 'risk', label: 'Risk', value: calc.risk, format: (v) => v.toFixed(1), unit: '/10', icon: <Shield className="w-3.5 h-3.5" />, relatedSliders: ['burnRate', 'revenueGrowth'], trend: calc.risk < 5 ? 'up' : calc.risk < 7 ? 'neutral' : 'down' },
      { id: 'val', label: 'Value', value: calc.val, format: (v) => `$${v.toFixed(0)}M`, unit: '', icon: <DollarSign className="w-3.5 h-3.5" />, relatedSliders: ['revenueGrowth', 'opex'], trend: 'up' },
    ],
    [calc, revGrowth, burn]
  );

  // Highlighted Sliders
  const highlightedSliders = useMemo(
    () => (activeKPI !== null ? kpis[activeKPI].relatedSliders : []),
    [activeKPI, kpis]
  );

  // AI Insights
  const insights = useMemo(() => {
    const lines = [];
    const kpi = activeKPI !== null ? kpis[activeKPI] : null;

    lines.push(`📊 ${scenario.toUpperCase()} SCENARIO`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (kpi) {
      lines.push(`🎯 FOCUS: ${kpi.label.toUpperCase()}`);
      lines.push(`Current: ${kpi.format(kpi.value)}${kpi.unit}`);
      lines.push(`Status: ${kpi.trend === 'up' ? '✅ Healthy' : kpi.trend === 'down' ? '⚠️ Monitor' : '➖ Stable'}\n`);
    }

    lines.push(`💰 CASH SENSITIVITY:`);
    lines.push(`• Revenue +1% → +$18.5K cash`);
    lines.push(`• OpEx +1% → -$27K EBITDA`);
    lines.push(`• Burn +$10K → -0.9mo runway\n`);

    if (calc.risk > 6) {
      lines.push(`🔴 ALERT: Risk ${calc.risk.toFixed(1)}/10`);
      lines.push(`Reduce burn or accelerate growth.\n`);
    } else {
      lines.push(`✅ HEALTHY: Risk ${calc.risk.toFixed(1)}/10`);
      lines.push(`${calc.runway}mo runway is solid.\n`);
    }

    lines.push(`📈 VALUATION: $${calc.val.toFixed(0)}M`);
    return lines.join('\n');
  }, [scenario, activeKPI, kpis, calc]);

  // Slider Definitions
  const sliders = useMemo(
    () => ({
      basic: [
        { id: 'revenueGrowth', label: 'Revenue Growth', value: revGrowth, onChange: setRevGrowth, min: -20, max: 100 },
        { id: 'opex', label: 'Operating Expenses', value: opex, onChange: setOpex, min: 20, max: 80, inverse: true },
        { id: 'hiringRate', label: 'Hiring Rate', value: hiring, onChange: setHiring, min: 0, max: 50 },
        { id: 'wageInflation', label: 'Wage Inflation', value: wage, onChange: setWage, min: 0, max: 20, inverse: true },
        { id: 'burnRate', label: 'Burn Rate', value: burn, onChange: setBurn, min: 50, max: 300, unit: 'K', prefix: '$', inverse: true },
      ],
      advanced: [
        { id: 'cogs', label: 'COGS', value: cogs, onChange: setCogs, min: 10, max: 70 },
        { id: 'churn', label: 'Churn', value: churn, onChange: setChurn, min: 0, max: 30, inverse: true },
        { id: 'priceChange', label: 'Price Change', value: price, onChange: setPrice, min: -20, max: 20 },
        { id: 'wacc', label: 'WACC', value: wacc, onChange: setWacc, min: 5, max: 25, inverse: true },
        { id: 'terminalGrowth', label: 'Terminal Growth', value: termGrowth, onChange: setTermGrowth, min: 0, max: 10 },
        { id: 'revMultiple', label: 'Rev Multiple', value: revMult, onChange: setRevMult, min: 2, max: 20, unit: 'x' },
        { id: 'ebitdaMultiple', label: 'EBITDA Multiple', value: ebitdaMult, onChange: setEbitdaMult, min: 4, max: 25, unit: 'x' },
      ],
    }),
    [revGrowth, opex, hiring, wage, burn, cogs, churn, price, wacc, termGrowth, revMult, ebitdaMult]
  );

  // Point update handler
  const handlePointsUpdate = useCallback((_points: THREE.Vector3[]) => {
    // Points are handled internally by NeonSplineMountain
  }, []);

  return (
    <div className="min-h-screen text-white font-sans" style={{ background: '#020617' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[#0d4f4f]/30">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#0d4f4f] to-[#14b8a6]"
            animate={{
              boxShadow: [
                '0 0 20px rgba(94,234,212,0.3)',
                '0 0 35px rgba(94,234,212,0.5)',
                '0 0 20px rgba(94,234,212,0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap className="w-5 h-5 text-[#5eead4]" />
          </motion.div>
          <div>
            <div className="text-lg font-bold">
              STRATFIT <span className="text-[#5eead4] text-[10px] tracking-[0.25em] ml-2">G-D MODE</span>
            </div>
            <div className="text-[9px] text-[#64748b]">Scenario Intelligence Platform</div>
          </div>
        </div>
        <motion.button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
          style={{
            background: 'rgba(10,22,40,0.9)',
            border: '1px solid rgba(94,234,212,0.3)',
            color: '#5eead4',
          }}
          whileHover={{ boxShadow: '0 0 25px rgba(94,234,212,0.3)' }}
        >
          <Download className="w-3.5 h-3.5" /> Export
        </motion.button>
      </header>

      <div className="p-4 space-y-4">
        {/* KPIs */}
        <KPICardRow kpis={kpis} activeKPI={activeKPI} onKPIClick={setActiveKPI} />

        {/* Scenario Dock */}
        <ScenarioDock scenario={scenario} onChange={setScenario} />

        {/* Main Grid */}
        <div className="grid grid-cols-[1fr_280px] gap-4">
          {/* Mountain Container */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: '#0a1628',
              border: '1px solid rgba(94,234,212,0.15)',
              height: '360px',
            }}
          >
            <NeonSplineMountain
              dataPoints={dataPoints}
              scenario={scenario}
              activeKPIIndex={activeKPI}
              onPointsUpdate={handlePointsUpdate}
            />

            {/* Timeline */}
            <SynchronizedTimeline labels={labels} scenario={scenario} activeIndex={activeKPI} />

            {/* Period Toggle */}
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex rounded-full p-1"
              style={{
                background: 'rgba(10,22,40,0.95)',
                border: '1px solid rgba(94,234,212,0.2)',
              }}
            >
              {(['monthly', 'quarterly', 'yearly'] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase ${
                    timePeriod === p
                      ? 'bg-gradient-to-r from-[#22d3d3] to-[#5eead4] text-[#020617]'
                      : 'text-[#64748b]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI Panel */}
          <AIInsightsPanel
            insights={insights}
            activeKPI={activeKPI !== null ? kpis[activeKPI].label : null}
          />
        </div>

        {/* Sliders */}
        <SliderPanel sliders={sliders} highlightedSliders={highlightedSliders} />
      </div>
    </div>
  );
}