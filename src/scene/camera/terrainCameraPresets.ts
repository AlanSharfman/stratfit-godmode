// src/scene/camera/terrainCameraPresets.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Camera Presets (God Mode)
//
// Single source of truth for camera positioning across all terrain views.
// Every page that hosts a TerrainStage reads from here.
//
// Composition rules:
//   - Elevated panoramic angle for full terrain coverage
//   - Peak sits in upper third, horizon visible
//   - Centered to capture the entire mountain shape
//   - Consistent cross-page for spatial memory
// ═══════════════════════════════════════════════════════════════════════════

export interface CameraPreset {
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
}

/**
 * Default elevated panoramic angle — the "god view".
 * Centred, high enough to see the full terrain footprint,
 * pulled back for complete coverage of peaks, ridges and valleys.
 */
export const POSITION_PRESET: CameraPreset = {
  pos: [0, 260, 700],
  target: [0, 0, 0],
  fov: 50,
}

/**
 * Studio page — matches the default panoramic for consistency.
 */
export const STUDIO_PRESET: CameraPreset = {
  pos: [0, 260, 700],
  target: [0, 0, 0],
  fov: 50,
}

/**
 * Compare page — identical preset for both A and B panes.
 * Synchronized cameras ensure visual comparability.
 */
export const COMPARE_PRESET: CameraPreset = {
  pos: [0, 260, 700],
  target: [0, 0, 0],
  fov: 50,
}

/**
 * Welcome page — same panoramic angle, rendered behind blur overlay.
 * Slightly wider FOV for cinematic hero framing.
 */
export const WELCOME_PRESET: CameraPreset = {
  pos: [0, 280, 740],
  target: [0, 0, 0],
  fov: 52,
}

/**
 * Command Centre — cinematic wide-angle for theatre mode.
 * Slightly more elevated for dramatic framing.
 */
export const COMMAND_PRESET: CameraPreset = {
  pos: [0, 280, 740],
  target: [0, 0, 0],
  fov: 52,
}

/**
 * Progressive Terrain Build — elevated, centered, wide.
 * Captures mountain growth from a full panoramic position.
 */
export const POSITION_PROGRESSIVE_PRESET: CameraPreset = {
  pos: [0, 260, 700],
  target: [0, 0, 0],
  fov: 50,
}

/** All presets keyed by page context */
export const CAMERA_PRESETS = {
  position: POSITION_PRESET,
  positionProgressive: POSITION_PROGRESSIVE_PRESET,
  studio: STUDIO_PRESET,
  compare: COMPARE_PRESET,
  welcome: WELCOME_PRESET,
  command: COMMAND_PRESET,
} as const
