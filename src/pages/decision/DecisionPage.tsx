import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useBaselineStore } from "@/state/baselineStore"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { runDecisionPipeline } from "@/core/decision/runDecisionPipeline"

export default function DecisionPage() {
  const navigate = useNavigate()

  const baseline = useBaselineStore((s) => s.baseline)

  const createScenario = usePhase1ScenarioStore((s) => s.createScenario)
  const setActiveScenarioId = usePhase1ScenarioStore((s) => s.setActiveScenarioId)

  const [decisionText, setDecisionText] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRun = useMemo(() => {
    return !!baseline && decisionText.trim().length > 3 && !isCreating
  }, [baseline, decisionText, isCreating])

  async function handleRun() {
    setError(null)

    const text = decisionText.trim()
    if (!text) return

    if (!baseline) {
      setError("Baseline missing — go back to Initiate and save baseline first.")
      console.warn("[DecisionPage] baseline missing")
      return
    }

    setIsCreating(true)
    try {
      const { intent } = await runDecisionPipeline(text, baseline)
      console.log("[DecisionPipeline] intent", intent)

      const scenarioId = createScenario({
        decision: text,
        intent,
        createdAt: Date.now(),
      })

      setActiveScenarioId(scenarioId)
      navigate("/position")
    } catch (e) {
      console.error("[DecisionPage] run failed", e)
      setError("Failed to run decision pipeline. Check console for details.")
    } finally {
      // CRITICAL: never leave UI stuck disabled
      setIsCreating(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Decision Workspace</h1>
        <div style={{ opacity: 0.8, fontSize: 12 }}>
          Baseline: {baseline ? "Loaded" : "Missing"}
        </div>
      </div>

      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Enter the decision you want STRATFIT to simulate.
      </p>

      {error ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            background: "rgba(255, 0, 0, 0.08)",
            border: "1px solid rgba(255, 0, 0, 0.25)",
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 14 }}>
        <textarea
          value={decisionText}
          onChange={(e) => setDecisionText(e.target.value)}
          placeholder="e.g. Should we expand into the US market?"
          rows={6}
          // NEVER disable typing; only disable the run button
          disabled={false}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            outline: "none",
            resize: "vertical",
            fontSize: 16,
            lineHeight: 1.4,
          }}
        />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
        <button
          onClick={handleRun}
          disabled={!canRun}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: canRun ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
            color: "white",
            cursor: canRun ? "pointer" : "not-allowed",
          }}
        >
          {isCreating ? "Running…" : "Run Simulation →"}
        </button>

        <button
          onClick={() => navigate("/initiate")}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "transparent",
            color: "white",
            cursor: "pointer",
            opacity: 0.9,
          }}
        >
          Back to Initiate
        </button>
      </div>
    </div>
  )
}
