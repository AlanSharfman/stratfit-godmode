export interface ModeConfig {
  terrainOpacity: number;
  wireframeOpacity: number;
  glowMultiplier: number;
  colorSaturation: number;
  animationSpeed: number;
  pulseEnabled: boolean;
  hazeOpacity: number;
  pathGlow: number;
  bloomIntensity: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  // Strategy-mode simulation-space calibration (optional — only set on strategy)
  visualDepthBoost?: number;
  pathCutBoost?: number;
  fogNear?: number;
  fogFar?: number;
  fogColor?: string;
  trajectoryHaloOpacity?: number;
  trajectoryHaloWidthMult?: number;
  forwardTargetZ?: number;
  forwardCamZMult?: number;
  divergenceOverlay?: boolean;
  divergenceOpacity?: number;
  divergenceColor?: string;
}

export type MountainMode =
  | "default"
  | "celebration"
  | "ghost"
  | "instrument"
  | "baseline"
  | "strategy";

export const MODE_CONFIGS: Record<MountainMode, ModeConfig> = {
  default: {
    terrainOpacity: 1,
    wireframeOpacity: 1,
    glowMultiplier: 1,
    colorSaturation: 1,
    animationSpeed: 1,
    pulseEnabled: false,
    hazeOpacity: 1,
    pathGlow: 1,
    bloomIntensity: 0,
    autoRotate: false,
    autoRotateSpeed: 0,
  },
  celebration: {
    terrainOpacity: 1,
    wireframeOpacity: 0.8,
    glowMultiplier: 2.5,
    colorSaturation: 1.2,
    animationSpeed: 0.5,
    pulseEnabled: true,
    hazeOpacity: 0.15,
    pathGlow: 3,
    bloomIntensity: 0.8,
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  ghost: {
    terrainOpacity: 0.15,
    wireframeOpacity: 0.1,
    glowMultiplier: 0,
    colorSaturation: 0.3,
    animationSpeed: 0.2,
    pulseEnabled: false,
    hazeOpacity: 0,
    pathGlow: 0.3,
    bloomIntensity: 0,
    autoRotate: false,
    autoRotateSpeed: 0,
  },
  // INSTRUMENT — Compact diagnostic terrain for Initialize page
  // Mesh + subtle wireframe, slow rotation, soft light, no overlays
  instrument: {
    terrainOpacity: 0.7,
    wireframeOpacity: 0.5,
    glowMultiplier: 0.15,
    colorSaturation: 0.6,
    animationSpeed: 0.2,
    pulseEnabled: false,
    hazeOpacity: 0,
    pathGlow: 0,
    bloomIntensity: 0,
    autoRotate: true,
    autoRotateSpeed: 0.1,
  },
  // BASELINE — Deterministic structural view (transparent scene, auto-rotate)
  baseline: {
    terrainOpacity: 1,
    wireframeOpacity: 1,
    glowMultiplier: 1,
    colorSaturation: 1,
    animationSpeed: 1,
    pulseEnabled: false,
    hazeOpacity: 1,
    pathGlow: 1,
    bloomIntensity: 0,
    autoRotate: true,
    autoRotateSpeed: 0.3,
  },
  // STRATEGY — Strategy Studio lever-driven terrain (transparent scene, interactive)
  strategy: {
    terrainOpacity: 1,
    wireframeOpacity: 1,
    glowMultiplier: 1,
    colorSaturation: 1,
    animationSpeed: 1,
    pulseEnabled: false,
    hazeOpacity: 1,
    pathGlow: 1,
    bloomIntensity: 0,
    autoRotate: true,
    autoRotateSpeed: 0.3,
    // Simulation-space calibration
    visualDepthBoost: 1.12,
    pathCutBoost: 1.12,
    fogNear: 18,
    fogFar: 90,
    fogColor: "#0b1020",
    trajectoryHaloOpacity: 0.22,
    trajectoryHaloWidthMult: 1.8,
    forwardTargetZ: 1.2,
    forwardCamZMult: 1.08,
    divergenceOverlay: true,
    divergenceOpacity: 0.06,
    divergenceColor: "#312e81",
  },
};
