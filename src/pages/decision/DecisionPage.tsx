import React, { useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useCanonicalBaseline } from "@/state/useCanonicalBaseline"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { runDecisionPipeline } from "@/core/decision/runDecisionPipeline"

/* ═══════════════════════════════════════════════════════════
   Decision Command Centre — Premium Executive Workspace
   ═══════════════════════════════════════════════════════════ */

const MIN_CHARS = 10

/* ─── Feedback states ────────────────────────────────────── */

type FeedbackState = "empty" | "typing" | "ready" | "running" | "done"

function deriveFeedback(text: string, isCreating: boolean, isDone: boolean): FeedbackState {
  if (isDone) return "done"
  if (isCreating) return "running"
  if (text.trim().length >= MIN_CHARS) return "ready"
  if (text.trim().length > 0) return "typing"
  return "empty"
}

const FEEDBACK_CONFIG: Record<FeedbackState, { label: string; color: string; dot: string }> = {
  empty:   { label: "Waiting for decision input",              color: "rgba(255,255,255,0.3)", dot: "#475569" },
  typing:  { label: "Keep typing — minimum 10 characters",    color: "rgba(255,255,255,0.45)", dot: "#fbbf24" },
  ready:   { label: "Decision captured — ready to simulate",  color: "#22d3ee", dot: "#22d3ee" },
  running: { label: "Simulation in progress\u2026",           color: "#fbbf24", dot: "#fbbf24" },
  done:    { label: "Scenario created — view in Position",    color: "#22c55e", dot: "#22c55e" },
}

/* ─── Component ──────────────────────────────────────────── */

