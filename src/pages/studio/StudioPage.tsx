import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageShell from "@/layout/PageShell";
import type { QuestionContext } from "@/domain/question/questionContext";
import type { ScenarioDraft } from "@/domain/scenario/scenarioDraft";

import { studioSessionStore } from "@/state/studioSessionStore";
import { createScenarioB } from "@/domain/scenario/createScenario";

type NavState = {
  questionContext?: QuestionContext;
  scenarioDraft?: ScenarioDraft;
};

export default function StudioPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const navState = (location.state || {}) as NavState;
  const [rt, setRt] = useState(studioSessionStore.get());

  useEffect(() => {
    const unsub = studioSessionStore.subscribe(setRt);
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (rt) return;

    if (navState.questionContext && navState.scenarioDraft) {
      studioSessionStore.seed({
        questionContext: navState.questionContext,
        scenarioA: navState.scenarioDraft,
      });
      return;
    }

    navigate("/position");
  }, [rt, navState, navigate]);

  if (!rt) return null;

  const compareReady = studioSessionStore.isCompareReady();

  return (
    <PageShell title="Studio" subtitle="Scenario Builder">
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginBottom: 10 }}>
        <strong>Question:</strong> {rt.questionContext.question}
      </div>

      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginBottom: 10 }}>
        <strong>Scenarios:</strong> {rt.scenarios.length} &nbsp;|&nbsp;
        <strong>Compare Ready:</strong> {compareReady ? "YES" : "NO"}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => studioSessionStore.addScenario(createScenarioB(rt.scenarios[0]))}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid rgba(34,211,238,0.15)",
            background: "rgba(34,211,238,0.06)",
            color: "rgba(34,211,238,0.8)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Create Scenario B
        </button>

        <button
          disabled={!compareReady}
          onClick={() => navigate("/compare")}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid rgba(34,211,238,0.15)",
            background: compareReady ? "rgba(34,211,238,0.06)" : "rgba(34,211,238,0.02)",
            color: "rgba(34,211,238,0.8)",
            cursor: compareReady ? "pointer" : "not-allowed",
            opacity: compareReady ? 1 : 0.5,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Open Compare
        </button>
      </div>
    </PageShell>
  );
}
