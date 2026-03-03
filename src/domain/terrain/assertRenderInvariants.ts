// src/domain/terrain/assertRenderInvariants.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Render Invariant Assertions (God Mode)
//
// Dev-only assertions that validate the TerrainRenderContract against
// visibility guarantees. Called when ?debug=1.
//
// Rules (Position context):
//   - If hasEngineResults → terrainMesh must be mounted
//   - If hasEngineResults → signals must be mounted
//   - If hasPath → p50Path must be mounted
//   - If eventCount > 0 → signals must be mounted
//
// Returns { pass, failures[] } — never throws.
// ═══════════════════════════════════════════════════════════════════════════

import type { TerrainRenderContract } from "./renderContract"

export interface InvariantResult {
  pass: boolean
  failures: string[]
}

export function assertRenderInvariants(contract: TerrainRenderContract): InvariantResult {
  const failures: string[] = []

  if (contract.hasEngineResults) {
    if (!contract.layers.terrainMesh) {
      failures.push("Engine results present but terrainMesh not mounted")
    }
    if (!contract.layers.signals) {
      failures.push("Engine results present but signals layer not mounted")
    }
  }

  if (contract.hasPath && !contract.layers.p50Path) {
    failures.push(`Path data present (${contract.pathPointCount} pts) but p50Path not mounted`)
  }

  if (contract.eventCount > 0 && !contract.layers.signals) {
    failures.push(`${contract.eventCount} events exist but signals layer not mounted`)
  }

  // Log failures in dev
  if (failures.length > 0 && typeof console !== "undefined") {
    console.warn(
      "[STRATFIT] Render invariant violations:",
      failures,
      "\nContract:",
      contract,
    )
  }

  return {
    pass: failures.length === 0,
    failures,
  }
}
