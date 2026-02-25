import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DemoStop } from "./DemoTourTypes";
import ArrowIndicator from "./ArrowIndicator";
import DemoRecorderControls from "./DemoRecorderControls";

type Phase = "idle" | "flag" | "ai";

type Props = {
  activeStop: DemoStop | null;
  phase: Phase;
  pulseKey: string;
  spotlight: { x: number; y: number; r: number } | null;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function DemoOverlay({
  activeStop,
  phase,
  pulseKey,
  spotlight,
  voiceEnabled,
  onToggleVoice,
}: Props) {
  const show = !!activeStop && (phase === "flag" || phase === "ai");

  const spotlightStyle = useMemo(() => {
    if (!spotlight || !show) return null;
    const x = Math.round(spotlight.x);
    const y = Math.round(spotlight.y);
    const r = clamp(Math.round(spotlight.r), 90, 260);
    return {
      background: `radial-gradient(circle ${r}px at ${x}px ${y}px, rgba(0,0,0,0.02), rgba(0,0,0,0.72) 75%, rgba(0,0,0,0.86) 100%)`,
    } as const;
  }, [spotlight, show]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        color: "rgba(230,240,255,0.95)",
        zIndex: 9999,
      }}
    >
      {/* Spotlight mask */}
      <AnimatePresence>
        {spotlightStyle && (
          <motion.div
            key="spotlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, ...spotlightStyle, pointerEvents: "none" }}
          />
        )}
      </AnimatePresence>

      {/* Anchor ring pulse */}
      <AnimatePresence>
        {spotlight && show && (
          <motion.div
            key="ring"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: spotlight.x,
              top: spotlight.y,
              width: spotlight.r * 1.35,
              height: spotlight.r * 1.35,
              transform: "translate(-50%, -50%)",
              borderRadius: 999,
              border: "1px solid rgba(0,224,255,0.18)",
              boxShadow: "0 0 26px rgba(0,224,255,0.12)",
              pointerEvents: "none",
            }}
          >
            <motion.div
              animate={{ opacity: [0.35, 0.10, 0.35], scale: [1, 1.08, 1] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0, borderRadius: 999, border: "1px solid rgba(0,224,255,0.12)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Flag Panel */}
      <AnimatePresence>
        {activeStop && show && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ position: "absolute", left: 22, top: 22, padding: "14px 14px 12px", borderRadius: 14, background: "rgba(10,12,16,0.72)", border: "1px solid rgba(140,170,220,0.18)", boxShadow: "0 18px 50px rgba(0,0,0,0.35)", width: 520 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ArrowIndicator tone={activeStop.arrow} pulseKey={pulseKey} />
              <div style={{ letterSpacing: 0.8, fontSize: 12, opacity: 0.86 }}>{activeStop.title}</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 18, lineHeight: 1.2, fontWeight: 650 }}>{activeStop.headline}</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.82 }}>{activeStop.subline}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right AI Panel */}
      <AnimatePresence>
        {activeStop && phase === "ai" && (
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 22 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ position: "absolute", right: 22, top: 22, width: 520, padding: 16, borderRadius: 16, background: "rgba(10,12,16,0.78)", border: "1px solid rgba(140,170,220,0.18)", boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}
          >
            <div style={{ fontSize: 12, letterSpacing: 0.9, opacity: 0.78 }}>AI INTELLIGENCE</div>
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.92 }}>
              <div style={{ opacity: 0.70, marginBottom: 4 }}>What</div>
              <div style={{ lineHeight: 1.35 }}>{activeStop.ai.what}</div>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.92 }}>
              <div style={{ opacity: 0.70, marginBottom: 4 }}>Why</div>
              <div style={{ lineHeight: 1.35 }}>{activeStop.ai.why}</div>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.92 }}>
              <div style={{ opacity: 0.70, marginBottom: 4 }}>What this means</div>
              <div style={{ lineHeight: 1.35 }}>{activeStop.ai.means}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom-left controls (voice + recording) */}
      <div style={{ position: "absolute", left: 18, bottom: 16, pointerEvents: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, background: "rgba(10,12,16,0.72)", border: "1px solid rgba(140,170,220,0.16)", boxShadow: "0 14px 40px rgba(0,0,0,0.28)" }}>
          <button
            onClick={onToggleVoice}
            style={{ appearance: "none", border: "1px solid rgba(255,255,255,0.12)", background: voiceEnabled ? "rgba(0,224,255,0.12)" : "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.90)", borderRadius: 10, padding: "8px 10px", fontWeight: 800, fontSize: 12, letterSpacing: 0.4, cursor: "pointer" }}
          >
            Voice: {voiceEnabled ? "ON" : "OFF"}
          </button>
          <DemoRecorderControls />
        </div>
      </div>
    </div>
  );
}
