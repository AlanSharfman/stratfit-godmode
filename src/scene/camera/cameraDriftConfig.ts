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

export interface OscillateDriftConfig {
  /** Full oscillation cycle in seconds (left→center→right→center) */
  cycle: number
  /** Azimuthal sweep amplitude in radians (±) */
  amplitude: number
  /** Lerp rate per frame (0–1) — higher = less lag */
  lerpRate: number
  /** Seconds to wait after interaction before resuming */
  cooldownSeconds: number
}

export type DriftMode = "micro" | "cinematic" | "oscillate" | "off"

export const MICRO_DRIFT: DriftConfig = {
  horizontal: 0.4,
  vertical: 0.12,
  depth: 0.25,
  cycle: 28,
  lookAtHorizontal: 0.08,
  lookAtVertical: 0.04,
  cooldownSeconds: 8,
  lerpRate: 0.003,
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

/** Smooth sinusoidal left-right oscillation — slow and cinematic */
export const OSCILLATE_DRIFT: OscillateDriftConfig = {
  cycle: 55,
  amplitude: Math.PI * 0.06,
  lerpRate: 0.005,
  cooldownSeconds: 5,
}

export const CAMERA_DRIFT_CONFIG = {
  micro: MICRO_DRIFT,
  cinematic: CINEMATIC_DRIFT,
} as const
