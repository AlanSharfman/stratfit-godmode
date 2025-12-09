// ============================================================================
// STRATFIT G-D MODE — TRILLIONAIRE EDITION v3.0
// "Tron Legacy meets Bloomberg Terminal"
// ============================================================================

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
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
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
type Scenario = 'base' | 'upside' | 'downside' | 'extreme';
type TimePeriod = 'monthly' | 'quarterly' | 'yearly';

interface DataPoint {
  name: string;
  baseline: number;
  operational: number;
  cashFlow: number;
  index: number;
}

interface KPI {
  id: string;
  label: string;
  value: number;
  format: (v: number) => string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  relatedSliders: string[];
  trend: 'up' | 'down' | 'neutral';
}

// ============================================================================
// CONSTANTS — NON-NEGOTIABLE PALETTE
// ============================================================================
const COLORS = {
  void: '#020617',
  valley: '#0a1628',
  deepTeal: '#0d4f4f',
  midTeal: '#14b8a6',
  cyan: '#22d3d3',
  peakGlow: '#5eead4',
  textMuted: '#64748b',
  textBright: '#f1f5f9',
  danger: '#ef4444',
  warning: '#f59e0b',
};

// ============================================================================
// FINANCIAL DATA GENERATOR
// ============================================================================
const generateFinancialData = (
  timePeriod: TimePeriod,
  scenario: Scenario,
  revenueGrowth: number,
  opex: number,
  burnRate: number,
  hiringRate: number,
  wageInflation: number
): DataPoint[] => {
  const periods = {
    monthly: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    quarterly: ['Q1', 'Q2', 'Q3', 'Q4'],
    yearly: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
  };

  const scenarioMultipliers = {
    base: 1.0,
    upside: 1.35,
    downside: 0.7,
    extreme: 1.8,
  };

  const labels = periods[timePeriod];
  const mult = scenarioMultipliers[scenario];
  const baseRevenue = 100;
  
  return labels.map((name, index) => {
    // Growth curve with compounding
    const growthFactor = Math.pow(1 + (revenueGrowth / 100) * 0.08, index);
    const seasonality = 1 + Math.sin((index / labels.length) * Math.PI * 2) * 0.15;
    
    // Baseline (ghost layer) — where we started
    const baseline = baseRevenue * 0.6;
    
    // Operational layer — revenue minus opex
    const revenue = baseRevenue * growthFactor * seasonality * mult;
    const opexImpact = revenue * (opex / 100) * 0.5;
    const operational = revenue - opexImpact;
    
    // Cash flow layer — operational minus burn and hiring costs
    const burnImpact = burnRate * 0.15 * (index + 1);
    const hiringImpact = hiringRate * 0.8 * (index + 1);
    const wageImpact = wageInflation * 0.3 * (index + 1);
    const cashFlow = Math.max(20, operational - burnImpact - hiringImpact - wageImpact);
    
    return {
      name,
      baseline,
      operational: Math.max(30, operational),
      cashFlow: Math.max(20, cashFlow),
      index,
    };
  });
};

// ============================================================================
// CUSTOM SLIDER COMPONENT
// ============================================================================
interface SliderProps {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  prefix?: string;
  highlighted?: boolean;
  inverse?: boolean;
}

