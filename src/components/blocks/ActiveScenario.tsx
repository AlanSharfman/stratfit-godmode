// src/components/blocks/ActiveScenario.tsx
// STRATFIT — Active Scenario Selector
// Dropdown for switching between strategic scenarios

import React, { useState, useRef, useEffect } from 'react';
import { BarChart3, TrendingUp, Zap, Shield, Target } from 'lucide-react';
import styles from './ActiveScenario.module.css';

export type ScenarioType = 
  | 'base-case'
  | 'growth'
  | 'efficiency'
  | 'survival'
  | 'series-b';

interface Scenario {
  id: ScenarioType;
  label: string;
  description: string;
  icon: typeof BarChart3;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'base-case',
    label: 'Base Case',
    description: 'Current trajectory',
    icon: BarChart3
  },
  {
    id: 'growth',
    label: 'Growth',
    description: 'Aggressive expansion',
    icon: TrendingUp
  },
  {
    id: 'efficiency',
    label: 'Efficiency',
    description: 'Optimize margins',
    icon: Zap
  },
  {
    id: 'survival',
    label: 'Survival',
    description: 'Extend runway',
    icon: Shield
  },
  {
    id: 'series-b',
    label: 'Series B',
    description: 'Next funding round',
    icon: Target
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
      {/* HEADER */}
      <div className={styles.header}>
        <span className={styles.label}>ACTIVE SCENARIO</span>
      </div>

      {/* CURRENT SELECTION - Clickable */}
      <button 
        className={styles.current}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className={styles.currentContent}>
          <CurrentIcon size={24} className={styles.currentIcon} />
          <div className={styles.currentText}>
            <div className={styles.currentLabel}>{current.label}</div>
            <div className={styles.currentDesc}>{current.description}</div>
          </div>
        </div>
        <div className={styles.chevron}>
          {isOpen ? '▲' : '▼'}
        </div>
      </button>

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
                <Icon size={22} className={styles.optionIcon} />
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

