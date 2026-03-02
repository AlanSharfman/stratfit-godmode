import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useCanonicalBaseline } from "@/state/useCanonicalBaseline"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { DECISION_INTENT_OPTIONS, type DecisionIntentType } from "@/state/phase1ScenarioStore"
import { runDecisionPipeline } from "@/core/decision/runDecisionPipeline"
import { decisionLeverSchemas, defaultLeverValues, type LeverSchema } from "@/config/decisionLeverSchemas"
import DecisionCardGrid from "@/components/decision/DecisionCardGrid"
import css from "./DecisionConsole.module.css"

/* ═══════════════════════════════════════════════════════════
   Decision Console — Institutional Three-Rail Layout
   Question → Intent → Levers → Assumptions → Run
   ═══════════════════════════════════════════════════════════ */

const MIN_CHARS = 10

const EXAMPLE_PROMPTS = [
  "Expand into the US market with a new sales team",
  "Cut monthly burn by 30% through headcount reduction",
  "Raise a $5M Series A at $20M pre-money valuation",
  "Launch a self-serve product tier to increase ARPA",
  "Pivot from B2C to B2B enterprise sales motion",
]

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

/* ─── Intent-based assumptions (static copy — Phase 4 prep) ── */

const INTENT_ASSUMPTIONS: Record<DecisionIntentType, string[]> = {
  hiring: [
    "Headcount increases by specified amount",
    "Monthly burn increases proportionally",
    "Revenue ramp starts after onboarding window",
    "Runway shortens until revenue offsets cost",
  ],
  pricing: [
    "Revenue per account changes by adjustment factor",
    "Churn risk shifts based on price elasticity",
    "Gross margin recalculates from new ARPA",
    "Growth rate may slow during transition",
  ],
  cost_reduction: [
    "Monthly burn decreases by target percentage",
    "Headcount may reduce proportionally",
    "Runway extends from lower cash drain",
    "Growth rate may decelerate temporarily",
  ],
  fundraising: [
    "Cash balance increases by raise amount",
    "Dilution applied at specified valuation",
    "Monthly burn may increase post-raise",
    "Runway extends significantly",
  ],
  growth_investment: [
    "Monthly burn increases for growth spend",
    "Growth rate accelerates by investment factor",
    "Revenue compounds over 6–12 month horizon",
    "Runway shortens during investment phase",
  ],
  other: [
    "Scenario runs with current baseline inputs",
    "All levers remain at default values",
    "24-month projection from current position",
    "Probability signals reflect baseline trajectory",
  ],
}

/* ─── Lever value formatter ──────────────────────────────── */

function formatLeverValue(val: number, lever: LeverSchema): string {
  const sign = val > 0 ? "+" : ""
  switch (lever.unit) {
    case "%":  return `${sign}${val}%`
    case "mo": return `${val}mo`
    case "$M": return `$${val}M`
    case "x":  return `${val.toFixed(1)}x`
    default:   return `${sign}${val}`
  }
}

/* ─── Component ──────────────────────────────────────────── */

