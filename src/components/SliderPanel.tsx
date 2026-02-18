// ============================================================================
// SLIDER PANEL — Custom Neon Sliders (NO default HTML)
// ============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================================
// SLIDER INFO TIPS
// ============================================================================
const SLIDER_TIPS: Record<string, string> = {
  revenueGrowth: 'YoY revenue increase. +1% extends runway ~0.4 months.',
  opex: 'Operating expenses as % of revenue.',
  hiringRate: 'New hires as % of headcount.',
  wageInflation: 'Average salary increase rate.',
  burnRate: 'Monthly cash consumption.',
  cogs: 'Cost of goods sold.',
  churn: 'Customer attrition rate.',
  priceChange: 'Pricing adjustment percentage.',
  wacc: 'Weighted average cost of capital.',
  terminalGrowth: 'Long-term growth rate.',
  revMultiple: 'Revenue valuation multiple.',
  ebitdaMultiple: 'EBITDA valuation multiple.',
};

// ============================================================================
// SINGLE SLIDER COMPONENT
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

function PremiumSlider({
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
}: SliderProps) {
  const [dragging, setDragging] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <motion.div
      className="relative"
      animate={{
        scale: highlighted ? 1.02 : 1,
        filter: highlighted ? 'brightness(1.1)' : 'brightness(1)',
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Label Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[11px] font-semibold ${highlighted ? 'text-[#5eead4]' : 'text-[#94a3b8]'}`}
          >
            {label}
          </span>
          <button onClick={() => setShowTip(!showTip)} className="opacity-50 hover:opacity-100">
            <Info className="w-3 h-3 text-[#64748b]" />
          </button>
        </div>
        <motion.div
          className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg ${
            highlighted ? 'bg-[#5eead4]/20 text-[#5eead4]' : 'bg-[#0a1628] text-[#f1f5f9]'
          }`}
          animate={{ scale: dragging ? 1.1 : 1 }}
        >
          {prefix}
          {value}
          {unit}
        </motion.div>
      </div>

      {/* Tip Tooltip */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 text-[10px] text-[#64748b] bg-[#0a1628]/50 rounded-lg p-2"
          >
            {SLIDER_TIPS[id] || 'Adjust to see impact.'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slider Track */}
      <div
        className={`relative h-2.5 rounded-full ${highlighted ? 'bg-[#0d4f4f]/80' : 'bg-[#0a1628]/80'}`}
      >
        {/* Filled portion */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: highlighted
              ? 'linear-gradient(90deg, #14b8a6, #5eead4)'
              : inverse
              ? 'linear-gradient(90deg, #14b8a6, #fbbf24)'
              : 'linear-gradient(90deg, #14b8a6, #22d3d3)',
            boxShadow: dragging ? '0 0 20px rgba(94,234,212,0.6)' : 'none',
          }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg"
          style={{
            left: `calc(${pct}% - 10px)`,
            background: highlighted || dragging ? '#5eead4' : '#ffffff',
            boxShadow: dragging ? '0 0 25px rgba(94,234,212,0.9)' : '0 2px 10px rgba(0,0,0,0.4)',
          }}
          animate={{ scale: dragging ? 1.4 : highlighted ? 1.15 : 1 }}
        />

        {/* Hidden input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// SLIDER PANEL EXPORT
// ============================================================================
interface SliderPanelProps {
  sliders: {
    basic: { id: string; label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit?: string; prefix?: string; inverse?: boolean }[];
    advanced: { id: string; label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit?: string; prefix?: string; inverse?: boolean }[];
  };
  highlightedSliders: string[];
}

export default function SliderPanel({ sliders, highlightedSliders }: SliderPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isHighlighted = (id: string) => highlightedSliders.includes(id);

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(10,22,40,0.95), rgba(2,6,23,0.98))',
        border: '1px solid rgba(94,234,212,0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-[#5eead4]"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
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

      {/* Basic Sliders */}
      <div className="grid grid-cols-5 gap-5">
        {sliders.basic.map((s) => (
          <PremiumSlider
            key={s.id}
            id={s.id}
            label={s.label}
            value={s.value}
            onChange={s.onChange}
            min={s.min}
            max={s.max}
            unit={s.unit}
            prefix={s.prefix}
            highlighted={isHighlighted(s.id)}
            inverse={s.inverse}
          />
        ))}
      </div>

      {/* Advanced Sliders */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-5 gap-5 mt-5 pt-5 border-t border-[#0d4f4f]/50"
          >
            {sliders.advanced.map((s) => (
              <PremiumSlider
                key={s.id}
                id={s.id}
                label={s.label}
                value={s.value}
                onChange={s.onChange}
                min={s.min}
                max={s.max}
                unit={s.unit}
                prefix={s.prefix}
                highlighted={isHighlighted(s.id)}
                inverse={s.inverse}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}