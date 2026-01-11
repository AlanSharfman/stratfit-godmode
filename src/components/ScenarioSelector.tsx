// src/components/ScenarioSelector.tsx
// STRATFIT — Premium Scenario Control — Core Platform Control

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ScenarioId, SCENARIO_COLORS } from "@/state/scenarioStore";
import ActiveScenarioBezel from "@/components/scenario/ActiveScenarioBezel";

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
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  
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
      // Dropdown is portaled — don't treat clicks inside it as "outside".
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Portal positioning (prevents clipping by any parent overflow/stacking context)
  useEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }

    const update = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();

      const width = Math.max(240, r.width);
      const left = Math.min(window.innerWidth - width - 8, Math.max(8, r.left));

      // Always show ALL options (no forced tiny scrollbox). Flip upward if needed.
      const estimatedH = 240;
      const spaceBelow = window.innerHeight - r.bottom;
      const top =
        spaceBelow < estimatedH
          ? Math.max(8, r.top - 8 - estimatedH)
          : Math.min(window.innerHeight - estimatedH - 8, r.bottom + 8);

      setMenuPos({ top, left, width });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen]);

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
      {/* Main Control Capsule — Exact Replica Bezel */}
      <div ref={buttonRef}>
        <ActiveScenarioBezel
          label={currentScenario?.label ?? "Base Case"}
          subLabel={currentScenario?.desc}
          onOpen={handleToggle}
        />
      </div>

      {/* Dropdown Options — PORTAL overlay (prevents clipping) */}
      {isOpen && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              className="selector-dropdown-portal"
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
                right: "auto",
                zIndex: 2147483647,
                maxHeight: "none",
                overflow: "visible",
                pointerEvents: "auto",
              }}
            >
              {SCENARIOS.map((s, i) => (
                <button
                  key={s.id}
                  className={`dropdown-option ${s.id === scenario ? "active" : ""}`}
                  onClick={() => handleSelect(s.id)}
                  style={{
                    ["--option-color" as string]: SCENARIO_COLORS[s.id].primary,
                    transitionDelay: `${i * 40}ms`,
                  }}
                >
                  <div className="option-indicator" />
                  <div className="option-text">
                    <span className="option-name">{s.label}</span>
                    <span className="option-desc">{s.desc}</span>
                  </div>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}

      <style>{`
        .scenario-selector {
          position: relative;
          z-index: 4000; /* must overlay sliders + mountain */
          isolation: isolate;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding-left: 2px; /* tiny anchor so it visually lines up with the slider stack */
        }

        /* ============================================
           MAIN CAPSULE — Clean Control Surface
           ============================================ */
        .selector-capsule {
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          height: 100%;
          padding: 0 14px 0 22px;
          border-radius: 10px;

          /* IMPORTANT: the outer GODMODE steps come from ScenarioBezel.
             This inner control must be clean, readable, and not "double-bezeled". */
          background: linear-gradient(180deg, rgba(15, 23, 32, 0.55), rgba(11, 17, 23, 0.35));
          border: 1px solid rgba(120, 180, 255, 0.16);

          box-shadow:
            inset 0 1px 0 rgba(220,245,255,0.08),
            inset 0 -14px 22px rgba(0,0,0,0.55);

          cursor: pointer;
          transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
          overflow: hidden; /* clip inner glow only */
        }

        /* Inner edge highlight (top-left) + depth bite (bottom-right) */
        .selector-capsule::before,
        .selector-capsule::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 10px;
          pointer-events: none;
        }

        .selector-capsule::before {
          background:
            radial-gradient(120% 90% at 18% 12%,
              rgba(140,210,255,0.14),
              rgba(0,0,0,0) 55%);
          opacity: 0.9;
        }

        .selector-capsule::after {
          background:
            radial-gradient(120% 90% at 86% 92%,
              rgba(0,0,0,0.55),
              rgba(0,0,0,0) 60%);
          opacity: 1;
        }

        /* Slow ambient glow pulse — 7s cycle */
        .capsule-glow {
          position: absolute;
          inset: -2px;
          border-radius: 16px;
          background: radial-gradient(ellipse at center, var(--glow), transparent 70%);
          opacity: 0.09;
          animation: ambient-pulse 7s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }

        /* Status cue dot — Bloomberg-style anchor marker */
        .capsule-cue {
          position: absolute;
          left: 10px;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          transform: translateY(-50%);

          background: rgba(160, 185, 210, 0.65);
          box-shadow:
            0 0 0 2px rgba(0,0,0,0.55),
            0 0 10px rgba(120, 200, 255, 0.10);
          opacity: 0.95;
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
          border-color: rgba(255, 255, 255, 0.19);
          box-shadow: 0 10px 28px rgba(0,0,0,0.35);
          transform: translateY(-1px);
        }

        .selector-capsule:hover .capsule-glow {
          opacity: 0.3;
        }

        .selector-capsule.open {
          border-radius: 14px 14px 0 0;
          border-color: var(--accent);
          box-shadow: 0 10px 28px rgba(0,0,0,0.40);
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
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.88);
          text-transform: uppercase;
          text-shadow: 
            0 0 8px rgba(255,255,255,0.15),
            0 1px 2px rgba(0,0,0,0.5);
        }

        .capsule-value {
          font-size: 20px;
          font-weight: 800;
          color: #22d3ee;
          text-shadow: 
            0 0 8px rgba(34,211,238,0.35),
            0 1px 2px rgba(0,0,0,0.4);
          letter-spacing: 0.02em;
        }

        /* ============================================
           ARROW — Emphasized
           ============================================ */
        .capsule-arrow {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          margin-left: auto;
          color: rgba(200, 220, 240, 0.7);
          transition: color 160ms ease, transform 160ms ease;
          z-index: 2;
        }

        .capsule-arrow svg {
          filter: drop-shadow(0 0 4px rgba(255,255,255,0.3));
          transition: transform 160ms ease;
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
          z-index: 4500;
          background: linear-gradient(
            180deg,
            rgba(14, 18, 26, 0.98) 0%,
            rgba(10, 14, 22, 0.99) 100%
          );
          border: 1px solid rgba(120, 180, 255, 0.18);
          border-top: none;
          border-radius: 0 0 14px 14px;
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 220ms ease, opacity 160ms ease;
          pointer-events: none;
        }

        .selector-dropdown.visible {
          max-height: 240px;
          opacity: 1;
          pointer-events: auto;
          box-shadow: 0 14px 46px rgba(0,0,0,0.62), inset 0 1px 0 rgba(190,235,255,0.10);
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        /* Portal variant: always overlays and shows ALL options (no clipping, no hidden scroll). */
        .selector-dropdown-portal {
          background: linear-gradient(
            180deg,
            rgba(14, 18, 26, 0.98) 0%,
            rgba(10, 14, 22, 0.99) 100%
          );
          border: 1px solid rgba(120, 180, 255, 0.18);
          border-radius: 14px;
          box-shadow: 0 14px 46px rgba(0,0,0,0.62), inset 0 1px 0 rgba(190,235,255,0.10);
          pointer-events: auto;
        }

        .selector-dropdown-portal .dropdown-option {
          opacity: 1;
          transform: translateY(0);
        }

        .selector-dropdown.visible::-webkit-scrollbar { width: 0px; height: 0px; }

        /* ============================================
           OPTIONS
           ============================================ */
        .dropdown-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 17px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 120ms ease, transform 120ms ease, opacity 120ms ease;
          opacity: 0;
          transform: translateY(-8px);
        }

        .selector-dropdown.visible .dropdown-option {
          opacity: 1;
          transform: translateY(0);
        }

        .dropdown-option:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .dropdown-option.active {
          background: rgba(var(--option-color), 0.1);
        }

        .option-indicator {
          width: 3px;
          height: 22px;
          border-radius: 999px;
          background: var(--option-color);
          opacity: 0.45;
          transition: opacity 120ms ease, height 120ms ease;
        }

        .dropdown-option:hover .option-indicator,
        .dropdown-option.active .option-indicator {
          opacity: 1;
          height: 28px;
        }

        .option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .option-name {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
        }

        .dropdown-option.active .option-name {
          color: var(--option-color);
        }

        .option-desc {
          font-size: 12px;
          color: rgba(160, 180, 200, 0.6);
        }
      `}</style>
    </div>
  );
}

