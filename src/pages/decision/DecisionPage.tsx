import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { runDecisionPipeline } from "@/core/decision/runDecisionPipeline"
import { useBaselineStore } from "@/state/baselineStore"

export default function DecisionPage() {
  const navigate = useNavigate()

  const createScenario = usePhase1ScenarioStore((s) => s.createScenario)
  const setActiveScenarioId = usePhase1ScenarioStore((s) => s.setActiveScenarioId)
  const baseline = useBaselineStore((s) => s.baseline)

  const [decisionText, setDecisionText] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  async function handleContinue() {
    if (!decisionText.trim()) return
    if (!baseline) {
      console.warn("[DecisionPipeline] baseline missing")
      return
    }

    setIsCreating(true)

    const { intent } = await runDecisionPipeline(decisionText, baseline)

    console.log("[DecisionPipeline] intent", intent)

    const scenarioId = await createScenario({
      decision: decisionText,
      intent,
      createdAt: Date.now(),
    })

    setActiveScenarioId(scenarioId)
    navigate("/position")
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: 900, paddingTop: 80 }}>

        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 600 }}>
            Simulate a Strategic Decision
          </h1>

          <p style={{ opacity: 0.65, marginTop: 10, lineHeight: 1.6 }}>
            STRATFIT will model the financial and risk impact of your decision
            across thousands of possible futures.
          </p>
        </div>

        {/* DECISION INPUT */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <textarea
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            placeholder="Example: Should we hire 10 enterprise sales reps in Q3?"
            style={{
              width: "100%",
              height: 140,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white",
              fontSize: 18,
              lineHeight: 1.6,
              resize: "none",
            }}
          />
        </div>

        {/* GUIDANCE */}
        <div style={{ marginTop: 30, opacity: 0.7, fontSize: 14 }}>
          Good decision prompts include:
          <ul style={{ marginTop: 10, lineHeight: 1.6 }}>
            <li>Timing (when)</li>
            <li>Scale (how big)</li>
            <li>Objective (why)</li>
          </ul>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 40 }}>
          <button
            onClick={handleContinue}
            disabled={isCreating || !decisionText.trim()}
            style={{
              padding: "14px 26px",
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              background:
                decisionText.trim()
                  ? "linear-gradient(135deg,#00C2FF,#5B8CFF)"
                  : "#444",
              color: "white",
              border: "none",
              cursor: decisionText.trim() ? "pointer" : "not-allowed",
            }}
          >
            {isCreating ? "Running simulation…" : "Run Simulation →"}
          </button>
        </div>

      </div>
    </div>
  )
}
