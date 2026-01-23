// src/components/simulate/SimulateView.tsx
// STRATFIT — The Verdict Screen
// Authority aesthetic. No spectacle.

import type { SimulateVerdict } from '@/logic/simulateReducer';
import styles from './SimulateView.module.css';

interface Props {
  verdict: SimulateVerdict;
  onBack: () => void;
}

export default function SimulateView({ verdict, onBack }: Props) {
  const {
    survivalPct,
    tier,
    tierLabel,
    outcomeBuckets,
    valuationRange,
    killSwitch,
    causality,
    simulationCount,
    runTimeMs,
    isOverlyOptimistic,
    isHighUncertainty,
    isKillSwitchViolated,
  } = verdict;

  // Tier colors
  const tierColors: Record<string, { text: string; accent: string; bg: string }> = {
    HIGH_RISK: { text: '#ef4444', accent: '#dc2626', bg: 'rgba(239, 68, 68, 0.08)' },
    MODERATE: { text: '#eab308', accent: '#ca8a04', bg: 'rgba(234, 179, 8, 0.08)' },
    VIABLE: { text: '#22c55e', accent: '#16a34a', bg: 'rgba(34, 197, 94, 0.08)' },
    STRONG: { text: '#059669', accent: '#047857', bg: 'rgba(5, 150, 105, 0.08)' },
  };

  const color = tierColors[tier] || tierColors.VIABLE;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLabel}>SIMULATE</div>
        <div className={styles.headerMeta}>
          {simulationCount.toLocaleString()} paths · {runTimeMs}ms
        </div>
      </div>

      {/* Hero Section */}
      <div className={styles.hero}>
        {/* Edge case badge */}
        {isOverlyOptimistic && (
          <div className={styles.cautionBadge}>
            ⚠️ Assumptions unusually favorable — verify inputs
          </div>
        )}
        {isHighUncertainty && (
          <div className={styles.uncertaintyBadge}>
            High uncertainty — outcomes evenly distributed
          </div>
        )}
        {isKillSwitchViolated && (
          <div className={styles.violatedBadge}>
            ⚠️ THRESHOLD VIOLATED — Immediate action required
          </div>
        )}

        <div className={styles.heroLabel}>Survival Probability</div>
        <div 
          className={styles.heroValue} 
          style={{ color: color.text }}
        >
          {survivalPct}%
        </div>
        <div 
          className={styles.heroBar}
          style={{ background: `linear-gradient(90deg, ${color.accent} ${survivalPct}%, rgba(51,65,85,0.3) ${survivalPct}%)` }}
        />
        <div 
          className={styles.heroTier}
          style={{ color: color.text }}
        >
          {tierLabel}
        </div>
        <div className={styles.heroSub}>
          Based on {simulationCount.toLocaleString()} Monte Carlo simulations
        </div>
      </div>

      {/* Outcome Buckets */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Outcome Distribution</div>
        <div className={styles.buckets}>
          <BucketBar emoji="💀" label="Crash" pct={outcomeBuckets.crash} color="#ef4444" />
          <BucketBar emoji="😰" label="Survive" pct={outcomeBuckets.survive} color="#f97316" />
          <BucketBar emoji="📈" label="Grow" pct={outcomeBuckets.grow} color="#22c55e" />
          <BucketBar emoji="🚀" label="Breakout" pct={outcomeBuckets.breakout} color="#06b6d4" />
        </div>
      </div>

      {/* Valuation Range */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>36-Month Valuation</div>
        <div className={styles.valuationBand}>
          <div className={styles.valuationPoint}>
            <span className={styles.valuationLabel}>P10</span>
            <span className={styles.valuationValue}>${valuationRange.p10}M</span>
          </div>
          <div className={styles.valuationLine}>
            <div className={styles.valuationDot} style={{ left: '0%' }} />
            <div className={styles.valuationDot} style={{ left: '50%' }} />
            <div className={styles.valuationDot} style={{ left: '100%' }} />
          </div>
          <div className={`${styles.valuationPoint} ${styles.valuationMedian}`}>
            <span className={styles.valuationLabel}>Median</span>
            <span className={styles.valuationValue}>${valuationRange.p50}M</span>
          </div>
          <div className={styles.valuationLine}>
            <div className={styles.valuationDot} style={{ left: '0%' }} />
            <div className={styles.valuationDot} style={{ left: '50%' }} />
            <div className={styles.valuationDot} style={{ left: '100%' }} />
          </div>
          <div className={styles.valuationPoint}>
            <span className={styles.valuationLabel}>P90</span>
            <span className={styles.valuationValue}>${valuationRange.p90}M</span>
          </div>
        </div>
      </div>

      {/* Kill-Switch */}
      <div className={`${styles.killSwitch} ${isKillSwitchViolated ? styles.violated : ''}`}>
        <div className={styles.killSwitchHeader}>
          <span className={styles.killSwitchIcon}>⚠️</span>
          <span className={styles.killSwitchTitle}>Key Threshold</span>
        </div>
        <div className={styles.killSwitchBody}>
          <div className={styles.killSwitchCondition}>
            If {killSwitch.metric.toLowerCase()} exceeds {killSwitch.threshold} → {killSwitch.impact}
          </div>
          <div className={styles.killSwitchAction}>
            → {killSwitch.recommendation}
          </div>
        </div>
      </div>

      {/* Causality Chain */}
      {causality.percentage > 0 && (
        <div className={styles.causality}>
          <div className={styles.causalityHeader}>
            <span className={styles.causalityIcon}>💀</span>
            <span className={styles.causalityTitle}>Why They Died</span>
          </div>
          <div className={styles.causalityBody}>
            {causality.summary}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}>
          ← Back to Terrain
        </button>
        <button className={styles.secondaryBtn} disabled>
          Details
        </button>
        <button className={styles.secondaryBtn} disabled>
          Export
        </button>
      </div>
    </div>
  );
}

// Bucket Bar Component
function BucketBar({ 
  emoji, 
  label, 
  pct, 
  color 
}: { 
  emoji: string; 
  label: string; 
  pct: number; 
  color: string;
}) {
  return (
    <div className={styles.bucket}>
      <div className={styles.bucketLabel}>
        <span className={styles.bucketEmoji}>{emoji}</span>
        <span className={styles.bucketName}>{label}</span>
      </div>
      <div className={styles.bucketBarContainer}>
        <div 
          className={styles.bucketBarFill}
          style={{ 
            width: `${Math.max(pct, 2)}%`, 
            backgroundColor: color,
          }}
        />
      </div>
      <div className={styles.bucketPct}>{pct}%</div>
    </div>
  );
}

