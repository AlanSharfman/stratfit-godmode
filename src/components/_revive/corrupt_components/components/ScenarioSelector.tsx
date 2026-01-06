// src/components/ScenarioSelector.tsx
// STRATFIT — Premium Scenario Control — Core Platform Control

import React, { useState, useEffect, useRef } from "react";
import { ScenarioId, SCENARIO_COLORS } from "@/state/scenarioStore";

interface ScenarioSelectorProps {
  scenario: ScenarioId;
  onChange: (id: ScenarioId) => void;
}

const SCENARIOS: { id: ScenarioId; label: string; desc: string }[] = [
  { id: "base", label: "Base Case", desc: "Current trajectory" },
  { id: "upside", label: "Upside", desc: "Optimistic execution" },
  { id: "downside", label: "Downside", desc: "Cost or demand pressure" },
  { id: "extreme", label: "Stress Test", desc: "Extreme conditions" },
];

export default function ScenarioSelector({ scenario, onChange }: ScenarioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const colors = SCENARIO_COLORS[scenario];
  const currentScenario = SCENARIOS.find(s => s.id === scenario);

  // Discoverability hint — single pulse after 8s if never interacted
  useEffect(() => {
    if (hasInteracted) return;
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setShowHint(true);
        setTimeout(() => setShowHint(false), 1500);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [hasInteracted]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (id: ScenarioId) => {
    setHasInteracted(true);
    setFlashColor(SCENARIO_COLORS[id].primary);
    setTimeout(() => setFlashColor(null), 400);
    onChange(id);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setHasInteracted(true);
    setIsOpen(!isOpen);
  };

  return (
    <div ref={containerRef} className="scenario-selector">
      {/* Main Control Capsule */}
      <button 
        className={`selector-capsule ${isOpen ? 'open' : ''} ${showHint ? 'hint-pulse' : ''}`}
        onClick={handleToggle}
        style={{
          ['--accent' as string]: colors.primary,
          ['--glow' as string]: colors.glow,
          boxShadow: flashColor 
            ? `0 0 40px ${flashColor}80, 0 0 80px ${flashColor}40`
            : undefined
        }}
      >
        {/* Slow ambient glow */}
        <div className="capsule-glow" />
        
        <div className="capsule-content">
          <span className="capsule-label">ACTIVE SCENARIO</span>
          <span className="capsule-value">{currentScenario?.label}</span>
        </div>
        
        <div className={`capsule-arrow ${isOpen ? 'rotated' : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <div className="arrow-shimmer" />
        </div>
      </button>

      {/* Dropdown Options — Slide Down */}
      <div className={`selector-dropdown ${isOpen ? 'visible' : ''}`}>
        {SCENARIOS.map((s, i) => (
          <button
            key={s.id}
            className={`dropdown-option ${s.id === scenario ? 'active' : ''}`}
            onClick={() => handleSelect(s.id)}
            style={{ 
              ['--option-color' as string]: SCENARIO_COLORS[s.id].primary,
              transitionDelay: isOpen ? `${i * 40}ms` : '0ms'
            }}
          >
            <div className="option-indicator" />
            <div className="option-text">
              <span className="option-name">{s.label}</span>
              <span className="option-desc">{s.desc}</span>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .scenario-selector {
          position: relative;
          z-index: 100;
        }

        /* ============================================
           MAIN CAPSULE — Premium Dark Glass
           ============================================ */
        .selector-capsule {
          position: relative;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 14px 22px;
          min-width: 220px;
          background: linear-gradient(
            165deg,
            rgba(22, 28, 38, 0.95) 0%,
            rgba(14, 18, 26, 0.98) 50%,
            rgba(10, 14, 22, 0.99) 100%
          );
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .selector-capsule::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 1.5px;
          background: linear-gradient(
            145deg,
            rgba(255,255,255,0.2) 0%,
            transparent 30%,
            transparent 70%,
            rgba(255,255,255,0.15) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        /* Slow ambient glow pulse — 7s cycle */
        .capsule-glow {
          position: absolute;
          inset: -2px;
          border-radius: 18px;
          background: radial-gradient(ellipse at center, var(--glow), transparent 70%);
          opacity: 0.15;
          animation: ambient-pulse 7s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes ambient-pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.02); }
        }

        .selector-capsule:hover {
          background: linear-gradient(
            165deg,
            rgba(28, 36, 48, 0.97) 0%,
            rgba(18, 24, 34, 0.98) 50%,
            rgba(12, 16, 26, 0.99) 100%
          );
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 30px var(--glow), 0 8px 32px rgba(0,0,0,0.4);
        }

        .selector-capsule:hover .capsule-glow {
          opacity: 0.3;
        }

        .selector-capsule.open {
          border-radius: 16px 16px 0 0;
          border-color: var(--accent);
          box-shadow: 0 0 30px var(--glow);
        }

        /* Hint pulse — single cycle */
        .selector-capsule.hint-pulse {
          animation: hint-glow 1.5s ease-in-out;
        }

        @keyframes hint-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
          50% { box-shadow: 0 0 35px var(--glow), 0 0 60px var(--glow); }
        }

        /* ============================================
           CONTENT
           ============================================ */
        .capsule-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          position: relative;
          z-index: 2;
        }

        .capsule-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(160, 180, 200, 0.8);
          text-transform: uppercase;
        }

        .capsule-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
          text-shadow: 0 0 20px var(--glow);
          letter-spacing: 0.5px;
        }

        /* ============================================
           ARROW — Emphasized
           ============================================ */
        .capsule-arrow {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          margin-left: auto;
          color: rgba(200, 220, 240, 0.7);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .capsule-arrow svg {
          filter: drop-shadow(0 0 4px rgba(255,255,255,0.3));
          transition: transform 0.3s ease;
        }

        .selector-capsule:hover .capsule-arrow {
          color: rgba(255, 255, 255, 0.9);
        }

        .selector-capsule:hover .capsule-arrow svg {
          transform: translateY(2px);
        }

        .capsule-arrow.rotated svg {
          transform: rotate(180deg);
        }

        /* Arrow shimmer on load */
        .arrow-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          opacity: 0;
          animation: shimmer-once 1s ease-out 0.5s;
        }

        @keyframes shimmer-once {
          0% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateX(100%); }
        }

        /* ============================================
           DROPDOWN — Slide Down
           ============================================ */
        .selector-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: linear-gradient(
            180deg,
            rgba(14, 18, 26, 0.98) 0%,
            rgba(10, 14, 22, 0.99) 100%
          );
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-top: none;
          border-radius: 0 0 16px 16px;
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.35s ease, opacity 0.25s ease;
          pointer-events: none;
        }

        .selector-dropdown.visible {
          max-height: 300px;
          opacity: 1;
          pointer-events: auto;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }

        /* ============================================
           OPTIONS
           ============================================ */
        .dropdown-option {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 14px 20px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0;
          transform: translateY(-8px);
        }

        .selector-dropdown.visible .dropdown-option {
          opacity: 1;
          transform: translateY(0);
        }

        .dropdown-option:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .dropdown-option.active {
          background: rgba(var(--option-color), 0.1);
        }

        .option-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--option-color);
          opacity: 0.4;
          transition: all 0.2s ease;
          box-shadow: 0 0 8px var(--option-color);
        }

        .dropdown-option:hover .option-indicator,
        .dropdown-option.active .option-indicator {
          opacity: 1;
          transform: scale(1.2);
        }

        .option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .option-name {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .dropdown-option.active .option-name {
          color: var(--option-color);
        }

        .option-desc {
          font-size: 11px;
          color: rgba(160, 180, 200, 0.6);
        }
      `}</style>
    </div>
  );
}

