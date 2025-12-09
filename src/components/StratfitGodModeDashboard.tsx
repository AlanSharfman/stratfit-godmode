// ============================================================================
// STRATFIT G-D MODE — COMPLETE REBUILD v8.0
// Layout: KPIs → Scenario Dock → Mountain → Sliders → AI Panel (right)
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
  HelpCircle,
} from 'lucide-react';
import SplineEngine from './SplineEngine';

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
// CONSTANTS
// ============================================================================
const COLORS = {
  void: '#020617',
  bg: '#0a1628',
  valley: '#0d4f4f',
  mid: '#14b8a6',
  cyan: '#22d3d3',
  glow: '#5eead4',
  muted: '#64748b',
  bright: '#f1f5f9',
};

const SCENARIO_CONFIG: Record<Scenario, { label: string; desc: string; color: string; tip: string }> = {
  base: {
    label: 'Base',
    desc: 'Current growth trajectory',
    color: '#22d3d3',
    tip: 'Your baseline projection using current trends and assumptions.',
  },
  upside: {
    label: 'Upside',
    desc: 'Optimistic +18% YoY',
    color: '#42ffb2',
    tip: 'Best-case scenario with accelerated growth and reduced churn.',
  },
  downside: {
    label: 'Downside',
    desc: 'Conservative +5% YoY',
    color: '#ff9d3c',
    tip: 'Defensive scenario accounting for market headwinds.',
  },
  extreme: {
    label: 'Extreme',
    desc: 'Aggressive expansion +35%',
    color: '#d946ef',
    tip: 'Maximum growth scenario with new market expansion.',
  },
};

const SLIDER_INFO: Record<string, string> = {
  revenueGrowth: 'Year-over-year revenue increase. Higher growth extends runway and improves valuation.',
  opex: 'Operating expenses as % of revenue. Lower is better for EBITDA.',
  hiringRate: 'New hires as % of current headcount. Impacts burn rate significantly.',
  wageInflation: 'Average salary increase %. Compounds cash burn over time.',
  burnRate: 'Monthly cash consumption. Primary driver of runway.',
  cogs: 'Cost of goods sold. Directly impacts gross margin.',
  churn: 'Customer attrition rate. High churn = revenue leakage.',
  priceChange: 'Pricing adjustment. Positive = price increase.',
  wacc: 'Weighted average cost of capital. Used in DCF valuation.',
  terminalGrowth: 'Long-term sustainable growth rate.',
  revMultiple: 'Revenue multiple for valuation.',
  ebitdaMultiple: 'EBITDA multiple for valuation.',
  marketRisk: 'External risk factor adjustment.',
  costInflation: 'General cost increase rate.',
};

// ============================================================================
// DATA GENERATOR
// ============================================================================
const generateData = (
  period: TimePeriod,
  scenario: Scenario,
  revGrowth: number,
  opex: number,
  burn: number,
  hiring: number,
  wage: number
): number[] => {
  const count = { monthly: 12, quarterly: 4, yearly: 5 }[period];
  const mult = { base: 1, upside: 1.35, downside: 0.7, extreme: 1.8 }[scenario];

  return Array.from({ length: count }, (_, i) => {
    const growth = Math.pow(1 + (revGrowth / 100) * 0.1, i);
    const season = 1 + Math.sin((i / count) * Math.PI * 2) * 0.12;
    const costs = (opex / 100) * 10 + (burn / 200) * 8 + (wage / 20) * 5;
    const boost = (hiring / 50) * 3;
    const base = 32 + i * 5;
    return Math.max(18, Math.min(92, base * growth * season * mult - costs + boost));
  });
};

