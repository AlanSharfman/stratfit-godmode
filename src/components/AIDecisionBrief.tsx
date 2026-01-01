// src/components/AIDecisionBrief.tsx
// STRATFIT — AI Decision Brief
// Executive brief with structured sections: Commentary, Risks, Actions

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScenarioId } from "@/state/scenarioStore";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// TYPES
// ============================================================================

interface AIDecisionBriefProps {
  commentary: string[];
  risks: string[];
  actions: string[];
  primaryDriver: string;
  scenario: ScenarioId;
}

// ============================================================================
// TYPEWRITER HOOK
// ============================================================================

function useTypewriter(text: string, speed: number = 25, enabled: boolean = true) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayText("");
      setIsComplete(false);
      return;
    }

    indexRef.current = 0;
    setDisplayText("");
    setIsComplete(false);

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current += 1;
        setDisplayText(text.slice(0, indexRef.current));
      } else {
        setIsComplete(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, enabled]);

  return { displayText, isComplete };
}

// ============================================================================
// SECTION COMPONENT
// ============================================================================

interface SectionProps {
  title: string;
  items: string[];
  isActive: boolean;
  variant?: "default" | "warning" | "action";
}

function Section({ title, items, isActive, variant = "default" }: SectionProps) {
  const allText = items.join("\n\n");
  const { displayText, isComplete } = useTypewriter(allText, 22, isActive);

  const lines = displayText.split("\n\n").filter((l) => l.trim());

  const bulletColor =
    variant === "warning" ? "#fbbf24" : variant === "action" ? "#22c55e" : "rgba(255,255,255,0.4)";

  return (
    <div className="brief-section">
      <div className="section-header">
        <span className="section-title">{title}</span>
      </div>
      <div className="section-content">
        {lines.map((line, i) => (
          <div key={i} className="content-line">
            <span className="line-bullet" style={{ color: bulletColor }}>
              ▸
            </span>
            <span className="line-text">{line}</span>
          </div>
        ))}
        {!isComplete && isActive && <span className="cursor">_</span>}
      </div>

      <style>{`
        .brief-section {
          margin-bottom: 16px;
        }

        .section-header {
          margin-bottom: 8px;
        }

        .section-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #22c55e;
          text-transform: uppercase;
        }

        .section-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .content-line {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .line-bullet {
          font-size: 10px;
          line-height: 1.6;
          flex-shrink: 0;
        }

        .line-text {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
        }

        .cursor {
          color: #22c55e;
          animation: blink 0.6s infinite;
          font-weight: bold;
          margin-left: 2px;
        }

        @keyframes blink {
          0%, 45% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIDecisionBrief({
  commentary,
  risks,
  actions,
  primaryDriver,
  scenario,
}: AIDecisionBriefProps) {
  const [contentKey, setContentKey] = useState(0);
  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  const isAnalyzing = activeLeverId !== null;

  useEffect(() => {
    setContentKey((k) => k + 1);
  }, [scenario]);

  return (
    <div className="decision-brief">
      {/* Left neon edge */}
      <div className="brief-edge" />

      {/* Header */}
      <div className="brief-header">
        <div className="header-indicator" />
        <span className="header-title">DECISION BRIEF</span>
      </div>

      {/* Content */}
      <div className="brief-body">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              className="analyzing-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="pulse-ring" />
              <span className="analyzing-text">Analyzing scenario impact...</span>
            </motion.div>
          ) : (
            <motion.div
              key={`content-${contentKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="brief-content"
            >
              {/* COMMENTARY */}
              <Section title="Commentary" items={commentary} isActive={!isAnalyzing} />

              {/* Primary Driver line */}
              <div className="driver-line">
                <span className="driver-label">Primary driver:</span>
                <span className="driver-value">{primaryDriver}</span>
              </div>

              {/* RISKS */}
              <Section title="Risks" items={risks} isActive={!isAnalyzing} variant="warning" />

              {/* ACTIONS */}
              <Section title="Actions" items={actions} isActive={!isAnalyzing} variant="action" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .decision-brief {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 16px;
          border: 1px solid rgba(34, 197, 94, 0.25);
          position: relative;
          overflow: hidden;
        }

        /* Left neon edge highlight */
        .brief-edge {
          position: absolute;
          left: 0;
          top: 10%;
          bottom: 10%;
          width: 2px;
          background: linear-gradient(180deg, transparent, #22c55e, transparent);
          opacity: 0.6;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
        }

        /* Header */
        .brief-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(34, 197, 94, 0.15);
          background: rgba(34, 197, 94, 0.03);
        }

        .header-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        .header-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.7);
        }

        /* Body */
        .brief-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          min-height: 0;
        }

        .brief-body::-webkit-scrollbar {
          width: 3px;
        }

        .brief-body::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.3);
          border-radius: 2px;
        }

        .brief-content {
          display: flex;
          flex-direction: column;
        }

        /* Primary Driver */
        .driver-line {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          padding: 8px 10px;
          background: rgba(34, 197, 94, 0.06);
          border-radius: 6px;
          border-left: 2px solid rgba(34, 197, 94, 0.4);
        }

        .driver-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .driver-value {
          font-size: 11px;
          font-weight: 600;
          color: #22c55e;
        }

        /* Analyzing state */
        .analyzing-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 40px 20px;
        }

        .pulse-ring {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(34, 197, 94, 0.3);
          border-top-color: #22c55e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .analyzing-text {
          font-size: 12px;
          color: rgba(34, 197, 94, 0.7);
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}

