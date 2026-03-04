// src/scene/camera/terrainCameraPresets.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Camera Presets (God Mode)
//
// Single source of truth for camera positioning across all terrain views.
// Every page that hosts a TerrainStage reads from here.
//
// Composition rules:
//   - Peak sits in upper third
//   - Horizon visible
//   - No extreme top-down
//   - Consistent cross-page
//   - Shifted left so overlays don't collide with terrain markers
// ═══════════════════════════════════════════════════════════════════════════

export interface CameraPreset {
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
}

/**
 * Position page — primary terrain view.
 * Institutional "survey" angle: ridge in upper third, foreground depth,
 * slightly left-shifted to avoid overlay collision.
 */
export const POSITION_PRESET: CameraPreset = {
  pos: [-40, 150, 500],
  target: [-20, 14, 0],
  fov: 46,
}

/**
 * Studio page — identical to Position for consistency.
 */
export const STUDIO_PRESET: CameraPreset = {
  pos: [-40, 150, 500],
  target: [-20, 14, 0],
  fov: 46,
}

/**
 * Compare page — identical preset for both A and B panes.
 * Synchronized cameras ensure visual comparability.
 */
export const COMPARE_PRESET: CameraPreset = {
  pos: [-40, 150, 500],
  target: [-20, 14, 0],
  fov: 46,
}

/**
 * Welcome page — same composition but used with blur overlay.
 */
export const WELCOME_PRESET: CameraPreset = {
  pos: [-40, 150, 500],
  target: [-20, 14, 0],
  fov: 46,
}

/**
 * Command Centre — cinematic wide-angle for theatre mode.
 * Slightly elevated for dramatic framing.
 */
export const COMMAND_PRESET: CameraPreset = {
  pos: [-40, 150, 500],
  target: [-20, 14, 0],
  fov: 46,
}

/** All presets keyed by page context */
export const CAMERA_PRESETS = {
  position: POSITION_PRESET,
  studio: STUDIO_PRESET,
  compare: COMPARE_PRESET,
  welcome: WELCOME_PRESET,
  command: COMMAND_PRESET,
} as const
