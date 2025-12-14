// src/components/AIIntelligenceStream.tsx
// STRATFIT — NEON GREEN AI Intelligence Panel
// Matches reference: Black background, neon green accents, 3 animated dots, typewriter

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScenarioId } from "./ScenarioSlidePanel";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// TYPES
// ============================================================================

interface AIIntelligenceStreamProps {
  commentary: string[];
  risks: string[];
  actions: string[];
  scenario: ScenarioId;
}

type TabId = "commentary" | "risks" | "actions";

// ============================================================================
// TYPEWRITER HOOK — FAST
// ============================================================================

function useTypewriter(text: string, speed: number = 20, delay: number = 0, enabled: boolean = true) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setDisplayText("");
      setIsComplete(false);
      return;
    }

    indexRef.current = 0;
    setDisplayText("");
    setIsComplete(false);
    
    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        if (indexRef.current < text.length) {
          indexRef.current += 1;
          setDisplayText(text.slice(0, indexRef.current));
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, speed, delay, enabled]);

  return { displayText, isComplete };
}

// ============================================================================
// THREE DOTS ANIMATION
// ============================================================================

function ThreeDotsAnimation() {
  return (
    <div className="three-dots">
      <motion.div
        className="dot"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="dot"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.25 }}
      />
      <motion.div
        className="dot"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.5 }}
      />
    </div>
  );
}

// ============================================================================
// TAB CONTENT
// ============================================================================

interface TabContentProps {
  items: string[];
  isActive: boolean;
}

function TabContent({ items, isActive }: TabContentProps) {
  const allText = items.join("\n\n");
  const { displayText, isComplete } = useTypewriter(allText, 18, 200, isActive);
  
  if (!isActive) return null;

  const lines = displayText.split("\n\n").filter(l => l.trim());

  return (
    <div className="tab-content">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          className="content-item"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.15 }}
        >
          <span className="item-bullet">▸</span>
          <span className="item-text">{line}</span>
        </motion.div>
      ))}
      {!isComplete && <span className="cursor">_</span>}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIIntelligenceStream({ 
  commentary, 
  risks, 
  actions,
  scenario 
}: AIIntelligenceStreamProps) {
  const [activeTab, setActiveTab] = useState<TabId>("commentary");
  const [contentKey, setContentKey] = useState(0);
  
  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  const isAnalyzing = activeLeverId !== null;

  useEffect(() => {
    setContentKey(k => k + 1);
  }, [activeTab, scenario]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "commentary", label: "COMMENTARY" },
    { id: "risks", label: "RISKS" },
    { id: "actions", label: "ACTIONS" },
  ];

  const getTabContent = (tabId: TabId): string[] => {
    switch (tabId) {
      case "commentary": return commentary;
      case "risks": return risks;
      case "actions": return actions;
    }
  };

  return (
    <div className="ai-panel">
      {/* NEON BORDER */}
      <div className="ai-panel-border" />
      
      {/* HEADER */}
      <div className="ai-header">
        <div className="ai-title">
          <ThreeDotsAnimation />
          <span className="title-text">AI-Powered Intelligence</span>
        </div>
      </div>

      {/* TABS */}
      <div className="ai-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`ai-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="ai-content">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              className="analyzing-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ThreeDotsAnimation />
              <span className="analyzing-text">Analyzing changes...</span>
            </motion.div>
          ) : (
            <motion.div
              key={`content-${contentKey}-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TabContent 
                items={getTabContent(activeTab)} 
                isActive={!isAnalyzing}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .ai-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #050505;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        /* NEON GREEN BORDER */
        .ai-panel-border {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          border: 1.5px solid #22c55e;
          box-shadow: 
            0 0 15px rgba(34, 197, 94, 0.4),
            0 0 30px rgba(34, 197, 94, 0.2),
            inset 0 0 30px rgba(34, 197, 94, 0.05);
          pointer-events: none;
          z-index: 10;
        }

        /* HEADER */
        .ai-header {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(34, 197, 94, 0.25);
          background: rgba(34, 197, 94, 0.03);
        }

        .ai-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .three-dots {
          display: flex;
          gap: 5px;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e, 0 0 16px #22c55e;
        }

        .title-text {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #22c55e;
          text-shadow: 0 0 15px rgba(34, 197, 94, 0.6);
        }

        /* TABS */
        .ai-tabs {
          display: flex;
          border-bottom: 1px solid rgba(34, 197, 94, 0.15);
          background: rgba(0, 0, 0, 0.3);
        }

        .ai-tab {
          flex: 1;
          padding: 10px 6px;
          background: transparent;
          border: none;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.35);
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }

        .ai-tab:hover {
          color: rgba(255, 255, 255, 0.6);
          background: rgba(34, 197, 94, 0.05);
        }

        .ai-tab.active {
          color: #22c55e;
          text-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
          background: rgba(34, 197, 94, 0.08);
        }

        .ai-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 15%;
          right: 15%;
          height: 2px;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e, 0 0 16px #22c55e;
          border-radius: 1px;
        }

        /* CONTENT */
        .ai-content {
          flex: 1;
          padding: 14px 16px;
          overflow-y: auto;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          min-height: 0;
        }

        .ai-content::-webkit-scrollbar {
          width: 3px;
        }

        .ai-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .ai-content::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.4);
          border-radius: 2px;
        }

        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .content-item {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .item-bullet {
          color: #22c55e;
          font-size: 11px;
          line-height: 1.5;
          text-shadow: 0 0 8px #22c55e;
          flex-shrink: 0;
        }

        .item-text {
          font-size: 11px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.85);
        }

        .cursor {
          color: #22c55e;
          animation: blink 0.6s infinite;
          text-shadow: 0 0 8px #22c55e;
          font-weight: bold;
          margin-left: 2px;
        }

        @keyframes blink {
          0%, 45% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        /* ANALYZING STATE */
        .analyzing-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 30px 16px;
        }

        .analyzing-text {
          font-size: 11px;
          color: rgba(34, 197, 94, 0.7);
          letter-spacing: 0.1em;
        }
      `}</style>
    </div>
  );
}
