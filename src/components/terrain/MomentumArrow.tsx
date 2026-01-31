import React from "react";
import styles from "./TerrainTopStrip.module.css";

type MomentumArrowProps = {
  /** e.g. -0.01 for -1% */
  momGrowth: number;
};

export default function MomentumArrow({ momGrowth }: MomentumArrowProps) {
  const dir: "up" | "down" | "flat" =
    momGrowth > 0.0005 ? "up" : momGrowth < -0.0005 ? "down" : "flat";

  return (
    <div className={styles.momentumArrowWrap} data-dir={dir}>
      {/* trailing streaks */}
      <div className={styles.momentumStreaks} aria-hidden="true">
        <span className={styles.streak} />
        <span className={styles.streak} />
        <span className={styles.streak} />
      </div>

      {/* arrow */}
      <svg
        className={styles.momentumArrow}
        viewBox="0 0 220 44"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sf_arrow_grad" x1="0" y1="0" x2="220" y2="0">
            <stop offset="0" stopColor="rgba(80, 220, 255, 0.25)" />
            <stop offset="0.55" stopColor="rgba(80, 220, 255, 0.75)" />
            <stop offset="1" stopColor="rgba(80, 220, 255, 0.95)" />
          </linearGradient>

          <linearGradient id="sf_sweep_grad" x1="0" y1="0" x2="220" y2="0">
            <stop offset="0" stopColor="rgba(255,255,255,0)" />
            <stop offset="0.5" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <filter id="sf_soft_glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.35 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* shaft */}
        <path
          d="M10 22H192"
          stroke="url(#sf_arrow_grad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#sf_soft_glow)"
        />

        {/* head */}
        <path
          d="M192 14L212 22L192 30"
          stroke="url(#sf_arrow_grad)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          filter="url(#sf_soft_glow)"
        />

        {/* sweep highlight */}
        <rect
          className={styles.momentumSweep}
          x="0"
          y="17"
          width="60"
          height="10"
          fill="url(#sf_sweep_grad)"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}


