// src/components/ui/Slider.tsx
import React from "react";
import { motion } from "framer-motion";

export default function Slider(props: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  highlight?: boolean;
}) {
  const { value, min, max, step = 1, onChange, onStart, onEnd, highlight } = props;

  return (
    <div className="w-full">
      <motion.div
        className="relative w-full h-[34px] flex items-center"
        animate={{
          filter: highlight ? "drop-shadow(0 0 12px rgba(34,211,238,0.35))" : "none",
        }}
      >
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onMouseDown={onStart}
          onTouchStart={onStart}
          onMouseUp={onEnd}
          onTouchEnd={onEnd}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-cyan-400"
          style={{
            height: 4,
            borderRadius: 999,
          }}
        />
      </motion.div>
    </div>
  );
}
