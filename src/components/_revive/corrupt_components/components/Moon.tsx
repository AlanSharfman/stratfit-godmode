/**
 * STRATFIT Moon — Atmospheric Element
 * 
 * A subtle, glowing celestial body that sits behind the mountain.
 * Acts as a visual anchor ("North Star" / "Target" symbolism).
 */

import React from 'react';
import { motion } from 'framer-motion';

interface MoonProps {
  /** Position from right edge (percentage) */
  rightOffset?: number;
  /** Position from top edge (percentage) */
  topOffset?: number;
  /** Size multiplier */
  scale?: number;
}

export const Moon: React.FC<MoonProps> = ({
  rightOffset = 12,
  topOffset = 10,
  scale = 1,
}) => {
  const baseSize = 60 * scale;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        right: `${rightOffset}%`,
        top: `${topOffset}%`,
        width: baseSize * 2.5,
        height: baseSize * 2.5,
      }}
      // Gentle breathing animation
      animate={{
        scale: [1, 1.03, 1],
        opacity: [0.8, 0.9, 0.8],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Moon outer glow gradient */}
          <radialGradient id="moonGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Soft blur for ethereal effect */}
          <filter id="moonBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
          </filter>
        </defs>

        {/* Outer glow */}
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="url(#moonGradient)"
        />

        {/* Moon core (wireframe style) */}
        <circle
          cx="60"
          cy="60"
          r="25"
          fill="#1e293b"
          stroke="#22d3ee"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* Inner arc (gives depth) */}
        <path
          d="M35,60 A25,25 0 0,1 85,60"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />

        {/* Orbit ring (dashed) */}
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="0.5"
          strokeDasharray="4 4"
          opacity="0.25"
        />

        {/* Small orbital dot */}
        <motion.circle
          cx="60"
          cy="20"
          r="2"
          fill="#22d3ee"
          opacity="0.6"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            transformOrigin: "60px 60px",
          }}
        />
      </svg>
    </motion.div>
  );
};

export default Moon;