export default function DecisionPage() {
  const navigate = useNavigate()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const baseline = useCanonicalBaseline()

  const createScenario = usePhase1ScenarioStore((s) => s.createScenario)
  const setActiveScenarioId = usePhase1ScenarioStore((s) => s.setActiveScenarioId)

  const [decisionText, setDecisionText] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  const canRun = useMemo(
    () => !!baseline && decisionText.trim().length >= MIN_CHARS && !isCreating && !isDone,
    [baseline, decisionText, isCreating, isDone],
  )

  const feedback = deriveFeedback(decisionText, isCreating, isDone)
  const fb = FEEDBACK_CONFIG[feedback]

  /* ── Baseline guard ── */
  if (!baseline) {
    return (
      <div style={PAGE}>
        <div style={{ ...CONTAINER, textAlign: "center", paddingTop: 100 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>&#9651;</div>
          <h2 style={{ margin: "0 0 12px", color: "#fff", fontSize: 22, fontWeight: 600 }}>Baseline Required</h2>
          <p style={{ opacity: 0.5, marginBottom: 24, fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
            Complete the Initiate step first to establish your company baseline before running simulations.
          </p>
          <button
            type="button"
            style={BTN_PRIMARY}
            onClick={() => navigate("/initiate")}
          >
            Go to Initiate &#8594;
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

      const scenarioId = createScenario({
        decision: text,
        intent,
        createdAt: Date.now(),
      })

      setActiveScenarioId(scenarioId)
      setIsDone(true)

      // Brief pause to show success state before navigation
      setTimeout(() => navigate("/position"), 600)
    } catch (e) {
      console.error("[DecisionPage] run failed", e)
      setError("Failed to run decision pipeline. Check console for details.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div style={PAGE}>
      {/* ═══ Ambient atmosphere ═══ */}
      <div style={ATMO_GLOW} aria-hidden="true" />

      <div style={CONTAINER}>

        {/* ═══════════════════════════════════════
            TOP — Context Header
            ═══════════════════════════════════════ */}
        <header style={{ marginBottom: 32 }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: 20, fontSize: 11, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{ cursor: "pointer", color: "rgba(255,255,255,0.4)", transition: "color 0.15s" }}
              onClick={() => navigate("/initiate")}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              INITIATE
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span style={{ color: "#22d3ee", fontWeight: 600 }}>DECISION</span>
          </nav>

          {/* Title */}
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 700, color: "#fff",
            letterSpacing: "-0.01em", lineHeight: 1.2,
          }}>
            Strategic Decision Engine
          </h1>
          <p style={{
            margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.45)",
            lineHeight: 1.5,
          }}>
            Define the decision STRATFIT will simulate across a 24-month horizon.
          </p>

          {/* Divider */}
          <div style={{
            marginTop: 20, height: 1,
            background: "linear-gradient(90deg, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0.05) 60%, transparent 100%)",
          }} />

          {/* Baseline chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {[
              { label: "Cash", value: baseline.cash >= 1_000_000 ? `$${(baseline.cash / 1_000_000).toFixed(1)}M` : `$${(baseline.cash / 1_000).toFixed(0)}K` },
              { label: "Burn", value: `$${(baseline.monthlyBurn / 1_000).toFixed(0)}K/mo` },
              { label: "Runway", value: baseline.monthlyBurn > 0 ? `${Math.round(baseline.cash / baseline.monthlyBurn)}mo` : "\u2014" },
              { label: "Growth", value: `${(baseline.growthRate * 100).toFixed(1)}%` },
            ].map((chip) => (
              <span key={chip.label} style={CHIP}>
                <span style={{ opacity: 0.5 }}>{chip.label}</span>{" "}
                <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{chip.value}</span>
              </span>
            ))}
          </div>
        </header>

        {/* ═══════════════════════════════════════
            MIDDLE — Decision Input Panel
            ═══════════════════════════════════════ */}
        <section style={{
          ...PANEL,
          borderColor: focused ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.08)",
          boxShadow: focused
            ? "0 0 0 1px rgba(34,211,238,0.15), 0 8px 32px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(0,0,0,0.3)",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            marginBottom: 12,
          }}>
            <label style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.12em", color: "rgba(34,211,238,0.7)",
            }}>
              Decision Statement
            </label>
            <span style={{
              fontSize: 11, fontVariantNumeric: "tabular-nums",
              color: decisionText.length >= 500 ? "#fbbf24"
                : decisionText.length >= MIN_CHARS ? "rgba(34,211,238,0.5)"
                : "rgba(255,255,255,0.25)",
              transition: "color 0.2s",
            }}>
              {decisionText.length}/500
            </span>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 12, padding: "10px 14px", borderRadius: 8,
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
              fontSize: 13, color: "#f87171",
            }}>
              {error}
            </div>
          )}

          {/* Textarea — NEVER disabled */}
          <textarea
            ref={textareaRef}
            value={decisionText}
            onChange={(e) => { setDecisionText(e.target.value.slice(0, 500)); setIsDone(false) }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe the strategic decision (e.g. expand to US, reduce burn, hire 5 engineers)"
            maxLength={500}
            disabled={false}
            style={{
              ...TEXTAREA,
              borderColor: focused ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.1)",
              boxShadow: focused ? "0 0 0 3px rgba(34,211,238,0.08)" : "none",
            }}
          />

          {/* Actions */}
          <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleRun}
              disabled={!canRun}
              style={{
                ...BTN_PRIMARY,
                opacity: canRun ? 1 : 0.4,
                cursor: canRun ? "pointer" : "not-allowed",
                transform: canRun ? "translateY(0)" : "none",
                transition: "opacity 0.2s, transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { if (canRun) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(34,211,238,0.25)" } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(34,211,238,0.15)" }}
            >
              {isCreating ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)",
                    borderTopColor: "#000", borderRadius: "50%",
                    display: "inline-block",
                    animation: "decisionSpin 0.6s linear infinite",
                  }} />
                  Running\u2026
                </span>
              ) : isDone ? (
                "\u2713 Scenario Created"
              ) : (
                "Run Simulation \u2192"
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/initiate")}
              style={BTN_GHOST}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
            >
              \u2190 Back to Initiate
            </button>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            BOTTOM — Feedback Strip + Visual Bridge
            ═══════════════════════════════════════ */}
        <div style={{ marginTop: 20 }}>
          {/* Status strip */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            transition: "opacity 0.3s",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: fb.dot,
              boxShadow: feedback === "running" ? `0 0 8px ${fb.dot}` : "none",
              animation: feedback === "running" ? "decisionPulse 1.2s ease-in-out infinite" : "none",
              transition: "background 0.3s, box-shadow 0.3s",
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 12, color: fb.color, fontWeight: 500,
              transition: "color 0.3s",
            }}>
              {fb.label}
            </span>
          </div>

          {/* Visual bridge */}
          <div style={{
            marginTop: 16, textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 1, height: 24,
              background: "linear-gradient(180deg, rgba(34,211,238,0.2) 0%, rgba(34,211,238,0.04) 100%)",
            }} />
            <span style={{
              fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)", fontWeight: 600,
            }}>
              Simulation results will appear in Position
            </span>
            <div style={{
              width: 60, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.15), transparent)",
            }} />
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes decisionSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes decisionPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Styles — Premium Decision Command Centre
   ═══════════════════════════════════════════════════════════ */

const PAGE: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0a0e17 0%, #0f1520 40%, #101829 100%)",
  color: "#e2e8f0",
  fontFamily: "'Inter', system-ui, sans-serif",
  position: "relative",
  overflow: "hidden",
}

const ATMO_GLOW: React.CSSProperties = {
  position: "absolute",
  top: -120, left: "50%", transform: "translateX(-50%)",
  width: 600, height: 300,
  background: "radial-gradient(ellipse, rgba(34,211,238,0.04) 0%, transparent 70%)",
  pointerEvents: "none",
}

const CONTAINER: React.CSSProperties = {
  position: "relative",
  maxWidth: 720,
  margin: "0 auto",
  padding: "48px 28px 60px",
}

const PANEL: React.CSSProperties = {
  padding: "24px 24px 20px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  transition: "border-color 0.2s, box-shadow 0.2s",
}

const TEXTAREA: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.25)",
  color: "#fff",
  outline: "none",
  resize: "vertical",
  fontSize: 15,
  lineHeight: 1.6,
  minHeight: 140,
  transition: "border-color 0.2s, box-shadow 0.2s",
}

const CHIP: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 6,
  fontSize: 11,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.5)",
}

const BTN_PRIMARY: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
  color: "#000",
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: "0.02em",
  boxShadow: "0 2px 12px rgba(34,211,238,0.15)",
  cursor: "pointer",
}

const BTN_GHOST: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "rgba(255,255,255,0.6)",
  fontWeight: 500,
  fontSize: 13,
  cursor: "pointer",
  transition: "border-color 0.15s, color 0.15s",
}
