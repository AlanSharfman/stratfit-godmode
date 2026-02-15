import { useTrajectoryStore } from "@/state/trajectoryStore";
import { usePlaybackStore } from "@/state/playbackStore";
import "./ExecutiveDecisionOverlay.css";

/**
 * ExecutiveDecisionOverlay displays strategic decision signals based on trajectory divergence.
 *
 * This component is mounted OUTSIDE the Canvas for:
 * - Standard DOM rendering (no R3F overhead)
 * - Proper text rendering
 * - CSS styling
 * - No interference with 3D performance
 */
export default function ExecutiveDecisionOverlay() {
  const { baselineVectors, scenarioVectors } = useTrajectoryStore();
  const { progress, playing, setPlaying, setProgress, reset } = usePlaybackStore();

  // Calculate divergence at current playback position
  const currentIdx = Math.floor(progress * (baselineVectors.length - 1));
  const baselinePoint = baselineVectors[currentIdx];
  const scenarioPoint = scenarioVectors[currentIdx];

  // Calculate final divergence
  const finalDivergence =
    Math.abs(
      (scenarioVectors.at(-1)?.z ?? 0) - (baselineVectors.at(-1)?.z ?? 0)
    ) || 0;

  // Calculate current divergence
  const currentDivergence =
    baselinePoint && scenarioPoint
      ? Math.abs(scenarioPoint.z - baselinePoint.z)
      : 0;

  const hasData = baselineVectors.length > 0;

  return (
    <div className="exec-decision-overlay">
      <div className="exec-decision-header">
        <span className="exec-decision-badge">Decision Signal</span>
      </div>

      {hasData ? (
        <>
          <div className="exec-decision-metrics">
            <div className="exec-metric">
              <span className="exec-metric-label">Current Divergence</span>
              <span className="exec-metric-value">{currentDivergence.toFixed(2)}</span>
            </div>
            <div className="exec-metric">
              <span className="exec-metric-label">Final Divergence</span>
              <span className="exec-metric-value">{finalDivergence.toFixed(2)}</span>
            </div>
          </div>

          <p className="exec-decision-text">
            The scenario trajectory currently diverges by{" "}
            <strong>{currentDivergence.toFixed(2)}</strong> terrain units relative to
            baseline.
          </p>

          <p className="exec-decision-text">
            This indicates a{" "}
            <strong>
              {finalDivergence > 1 ? "material strategic shift" : "moderate shift"}
            </strong>{" "}
            in expected outcomes.
          </p>

          {/* Playback controls */}
          <div className="exec-playback">
            <div className="exec-playback-bar">
              <div
                className="exec-playback-progress"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="exec-playback-controls">
              <button
                className="exec-playback-btn"
                onClick={() => setPlaying(!playing)}
              >
                {playing ? "⏸" : "▶"}
              </button>
              <button className="exec-playback-btn" onClick={reset}>
                ⏮
              </button>
              <span className="exec-playback-time">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="exec-decision-text exec-decision-empty">
          No trajectory data available.
        </p>
      )}
    </div>
  );
}
