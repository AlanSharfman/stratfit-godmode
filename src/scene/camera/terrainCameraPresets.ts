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
 *   • Y/Z ratio ~0.39 gives a ~21° elevation — high enough for
 *     full terrain coverage, low enough for ridge silhouettes.
 *   • Slight X offset (+38) breaks symmetry for cinematic composition.
 *   • Target Y = +35 lifts gaze so peaks sit in upper third.
 *   • FOV 47° — tight depth compression for dramatic stacked mountains.
 */
export const GOD_VIEW_PRESET: CameraPreset = {
  pos: [38, 250, 640],
  target: [0, 35, 0],
  fov: 47,
}

/** Controls config shared by Position + Compare (pairs with GOD_VIEW_PRESET). */
export const GOD_VIEW_CONTROLS: CameraControlsConfig = {
  minDistance: 200,
  maxDistance: 1000,
  minPolarAngle: 0.35,
  maxPolarAngle: 1.57,
  dampingFactor: 0.08,
  rotateSpeed: 1.4,
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
 * Progressive Terrain Build — the primary Position page view.
 * Uses GOD_VIEW_PRESET for seamless transition when terrain populates.
 */
export const POSITION_PROGRESSIVE_PRESET: CameraPreset = GOD_VIEW_PRESET

/** All presets keyed by page context */
export const CAMERA_PRESETS = {
  position: POSITION_PRESET,
  positionProgressive: POSITION_PROGRESSIVE_PRESET,
  studio: STUDIO_PRESET,
  compare: COMPARE_PRESET,
  welcome: WELCOME_PRESET,
  command: COMMAND_PRESET,
} as const
