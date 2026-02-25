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
      <h3>Studio Runtime</h3>

      <div>
        <strong>Question:</strong> {rt.questionContext.question}
      </div>

      <div>
        <strong>Scenarios:</strong> {rt.scenarios.length}
      </div>

      <div>
        <strong>Compare Ready:</strong>{" "}
        {compareReady ? "YES" : "NO"}
      </div>

      {!compareReady && (
        <button
          onClick={() =>
            studioSessionStore.addScenario(createScenarioB(rt.scenarios[0]))
          }
          style={{
            marginTop: 12,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(120,180,255,0.35)",
            background: "rgba(60,120,200,0.25)",
            color: "#cfe6ff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Create Scenario B
        </button>
      )}
    </div>
  );
}
