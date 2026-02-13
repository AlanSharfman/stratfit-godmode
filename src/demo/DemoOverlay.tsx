import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DemoStop } from "./DemoTourTypes";
import ArrowIndicator from "./ArrowIndicator";

type Phase = "idle" | "flag" | "ai";

type Props = {
  activeStop: DemoStop | null;
  phase: Phase;
  pulseKey: string;
};

export default function DemoOverlay({ activeStop, phase, pulseKey }: Props) {
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
      <AnimatePresence>
        {activeStop && (phase === "flag" || phase === "ai") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: 22,
              top: 22,
              padding: "14px 14px 12px",
              borderRadius: 14,
              background: "rgba(10,12,16,0.72)",
              border: "1px solid rgba(140,170,220,0.18)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
              width: 520,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ArrowIndicator tone={activeStop.arrow} pulseKey={pulseKey} />
              <div style={{ letterSpacing: 0.8, fontSize: 12, opacity: 0.86 }}>
                {activeStop.title}
              </div>
            </div>

            <div style={{ marginTop: 8, fontSize: 18, lineHeight: 1.2, fontWeight: 650 }}>
              {activeStop.headline}
            </div>

            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.82 }}>
              {activeStop.subline}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeStop && phase === "ai" && (
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 22 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              position: "absolute",
              right: 22,
              top: 22,
              width: 520,
              padding: 16,
              borderRadius: 16,
              background: "rgba(10,12,16,0.78)",
              border: "1px solid rgba(140,170,220,0.18)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 0.9, opacity: 0.78 }}>
              AI INTELLIGENCE
            </div>

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
    </div>
  );
}
