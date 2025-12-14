// src/components/ScenarioHeroBar.tsx
// STRATFIT — Hero Scenario Selector Bar

import React from "react";
import { motion } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================

export type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface ScenarioOption {
  id: ScenarioId;
  label: string;
  sublabel: string;
  color: string;
  glowColor: string;
  icon: React.ReactNode;
}

interface ScenarioHeroBarProps {
  selected: ScenarioId;
  onSelect: (id: ScenarioId) => void;
}

// ============================================================================
// SCENARIO CONFIG
// ============================================================================

const SCENARIOS: ScenarioOption[] = [
  {
    id: "base",
    label: "BASE CASE",
    sublabel: "Current trajectory",
    color: "#22d3ee",
    glowColor: "rgba(34, 211, 238, 0.5)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
  },
  {
    id: "upside",
    label: "UPSIDE",
    sublabel: "Best case growth",
    color: "#34d399",
    glowColor: "rgba(52, 211, 153, 0.5)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    id: "downside",
    label: "DOWNSIDE",
    sublabel: "Conservative outlook",
    color: "#fbbf24",
    glowColor: "rgba(251, 191, 36, 0.5)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
      </svg>
    ),
  },
  {
    id: "extreme",
    label: "EXTREME",
    sublabel: "Stress test scenario",
    color: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.5)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScenarioHeroBar({ selected, onSelect }: ScenarioHeroBarProps) {
  return (
    <div className="scenario-hero-bar">
      {/* Section Title */}
      <div className="scenario-hero-header">
        <div className="scenario-hero-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span>SELECT SCENARIO</span>
        </div>
        <p className="scenario-hero-subtitle">
          Choose a scenario to see how your business metrics change
        </p>
      </div>

      {/* Scenario Cards */}
      <div className="scenario-cards">
        {SCENARIOS.map((scenario) => {
          const isSelected = selected === scenario.id;

          return (
            <motion.button
              key={scenario.id}
              onClick={() => onSelect(scenario.id)}
              className={`scenario-card ${isSelected ? "selected" : ""}`}
              style={{
                "--card-color": scenario.color,
                "--card-glow": scenario.glowColor,
              } as React.CSSProperties}
              whileHover={{ scale: isSelected ? 1 : 1.02, y: isSelected ? 0 : -4 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                y: isSelected ? -6 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {/* Glow effect for selected */}
              {isSelected && (
                <motion.div
                  className="scenario-card-glow"
                  layoutId="scenarioGlow"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Border gradient */}
              <div className={`scenario-card-border ${isSelected ? "active" : ""}`} />

              {/* Inner content */}
              <div className="scenario-card-inner">
                {/* Icon */}
                <div className={`scenario-card-icon ${isSelected ? "active" : ""}`}>
                  {scenario.icon}
                </div>

                {/* Text */}
                <div className="scenario-card-text">
                  <span className={`scenario-card-label ${isSelected ? "active" : ""}`}>
                    {scenario.label}
                  </span>
                  <span className="scenario-card-sublabel">
                    {scenario.sublabel}
                  </span>
                </div>

                {/* Selection indicator */}
                <div className={`scenario-card-indicator ${isSelected ? "active" : ""}`}>
                  {isSelected ? (
                    <motion.div
                      className="indicator-dot"
                      layoutId="indicatorDot"
                      style={{ backgroundColor: scenario.color, boxShadow: `0 0 12px ${scenario.color}` }}
                    />
                  ) : (
                    <div className="indicator-ring" />
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <style>{`
        .scenario-hero-bar {
          padding: 16px 24px 20px;
          background: linear-gradient(
            180deg,
            rgba(15, 20, 30, 0.95) 0%,
            rgba(11, 14, 20, 0.9) 100%
          );
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .scenario-hero-header {
          margin-bottom: 16px;
          text-align: center;
        }

        .scenario-hero-title {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 6px;
        }

        .scenario-hero-title svg {
          opacity: 0.7;
        }

        .scenario-hero-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
        }

        .scenario-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 900px) {
          .scenario-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .scenario-cards {
            grid-template-columns: 1fr;
          }
        }

        .scenario-card {
          position: relative;
          padding: 3px;
          border-radius: 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .scenario-card-glow {
          position: absolute;
          inset: -8px;
          border-radius: 24px;
          background: radial-gradient(
            ellipse at center,
            var(--card-glow) 0%,
            transparent 70%
          );
          opacity: 0.6;
          z-index: 0;
          pointer-events: none;
        }

        .scenario-card-border {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.03) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          z-index: 1;
          transition: all 0.3s ease;
        }

        .scenario-card-border.active {
          background: linear-gradient(
            145deg,
            var(--card-color) 0%,
            transparent 30%,
            transparent 70%,
            var(--card-color) 100%
          );
          box-shadow:
            0 0 20px var(--card-glow),
            0 0 40px var(--card-glow),
            inset 0 0 1px var(--card-color);
        }

        .scenario-card-inner {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          background: linear-gradient(
            160deg,
            rgba(15, 20, 30, 0.98) 0%,
            rgba(10, 14, 22, 0.99) 100%
          );
          border-radius: 14px;
          transition: all 0.3s ease;
        }

        .scenario-card.selected .scenario-card-inner {
          background: linear-gradient(
            160deg,
            rgba(20, 28, 40, 0.98) 0%,
            rgba(15, 20, 30, 0.99) 100%
          );
        }

        .scenario-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
        }

        .scenario-card-icon.active {
          background: rgba(255, 255, 255, 0.08);
          color: var(--card-color);
          box-shadow: 0 0 20px var(--card-glow);
        }

        .scenario-card:hover .scenario-card-icon:not(.active) {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
        }

        .scenario-card-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .scenario-card-label {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
        }

        .scenario-card-label.active {
          color: var(--card-color);
          text-shadow: 0 0 20px var(--card-glow);
        }

        .scenario-card-sublabel {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .scenario-card-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .indicator-ring {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }

        .scenario-card:hover .indicator-ring {
          border-color: rgba(255, 255, 255, 0.4);
        }

        .indicator-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}

