import { useAICommentaryStore } from "@/state/aiCommentaryStore";
import "./AICommentaryPanel.css";

/**
 * AICommentaryPanel displays AI-generated strategic commentary.
 *
 * Mounted OUTSIDE Canvas for:
 * - Standard DOM rendering
 * - Proper text rendering
 * - No interference with 3D performance
 */
export default function AICommentaryPanel() {
  const { message, severity } = useAICommentaryStore();

  if (!message) return null;

  return (
    <div className={`ai-commentary-panel ai-commentary-${severity}`}>
      <div className="ai-commentary-header">
        <span className="ai-commentary-badge">AI Strategic Commentary</span>
        <span className={`ai-commentary-indicator ai-indicator-${severity}`} />
      </div>
      <p className="ai-commentary-message">{message}</p>
    </div>
  );
}
