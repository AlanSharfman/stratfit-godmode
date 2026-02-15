// src/config/featureFlags.ts
// STRATFIT — Feature Flags (DEMO MODE)
// No monetisation logic. No caps. No UI gates.
// All features enabled for demo.

export const MODE: "demo" | "live" = "demo";

export const terrainOverlaysEnabled = true;
export const heatmapEnabled = true;
export const sensitivityNodesEnabled = true;
export const considerationsTypewriterEnabled = true;

/** Simulation telemetry ribbon — top-right instrument readout during runs */
export const simulationTelemetryEnabled = true;

/** Pro detail drawer — visible to pro/enterprise users (or feature flag) */
export const proDetailDrawerEnabled = true;

/** Admin engine console — requires localStorage flag ENABLE_ADMIN_CONSOLE=1 */
export const adminConsoleEnabled = true;

/** Risk Pressure Field — terrain-embedded semantic risk layer (Stage 7) */
export const rpfEnabled = true;

/** Confidence Field — terrain-embedded confidence aura along P50 (Stage 9) */
export const cfEnabled = true;

/** Strategic Leverage Markers — instanced icosahedra at leverage peaks (Stage 8) */
export const slmEnabled = true;

/** Intervention Preview Engine — ghost trajectory on marker hover (Stage 10) */
export const ipeEnabled = true;





