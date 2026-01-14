// src/components/ScenarioSlidePanel.tsx
// STRATFIT — Scenario Selection Panel
// LEFT side, stacked vertically, slides OUT and BACK IN visibly
// Ceremonial, premium handle remains visible

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface ScenarioOption {
  id: ScenarioId;
  label: string;
  sublabel: string;
  color: string;
}

interface ScenarioSlidePanelProps {
  selected: ScenarioId;
  onSelect: (id: ScenarioId) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SCENARIOS: ScenarioOption[] = [
  { id: "base", label: "Base Case", sublabel: "Current trajectory", color: "#4ade80" },
  { id: "upside", label: "Upside", sublabel: "Optimistic growth", color: "#38bdf8" },
  { id: "downside", label: "Downside", sublabel: "Conservative view", color: "#fbbf24" },
  { id: "extreme", label: "Stress", sublabel: "Stress test", color: "#f87171" },
];

const ICONS: Record<ScenarioId, React.ReactNode> = {
  base: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  ),
  upside: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  downside: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  extreme: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

export default function ScenarioSlidePanel({
  selected,
  onSelect,
  isOpen,
  onToggle,
}: ScenarioSlidePanelProps) {
  const selectedScenario = SCENARIOS.find((s) => s.id === selected) || SCENARIOS[0];

  return (
    <>
      {/* PREMIUM HANDLE — Always visible on LEFT when panel is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="scenario-handle"
            onClick={onToggle}
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            whileHover={{ x: 6 }}
            style={{ "--accent": selectedScenario.color } as React.CSSProperties}
          >
            <div className="handle-glow" />
            <div className="handle-content">
              <div className="handle-icon">{ICONS[selected]}</div>
              <div className="handle-info">
                <span className="handle-label">{selectedScenario.label}</span>
                <span className="handle-hint">Scenario</span>
              </div>
              <svg className="handle-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div className="handle-accent" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* SLIDE PANEL — From LEFT edge */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="panel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
            />

            {/* Panel slides from LEFT */}
            <motion.div
              className="slide-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
            >
              <div className="panel-glass" />
              <div className="panel-border" />

              <div className="panel-content">
                <div className="panel-header">
                  <span className="panel-title">SCENARIO</span>
                  <button className="panel-close" onClick={onToggle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Vertically stacked options */}
                <div className="scenario-stack">
                  {SCENARIOS.map((s, i) => {
                    const isSelected = selected === s.id;
                    return (
                      <motion.button
                        key={s.id}
                        className={`scenario-option ${isSelected ? "selected" : ""}`}
                        style={{ "--sc": s.color } as React.CSSProperties}
                        onClick={() => onSelect(s.id)}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="option-bar" />
                        <div className="option-icon">{ICONS[s.id]}</div>
                        <div className="option-text">
                          <span className="option-label">{s.label}</span>
                          <span className="option-sub">{s.sublabel}</span>
                        </div>
                        {isSelected && (
                          <motion.div className="option-check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        /* HANDLE — Left edge, ceremonial */
        .scenario-handle {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          align-items: center;
          background: rgba(12, 14, 18, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-left: none;
          border-radius: 0 12px 12px 0;
          cursor: pointer;
          backdrop-filter: blur(16px);
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .scenario-handle:hover {
          background: rgba(16, 18, 24, 0.98);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .handle-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 0% 50%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%);
          pointer-events: none;
        }

        .handle-content {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px 14px 14px;
        }

        .handle-icon {
          color: var(--accent);
          display: flex;
          opacity: 0.9;
        }

        .handle-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .handle-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.03em;
        }

        .handle-hint {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.02em;
        }

        .handle-chevron {
          color: rgba(255, 255, 255, 0.3);
        }

        .handle-accent {
          position: absolute;
          left: 0;
          top: 15%;
          bottom: 15%;
          width: 3px;
          background: var(--accent);
          border-radius: 0 2px 2px 0;
          opacity: 0.8;
        }

        /* BACKDROP */
        .panel-backdrop {
          position: fixed;
          inset: 0;
          z-index: 110;
          background: rgba(0, 0, 0, 0.25);
        }

        /* SLIDE PANEL — From left */
        .slide-panel {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 300px;
          z-index: 120;
        }

        .panel-glass {
          position: absolute;
          inset: 0;
          background: rgba(12, 14, 18, 0.96);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
        }

        .panel-border {
          position: absolute;
          inset: 0;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          pointer-events: none;
        }

        .panel-content {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 20px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .panel-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.6);
        }

        .panel-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.15s;
        }

        .panel-close:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
        }

        /* VERTICALLY STACKED OPTIONS */
        .scenario-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .scenario-option {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .scenario-option:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .scenario-option.selected {
          background: rgba(255, 255, 255, 0.03);
          border-color: color-mix(in srgb, var(--sc) 50%, transparent);
        }

        .option-bar {
          position: absolute;
          left: 0;
          top: 18%;
          bottom: 18%;
          width: 3px;
          background: var(--sc);
          border-radius: 0 2px 2px 0;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .scenario-option.selected .option-bar {
          opacity: 0.9;
        }

        .option-icon {
          color: rgba(255, 255, 255, 0.45);
          transition: color 0.15s;
        }

        .scenario-option.selected .option-icon {
          color: var(--sc);
        }

        .option-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .option-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: rgba(255, 255, 255, 0.8);
        }

        .scenario-option.selected .option-label {
          color: #fff;
        }

        .option-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .option-check {
          flex-shrink: 0;
        }
      `}</style>
    </>
  );
}
