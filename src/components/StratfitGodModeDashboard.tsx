// ============================================================================
// StratfitGodModeDashboard.tsx - Full Calculation Engine
// ============================================================================
import { useState, useMemo } from 'react';
import ThreeJSMountainEngine from './ThreeJSMountainEngine';

const StratfitGodModeDashboard = () => {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  
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

  // =========================================================================
  // CALCULATION ENGINE - KPIs derived from sliders
  // =========================================================================
  const calculations = useMemo(() => {
    // Base values
    const baseRevenue = 2.0; // $2M base
    const baseBurn = 200; // $200K base monthly burn
    
    
    // REVENUE: Grows with revenue growth slider
    const revenue = baseRevenue * (1 + (revenueGrowth / 100) * 1.5);
    
    // REV GROWTH: Direct from slider with efficiency boost
    const revGrowthPercent = revenueGrowth + (opEfficiency * 0.2);
    
    // EBITDA: Revenue minus costs, improved by COGS and cost reduction
    const grossMargin = 0.4 + (cogsReduction / 100) * 0.3; // 40-70% margin
    const operatingCosts = (100 - costReduction) / 100;
    const ebitda = revenue * grossMargin * (1 - operatingCosts * 0.5);
    
    // BURN RATE: Affected by headcount, CAPEX, and efficiency
    const headcountCost = headcount * 2; // $2K per head
    const capexCost = capex * 0.5;
    const efficiencyMultiplier = 1 - (burnEfficiency / 100);
    const burnRate = (baseBurn + headcountCost + capexCost) * efficiencyMultiplier;
    
    // RUNWAY: Cash buffer divided by burn rate
    const cashInBank = cashBuffer * 1000; // Convert to $K
    const runwayMonths = Math.round(cashInBank / burnRate);
    
    // RISK SCORE: Composite - higher is better (less risky)
    const runwayRisk = Math.min(runwayMonths / 24, 1) * 30; // 30 pts for 24+ months
    const growthRisk = (revenueGrowth / 100) * 25; // 25 pts for high growth
    const efficiencyRisk = (opEfficiency / 100) * 25; // 25 pts for efficiency
    const bufferRisk = (cashBuffer / 100) * 20; // 20 pts for cash buffer
    const riskScore = Math.round(runwayRisk + growthRisk + efficiencyRisk + bufferRisk);
    
    // VALUATION: Revenue multiple based on growth + profitability
    const revenueMultiple = 3 + (revenueGrowth / 100) * 8 + (ebitda > 0 ? 2 : 0);
    const valuation = revenue * revenueMultiple;
    
    return {
      runway: Math.max(6, Math.min(60, runwayMonths)),
      revenue: revenue,
      revGrowth: Math.round(revGrowthPercent),
      ebitda: ebitda,
      burnRate: burnRate,
      riskScore: Math.max(20, Math.min(99, riskScore)),
      valuation: valuation,
    };
  }, [revenueGrowth, cogsReduction, opEfficiency, headcount, regions, cashBuffer, costReduction, capex, burnEfficiency]);

  // Format helpers
  const formatMoney = (val: number, decimals = 1) => {
    if (val >= 1) return `$${val.toFixed(decimals)}M`;
    return `$${(val * 1000).toFixed(0)}K`;
  };
  
  const formatBurn = (val: number) => `-$${Math.round(val)}K`;

  // KPI data with calculated values
  const kpis = [
    { 
      label: 'Runway', 
      value: `${calculations.runway}`, 
      unit: 'mo', 
      color: 'bg-violet-500', 
      change: calculations.runway > 24 ? 'Strong' : calculations.runway > 12 ? 'OK' : 'Low',
      positive: calculations.runway > 12 
    },
    { 
      label: 'Revenue', 
      value: formatMoney(calculations.revenue), 
      unit: '', 
      color: 'bg-cyan-500', 
      change: `+${calculations.revGrowth}%`,
      positive: true 
    },
    { 
      label: 'Rev Growth', 
      value: `+${calculations.revGrowth}%`, 
      unit: '', 
      color: 'bg-emerald-500', 
      change: calculations.revGrowth > 50 ? '🚀 High' : 'Steady',
      positive: calculations.revGrowth > 30 
    },
    { 
      label: 'EBITDA', 
      value: formatMoney(calculations.ebitda), 
      unit: '', 
      color: 'bg-teal-500', 
      change: calculations.ebitda > 0 ? 'Profitable' : 'Negative',
      positive: calculations.ebitda > 0 
    },
    { 
      label: 'Burn Rate', 
      value: formatBurn(calculations.burnRate), 
      unit: '/mo', 
      color: 'bg-orange-500', 
      change: calculations.burnRate < 150 ? 'Efficient' : 'High',
      positive: calculations.burnRate < 200 
    },
    { 
      label: 'Risk Score', 
      value: `${calculations.riskScore}`, 
      unit: '/100', 
      color: 'bg-red-500', 
      change: calculations.riskScore > 70 ? 'Low Risk' : 'Medium',
      positive: calculations.riskScore > 60 
    },
    { 
      label: 'Valuation', 
      value: formatMoney(calculations.valuation, 0), 
      unit: '', 
      color: 'bg-blue-500', 
      change: `${(calculations.valuation / 2).toFixed(1)}x Rev`,
      positive: true 
    },
  ];

  // Combined metric for mountain height (weighted average of key metrics)
  const mountainGrowth = (revenueGrowth * 0.4) + (opEfficiency * 0.3) + ((100 - (calculations.burnRate / 4)) * 0.3);
  const mountainEfficiency = (opEfficiency * 0.4) + (burnEfficiency * 3) + (cogsReduction * 0.2);

  const handleKpiClick = (index: number) => {
    setActiveCardIndex(index);
    setTimeout(() => setActiveCardIndex(null), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-[1800px] mx-auto space-y-5">

        {/* HEADER */}
        <header className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/30">S</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">STRATFIT</span>
                <span className="text-xs bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-2 py-1 rounded-full font-semibold">GOD MODE</span>
              </div>
              <span className="text-xs text-slate-400">Scenario Intelligence Platform</span>
            </div>
          </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-white hover:shadow-sm transition-all">Monthly</button>
            <button className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-slate-900 shadow-sm">Quarterly</button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-white hover:shadow-sm transition-all">Yearly</button>
          </div>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-7 gap-4">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              onClick={() => handleKpiClick(index)}
              className={`bg-white rounded-2xl p-5 shadow-sm border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                ${activeCardIndex === index 
                  ? 'border-teal-500 shadow-lg shadow-teal-500/20 scale-105' 
                  : 'border-slate-100 hover:border-slate-200'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${kpi.color} ${activeCardIndex === index ? 'animate-pulse' : ''}`}></div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {kpi.value}
                <span className="text-sm font-normal text-slate-400 ml-1">{kpi.unit}</span>
              </div>
              <div className={`text-sm font-semibold mt-2 ${kpi.positive ? 'text-emerald-500' : 'text-orange-500'}`}>
                {kpi.change}
              </div>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-[1fr_360px] gap-5">

          {/* 3D VISUALIZATION */}
          <div className="relative bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0f172a] rounded-3xl overflow-hidden shadow-2xl h-[540px] border border-slate-700/50">
            <ThreeJSMountainEngine 
              growth={mountainGrowth} 
              efficiency={mountainEfficiency}
              activeKPIIndex={activeCardIndex}
            />
            
            {/* Top Stats Bar */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                <span className="text-slate-400 text-xs">Health Score</span>
                <div className="text-white font-bold text-lg">{calculations.riskScore}/100</div>
              </div>
              <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                <span className="text-slate-400 text-xs">Valuation</span>
                <div className="text-teal-400 font-bold text-lg">{formatMoney(calculations.valuation, 0)}</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/80 to-transparent">
              <div className="flex justify-between items-end">
                <div className="flex gap-8">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                    <span key={month} className={`text-xs font-medium ${i < 9 ? 'text-slate-400' : 'text-slate-600'}`}>{month}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-teal-500/20 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                  <span className="text-teal-400 font-semibold text-sm">Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROL PANELS */}
          <div className="space-y-4">

            {/* PERFORMANCE */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white text-lg shadow-md shadow-teal-500/30">📈</div>
                <div>
                  <span className="font-bold text-slate-900">Performance</span>
                  <div className="text-xs text-slate-400">Revenue & Efficiency</div>
                </div>
              </div>
              <div className="space-y-5">
                <SliderControl label="Revenue Growth" value={revenueGrowth} onChange={setRevenueGrowth} unit="%" color="teal" />
                <SliderControl label="COGS Reduction" value={cogsReduction} onChange={setCogsReduction} unit="%" color="teal" />
                <SliderControl label="Op Efficiency" value={opEfficiency} onChange={setOpEfficiency} unit="%" color="teal" />
              </div>
            </div>

            {/* PEOPLE */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center text-white text-lg shadow-md shadow-violet-500/30">👥</div>
                <div>
                  <span className="font-bold text-slate-900">People</span>
                  <div className="text-xs text-slate-400">Team & Expansion</div>
                </div>
              </div>
              <div className="space-y-5">
                <SliderControl label="Headcount" value={headcount} onChange={setHeadcount} unit="" prefix="+" color="violet" />
                <SliderControl label="Regions" value={regions} onChange={setRegions} unit="" min={1} max={10} color="violet" />
                <SliderControl label="Cash Buffer" value={cashBuffer} onChange={setCashBuffer} unit="M" prefix="$" color="violet" />
              </div>
            </div>

            {/* FINANCIAL */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg shadow-md shadow-blue-500/30">💰</div>
                <div>
                  <span className="font-bold text-slate-900">Financial</span>
                  <div className="text-xs text-slate-400">Costs & Capital</div>
                </div>
              </div>
              <div className="space-y-5">
                <SliderControl label="Cost Reduction" value={costReduction} onChange={setCostReduction} unit="M" prefix="$" color="blue" />
                <SliderControl label="CAPEX" value={capex} onChange={setCapex} unit="M" prefix="$" color="blue" />
                <SliderControl label="Burn Efficiency" value={burnEfficiency} onChange={setBurnEfficiency} unit="%" max={25} color="blue" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// SLIDER COMPONENT
// ============================================================================
interface SliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  unit: string;
  prefix?: string;
  min?: number;
  max?: number;
  color: 'teal' | 'violet' | 'blue';
}

function SliderControl({ label, value, onChange, unit, prefix = '', min = 0, max = 100, color }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  
  const gradients = {
    teal: 'from-teal-400 to-teal-600',
    violet: 'from-violet-400 to-violet-600',
    blue: 'from-blue-400 to-blue-600',
  };
  
  const shadows = {
    teal: 'shadow-teal-500/50',
    violet: 'shadow-violet-500/50',
    blue: 'shadow-blue-500/50',
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-slate-600 font-medium">{label}</span>
        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{prefix}{value}{unit}</span>
      </div>
      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${gradients[color]}`} 
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
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg ${shadows[color]} border-2 border-white pointer-events-none transition-all`}
          style={{ left: `calc(${percent}% - 10px)` }}
        />
      </div>
    </div>
  );
}

export default StratfitGodModeDashboard;