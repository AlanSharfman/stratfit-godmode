import DualTrajectory from "./DualTrajectory";
import TrajectoryNodes from "./TrajectoryNodes";
import DivergenceRibbon from "./DivergenceRibbon";
import ProbabilityEnvelope from "./ProbabilityEnvelope";
import PlaybackController from "./PlaybackController";
import InterventionMarkers from "./InterventionMarkers";
import BranchPoints from "./BranchPoints";
import MultiScenarioOverlay from "./MultiScenarioOverlay";
import CommentaryEngine from "../ai/CommentaryEngine";

/**
 * TrajectoryEngine is the master component for the trajectory visualization layer.
 *
 * Phase 4 Architecture:
 * - PlaybackController: Animates timeline progress (no geometry)
 * - CommentaryEngine: Generates AI commentary based on divergence
 * - ProbabilityEnvelope: Confidence band around baseline path
 * - DualTrajectory: Renders both baseline and scenario paths
 * - DivergenceRibbon: Translucent ribbon showing delta between paths
 * - MultiScenarioOverlay: Supports unlimited scenario overlays
 * - InterventionMarkers: Interactive intervention points along path
 * - BranchPoints: Visual indicators for scenario branching
 * - TrajectoryNodes: Insight markers along the trajectory
 *
 * Rules (NON-NEGOTIABLE):
 * 1) Trajectory rendering is purely derived from state
 * 2) Deterministic rendering only - no per-frame raycasts
 * 3) One render pass only
 * 4) Premium aesthetic - no gaming look
 * 5) Timeline does not trigger terrain rerenders
 * 6) Commentary derived from store values only
 */
export default function TrajectoryEngine() {
  return (
    <>
      <PlaybackController />
      <CommentaryEngine />

      <ProbabilityEnvelope />
      <DualTrajectory />
      <DivergenceRibbon />

      <MultiScenarioOverlay />
      <InterventionMarkers />
      <BranchPoints />

      <TrajectoryNodes />
    </>
  );
}
