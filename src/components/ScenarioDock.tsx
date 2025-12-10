// ============================================================================
// SCENARIO DOCK — Premium Centered Selector
// ============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Sparkles } from 'lucide-react';
import { SCENARIO_THEMES, type Scenario } from '../hooks/useScenarioColors';

interface ScenarioDockProps {
  scenario: Scenario;
  onChange: (s: Scenario) => void;
}

export default function ScenarioDock({ scenario, onChange }: ScenarioDockProps) {
  const [showHelp, setShowHelp] = useState(false);
  const theme = SCENARIO_THEMES[scenario];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Premium Pill Container */}
      <motion.div
        className="relative flex items-center gap-1 rounded-2xl p-1.5"
        style={{
          background: 'linear-gradient(135deg, rgba(10,22,40,0.95), rgba(2,6,23,0.98))',
          border: '1px solid rgba(94,234,212,0.2)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.4), 0 0 50px rgba(94,234,212,0.08)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, #${theme.primary.getHexString()}20, transparent 70%)`,
          }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Scenario Buttons */}
        {(['base', 'upside', 'downside', 'extreme'] as Scenario[]).map((s) => {
          const cfg = SCENARIO_THEMES[s];
          const active = scenario === s;

          return (
            <motion.button
              key={s}
              onClick={() => onChange(s)}
              className="relative px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider z-10"
              style={{
                color: active ? '#020617' : '#64748b',
                background: active ? `#${cfg.primary.getHexString()}` : 'transparent',
                boxShadow: active ? `0 0 25px #${cfg.primary.getHexString()}60` : 'none',
              }}
              whileHover={{
                scale: active ? 1 : 1.05,
                color: active ? '#020617' : `#${cfg.primary.getHexString()}`,
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {active && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{ background: `#${cfg.primary.getHexString()}30` }}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span>{cfg.icon}</span>
                {cfg.label}
              </span>
            </motion.button>
          );
        })}

        {/* Help Button */}
        <div className="relative ml-2 pl-2 border-l border-[#0d4f4f] z-10">
          <motion.button
            onClick={() => setShowHelp(!showHelp)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: showHelp ? 'rgba(94,234,212,0.2)' : 'rgba(10,22,40,0.8)',
              color: showHelp ? '#5eead4' : '#64748b',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <HelpCircle className="w-4 h-4" />
          </motion.button>

          {/* Tooltip */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-3 w-72 p-4 rounded-xl z-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(10,22,40,0.98), rgba(2,6,23,0.99))',
                  border: '1px solid rgba(94,234,212,0.25)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                }}
              >
                <div className="text-xs font-bold text-[#5eead4] mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  SCENARIO GUIDE
                </div>
                {(['base', 'upside', 'downside', 'extreme'] as Scenario[]).map((s) => {
                  const cfg = SCENARIO_THEMES[s];
                  return (
                    <div key={s} className="flex gap-2 mb-2">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: `#${cfg.primary.getHexString()}` }}
                      />
                      <div>
                        <div className="text-[11px] font-bold text-white">{cfg.label}</div>
                        <div className="text-[10px] text-[#64748b] leading-relaxed">{cfg.tip}</div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Current Label */}
      <motion.div
        key={scenario}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm flex items-center gap-2"
      >
        <span className="text-[#64748b]">Active:</span>
        <span className="font-bold" style={{ color: `#${theme.primary.getHexString()}` }}>
          {theme.label}
        </span>
        <span className="text-[#475569]">—</span>
        <span className="text-[#94a3b8]">{theme.description}</span>
      </motion.div>
    </div>
  );
}