import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { QuestionContext } from "@/domain/question/questionContext";
import type { ScenarioDraft } from "@/domain/scenario/scenarioDraft";
import {
  getStudioRuntime,
  setStudioRuntime,
  type StudioRuntime,
} from "@/domain/studio/studioRuntime";
import ScenarioBuilder from "./ScenarioBuilder";

type NavState = {
  questionContext?: QuestionContext;
  scenarioDraft?: ScenarioDraft;
};

export default function StudioPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const navState = (location.state || {}) as NavState;

  const [rt, setRt] = useState<StudioRuntime | null>(() => getStudioRuntime());

  // Ensure hydration from navState happens only once per mount.
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;

    const qc = navState.questionContext;
    const sd = navState.scenarioDraft;

    // Primary path: hydrate from navigation state (Position → Studio).
    if (qc && sd) {
      const next: StudioRuntime = { questionContext: qc, scenarioDraft: sd };
      setStudioRuntime(next);
      setRt(next);
      console.log("[Studio Hydrated From NavState]", next);
      return;
    }

    // Secondary path: restore from session (already attempted in initial state)
    const restored = getStudioRuntime();
    if (restored) {
      setRt(restored);
      console.log("[Studio Restored From Session]", restored);
      return;
    }

    // Hard guard: Studio must not be accessible without context.
    console.warn("[Studio Missing Context] Redirecting to Position.");
    navigate("/position");
  }, [navState.questionContext, navState.scenarioDraft, navigate]);

  const hasContext = useMemo(() => Boolean(rt), [rt]);

  if (!hasContext) return null;

  return (
    <div style={{ paddingTop: 72 }}>
      {rt && (
        <div
          style={{
            margin: "0 16px 12px",
            border: "1px solid rgba(120,180,255,0.25)",
            background: "rgba(12,18,28,0.65)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
            Studio Runtime (Session Persistent)
          </div>
          <div style={{ fontSize: 14, marginBottom: 4, color: "#d6f8ff" }}>
            <strong>Q:</strong> {rt.questionContext.question}
          </div>
          <div style={{ fontSize: 13, marginBottom: 4, color: "rgba(140,190,240,0.85)" }}>
            <strong>Category:</strong> {rt.questionContext.category}
          </div>
          <div style={{ fontSize: 13, color: "rgba(185,205,225,0.7)" }}>
            <strong>Scenario:</strong> {rt.scenarioDraft.name} ({rt.scenarioDraft.id})
          </div>
        </div>
      )}
      <ScenarioBuilder />
    </div>
  );
}
