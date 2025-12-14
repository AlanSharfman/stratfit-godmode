// src/components/ScenarioSlidePanel.tsx
// STRATFIT — Glass Scenario Selector
// Auto-appears after 3s, overlays mountain, leaves visible handle

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
  isVisible: boolean;
  onToggle: () => void;
}

const SCENARIOS: ScenarioOption[] = [
  { id: "base", label: "BASE CASE", sublabel: "Current trajectory", color: "#22c55e" },
  { id: "upside", label: "UPSIDE", sublabel: "Optimistic growth", color: "#22d3ee" },
  { id: "downside", label: "DOWNSIDE", sublabel: "Conservative view", color: "#fbbf24" },
  { id: "extreme", label: "EXTREME", sublabel: "Stress test", color: "#ef4444" },
];

const ICONS: Record<ScenarioId, React.ReactNode> = {
  base: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  ),
  upside: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  downside: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  extreme: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

export default function ScenarioSlidePanel({
  selected,
  onSelect,
  isVisible,
  onToggle,
}: ScenarioSlidePanelProps) {
  const selectedScenario = SCENARIOS.find((s) => s.id === selected) || SCENARIOS[0];

  const handleSelect = (id: ScenarioId) => {
    onSelect(id);
  };

  return (
    <>
      {/* LEVER/HANDLE — Always visible when dock is closed */}
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            className="scenario-handle"
            onClick={onToggle}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            whileHover={{ x: 4, boxShadow: "0 0 20px rgba(34, 197, 94, 0.3)" }}
            style={{ "--accent": selectedScenario.color } as React.CSSProperties}
          >
            <div className="handle-bar" />
            <div className="handle-content">
              <div className="handle-icon">{ICONS[selected]}</div>
              <div className="handle-text">
                <span className="handle-label">{selectedScenario.label}</span>
                <span className="handle-hint">Click to change</span>
              </div>
              <svg className="handle-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* GLASS PANEL — Floats over mountain */}
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Click-away backdrop (transparent) */}
            <motion.div
              className="scenario-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
            />

            {/* Glass selector panel */}
            <motion.div
              className="scenario-glass"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              {/* Glass layers */}
              <div className="glass-bg" />
              <div className="glass-border" />
              <div className="glass-shine" />

              {/* Content */}
              <div className="glass-content">
                <div className="glass-header">
                  <span className="glass-title">
                    <span className="title-dot">◈</span>
                    SELECT SCENARIO
                  </span>
                  <button className="glass-close" onClick={onToggle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="scenario-grid">
                  {SCENARIOS.map((s, i) => {
                    const isSelected = selected === s.id;
                    return (
                      <motion.button
                        key={s.id}
                        className={`scenario-btn ${isSelected ? "selected" : ""}`}
                        style={{ "--sc": s.color } as React.CSSProperties}
                        onClick={() => handleSelect(s.id)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="btn-accent" />
                        <div className="btn-icon">{ICONS[s.id]}</div>
                        <div className="btn-text">
                          <span className="btn-label">{s.label}</span>
                          <span className="btn-sub">{s.sublabel}</span>
                        </div>
                        {isSelected && (
                          <motion.div className="btn-check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="3">
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
        /* HANDLE — Slim vertical lever */
        .scenario-handle {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          align-items: center;
          background: rgba(10, 12, 18, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: none;
          border-radius: 0 12px 12px 0;
          cursor: pointer;
          backdrop-filter: blur(16px);
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .handle-bar {
          width: 3px;
          height: 100%;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent);
        }

        .handle-content {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px 12px 12px;
        }

        .handle-icon {
          color: var(--accent);
          display: flex;
        }

        .handle-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .handle-label {
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.04em;
        }

        .handle-hint {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.35);
        }

        .handle-arrow {
          color: rgba(255, 255, 255, 0.3);
        }

        /* BACKDROP */
        .scenario-backdrop {
          position: fixed;
          inset: 0;
          z-index: 110;
          background: rgba(0, 0, 0, 0.2);
        }

        /* GLASS PANEL */
        .scenario-glass {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 120;
          width: 380px;
          border-radius: 20px;
          overflow: hidden;
        }

        /* True glass: bg-white/6 backdrop-blur-2xl */
        .glass-bg {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(48px) saturate(180%);
          -webkit-backdrop-filter: blur(48px) saturate(180%);
        }

        /* Border: border-white/10 border-emerald-400/15 */
        .glass-border {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            inset 0 0 0 1px rgba(16, 185, 129, 0.15),
            0 8px 32px rgba(0, 0, 0, 0.3);
          pointer-events: none;
        }

        .glass-shine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 40%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
          pointer-events: none;
        }

        .glass-content {
          position: relative;
          z-index: 1;
          padding: 20px;
        }

        .glass-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .glass-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.8);
        }

        .title-dot {
          color: #22c55e;
          font-size: 14px;
          text-shadow: 0 0 10px #22c55e;
        }

        .glass-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.15s;
        }

        .glass-close:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        /* SCENARIO GRID — 2x2 */
        .scenario-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .scenario-btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 16px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s ease;
        }

        .scenario-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .scenario-btn.selected {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--sc);
          box-shadow: 0 0 24px rgba(var(--sc), 0.15);
        }

        .btn-accent {
          position: absolute;
          bottom: 0;
          left: 20%;
          right: 20%;
          height: 2px;
          background: var(--sc);
          border-radius: 1px 1px 0 0;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .scenario-btn.selected .btn-accent {
          opacity: 1;
          box-shadow: 0 0 10px var(--sc);
        }

        .btn-icon {
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.15s;
        }

        .scenario-btn.selected .btn-icon {
          color: var(--sc);
          filter: drop-shadow(0 0 6px var(--sc));
        }

        .btn-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .btn-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.85);
        }

        .scenario-btn.selected .btn-label {
          color: #fff;
        }

        .btn-sub {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
        }

        .btn-check {
          position: absolute;
          top: 10px;
          right: 10px;
        }
      `}</style>
    </>
  );
}
