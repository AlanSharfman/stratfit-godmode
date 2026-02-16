// src/components/commentary/CommentaryPanel.tsx
// STRATFIT — Commentary Panel UI
// Phase 8 AI Commentary Lock

import { useCommentary } from "@/core/ai/useCommentary";

export default function CommentaryPanel() {
    const { commentary, loading } = useCommentary();

    if (loading) return <div className="commentaryPanel">Generating narrative…</div>;
    if (!commentary) return null;

    return (
        <div className="commentaryPanel">
            <p>{commentary.text}</p>
            <ul>
                {commentary.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                ))}
            </ul>
        </div>
    );
}
