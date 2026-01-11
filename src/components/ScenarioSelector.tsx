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
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const currentScenario = SCENARIOS.find((s) => s.id === scenario);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Portal positioning
  useEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }

    const update = () => {
      const btn = buttonRef.current;
      if (!btn) return;

      const r = btn.getBoundingClientRect();
      const width = Math.max(260, r.width);
      const left = Math.min(window.innerWidth - width - 12, Math.max(12, r.left));

      const estimatedH = 240;
      const spaceBelow = window.innerHeight - r.bottom;
      const top =
        spaceBelow < estimatedH
          ? Math.max(12, r.top - 10 - estimatedH)
          : Math.min(window.innerHeight - estimatedH - 12, r.bottom + 10);

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

  // Discoverability hint — optional: keep logic but don't inject visuals here
  useEffect(() => {
    if (hasInteracted) return;
    const t = setTimeout(() => {
      if (!hasInteracted) {
        // leave as logic-only for now (no CSS pulse here)
      }
    }, 8000);
    return () => clearTimeout(t);
  }, [hasInteracted]);

  const handleSelect = (id: ScenarioId) => {
    setHasInteracted(true);
    onChange(id);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setHasInteracted(true);
    setIsOpen((v) => !v);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div ref={buttonRef}>
        <ActiveScenarioBezel
          label={currentScenario?.label ?? "Base Case"}
          subLabel={currentScenario?.desc}
          onOpen={handleToggle}
        />
      </div>

      {isOpen && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
                zIndex: 2147483647,
                borderRadius: 14,
                background:
                  "linear-gradient(180deg, rgba(14,18,26,0.98) 0%, rgba(10,14,22,0.99) 100%)",
                border: "1px solid rgba(120,180,255,0.18)",
                boxShadow: "0 14px 46px rgba(0,0,0,0.62), inset 0 1px 0 rgba(190,235,255,0.10)",
                overflow: "hidden",
              }}
            >
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 3,
                      height: 22,
                      borderRadius: 999,
                      background: SCENARIO_COLORS[s.id].primary,
                      opacity: s.id === scenario ? 1 : 0.55,
                    }}
                  />
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: s.id === scenario ? SCENARIO_COLORS[s.id].primary : "rgba(255,255,255,0.88)",
                      }}
                    >
                      {s.label}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(170,190,205,0.60)" }}>{s.desc}</span>
                  </span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
