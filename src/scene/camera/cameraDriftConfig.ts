// src/scene/camera/cameraDriftConfig.ts
// Configuration for the two-level camera drift system.

export interface DriftConfig {
  /** Horizontal (X) drift amplitude in world units */
  horizontal: number
  /** Vertical (Y) drift amplitude in world units */
  vertical: number
  /** Depth (Z) drift amplitude in world units */
  depth: number
  /** Full sinusoidal cycle duration in seconds */
  cycle: number
  /** LookAt target horizontal drift amplitude */
  lookAtHorizontal: number
  /** LookAt target vertical drift amplitude */
  lookAtVertical: number
  /** Seconds of inactivity before drift re-engages after user interaction */
  cooldownSeconds: number
  /** Lerp rate per frame for smooth transitions (0–1) */
  lerpRate: number
}

export interface CinematicDriftConfig extends DriftConfig {
  /** Max azimuthal rotation offset in degrees (slow pan) */
  rotationDegrees: number
}

export type DriftMode = "micro" | "cinematic" | "off"

export const MICRO_DRIFT: DriftConfig = {
  horizontal: 1.0,
  vertical: 0.3,
  depth: 0.6,
  cycle: 16,
  lookAtHorizontal: 0.3,
  lookAtVertical: 0.15,
  cooldownSeconds: 6,
  lerpRate: 0.008,
}

export const CINEMATIC_DRIFT: CinematicDriftConfig = {
  horizontal: 2.5,
  vertical: 1.0,
  depth: 1.5,
  cycle: 12,
  lookAtHorizontal: 0.6,
  lookAtVertical: 0.3,
  cooldownSeconds: 3,
  lerpRate: 0.010,
  rotationDegrees: 4,
}

export const CAMERA_DRIFT_CONFIG = {
  micro: MICRO_DRIFT,
  cinematic: CINEMATIC_DRIFT,
} as const
