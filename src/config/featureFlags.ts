export type TerrainHeightMode = "heightfield" | "stm" | "neutral";

/**
 * TERRAIN HEIGHT MODE — STRATFIT LOCK
 *
 * heightfield → real elevation (default for Position page)
 * stm         → structural timeline mode
 * neutral     → flat debug plane (DO NOT USE for production)
 */

export const terrainHeightMode: TerrainHeightMode = "heightfield";

/**
 * Debug flags (all safe)
 */
export const DEBUG_SHOW_TERRAIN_BOUNDS = false;
export const DEBUG_DISABLE_FRUSTUM_CULLING = false;
export const DEBUG_SHOW_ORIGIN = false;

