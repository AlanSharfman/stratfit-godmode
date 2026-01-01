/**
 * STRATFIT CommandBar — Glassmorphism Header
 *
 * Fixes:
 * - Scenario selector now uses ACTIVE SCENARIO COLOR (no more hard-coded cyan)
 * - Dropdown hover/selected styling matches scenario
 * - Active dot + glow + border are aligned with mountain palette
 * - Primary action button glow matches active scenario
 *
 * NO layout changes. Pure styling/behavior correctness.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScenarioId } from "@/state/scenarioStore";

// ============================================================================
// TYPES
// ============================================================================

interface Scenario {
  id: ScenarioId;
  label: string;
  color: string; // MUST match mountain palette for that scenario
}

interface CommandBarProps {
  scenario: ScenarioId;
  scenarios: Scenario[];
  onScenarioChange: (id: ScenarioId) => void;
  onSave: () => void;
  onLoad: () => void;
  onReset: () => void;
}

// ============================================================================
// STYLES
// ============================================================================

const UI = {
  bgDeep: "#0B0E14",
  borderColor: "#1e293b",
  textMuted: "#94a3b8",
  textBright: "#ffffff",
  panelBg: "#151b26",
};

// Helpers
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function hexToRgba(hex: string, a = 1) {
  // supports #rgb, #rrggbb
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return `rgba(${r},${g},${b},${clamp01(a)})`;
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${clamp01(a)})`;
  }
  // fallback
  return `rgba(34,211,238,${clamp01(a)})`;
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onOutside, enabled]);
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CommandBar: React.FC<CommandBarProps> = ({
  scenario,
  scenarios,
  onScenarioChange,
  onSave,
  onLoad,
  onReset,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentScenario = useMemo(() => {
    return scenarios.find((s) => s.id === scenario) ?? scenarios[0];
  }, [scenario, scenarios]);

  // ACTIVE SCENARIO COLOR (single source of truth for UI glow)
  const activeColor = currentScenario?.color ?? "#22d3ee";
  const activeGlowSoft = hexToRgba(activeColor, 0.18);
  const activeGlowMid = hexToRgba(activeColor, 0.30);
  const activeGlowHard = hexToRgba(activeColor, 0.55);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  useOutsideClick(
    dropdownRef,
    () => setDropdownOpen(false),
    dropdownOpen
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 64,
        background: "rgba(11, 14, 20, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 32px",
        zIndex: 9999,
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* LEFT: Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div
          style={{
            width: 28,
            height: 28,
            background: `linear-gradient(135deg, ${activeColor}, ${hexToRgba(activeColor, 0.65)})`,
            borderRadius: 8,
            boxShadow: `0 0 16px ${activeGlowHard}`,
          }}
        />
        <span
          style={{
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: 2,
            color: UI.textBright,
          }}
        >
          STRATFIT
        </span>
      </div>

      {/* CENTER: Scenario Selector */}
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <motion.div
            onClick={() => setDropdownOpen((v) => !v)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: UI.panelBg,
              border: `1px solid ${dropdownOpen ? activeColor : UI.borderColor}`,
              borderRadius: 100,
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: dropdownOpen ? `0 0 22px ${activeGlowSoft}` : "none",
            }}
          >
            {/* Live pulse dot (ACTIVE scenario color) */}
            <motion.span
              animate={{
                opacity: [1, 0.55, 1],
                scale: [1, 1.12, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: 8,
                height: 8,
                background: activeColor,
                borderRadius: "50%",
                boxShadow: `0 0 10px ${activeColor}`,
              }}
            />

            <span
              style={{
                color: "#e2e8f0",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              SCENARIO: {currentScenario.label}
            </span>

            <motion.span
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              style={{ color: UI.textMuted, fontSize: 12 }}
            >
              ▼
            </motion.span>
          </motion.div>

          {/* Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "100%",
                  minWidth: 240,
                  marginTop: 8,
                  background: "rgba(21, 27, 38, 0.98)",
                  border: `1px solid ${UI.borderColor}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                }}
              >
                {scenarios.map((s) => {
                  const isActive = scenario === s.id;
                  const rowGlow = hexToRgba(s.color, 0.12);
                  return (
                    <motion.div
                      key={s.id}
                      onClick={() => {
                        onScenarioChange(s.id);
                        setDropdownOpen(false);
                      }}
                      whileHover={{ backgroundColor: rowGlow }}
                      style={{
                        padding: "14px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        background: isActive ? hexToRgba(s.color, 0.10) : "transparent",
                        borderLeft: isActive ? `3px solid ${s.color}` : "3px solid transparent",
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: s.color,
                          boxShadow: isActive ? `0 0 10px ${hexToRgba(s.color, 0.55)}` : "none",
                        }}
                      />
                      <span style={{ color: UI.textBright, fontSize: 14, fontWeight: isActive ? 700 : 500 }}>
                        {s.label}
                      </span>

                      {/* Active pill (right aligned) */}
                      {isActive && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 11,
                            fontWeight: 700,
                            color: s.color,
                            background: hexToRgba(s.color, 0.10),
                            border: `1px solid ${hexToRgba(s.color, 0.20)}`,
                            padding: "4px 8px",
                            borderRadius: 999,
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <ActionButton onClick={onReset} variant="ghost" accent={activeColor}>
          Reset
        </ActionButton>
        <ActionButton onClick={onLoad} variant="ghost" accent={activeColor}>
          Load
        </ActionButton>
        <ActionButton onClick={onSave} variant="primary" accent={activeColor}>
          Save Scenario
        </ActionButton>
      </div>
    </div>
  );
};

// ============================================================================
// ACTION BUTTON
// ============================================================================

interface ActionButtonProps {
  onClick: () => void;
  variant: "ghost" | "primary";
  accent: string; // active scenario color
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, variant, accent, children }) => {
  const isPrimary = variant === "primary";
  const border = isPrimary ? `1px solid rgba(255,255,255,0.10)` : "1px solid transparent";
  const bg = isPrimary ? hexToRgba(accent, 0.10) : "transparent";
  const fg = isPrimary ? accent : UI.textMuted;
  const glow = isPrimary ? `0 0 22px ${hexToRgba(accent, 0.10)}` : "none";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{
        scale: 1.03,
        boxShadow: isPrimary ? `0 0 0 1px ${hexToRgba(accent, 0.35)}, 0 0 26px ${hexToRgba(accent, 0.14)}` : "none",
        color: isPrimary ? accent : "#e2e8f0",
      }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: bg,
        border,
        color: fg,
        padding: "10px 18px",
        fontSize: 13,
        fontWeight: 700,
        borderRadius: 10,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: glow,
      }}
    >
      {children}
    </motion.button>
  );
};

export default CommandBar;
