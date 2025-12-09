// ============================================================================
// StratfitGodModeDashboard.tsx - Parent UI Component
// ============================================================================
import { useState } from 'react';
import ThreeJSMountainEngine from './ThreeJSMountainEngine';

const KpiIconPlaceholder = ({ color }: { color: string }) => (
  <div className={`p-2 rounded-full ${color} w-9 h-9`} />
);

const StratfitGodModeDashboard = () => {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [growthSliderValue, setGrowthSliderValue] = useState<number>(60);
  const [efficiencySliderValue, setEfficiencySliderValue] = useState<number>(50);

  const kpis = [
    { label: 'Runway', value: '18 Mo', color: 'bg-purple-600' },
    { label: 'Cash', value: '$1.2M', color: 'bg-indigo-600' },
    { label: 'Revenue Growth', value: '+18%', color: 'bg-cyan-600' },
    { label: 'EBITDA', value: '+8%', color: 'bg-emerald-600' },
    { label: 'Burn Rate', value: '$1.2M', color: 'bg-orange-600' },
    { label: 'Risk Score', value: '4.2/10', color: 'bg-red-600' },
    { label: 'Valuation', value: '$85M', color: 'bg-blue-600' },
  ];

  const handleKpiClick = (index: number) => {
    setActiveCardIndex(index);
    setTimeout(() => setActiveCardIndex(null), 800);
  };

  return (
    <div className="p-4 bg-white text-gray-800 min-h-screen">
      
      {/* KPI GRID */}
      <div className="grid grid-cols-7 gap-4 p-4 bg-gray-100 rounded-lg shadow-inner mb-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`flex flex-col items-center p-3 rounded-lg shadow-md cursor-pointer transition duration-300 hover:shadow-lg
              ${activeCardIndex === index ? 'ring-4 ring-offset-2 ring-cyan-500 transform scale-105' : 'bg-white'}`}
            onClick={() => handleKpiClick(index)}
          >
            <KpiIconPlaceholder color={kpi.color} /> 
            <div className="mt-2 text-xs font-semibold text-gray-500 uppercase">{kpi.label}</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* 3D MOUNTAIN */}
      <div className="relative w-full h-[60vh] bg-gray-900 rounded-lg shadow-xl mb-6"> 
        <ThreeJSMountainEngine 
          growth={growthSliderValue} 
          efficiency={efficiencySliderValue}
          activeKPIIndex={activeCardIndex}
        />
      </div>

      {/* SLIDERS */}
      <div className="flex justify-between p-4 bg-gray-100 rounded-lg shadow-inner">
        <div className="w-1/3 pr-4">
          <h3 className="text-sm font-bold text-cyan-600 uppercase mb-3 border-b-2 border-cyan-600 pb-1">PERFORMANCE</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 w-28">Revenue Growth:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={growthSliderValue}
                onChange={(e) => setGrowthSliderValue(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-cyan-500"
              />
              <span className="text-sm font-bold text-cyan-600 w-12 text-right">{growthSliderValue}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 w-28">Op Efficiency:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={efficiencySliderValue}
                onChange={(e) => setEfficiencySliderValue(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-cyan-500"
              />
              <span className="text-sm font-bold text-cyan-600 w-12 text-right">{efficiencySliderValue}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StratfitGodModeDashboard;