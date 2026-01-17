// src/components/intelligence/ScenarioIntegrityCheck.tsx
// STRATFIT — Scenario Integrity Check (AI Red Team)
// Professional CFO-grade validation

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, RotateCcw, Zap, ChevronRight } from 'lucide-react';
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
        title: 'GROWTH-SPEND DIVERGENCE',
        message: 'Revenue growth while Marketing reduced Historical conversion efficiency suggests correlation risk.'
      },
      {
        type: 'warning',
        title: 'Q4 RUNWAY CONSTRAINT',
        message: 'Cash buffer drops below threshold in Q4. Recommend liquidity reserve adjustment.'
      },
      {
        type: 'pass',
        title: 'CAPITAL EFFICIENCY VALIDATED',
        message: 'Unit economics and CAC payback within industry norms. Sustainable growth trajectory confirmed.'
      }
    ]
  };

  const runCheck = () => {
    setStatus('scanning');
    setTimeout(() => setStatus('complete'), 2500);
  };

  const reset = () => setStatus('idle');

  // Helper to highlight data in messages
  const renderMessage = (message: string, type: 'warning' | 'pass') => {
    if (type === 'warning' && message.includes('Revenue growth')) {
      return (
        <>
          Revenue growth <span className={styles.dataHighlight}>+40%</span> while Marketing reduced{' '}
          <span className={styles.dataHighlight}>-15%</span>. Historical conversion efficiency suggests correlation risk.
        </>
      );
    }
    if (type === 'warning' && message.includes('Cash buffer')) {
      return (
        <>
          Cash buffer drops below <span className={styles.dataHighlight}>2-month</span> threshold in Q4. Recommend liquidity reserve adjustment.
        </>
      );
    }
    return message;
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <ShieldCheck size={12} className={styles.icon} />
          <span className={styles.title}>SYSTEM INTEGRITY</span>
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
        <div className={styles.buttonContainer}>
          {/* Pulsing glow background */}
          <div className={styles.buttonGlow} />
          
          <button onClick={runCheck} className={styles.runButton}>
            <div className={styles.buttonIconWrapper}>
              {/* Ripple effect */}
              <div className={styles.buttonIconRipple} />
              {/* Icon */}
              <div className={styles.buttonIcon}>
                <Zap size={14} className={styles.buttonIconSvg} />
              </div>
            </div>
            
            <div className={styles.buttonText}>
              <div className={styles.buttonTitleRow}>
                <span className={styles.buttonTitle}>RUN_DIAGNOSTIC</span>
                <span className={styles.buttonCta}>[ ACTION REQUIRED ]</span>
              </div>
              <div className={styles.buttonSubtitle}>Validate scenario logic & integrity</div>
            </div>
            
            <div className={styles.buttonArrow}>
              <ChevronRight size={14} />
            </div>
          </button>
        </div>
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
              {/* Left accent bar */}
              <div className={styles.accentBar} />
              
              {/* Icon */}
              <div className={styles.resultIcon}>
                {item.type === 'warning' ? (
                  <AlertTriangle size={13} />
                ) : (
                  <CheckCircle size={13} />
                )}
              </div>
              
              {/* Content */}
              <div className={styles.resultContent}>
                <div className={styles.resultTitle}>{item.title}</div>
                <div className={styles.resultMessage}>
                  {renderMessage(item.message, item.type)}
                </div>
              </div>
            </div>
          ))}

          <button onClick={reset} className={styles.resetButton}>
            <RotateCcw size={10} />
            <span>RESET DIAGNOSTICS</span>
          </button>
        </div>
      )}
    </div>
  );
}
