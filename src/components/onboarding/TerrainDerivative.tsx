import React, { useId, useMemo } from "react";
import { motion } from "framer-motion";
import type { TerrainParams } from "./terrainParams";

type Props = {
  className?: string;
  params?: TerrainParams;
  /** if true, shows subtle “ghost ridges” for scenario compare */
  showGhostRidges?: boolean;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * STRATFIT — Terrain Derivative (Onboarding)
 * Investor-safe, calm, no numbers. A stylised “mountain + lake + mist + reflection”.
 * Driven by normalized params (0..1).
 */
export default function TerrainDerivative({ className, params, showGhostRidges = false }: Props) {
  const uid = useId().replace(/:/g, "");

  const p = {
    growth: clamp01(params?.growth ?? 0.45),
    cost: clamp01(params?.cost ?? 0.35),
    runway: clamp01(params?.runway ?? 0.6),
    risk: clamp01(params?.risk ?? 0.25),
    scenario: clamp01(params?.scenario ?? 0.5),
  };

  const ids = useMemo(() => {
    return {
      sky: `sft-sky-${uid}`,
      mountain: `sft-mountain-${uid}`,
      ridge: `sft-ridge-${uid}`,
      water: `sft-water-${uid}`,
      mistBlur: `sft-mistBlur-${uid}`,
      reflectBlur: `sft-reflectBlur-${uid}`,
      reflectFade: `sft-reflectFade-${uid}`,
      reflectMask: `sft-reflectMask-${uid}`,
    };
  }, [uid]);

  // --- Derived geometry (kept intentionally subtle) ---
  const geo = useMemo(() => {
    // Peak height range: 220..320
    const peakY = lerp(320, 220, p.growth);

    // Secondary peak shifts and prominence based on scenario
    const ridgeShift = lerp(-40, 40, p.scenario);
    const secondaryPeakY = lerp(315, 250, p.scenario * 0.7 + p.growth * 0.3);

    // Tree line: 395..430 (higher costs -> higher line)
    const treeLineY = lerp(430, 395, p.cost);

    // Water line: 480..520 (less runway -> higher water)
    const waterY = lerp(520, 480, 1 - p.runway);

    // Mist opacity: 0.08..0.26
    const mist = lerp(0.08, 0.26, p.risk);

    // Reflection opacity: 0.08..0.18
    const refl = lerp(0.08, 0.18, p.runway * 0.6 + (1 - p.risk) * 0.4);

    return {
      peakY,
      ridgeShift,
      secondaryPeakY,
      treeLineY,
      waterY,
      mist,
      refl,
    };
  }, [p.growth, p.cost, p.runway, p.risk, p.scenario]);

  // Main mountain silhouette path — stable base shape
  // We’ll gently “breathe” ridge points using geo.* (but keep it calm).
  const mountainPath = useMemo(() => {
    const peakX = 520;
    const peakY = geo.peakY;

    const secX = 700 + geo.ridgeShift;
    const secY = geo.secondaryPeakY;

    // Smooth ridge control points (keep consistent to avoid “wobble”)
    return [
      `M 80 460`,
      `C 190 430, 250 380, 320 370`,
      `C 390 360, 430 300, ${peakX} ${peakY}`,
      `C 580 270, 620 320, ${secX} ${secY}`,
      `C 820 360, 900 420, 1000 450`,
      `C 1120 485, 1210 500, 1360 520`,
      `L 1360 640`,
      `L 80 640`,
      `Z`,
    ].join(" ");
  }, [geo.peakY, geo.secondaryPeakY, geo.ridgeShift]);

  // A softer “ridge highlight” path (thin line) for premium definition
  const ridgeStrokePath = useMemo(() => {
    const peakX = 520;
    const peakY = geo.peakY;

    const secX = 700 + geo.ridgeShift;
    const secY = geo.secondaryPeakY;

    return [
      `M 240 420`,
      `C 360 380, 430 320, ${peakX} ${peakY}`,
      `C 590 265, 630 320, ${secX} ${secY}`,
      `C 840 380, 980 420, 1140 455`,
    ].join(" ");
  }, [geo.peakY, geo.secondaryPeakY, geo.ridgeShift]);

  // Reflection transform: mirror vertically around water line
  // We place the reflection group below the waterline and blur it.
  const reflectionTransform = useMemo(() => {
    const y = geo.waterY;
    // Translate to waterline, scaleY(-1), translate back
    return `translate(0 ${y * 2}) scale(1 -1)`;
  }, [geo.waterY]);

  return (
    <div className={className}>
      <svg
        viewBox="0 0 1440 640"
        role="img"
        aria-label="STRATFIT terrain"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(210,240,255,0.22)" />
            <stop offset="55%" stopColor="rgba(180,225,255,0.12)" />
            <stop offset="100%" stopColor="rgba(120,190,240,0.06)" />
          </linearGradient>

          {/* Mountain fill (ice/cyan) */}
          <linearGradient id={ids.mountain} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(210,245,255,0.28)" />
            <stop offset="35%" stopColor="rgba(120,210,255,0.18)" />
            <stop offset="70%" stopColor="rgba(40,120,200,0.14)" />
            <stop offset="100%" stopColor="rgba(10,40,80,0.18)" />
          </linearGradient>

          {/* Ridge stroke gradient */}
          <linearGradient id={ids.ridge} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(160,235,255,0.18)" />
            <stop offset="55%" stopColor="rgba(120,210,255,0.32)" />
            <stop offset="100%" stopColor="rgba(160,235,255,0.10)" />
          </linearGradient>

          {/* Water gradient */}
          <linearGradient id={ids.water} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(40,150,220,0.18)" />
            <stop offset="55%" stopColor="rgba(20,110,190,0.20)" />
            <stop offset="100%" stopColor="rgba(5,45,90,0.30)" />
          </linearGradient>

          {/* Mist blur */}
          <filter id={ids.mistBlur} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>

          {/* Reflection blur */}
          <filter id={ids.reflectBlur} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>

          {/* Fade out reflection as it goes down */}
          <linearGradient id={ids.reflectFade} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
          </linearGradient>

          <mask id={ids.reflectMask}>
            <rect x="0" y="0" width="1440" height="640" fill={`url(#${ids.reflectFade})`} />
          </mask>
        </defs>

        {/* SKY */}
        <rect x="0" y="0" width="1440" height="640" fill={`url(#${ids.sky})`} />

        {/* Subtle horizon glow */}
        <motion.ellipse
          cx="720"
          cy="330"
          rx="760"
          ry="170"
          fill="rgba(120,210,255,0.05)"
          initial={{ opacity: 0.0 }}
          animate={{ opacity: 1.0 }}
          transition={{ duration: 0.8 }}
        />

        {/* TREE LINE (constraint band) */}
        <motion.rect
          x="0"
          y={geo.treeLineY}
          width="1440"
          height={640 - geo.treeLineY}
          fill="rgba(8,20,35,0.18)"
          initial={{ opacity: 0.0 }}
          animate={{ opacity: 1.0 }}
          transition={{ duration: 0.7 }}
        />

        {/* WATER (runway/level) */}
        <motion.rect
          x="0"
          y={geo.waterY}
          width="1440"
          height={640 - geo.waterY}
          fill={`url(#${ids.water})`}
          initial={{ opacity: 0.0 }}
          animate={{ opacity: 1.0 }}
          transition={{ duration: 0.7 }}
        />

        {/* MOUNTAIN */}
        <motion.path
          d={mountainPath}
          fill={`url(#${ids.mountain})`}
          initial={{ opacity: 0.0, y: 6 }}
          animate={{ opacity: 1.0, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />

        {/* Ghost ridges (scenario compare hint) */}
        {showGhostRidges && (
          <>
            <path d={mountainPath} fill="rgba(120,210,255,0.05)" transform="translate(-18 8)" />
            <path d={mountainPath} fill="rgba(120,210,255,0.035)" transform="translate(16 12)" />
          </>
        )}

        {/* Ridge highlight stroke */}
        <motion.path
          d={ridgeStrokePath}
          fill="none"
          stroke={`url(#${ids.ridge})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0.0 }}
          animate={{ opacity: 1.0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
        />

        {/* MIST (risk/uncertainty) */}
        <motion.g
          filter={`url(#${ids.mistBlur})`}
          initial={{ opacity: 0.0 }}
          animate={{ opacity: 1.0 }}
          transition={{ duration: 0.9, delay: 0.05 }}
        >
          <motion.ellipse
            cx="520"
            cy="430"
            rx="520"
            ry="90"
            fill={`rgba(180,235,255,${geo.mist})`}
            animate={{ x: [0, 12, 0], opacity: [geo.mist, geo.mist * 0.9, geo.mist] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx="880"
            cy="445"
            rx="560"
            ry="110"
            fill={`rgba(120,210,255,${geo.mist * 0.9})`}
            animate={{ x: [0, -10, 0], opacity: [geo.mist * 0.9, geo.mist * 0.82, geo.mist * 0.9] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>

        {/* REFLECTION */}
        <motion.g
          transform={reflectionTransform}
          filter={`url(#${ids.reflectBlur})`}
          mask={`url(#${ids.reflectMask})`}
          initial={{ opacity: 0.0 }}
          animate={{ opacity: 1.0 }}
          transition={{ duration: 1.0, delay: 0.08 }}
        >
          <path d={mountainPath} fill={`rgba(120,210,255,${geo.refl})`} />
          <path
            d={ridgeStrokePath}
            fill="none"
            stroke={`rgba(160,235,255,${geo.refl * 0.9})`}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Water surface sparkles (very subtle, safe) */}
        <motion.circle
          cx="320"
          cy={geo.waterY + 45}
          r="1.6"
          fill="rgba(160,235,255,0.18)"
          animate={{ opacity: [0.05, 0.22, 0.05] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="980"
          cy={geo.waterY + 78}
          r="1.2"
          fill="rgba(160,235,255,0.14)"
          animate={{ opacity: [0.05, 0.18, 0.05] }}
          transition={{ duration: 5.3, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}


