// ============================================================================
// StratfitGodModeDashboard.tsx - Parent UI Component (Verified Final Version)
// ============================================================================
import { useState } from 'react';
import { Canvas } from '@react-three/fiber'; // <-- NEW: Import Canvas
import ThreeJSMountainEngine from './ThreeJSMountainEngine';

// Import icons (assuming these were correct in your original file)
import Share2 from '../assets/react.svg';
import MessageSquare from '../assets/react.svg';
import Target from '../assets/react.svg';
import AlertTriangle from '../assets/react.svg';
import BarChart3 from '../assets/react.svg';
import TrendingUp from '../assets/react.svg';
import DollarSign from '../assets/react.svg';

// Utility to create a generic KPI icon
const KpiIcon = ({ icon, color }: { icon: string; color: string }) => (
  <div className={`p-2 rounded-full ${color} text-white`}>
    <img src={icon} className="w-5 h-5" alt="" />
  </div>
);

const StratfitGodModeDashboard = () => {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [growthSliderValue, setGrowthSliderValue] = useState<number>(60);
  const [efficiencySliderValue, setEfficiencySliderValue] = useState<number>(50);

  // NOTE: Assuming your KPI data and click handler are correct
  const kpis = [
    { label: 'Runway', value: '18 Mo', color: 'bg-purple-600', icon: Share2 },
    { label: 'Cash', value: '$1.2M', color: 'bg-indigo-600', icon: MessageSquare },
    { label: 'Revenue Growth', value: '+18%', color: 'bg-cyan-600', icon: TrendingUp },
    { label: 'EBITDA', value: '+8%', color: 'bg-emerald-600', icon: BarChart3 },
    { label: 'Burn Rate', value: '$1.2M', color: 'bg-orange-600', icon: AlertTriangle },
    { label: 'Risk Score', value: '4.2/10', color: 'bg-red-600', icon: Target },
    { label: 'Valuation', value: '$85M', color: 'bg-blue-600', icon: DollarSign },
  ];

  const handleKpiClick = (index: number) => {
    setActiveCardIndex(index);
    // Timeout logic to simulate the "surge" animation time
    setTimeout(() => {
      setActiveCardIndex(null);
    }, 800); 
  };

  return (
    <div className="p-4 bg-white text-gray-800 font-inter min-h-screen">
      
      {/* KPI GRID CONTAINER: FIXES THE STACKED LAYOUT */}
      <div className="grid grid-cols-7 gap-4 p-4 bg-gray-100 rounded-lg shadow-inner mb-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`flex flex-col items-center p-3 rounded-lg shadow-md cursor-pointer transition duration-300 hover:shadow-lg
              ${activeCardIndex === index ? 'ring-4 ring-offset-2 ring-cyan-500 transform scale-105' : 'bg-white'}`}
            onClick={() => handleKpiClick(index)}
          >
            <KpiIcon icon={kpi.icon} color={kpi.color} />
            <div className="mt-2 text-xs font-semibold text-gray-500 uppercase">{kpi.label}</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{kpi.value}</div>
          </div>
        ))}
      </div>

     {/* 3D MOUNTAIN VISUALIZATION: FIXES THE POOR QUALITY AND THE CRASH */}
     <div className="w-full h-[60vh] bg-gray-900 rounded-lg shadow-xl mb-6">
        <Canvas camera={{ position: [0, 8, 15], fov: 60 }}>
          {/* CRITICAL: No DIVs here. Only R3F components. */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <ThreeJSMountainEngine 
            growth={growthSliderValue} 
            efficiency={efficiencySliderValue}
            activeKPIIndex={activeCardIndex}
          />
        </Canvas>
      </div>
     

      {/* AI ANALYSIS SECTION (Placeholder) */}
      <div className="p-4 bg-white rounded-lg shadow-md mb-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">AI Analysis</h3>
        <p className="text-gray-700">
          Revenue trajectory shifts to Exponential in Q3 based on current spend efficiency.
        </p>
        <div className="mt-2 text-xl font-mono text-cyan-600">Q1 Q2 Q3 Q4</div>
      </div>

      {/* CONTROL DECK SLIDERS */}
      <div className="flex justify-between p-4 bg-gray-100 rounded-lg shadow-inner">
        {/* PERFORMANCE SECTION */}
        <div className="w-1/4 pr-4">
          <h3 className="text-sm font-bold text-cyan-600 uppercase mb-3 border-b-2 border-cyan-600 pb-1">PERFORMANCE</h3>
          
          <div className="space-y-3">
            {/* REVENUE GROWTH SLIDER */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 w-28">Revenue Growth:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={growthSliderValue}
                onChange={(e) => setGrowthSliderValue(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-sm font-bold text-cyan-600 w-12 text-right">{growthSliderValue}%</span>
            </div>

            {/* OP EFFICIENCY SLIDER */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 w-28">Op Efficiency:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={efficiencySliderValue}
                onChange={(e) => setEfficiencySliderValue(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-sm font-bold text-cyan-600 w-12 text-right">{efficiencySliderValue}%</span>
            </div>
          </div>
        </div>

        {/* FINANCIAL SECTION (Placeholder) */}
        <div className="w-1/4 pr-4">
          <h3 className="text-sm font-bold text-purple-600 uppercase mb-3 border-b-2 border-purple-600 pb-1">FINANCIAL</h3>
          {/* OPEX SLIDER (Placeholder) */}
          <div className="flex items-center gap-2 space-y-3">
            <span className="text-xs font-semibold text-gray-600 w-28">OPEX Ceiling:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={80} // Example value
              readOnly
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-sm font-bold text-purple-600 w-12 text-right">80%</span>
          </div>
        </div>

        {/* PEOPLE SECTION (Placeholder) */}
        <div className="w-1/4">
          <h3 className="text-sm font-bold text-pink-600 uppercase mb-3 border-b-2 border-pink-600 pb-1">PEOPLE</h3>
          {/* HEADCOUNT SLIDER (Placeholder) */}
          <div className="flex items-center gap-2 space-y-3">
            <span className="text-xs font-semibold text-gray-600 w-28">Headcount:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={70} // Example value
              readOnly
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <span className="text-sm font-bold text-pink-600 w-12 text-right">70</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StratfitGodModeDashboard;