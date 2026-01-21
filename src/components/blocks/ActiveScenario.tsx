// src/components/blocks/ActiveScenario.tsx
// STRATFIT — Active Scenario Selector
// Dropdown for switching between the 4 STRATEGY-BASED SITUATIONS

import React, { useState, useRef, useEffect } from 'react';
import { Activity, Rocket, TrendingDown, Globe } from 'lucide-react';
import styles from './ActiveScenario.module.css';

// ===========================================
// THE 4 STRATEGY-BASED SITUATIONS
// ===========================================
export type ScenarioType = 
  | 'current-trajectory'
  | 'series-b-stress-test'
  | 'profitability-push'
  | 'apac-expansion';

interface Scenario {
  id: ScenarioType;
  label: string;
  description: string;
  icon: typeof Activity;
  color: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'current-trajectory',
    label: 'Baseline Trajectory',
    description: '',
    icon: Activity,
    color: '#00D9FF'
  },
  {
    id: 'series-b-stress-test',
    label: 'Series B Raise',
    description: 'Aggressive growth with $15M raise',
    icon: Rocket,
    color: '#00D9FF'  // Cyan
  },
  {
    id: 'profitability-push',
    label: 'Profitability Push',
    description: 'Bootstrap to profitability',
    icon: TrendingDown,
    color: '#FF9500'  // Orange
  },
  {
    id: 'apac-expansion',
    label: 'Geographic Expansion',
    description: 'Raise $8M, expand to APAC',
    icon: Globe,
    color: '#00FF88'  // Green
  }
];

interface ActiveScenarioProps {
  currentScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
}

export default function ActiveScenario({
  currentScenario,
  onScenarioChange
}: ActiveScenarioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const current = SCENARIOS.find(s => s.id === currentScenario) || SCENARIOS[0];
  const CurrentIcon = current.icon;

  const handleSelect = (scenario: ScenarioType) => {
    onScenarioChange(scenario);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.rim}>
        <div className={styles.step}>
          <div className={styles.content}>
            {/* HEADER */}
            <div className={styles.header}>
              <div className={styles.liveDot} />
              <span className={styles.label}>ACTIVE SITUATION</span>
            </div>

            {/* CURRENT SELECTION */}
            <button 
              className={styles.current}
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              style={{ '--scenario-color': current.color } as React.CSSProperties}
            >
              <div className={styles.currentContent}>
                <CurrentIcon 
                  size={32} 
                  className={styles.currentIcon}
                  style={{ color: current.color }}
                />
                <div className={styles.currentText}>
                  <div className={styles.currentLabel}>{current.label}</div>
                  <div className={styles.currentDesc}>{current.description}</div>
                </div>
              </div>
              <div className={styles.chevron}>
                {isOpen ? '▲' : '▼'}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className={styles.dropdown} role="menu">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <button
                key={scenario.id}
                className={`${styles.option} ${
                  scenario.id === currentScenario ? styles.active : ''
                }`}
                onClick={() => handleSelect(scenario.id)}
                role="menuitem"
              >
                <Icon 
                  size={28} 
                  className={styles.optionIcon}
                  style={{ color: scenario.color }}
                />
                <div className={styles.optionText}>
                  <div className={styles.optionLabel}>{scenario.label}</div>
                  <div className={styles.optionDesc}>{scenario.description}</div>
                </div>
                {scenario.id === currentScenario && (
                  <span className={styles.checkmark}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
