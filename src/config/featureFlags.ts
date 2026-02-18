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
 * Application mode
 */
export const MODE: "demo" | "live" = "demo";

/**
 * Feature flags (all enabled for demo)
 */
export const terrainOverlaysEnabled = true;
export const heatmapEnabled = true;
export const sensitivityNodesEnabled = true;
export const considerationsTypewriterEnabled = true;
export const simulationTelemetryEnabled = true;
export const proDetailDrawerEnabled = true;
export const adminConsoleEnabled = true;
export const rpfEnabled = true;
export const cfEnabled = true;
export const slmEnabled = true;
export const ipeEnabled = true;
export const tflEnabled = true;
export const sdlEnabled = true;
export const dhlEnabled = true;
export const srlEnabled = true;
export const stmEnabled = true;
export const tmeEnabled = false;
export const silEnabled = false;
export const shlEnabled = true;

/**
 * Debug flags (all safe)
 */
export const DEBUG_SHOW_TERRAIN_BOUNDS = false;
export const DEBUG_DISABLE_FRUSTUM_CULLING = false;
export const DEBUG_SHOW_ORIGIN = false;