// ============================================================================
// INFO TOOLTIP COMPONENT
// ============================================================================
const InfoTooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="cursor-help"
      >
        {children}
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl text-xs text-[#94a3b8] leading-relaxed"
            style={{
              background: 'linear-gradient(135deg, rgba(10,22,40,0.98), rgba(2,6,23,0.99))',
              border: '1px solid rgba(94,234,212,0.3)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            {text}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2.5 h-2.5 bg-[#0a1628] border-r border-b border-[rgba(94,234,212,0.3)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// SLIDER COMPONENT
// ============================================================================
interface SliderProps {
  id: string;
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
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <motion.div
      animate={{ scale: highlighted ? 1.02 : 1 }}
      className="relative"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-semibold ${highlighted ? 'text-[#5eead4]' : 'text-[#64748b]'}`}>
            {label}
          </span>
          <InfoTooltip text={SLIDER_INFO[id] || 'Adjust this value to see impact.'}>
            <Info className="w-3 h-3 text-[#475569] hover:text-[#5eead4] transition-colors" />
          </InfoTooltip>
        </div>
        <motion.span
          animate={{ scale: dragging ? 1.1 : 1 }}
          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
            highlighted ? 'bg-[#5eead4]/20 text-[#5eead4]' : 'bg-[#0a1628] text-white'
          }`}
        >
          {prefix}{value}{unit}
        </motion.span>
      </div>

      <div className={`relative h-2 rounded-full ${highlighted ? 'bg-[#0d4f4f]/80' : 'bg-[#0a1628]'}`}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          animate={{
            width: `${pct}%`,
            boxShadow: dragging ? '0 0 20px rgba(94,234,212,0.6)' : 'none',
          }}
          style={{
            background: highlighted
              ? 'linear-gradient(90deg, #0d4f4f, #5eead4)'
              : inverse
              ? 'linear-gradient(90deg, #0d4f4f, #f59e0b)'
              : 'linear-gradient(90deg, #0d4f4f, #22d3d3)',
          }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg"
          animate={{
            left: `calc(${pct}% - 8px)`,
            scale: dragging ? 1.3 : highlighted ? 1.1 : 1,
            backgroundColor: highlighted || dragging ? '#5eead4' : '#ffffff',
            boxShadow: dragging ? '0 0 20px rgba(94,234,212,0.8)' : '0 2px 8px rgba(0,0,0,0.3)',
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
// KPI CARD COMPONENT
// ============================================================================
interface KPICardProps {
  kpi: KPI;
  isActive: boolean;
  isSpotlight: boolean;
  onClick: () => void;
}

const KPICard = ({ kpi, isActive, isSpotlight, onClick }: KPICardProps) => {
  const dimmed = isSpotlight && !isActive;
  const [showInfo, setShowInfo] = useState(false);

  return (
    <motion.div
      onClick={onClick}
      className="relative cursor-pointer rounded-xl overflow-hidden"
      animate={{
        scale: isActive ? 1.15 : dimmed ? 0.92 : 1,
        opacity: dimmed ? 0.4 : 1,
        filter: dimmed ? 'grayscale(50%) brightness(0.6)' : 'none',
        zIndex: isActive ? 50 : 1,
        y: isActive ? -6 : 0,
      }}
      whileHover={{ scale: isActive ? 1.15 : dimmed ? 0.92 : 1.03 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, #0d4f4f, #14b8a6)'
          : 'linear-gradient(135deg, rgba(10,22,40,0.9), rgba(2,6,23,0.95))',
        border: isActive ? '2px solid #5eead4' : '1px solid rgba(94,234,212,0.1)',
        boxShadow: isActive
          ? '0 0 40px rgba(94,234,212,0.5), 0 15px 35px rgba(0,0,0,0.3)'
          : '0 4px 15px rgba(0,0,0,0.2)',
      }}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-[#5eead4]/30 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isActive ? 'bg-[#5eead4]/30' : 'bg-[#0a1628]'}`}>
              <span className={`text-xs ${isActive ? 'text-[#5eead4]' : 'text-[#64748b]'}`}>{kpi.icon}</span>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-[#5eead4]' : 'text-[#64748b]'}`}>
              {kpi.label}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
            className={`w-4 h-4 rounded-full flex items-center justify-center ${showInfo ? 'bg-[#5eead4] text-[#0a1628]' : 'text-[#475569] hover:text-[#5eead4]'}`}
          >
            <HelpCircle className="w-3 h-3" />
          </button>
        </div>

        <div className={`text-xl font-bold font-mono ${isActive ? 'text-white' : 'text-[#f1f5f9]'}`}>
          {kpi.format(kpi.value)}
          <span className="text-[10px] font-normal text-[#64748b] ml-1">{kpi.unit}</span>
        </div>

        <div className="flex items-center gap-1 mt-1">
          {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-[#5eead4]" />}
          {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 text-[#f59e0b]" />}
          <span className={`text-[9px] font-semibold ${kpi.trend === 'up' ? 'text-[#5eead4]' : kpi.trend === 'down' ? 'text-[#f59e0b]' : 'text-[#64748b]'}`}>
            {kpi.trend === 'up' ? 'Healthy' : kpi.trend === 'down' ? 'Monitor' : 'Stable'}
          </span>
        </div>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[9px] text-[#94a3b8] mt-2 pt-2 border-t border-[#0d4f4f]/50"
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
// SCENARIO DOCK (CENTERED + PROMINENT)
// ============================================================================
interface ScenarioDockProps {
  scenario: Scenario;
  onChange: (s: Scenario) => void;
}

const ScenarioDock = ({ scenario, onChange }: ScenarioDockProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex rounded-2xl p-1.5 gap-1"
        style={{
          background: 'rgba(10,22,40,0.95)',
          border: '1px solid rgba(94,234,212,0.2)',
          boxShadow: '0 0 50px rgba(94,234,212,0.1)',
        }}
      >
        {(['base', 'upside', 'downside', 'extreme'] as Scenario[]).map((s) => (
          <div key={s} className="flex items-center">
            <motion.button
              onClick={() => onChange(s)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                scenario === s ? 'text-[#020617]' : 'text-[#64748b] hover:text-[#5eead4]'
              }`}
              style={{
                background: scenario === s
                  ? `linear-gradient(135deg, ${SCENARIO_CONFIG[s].color}, ${COLORS.glow})`
                  : 'transparent',
                boxShadow: scenario === s ? `0 0 25px ${SCENARIO_CONFIG[s].color}50` : 'none',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {s}
            </motion.button>
            <InfoTooltip text={SCENARIO_CONFIG[s].tip}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#475569] hover:text-[#5eead4] cursor-help ml-0.5">
                <Info className="w-3 h-3" />
              </div>
            </InfoTooltip>
          </div>
        ))}
      </div>
      <motion.p
        key={scenario}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-[#64748b]"
      >
        <span className="font-semibold" style={{ color: SCENARIO_CONFIG[scenario].color }}>
          Active:
        </span>{' '}
        {SCENARIO_CONFIG[scenario].desc}
      </motion.p>
    </div>
  );
};

// ============================================================================
// AI PANEL (RIGHT SIDE)
// ============================================================================
interface AIPanelProps {
  insights: string;
  activeKPI: string | null;
}

const AIPanel = ({ insights, activeKPI }: AIPanelProps) => {
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
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
    }, 6);
    return () => clearInterval(timer);
  }, [insights]);

  return (
    <div
      className="h-full rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10,22,40,0.98), rgba(2,6,23,0.99))',
        border: '1px solid rgba(94,234,212,0.2)',
        boxShadow: '0 0 60px rgba(94,234,212,0.12)',
      }}
    >
      <div className="flex items-center gap-3 p-4 border-b border-[#0d4f4f]/50">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#0d4f4f] to-[#14b8a6]"
          animate={{
            boxShadow: ['0 0 20px rgba(94,234,212,0.4)', '0 0 35px rgba(94,234,212,0.6)', '0 0 20px rgba(94,234,212,0.4)'],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="w-5 h-5 text-[#5eead4]" />
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">CFO Intelligence</div>
          <div className="text-[10px] text-[#64748b]">
            {activeKPI ? `Focus: ${activeKPI}` : 'Cash Sensitivity'}
          </div>
        </div>
        {typing && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#5eead4]"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="text-[11px] text-[#94a3b8] leading-relaxed font-mono whitespace-pre-wrap">
          {text}
          {typing && (
            <motion.span
              className="inline-block w-1.5 h-3.5 bg-[#5eead4] ml-0.5 align-middle"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </div>
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
  const [timelinePositions, setTimelinePositions] = useState<{ x: number; y: number; label: string }[]>([]);

  // Basic Sliders
  const [revGrowth, setRevGrowth] = useState(18);
  const [opex, setOpex] = useState(45);
  const [hiring, setHiring] = useState(12);
  const [wage, setWage] = useState(5);
  const [burn, setBurn] = useState(120);

  // Advanced Sliders
  const [cogs, setCogs] = useState(35);
  const [churn, setChurn] = useState(8);
  const [price, setPrice] = useState(0);
  const [wacc, setWacc] = useState(12);
  const [termGrowth, setTermGrowth] = useState(3);
  const [revMult, setRevMult] = useState(8);
  const [ebitdaMult, setEbitdaMult] = useState(12);
  const [mktRisk, setMktRisk] = useState(0);
  const [costInfl, setCostInfl] = useState(3);

  // Calculations
  const calc = useMemo(() => {
    const mult = { base: 1, upside: 1.35, downside: 0.7, extreme: 1.8 }[scenario];
    const rev = 2.5 * (1 + revGrowth / 100) * mult;
    const margin = (100 - cogs) / 100;
    const ebitda = rev * margin - rev * (opex / 100) * 0.4;
    const cash = 2500 + rev * 400;
    const runway = burn > 0 ? Math.round(cash / burn) : 60;
    const risk = Math.max(1, Math.min(10, 5 + burn / 50 + churn / 10 - revGrowth / 30));
    const val = (rev * revMult + Math.max(0, ebitda) * ebitdaMult) / 2 * mult;
    return { rev, ebitda, cash, runway, risk, val, burn };
  }, [revGrowth, opex, burn, cogs, churn, scenario, revMult, ebitdaMult]);

  // Chart data
  const chartData = useMemo(
    () => generateData(timePeriod, scenario, revGrowth, opex, burn, hiring, wage),
    [timePeriod, scenario, revGrowth, opex, burn, hiring, wage]
  );

  // KPIs
  const kpis: KPI[] = useMemo(() => [
    { id: 'runway', label: 'Runway', value: calc.runway, format: v => `${Math.min(60, v)}`, unit: 'Mo', icon: <Zap className="w-3.5 h-3.5" />, description: 'Months of operation at current burn.', relatedSliders: ['burnRate', 'revenueGrowth'], trend: calc.runway > 24 ? 'up' : calc.runway > 12 ? 'neutral' : 'down' },
    { id: 'cash', label: 'Cash', value: calc.cash, format: v => `$${(v / 1000).toFixed(1)}M`, unit: '', icon: <DollarSign className="w-3.5 h-3.5" />, description: 'Total cash reserves.', relatedSliders: ['revenueGrowth', 'burnRate'], trend: 'up' },
    { id: 'growth', label: 'Growth', value: revGrowth, format: v => `+${v}`, unit: '%', icon: <TrendingUp className="w-3.5 h-3.5" />, description: 'Revenue growth YoY.', relatedSliders: ['revenueGrowth'], trend: revGrowth > 15 ? 'up' : 'neutral' },
    { id: 'ebitda', label: 'EBITDA', value: calc.ebitda, format: v => `$${v.toFixed(1)}M`, unit: '', icon: <BarChart3 className="w-3.5 h-3.5" />, description: 'Profitability metric.', relatedSliders: ['opex', 'wageInflation'], trend: calc.ebitda > 0 ? 'up' : 'down' },
    { id: 'burn', label: 'Burn', value: calc.burn, format: v => `$${v}K`, unit: '/mo', icon: <TrendingDown className="w-3.5 h-3.5" />, description: 'Monthly cash consumption.', relatedSliders: ['burnRate', 'hiringRate'], trend: burn < 100 ? 'up' : burn < 150 ? 'neutral' : 'down' },
    { id: 'risk', label: 'Risk', value: calc.risk, format: v => v.toFixed(1), unit: '/10', icon: <Shield className="w-3.5 h-3.5" />, description: 'Composite risk score.', relatedSliders: ['burnRate', 'revenueGrowth'], trend: calc.risk < 5 ? 'up' : calc.risk < 7 ? 'neutral' : 'down' },
    { id: 'val', label: 'Value', value: calc.val, format: v => `$${v.toFixed(0)}M`, unit: '', icon: <DollarSign className="w-3.5 h-3.5" />, description: 'Enterprise valuation.', relatedSliders: ['revenueGrowth', 'opex'], trend: 'up' },
  ], [calc, revGrowth, burn]);

  // AI Insights
  const insights = useMemo(() => {
    const lines = [];
    const kpi = activeKPI !== null ? kpis[activeKPI] : null;

    lines.push(`📊 ${scenario.toUpperCase()} SCENARIO`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (kpi) {
      lines.push(`🎯 FOCUS: ${kpi.label.toUpperCase()}`);
      lines.push(`Current: ${kpi.format(kpi.value)}${kpi.unit}`);
      lines.push(`Status: ${kpi.trend === 'up' ? '✅ Healthy' : kpi.trend === 'down' ? '⚠️ Monitor' : '➖ Stable'}\n`);
    }

    lines.push(`💰 CASH SENSITIVITY:`);
    lines.push(`• Revenue +1% → +$18.5K cash`);
    lines.push(`• OpEx +1% → -$27K EBITDA`);
    lines.push(`• Burn +$10K → -0.9mo runway\n`);

    if (calc.risk > 6) {
      lines.push(`🔴 ALERT: Risk ${calc.risk.toFixed(1)}/10`);
      lines.push(`Action: Reduce burn or boost growth.\n`);
    } else {
      lines.push(`✅ HEALTHY: Risk ${calc.risk.toFixed(1)}/10`);
      lines.push(`${calc.runway}mo runway is strong.\n`);
    }

    lines.push(`📈 VALUATION: $${calc.val.toFixed(0)}M`);

    return lines.join('\n');
  }, [scenario, activeKPI, kpis, calc]);

  const isHighlighted = (id: string) => activeKPI !== null && kpis[activeKPI].relatedSliders.includes(id);

  return (
    <div className="min-h-screen text-white font-sans" style={{ background: COLORS.void }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[#0d4f4f]/30">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#0d4f4f] to-[#14b8a6]"
            animate={{ boxShadow: ['0 0 25px rgba(94,234,212,0.3)', '0 0 40px rgba(94,234,212,0.5)', '0 0 25px rgba(94,234,212,0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap className="w-5 h-5 text-[#5eead4]" />
          </motion.div>
          <div>
            <div className="text-lg font-bold">STRATFIT <span className="text-[#5eead4] text-[10px] tracking-[0.25em] ml-2">G-D MODE</span></div>
            <div className="text-[9px] text-[#64748b]">Scenario Intelligence Platform</div>
          </div>
        </div>
        <motion.button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
          style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(94,234,212,0.3)', color: COLORS.glow }}
          whileHover={{ boxShadow: '0 0 25px rgba(94,234,212,0.3)' }}
        >
          <Download className="w-3.5 h-3.5" /> Export
        </motion.button>
      </header>

      <div className="p-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-7 gap-2.5">
          {kpis.map((kpi, i) => (
            <KPICard
              key={kpi.id}
              kpi={kpi}
              isActive={activeKPI === i}
              isSpotlight={activeKPI !== null}
              onClick={() => setActiveKPI(activeKPI === i ? null : i)}
            />
          ))}
        </div>

        {/* SCENARIO DOCK */}
        <ScenarioDock scenario={scenario} onChange={setScenario} />

        {/* MAIN: Mountain + AI */}
        <div className="grid grid-cols-[1fr_280px] gap-4">
          {/* Mountain Container */}
          <div className="relative rounded-2xl overflow-hidden" style={{ background: COLORS.bg, border: '1px solid rgba(94,234,212,0.15)', height: '340px' }}>
            <SplineEngine
              dataPoints={chartData}
              scenario={scenario}
              timePeriod={timePeriod}
              activeKPIIndex={activeKPI}
              onTimelineUpdate={setTimelinePositions}
            />

            {/* Timeline Labels */}
            <div className="absolute bottom-12 left-6 right-6 flex justify-between">
              {timelinePositions.map((pos, i) => (
                <motion.span
                  key={i}
                  className={`text-[10px] font-mono font-bold ${activeKPI === i ? 'text-[#5eead4]' : 'text-[#64748b]'}`}
                  animate={{ opacity: activeKPI === i ? 1 : 0.7, scale: activeKPI === i ? 1.15 : 1 }}
                >
                  {pos.label}
                </motion.span>
              ))}
            </div>

            {/* Period Toggle */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex rounded-full p-1" style={{ background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(94,234,212,0.2)' }}>
              {(['monthly', 'quarterly', 'yearly'] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase ${timePeriod === p ? 'bg-gradient-to-r from-[#22d3d3] to-[#5eead4] text-[#020617]' : 'text-[#64748b]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI Panel */}
          <AIPanel insights={insights} activeKPI={activeKPI !== null ? kpis[activeKPI].label : null} />
        </div>

        {/* SLIDERS (UNDER MOUNTAIN) */}
        <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(10,22,40,0.95), rgba(2,6,23,0.98))', border: '1px solid rgba(94,234,212,0.15)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.div className="w-2 h-2 rounded-full bg-[#5eead4]" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <span className="text-xs font-bold text-white">Financial Drivers</span>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748b] hover:text-[#5eead4]"
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Advanced
              <span className="px-1.5 py-0.5 rounded-full bg-[#5eead4]/20 text-[#5eead4] text-[8px]">PRO</span>
            </button>
          </div>

          {/* Basic Sliders Row */}
          <div className="grid grid-cols-5 gap-4">
            <Slider id="revenueGrowth" label="Revenue Growth" value={revGrowth} onChange={setRevGrowth} min={-20} max={100} highlighted={isHighlighted('revenueGrowth')} />
            <Slider id="opex" label="Operating Expenses" value={opex} onChange={setOpex} min={20} max={80} highlighted={isHighlighted('opex')} inverse />
            <Slider id="hiringRate" label="Hiring Rate" value={hiring} onChange={setHiring} min={0} max={50} highlighted={isHighlighted('hiringRate')} />
            <Slider id="wageInflation" label="Wage Inflation" value={wage} onChange={setWage} min={0} max={20} highlighted={isHighlighted('wageInflation')} inverse />
            <Slider id="burnRate" label="Burn Rate" value={burn} onChange={setBurn} min={50} max={300} unit="K" prefix="$" highlighted={isHighlighted('burnRate')} inverse />
          </div>

          {/* Advanced Sliders */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-[#0d4f4f]/50"
              >
                <Slider id="cogs" label="COGS" value={cogs} onChange={setCogs} min={10} max={70} />
                <Slider id="churn" label="Churn" value={churn} onChange={setChurn} min={0} max={30} inverse />
                <Slider id="priceChange" label="Price Change" value={price} onChange={setPrice} min={-20} max={20} />
                <Slider id="wacc" label="WACC" value={wacc} onChange={setWacc} min={5} max={25} inverse />
                <Slider id="terminalGrowth" label="Terminal Growth" value={termGrowth} onChange={setTermGrowth} min={0} max={10} />
                <Slider id="revMultiple" label="Rev Multiple" value={revMult} onChange={setRevMult} min={2} max={20} unit="x" />
                <Slider id="ebitdaMultiple" label="EBITDA Multiple" value={ebitdaMult} onChange={setEbitdaMult} min={4} max={25} unit="x" />
                <Slider id="marketRisk" label="Market Risk" value={mktRisk} onChange={setMktRisk} min={0} max={30} inverse />
                <Slider id="costInflation" label="Cost Inflation" value={costInfl} onChange={setCostInfl} min={0} max={15} inverse />
              </motion.div>
            )}
          </AnimatePresence>
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