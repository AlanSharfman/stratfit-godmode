import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
    return studioSessionStore.subscribe(setRt);
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
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <strong>STUDIO</strong> — Scenario Builder
      </div>

      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
        <strong>Question:</strong> {rt.questionContext.question}
      </div>

      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
        <strong>Scenarios:</strong> {rt.scenarios.length} &nbsp;|&nbsp;
        <strong>Compare Ready:</strong> {compareReady ? "YES" : "NO"}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => studioSessionStore.addScenario(createScenarioB(rt.scenarios[0]))}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(120,180,255,0.25)",
            background: "rgba(12,18,28,0.65)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Create Scenario B
        </button>

        <button
          disabled={!compareReady}
          onClick={() => navigate("/compare")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(120,180,255,0.25)",
            background: compareReady ? "rgba(12,18,28,0.65)" : "rgba(12,18,28,0.35)",
            color: "white",
            cursor: compareReady ? "pointer" : "not-allowed",
            opacity: compareReady ? 1 : 0.6,
          }}
        >
          Open Compare
        </button>
      </div>
    </div>
  );
}
