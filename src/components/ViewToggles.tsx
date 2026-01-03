// src/components/ViewToggles.tsx
// STRATFIT — Glassmorphic View Toggle (inside terrain viewport)

import React from "react";
import { motion } from "framer-motion";

export type CenterView = "terrain" | "variance" | "actuals";

interface ViewTogglesProps {
  value: CenterView;
  onChange: (view: CenterView) => void;
}

const OPTIONS: { key: CenterView; label: string }[] = [
  { key: "terrain", label: "TERRAIN" },
  { key: "variance", label: "VARIANCES" },
  { key: "actuals", label: "ACTUALS" },
];

export default function ViewToggles({ value, onChange }: ViewTogglesProps) {
  return (
    <div
      className="absolute top-5 left-8 z-50 flex gap-3"
      style={{
        transform: "scale(1.5)",
        transformOrigin: "top left",
      }}
    >
      {OPTIONS.map((opt) => {
        const isActive = value === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`
              relative px-4 py-1.5 text-[10px] font-semibold tracking-widest 
              transition-all duration-300 rounded-full
              ${isActive ? "text-white" : "text-slate-400 hover:text-slate-200"}
            `}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: isActive
                ? "rgba(0, 229, 255, 0.15)"
                : "rgba(15, 23, 42, 0.50)",
              border: isActive
                ? "1px solid rgba(0, 229, 255, 0.50)"
                : "1px solid rgba(0, 229, 255, 0.20)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: isActive
                ? "0 0 12px rgba(0, 229, 255, 0.25)"
                : "none",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="view-toggle-bg"
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "rgba(0, 229, 255, 0.08)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                  duration: 0.3,
                }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
