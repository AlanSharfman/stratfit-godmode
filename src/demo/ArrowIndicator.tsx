import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { ArrowTone } from "./DemoTourTypes";

type Props = {
  tone: ArrowTone;
  pulseKey: string; // change this to retrigger once (per stop)
};

function toneToColor(tone: ArrowTone) {
  // disciplined palette (no neon)
  if (tone === "up") return { fg: "rgba(47,191,113,0.95)", glow: "rgba(47,191,113,0.20)" };     // Emerald
  if (tone === "down") return { fg: "rgba(217,75,75,0.95)", glow: "rgba(217,75,75,0.18)" };     // Red
  return { fg: "rgba(95,212,255,0.90)", glow: "rgba(95,212,255,0.10)" };                        // Cyan
}

export default function ArrowIndicator({ tone, pulseKey }: Props) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    // pulse once on entry for up/down only
    setArmed(tone !== "neutral");
    const t = setTimeout(() => setArmed(false), 1100);
    return () => clearTimeout(t);
  }, [pulseKey, tone]);

  const { fg, glow } = useMemo(() => toneToColor(tone), [tone]);

  const path = tone === "down"
    ? "M12 5 L12 19 M12 19 L6 13 M12 19 L18 13"
    : "M12 19 L12 5 M12 5 L6 11 M12 5 L18 11";

  if (tone === "neutral") {
    return (
      <div style={{ width: 22, height: 22, display: "grid", placeItems: "center" }}>
        <div style={{ width: 10, height: 10, borderRadius: 999, background: fg, opacity: 0.8 }} />
      </div>
    );
  }

  return (
    <motion.div
      key={pulseKey}
      initial={{ scale: 0.98, filter: "drop-shadow(0 0 0px rgba(0,0,0,0))" }}
      animate={
        armed
          ? {
              scale: [0.95, 1.05, 1.0],
              filter: [
                "drop-shadow(0 0 0px rgba(0,0,0,0))",
                `drop-shadow(0 0 10px ${glow})`,
                `drop-shadow(0 0 6px ${glow})`,
              ],
            }
          : { scale: 1.0, filter: `drop-shadow(0 0 6px ${glow})` }
      }
      transition={{ duration: 0.85, ease: "easeOut" }}
      style={{ width: 22, height: 22, display: "grid", placeItems: "center" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d={path} stroke={fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
}
