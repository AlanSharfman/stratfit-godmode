// ============================================================================
// STRATFIT G-D MODE — MASTER IMPLEMENTATION v1.0
// ============================================================================
import { useState, useMemo, useEffect, useCallback } from 'react';
import ThreeJSMountainEngine from './ThreeJSMountainEngine';

type Scenario = 'base' | 'upside' | 'downside' | 'extreme';
type TimePeriod = 'monthly' | 'quarterly' | 'yearly';

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
const StratfitGodModeDashboard = () => {
  // STATE: UI Controls
  const [activeKPIIndex, setActiveKPIIndex] = useState<number | null>(null);
  const [scenario, setScenario] = useState<Scenario>('base');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [displayedInsight, setDisplayedInsight] = useState('');

  // STATE: Basic Sliders (5 Core)
  const [revenueGrowth, setRevenueGrowth] = useState(18);
  const [operatingExpenses, setOperatingExpenses] = useState(45);
  const [hiringRate, setHiringRate] = useState(12);
  const [wageIncreases, setWageIncreases] = useState(5);
  const [burnRate, setBurnRate] = useState(120); // $K per month

  // STATE: Advanced Sliders (Pro/Elite)
  const [cogs, setCogs] = useState(35);
  const [churn, setChurn] = useState(8);
  const [priceChange, setPriceChange] = useState(0);
  const [wacc, setWacc] = useState(12);
  const [terminalGrowth, setTerminalGrowth] = useState(3);
  const [revenueMultiple, setRevenueMultiple] = useState(8);
  const [ebitdaMultiple, setEbitdaMultiple] = useState(12);
  const [marketRisk, setMarketRisk] = useState(0);
  const [costInflation, setCostInflation] = useState(3);

  // Scenario multipliers
  const scenarioMultipliers: Record<Scenario, number> = {
    base: 1.0, upside: 1.3, downside: 0.7, extreme: 1.8
  };

  // ============================================================================
  // CALCULATION ENGINE
  // ============================================================================
  const calculations = useMemo(() => {
    const mult = scenarioMultipliers[scenario];
    
    // Base metrics
    const baseRevenue = 2.5; // $2.5M base
    const monthlyBurn = burnRate * 1000; // Convert to $
    
    // Revenue calculation
    const revenue = baseRevenue * (1 + (revenueGrowth / 100)) * mult;
    
    // EBITDA calculation
    const grossMargin = (100 - cogs) / 100;
    const opexRatio = operatingExpenses / 100;
    const wageCost = (wageIncreases / 100) * 0.3; // 30% of costs are wages
    const ebitda = revenue * grossMargin * (1 - opexRatio - wageCost);
    
    // Cash calculation
    const hiringCost = (hiringRate / 100) * 50000; // $50K per hire
    const annualBurn = monthlyBurn * 12 + hiringCost;
    const cash = Math.max(0, (revenue * 1000000 * 0.4) - annualBurn); // 40% of revenue retained
    
    // Runway calculation
    const monthlyNetBurn = monthlyBurn - (ebitda * 1000000 / 12);
    const cashReserve = 2500000 + (cash * 0.5); // $2.5M + retained
    const runway = monthlyNetBurn > 0 ? Math.round(cashReserve / monthlyNetBurn) : 60;
    
    // Risk Score (0-10, lower is better)
    const runwayRisk = Math.max(0, 10 - (runway / 6));
    const burnRisk = burnRate / 50;
    const growthBenefit = revenueGrowth / 20;
    const riskScore = Math.max(1, Math.min(10, (runwayRisk + burnRisk - growthBenefit + marketRisk / 10)));
    
    // Valuation
    const revenueVal = revenue * revenueMultiple;
    const ebitdaVal = Math.max(0, ebitda) * ebitdaMultiple;
    const valuation = ((revenueVal + ebitdaVal) / 2) * mult;

    return {
      revenue: revenue,
      ebitda: ebitda,
      cash: cash,
      runway: Math.max(6, Math.min(60, runway)),
      burnRate: burnRate,
      riskScore: Math.round(riskScore * 10) / 10,
      valuation: valuation,
      revenueGrowth: revenueGrowth
    };
  }, [revenueGrowth, operatingExpenses, hiringRate, wageIncreases, burnRate, 
      cogs, churn, priceChange, wacc, terminalGrowth, revenueMultiple, 
      ebitdaMultiple, marketRisk, costInflation, scenario]);

  // ============================================================================
  // CASH SENSITIVITY ENGINE
  // ============================================================================
  const sensitivity = useMemo(() => {
    // Revenue Growth Sensitivity
    const revSensitivity = {
      cash: 18500, // $ per 1%
      runway: 0.4, // months per 1%
      ebitda: 12000
    };
    
    // OpEx Sensitivity
    const opexSensitivity = {
      cash: -15000,
      runway: -0.3,
      ebitda: -27000
    };
    
    // Hiring Sensitivity
    const hiringSensitivity = {
      cash: -8000,
      runway: -0.17,
      ebitda: -5000
    };
    
    // Wage Sensitivity
    const wageSensitivity = {
      cash: -12800, // per 1%
      runway: -0.25,
      ebitda: -18000
    };
    
    // Burn Sensitivity (per $10K)
    const burnSensitivity = {
      cash: -10000,
      runway: -0.9,
      ebitda: 0
    };

    return {
      revenueGrowth: revSensitivity,
      operatingExpenses: opexSensitivity,
      hiringRate: hiringSensitivity,
      wageIncreases: wageSensitivity,
      burnRate: burnSensitivity
    };
  }, []);

  // ============================================================================
  // AI NARRATIVE ENGINE
  // ============================================================================
  const generateAIInsight = useCallback(() => {
    const insights: string[] = [];
    
    // Sensitivity narratives
    insights.push(`Revenue Growth Impact: Each +1% improvement increases cash by approximately $${sensitivity.revenueGrowth.cash.toLocaleString()} and extends runway by ${sensitivity.revenueGrowth.runway} months.`);
    
    if (operatingExpenses > 50) {
      insights.push(`⚠️ Operating Expenses are elevated at ${operatingExpenses}%. Every +1% increase reduces EBITDA by $${Math.abs(sensitivity.operatingExpenses.ebitda).toLocaleString()} and compresses runway by ${Math.abs(sensitivity.operatingExpenses.runway)} months.`);
    }
    
    if (hiringRate > 15) {
      insights.push(`Hiring Rate is strongly correlated with cash outflow. Your current ${hiringRate}% rate reduces projected runway by ${(hiringRate * 0.17).toFixed(1)} months versus baseline.`);
    }
    
    insights.push(`Burn Rate dominates the model: each +$10,000 increase shortens runway by ${Math.abs(sensitivity.burnRate.runway)} months. Current burn: $${burnRate}K/month.`);
    
    if (calculations.riskScore > 6) {
      insights.push(`🔴 Risk Alert: Your risk score of ${calculations.riskScore}/10 indicates elevated exposure. Consider reducing burn rate or accelerating revenue growth.`);
    } else if (calculations.riskScore < 4) {
      insights.push(`✅ Strong Position: Risk score of ${calculations.riskScore}/10 indicates healthy runway and growth trajectory.`);
    }
    
    // Scenario-specific
    if (scenario === 'upside') {
      insights.push(`📈 Upside Scenario: Valuation potential reaches $${(calculations.valuation).toFixed(1)}M with current trajectory.`);
    } else if (scenario === 'downside') {
      insights.push(`📉 Downside Scenario: Conservative projections show $${(calculations.valuation).toFixed(1)}M valuation. Runway buffer recommended.`);
    }
    
    return insights.join('\n\n');
  }, [sensitivity, operatingExpenses, hiringRate, burnRate, calculations, scenario]);

  // Typewriter effect for AI panel
  useEffect(() => {
    if (showAIPanel) {
      const fullText = generateAIInsight();
      setAiTyping(true);
      setDisplayedInsight('');
      
      let index = 0;
      const timer = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedInsight(fullText.slice(0, index + 1));
          index++;
        } else {
          setAiTyping(false);
          clearInterval(timer);
        }
      }, 8);
      
      return () => clearInterval(timer);
    }
  }, [showAIPanel, generateAIInsight]);

  // ============================================================================
  // KPI DEFINITIONS
  // ============================================================================
  const kpis = [
    { 
      id: 'runway', 
      label: 'Runway', 
      value: calculations.runway, 
      unit: 'Mo',
      format: (v: number) => `${v}`,
      relatedSliders: ['burnRate', 'revenueGrowth']
    },
    { 
      id: 'cash', 
      label: 'Cash', 
      value: calculations.cash, 
      unit: '',
      format: (v: number) => `$${(v / 1000000).toFixed(1)}M`,
      relatedSliders: ['revenueGrowth', 'operatingExpenses', 'burnRate']
    },
    { 
      id: 'revenueGrowth', 
      label: 'Revenue Growth', 
      value: calculations.revenueGrowth, 
      unit: '%',
      format: (v: number) => `+${v}%`,
      highlight: true,
      relatedSliders: ['revenueGrowth']
    },
    { 
      id: 'ebitda', 
      label: 'EBITDA', 
      value: calculations.ebitda, 
      unit: '',
      format: (v: number) => v >= 0 ? `$${(v).toFixed(1)}M` : `-$${Math.abs(v).toFixed(1)}M`,
      relatedSliders: ['operatingExpenses', 'wageIncreases', 'revenueGrowth']
    },
    { 
      id: 'burnRate', 
      label: 'Burn Rate', 
      value: calculations.burnRate, 
      unit: '/mo',
      format: (v: number) => `$${v}K`,
      relatedSliders: ['burnRate', 'hiringRate']
    },
    { 
      id: 'riskScore', 
      label: 'Risk Score', 
      value: calculations.riskScore, 
      unit: '/10',
      format: (v: number) => `${v}`,
      relatedSliders: ['burnRate', 'revenueGrowth']
    },
    { 
      id: 'valuation', 
      label: 'Valuation', 
      value: calculations.valuation, 
      unit: '',
      format: (v: number) => `$${v.toFixed(0)}M`,
      relatedSliders: ['revenueGrowth', 'operatingExpenses']
    },
  ];

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleKPIClick = (index: number) => {
    if (activeKPIIndex === index) {
      setActiveKPIIndex(null);
      setShowAIPanel(false);
    } else {
      setActiveKPIIndex(index);
      setShowAIPanel(true);
    }
  };

  const handleSliderChange = (setter: (v: number) => void, value: number) => {
    setter(value);
    // Trigger AI panel refresh
    if (showAIPanel) {
      setShowAIPanel(false);
      setTimeout(() => setShowAIPanel(true), 100);
    }
  };

  // Check if slider is related to active KPI
  const isSliderHighlighted = (sliderId: string) => {
    if (activeKPIIndex === null) return false;
    return kpis[activeKPIIndex].relatedSliders.includes(sliderId);
  };

  // ============================================================================
  // TIMELINE LABELS
  // ============================================================================
  const getTimelineLabels = () => {
    switch (timePeriod) {
      case 'monthly':
        return ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      case 'quarterly':
        return ['Q1', 'Q2', 'Q3', 'Q4'];
      case 'yearly':
        return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#0a0b1a] text-white font-sans overflow-hidden">
      
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/30">
            ⚡
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">STRATFIT</span>
            <span className="text-[10px] text-slate-500 ml-2 tracking-widest">G-D MODE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Scenario Selector */}
          <div className="flex bg-slate-800/50 rounded-full p-1">
            {(['base', 'upside', 'downside', 'extreme'] as Scenario[]).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                  scenario === s 
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          
          {/* PDF Export CTA */}
          <button className="px-5 py-2.5 bg-slate-800/50 border border-teal-500/30 rounded-xl text-sm font-medium text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 backdrop-blur-sm">
            📄 Export PDF
          </button>
        </div>
      </header>

      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}
      <div className="p-6 space-y-5">
        
        {/* ================================================================ */}
        {/* ROW 1: KPI CARDS */}
        {/* ================================================================ */}
        <div className="grid grid-cols-7 gap-4">
          {kpis.map((kpi, index) => (
            <div
              key={kpi.id}
              onClick={() => handleKPIClick(index)}
              className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-300 backdrop-blur-sm overflow-hidden
                ${kpi.highlight 
                  ? 'bg-gradient-to-br from-teal-500/90 to-cyan-500/90 shadow-xl shadow-teal-500/30' 
                  : 'bg-slate-800/40 border border-slate-700/50 hover:border-teal-500/30'}
                ${activeKPIIndex === index 
                  ? 'scale-110 z-20 shadow-2xl shadow-teal-500/40 ring-2 ring-teal-400' 
                  : activeKPIIndex !== null 
                    ? 'opacity-40 scale-95' 
                    : 'hover:scale-105'}`}
              style={{ 
                transform: activeKPIIndex === index ? 'scale(1.15)' : undefined,
              }}
            >
              {/* Glow effect */}
              {activeKPIIndex === index && (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 animate-pulse" />
              )}
              
              <div className="relative z-10">
                <div className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${kpi.highlight ? 'text-white/70' : 'text-slate-400'}`}>
                  {kpi.label}
                </div>
                <div className={`text-2xl font-bold ${kpi.highlight ? 'text-white' : 'text-white'}`}>
                  {kpi.format(kpi.value)}
                  <span className={`text-sm font-normal ml-1 ${kpi.highlight ? 'text-white/60' : 'text-slate-400'}`}>
                    {kpi.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ================================================================ */}
        {/* ROW 2 & 3: MOUNTAIN + SLIDERS */}
        {/* ================================================================ */}
        <div className="grid grid-cols-[1fr_320px] gap-5">
          
          {/* MOUNTAIN ENGINE CONTAINER */}
          <div className="relative bg-gradient-to-b from-[#0d1520] to-[#0a1628] rounded-3xl overflow-hidden border border-slate-800/50 shadow-2xl">
            {/* Fog overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,184,166,0.06)] to-transparent pointer-events-none" />
            
            {/* Mountain */}
            <div className="h-[420px]">
              <ThreeJSMountainEngine 
                growth={revenueGrowth + (100 - operatingExpenses) * 0.3}
                efficiency={(100 - burnRate/2) + hiringRate * 0.2}
                activeKPIIndex={activeKPIIndex}
                scenario={scenario}
              />
            </div>
            
            {/* Timeline Labels */}
            <div className="absolute bottom-4 left-8 right-8">
              <div className="flex justify-between">
                {getTimelineLabels().map((label, i) => (
                  <div key={label} className="flex flex-col items-center">
                    <div className={`w-1.5 h-1.5 rounded-full mb-2 ${i < getTimelineLabels().length / 2 ? 'bg-teal-400' : 'bg-slate-600'}`} />
                    <span className={`text-xs font-medium ${i < getTimelineLabels().length / 2 ? 'text-teal-400' : 'text-slate-500'}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Period Toggle */}
              <div className="flex justify-center mt-4">
                <div className="flex bg-slate-900/80 rounded-full p-1 backdrop-blur-sm">
                  {(['monthly', 'quarterly', 'yearly'] as TimePeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setTimePeriod(p)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                        timePeriod === p 
                          ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SLIDER COLUMN */}
          <div className="space-y-4">
            
            {/* BASIC SLIDERS PANEL */}
            <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-white">Core Drivers</span>
                </div>
              </div>
              
              <div className="space-y-5">
                <GodModeSlider 
                  id="revenueGrowth"
                  label="Revenue Growth" 
                  value={revenueGrowth} 
                  onChange={(v) => handleSliderChange(setRevenueGrowth, v)} 
                  unit="%" 
                  min={-20} 
                  max={100}
                  highlighted={isSliderHighlighted('revenueGrowth')}
                />
                <GodModeSlider 
                  id="operatingExpenses"
                  label="Operating Expenses" 
                  value={operatingExpenses} 
                  onChange={(v) => handleSliderChange(setOperatingExpenses, v)} 
                  unit="%" 
                  min={20} 
                  max={80}
                  highlighted={isSliderHighlighted('operatingExpenses')}
                  inverse
                />
                <GodModeSlider 
                  id="hiringRate"
                  label="Hiring Rate" 
                  value={hiringRate} 
                  onChange={(v) => handleSliderChange(setHiringRate, v)} 
                  unit="%" 
                  min={0} 
                  max={50}
                  highlighted={isSliderHighlighted('hiringRate')}
                />
                <GodModeSlider 
                  id="wageIncreases"
                  label="Wage Increases" 
                  value={wageIncreases} 
                  onChange={(v) => handleSliderChange(setWageIncreases, v)} 
                  unit="%" 
                  min={0} 
                  max={20}
                  highlighted={isSliderHighlighted('wageIncreases')}
                  inverse
                />
                <GodModeSlider 
                  id="burnRate"
                  label="Burn Rate" 
                  value={burnRate} 
                  onChange={(v) => handleSliderChange(setBurnRate, v)} 
                  unit="K/mo" 
                  prefix="$"
                  min={50} 
                  max={300}
                  highlighted={isSliderHighlighted('burnRate')}
                  inverse
                />
              </div>
            </div>

            {/* ADVANCED TOGGLE */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-300 border ${
                showAdvanced 
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-400' 
                  : 'bg-slate-800/30 border-slate-700/30 text-slate-400 hover:border-teal-500/30 hover:text-teal-400'
              }`}
            >
              {showAdvanced ? '▼ Hide Advanced' : '▶ Advanced Mode (Pro)'}
            </button>

            {/* ADVANCED SLIDERS PANEL */}
            {showAdvanced && (
              <div className="bg-slate-800/30 rounded-2xl p-5 border border-teal-500/20 backdrop-blur-sm animate-slideDown">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-1 rounded-full">PRO</span>
                  <span className="text-sm font-bold text-white">Advanced Levers</span>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  <GodModeSlider label="COGS" value={cogs} onChange={setCogs} unit="%" min={10} max={70} />
                  <GodModeSlider label="Customer Churn" value={churn} onChange={setChurn} unit="%" min={0} max={30} inverse />
                  <GodModeSlider label="Price Change" value={priceChange} onChange={setPriceChange} unit="%" min={-20} max={20} />
                  <GodModeSlider label="WACC" value={wacc} onChange={setWacc} unit="%" min={5} max={25} inverse />
                  <GodModeSlider label="Terminal Growth" value={terminalGrowth} onChange={setTerminalGrowth} unit="%" min={0} max={10} />
                  <GodModeSlider label="Revenue Multiple" value={revenueMultiple} onChange={setRevenueMultiple} unit="x" min={2} max={20} />
                  <GodModeSlider label="EBITDA Multiple" value={ebitdaMultiple} onChange={setEbitdaMultiple} unit="x" min={4} max={25} />
                  <GodModeSlider label="Market Risk Shock" value={marketRisk} onChange={setMarketRisk} unit="%" min={0} max={30} inverse />
                  <GodModeSlider label="Cost Inflation" value={costInflation} onChange={setCostInflation} unit="%" min={0} max={15} inverse />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* ROW 4: AI INSIGHT PANEL */}
        {/* ================================================================ */}
        {showAIPanel && (
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-teal-500/20 backdrop-blur-sm animate-slideUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <span className="text-sm font-bold text-white">AI Intelligence</span>
                <span className="text-xs text-slate-400 ml-2">Cash Sensitivity Analysis</span>
              </div>
              {aiTyping && (
                <div className="flex gap-1 ml-2">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <button 
                onClick={() => setShowAIPanel(false)}
                className="ml-auto text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono">
              {displayedInsight}
              {aiTyping && <span className="animate-pulse">▊</span>}
            </div>
          </div>
        )}

      </div>

      {/* GLOBAL STYLES */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 500px; }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// ============================================================================
// SLIDER COMPONENT — CINEMATIC STYLE
// ============================================================================
interface SliderProps {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  prefix?: string;
  min?: number;
  max?: number;
  highlighted?: boolean;
  inverse?: boolean; // If true, lower is better
}

function GodModeSlider({ 
  label, value, onChange, unit, prefix = '', min = 0, max = 100, highlighted = false, inverse = false 
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={`transition-all duration-300 ${highlighted ? 'scale-105' : ''}`}>
      <div className="flex justify-between mb-2">
        <span className={`text-xs transition-colors duration-300 ${highlighted ? 'text-teal-400 font-semibold' : 'text-slate-400'}`}>
          {label}
        </span>
        <span className={`text-xs font-bold transition-colors duration-300 ${highlighted ? 'text-teal-400' : 'text-white'}`}>
          {prefix}{value}{unit}
        </span>
      </div>
      <div className={`relative h-2 rounded-full transition-all duration-300 ${highlighted ? 'bg-teal-900/50 shadow-lg shadow-teal-500/30' : 'bg-slate-700/50'}`}>
        <div 
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
            highlighted 
              ? 'bg-gradient-to-r from-teal-400 to-cyan-400 shadow-lg shadow-teal-500/50' 
              : inverse 
                ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                : 'bg-gradient-to-r from-teal-500 to-cyan-500'
          }`}
          style={{ width: `${percent}%` }} 
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg pointer-events-none transition-all duration-300 ${
            highlighted 
              ? 'bg-teal-400 shadow-teal-400/50 scale-125' 
              : 'bg-white shadow-black/20'
          }`}
          style={{ left: `calc(${percent}% - 8px)` }}
        />
      </div>
    </div>
  );
}

export default StratfitGodModeDashboard;