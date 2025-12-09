// ============================================================================
// STRATFIT G-D MODE — FINAL CTO-APPROVED DASHBOARD
// Bloomberg Terminal × Iron Man × Neon AI Supercomputer
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
  danger: '#ef4444',
  warning: '#f59e0b',
};

// ============================================================================
// TIMELINE LABELS
// ============================================================================
const TIMELINE_LABELS = {
  monthly: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  quarterly: ['Q1', 'Q2', 'Q3', 'Q4'],
  yearly: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'],
};

// ============================================================================
// SCENARIO DESCRIPTIONS
// ============================================================================
const SCENARIO_DESCRIPTIONS: Record<Scenario, string> = {
  base: 'Baseline projection with current growth trajectory',
  upside: 'Optimistic scenario — Growth +18% YoY, reduced churn',
  downside: 'Conservative scenario — Growth +5% YoY, market headwinds',
  extreme: 'Aggressive expansion — Growth +35% YoY, new markets',
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
): number[] => {
  const pointCount = {
    monthly: 12,
    quarterly: 4,
    yearly: 5,
  }[timePeriod];

  const scenarioMultipliers = {
    base: 1.0,
    upside: 1.35,
    downside: 0.7,
    extreme: 1.8,
  };

  const mult = scenarioMultipliers[scenario];
  const baseValue = 40;

  return Array.from({ length: pointCount }, (_, i) => {
    // Growth curve
    const growthFactor = Math.pow(1 + (revenueGrowth / 100) * 0.1, i);
    
    // Seasonality
    const seasonality = 1 + Math.sin((i / pointCount) * Math.PI * 2) * 0.2;
    
    // Cost impacts
    const opexDrag = (opex / 100) * 15;
    const burnDrag = (burnRate / 200) * 10;
    const hiringBoost = (hiringRate / 50) * 5;
    const wageDrag = (wageInflation / 20) * 8;

    const value = (baseValue + (i * 5)) * growthFactor * seasonality * mult 
                  - opexDrag - burnDrag - wageDrag + hiringBoost;

    return Math.max(15, Math.min(100, value));
  });
};

