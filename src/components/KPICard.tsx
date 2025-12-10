// ============================================================================
// KPI CARD — Spotlight Mode with Glow
// ============================================================================

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface KPIData {
  id: string;
  label: string;
  value: number;
  format: (v: number) => string;
  unit: string;
  icon: React.ReactNode;
  relatedSliders: string[];
  trend: 'up' | 'down' | 'neutral';
}

interface KPICardProps {
  kpi: KPIData;
  isActive: boolean;
  isSpotlight: boolean;
  onClick: () => void;
}

export default function KPICard({ kpi, isActive, isSpotlight, onClick }: KPICardProps) {
  const dimmed = isSpotlight && !isActive;

  return (
    <motion.div
      onClick={onClick}
      className="relative cursor-pointer rounded-xl overflow-hidden"
      animate={{
        scale: isActive ? 1.12 : dimmed ? 0.94 : 1,
        opacity: dimmed ? 0.4 : 1,
        filter: dimmed ? 'grayscale(40%) brightness(0.7)' : 'none',
        zIndex: isActive ? 50 : 1,
        y: isActive ? -8 : 0,
      }}
      whileHover={{
        scale: isActive ? 1.12 : dimmed ? 0.94 : 1.04,
        y: isActive ? -8 : -2,
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, #0d4f4f, #14b8a6)'
          : 'linear-gradient(135deg, rgba(10,22,40,0.9), rgba(2,6,23,0.95))',
        border: isActive ? '2px solid #5eead4' : '1px solid rgba(94,234,212,0.1)',
        boxShadow: isActive
          ? '0 0 40px rgba(94,234,212,0.5), 0 15px 40px rgba(0,0,0,0.4)'
          : '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      {/* Active glow pulse */}
      {isActive && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(94,234,212,0.4), transparent 70%)',
          }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isActive ? 'bg-[#5eead4]/30' : 'bg-[#0a1628]'
            }`}
          >
            <span className={isActive ? 'text-[#5eead4]' : 'text-[#64748b]'}>{kpi.icon}</span>
          </div>
          <span
            className={`text-[9px] font-bold uppercase tracking-widest ${
              isActive ? 'text-[#5eead4]' : 'text-[#64748b]'
            }`}
          >
            {kpi.label}
          </span>
        </div>

        {/* Value */}
        <motion.div
          className={`text-2xl font-bold font-mono ${isActive ? 'text-white' : 'text-[#f1f5f9]'}`}
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          {kpi.format(kpi.value)}
          <span className="text-[10px] font-normal text-[#64748b] ml-1">{kpi.unit}</span>
        </motion.div>

        {/* Trend */}
        <div className="flex items-center gap-1 mt-1.5">
          {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-[#34d399]" />}
          {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 text-[#fbbf24]" />}
          <span
            className={`text-[9px] font-semibold ${
              kpi.trend === 'up'
                ? 'text-[#34d399]'
                : kpi.trend === 'down'
                ? 'text-[#fbbf24]'
                : 'text-[#64748b]'
            }`}
          >
            {kpi.trend === 'up' ? 'Healthy' : kpi.trend === 'down' ? 'Monitor' : 'Stable'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}