export default function DecisionPage() {
  const navigate = useNavigate()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const baseline = useCanonicalBaseline()

  const createScenario = usePhase1ScenarioStore((s) => s.createScenario)
  const setActiveScenarioId = usePhase1ScenarioStore((s) => s.setActiveScenarioId)
  const runSimulation = usePhase1ScenarioStore((s) => s.runSimulation)

  const [decisionText, setDecisionText] = useState("")
  const [intentType, setIntentType] = useState<DecisionIntentType | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [selectedCardLabel, setSelectedCardLabel] = useState<string>("Other")
  const [highlightIdx, setHighlightIdx] = useState(0)
  const intentListRef = useRef<HTMLDivElement>(null)
  const [showFallbackPicker, setShowFallbackPicker] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const [leverValues, setLeverValues] = useState<Record<string, number>>(() => defaultLeverValues("other"))

  const handleCardSelect = useCallback((id: string, intent: DecisionIntentType, label: string) => {
    setSelectedCardId(id)
    setSelectedCardLabel(label)
    setIntentType(intent)
    setIsDone(false)
  }, [])

  const canRun = useMemo(
    () => !!baseline && decisionText.trim().length >= MIN_CHARS && selectedCardId !== null && !isCreating && !isDone,
    [baseline, decisionText, selectedCardId, isCreating, isDone],
  )

  // Keyboard shortcut ref — kept in sync so the stable effect closure always sees latest value
  const canRunRef = useRef(false)
  canRunRef.current = canRun

  const feedback = deriveFeedback(decisionText, isCreating, isDone)
  const fb = FEEDBACK_CONFIG[feedback]

  const selectedIntentLabel = useMemo(
    () => selectedCardId ? selectedCardLabel : (intentType ? (DECISION_INTENT_OPTIONS.find((o) => o.value === intentType)?.label ?? "Other") : "Select a type"),
    [selectedCardId, selectedCardLabel, intentType],
  )

  const activeSchema = useMemo(() => intentType ? (decisionLeverSchemas[intentType] ?? []) : [], [intentType])

  const updateLever = React.useCallback((id: string, value: number) => {
    setLeverValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  const resetLevers = React.useCallback(() => {
    if (intentType) setLeverValues(defaultLeverValues(intentType))
  }, [intentType])

  // Reset lever values when intent changes
  React.useEffect(() => {
    if (intentType) setLeverValues(defaultLeverValues(intentType))
  }, [intentType])

  // Intent picker keyboard handler
  const handleIntentKeyDown = useCallback((e: React.KeyboardEvent) => {
    const len = DECISION_INTENT_OPTIONS.length
    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault()
      setHighlightIdx((i) => (i + 1) % len)
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault()
      setHighlightIdx((i) => (i - 1 + len) % len)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const opt = DECISION_INTENT_OPTIONS[highlightIdx]
      if (opt) {
        setIntentType(opt.value)
        setIsDone(false)
      }
    }
  }, [highlightIdx])

  // Scroll highlighted item into view
  useEffect(() => {
    const el = intentListRef.current?.children[highlightIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [highlightIdx])

  /* ── Run trigger ── */
  async function handleRun() {
    setError(null)
    const text = decisionText.trim()
    if (!text || !baseline) return

    setIsCreating(true)
    try {
      const { intent } = await runDecisionPipeline(text, baseline)

      const effectiveIntent = intentType ?? "other"
      const scenarioId = createScenario({
        decision: text,
        intent,
        decisionIntentType: effectiveIntent,
        decisionIntentLabel: selectedCardLabel,
        leverValues,
        createdAt: Date.now(),
      })

      setActiveScenarioId(scenarioId)
      runSimulation(scenarioId)
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

  // Ctrl+Enter / Cmd+Enter keyboard shortcut
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        if (canRunRef.current) handleRun()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived values ── */
  const baselineChips = useMemo(() => {
    if (!baseline) return []
    return [
      { label: "Cash", value: baseline.cash >= 1_000_000 ? `$${(baseline.cash / 1_000_000).toFixed(1)}M` : `$${(baseline.cash / 1_000).toFixed(0)}K` },
      { label: "Burn", value: `$${(baseline.monthlyBurn / 1_000).toFixed(0)}K/mo` },
      { label: "Runway", value: baseline.monthlyBurn > 0 ? `${Math.round(baseline.cash / baseline.monthlyBurn)}mo` : "\u2014" },
      { label: "Growth", value: `${(baseline.growthRate * 100).toFixed(1)}%` },
    ]
  }, [baseline])

  /* ── Baseline guard ── */
  if (!baseline) {
    return (
      <div className={css.page}>
        <div className={css.guardPage}>
          <div className={css.guardIcon}>&#9651;</div>
          <h2 className={css.guardTitle}>Baseline Required</h2>
          <p className={css.guardDesc}>
            Complete the Initiate step first to establish your company baseline before running simulations.
          </p>
          <button type="button" className={css.btnPrimary} onClick={() => navigate("/initiate")}>
            Go to Initiate &#8594;
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={css.page}>
      {/* ═══ Ambient atmosphere ═══ */}
      <div className={css.atmoGlow} aria-hidden="true" />

      {/* ═══ TOP BAR ═══ */}
      <div className={css.topBar}>
        <div className={css.topBarLogo}>
          <img src="/stratfit-logo.png" alt="STRATFIT" style={{ height: '32px', width: 'auto', display: 'block' }} />
          <span className={css.topBarLogoText}>STRATFIT</span>
        </div>
        <nav className={css.breadcrumb}>
          <span className={css.breadcrumbLink} onClick={() => navigate("/initiate")}>INITIATE</span>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbActive}>DECISION</span>
        </nav>
        <div className={css.systemBadge}>
          <span className={css.systemBadgeDot} />
          Decision Engine · Online
        </div>
        <h1 className={css.pageTitle}>Decision Console</h1>
        <p className={css.pageSubtitle}>
          Translate a strategic decision into scenario levers. Run the model. Read probability signals.
        </p>
        <div className={css.headerDivider} />
      </div>

      {/* ═══ THREE-RAIL CONSOLE ═══ */}
      <div className={css.consoleGrid}>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            LEFT RAIL — Decision Brief
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div>
          {/* Section 1: Decision Question */}
          <div className={`${css.glassPanel} ${focused ? css.glassPanelFocused : ""}`}>
            <div className={css.glassPanelInner}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div className={css.sectionTitle}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Decision Question
                </div>
                <span className={css.charCount} style={{
                  color: decisionText.length >= 500 ? "#fbbf24"
                    : decisionText.length >= MIN_CHARS ? "rgba(34,211,238,0.5)"
                    : "rgba(255,255,255,0.25)",
                }}>
                  {decisionText.length}/500
                </span>
              </div>

              {error && <div className={css.errorBanner}>{error}</div>}

              <textarea
                ref={textareaRef}
                className={css.textarea}
                value={decisionText}
                onChange={(e) => { setDecisionText(e.target.value.slice(0, 500)); setIsDone(false) }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="e.g. Should we hire 3 engineers in Q2?"
                maxLength={500}
                disabled={false}
              />

              {/* Example prompts */}
              {decisionText.length === 0 && !isCreating && !isDone && (
                <div className={css.exampleStrip}>
                  <span className={css.exampleLabel}>Try:</span>
                  {EXAMPLE_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={css.exampleBtn}
                      onClick={() => { setDecisionText(p); textareaRef.current?.focus() }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Warning: no question */}
              {decisionText.trim().length === 0 && !isCreating && !isDone && (
                <div className={css.warningBanner}>
                  Add a decision question for clearer intelligence framing.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Decision Type — Card Grid (primary) */}
          <div className={css.glassPanel} style={{ marginTop: 16 }}>
            <div className={css.glassPanelInner}>
              <div className={css.sectionTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Decision Type
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "4px 0 12px", letterSpacing: "0.01em" }}>
                Select a decision type to model outcomes, risk and runway impact.
              </p>

              <DecisionCardGrid
                value={selectedCardId}
                onChange={handleCardSelect}
                disabled={isCreating}
              />

              {/* Collapsed fallback — legacy 6-type picker */}
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.25)",
                    fontSize: 10,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                  }}
                  onClick={() => setShowFallbackPicker((v) => !v)}
                >
                  {showFallbackPicker ? "Hide" : "Show"} category override
                </button>
                {showFallbackPicker && (
                  <div
                    ref={intentListRef}
                    className={css.intentPicker}
                    tabIndex={0}
                    role="listbox"
                    aria-label="Decision type override"
                    aria-activedescendant={`intent-${highlightIdx}`}
                    onKeyDown={handleIntentKeyDown}
                    style={{ marginTop: 8 }}
                  >
                    {DECISION_INTENT_OPTIONS.map((opt, idx) => {
                      const isSelected = intentType === opt.value
                      const isHighlighted = highlightIdx === idx
                      return (
                        <button
                          key={opt.value}
                          id={`intent-${idx}`}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={[
                            css.intentOption,
                            isSelected ? css.intentOptionSelected : "",
                            isHighlighted ? css.intentOptionHighlight : "",
                          ].filter(Boolean).join(" ")}
                          onClick={() => { setIntentType(opt.value); setHighlightIdx(idx); setIsDone(false) }}
                          onMouseEnter={() => setHighlightIdx(idx)}
                          disabled={isCreating}
                        >
                          <span className={css.intentOptionDot} />
                          <span className={css.intentOptionLabel}>{opt.label}</span>
                          {isSelected && <span className={css.intentOptionCheck}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Scenario Snapshot */}
          <div className={css.glassPanel} style={{ marginTop: 16 }}>
            <div className={css.glassPanelInner}>
              <div className={css.sectionTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="2" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" fill="none"/><path d="M5 7h6M5 10h4" stroke="rgba(34,211,238,0.6)" strokeWidth="1" strokeLinecap="round"/></svg>
                Scenario Snapshot
              </div>
              <div className={css.chipStrip}>
                {baselineChips.map((c) => (
                  <span key={c.label} className={css.chip}>
                    <span style={{ opacity: 0.5 }}>{c.label}</span>{" "}
                    <span className={css.chipValue}>{c.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CENTER — Levers Panel
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className={`${css.glassPanel} ${css.leversPanel}`}>
          <div className={css.glassPanelInner}>
            <div className={css.sectionTitle}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 3v10M8 3v10M12 3v10" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="4" cy="6" r="2" fill="rgba(34,211,238,0.3)" stroke="rgba(34,211,238,0.6)" strokeWidth="1"/><circle cx="8" cy="10" r="2" fill="rgba(34,211,238,0.3)" stroke="rgba(34,211,238,0.6)" strokeWidth="1"/><circle cx="12" cy="7" r="2" fill="rgba(34,211,238,0.3)" stroke="rgba(34,211,238,0.6)" strokeWidth="1"/></svg>
              Scenario Levers
              <span className={css.leverIntentTag}>{selectedIntentLabel}</span>
            </div>

            {activeSchema.length > 0 ? (
              <>
                <div className={css.leverGroup}>
                  {activeSchema.map((lever) => {
                    const val = leverValues[lever.id] ?? lever.default
                    const isDefault = val === lever.default
                    return (
                      <div key={lever.id} className={css.leverRow}>
                        <div className={css.leverHeader}>
                          <span className={css.leverLabel}>{lever.label}</span>
                          <span className={css.leverValue} style={{ color: isDefault ? "rgba(255,255,255,0.35)" : undefined }}>
                            {formatLeverValue(val, lever)}
                          </span>
                        </div>
                        <input
                          type="range"
                          className={css.leverSlider}
                          min={lever.min}
                          max={lever.max}
                          step={lever.step}
                          value={val}
                          onChange={(e) => updateLever(lever.id, Number(e.target.value))}
                        />
                        <div className={css.leverRange}>
                          <span>{lever.min}{lever.unit}</span>
                          <span>{lever.max}{lever.unit}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button type="button" className={css.leverResetBtn} onClick={resetLevers}>
                  Reset to defaults
                </button>
              </>
            ) : (
              /* Placeholder for "other" intent with no schema */
              <div className={css.leverPlaceholder}>
                <div className={css.leverPlaceholderIcon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 4v12M10 4v12M15 4v12" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div className={css.leverPlaceholderTitle}>No Levers Required</div>
                <div className={css.leverPlaceholderDesc}>
                  {intentType ? "Configure scenario levers for this decision type." : "Select a decision type above to configure scenario levers."}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            RIGHT RAIL — Assumptions + Run
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div>
          {/* Assumptions Strip */}
          <div className={css.glassPanel}>
            <div className={css.glassPanelInner}>
              <div className={css.sectionTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h7M3 12h10" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Assumptions
              </div>

              {/* Live lever values */}
              {activeSchema.length > 0 && (
                <>
                  <ul className={css.assumptionLeverList}>
                    {activeSchema.map((lever) => {
                      const val = leverValues[lever.id] ?? lever.default
                      return (
                        <li key={lever.id} className={css.assumptionLeverItem}>
                          <span className={css.assumptionLeverLabel}>{lever.label}</span>
                          <span className={css.assumptionLeverValue}>{formatLeverValue(val, lever)}</span>
                        </li>
                      )
                    })}
                  </ul>
                  <div className={css.assumptionDivider} />
                </>
              )}

              <ul className={css.assumptionsList}>
                {(INTENT_ASSUMPTIONS[intentType ?? "other"]).map((a) => (
                  <li key={a} className={css.assumptionItem}>
                    <span className={css.assumptionIcon}>&#x25B8;</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Run Panel */}
          <div className={css.glassPanel} style={{ marginTop: 16 }}>
            <div className={css.glassPanelInner}>
              <div className={css.runPanelAccent} />
              <div className={css.sectionTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polygon points="5,3 13,8 5,13" fill="rgba(34,211,238,0.6)"/></svg>
                Simulate
              </div>

              <button
                type="button"
                className={css.btnPrimary}
                disabled={!canRun}
                onClick={handleRun}
              >
                {isCreating ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    <span className={css.spinner} />
                    Running&hellip;
                  </span>
                ) : isDone ? (
                  "\u2713 Scenario Created"
                ) : (
                  "Run Simulation \u2192"
                )}
              </button>

              <button
                type="button"
                className={css.btnGhost}
                onClick={() => navigate("/initiate")}
              >
                &larr; Back to Initiate
              </button>

              {/* Keyboard shortcut hint */}
              {canRun && (
                <div className={css.kbdHint}>
                  <kbd className={css.kbd}>Ctrl</kbd>
                  {" + "}
                  <kbd className={css.kbd}>&crarr;</kbd>
                </div>
              )}

              {/* Status strip */}
              <div className={css.statusStrip}>
                <div
                  className={`${css.statusDot} ${feedback === "running" ? css.statusDotPulse : ""}`}
                  style={{
                    background: fb.dot,
                    boxShadow: feedback === "running" ? `0 0 8px ${fb.dot}` : "none",
                  }}
                />
                <span className={css.statusLabel} style={{ color: fb.color }}>
                  {fb.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className={css.legalDisclaimer}>
        All projections, probabilities and scenario outcomes are generated by STRATFIT's Monte Carlo simulation engine and do not constitute financial advice. Results are illustrative and based on user-supplied inputs.
      </div>
    </div>
  )
}
