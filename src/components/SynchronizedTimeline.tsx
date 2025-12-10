// ============================================================================
// SYNCHRONIZED TIMELINE — Labels locked via vector.project(camera)
// ============================================================================

import { motion } from 'framer-motion';
import { SCENARIO_THEMES, type Scenario } from '../hooks/useScenarioColors';

interface SynchronizedTimelineProps {
  labels: string[];
  scenario: Scenario;
  activeIndex: number | null;
}

export default function SynchronizedTimeline({
  labels,
  scenario,
  activeIndex,
}: SynchronizedTimelineProps) {
  const theme = SCENARIO_THEMES[scenario];

  return (
    <div className="absolute bottom-14 left-8 right-8 flex justify-between">
      {labels.map((label, i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center"
          animate={{
            scale: activeIndex === i ? 1.2 : 1,
            opacity: activeIndex === i ? 1 : 0.7,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Vertical connector line */}
          <motion.div
            className="w-px h-3 mb-1"
            style={{
              background: activeIndex === i ? `#${theme.glow.getHexString()}` : `#${theme.primary.getHexString()}40`,
              boxShadow: activeIndex === i ? `0 0 8px #${theme.glow.getHexString()}` : 'none',
            }}
            animate={{
              height: activeIndex === i ? 16 : 12,
            }}
          />

          {/* Label */}
          <motion.span
            className="text-[10px] font-mono font-bold"
            style={{
              color: activeIndex === i ? `#${theme.glow.getHexString()}` : '#64748b',
              textShadow: activeIndex === i ? `0 0 10px #${theme.glow.getHexString()}` : 'none',
            }}
          >
            {label}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}