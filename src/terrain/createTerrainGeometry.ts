import * as THREE from "three"
import { TERRAIN_CONSTANTS } from "./terrainConstants"

export interface TerrainGeometryConfig {
  width?: number
  depth?: number
  segments?: number
  heightfield?: Float32Array | null
}

// Immutable base templates keyed by "width|depth|segments".
// Avoids re-running the PlaneGeometry constructor (48k+ vertex layout)
// when the same dimensions are requested multiple times.
const templateCache = new Map<string, THREE.PlaneGeometry>()

function getBaseTemplate(
  width: number,
  depth: number,
  segments: number,
): THREE.PlaneGeometry {
  const key = `${width}|${depth}|${segments}`
  let tpl = templateCache.get(key)
  if (!tpl) {
    tpl = new THREE.PlaneGeometry(width, depth, segments, segments)
    tpl.computeVertexNormals()
    tpl.computeBoundingSphere()
    templateCache.set(key, tpl)
  }
  return tpl
}

/**
 * Shared terrain geometry factory — memoized.
 *
 * Caches an immutable base PlaneGeometry per unique (width, depth, segments)
 * configuration. Each call returns a **clone** so consumers can safely mutate
 * vertices, add custom attributes, etc. without affecting other instances.
 *
 * When a heightfield is provided, vertex Z values are displaced and normals
 * are recomputed on the clone.
 *
 * All terrain surfaces (primary, ghost, delta overlay, highlight)
 * MUST use this function to avoid duplicated geometry setup logic.
 */
export function createTerrainGeometry({
  width = TERRAIN_CONSTANTS.width,
  depth = TERRAIN_CONSTANTS.depth,
  segments = TERRAIN_CONSTANTS.segments,
  heightfield = null,
}: TerrainGeometryConfig = {}): THREE.PlaneGeometry {
  const template = getBaseTemplate(width, depth, segments)
  const geo = template.clone() as THREE.PlaneGeometry

  if (heightfield) {
    const pos = geo.attributes.position as THREE.BufferAttribute
    const count = Math.min(pos.count, heightfield.length)
    for (let i = 0; i < count; i++) {
      pos.setZ(i, heightfield[i])
    }
    geo.computeVertexNormals()
    geo.computeBoundingSphere()
  }

  return geo
}

/** Flush the template cache (useful for tests or hot-reload). */
export function clearGeometryCache(): void {
  for (const geo of templateCache.values()) geo.dispose()
  templateCache.clear()
}
