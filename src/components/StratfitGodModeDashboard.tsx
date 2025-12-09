// ============================================================================
// StratfitGodModeDashboard.tsx - DARK MODE GOD MODE
// ============================================================================
import { useState, useMemo } from 'react';
import ThreeJSMountainEngine from './ThreeJSMountainEngine';

type Scenario = 'base' | 'upside' | 'downside' | 'extreme';

const StratfitGodModeDashboard = () => {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [scenario, setScenario] = useState<Scenario>('upside');
  
  // PERFORMANCE SLIDERS
  const [revenueGrowth, setRevenueGrowth] = useState<number>(60);
  const [cogsReduction, setCogsReduction] = useState<number>(30);
  const [opEfficiency, setOpEfficiency] = useState<number>(50);
  
  // PEOPLE SLIDERS
  const [headcount, setHeadcount] = useState<number>(40);
  const [regions, setRegions] = useState<number>(3);
  const [cashBuffer, setCashBuffer] = useState<number>(45);
  
  // FINANCIAL SLIDERS
  const [costReduction, setCostReduction] = useState<number>(32);
  const [capex, setCapex] = useState<number>(58);
  const [burnEfficiency, setBurnEfficiency] = useState<number>(12);

  // Scenario multipliers
  const scenarioMultipliers = {
    base: 1.0,
    upside: 1.3,
    downside: 0.7,
    extreme: 1.8,
  };

  // =========================================================================
  // CALCULATION ENGINE
  // =========================================================================
  const calculations = useMemo(() => {
    const mult = scenarioMultipliers[scenario];
    const baseRevenue = 2.0;
    const baseBurn = 200;
    
    const revenue = baseRevenue * (1 + (revenueGrowth / 100) * 1.5) * mult;
    const revGrowthPercent = Math.round((revenueGrowth + (opEfficiency * 0.2)) * mult);
    
    const grossMargin = 0.4 + (cogsReduction / 100) * 0.3;
    const operatingCosts = (100 - costReduction) / 100;
    const ebitda = revenue * grossMargin * (1 - operatingCosts * 0.5);
    
    const headcountCost = headcount * 2;
    const capexCost = capex * 0.5;
    const efficiencyMultiplier = 1 - (burnEfficiency / 100);
    const burnRate = (baseBurn + headcountCost + capexCost) * efficiencyMultiplier;
    
    const cashInBank = cashBuffer * 1000;
    const runwayMonths = Math.round(cashInBank / burnRate);
    
    const runwayRisk = Math.min(runwayMonths / 24, 1) * 30;
    const growthRisk = (revenueGrowth / 100) * 25;
    const efficiencyRisk = (opEfficiency / 100) * 25;
    const bufferRisk = (cashBuffer / 100) * 20;
    const riskScore = Math.round(runwayRisk + growthRisk + efficiencyRisk + bufferRisk);
    
    const revenueMultiple = 3 + (revenueGrowth / 100) * 8 + (ebitda > 0 ? 2 : 0);
    const valuation = revenue * revenueMultiple * mult;
    
    return {
      runway: Math.max(6, Math.min(60, runwayMonths)),
      revenue,
      revGrowth: revGrowthPercent,
      ebitda,
      burnRate,
      riskScore: Math.max(20, Math.min(99, riskScore)),
      valuation,
    };
  }, [revenueGrowth, cogsReduction, opEfficiency, headcount, cashBuffer, costReduction, capex, burnEfficiency, scenario]);

  // AI Insights based on calculations
  const aiInsights = useMemo(() => {
    const insights = [];
    if (calculations.revGrowth > 50) {
      insights.push({ type: 'positive', text: `Revenue growth accelerates by ${calculations.revGrowth}% in ${scenario} scenario, exceeding targets.` });
    }
    if (calculations.ebitda > 0) {
      insights.push({ type: 'positive', text: 'AI predicts sustained growth due to market expansion and product adoption.' });
    }
    if (calculations.burnRate > 250) {
      insights.push({ type: 'warning', text: 'Burn rate elevated. Consider efficiency improvements to extend runway.' });
    }
    if (calculations.runway < 18) {
      insights.push({ type: 'warning', text: `Runway at ${calculations.runway} months. Fundraising recommended within 6 months.` });
    }
    if (calculations.riskScore > 70) {
      insights.push({ type: 'positive', text: 'Risk profile healthy. Capital efficiency improves outlook.' });
    }
    return insights.slice(0, 3);
  }, [calculations, scenario]);

  const formatMoney = (val: number, decimals = 1) => {
    if (val >= 1) return `$${val.toFixed(decimals)}M`;
    return `$${(val * 1000).toFixed(0)}K`;
  };
  
  const formatBurn = (val: number) => `$${Math.round(val)}K`;

  const kpis = [
    { label: 'Runway', value: `${calculations.runway}`, unit: 'Mo', color: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/50' },
    { label: 'Cash', value: formatMoney(calculations.revenue * 0.8), unit: '', color: 'from-blue-500 to-cyan-500', glow: 'shadow-cyan-500/50' },
    { label: 'Revenue Growth', value: `+${calculations.revGrowth}%`, unit: '', color: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/50', highlight: true },
    { label: 'EBITDA', value: formatMoney(calculations.ebitda), unit: '', color: 'from-teal-400 to-cyan-500', glow: 'shadow-teal-500/50' },
    { label: 'Burn Rate', value: formatBurn(calculations.burnRate), unit: '', color: 'from-orange-500 to-red-500', glow: 'shadow-orange-500/50' },
    { label: 'Risk Score', value: `${calculations.riskScore}/100`, unit: '', color: 'from-pink-500 to-rose-500', glow: 'shadow-pink-500/50' },
    { label: 'Enterprise Value', value: formatMoney(calculations.valuation, 0), unit: '', color: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/50' },
  ];

  const mountainGrowth = (revenueGrowth * 0.4) + (opEfficiency * 0.3) + ((100 - (calculations.burnRate / 4)) * 0.3);
  const mountainEfficiency = (opEfficiency * 0.4) + (burnEfficiency * 3) + (cogsReduction * 0.2);

  const handleKpiClick = (index: number) => {
    setActiveCardIndex(index);
    setTimeout(() => setActiveCardIndex(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0b1a] text-white font-sans">
      <div className="max-w-[1900px] mx-auto p-5">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/30">⚡</div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">STRATFIT</span>
              <span className="text-[10px] text-slate-500 ml-2 tracking-widest">INTELLIGENCE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              AI Insights
            </button>
            <button className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-700/50 transition-all">
              Export
            </button>
          </div>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-7 gap-3 mb-5">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              onClick={() => handleKpiClick(index)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-300 overflow-hidden
                ${kpi.highlight 
                  ? `bg-gradient-to-br ${kpi.color} shadow-lg ${kpi.glow}` 
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'}
                ${activeCardIndex === index ? `ring-2 ring-white/50 scale-105 shadow-xl ${kpi.glow}` : 'hover:scale-102'}`}
            >
              {/* Glow effect on active */}
              {activeCardIndex === index && (
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-20 animate-pulse`}></div>
              )}
              <div className="relative z-10">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</div>
                <div className="text-2xl font-bold">
                  {kpi.value}
                  <span className="text-sm font-normal text-slate-400 ml-1">{kpi.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-[1fr_300px] gap-5">
          
          {/* LEFT: VISUALIZATION */}
          <div className="space-y-4">
            
            {/* SCENARIO SELECTOR */}
            <div className="flex items-center justify-center gap-2 bg-slate-800/30 rounded-full p-1 w-fit mx-auto">
              {(['base', 'upside', 'downside', 'extreme'] as Scenario[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setScenario(s)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    scenario === s 
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* 3D MOUNTAIN */}
            <div className="relative bg-gradient-to-b from-[#12132a] to-[#0a0b1a] rounded-3xl overflow-hidden h-[420px] border border-slate-800/50">
              <ThreeJSMountainEngine 
                growth={mountainGrowth} 
                efficiency={mountainEfficiency}
                activeKPIIndex={activeCardIndex}
                scenario={scenario}
              />
              
              {/* Quarter Timeline */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex justify-center gap-16">
                  {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
                    <div key={q} className="flex flex-col items-center">
                      <div className={`w-1 h-1 rounded-full mb-2 ${i < 2 ? 'bg-violet-500' : 'bg-slate-600'}`}></div>
                      <span className={`text-sm font-medium ${i < 2 ? 'text-white' : 'text-slate-500'}`}>{q}</span>
                    </div>
                  ))}
                </div>
                
                {/* Period Toggle */}
                <div className="flex justify-center mt-4">
                  <div className="flex bg-slate-800/50 rounded-full p-1">
                    <button className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-all">Monthly</button>
                    <button className="px-4 py-1.5 text-xs bg-slate-700 text-white rounded-full">Quarterly</button>
                    <button className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-all">Yearly</button>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTROL PANELS - HORIZONTAL */}
            <div className="grid grid-cols-3 gap-4">
              
              {/* PERFORMANCE */}
              <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/30">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Performance Panel</div>
                <div className="space-y-4">
                  <SliderDark label="Revenue Growth (%)" value={revenueGrowth} onChange={setRevenueGrowth} color="teal" />
                  <SliderDark label="COGS Reduction (%)" value={cogsReduction} onChange={setCogsReduction} color="teal" />
                  <SliderDark label="Operational Efficiency Gain (%)" value={opEfficiency} onChange={setOpEfficiency} color="teal" />
                </div>
              </div>

              {/* FINANCIAL */}
              <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/30">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Financial Panel</div>
                <div className="space-y-4">
                  <SliderDark label="OPEX %" value={costReduction} onChange={setCostReduction} color="violet" />
                  <SliderDark label="CAPEX ($)" value={capex} onChange={setCapex} color="violet" />
                  <SliderDark label="Burn Rate %" value={burnEfficiency} onChange={setBurnEfficiency} max={25} color="violet" />
                </div>
              </div>

              {/* PEOPLE */}
              <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/30">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">People Panel</div>
                <div className="space-y-4">
                  <SliderDark label="Headcount" value={headcount} onChange={setHeadcount} color="pink" />
                  <SliderDark label="Local changes" value={regions} onChange={setRegions} min={1} max={10} color="pink" />
                  <SliderDark label="Cash Buffer" value={cashBuffer} onChange={setCashBuffer} color="pink" />
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: AI INSIGHTS */}
          <div className="space-y-4">
            
            {/* AI INSIGHTS CARD */}
            <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">AI Insights</span>
              </div>
              
              <div className="space-y-4">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="text-sm text-slate-300 leading-relaxed">
                    <p>{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI DEEPER ANALYSIS */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-5 border border-slate-700/30">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Deeper Analysis</div>
              <p className="text-sm text-slate-300 leading-relaxed">
                AI predicts sustained growth due to market expansion and product adoption. Capital efficiency improves...
              </p>
              <button className="mt-4 text-xs text-violet-400 hover:text-violet-300 font-medium">
                View Full Analysis →
              </button>
            </div>

            {/* SCENARIO SUMMARY */}
            <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Scenario: {scenario}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500">Valuation</div>
                  <div className="text-lg font-bold text-emerald-400">{formatMoney(calculations.valuation, 0)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Runway</div>
                  <div className="text-lg font-bold">{calculations.runway} mo</div>
                </div>
                <div>
                  <div className="text-slate-500">Growth</div>
                  <div className="text-lg font-bold text-teal-400">+{calculations.revGrowth}%</div>
                </div>
                <div>
                  <div className="text-slate-500">Risk</div>
                  <div className="text-lg font-bold">{calculations.riskScore}/100</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// DARK SLIDER COMPONENT
// ============================================================================
interface SliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  color: 'teal' | 'violet' | 'pink';
}

function SliderDark({ label, value, onChange, min = 0, max = 100, color }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  
  const colors = {
    teal: 'bg-teal-500',
    violet: 'bg-violet-500',
    pink: 'bg-pink-500',
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-bold text-white">{value}%</span>
      </div>
      <div className="relative h-1.5 bg-slate-700 rounded-full">
        <div 
          className={`absolute left-0 top-0 h-full rounded-full ${colors[color]}`} 
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
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none"
          style={{ left: `calc(${percent}% - 6px)` }}
        />
      </div>
    </div>
  );
}

export default StratfitGodModeDashboard;