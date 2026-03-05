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
 * GOD MODE — Optimal panoramic view.
 *
 * Camera geometry (terrain = 560w × 360d):
 *   • Pulled back to Z ≈ 620, high enough (Y ≈ 220) for full coverage
 *     but low enough to see ridge silhouettes against the horizon.
 *   • Slight X offset (+40) breaks symmetry for cinematic composition.
 *   • Target offset Y = +8 lifts the gaze slightly above centre so
 *     peaks sit in the upper third and valleys anchor the lower frame.
 *   • FOV 48° — tight enough for depth compression (mountains feel
 *     stacked and dramatic) without clipping at the edges.
 *   • Polar range 0.65–1.35 rad lets the user sweep from near-overhead
 *     (map view) down to a dramatic horizon skim.
 */
export const POSITION_PRESET: CameraPreset = {
  pos: [35, 195, 600],
  target: [0, 12, 0],
  fov: 46,
}

export const STUDIO_PRESET: CameraPreset = {
  pos: [25, 190, 580],
  target: [0, 8, 0],
  fov: 46,
}

export const COMPARE_PRESET: CameraPreset = {
  pos: [0, 210, 630],
  target: [0, 8, 0],
  fov: 46,
}

export const WELCOME_PRESET: CameraPreset = {
  pos: [45, 185, 570],
  target: [0, 14, 0],
  fov: 48,
}

export const COMMAND_PRESET: CameraPreset = {
  pos: [45, 185, 570],
  target: [0, 14, 0],
  fov: 48,
}

/**
 * Progressive Terrain Build — the primary Position page view.
 * Matches POSITION_PRESET for seamless transition when
 * terrain populates.
 */
export const POSITION_PROGRESSIVE_PRESET: CameraPreset = {
  pos: [35, 195, 600],
  target: [0, 12, 0],
  fov: 46,
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
