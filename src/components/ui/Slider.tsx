// src/components/ui/Slider.tsx
// STRATFIT — Premium White Slider

import React from "react";
import { motion } from "framer-motion";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  highlight?: boolean;
}

export default function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  onStart,
  onEnd,
  highlight,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-container">
      <motion.div
        className="slider-wrapper"
        animate={{
          filter: highlight ? "drop-shadow(0 0 12px rgba(255,255,255,0.4))" : "none",
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Track background */}
        <div className="slider-track">
          {/* Filled portion */}
          <motion.div
            className="slider-fill"
            style={{ width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Native input (invisible but functional) */}
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
          className="slider-input"
        />

        {/* Custom thumb */}
        <motion.div
          className="slider-thumb"
          style={{ left: `${percentage}%` }}
          animate={{ left: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        />
      </motion.div>

      <style>{`
        .slider-container {
          width: 100%;
          padding: 8px 0;
        }

        .slider-wrapper {
          position: relative;
          width: 100%;
          height: 20px;
          display: flex;
          align-items: center;
        }

        .slider-track {
          position: absolute;
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 2px;
          overflow: hidden;
        }

        .slider-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.95) 100%);
          border-radius: 2px;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        }

        .slider-thumb {
          position: absolute;
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 
            0 0 0 2px rgba(255, 255, 255, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.4),
            0 0 12px rgba(255, 255, 255, 0.3);
          cursor: grab;
          pointer-events: none;
          z-index: 2;
        }

        .slider-thumb:active {
          cursor: grabbing;
        }

        .slider-input {
          position: absolute;
          width: 100%;
          height: 20px;
          opacity: 0;
          cursor: pointer;
          z-index: 3;
          margin: 0;
        }

        .slider-input:focus + .slider-thumb {
          box-shadow: 
            0 0 0 3px rgba(255, 255, 255, 0.3),
            0 2px 8px rgba(0, 0, 0, 0.4),
            0 0 16px rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