const GodModeSlider = ({
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
  const [isDragging, setIsDragging] = useState(false);
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <motion.div
      className="relative"
      animate={{
        scale: highlighted ? 1.02 : 1,
        opacity: highlighted ? 1 : 0.9,
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-2">
        <span
          className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
            highlighted ? 'text-[#5eead4]' : 'text-[#64748b]'
          }`}
        >
          {label}
        </span>
        <motion.span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-colors duration-300 ${
            highlighted
              ? 'bg-[#5eead4]/20 text-[#5eead4]'
              : 'bg-[#0a1628] text-[#f1f5f9]'
          }`}
          animate={{ scale: isDragging ? 1.1 : 1 }}
        >
          {prefix}{value}{unit}
        </motion.span>
      </div>

      <div className="relative h-3 group">
        {/* Track Background */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            highlighted
              ? 'bg-[#0d4f4f] shadow-[0_0_20px_rgba(94,234,212,0.3)]'
              : 'bg-[#0a1628]'
          }`}
        />

        {/* Filled Track */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${percent}%`,
            background: highlighted
              ? `linear-gradient(90deg, #0d4f4f, #5eead4)`
              : inverse
              ? `linear-gradient(90deg, #0d4f4f, #f59e0b)`
              : `linear-gradient(90deg, #0d4f4f, #22d3d3)`,
            boxShadow: isDragging
              ? '0 0 20px rgba(94, 234, 212, 0.6)'
              : highlighted
              ? '0 0 15px rgba(94, 234, 212, 0.4)'
              : 'none',
          }}
          animate={{
            opacity: isDragging ? 1 : 0.9,
          }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full cursor-grab active:cursor-grabbing"
          style={{
            left: `calc(${percent}% - 10px)`,
            background: highlighted ? '#5eead4' : '#f1f5f9',
            boxShadow: isDragging
              ? '0 0 25px rgba(94, 234, 212, 0.8), 0 0 50px rgba(94, 234, 212, 0.4)'
              : highlighted
              ? '0 0 15px rgba(94, 234, 212, 0.5)'
              : '0 4px 15px rgba(0, 0, 0, 0.3)',
          }}
          animate={{
            scale: isDragging ? 1.3 : highlighted ? 1.1 : 1,
          }}
          whileHover={{ scale: 1.2 }}
        />

        {/* Invisible Input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// MULTI-LAYER MOUNTAIN COMPONENT
// ============================================================================
interface MountainProps {
  data: DataPoint[];
  activeKPIIndex: number | null;
  breathing: boolean;
}

const CinematicMountain = ({ data, activeKPIIndex, breathing }: MountainProps) => {
  const [mouseX, setMouseX] = useState(0.5);

  // Parallax effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseX((e.clientX - rect.left) / rect.width);
  };

  // Calculate parallax offsets
  const parallaxFront = (mouseX - 0.5) * 20;
  const parallaxMid = (mouseX - 0.5) * 10;
  const parallaxBack = (mouseX - 0.5) * 5;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Atmospheric Fog Gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 100%, rgba(94, 234, 212, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 30% 80%, rgba(34, 211, 211, 0.05) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 80%, rgba(20, 184, 166, 0.05) 0%, transparent 40%)
          `,
        }}
      />

      {/* Breathing Animation Wrapper */}
      <motion.div
        className="w-full h-full"
        animate={{
          scaleY: breathing ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 40, right: 30, left: 30, bottom: 60 }}
          >
            {/* Glow Filter Definitions */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glowIntense" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Layer Gradients */}
              <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.deepTeal} stopOpacity={0.15} />
                <stop offset="100%" stopColor={COLORS.valley} stopOpacity={0.05} />
              </linearGradient>

              <linearGradient id="operationalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.midTeal} stopOpacity={0.5} />
                <stop offset="50%" stopColor={COLORS.deepTeal} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.valley} stopOpacity={0.1} />
              </linearGradient>

              <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.peakGlow} stopOpacity={0.9} />
                <stop offset="40%" stopColor={COLORS.cyan} stopOpacity={0.6} />
                <stop offset="100%" stopColor={COLORS.deepTeal} stopOpacity={0.2} />
              </linearGradient>

              <linearGradient id="highlightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
                <stop offset="50%" stopColor={COLORS.peakGlow} stopOpacity={0.7} />
                <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0.3} />
              </linearGradient>
            </defs>

            {/* X-Axis — PERFECTLY ALIGNED */}
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: COLORS.textMuted,
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: 500,
              }}
              dy={15}
              interval={0}
            />

            {/* Y-Axis (Hidden but functional) */}
            <YAxis hide domain={[0, 'auto']} />

            {/* Grid Lines at Data Points */}
            {data.map((point, i) => (
              <ReferenceLine
                key={i}
                x={point.name}
                stroke={COLORS.deepTeal}
                strokeOpacity={0.3}
                strokeDasharray="3 3"
              />
            ))}

            {/* LAYER 1: Ghost Baseline (Back) */}
            <Area
              type="monotoneX"
              dataKey="baseline"
              stroke={COLORS.deepTeal}
              strokeWidth={1}
              strokeOpacity={0.3}
              fill="url(#baselineGradient)"
              style={{
                transform: `translateX(${parallaxBack}px)`,
                transition: 'transform 0.3s ease-out',
              }}
            />

            {/* LAYER 2: Operational (Mid) */}
            <Area
              type="monotoneX"
              dataKey="operational"
              stroke={COLORS.midTeal}
              strokeWidth={2}
              fill="url(#operationalGradient)"
              filter="url(#glow)"
              style={{
                transform: `translateX(${parallaxMid}px)`,
                transition: 'transform 0.3s ease-out',
              }}
            />

            {/* LAYER 3: Cash Flow (Front) — THE HERO */}
            <Area
              type="monotoneX"
              dataKey="cashFlow"
              stroke={activeKPIIndex !== null ? '#ffffff' : COLORS.peakGlow}
              strokeWidth={activeKPIIndex !== null ? 4 : 3}
              fill={activeKPIIndex !== null ? 'url(#highlightGradient)' : 'url(#cashFlowGradient)'}
              filter={activeKPIIndex !== null ? 'url(#glowIntense)' : 'url(#glow)'}
              style={{
                transform: `translateX(${parallaxFront}px)`,
                transition: 'transform 0.3s ease-out',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Peak Glow Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, rgba(94, 234, 212, 0.1) 0%, transparent 50%)`,
        }}
      />
    </div>
  );
};

// ============================================================================
// AI INSIGHT PANEL
// ============================================================================
interface AIInsightProps {
  isOpen: boolean;
  onClose: () => void;
  insights: string;
  isTyping: boolean;
}

const AIInsightPanel = ({ isOpen, onClose, insights, isTyping }: AIInsightProps) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (isOpen && insights) {
      setDisplayedText('');
      let index = 0;
      const timer = setInterval(() => {
        if (index < insights.length) {
          setDisplayedText(insights.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 12);
      return () => clearInterval(timer);
    }
  }, [isOpen, insights]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(2, 6, 23, 0.98))`,
            border: '1px solid rgba(94, 234, 212, 0.2)',
            boxShadow: '0 0 60px rgba(94, 234, 212, 0.15), inset 0 0 60px rgba(94, 234, 212, 0.05)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#0d4f4f]/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0d4f4f, #14b8a6)',
                  boxShadow: '0 0 20px rgba(94, 234, 212, 0.4)',
                }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(94, 234, 212, 0.4)',
                    '0 0 30px rgba(94, 234, 212, 0.6)',
                    '0 0 20px rgba(94, 234, 212, 0.4)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain className="w-5 h-5 text-[#5eead4]" />
              </motion.div>
              <div>
                <div className="text-sm font-bold text-[#f1f5f9]">CFO Intelligence</div>
                <div className="text-xs text-[#64748b]">Cash Sensitivity Analysis</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#0a1628] flex items-center justify-center text-[#64748b] hover:text-[#5eead4] hover:bg-[#0d4f4f] transition-all"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="text-sm text-[#94a3b8] leading-relaxed font-mono whitespace-pre-wrap">
              {displayedText}
              {isTyping && displayedText.length < insights.length && (
                <motion.span
                  className="inline-block w-2 h-4 bg-[#5eead4] ml-1"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </div>
          </div>

          {/* Glow Border Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              border: '1px solid transparent',
              background: 'linear-gradient(135deg, rgba(94, 234, 212, 0.1), transparent) border-box',
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================
interface KPICardProps {
  kpi: KPI;
  isActive: boolean;
  isSpotlightMode: boolean;
  onClick: () => void;
}

const KPICard = ({ kpi, isActive, isSpotlightMode, onClick }: KPICardProps) => {
  const dimmed = isSpotlightMode && !isActive;

  return (
    <motion.div
      onClick={onClick}
      className="relative cursor-pointer rounded-2xl overflow-hidden"
      animate={{
        scale: isActive ? 1.15 : dimmed ? 0.95 : 1,
        opacity: dimmed ? 0.4 : 1,
        filter: dimmed ? 'grayscale(50%)' : 'grayscale(0%)',
        zIndex: isActive ? 50 : 1,
      }}
      whileHover={{ scale: isActive ? 1.15 : 1.05 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${COLORS.deepTeal}, ${COLORS.midTeal})`
          : `linear-gradient(135deg, rgba(10, 22, 40, 0.8), rgba(2, 6, 23, 0.9))`,
        border: isActive
          ? `2px solid ${COLORS.peakGlow}`
          : '1px solid rgba(94, 234, 212, 0.1)',
        boxShadow: isActive
          ? `0 0 40px rgba(94, 234, 212, 0.5), 0 20px 40px rgba(0, 0, 0, 0.3)`
          : '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Glow Pulse for Active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(94, 234, 212, 0.3), transparent 70%)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isActive ? 'bg-[#5eead4]/30' : 'bg-[#0a1628]'
            }`}
          >
            <span className={isActive ? 'text-[#5eead4]' : 'text-[#64748b]'}>
              {kpi.icon}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              isActive ? 'text-[#5eead4]' : 'text-[#64748b]'
            }`}
          >
            {kpi.label}
          </span>
        </div>

        <motion.div
          className={`text-3xl font-bold font-mono ${
            isActive ? 'text-white' : 'text-[#f1f5f9]'
          }`}
          animate={{ scale: isActive ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5 }}
        >
          {kpi.format(kpi.value)}
          <span className={`text-sm font-normal ml-1 ${isActive ? 'text-[#5eead4]/70' : 'text-[#64748b]'}`}>
            {kpi.unit}
          </span>
        </motion.div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-1 mt-2">
          {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-[#5eead4]" />}
          {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 text-[#f59e0b]" />}
          <span
            className={`text-xs font-medium ${
              kpi.trend === 'up' ? 'text-[#5eead4]' : kpi.trend === 'down' ? 'text-[#f59e0b]' : 'text-[#64748b]'
            }`}
          >
            {kpi.trend === 'up' ? 'Healthy' : kpi.trend === 'down' ? 'Monitor' : 'Stable'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
const StratfitGodModeDashboard = () => {
  // ========== STATE ==========
  const [activeKPIIndex, setActiveKPIIndex] = useState<number | null>(null);
  const [scenario, setScenario] = useState<Scenario>('base');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Basic Sliders
  const [revenueGrowth, setRevenueGrowth] = useState(18);
  const [operatingExpenses, setOperatingExpenses] = useState(45);
  const [hiringRate, setHiringRate] = useState(12);
  const [wageInflation, setWageInflation] = useState(5);
  const [burnRate, setBurnRate] = useState(120);

  // Advanced Sliders
  const [cogs, setCogs] = useState(35);
  const [churn, setChurn] = useState(8);
  const [priceChange, setPriceChange] = useState(0);
  const [wacc, setWacc] = useState(12);
  const [terminalGrowth, setTerminalGrowth] = useState(3);
  const [revenueMultiple, setRevenueMultiple] = useState(8);
  const [ebitdaMultiple, setEbitdaMultiple] = useState(12);
  const [marketRisk, setMarketRisk] = useState(0);
  const [costInflation, setCostInflation] = useState(3);

  // ========== CALCULATIONS ==========
  const calculations = useMemo(() => {
    const scenarioMult = { base: 1, upside: 1.35, downside: 0.7, extreme: 1.8 }[scenario];
    const baseRevenue = 2.5;

    const revenue = baseRevenue * (1 + revenueGrowth / 100) * scenarioMult;
    const grossMargin = (100 - cogs) / 100;
    const opexCost = revenue * (operatingExpenses / 100) * 0.4;
    const wageCost = revenue * (wageInflation / 100) * 0.15;
    const ebitda = revenue * grossMargin - opexCost - wageCost;

    const monthlyBurn = burnRate;
    const cashReserve = 2500 + revenue * 400;
    const netBurn = monthlyBurn - (ebitda > 0 ? ebitda * 80 : 0);
    const runway = netBurn > 0 ? Math.round(cashReserve / netBurn) : 60;

    const riskFactors = (burnRate / 50) + (churn / 10) + (marketRisk / 20) - (revenueGrowth / 30);
    const riskScore = Math.max(1, Math.min(10, 5 + riskFactors));

    const valuation = (revenue * revenueMultiple + Math.max(0, ebitda) * ebitdaMultiple) / 2 * scenarioMult;

    return { revenue, ebitda, runway, riskScore, valuation, cashReserve, burnRate };
  }, [revenueGrowth, operatingExpenses, hiringRate, wageInflation, burnRate, cogs, churn, wacc, terminalGrowth, revenueMultiple, ebitdaMultiple, marketRisk, costInflation, scenario]);

  // ========== FINANCIAL DATA ==========
  const chartData = useMemo(
    () => generateFinancialData(timePeriod, scenario, revenueGrowth, operatingExpenses, burnRate, hiringRate, wageInflation),
    [timePeriod, scenario, revenueGrowth, operatingExpenses, burnRate, hiringRate, wageInflation]
  );

  // ========== KPIs ==========
  const kpis: KPI[] = useMemo(() => [
    {
      id: 'runway',
      label: 'Runway',
      value: calculations.runway,
      format: (v) => `${Math.min(60, v)}`,
      unit: 'Mo',
      icon: <Zap className="w-4 h-4" />,
      color: COLORS.peakGlow,
      relatedSliders: ['burnRate', 'revenueGrowth'],
      trend: calculations.runway > 24 ? 'up' : calculations.runway > 12 ? 'neutral' : 'down',
    },
    {
      id: 'cash',
      label: 'Cash',
      value: calculations.cashReserve,
      format: (v) => `$${(v / 1000).toFixed(1)}M`,
      unit: '',
      icon: <DollarSign className="w-4 h-4" />,
      color: COLORS.cyan,
      relatedSliders: ['revenueGrowth', 'burnRate'],
      trend: 'up',
    },
    {
      id: 'revGrowth',
      label: 'Revenue Growth',
      value: revenueGrowth,
      format: (v) => `+${v}`,
      unit: '%',
      icon: <TrendingUp className="w-4 h-4" />,
      color: COLORS.peakGlow,
      relatedSliders: ['revenueGrowth'],
      trend: revenueGrowth > 15 ? 'up' : 'neutral',
    },
    {
      id: 'ebitda',
      label: 'EBITDA',
      value: calculations.ebitda,
      format: (v) => `$${v.toFixed(1)}M`,
      unit: '',
      icon: <BarChart3 className="w-4 h-4" />,
      color: COLORS.midTeal,
      relatedSliders: ['operatingExpenses', 'wageInflation'],
      trend: calculations.ebitda > 0 ? 'up' : 'down',
    },
    {
      id: 'burn',
      label: 'Burn Rate',
      value: calculations.burnRate,
      format: (v) => `$${v}K`,
      unit: '/mo',
      icon: <TrendingDown className="w-4 h-4" />,
      color: COLORS.warning,
      relatedSliders: ['burnRate', 'hiringRate'],
      trend: burnRate < 100 ? 'up' : burnRate < 150 ? 'neutral' : 'down',
    },
    {
      id: 'risk',
      label: 'Risk Score',
      value: calculations.riskScore,
      format: (v) => `${v.toFixed(1)}`,
      unit: '/10',
      icon: <Shield className="w-4 h-4" />,
      color: calculations.riskScore < 5 ? COLORS.peakGlow : COLORS.warning,
      relatedSliders: ['burnRate', 'revenueGrowth'],
      trend: calculations.riskScore < 5 ? 'up' : calculations.riskScore < 7 ? 'neutral' : 'down',
    },
    {
      id: 'valuation',
      label: 'Valuation',
      value: calculations.valuation,
      format: (v) => `$${v.toFixed(0)}M`,
      unit: '',
      icon: <DollarSign className="w-4 h-4" />,
      color: COLORS.peakGlow,
      relatedSliders: ['revenueGrowth', 'operatingExpenses'],
      trend: 'up',
    },
  ], [calculations, revenueGrowth, burnRate]);

  // ========== AI INSIGHTS ==========
  const aiInsights = useMemo(() => {
    const insights: string[] = [];

    insights.push(`📊 SCENARIO: ${scenario.toUpperCase()}\n`);
    insights.push(`Revenue Growth Sensitivity:\nEach +1% improvement increases cash by ~$18,500 and extends runway by 0.4 months.\n`);

    if (operatingExpenses > 50) {
      insights.push(`⚠️ OPEX ALERT:\nOperating expenses at ${operatingExpenses}% are elevated. Each +1% reduces EBITDA by ~$27,000.\n`);
    }

    if (burnRate > 150) {
      insights.push(`🔥 BURN WARNING:\nBurn rate of $${burnRate}K/mo is high. Each +$10K shortens runway by 0.9 months.\n`);
    }

    if (calculations.riskScore > 6) {
      insights.push(`🔴 RISK ELEVATED:\nScore ${calculations.riskScore.toFixed(1)}/10 indicates exposure. Consider reducing burn or accelerating growth.\n`);
    } else {
      insights.push(`✅ RISK HEALTHY:\nScore ${calculations.riskScore.toFixed(1)}/10 indicates strong position. Runway of ${calculations.runway} months provides buffer.\n`);
    }

    insights.push(`💰 VALUATION:\n$${calculations.valuation.toFixed(0)}M based on ${revenueMultiple}x revenue + ${ebitdaMultiple}x EBITDA blended.`);

    return insights.join('\n');
  }, [scenario, operatingExpenses, burnRate, calculations, revenueMultiple, ebitdaMultiple]);

  // ========== HANDLERS ==========
  const handleKPIClick = (index: number) => {
    if (activeKPIIndex === index) {
      setActiveKPIIndex(null);
      setShowAIPanel(false);
    } else {
      setActiveKPIIndex(index);
      setShowAIPanel(true);
    }
  };

  const isSliderHighlighted = (sliderId: string) => {
    if (activeKPIIndex === null) return false;
    return kpis[activeKPIIndex].relatedSliders.includes(sliderId);
  };

  // ========== RENDER ==========
  return (
    <div
      className="min-h-screen text-white font-sans overflow-x-hidden"
      style={{ background: COLORS.void }}
    >
      {/* ==================== HEADER ==================== */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#0d4f4f]/30">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.deepTeal}, ${COLORS.midTeal})`,
              boxShadow: '0 0 30px rgba(94, 234, 212, 0.3)',
            }}
            animate={{
              boxShadow: [
                '0 0 30px rgba(94, 234, 212, 0.3)',
                '0 0 50px rgba(94, 234, 212, 0.5)',
                '0 0 30px rgba(94, 234, 212, 0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap className="w-6 h-6 text-[#5eead4]" />
          </motion.div>
          <div>
            <div className="text-2xl font-bold tracking-tight">
              STRATFIT
              <span className="ml-2 text-xs font-normal tracking-widest text-[#64748b]">
                G-D MODE
              </span>
            </div>
            <div className="text-xs text-[#64748b]">Scenario Intelligence Platform</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Scenario Selector */}
          <div className="flex bg-[#0a1628] rounded-full p-1 border border-[#0d4f4f]/50">
            {(['base', 'upside', 'downside', 'extreme'] as Scenario[]).map((s) => (
              <motion.button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  scenario === s ? 'text-[#020617]' : 'text-[#64748b] hover:text-[#5eead4]'
                }`}
                style={{
                  background: scenario === s
                    ? `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.peakGlow})`
                    : 'transparent',
                  boxShadow: scenario === s ? '0 0 20px rgba(94, 234, 212, 0.4)' : 'none',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {s}
              </motion.button>
            ))}
          </div>

          {/* PDF Export */}
          <motion.button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: 'rgba(10, 22, 40, 0.8)',
              border: '1px solid rgba(94, 234, 212, 0.3)',
              color: COLORS.peakGlow,
            }}
            whileHover={{
              boxShadow: '0 0 30px rgba(94, 234, 212, 0.3)',
              borderColor: 'rgba(94, 234, 212, 0.6)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </motion.button>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="p-6 space-y-6">
        {/* ========== KPI CARDS ========== */}
        <div className="grid grid-cols-7 gap-4">
          {kpis.map((kpi, index) => (
            <KPICard
              key={kpi.id}
              kpi={kpi}
              isActive={activeKPIIndex === index}
              isSpotlightMode={activeKPIIndex !== null}
              onClick={() => handleKPIClick(index)}
            />
          ))}
        </div>

        {/* ========== MOUNTAIN + SLIDERS ========== */}
        <div className="grid grid-cols-[1fr_340px] gap-6">
          {/* Mountain Container */}
          <motion.div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${COLORS.valley}, ${COLORS.void})`,
              border: '1px solid rgba(94, 234, 212, 0.15)',
              boxShadow: '0 0 80px rgba(94, 234, 212, 0.1), inset 0 0 80px rgba(94, 234, 212, 0.03)',
            }}
            animate={{
              boxShadow: activeKPIIndex !== null
                ? '0 0 100px rgba(94, 234, 212, 0.2), inset 0 0 100px rgba(94, 234, 212, 0.05)'
                : '0 0 80px rgba(94, 234, 212, 0.1), inset 0 0 80px rgba(94, 234, 212, 0.03)',
            }}
          >
            <div className="h-[450px]">
              <CinematicMountain
                data={chartData}
                activeKPIIndex={activeKPIIndex}
                breathing={true}
              />
            </div>

            {/* Period Toggle */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <div className="flex bg-[#0a1628]/90 rounded-full p-1 backdrop-blur-sm border border-[#0d4f4f]/50">
                {(['monthly', 'quarterly', 'yearly'] as TimePeriod[]).map((p) => (
                  <motion.button
                    key={p}
                    onClick={() => setTimePeriod(p)}
                    className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      timePeriod === p ? 'text-[#020617]' : 'text-[#64748b]'
                    }`}
                    style={{
                      background: timePeriod === p
                        ? `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.peakGlow})`
                        : 'transparent',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {p}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sliders Panel */}
          <div className="space-y-5">
            {/* Basic Sliders */}
            <motion.div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(2, 6, 23, 0.95))',
                border: '1px solid rgba(94, 234, 212, 0.15)',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <motion.div
                  className="w-2 h-2 rounded-full bg-[#5eead4]"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-bold text-[#f1f5f9]">Core Drivers</span>
              </div>

              <div className="space-y-5">
                <GodModeSlider
                  id="revenueGrowth"
                  label="Revenue Growth"
                  value={revenueGrowth}
                  onChange={setRevenueGrowth}
                  min={-20}
                  max={100}
                  highlighted={isSliderHighlighted('revenueGrowth')}
                />
                <GodModeSlider
                  id="operatingExpenses"
                  label="Operating Expenses"
                  value={operatingExpenses}
                  onChange={setOperatingExpenses}
                  min={20}
                  max={80}
                  highlighted={isSliderHighlighted('operatingExpenses')}
                  inverse
                />
                <GodModeSlider
                  id="hiringRate"
                  label="Hiring Rate"
                  value={hiringRate}
                  onChange={setHiringRate}
                  min={0}
                  max={50}
                  highlighted={isSliderHighlighted('hiringRate')}
                />
                <GodModeSlider
                  id="wageInflation"
                  label="Wage Inflation"
                  value={wageInflation}
                  onChange={setWageInflation}
                  min={0}
                  max={20}
                  highlighted={isSliderHighlighted('wageInflation')}
                  inverse
                />
                <GodModeSlider
                  id="burnRate"
                  label="Burn Rate"
                  value={burnRate}
                  onChange={setBurnRate}
                  min={50}
                  max={300}
                  unit="K/mo"
                  prefix="$"
                  highlighted={isSliderHighlighted('burnRate')}
                  inverse
                />
              </div>
            </motion.div>

            {/* Advanced Toggle */}
            <motion.button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{
                background: showAdvanced
                  ? 'linear-gradient(135deg, rgba(13, 79, 79, 0.5), rgba(20, 184, 166, 0.3))'
                  : 'rgba(10, 22, 40, 0.8)',
                border: `1px solid ${showAdvanced ? 'rgba(94, 234, 212, 0.4)' : 'rgba(94, 234, 212, 0.15)'}`,
                color: showAdvanced ? COLORS.peakGlow : COLORS.textMuted,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Mode
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5eead4]/20 text-[#5eead4]">
                PRO
              </span>
            </motion.button>

            {/* Advanced Sliders */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-5 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(2, 6, 23, 0.95))',
                    border: '1px solid rgba(94, 234, 212, 0.2)',
                  }}
                >
                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    <GodModeSlider label="COGS" value={cogs} onChange={setCogs} min={10} max={70} />
                    <GodModeSlider label="Customer Churn" value={churn} onChange={setChurn} min={0} max={30} inverse />
                    <GodModeSlider label="Price Change" value={priceChange} onChange={setPriceChange} min={-20} max={20} />
                    <GodModeSlider label="WACC" value={wacc} onChange={setWacc} min={5} max={25} inverse />
                    <GodModeSlider label="Terminal Growth" value={terminalGrowth} onChange={setTerminalGrowth} min={0} max={10} />
                    <GodModeSlider label="Revenue Multiple" value={revenueMultiple} onChange={setRevenueMultiple} min={2} max={20} unit="x" />
                    <GodModeSlider label="EBITDA Multiple" value={ebitdaMultiple} onChange={setEbitdaMultiple} min={4} max={25} unit="x" />
                    <GodModeSlider label="Market Risk" value={marketRisk} onChange={setMarketRisk} min={0} max={30} inverse />
                    <GodModeSlider label="Cost Inflation" value={costInflation} onChange={setCostInflation} min={0} max={15} inverse />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ========== AI INSIGHT PANEL ========== */}
        <AIInsightPanel
          isOpen={showAIPanel}
          onClose={() => {
            setShowAIPanel(false);
            setActiveKPIIndex(null);
          }}
          insights={aiInsights}
          isTyping={true}
        />
      </div>

      {/* ==================== GLOBAL STYLES ==================== */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${COLORS.valley};
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${COLORS.deepTeal};
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.midTeal};
        }
      `}</style>
    </div>
  );
};

export default StratfitGodModeDashboard;