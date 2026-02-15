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

/** Temporal Flow Layer — anisotropic flow along corridor (Stage 11) */
export const tflEnabled = true;

/** Scenario Divergence Layer — optimistic/defensive ghost corridors (Stage 12) */
export const sdlEnabled = true;

/** Decision Heat Layer — subsurface thermal intensity along corridor (Stage 13) */
export const dhlEnabled = true;

/** Structural Resonance Layer — micro tonal resonance from semantic convergence (Stage 14B) */
export const srlEnabled = true;

/** Structural Topography Mapping — vertex displacement from structural index (STM) */
export const stmEnabled = true;

/** Terrain Morph Engine — smooth interpolation between structural states (Stage 15) */
export const tmeEnabled = false;

/** Strategic Interaction Layer — user inputs drive simulation + morph (Stage 16) */
export const silEnabled = false;

/** Semantic Harmonization Layer — global intensity balance (Stage 14A) */
export const shlEnabled = true;

