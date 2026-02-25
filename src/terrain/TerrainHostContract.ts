import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

/**
 * Terrain Host Contract (MINIMAL)
 * Demo Mode depends only on:
 * - surface sampling (getHeightAt)
 * - world-space coordinates
 *
 * No state, no rendering, no side effects.
 */
export type TerrainHost = Pick<TerrainSurfaceHandle, "getHeightAt">;

export function snapY(host: TerrainHost, x: number, z: number, lift = 0.9): number {
  return host.getHeightAt(x, z) + lift;
}

export function snapPoint(
  host: TerrainHost,
  p: { x: number; y: number; z: number },
  lift = 0.9
) {
  return { x: p.x, y: snapY(host, p.x, p.z, lift), z: p.z };
}
