// ============================================================================
// StratfitGodModeDashboard.tsx - Parent UI Component (Verified Final Version)
// ============================================================================
import React, { useState } from 'react';
import { 
  Zap, Share2, MessageSquare, 
  Target, AlertTriangle, BarChart3, TrendingUp, Users, DollarSign,
  ChevronRight, ChevronDown, Folder, FileText, PieChart, LineChart, Database
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ThreeJSMountainEngine from './ThreeJSMountainEngine';

interface ExplorerItem {
  id: string;
  label: string;
  icon: LucideIcon;
  children?: ExplorerItem[];
}

const explorerData: ExplorerItem[] = [
  {
    id: 'scenarios',
    label: 'Scenarios',
    icon: Folder,
    children: [
      { id: 'base', label: 'Base Case', icon: FileText },
      { id: 'optimistic', label: 'Optimistic', icon: FileText },
      { id: 'conservative', label: 'Conservative', icon: FileText },
    ]
  },
  {
    id: 'financials',
    label: 'Financials',
    icon: Folder,
    children: [
      { id: 'revenue', label: 'Revenue Model', icon: LineChart },
      { id: 'costs', label: 'Cost Structure', icon: PieChart },
      { id: 'cashflow', label: 'Cash Flow', icon: LineChart },
    ]
  },
  {
    id: 'metrics',
    label: 'Key Metrics',
    icon: Folder,
    children: [
      { id: 'kpis', label: 'KPI Dashboard', icon: BarChart3 },
      { id: 'runway', label: 'Runway Analysis', icon: TrendingUp },
      { id: 'burn', label: 'Burn Rate', icon: Zap },
    ]
  },
  {
    id: 'data',
    label: 'Data Sources',
    icon: Database,
    children: [
      { id: 'actuals', label: 'Actuals (2024)', icon: FileText },
      { id: 'forecast', label: 'Forecast (2025)', icon: FileText },
    ]
  },
];

const ExplorerItemComponent: React.FC<{ item: ExplorerItem; depth?: number; selectedId: string | null; onSelect: (id: string) => void }> = ({ 
  item, 
  depth = 0, 
  selectedId, 
  onSelect 
}) => {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;
  const isSelected = selectedId === item.id;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer text-xs
          transition-all duration-150
          ${isSelected ? 'bg-cyan-500/10 text-cyan-600' : 'text-gray-600 hover:bg-gray-100'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (hasChildren) setIsOpen(!isOpen);
          onSelect(item.id);
        }}
      >
        {hasChildren ? (
          isOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />
        ) : (
          <span className="w-3" />
        )}
        <Icon size={14} className={isSelected ? 'text-cyan-500' : 'text-gray-400'} />
        <span className="truncate font-medium">{item.label}</span>
      </div>
      {hasChildren && isOpen && (
        <div>
          {item.children!.map((child) => (
            <ExplorerItemComponent 
              key={child.id} 
              item={child} 
              depth={depth + 1} 
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const StratfitGodModeDashboard = () => {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [growthSliderValue, setGrowthSliderValue] = useState<number>(60);
  const [efficiencySliderValue, setEfficiencySliderValue] = useState<number>(50);
  const [selectedExplorerItem, setSelectedExplorerItem] = useState<string | null>('kpis');

  const handleKpiClick = (index: number) => {
    setActiveCardIndex(index);
    setTimeout(() => setActiveCardIndex(null), 800); 
  };

  const kpis = [
    { label: 'Runway', value: '18 Mo', color: 'purple', icon: Target },
    { label: 'Cash', value: '$12.4M', color: 'purple', icon: DollarSign },
    { label: 'Revenue Growth', value: '+18%', color: 'cyan', icon: TrendingUp },
    { label: 'EBITDA', value: '+8%', color: 'purple', icon: BarChart3 },
    { label: 'Burn Rate', value: '$1.2M', color: 'cyan', icon: Zap },
    { label: 'Risk Score', value: '4.2/10', color: 'purple', icon: AlertTriangle },
    { label: 'Valuation', value: '$85M', color: 'cyan', icon: DollarSign },
  ];

  return (
    <div className="h-screen bg-[#F4F6F9] text-gray-800 font-sans overflow-hidden flex">
      
      {/* LEFT EXPLORER PANEL */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Zap className="text-gray-900 fill-current w-5 h-5" />
            <span className="text-sm font-bold text-gray-900">STRATFIT</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[10px] uppercase font-bold text-gray-400 px-2 py-2 tracking-wider">
            Explorer
          </div>
          {explorerData.map((item) => (
            <ExplorerItemComponent 
              key={item.id} 
              item={item} 
              selectedId={selectedExplorerItem}
              onSelect={setSelectedExplorerItem}
            />
          ))}
        </div>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live Data Connected</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
        
        <header className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold tracking-tight text-gray-900">
              Dashboard <span className="font-normal text-gray-400 text-sm ml-2 tracking-widest">INTELLIGENCE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-xs font-medium text-gray-600">
              <MessageSquare size={14} /> AI Insights
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
              <Share2 size={14} /> Export
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 border-2 border-white shadow-md" />
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 gap-6 min-h-0 overflow-auto">
        
        {/* KPI CARDS: This uses the Tailwind grid-cols-7 to fix the stacking */}
        <div className="grid grid-cols-7 gap-4 h-28 shrink-0">
          {kpis.map((kpi, i) => (
            <div 
              key={i}
              onClick={() => handleKpiClick(i)}
              className={`
                bg-white/80 backdrop-blur-md border border-white/50 shadow-sm rounded-xl p-4 
                flex flex-col justify-center items-center text-center cursor-pointer 
                transition-all duration-300 hover:-translate-y-1
                ${activeCardIndex === i ? 'border-cyan-400 ring-2 ring-cyan-400/20 shadow-lg scale-105' : 'hover:shadow-md'}
              `}
            >
              <span className="text-[10px] uppercase font-bold text-gray-400 mb-2">{kpi.label}</span>
              <span className={`text-2xl font-bold ${kpi.color === 'cyan' ? 'text-cyan-600' : 'text-gray-800'}`}>
                {kpi.value}
              </span>
            </div>
          ))}
        </div>

        {/* 3D ENGINE */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800 h-full min-h-[400px] bg-[#020204]">
          
          <ThreeJSMountainEngine 
            activeKPIIndex={activeCardIndex}
            growth={growthSliderValue}
            efficiency={efficiencySliderValue}
          />

          {/* AI ANALYSIS PANEL */}
          <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 w-64 z-10 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-gray-800">AI Analysis</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Revenue trajectory shifts to <span className="text-cyan-500 font-bold">Exponential</span> in Q3 based on current spend efficiency.
            </p>
          </div>

          <div className="absolute bottom-6 left-10 right-10 flex justify-between text-xs font-mono text-gray-500 pointer-events-none z-10">
            <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
          </div>
        </div>

        {/* CONTROL DECK: This is the large bottom panel that contains all sliders */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 grid grid-cols-3 gap-8 shrink-0 h-64 border border-white/50 shadow-sm">
           
           {/* PERFORMANCE SECTION */}
           <div className="space-y-4">
             <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
               <TrendingUp className="w-4 h-4 text-cyan-500" />
               <h3 className="text-sm font-bold text-gray-800">PERFORMANCE</h3>
             </div>
             
             {/* REVENUE GROWTH SLIDER (The one that was missing) */}
             <div className="space-y-1">
               <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                 <span>Revenue Growth</span>
                 <span className="text-cyan-600">{growthSliderValue}%</span>
               </div>
               <input 
                 type="range" 
                 min="0" max="100" 
                 value={growthSliderValue}
                 onChange={(e) => setGrowthSliderValue(Number(e.target.value))}
                 className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
               />
             </div>

             {/* OP EFFICIENCY SLIDER (The one that was working) */}
             <div className="space-y-1">
               <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                 <span>Op Efficiency</span>
                 <span className="text-cyan-600">{efficiencySliderValue}%</span>
               </div>
               <input 
                 type="range" 
                 min="0" max="100" 
                 value={efficiencySliderValue}
                 onChange={(e) => setEfficiencySliderValue(Number(e.target.value))}
                 className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
               />
             </div>
           </div>

           {/* FINANCIAL SECTION */}
           <div className="space-y-4">
             <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
               <DollarSign className="w-4 h-4 text-purple-500" />
               <h3 className="text-sm font-bold text-gray-800">FINANCIAL</h3>
             </div>
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase"><span>OPEX Ceiling</span><span className="text-purple-600">80%</span></div>
                <input type="range" className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500" defaultValue="80" />
             </div>
           </div>

           {/* PEOPLE SECTION */}
           <div className="space-y-4">
             <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
               <Users className="w-4 h-4 text-cyan-500" />
               <h3 className="text-sm font-bold text-gray-800">PEOPLE</h3>
             </div>
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase"><span>Headcount</span><span className="text-cyan-600">70</span></div>
                <input type="range" className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500" defaultValue="70" />
             </div>
           </div>

        </div>
        </main>
      </div>
    </div>
  );
};

export default StratfitGodModeDashboard;
