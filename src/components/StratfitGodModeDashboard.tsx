// ============================================================================
// STRATFIT G-D MODE — FINAL CTO-APPROVED DASHBOARD
// AI Panel on RIGHT. Scenario Dock CENTERED. Mountain CINEMATIC.
// ============================================================================

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Shield,
  BarChart3,
  Brain,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import NeonRidgeEngine from './NeonRidgeEngine';

// ============================================================================
// TYPES
// ============================================================================
type Scenario = 'base' | 'upside' | 'downside' | 'extreme';
type TimePeriod = 'monthly' | 'quarterly' | 'yearly';

interface KPI {
  id: string;
  label: string;
  value: number;
  format: (v: number) => string;
  unit: string;
  icon: React.ReactNode;
  description: string;
  relatedSliders: string[];
  trend: 'up' | 'down' | 'neutral';
}

// ============================================================================
// COLOR PALETTE
// ============================================================================
const COLORS = {
  void: '#020617',
  background: '#0a1628',
  valley: '#0d4f4f',
  midTeal: '#14b8a6',
  cyan: '#22d3d3',
  peakGlow: '#5eead4',
  textMuted: '#64748b',
  textBright: '#f1f5f9',
};

// ============================================================================
// SCENARIO CONFIG
// ============================================================================
const SCENARIO_CONFIG: Record<Scenario, { label: string; description: string; color: string }> = {
  base: { label: 'Base', description: 'Current trajectory projection', color: '#22d3d3' },
  upside: { label: 'Upside', description: 'Growth +18% YoY, reduced churn', color: '#10b981' },
  downside: { label: 'Downside', description: 'Conservative +5% YoY', color: '#f59e0b' },
  extreme: { label: 'Extreme', description: 'Aggressive expansion +35%', color: '#ef4444' },
};

// ============================================================================
// DATA GENERATOR
// ============================================================================
const generateData = (
  timePeriod: TimePeriod,
  scenario: Scenario,
  revenueGrowth: number,
  opex: number,
  burnRate: number,
  hiringRate: number,
  wageInflation: number
): number[] => {
  const count = { monthly: 12, quarterly: 4, yearly: 5 }[timePeriod];
  const mult = { base: 1, upside: 1.35, downside: 0.7, extreme: 1.8 }[scenario];

  return Array.from({ length: count }, (_, i) => {
    const growth = Math.pow(1 + (revenueGrowth / 100) * 0.1, i);
    const season = 1 + Math.sin((i / count) * Math.PI * 2) * 0.15;
    const costs = (opex / 100) * 12 + (burnRate / 200) * 8 + (wageInflation / 20) * 6;
    const boost = (hiringRate / 50) * 4;
    const base = 35 + i * 4;
    
    return Math.max(15, Math.min(95, (base * growth * season * mult - costs + boost)));
  });
};

// ============================================================================
// SLIDER COMPONENT
// ============================================================================
interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  prefix?: string;
  highlighted?: boolean;
  inverse?: boolean;
}

