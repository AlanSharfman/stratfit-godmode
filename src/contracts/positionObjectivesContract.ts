// src/contracts/positionObjectivesContract.ts
// STRATFIT — Position ↔ Objectives Data Contract (LOCKED v1)
// Product truth:
// - Initiate is the source of current-state inputs
// - Position renders from Initiate (no Objectives dependency)
// - Objectives defines intent/targets/constraints (overlays later; must not reshape terrain)

import type { BaselineV1 } from "@/onboard/baseline/types";

export type { BaselineV1 };

export type ISODateString = string;

export type Vec3 = { x: number; y: number; z: number };

// ─────────────────────────────────────────────────────────────
// InitiateSnapshot — source of truth inputs (current state)
// Aliased directly to BaselineV1: the canonical typed runtime shape.
// ─────────────────────────────────────────────────────────────

export type InitiateSnapshot = BaselineV1;

// ─────────────────────────────────────────────────────────────
// PositionState — derived, read-only presentation layer
// Must be renderable from InitiateSnapshot alone.
// ─────────────────────────────────────────────────────────────

export interface TerrainExtent {
  size: number;
  worldScale: number;
}

export interface PathSpec {
  pointsWorld: Vec3[];
  hover: number;
}

export interface TimelineTick {
  t: number; // 0..1 along path
  label: string; // e.g. "Q1", "2027", etc.
}

export type PositionMarkerType =
  | "liquidity"
  | "market"
  | "risk"
  | "ops"
  | "waypoint"
  | "beacon";

export interface PositionMarker {
  id: string;
  type: PositionMarkerType;

  // anchor (use one consistently; prefer t)
  t: number; // 0..1 along the Position trajectory
  monthIndex?: number; // optional, if you also want month indexing later

  position: Vec3; // world space
  label: string;
  severity?: 1 | 2 | 3 | 4 | 5;
}

export interface PositionState {
  seedKey: string; // derived from InitiateSnapshot (deterministic)
  reliefScalar: number; // 0.6..1.6 derived from InitiateSnapshot proxy
  terrainExtent: TerrainExtent;

  path: {
    p50: PathSpec;
  };

  timeline: {
    ticks: TimelineTick[]; // max 8–10
  };

  markers: PositionMarker[];
}

// ─────────────────────────────────────────────────────────────
// ObjectivesState — intent layer (must not reshape terrain)
// ─────────────────────────────────────────────────────────────

export type ObjectiveTargetType =
  | "runway"
  | "cash"
  | "burn"
  | "ARR"
  | "revenue"
  | "valuation"
  | "riskIndex";

export interface ObjectiveTarget {
  id: string;
  type: ObjectiveTargetType;
  targetValue: number;
  targetByMonth: number; // 0..timeHorizonMonths
  weight?: number; // 0..1
}

export type ObjectiveConstraintType =
  | "maxBurn"
  | "minCash"
  | "maxRisk"
  | "minGrossMargin"
  | "minRunway";

export interface ObjectiveConstraint {
  id: string;
  type: ObjectiveConstraintType;
  value: number;
}

export interface ObjectivesState {
  timeHorizonMonths: number; // default from InitiateSnapshot if not set
  targets: ObjectiveTarget[];
  constraints: ObjectiveConstraint[];
  priorityMode?: "survival" | "growth" | "balance";
}
