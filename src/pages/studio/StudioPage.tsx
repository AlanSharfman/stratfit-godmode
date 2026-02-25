import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { QuestionContext } from "@/domain/question/questionContext";
import type { ScenarioDraft } from "@/domain/scenario/scenarioDraft";
import ScenarioBuilder from "./ScenarioBuilder";

type NavState = {
  questionContext?: QuestionContext;
  scenarioDraft?: ScenarioDraft;
};

export default function StudioPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const navState = (location.state || {}) as NavState;
  const questionContext = navState.questionContext;
  const scenarioDraft = navState.scenarioDraft;

  const hasContext = useMemo(
    () => Boolean(questionContext && scenarioDraft),
    [questionContext, scenarioDraft],
  );

  if (hasContext) {
    console.log("[Studio Received QuestionContext]", questionContext);
    console.log("[Studio Received ScenarioDraft]", scenarioDraft);
  }

  return (
    <div style={{ paddingTop: 72 }}>
      {hasContext && (
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
            Question Context
          </div>
          <div style={{ fontSize: 14, marginBottom: 4, color: "#d6f8ff" }}>
            <strong>Q:</strong> {questionContext!.question}
          </div>
          <div style={{ fontSize: 13, marginBottom: 4, color: "rgba(140,190,240,0.85)" }}>
            <strong>Category:</strong> {questionContext!.category}
          </div>
          <div style={{ fontSize: 13, color: "rgba(185,205,225,0.7)" }}>
            <strong>Scenario:</strong> {scenarioDraft!.name} ({scenarioDraft!.id})
          </div>
        </div>
      )}
      <ScenarioBuilder />
    </div>
  );
}