// ============================================================================
// CUSTOM SLIDER COMPONENT
// ============================================================================
interface SliderProps {
  id: string;
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
  id,
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
        scale: highlighted ? 1.03 : 1,
        opacity: highlighted ? 1 : 0.85,
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-2">
        <span
          className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${
            highlighted ? 'text-[#5eead4]' : 'text-[#64748b]'
          }`}
        >
          {label}
        </span>
        <motion.span
          className={`text-xs font-mono font-bold px-2 py-1 rounded-md transition-all duration-300 ${
            highlighted
              ? 'bg-[#5eead4]/20 text-[#5eead4] shadow-[0_0_10px_rgba(94,234,212,0.3)]'
              : 'bg-[#0a1628] text-[#f1f5f9]'
          }`}
          animate={{ scale: isDragging ? 1.15 : 1 }}
        >
          {prefix}{value}{unit}
        </motion.span>
      </div>

      <div className="relative h-3 group">
        {/* Track Background */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            highlighted
              ? 'bg-[#0d4f4f]/80 shadow-[0_0_20px_rgba(94,234,212,0.4)]'
              : 'bg-[#0a1628]/80'
          }`}
        />

        {/* Filled Track */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          initial={false}
          animate={{
            width: `${percent}%`,
            boxShadow: isDragging
              ? '0 0 25px rgba(94, 234, 212, 0.8)'
              : highlighted
              ? '0 0 15px rgba(94, 234, 212, 0.5)'
              : 'none',
          }}
          transition={{ duration: 0.1 }}
          style={{
            background: highlighted
              ? `linear-gradient(90deg, #0d4f4f, #5eead4)`
              : inverse
              ? `linear-gradient(90deg, #0d4f4f, #f59e0b)`
              : `linear-gradient(90deg, #0d4f4f, #22d3d3)`,
          }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full cursor-grab active:cursor-grabbing"
          initial={false}
          animate={{
            left: `calc(${percent}% - 10px)`,
            scale: isDragging ? 1.4 : highlighted ? 1.15 : 1,
            boxShadow: isDragging
              ? '0 0 30px rgba(94, 234, 212, 1), 0 0 60px rgba(94, 234, 212, 0.5)'
              : highlighted
              ? '0 0 20px rgba(94, 234, 212, 0.6)'
              : '0 4px 15px rgba(0, 0, 0, 0.4)',
          }}
          transition={{ duration: 0.1 }}
          style={{
            background: highlighted || isDragging ? '#5eead4' : '#f1f5f9',
          }}
        />

        {/* Invisible Input */}
        <input
          id={id}
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
// KPI CARD COMPONENT
// ============================================================================
interface KPICardProps {
  kpi: KPI;
  index: number;
  isActive: boolean;
  isSpotlightMode: boolean;
  onClick: () => void;
  showTooltip: boolean;
  onToggleTooltip: () => void;
}

const KPICard = ({
  kpi,
  index: _index,
  isActive,
  isSpotlightMode,
  onClick,
  showTooltip,
  onToggleTooltip,
}: KPICardProps) => {
  const dimmed = isSpotlightMode && !isActive;

  return (
    <motion.div
      onClick={onClick}
      className="relative cursor-pointer rounded-2xl overflow-hidden"
      animate={{
        scale: isActive ? 1.15 : dimmed ? 0.92 : 1,
        opacity: dimmed ? 0.35 : 1,
        filter: dimmed ? 'grayscale(60%) brightness(0.6)' : 'grayscale(0%) brightness(1)',
        zIndex: isActive ? 50 : 1,
        y: isActive ? -10 : 0,
      }}
      whileHover={{ scale: isActive ? 1.15 : dimmed ? 0.92 : 1.05, y: isActive ? -10 : -3 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${COLORS.valley}, ${COLORS.midTeal})`
          : `linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(2, 6, 23, 0.95))`,
        border: isActive
          ? `2px solid ${COLORS.peakGlow}`
          : '1px solid rgba(94, 234, 212, 0.1)',
        boxShadow: isActive
          ? `0 0 50px rgba(94, 234, 212, 0.6), 0 25px 50px rgba(0, 0, 0, 0.4)`
          : '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Active Glow Pulse */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(94, 234, 212, 0.4), transparent 70%)`,
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
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
          
          {/* Info Tooltip Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleTooltip();
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              showTooltip
                ? 'bg-[#5eead4] text-[#0a1628]'
                : 'bg-[#0a1628]/50 text-[#64748b] hover:text-[#5eead4]'
            }`}
          >
            <Info className="w-3 h-3" />
          </button>
        </div>

        {/* Value */}
        <motion.div
          className={`text-3xl font-bold font-mono ${isActive ? 'text-white' : 'text-[#f1f5f9]'}`}
          animate={{ scale: isActive ? [1, 1.08, 1] : 1 }}
          transition={{ duration: 0.6 }}
        >
          {kpi.format(kpi.value)}
          <span className={`text-sm font-normal ml-1 ${isActive ? 'text-[#5eead4]/70' : 'text-[#64748b]'}`}>
            {kpi.unit}
          </span>
        </motion.div>

        {/* Trend */}
        <div className="flex items-center gap-1 mt-2">
          {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-[#5eead4]" />}
          {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 text-[#f59e0b]" />}
          <span
            className={`text-xs font-semibold ${
              kpi.trend === 'up' ? 'text-[#5eead4]' : kpi.trend === 'down' ? 'text-[#f59e0b]' : 'text-[#64748b]'
            }`}
          >
            {kpi.trend === 'up' ? 'Healthy' : kpi.trend === 'down' ? 'Monitor' : 'Stable'}
          </span>
        </div>

        {/* Expandable Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="text-xs text-[#94a3b8] leading-relaxed border-t border-[#0d4f4f]/50 pt-3"
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
// SCENARIO SELECTOR (CENTERED, PROMINENT)
// ============================================================================
interface ScenarioSelectorProps {
  scenario: Scenario;
  onScenarioChange: (s: Scenario) => void;
}

const ScenarioSelector = ({ scenario, onScenarioChange }: ScenarioSelectorProps) => {
  return (
    <div className="flex flex-col items-center gap-3 mb-4">
      {/* Segmented Control */}
      <div
        className="flex rounded-2xl p-1.5"
        style={{
          background: 'rgba(10, 22, 40, 0.9)',
          border: '1px solid rgba(94, 234, 212, 0.2)',
          boxShadow: '0 0 40px rgba(94, 234, 212, 0.1)',
        }}
      >
        {(['base', 'upside', 'downside', 'extreme'] as Scenario[]).map((s) => (
          <motion.button
            key={s}
            onClick={() => onScenarioChange(s)}
            className={`px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              scenario === s ? 'text-[#020617]' : 'text-[#64748b] hover:text-[#5eead4]'
            }`}
            style={{
              background: scenario === s
                ? `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.peakGlow})`
                : 'transparent',
              boxShadow: scenario === s ? '0 0 25px rgba(94, 234, 212, 0.5)' : 'none',
            }}
            whileHover={{ scale: scenario === s ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {s}
          </motion.button>
        ))}
      </div>

      {/* Description */}
      <motion.p
        key={scenario}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-[#64748b] text-center"
      >
        <span className="text-[#5eead4] font-semibold">Current Simulation:</span>{' '}
        {SCENARIO_DESCRIPTIONS[scenario]}
      </motion.p>
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
  activeKPI: string | null;
}

const AIInsightPanel = ({ isOpen, onClose, insights, activeKPI }: AIInsightProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isOpen && insights) {
      setDisplayedText('');
      setIsTyping(true);
      let index = 0;
      const timer = setInterval(() => {
        if (index < insights.length) {
          setDisplayedText(insights.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 10);
      return () => clearInterval(timer);
    }
  }, [isOpen, insights]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(2, 6, 23, 0.99))`,
            border: '1px solid rgba(94, 234, 212, 0.25)',
            boxShadow: '0 0 80px rgba(94, 234, 212, 0.2), inset 0 0 60px rgba(94, 234, 212, 0.05)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#0d4f4f]/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0d4f4f, #14b8a6)',
                  boxShadow: '0 0 30px rgba(94, 234, 212, 0.5)',
                }}
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(94, 234, 212, 0.5)',
                    '0 0 50px rgba(94, 234, 212, 0.8)',
                    '0 0 30px rgba(94, 234, 212, 0.5)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain className="w-6 h-6 text-[#5eead4]" />
              </motion.div>
              <div>
                <div className="text-base font-bold text-[#f1f5f9]">CFO Intelligence Engine</div>
                <div className="text-xs text-[#64748b]">
                  {activeKPI ? `Analyzing: ${activeKPI}` : 'Cash Sensitivity Analysis'}
                </div>
              </div>
              
              {isTyping && (
                <div className="flex gap-1 ml-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#5eead4]"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center text-[#64748b] hover:text-[#5eead4] hover:bg-[#0d4f4f] transition-all text-lg"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-sm text-[#94a3b8] leading-loose font-mono whitespace-pre-wrap">
              {displayedText}
              {isTyping && (
                <motion.span
                  className="inline-block w-2.5 h-5 bg-[#5eead4] ml-1 align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const [tooltipKPI, setTooltipKPI] = useState<number | null>(null);

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

    return { revenue, ebitda, runway, riskScore, valuation, cashReserve, burnRate: monthlyBurn };
  }, [revenueGrowth, operatingExpenses, hiringRate, wageInflation, burnRate, cogs, churn, wacc, terminalGrowth, revenueMultiple, ebitdaMultiple, marketRisk, costInflation, scenario]);

  // ========== CHART DATA ==========
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
      description: 'Months of operation remaining at current burn rate. Target: 18+ months for healthy runway.',
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
      description: 'Total cash reserves available. Includes operating cash and credit facilities.',
      relatedSliders: ['revenueGrowth', 'burnRate'],
      trend: 'up',
    },
    {
      id: 'revGrowth',
      label: 'Rev Growth',
      value: revenueGrowth,
      format: (v) => `+${v}`,
      unit: '%',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Year-over-year revenue growth rate. Industry benchmark: 15-25% for growth stage.',
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
      description: 'Earnings before interest, taxes, depreciation & amortization. Key profitability metric.',
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
      description: 'Monthly cash consumption rate. Lower is better for runway extension.',
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
      description: 'Composite risk assessment. Lower score = lower risk. Factors: burn, churn, market conditions.',
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
      description: 'Estimated enterprise value based on revenue and EBITDA multiples.',
      relatedSliders: ['revenueGrowth', 'operatingExpenses'],
      trend: 'up',
    },
  ], [calculations, revenueGrowth, burnRate]);

  // ========== AI INSIGHTS ==========
  const aiInsights = useMemo(() => {
    const lines: string[] = [];
    const activeKPI = activeKPIIndex !== null ? kpis[activeKPIIndex] : null;

    lines.push(`📊 SCENARIO: ${scenario.toUpperCase()}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (activeKPI) {
      lines.push(`🎯 FOCUS: ${activeKPI.label.toUpperCase()}`);
      lines.push(`Current Value: ${activeKPI.format(activeKPI.value)}${activeKPI.unit}`);
      lines.push(`Status: ${activeKPI.trend === 'up' ? '✅ Healthy' : activeKPI.trend === 'down' ? '⚠️ Needs Attention' : '➖ Stable'}\n`);
    }

    lines.push(`💰 CASH SENSITIVITY ANALYSIS:`);
    lines.push(`• Revenue Growth: Each +1% adds ~$18,500 cash, extends runway by 0.4 months`);
    lines.push(`• Operating Expenses: Each +1% reduces EBITDA by ~$27,000`);
    lines.push(`• Burn Rate: Each +$10K/mo shortens runway by 0.9 months`);
    lines.push(`• Wage Inflation: +5% wage increase = -$64,000 annual cash\n`);

    if (calculations.riskScore > 6) {
      lines.push(`🔴 RISK ALERT: Score ${calculations.riskScore.toFixed(1)}/10 indicates elevated exposure.`);
      lines.push(`   Recommendation: Reduce burn rate or accelerate revenue growth.\n`);
    } else {
      lines.push(`✅ RISK HEALTHY: Score ${calculations.riskScore.toFixed(1)}/10 indicates strong position.`);
      lines.push(`   Runway of ${calculations.runway} months provides adequate buffer.\n`);
    }

    lines.push(`📈 VALUATION: $${calculations.valuation.toFixed(0)}M`);
    lines.push(`   Based on ${revenueMultiple}x revenue + ${ebitdaMultiple}x EBITDA blended multiple.`);

    return lines.join('\n');
  }, [scenario, activeKPIIndex, kpis, calculations, revenueMultiple, ebitdaMultiple]);

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

  const timelineLabels = TIMELINE_LABELS[timePeriod];

  // ========== RENDER ==========
  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden" style={{ background: COLORS.void }}>
      
      {/* ==================== HEADER ==================== */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#0d4f4f]/30">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.valley}, ${COLORS.midTeal})`,
              boxShadow: '0 0 40px rgba(94, 234, 212, 0.4)',
            }}
            animate={{
              boxShadow: [
                '0 0 40px rgba(94, 234, 212, 0.4)',
                '0 0 60px rgba(94, 234, 212, 0.6)',
                '0 0 40px rgba(94, 234, 212, 0.4)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap className="w-6 h-6 text-[#5eead4]" />
          </motion.div>
          <div>
            <div className="text-2xl font-bold tracking-tight">
              STRATFIT
              <span className="ml-3 text-xs font-bold tracking-[0.3em] text-[#5eead4]">
                G-D MODE
              </span>
            </div>
            <div className="text-xs text-[#64748b] tracking-wide">Scenario Intelligence Platform</div>
          </div>
        </div>

        <motion.button
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
          style={{
            background: 'rgba(10, 22, 40, 0.9)',
            border: '1px solid rgba(94, 234, 212, 0.3)',
            color: COLORS.peakGlow,
          }}
          whileHover={{
            boxShadow: '0 0 40px rgba(94, 234, 212, 0.4)',
            borderColor: 'rgba(94, 234, 212, 0.6)',
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          Export PDF
        </motion.button>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="p-6 space-y-6">
        
        {/* ========== KPI CARDS ========== */}
        <div className="grid grid-cols-7 gap-4">
          {kpis.map((kpi, index) => (
            <KPICard
              key={kpi.id}
              kpi={kpi}
              index={index}
              isActive={activeKPIIndex === index}
              isSpotlightMode={activeKPIIndex !== null}
              onClick={() => handleKPIClick(index)}
              showTooltip={tooltipKPI === index}
              onToggleTooltip={() => setTooltipKPI(tooltipKPI === index ? null : index)}
            />
          ))}
        </div>

        {/* ========== SCENARIO SELECTOR (CENTERED) ========== */}
        <ScenarioSelector scenario={scenario} onScenarioChange={setScenario} />

        {/* ========== RIDGE + SLIDERS ========== */}
        <div className="grid grid-cols-[1fr_360px] gap-6">
          
          {/* NEON RIDGE ENGINE */}
          <motion.div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: COLORS.background,
              border: '1px solid rgba(94, 234, 212, 0.15)',
              boxShadow: '0 0 100px rgba(94, 234, 212, 0.1), inset 0 0 100px rgba(94, 234, 212, 0.03)',
            }}
            animate={{
              boxShadow: activeKPIIndex !== null
                ? '0 0 120px rgba(94, 234, 212, 0.2), inset 0 0 120px rgba(94, 234, 212, 0.06)'
                : '0 0 100px rgba(94, 234, 212, 0.1), inset 0 0 100px rgba(94, 234, 212, 0.03)',
            }}
          >
            <div className="h-[420px]">
              <NeonRidgeEngine
                dataPoints={chartData}
                activeKPIIndex={activeKPIIndex}
                scenario={scenario}
                timePeriod={timePeriod}
              />
            </div>

            {/* Timeline Labels — PERFECTLY ALIGNED */}
            <div className="absolute bottom-16 left-8 right-8">
              <div className="flex justify-between">
                {timelineLabels.map((label, i) => (
                  <motion.div
                    key={label}
                    className="flex flex-col items-center"
                    animate={{
                      opacity: activeKPIIndex === i ? 1 : 0.7,
                      scale: activeKPIIndex === i ? 1.2 : 1,
                    }}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mb-2 transition-all ${
                        activeKPIIndex === i
                          ? 'bg-[#5eead4] shadow-[0_0_10px_rgba(94,234,212,0.8)]'
                          : i < timelineLabels.length / 2
                          ? 'bg-[#22d3d3]'
                          : 'bg-[#0d4f4f]'
                      }`}
                    />
                    <span
                      className={`text-xs font-mono font-bold transition-all ${
                        activeKPIIndex === i
                          ? 'text-[#5eead4]'
                          : i < timelineLabels.length / 2
                          ? 'text-[#94a3b8]'
                          : 'text-[#475569]'
                      }`}
                    >
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Period Toggle */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div
                className="flex rounded-full p-1"
                style={{
                  background: 'rgba(10, 22, 40, 0.95)',
                  border: '1px solid rgba(94, 234, 212, 0.2)',
                }}
              >
                {(['monthly', 'quarterly', 'yearly'] as TimePeriod[]).map((p) => (
                  <motion.button
                    key={p}
                    onClick={() => setTimePeriod(p)}
                    className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
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

          {/* SLIDERS PANEL */}
          <div className="space-y-5">
            
            {/* Basic Sliders */}
            <motion.div
              className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(2, 6, 23, 0.98))',
                border: '1px solid rgba(94, 234, 212, 0.15)',
              }}
            >
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-[#5eead4]"
                  animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-bold text-[#f1f5f9] tracking-wide">Core Drivers</span>
              </div>

              <div className="space-y-6">
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
              className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3"
              style={{
                background: showAdvanced
                  ? 'linear-gradient(135deg, rgba(13, 79, 79, 0.6), rgba(20, 184, 166, 0.4))'
                  : 'rgba(10, 22, 40, 0.9)',
                border: `1px solid ${showAdvanced ? 'rgba(94, 234, 212, 0.5)' : 'rgba(94, 234, 212, 0.15)'}`,
                color: showAdvanced ? COLORS.peakGlow : COLORS.textMuted,
              }}
              whileHover={{ scale: 1.02, borderColor: 'rgba(94, 234, 212, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Mode
              <span className="text-[10px] px-2 py-1 rounded-full bg-[#5eead4]/20 text-[#5eead4] font-bold">
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
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl p-5 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(2, 6, 23, 0.98))',
                    border: '1px solid rgba(94, 234, 212, 0.25)',
                  }}
                >
                  <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <GodModeSlider id="cogs" label="COGS" value={cogs} onChange={setCogs} min={10} max={70} />
                    <GodModeSlider id="churn" label="Customer Churn" value={churn} onChange={setChurn} min={0} max={30} inverse />
                    <GodModeSlider id="priceChange" label="Price Change" value={priceChange} onChange={setPriceChange} min={-20} max={20} />
                    <GodModeSlider id="wacc" label="WACC" value={wacc} onChange={setWacc} min={5} max={25} inverse />
                    <GodModeSlider id="terminalGrowth" label="Terminal Growth" value={terminalGrowth} onChange={setTerminalGrowth} min={0} max={10} />
                    <GodModeSlider id="revenueMultiple" label="Revenue Multiple" value={revenueMultiple} onChange={setRevenueMultiple} min={2} max={20} unit="x" />
                    <GodModeSlider id="ebitdaMultiple" label="EBITDA Multiple" value={ebitdaMultiple} onChange={setEbitdaMultiple} min={4} max={25} unit="x" />
                    <GodModeSlider id="marketRisk" label="Market Risk" value={marketRisk} onChange={setMarketRisk} min={0} max={30} inverse />
                    <GodModeSlider id="costInflation" label="Cost Inflation" value={costInflation} onChange={setCostInflation} min={0} max={15} inverse />
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
          activeKPI={activeKPIIndex !== null ? kpis[activeKPIIndex].label : null}
        />
      </div>

      {/* ==================== GLOBAL STYLES ==================== */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${COLORS.background};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${COLORS.valley};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.midTeal};
        }
      `}</style>
    </div>
  );
};

export default StratfitGodModeDashboard;