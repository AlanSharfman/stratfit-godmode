import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useCanonicalBaseline } from "@/state/useCanonicalBaseline"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { runDecisionPipeline } from "@/core/decision/runDecisionPipeline"

/* ─── Inline Styles ──────────────────────────────────────── */

const PAGE: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0a0e17 0%, #101829 100%)",
  color: "#e2e8f0",
  fontFamily: "'Inter', system-ui, sans-serif",
}

const CARD: React.CSSProperties = {
  maxWidth: 780,
  margin: "0 auto",
  padding: "40px 28px",
}

const TEXTAREA: React.CSSProperties = {
  width: "100%",
  padding: 16,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(0,0,0,0.30)",
  color: "#fff",
  outline: "none",
  resize: "vertical",
  fontSize: 16,
  lineHeight: 1.5,
  minHeight: 140,
  transition: "border-color 0.15s, box-shadow 0.15s",
}

const BTN: React.CSSProperties = {
  padding: "12px 22px",
  borderRadius: 10,
  border: "none",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  transition: "opacity 0.15s",
}

/* ─── Component ──────────────────────────────────────────── */

export default function DecisionPage() {
  const navigate = useNavigate()

  const baseline = useCanonicalBaseline()

  const createScenario = usePhase1ScenarioStore((s) => s.createScenario)
  const setActiveScenarioId = usePhase1ScenarioStore((s) => s.setActiveScenarioId)

  const [decisionText, setDecisionText] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRun = useMemo(
    () => !!baseline && decisionText.trim().length > 3 && !isCreating,
    [baseline, decisionText, isCreating],
  )

  /* ── Baseline guard ── */
  if (!baseline) {
    return (
      <div style={PAGE}>
        <div style={{ ...CARD, textAlign: "center", paddingTop: 80 }}>
          <h2 style={{ margin: "0 0 12px", color: "#fff" }}>Baseline Missing</h2>
          <p style={{ opacity: 0.6, marginBottom: 20 }}>
            Please complete the Initiate step first so we have your company baseline.
          </p>
          <button
            type="button"
            style={{ ...BTN, background: "linear-gradient(135deg, #22d3ee, #06b6d4)", color: "#000" }}
            onClick={() => navigate("/initiate")}
          >
            Go to Initiate →
          </button>
        </div>
      </div>
    )
  }

  async function handleRun() {
    setError(null)
    const text = decisionText.trim()
    if (!text || !baseline) return

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
      setIsCreating(false)
    }
  }

  return (
    <div style={PAGE}>
      <div style={CARD}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: 16, fontSize: 11, opacity: 0.4, letterSpacing: "0.06em" }}>
          <span style={{ cursor: "pointer", color: "rgba(255,255,255,0.6)" }} onClick={() => navigate("/initiate")}>INITIATE</span>
          <span style={{ margin: "0 6px" }}>/</span>
          <span style={{ color: "#22d3ee" }}>DECISION</span>
        </nav>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" }}>
            Decision Workspace
          </h1>
          <span style={{ fontSize: 11, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Baseline: Loaded
          </span>
        </div>

        <p style={{ margin: "8px 0 20px", opacity: 0.6, fontSize: 14 }}>
          Describe the decision you want STRATFIT to simulate over 24 months.
        </p>

        {/* Baseline summary chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { label: "Cash", value: baseline.cash >= 1_000_000 ? `$${(baseline.cash / 1_000_000).toFixed(1)}M` : `$${(baseline.cash / 1_000).toFixed(0)}K` },
            { label: "Burn", value: `$${(baseline.monthlyBurn / 1_000).toFixed(0)}K/mo` },
            { label: "Runway", value: baseline.monthlyBurn > 0 ? `${Math.round(baseline.cash / baseline.monthlyBurn)}mo` : "—" },
            { label: "Growth", value: `${(baseline.growthRate * 100).toFixed(1)}%` },
          ].map((chip) => (
            <span key={chip.label} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
            }}>
              {chip.label}: {chip.value}
            </span>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 14, padding: "10px 14px", borderRadius: 8,
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
            fontSize: 13, color: "#f87171",
          }}>
            {error}
          </div>
        )}

        {/* Textarea — NEVER disabled */}
        <textarea
          value={decisionText}
          onChange={(e) => setDecisionText(e.target.value.slice(0, 500))}
          placeholder="e.g. Should we expand into the US market?"
          maxLength={500}
          disabled={false}
          style={{
            ...TEXTAREA,
            borderColor: decisionText.length >= 500 ? "rgba(251,191,36,0.5)" : undefined,
          }}
        />

        {/* Character count */}
        <div style={{ textAlign: "right", fontSize: 11, marginTop: 4, color: decisionText.length >= 500 ? "#fbbf24" : "rgba(255,255,255,0.35)" }}>
          {decisionText.length}/500
        </div>

        {/* Actions */}
        <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={handleRun}
            disabled={!canRun}
            style={{
              ...BTN,
              background: canRun
                ? "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)"
                : "rgba(255,255,255,0.06)",
              color: canRun ? "#000" : "rgba(255,255,255,0.35)",
              cursor: canRun ? "pointer" : "not-allowed",
            }}
          >
            {isCreating ? "Running…" : "Run Simulation →"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/initiate")}
            style={{
              ...BTN,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            ← Back to Initiate
          </button>
        </div>
      </div>
    </div>
  )
}
