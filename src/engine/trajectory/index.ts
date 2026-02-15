// ============================================================================
// TRAJECTORY ENGINE - Business Journey Visualization Layer
// Phase 4: AI commentary + Intervention markers + Branch points + Multi-scenario
// ============================================================================

export { default as TrajectoryEngine } from "./TrajectoryEngine";
export { default as TrajectorySpline } from "./TrajectorySpline";
export { default as TrajectoryNodes } from "./TrajectoryNodes";
export { default as TrajectoryAnimatedLine } from "./TrajectoryAnimatedLine";
export { default as DualTrajectory } from "./DualTrajectory";
export { default as DivergenceRibbon } from "./DivergenceRibbon";
export { default as RiskColoredLine } from "./RiskColoredLine";
export { default as ProbabilityEnvelope } from "./ProbabilityEnvelope";
export { default as PlaybackController } from "./PlaybackController";
export { default as InterventionMarkers } from "./InterventionMarkers";
export { default as BranchPoints } from "./BranchPoints";
export { default as MultiScenarioOverlay } from "./MultiScenarioOverlay";

export {
  generateTrajectoryFromMetrics,
  generateDemoTrajectory,
} from "./trajectoryGenerator";

export { projectVectorsToTerrain } from "./trajectoryProjection";

export {
  projectVectorsToTerrainOnce,
  areVectorsProjected,
  type ProjectedTrajectoryVector,
} from "./trajectoryProjectionOnce";
