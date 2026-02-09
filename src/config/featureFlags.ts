// src/config/featureFlags.ts
// STRATFIT — Feature Flags (DEMO MODE)
// No monetisation logic. No caps. No UI gates.
// All features enabled for demo.

export const MODE: "demo" | "live" = "demo";

export const terrainOverlaysEnabled = true;
export const heatmapEnabled = true;
export const sensitivityNodesEnabled = true;
export const considerationsTypewriterEnabled = true;

/** Pro detail drawer — visible to pro/enterprise users (or feature flag) */
export const proDetailDrawerEnabled = true;

/** Admin engine console — requires localStorage flag ENABLE_ADMIN_CONSOLE=1 */
export const adminConsoleEnabled = true;





