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

export interface CameraControlsConfig {
  minDistance: number
  maxDistance: number
  minPolarAngle: number
  maxPolarAngle: number
  dampingFactor: number
  rotateSpeed: number
}

/**
 * GOD VIEW — Canonical wide-angle panoramic camera.
 *
 * Locked as the default for Position + Compare.
 * Shows full terrain, all KPI markers, and undulations.
 *
 * Camera geometry (terrain = 560w × 360d):
 *   • Y/Z ratio ~0.36 gives a ~20° elevation — high enough for
 *     full terrain coverage, low enough for ridge silhouettes.
 *   • Slight X offset (+30) breaks symmetry for cinematic composition.
 *   • Target Y = +30 lifts gaze so peaks sit in upper third.
 *   • FOV 50° — wider field for better marker readability and
 *     scene breathing room without losing dramatic depth.
 */
export const GOD_VIEW_PRESET: CameraPreset = {
  pos: [30, 270, 740],
  target: [0, 30, 0],
  fov: 50,
}

/** Controls config shared by Position + Compare (pairs with GOD_VIEW_PRESET). */
export const GOD_VIEW_CONTROLS: CameraControlsConfig = {
  minDistance: 250,
  maxDistance: 1100,
  minPolarAngle: 0.30,
  maxPolarAngle: 1.50,
  dampingFactor: 0.08,
  rotateSpeed: 1.2,
}

export const POSITION_PRESET: CameraPreset = GOD_VIEW_PRESET

export const STUDIO_PRESET: CameraPreset = {
  pos: [28, 240, 620],
  target: [0, 30, 0],
  fov: 47,
}

export const COMPARE_PRESET: CameraPreset = GOD_VIEW_PRESET

export const WELCOME_PRESET: CameraPreset = {
  pos: [45, 235, 610],
  target: [0, 38, 0],
  fov: 49,
}

export const COMMAND_PRESET: CameraPreset = {
  pos: [45, 235, 610],
  target: [0, 38, 0],
  fov: 49,
}

/**
 * HERO VIEW — Cinematic elevated oblique angle.
 *
 * Camera geometry (terrain = 420w × 270d):
 *   • ~25° elevation for dramatic ridge silhouettes.
 *   • Diagonal X offset creates compositional asymmetry (~17°).
 *   • Target Y = +25 so summit sits in upper third of frame.
 *   • FOV 44° — tighter compression for cinematic depth.
 */
export const HERO_VIEW_PRESET: CameraPreset = {
  pos: [160, 280, 500],
  target: [0, 25, 0],
  fov: 44,
}

/** Controls config for hero view — slightly tighter orbit constraints. */
export const HERO_VIEW_CONTROLS: CameraControlsConfig = {
  minDistance: 250,
  maxDistance: 900,
  minPolarAngle: 0.30,
  maxPolarAngle: 1.45,
  dampingFactor: 0.06,
  rotateSpeed: 1.2,
}

/**
 * Progressive Terrain Build — cinematic landscape composition.
 * Slightly elevated and pulled back for fuller foreground coverage and more
 * sky/background mountain framing above the horizon line.
 * ~23° downward pitch, FOV 50° for tighter cinematic compression.
 */
export const POSITION_PROGRESSIVE_PRESET: CameraPreset = {
  pos: [0, 430, 1210],
  target: [0, 8, 0],
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
  hero: HERO_VIEW_PRESET,
} as const
