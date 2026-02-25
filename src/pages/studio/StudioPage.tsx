import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { QuestionContext } from "@/domain/question/questionContext";
import type { ScenarioDraft } from "@/domain/scenario/scenarioDraft";
import {
  studioSessionStore,
  type StudioRuntime,
} from "@/state/studioSessionStore";
import ScenarioBuilder from "./ScenarioBuilder";

type NavState = {
  questionContext?: QuestionContext;
  scenarioDraft?: ScenarioDraft;
};

export default function StudioPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const navState = (location.state || {}) as NavState;

  const [rt, setRt] = useState<StudioRuntime | null>(() =>
    studioSessionStore.get()
  );

  // Subscribe once for deterministic updates
  useEffect(() => {
    return studioSessionStore.subscribe((next) => setRt(next));
  }, []);

  // Hydrate once from navState only if store is empty.
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;

    const existing = studioSessionStore.get();
    if (existing) {
      // Store already has runtime — nothing to do.
      return;
    }

    const qc = navState.questionContext;
    const sd = navState.scenarioDraft;

    if (qc && sd) {
      studioSessionStore.seed({ questionContext: qc, scenarioDraft: sd });
      console.log("[Studio Hydrated From NavState -> Store Seeded]");
      return;
    }

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
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
            Studio Runtime (STEP 14 Canonical Store)
          </div>

          <div style={{ fontSize: 14, marginBottom: 6 }}>
            <strong>Question:</strong> {rt.questionContext.question}
          </div>

          <div style={{ fontSize: 14, marginBottom: 6 }}>
            <strong>Category:</strong> {rt.questionContext.category}
          </div>

          <div style={{ fontSize: 14 }}>
            <strong>Scenario:</strong> {rt.scenarioDraft.name}
          </div>
        </div>
      )}

      <ScenarioBuilder />

      <div style={{ opacity: 0.85, fontSize: 13, padding: "12px 16px" }}>
        Next: wire ScenarioDraft into Studio engine inputs + Scenario B creation
        for Compare activation.
      </div>
    </div>
  );
}
