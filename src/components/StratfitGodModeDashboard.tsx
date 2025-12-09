// ============================================================================
// StratfitGodModeDashboard.tsx - Premium UI Component
// ============================================================================
import { useState } from 'react';
import ThreeJSMountainEngine from './ThreeJSMountainEngine';

const StratfitGodModeDashboard = () => {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [growthSliderValue, setGrowthSliderValue] = useState<number>(60);
  const [efficiencySliderValue, setEfficiencySliderValue] = useState<number>(50);
  const [cogsSliderValue, setCogsSliderValue] = useState<number>(30);
  const [headcountSliderValue, setHeadcountSliderValue] = useState<number>(40);
  const [regionsSliderValue, setRegionsSliderValue] = useState<number>(3);
  const [bufferSliderValue, setBufferSliderValue] = useState<number>(45);
  const [costSliderValue, setCostSliderValue] = useState<number>(32);
  const [capexSliderValue, setCapexSliderValue] = useState<number>(58);
  const [burnEffSliderValue, setBurnEffSliderValue] = useState<number>(12);

  const kpis = [
    { label: 'Runway', value: '48', unit: 'months', color: 'bg-violet-500', change: '+12', positive: true },
    { label: 'Revenue', value: '$4.2M', unit: '', color: 'bg-cyan-500', change: '+120%', positive: true },
    { label: 'Rev Growth', value: '+120%', unit: '', color: 'bg-emerald-500', change: '↑ 15%', positive: true },
    { label: 'EBITDA', value: '$840K', unit: '', color: 'bg-teal-500', change: '+18%', positive: true },
    { label: 'Burn Rate', value: '-$120K', unit: '', color: 'bg-orange-500', change: '↓ 8%', positive: false },
    { label: 'Risk Score', value: '92', unit: '/100', color: 'bg-red-500', change: 'Low', positive: true },
    { label: 'Valuation', value: '$28M', unit: '', color: 'bg-blue-500', change: '+130%', positive: true },
  ];

  const handleKpiClick = (index: number) => {
    setActiveCardIndex(index);
    setTimeout(() => setActiveCardIndex(null), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-[1800px] mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/25">S</div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">STRATFIT</span>
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium ml-2">GOD MODE</span>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50">Monthly</button>
            <button className="px-4 py-2 bg-slate-900 rounded-lg text-sm font-medium text-white shadow-sm">Quarterly</button>
            <button className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50">Yearly</button>
          </div>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-7 gap-4">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              onClick={() => handleKpiClick(index)}
              className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                ${activeCardIndex === index ? 'ring-2 ring-teal-500 ring-offset-2 shadow-lg' : ''}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${kpi.color}`}></div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}<span className="text-sm font-normal text-slate-400 ml-1">{kpi.unit}</span></div>
              <div className={`text-sm font-semibold mt-1 ${kpi.positive ? 'text-emerald-500' : 'text-orange-500'}`}>{kpi.change}</div>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-[1fr_340px] gap-6">

          {/* 3D VISUALIZATION */}
          <div className="relative bg-gradient-to-b from-[#0a1628] to-[#0f172a] rounded-3xl overflow-hidden shadow-2xl h-[520px]">
            <ThreeJSMountainEngine 
              growth={growthSliderValue} 
              efficiency={efficiencySliderValue}
              activeKPIIndex={activeCardIndex}
            />
            {/* Timeline Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a1628]/90 to-transparent">
              <div className="flex justify-between items-end">
                <div className="flex gap-10">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month) => (
                    <span key={month} className="text-slate-500 text-xs font-medium">{month}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  <span className="text-teal-400 font-semibold text-sm">Live Simulation</span>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROL PANELS */}
          <div className="space-y-4">

            {/* PERFORMANCE */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center text-sm">📈</div>
                <span className="font-semibold text-slate-900">Performance</span>
              </div>
              <div className="space-y-4">
                <SliderControl label="Revenue Growth" value={growthSliderValue} onChange={setGrowthSliderValue} unit="%" color="teal" />
                <SliderControl label="COGS Reduction" value={cogsSliderValue} onChange={setCogsSliderValue} unit="%" color="teal" />
                <SliderControl label="Op Efficiency" value={efficiencySliderValue} onChange={setEfficiencySliderValue} unit="%" color="teal" />
              </div>
            </div>

            {/* PEOPLE */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-sm">👥</div>
                <span className="font-semibold text-slate-900">People</span>
              </div>
              <div className="space-y-4">
                <SliderControl label="Headcount" value={headcountSliderValue} onChange={setHeadcountSliderValue} unit="" prefix="+" color="violet" />
                <SliderControl label="Regions" value={regionsSliderValue} onChange={setRegionsSliderValue} unit="" min={1} max={6} color="violet" />
                <SliderControl label="Cash Buffer" value={bufferSliderValue} onChange={setBufferSliderValue} unit="M" prefix="$" color="violet" />
              </div>
            </div>

            {/* FINANCIAL */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">💰</div>
                <span className="font-semibold text-slate-900">Financial</span>
              </div>
              <div className="space-y-4">
                <SliderControl label="Cost Reduction" value={costSliderValue} onChange={setCostSliderValue} unit="M" prefix="$" color="blue" />
                <SliderControl label="CAPEX" value={capexSliderValue} onChange={setCapexSliderValue} unit="M" prefix="$" color="blue" />
                <SliderControl label="Burn Efficiency" value={burnEffSliderValue} onChange={setBurnEffSliderValue} unit="%" max={20} color="blue" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

// Slider Component
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
  const colorClasses = {
    teal: 'bg-teal-500',
    violet: 'bg-violet-500',
    blue: 'bg-blue-500',
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-slate-600 font-medium">{label}</span>
        <span className="text-sm font-bold text-slate-900">{prefix}{value}{unit}</span>
      </div>
      <div className="relative h-2 bg-slate-200 rounded-full">
        <div className={`absolute left-0 top-0 h-full rounded-full ${colorClasses[color]}`} style={{ width: `${percent}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-slate-300 pointer-events-none"
          style={{ left: `calc(${percent}% - 8px)` }}
        />
      </div>
    </div>
  );
}

export default StratfitGodModeDashboard;