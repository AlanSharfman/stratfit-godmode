// src/components/simulate/SimulateOverlay.tsx
// STRATFIT — The God Mode Verdict Display

import type { SimulateVerdict } from '@/logic/simulateReducer';
import styles from './SimulateOverlay.module.css';

interface Props {
  verdict: SimulateVerdict;
  onClose: () => void;
}

export default function SimulateOverlay({ verdict, onClose }: Props) {
  const { survivalPct, outcomeBuckets, valuationRange, simulationCount, runTimeMs } = verdict;

  // Color based on survival
  const heroColor = survivalPct >= 70 ? '#22c55e' 
    : survivalPct >= 50 ? '#eab308' 
    : survivalPct >= 30 ? '#f97316' 
    : '#ef4444';

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLabel}>SIMULATE</div>
          <div className={styles.headerSub}>10,000 Futures</div>
        </div>

        {/* Hero: Survival % */}
        <div className={styles.hero}>
          <div className={styles.heroLabel}>Survival Probability</div>
          <div className={styles.heroValue} style={{ color: heroColor }}>
            {survivalPct}%
          </div>
          <div className={styles.heroSub}>of {simulationCount.toLocaleString()} simulated futures</div>
        </div>

        {/* Outcome Distribution */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Outcome Distribution</div>
          <div className={styles.outcomes}>
            <OutcomeRow emoji="💀" label="Crash" pct={outcomeBuckets.crashPct} color="#ef4444" />
            <OutcomeRow emoji="😰" label="Survive" pct={outcomeBuckets.survivePct} color="#f97316" />
            <OutcomeRow emoji="📈" label="Grow" pct={outcomeBuckets.growPct} color="#22c55e" />
            <OutcomeRow emoji="🚀" label="Breakout" pct={outcomeBuckets.breakoutPct} color="#06b6d4" />
          </div>
        </div>

        {/* Valuation Range */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>36-Month Valuation Range</div>
          <div className={styles.range}>
            <div className={styles.rangeItem}>
              <span className={styles.rangeLabel}>P10</span>
              <span className={styles.rangeValue}>${valuationRange.p10}M</span>
            </div>
            <div className={`${styles.rangeItem} ${styles.rangeMedian}`}>
              <span className={styles.rangeLabel}>Median</span>
              <span className={styles.rangeValue}>${valuationRange.p50}M</span>
            </div>
            <div className={styles.rangeItem}>
              <span className={styles.rangeLabel}>P90</span>
              <span className={styles.rangeValue}>${valuationRange.p90}M</span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className={styles.meta}>
          {simulationCount.toLocaleString()} simulations · {runTimeMs}ms
        </div>
      </div>
    </div>
  );
}

function OutcomeRow({ emoji, label, pct, color }: { emoji: string; label: string; pct: number; color: string }) {
  return (
    <div className={styles.outcomeRow}>
      <div className={styles.outcomeLabel}>
        <span>{emoji}</span>
        <span>{label}</span>
      </div>
      <div className={styles.outcomeBar}>
        <div className={styles.outcomeBarFill} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className={styles.outcomePct}>{pct}%</div>
    </div>
  );
}

