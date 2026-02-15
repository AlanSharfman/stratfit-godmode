import { useEffect } from "react";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import { useAICommentaryStore } from "@/state/aiCommentaryStore";

/**
 * CommentaryEngine generates AI strategic commentary based on trajectory divergence.
 *
 * Architecture:
 * - Runs as effect, not per-frame
 * - Derives commentary from store values only
 * - No heavy calculations
 */
export default function CommentaryEngine() {
  const { baselineVectors, scenarioVectors } = useTrajectoryStore();
  const { setMessage } = useAICommentaryStore();

  useEffect(() => {
    if (!baselineVectors.length || !scenarioVectors.length) return;

    const finalBaseline = baselineVectors.at(-1);
    const finalScenario = scenarioVectors.at(-1);

    if (!finalBaseline || !finalScenario) return;

    const divergence = Math.abs(
      (finalScenario.z ?? 0) - (finalBaseline.z ?? 0)
    );

    if (divergence > 2) {
      setMessage(
        "The current strategy materially shifts the outcome trajectory. This indicates a high-impact strategic pivot requiring board-level attention.",
        "alert"
      );
    } else if (divergence > 0.8) {
      setMessage(
        "The scenario introduces a moderate deviation from baseline. This suggests tactical adjustments with measurable impact on key performance indicators.",
        "caution"
      );
    } else {
      setMessage(
        "The scenario remains broadly aligned with baseline expectations, indicating incremental improvement within established risk tolerances.",
        "info"
      );
    }
  }, [baselineVectors, scenarioVectors, setMessage]);

  return null;
}
