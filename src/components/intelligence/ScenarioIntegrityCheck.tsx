// src/components/intelligence/ScenarioIntegrityCheck.tsx
// STRATFIT — Scenario Integrity Check (AI Red Team)
// Professional CFO-grade validation

import React, { useState } from 'react';
import styles from './ScenarioIntegrityCheck.module.css';

type CheckStatus = 'idle' | 'scanning' | 'complete';

interface IntegrityResult {
  score: number;
  warnings: Array<{
    type: 'warning' | 'pass';
    title: string;
    message: string;
  }>;
}

export default function ScenarioIntegrityCheck() {
  const [status, setStatus] = useState<CheckStatus>('idle');
  
  // Mock results for demo
  const mockResult: IntegrityResult = {
    score: 94,
    warnings: [
      {
        type: 'warning',
        title: 'Growth-Spend Divergence',
        message: 'Revenue growth +40% while Marketing reduced -15%. Historical conversion efficiency suggests correlation risk.'
      },
      {
        type: 'warning',
        title: 'Q4 Runway Constraint',
        message: 'Cash buffer drops below 2-month threshold in Q4. Recommend liquidity reserve adjustment.'
      },
      {
        type: 'pass',
        title: 'Capital Efficiency Validated',
        message: 'Unit economics and CAC payback within industry norms. Sustainable growth trajectory confirmed.'
      }
    ]
  };

  const runCheck = () => {
    setStatus('scanning');
    setTimeout(() => setStatus('complete'), 2500);
  };

  const reset = () => setStatus('idle');

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>🛡️</span>
          <span className={styles.title}>SCENARIO INTEGRITY</span>
        </div>
        {status === 'complete' && (
          <div className={styles.scoreBadge}>
            <span className={styles.scoreValue}>{mockResult.score}%</span>
            <span className={styles.scoreLabel}>VALIDATED</span>
          </div>
        )}
      </div>

      {/* IDLE STATE - Run Button */}
      {status === 'idle' && (
        <button onClick={runCheck} className={styles.runButton}>
          <div className={styles.buttonIcon}>⚡</div>
          <div className={styles.buttonText}>
            <div className={styles.buttonTitle}>RUN INTEGRITY CHECK</div>
            <div className={styles.buttonSubtitle}>AI validation • Logic audit</div>
          </div>
        </button>
      )}

      {/* SCANNING STATE */}
      {status === 'scanning' && (
        <div className={styles.scanningBox}>
          <div className={styles.scanLine}>→ Analyzing growth correlations...</div>
          <div className={styles.scanLine}>→ Validating cash flow logic...</div>
          <div className={styles.scanLine}>→ Checking runway constraints...</div>
          <div className={styles.scanLine}>→ Verifying unit economics...</div>
        </div>
      )}

      {/* COMPLETE STATE - Results */}
      {status === 'complete' && (
        <div className={styles.results}>
          {mockResult.warnings.map((item, idx) => (
            <div 
              key={idx}
              className={`${styles.resultItem} ${
                item.type === 'warning' ? styles.warning : styles.pass
              }`}
            >
              <div className={styles.resultIcon}>
                {item.type === 'warning' ? '⚠️' : '✓'}
              </div>
              <div className={styles.resultContent}>
                <div className={styles.resultTitle}>{item.title}</div>
                <div className={styles.resultMessage}>{item.message}</div>
              </div>
            </div>
          ))}

          <button onClick={reset} className={styles.resetButton}>
            RESET CHECK
          </button>
        </div>
      )}
    </div>
  );
}