const Slider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  unit = '%',
  prefix = '',
  highlighted = false,
  inverse = false,
}: SliderProps) => {
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <motion.div
      animate={{ scale: highlighted ? 1.02 : 1 }}
      className="relative"
    >
      <div className="flex justify-between mb-2">
        <span className={`text-xs font-semibold ${highlighted ? 'text-[#5eead4]' : 'text-[#64748b]'}`}>
          {label}
        </span>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
          highlighted ? 'bg-[#5eead4]/20 text-[#5eead4]' : 'bg-[#0a1628] text-white'
        }`}>
          {prefix}{value}{unit}
        </span>
      </div>
      
      <div className={`relative h-2.5 rounded-full ${highlighted ? 'bg-[#0d4f4f]' : 'bg-[#0a1628]'}`}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: highlighted
              ? 'linear-gradient(90deg, #0d4f4f, #5eead4)'
              : inverse
              ? 'linear-gradient(90deg, #0d4f4f, #f59e0b)'
              : 'linear-gradient(90deg, #0d4f4f, #22d3d3)',
            boxShadow: dragging ? '0 0 20px rgba(94,234,212,0.6)' : 'none',
          }}
          animate={{ opacity: dragging ? 1 : 0.9 }}
        />
        
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg"
          style={{ left: `calc(${pct}% - 10px)` }}
          animate={{
            scale: dragging ? 1.3 : highlighted ? 1.1 : 1,
            backgroundColor: highlighted ? '#5eead4' : '#ffffff',
            boxShadow: dragging 
              ? '0 0 25px rgba(94,234,212,0.8)' 
              : '0 2px 10px rgba(0,0,0,0.3)',
          }}
        />
        
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// KPI CARD
// ============================================================================
interface KPICardProps {
  kpi: KPI;
  isActive: boolean;
  isSpotlight: boolean;
  onClick: () => void;
  showTooltip: boolean;
  onToggleTooltip: () => void;
}

const KPICard = ({ kpi, isActive, isSpotlight, onClick, showTooltip, onToggleTooltip }: KPICardProps) => {
  const dimmed = isSpotlight && !isActive;

  return (
    <motion.div
      onClick={onClick}
      className="relative cursor-pointer rounded-2xl overflow-hidden"
      animate={{
        scale: isActive ? 1.15 : dimmed ? 0.92 : 1,
        opacity: dimmed ? 0.4 : 1,
        filter: dimmed ? 'grayscale(50%) brightness(0.6)' : 'none',
        zIndex: isActive ? 50 : 1,
        y: isActive ? -8 : 0,
      }}
      whileHover={{ scale: isActive ? 1.15 : dimmed ? 0.92 : 1.05 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, #0d4f4f, #14b8a6)'
          : 'linear-gradient(135deg, rgba(10,22,40,0.9), rgba(2,6,23,0.95))',
        border: isActive ? '2px solid #5eead4' : '1px solid rgba(94,234,212,0.1)',
        boxShadow: isActive 
          ? '0 0 50px rgba(94,234,212,0.5), 0 20px 40px rgba(0,0,0,0.3)' 
          : '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#5eead4]/30 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isActive ? 'bg-[#5eead4]/30' : 'bg-[#0a1628]'
            }`}>
              <span className={isActive ? 'text-[#5eead4]' : 'text-[#64748b]'}>{kpi.icon}</span>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              isActive ? 'text-[#5eead4]' : 'text-[#64748b]'
            }`}>
              {kpi.label}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleTooltip(); }}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              showTooltip ? 'bg-[#5eead4] text-[#0a1628]' : 'bg-[#0a1628]/50 text-[#64748b]'
            }`}
          >
            <Info className="w-3 h-3" />
          </button>
        </div>

        <div className={`text-2xl font-bold font-mono ${isActive ? 'text-white' : 'text-[#f1f5f9]'}`}>
          {kpi.format(kpi.value)}
          <span className="text-xs font-normal text-[#64748b] ml-1">{kpi.unit}</span>
        </div>

        <div className="flex items-center gap-1 mt-1.5">
          {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-[#5eead4]" />}
          {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 text-[#f59e0b]" />}
          <span className={`text-[10px] font-semibold ${
            kpi.trend === 'up' ? 'text-[#5eead4]' : kpi.trend === 'down' ? 'text-[#f59e0b]' : 'text-[#64748b]'
          }`}>
            {kpi.trend === 'up' ? 'Healthy' : kpi.trend === 'down' ? 'Monitor' : 'Stable'}
          </span>
        </div>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[10px] text-[#94a3b8] mt-2 pt-2 border-t border-[#0d4f4f]/50 leading-relaxed"
            >
              {kpi.description}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ============================================================================
// AI PANEL (RIGHT SIDE)
// ============================================================================
interface AIPanelProps {
  isOpen: boolean;
  insights: string;
  activeKPI: string | null;
  onClose: () => void;
}

const AIPanel = ({ isOpen, insights, activeKPI, onClose }: AIPanelProps) => {
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (isOpen && insights) {
      setText('');
      setTyping(true);
      let i = 0;
      const timer = setInterval(() => {
        if (i < insights.length) {
          setText(insights.slice(0, i + 1));
          i++;
        } else {
          setTyping(false);
          clearInterval(timer);
        }
      }, 8);
      return () => clearInterval(timer);
    }
  }, [isOpen, insights]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="h-full rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(135deg, rgba(10,22,40,0.98), rgba(2,6,23,0.99))',
        border: '1px solid rgba(94,234,212,0.2)',
        boxShadow: '0 0 60px rgba(94,234,212,0.15)',
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#0d4f4f]/50">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#0d4f4f] to-[#14b8a6]"
            animate={{ boxShadow: ['0 0 20px rgba(94,234,212,0.4)', '0 0 40px rgba(94,234,212,0.6)', '0 0 20px rgba(94,234,212,0.4)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="w-5 h-5 text-[#5eead4]" />
          </motion.div>
          <div>
            <div className="text-sm font-bold text-white">CFO Intelligence</div>
            <div className="text-[10px] text-[#64748b]">
              {activeKPI ? `Analyzing: ${activeKPI}` : 'Cash Sensitivity'}
            </div>
          </div>
          {typing && (
            <div className="flex gap-1 ml-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#5eead4]"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-[#0a1628] flex items-center justify-center text-[#64748b] hover:text-[#5eead4]"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="text-xs text-[#94a3b8] leading-loose font-mono whitespace-pre-wrap">
          {text}
          {typing && (
            <motion.span
              className="inline-block w-2 h-4 bg-[#5eead4] ml-0.5"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export default function StratfitGodModeDashboard() {
  // State
  const [activeKPI, setActiveKPI] = useState<number | null>(null);
  const [scenario, setScenario] = useState<Scenario>('base');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tooltipKPI, setTooltipKPI] = useState<number | null>(null);
  const [timelinePositions, setTimelinePositions] = useState<{ x: number; label: string }[]>([]);

  // Sliders - Basic
  const [revenueGrowth, setRevenueGrowth] = useState(18);
  const [opex, setOpex] = useState(45);
  const [hiringRate, setHiringRate] = useState(12);
  const [wageInflation, setWageInflation] = useState(5);
  const [burnRate, setBurnRate] = useState(120);

  // Sliders - Advanced
  const [cogs, setCogs] = useState(35);
  const [churn, setChurn] = useState(8);
  const [priceChange, setPriceChange] = useState(0);
  const [wacc, setWacc] = useState(12);
  const [terminalGrowth, setTerminalGrowth] = useState(3);
  const [revMultiple, setRevMultiple] = useState(8);
  const [ebitdaMultiple, setEbitdaMultiple] = useState(12);
  const [marketRisk, setMarketRisk] = useState(0);
  const [costInflation, setCostInflation] = useState(3);

  // Calculations
  const calc = useMemo(() => {
    const mult = { base: 1, upside: 1.35, downside: 0.7, extreme: 1.8 }[scenario];
    const rev = 2.5 * (1 + revenueGrowth / 100) * mult;
    const margin = (100 - cogs) / 100;
    const ebitda = rev * margin - rev * (opex / 100) * 0.4;
    const cash = 2500 + rev * 400;
    const runway = burnRate > 0 ? Math.round(cash / burnRate) : 60;
    const risk = Math.max(1, Math.min(10, 5 + burnRate / 50 + churn / 10 - revenueGrowth / 30));
    const val = (rev * revMultiple + Math.max(0, ebitda) * ebitdaMultiple) / 2 * mult;
    return { rev, ebitda, cash, runway, risk, val, burn: burnRate };
  }, [revenueGrowth, opex, burnRate, cogs, churn, scenario, revMultiple, ebitdaMultiple]);

  // Chart data
  const chartData = useMemo(
    () => generateData(timePeriod, scenario, revenueGrowth, opex, burnRate, hiringRate, wageInflation),
    [timePeriod, scenario, revenueGrowth, opex, burnRate, hiringRate, wageInflation]
  );

  // KPIs
  const kpis: KPI[] = useMemo(() => [
    { id: 'runway', label: 'Runway', value: calc.runway, format: v => `${Math.min(60, v)}`, unit: 'Mo', icon: <Zap className="w-4 h-4" />, description: 'Months remaining at current burn rate.', relatedSliders: ['burnRate', 'revenueGrowth'], trend: calc.runway > 24 ? 'up' : calc.runway > 12 ? 'neutral' : 'down' },
    { id: 'cash', label: 'Cash', value: calc.cash, format: v => `$${(v/1000).toFixed(1)}M`, unit: '', icon: <DollarSign className="w-4 h-4" />, description: 'Total cash reserves.', relatedSliders: ['revenueGrowth', 'burnRate'], trend: 'up' },
    { id: 'growth', label: 'Growth', value: revenueGrowth, format: v => `+${v}`, unit: '%', icon: <TrendingUp className="w-4 h-4" />, description: 'Year-over-year revenue growth.', relatedSliders: ['revenueGrowth'], trend: revenueGrowth > 15 ? 'up' : 'neutral' },
    { id: 'ebitda', label: 'EBITDA', value: calc.ebitda, format: v => `$${v.toFixed(1)}M`, unit: '', icon: <BarChart3 className="w-4 h-4" />, description: 'Earnings before interest, taxes, depreciation.', relatedSliders: ['opex', 'wageInflation'], trend: calc.ebitda > 0 ? 'up' : 'down' },
    { id: 'burn', label: 'Burn', value: calc.burn, format: v => `$${v}K`, unit: '/mo', icon: <TrendingDown className="w-4 h-4" />, description: 'Monthly cash consumption.', relatedSliders: ['burnRate', 'hiringRate'], trend: burnRate < 100 ? 'up' : burnRate < 150 ? 'neutral' : 'down' },
    { id: 'risk', label: 'Risk', value: calc.risk, format: v => v.toFixed(1), unit: '/10', icon: <Shield className="w-4 h-4" />, description: 'Composite risk score.', relatedSliders: ['burnRate', 'revenueGrowth'], trend: calc.risk < 5 ? 'up' : calc.risk < 7 ? 'neutral' : 'down' },
    { id: 'val', label: 'Value', value: calc.val, format: v => `$${v.toFixed(0)}M`, unit: '', icon: <DollarSign className="w-4 h-4" />, description: 'Enterprise valuation estimate.', relatedSliders: ['revenueGrowth', 'opex'], trend: 'up' },
  ], [calc, revenueGrowth, burnRate]);

  // AI Insights
  const insights = useMemo(() => {
    const lines = [];
    const kpi = activeKPI !== null ? kpis[activeKPI] : null;
    
    lines.push(`📊 SCENARIO: ${scenario.toUpperCase()}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    if (kpi) {
      lines.push(`🎯 FOCUS: ${kpi.label.toUpperCase()}`);
      lines.push(`Value: ${kpi.format(kpi.value)}${kpi.unit}`);
      lines.push(`Status: ${kpi.trend === 'up' ? '✅ Healthy' : kpi.trend === 'down' ? '⚠️ Monitor' : '➖ Stable'}\n`);
    }
    
    lines.push(`💰 CASH SENSITIVITY:`);
    lines.push(`• Revenue +1% → +$18.5K cash, +0.4mo runway`);
    lines.push(`• OpEx +1% → -$27K EBITDA`);
    lines.push(`• Burn +$10K/mo → -0.9mo runway\n`);
    
    if (calc.risk > 6) {
      lines.push(`🔴 RISK ALERT: ${calc.risk.toFixed(1)}/10`);
      lines.push(`Reduce burn or accelerate growth.\n`);
    } else {
      lines.push(`✅ POSITION: Strong (${calc.risk.toFixed(1)}/10)`);
      lines.push(`${calc.runway}mo runway provides buffer.\n`);
    }
    
    lines.push(`📈 VALUATION: $${calc.val.toFixed(0)}M`);
    
    return lines.join('\n');
  }, [scenario, activeKPI, kpis, calc]);

  const isHighlighted = (id: string) => activeKPI !== null && kpis[activeKPI].relatedSliders.includes(id);

  return (
    <div className="min-h-screen text-white font-sans" style={{ background: COLORS.void }}>
      
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#0d4f4f]/30">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#0d4f4f] to-[#14b8a6]"
            animate={{ boxShadow: ['0 0 30px rgba(94,234,212,0.3)', '0 0 50px rgba(94,234,212,0.5)', '0 0 30px rgba(94,234,212,0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap className="w-5 h-5 text-[#5eead4]" />
          </motion.div>
          <div>
            <div className="text-xl font-bold">STRATFIT <span className="text-[#5eead4] text-xs tracking-[0.3em] ml-2">G-D MODE</span></div>
            <div className="text-[10px] text-[#64748b]">Scenario Intelligence Platform</div>
          </div>
        </div>
        
        <motion.button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(94,234,212,0.3)', color: COLORS.peakGlow }}
          whileHover={{ boxShadow: '0 0 30px rgba(94,234,212,0.3)' }}
        >
          <Download className="w-4 h-4" /> Export PDF
        </motion.button>
      </header>

      <div className="p-5 space-y-5">
        
        {/* KPI ROW */}
        <div className="grid grid-cols-7 gap-3">
          {kpis.map((kpi, i) => (
            <KPICard
              key={kpi.id}
              kpi={kpi}
              isActive={activeKPI === i}
              isSpotlight={activeKPI !== null}
              onClick={() => setActiveKPI(activeKPI === i ? null : i)}
              showTooltip={tooltipKPI === i}
              onToggleTooltip={() => setTooltipKPI(tooltipKPI === i ? null : i)}
            />
          ))}
        </div>

        {/* SCENARIO DOCK (CENTERED) */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex rounded-2xl p-1.5" style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(94,234,212,0.2)' }}>
            {(['base', 'upside', 'downside', 'extreme'] as Scenario[]).map(s => (
              <motion.button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${scenario === s ? 'text-[#020617]' : 'text-[#64748b]'}`}
                style={{
                  background: scenario === s ? `linear-gradient(135deg, ${SCENARIO_CONFIG[s].color}, ${COLORS.peakGlow})` : 'transparent',
                  boxShadow: scenario === s ? `0 0 20px ${SCENARIO_CONFIG[s].color}40` : 'none',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {s}
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-[#64748b]">
            <span className="text-[#5eead4] font-semibold">Active:</span> {SCENARIO_CONFIG[scenario].description}
          </p>
        </div>

        {/* MAIN GRID: Sliders | Mountain | AI */}
        <div className="grid grid-cols-[280px_1fr_300px] gap-5 h-[480px]">
          
          {/* LEFT: SLIDERS */}
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(10,22,40,0.95), rgba(2,6,23,0.98))', border: '1px solid rgba(94,234,212,0.15)' }}>
              <div className="flex items-center gap-2 mb-4">
                <motion.div className="w-2 h-2 rounded-full bg-[#5eead4]" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                <span className="text-xs font-bold text-white">Core Drivers</span>
              </div>
              <div className="space-y-5">
                <Slider label="Revenue Growth" value={revenueGrowth} onChange={setRevenueGrowth} min={-20} max={100} highlighted={isHighlighted('revenueGrowth')} />
                <Slider label="Operating Expenses" value={opex} onChange={setOpex} min={20} max={80} highlighted={isHighlighted('opex')} inverse />
                <Slider label="Hiring Rate" value={hiringRate} onChange={setHiringRate} min={0} max={50} highlighted={isHighlighted('hiringRate')} />
                <Slider label="Wage Inflation" value={wageInflation} onChange={setWageInflation} min={0} max={20} highlighted={isHighlighted('wageInflation')} inverse />
                <Slider label="Burn Rate" value={burnRate} onChange={setBurnRate} min={50} max={300} unit="K" prefix="$" highlighted={isHighlighted('burnRate')} inverse />
              </div>
            </div>

            <motion.button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              style={{
                background: showAdvanced ? 'linear-gradient(135deg, rgba(13,79,79,0.5), rgba(20,184,166,0.3))' : 'rgba(10,22,40,0.9)',
                border: `1px solid ${showAdvanced ? 'rgba(94,234,212,0.4)' : 'rgba(94,234,212,0.15)'}`,
                color: showAdvanced ? COLORS.peakGlow : COLORS.textMuted,
              }}
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#5eead4]/20 text-[#5eead4] ml-1">PRO</span>
            </motion.button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-4 space-y-4"
                  style={{ background: 'linear-gradient(135deg, rgba(10,22,40,0.95), rgba(2,6,23,0.98))', border: '1px solid rgba(94,234,212,0.2)' }}
                >
                  <Slider label="COGS" value={cogs} onChange={setCogs} min={10} max={70} />
                  <Slider label="Churn" value={churn} onChange={setChurn} min={0} max={30} inverse />
                  <Slider label="Price Change" value={priceChange} onChange={setPriceChange} min={-20} max={20} />
                  <Slider label="WACC" value={wacc} onChange={setWacc} min={5} max={25} inverse />
                  <Slider label="Terminal Growth" value={terminalGrowth} onChange={setTerminalGrowth} min={0} max={10} />
                  <Slider label="Rev Multiple" value={revMultiple} onChange={setRevMultiple} min={2} max={20} unit="x" />
                  <Slider label="EBITDA Multiple" value={ebitdaMultiple} onChange={setEbitdaMultiple} min={4} max={25} unit="x" />
                  <Slider label="Market Risk" value={marketRisk} onChange={setMarketRisk} min={0} max={30} inverse />
                  <Slider label="Cost Inflation" value={costInflation} onChange={setCostInflation} min={0} max={15} inverse />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CENTER: MOUNTAIN */}
          <div className="relative rounded-3xl overflow-hidden" style={{ background: COLORS.background, border: '1px solid rgba(94,234,212,0.15)' }}>
            <NeonRidgeEngine
              dataPoints={chartData}
              scenario={scenario}
              timePeriod={timePeriod}
              activeKPIIndex={activeKPI}
              onTimelinePositions={setTimelinePositions}
            />

            {/* Timeline Labels (Projected from 3D) */}
            <div className="absolute bottom-16 left-0 right-0 flex justify-between px-8">
              {timelinePositions.map((pos, i) => (
                <motion.span
                  key={i}
                  className={`text-xs font-mono font-bold ${activeKPI === i ? 'text-[#5eead4]' : 'text-[#64748b]'}`}
                  animate={{ opacity: activeKPI === i ? 1 : 0.7, scale: activeKPI === i ? 1.2 : 1 }}
                >
                  {pos.label}
                </motion.span>
              ))}
            </div>

            {/* Period Toggle */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex rounded-full p-1" style={{ background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(94,234,212,0.2)' }}>
              {(['monthly', 'quarterly', 'yearly'] as TimePeriod[]).map(p => (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${timePeriod === p ? 'bg-gradient-to-r from-[#22d3d3] to-[#5eead4] text-[#020617]' : 'text-[#64748b]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: AI PANEL */}
          <AIPanel
            isOpen={true}
            insights={insights}
            activeKPI={activeKPI !== null ? kpis[activeKPI].label : null}
            onClose={() => setActiveKPI(null)}
          />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a1628; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #0d4f4f; border-radius: 2px; }
      `}</style>
    </div>
  );
}