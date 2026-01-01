// src/components/ScenarioHeroBar.tsx
// STRATFIT — PURE GLASS — Completely See-Through

import React from "react";
import { motion } from "framer-motion";
import type { ScenarioId } from "@/state/scenarioStore";

// ============================================================================
// TYPES
// ============================================================================

interface ScenarioOption {
  id: ScenarioId;
  label: string;
  sublabel: string;
  color: string;
}

interface ScenarioHeroBarProps {
  selected: ScenarioId;
  onSelect: (id: ScenarioId) => void;
}

// ============================================================================
// CONFIG
// ============================================================================

const SCENARIOS: ScenarioOption[] = [
  { id: "base", label: "BASE CASE", sublabel: "Current trajectory", color: "#22d3ee" },
  { id: "upside", label: "UPSIDE", sublabel: "Best case growth", color: "#34d399" },
  { id: "downside", label: "DOWNSIDE", sublabel: "Conservative outlook", color: "#fbbf24" },
];

const ICONS: Record<ScenarioId, React.ReactNode> = {
  base: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
    </svg>
  ),
  upside: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  downside: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  ),
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScenarioHeroBar({ selected, onSelect }: ScenarioHeroBarProps) {
  return (
    <div className="hero-bar">
      <div className="hero-title">SELECT SCENARIO</div>
      
      <div className="hero-cards">
        {SCENARIOS.map((s) => {
          const isSelected = selected === s.id;
          
          return (
            <motion.button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`card ${isSelected ? "selected" : ""}`}
              style={{ "--c": s.color, "--c-rgb": hexToRgb(s.color) } as React.CSSProperties}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              animate={{ y: isSelected ? -8 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              {/* Color underglow — ONLY when selected */}
              <motion.div 
                className="card-glow"
                animate={{ 
                  opacity: isSelected ? 1 : 0,
                  scale: isSelected ? 1 : 0.9
                }}
                transition={{ duration: 0.35 }}
              />
              
              {/* PURE GLASS */}
              <div className="glass">
                {/* Top luminous edge */}
                <div className="edge-top" />
                
                {/* Left luminous edge */}
                <div className="edge-left" />
                
                {/* Right luminous edge */}
                <div className="edge-right" />
                
                {/* Bottom luminous edge */}
                <div className="edge-bottom" />
                
                {/* Corner accents */}
                <div className="corner corner-tl" />
                <div className="corner corner-tr" />
                <div className="corner corner-bl" />
                <div className="corner corner-br" />
                
                {/* Inner color wash — fills glass when selected */}
                <motion.div 
                  className="color-wash"
                  animate={{ 
                    opacity: isSelected ? 0.15 : 0,
                  }}
                  transition={{ duration: 0.4 }}
                />
                
                {/* Subtle inner reflection */}
                <div className="inner-reflection" />
                
                {/* Content */}
                <div className="content">
                  <motion.div 
                    className="icon"
                    animate={{ 
                      color: isSelected ? s.color : "rgba(255,255,255,0.45)",
                      filter: isSelected 
                        ? `drop-shadow(0 0 8px ${s.color}) drop-shadow(0 0 15px ${s.color})`
                        : "none"
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    {ICONS[s.id]}
                  </motion.div>
                  
                  <div className="text">
                    <motion.span 
                      className="label"
                      animate={{ 
                        color: isSelected ? "#ffffff" : "rgba(255,255,255,0.75)",
                        textShadow: isSelected 
                          ? `0 0 20px ${s.color}, 0 0 40px ${s.color}`
                          : "0 1px 3px rgba(0,0,0,0.5)"
                      }}
                      transition={{ duration: 0.25 }}
                    >
                      {s.label}
                    </motion.span>
                    <span className="sublabel">{s.sublabel}</span>
                  </div>
                  
                  <motion.div 
                    className="indicator"
                    animate={{
                      backgroundColor: isSelected ? s.color : "rgba(255,255,255,0.2)",
                      boxShadow: isSelected 
                        ? `0 0 8px ${s.color}, 0 0 16px ${s.color}, 0 0 24px ${s.color}`
                        : "none",
                      scale: isSelected ? 1.2 : 1
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                </div>
                
                {/* Selected border glow */}
                <motion.div 
                  className="selected-border"
                  animate={{ 
                    opacity: isSelected ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <style>{`
        .hero-bar {
          padding: 24px 24px 32px;
        }
        
        .hero-title {
          text-align: center;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.35em;
          color: rgba(255,255,255,0.25);
          margin-bottom: 22px;
        }
        
        .hero-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        @media (max-width: 900px) {
          .hero-cards { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .hero-cards { grid-template-columns: 1fr; }
        }
        
        .card {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 0;
        }
        
        /* Color glow underneath */
        .card-glow {
          position: absolute;
          inset: -25px;
          background: radial-gradient(
            ellipse at 50% 70%,
            var(--c),
            transparent 70%
          );
          opacity: 0;
          filter: blur(35px);
          z-index: 0;
        }
        
        /* PURE GLASS PANEL */
        .glass {
          position: relative;
          z-index: 1;
          padding: 24px 26px;
          border-radius: 20px;
          /* COMPLETELY TRANSPARENT — just a hint */
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .card:hover .glass {
          background: rgba(255, 255, 255, 0.04);
        }
        
        /* LUMINOUS EDGES — This is what makes glass visible */
        .edge-top {
          position: absolute;
          top: 0;
          left: 30px;
          right: 30px;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255,255,255,0.4) 20%,
            rgba(255,255,255,0.6) 50%,
            rgba(255,255,255,0.4) 80%,
            transparent
          );
        }
        
        .edge-bottom {
          position: absolute;
          bottom: 0;
          left: 40px;
          right: 40px;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255,255,255,0.15) 30%,
            rgba(255,255,255,0.25) 50%,
            rgba(255,255,255,0.15) 70%,
            transparent
          );
        }
        
        .edge-left {
          position: absolute;
          left: 0;
          top: 30px;
          bottom: 30px;
          width: 1px;
          background: linear-gradient(180deg, 
            transparent, 
            rgba(255,255,255,0.2) 20%,
            rgba(255,255,255,0.35) 50%,
            rgba(255,255,255,0.2) 80%,
            transparent
          );
        }
        
        .edge-right {
          position: absolute;
          right: 0;
          top: 30px;
          bottom: 30px;
          width: 1px;
          background: linear-gradient(180deg, 
            transparent, 
            rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0.25) 50%,
            rgba(255,255,255,0.15) 80%,
            transparent
          );
        }
        
        /* Corner accents — light catches corners */
        .corner {
          position: absolute;
          width: 20px;
          height: 20px;
        }
        
        .corner-tl {
          top: 0;
          left: 0;
          border-top: 1px solid rgba(255,255,255,0.35);
          border-left: 1px solid rgba(255,255,255,0.35);
          border-top-left-radius: 20px;
        }
        
        .corner-tr {
          top: 0;
          right: 0;
          border-top: 1px solid rgba(255,255,255,0.3);
          border-right: 1px solid rgba(255,255,255,0.2);
          border-top-right-radius: 20px;
        }
        
        .corner-bl {
          bottom: 0;
          left: 0;
          border-bottom: 1px solid rgba(255,255,255,0.15);
          border-left: 1px solid rgba(255,255,255,0.2);
          border-bottom-left-radius: 20px;
        }
        
        .corner-br {
          bottom: 0;
          right: 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          border-right: 1px solid rgba(255,255,255,0.1);
          border-bottom-right-radius: 20px;
        }
        
        .card:hover .corner-tl,
        .card:hover .corner-tr {
          border-color: rgba(255,255,255,0.5);
        }
        
        /* Color wash — fills glass when selected */
        .color-wash {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            var(--c) 0%,
            transparent 60%
          );
          opacity: 0;
          border-radius: 20px;
        }
        
        /* Inner reflection */
        .inner-reflection {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 45%;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.04) 0%,
            transparent 100%
          );
          border-radius: 20px 20px 50% 50%;
          pointer-events: none;
        }
        
        /* Selected border */
        .selected-border {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          border: 1px solid var(--c);
          opacity: 0;
          box-shadow: 
            0 0 20px rgba(var(--c-rgb), 0.4),
            inset 0 0 30px rgba(var(--c-rgb), 0.1);
        }
        
        /* Content */
        .content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 18px;
        }
        
        .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          color: rgba(255,255,255,0.45);
        }
        
        .text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .label {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.75);
        }
        
        .sublabel {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
        }
        
        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}

// Helper to convert hex to RGB for box-shadow
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "255, 255, 255";
}
