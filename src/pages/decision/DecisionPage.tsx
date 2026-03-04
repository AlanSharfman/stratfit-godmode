import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"

import { useCanonicalBaseline } from "@/state/useCanonicalBaseline"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import type { DecisionIntentType } from "@/state/phase1ScenarioStore"
import { runDecisionPipeline } from "@/core/decision/runDecisionPipeline"
import { decisionLeverSchemas, defaultLeverValues } from "@/config/decisionLeverSchemas"
import LeverSliderGroup from "@/components/decision/LeverSliderGroup"
import SimulationStatusWidget from "@/components/system/SimulationStatusWidget"
import SimulationRunOverlay from "@/components/system/SimulationRunOverlay"
import SimulationPipelineWidget from "@/components/system/SimulationPipelineWidget"
import SystemProbabilityNotice from "@/components/system/ProbabilityNotice"
import PortalNav from "@/components/nav/PortalNav"

import css from "./DecisionPage.module.css"

/* ═══════════════════════════════════════════════════════════
   Decision Command Console — God Mode
   Prompt-first conversational interface for strategic decisions.
   ═══════════════════════════════════════════════════════════ */

/* ── Intent pill data ── */

interface IntentPill {
  intent: DecisionIntentType
  label: string
  prompt: string
  chips: string[]
}

const INTENT_PILLS: IntentPill[] = [
  { intent: "pricing",           label: "Pricing",          prompt: "Adjust pricing strategy — test demand elasticity and margin impact across the revenue model.",               chips: ["Revenue", "Margin"] },
  { intent: "hiring",            label: "Hiring",           prompt: "Scale the team with a controlled headcount expansion plan — model cost ramp and execution velocity.",       chips: ["Cost", "Execution"] },
  { intent: "cost_reduction",    label: "Efficiency",       prompt: "Launch an efficiency programme — reduce operating load and improve operating leverage under current burn.",  chips: ["Cost", "Runway"] },
  { intent: "fundraising",       label: "Capital Raise",    prompt: "Model a capital raise — explore runway extension, dilution scenarios, and optimal timing windows.",         chips: ["Capital", "Runway"] },
  { intent: "growth_investment", label: "Growth",           prompt: "Increase growth investment within defined risk boundaries — model revenue uplift versus burn acceleration.", chips: ["Revenue", "Risk"] },
  { intent: "acquisition",       label: "Acquisition",      prompt: "Simulate an acquisition — model purchase cost, integration timeline, synergy capture, and dilution risk.",  chips: ["Capital", "Revenue"] },
  { intent: "market_entry",      label: "Market Entry",     prompt: "Expand into a new market segment or region — model ramp timeline, CAC dynamics, and revenue contribution.", chips: ["Revenue", "Risk"] },
  { intent: "product_launch",    label: "Product Launch",   prompt: "Launch a new product line — model adoption curve, margin structure, and cannibalisation risk.",              chips: ["Revenue", "Margin"] },
]

/* ── Rotating example phrases (fade, not typewriter) ── */

const ROTATING_EXAMPLES = [
  "Should we raise $8M now or extend runway another 6 months?",
  "Can we hire 10 engineers before the next funding round without risking survival?",
  "What happens if we increase prices by 15% and churn rises?",
  "Can we expand into Europe this year while maintaining 14 months runway?",
  "If we cut burn by 20%, does survival probability actually improve?",
]

const EXAMPLE_CHIPS: Array<{ label: string; exampleIdx: number }> = [
  { label: "Raising capital",       exampleIdx: 0 },
  { label: "Hiring ahead of funding", exampleIdx: 1 },
  { label: "Increasing prices",    exampleIdx: 2 },
  { label: "Expanding markets",    exampleIdx: 3 },
  { label: "Reducing burn",        exampleIdx: 4 },
]

/* ── Decision detection (keyword classifier) ── */

type DetectedType = "Capital Raise" | "Hiring" | "Pricing" | "Market Expansion" | "Efficiency" | "General Strategy"

function classifyDecision(text: string): DetectedType {
  const t = text.toLowerCase()
  if (/raise|fund|series|capital|debt/i.test(t)) return "Capital Raise"
  if (/hir|headcount|engineer|recruit|layoff|redund/i.test(t)) return "Hiring"
  if (/pric|pricing|discount|package|plan\b/i.test(t)) return "Pricing"
  if (/expand|europe|market|region|geo|international/i.test(t)) return "Market Expansion"
  if (/cut|reduce|burn|efficiency|cost/i.test(t)) return "Efficiency"
  return "General Strategy"
}

/* ── Impact bar domain mapping (lit / unlit / primary) ── */

const IMPACT_DOMAINS = ["Runway", "Burn", "Growth", "Risk", "Value"] as const

const IMPACT_DOMAIN_MAP: Record<DetectedType, { lit: string[]; primary: string[] }> = {
  "Capital Raise":     { lit: ["Runway", "Risk", "Value", "Burn"], primary: ["Runway"] },
  "Hiring":            { lit: ["Burn", "Runway", "Growth", "Risk"], primary: ["Burn"] },
  "Pricing":           { lit: ["Growth", "Risk", "Value"],          primary: ["Growth"] },
  "Market Expansion":  { lit: ["Growth", "Burn", "Risk"],           primary: ["Growth"] },
  "Efficiency":        { lit: ["Burn", "Runway", "Risk", "Value"],  primary: ["Burn", "Runway"] },
  "General Strategy":  { lit: ["Risk"],                             primary: [] },
}

/* ── Map detected type to existing intent type for downstream flow ── */

function detectedToIntent(dt: DetectedType): DecisionIntentType {
  switch (dt) {
    case "Capital Raise": return "fundraising"
    case "Hiring": return "hiring"
    case "Pricing": return "pricing"
    case "Market Expansion": return "market_entry"
    case "Efficiency": return "cost_reduction"
    default: return "other"
  }
}

/* ── Impact direction data ── */

const IMPACT_MAP: Record<DecisionIntentType, Array<{ label: string; direction: "up" | "down" | "neutral"; color: string }>> = {
  pricing:           [{ label: "Revenue", direction: "up", color: "#34d399" }, { label: "Churn", direction: "up", color: "#ef4444" }, { label: "Margin", direction: "up", color: "#34d399" }],
  hiring:            [{ label: "Cost", direction: "up", color: "#ef4444" }, { label: "Runway", direction: "down", color: "#ef4444" }, { label: "Execution", direction: "up", color: "#34d399" }],
  cost_reduction:    [{ label: "Cost", direction: "down", color: "#34d399" }, { label: "Runway", direction: "up", color: "#34d399" }, { label: "Margin", direction: "up", color: "#34d399" }],
  fundraising:       [{ label: "Capital", direction: "up", color: "#34d399" }, { label: "Runway", direction: "up", color: "#34d399" }, { label: "Dilution", direction: "up", color: "#fbbf24" }],
  growth_investment: [{ label: "Revenue", direction: "up", color: "#34d399" }, { label: "Cost", direction: "up", color: "#ef4444" }, { label: "Risk", direction: "up", color: "#fbbf24" }],
  acquisition:       [{ label: "Capital", direction: "down", color: "#ef4444" }, { label: "Revenue", direction: "up", color: "#34d399" }, { label: "Execution", direction: "up", color: "#fbbf24" }],
  market_entry:      [{ label: "Revenue", direction: "up", color: "#34d399" }, { label: "Capital", direction: "down", color: "#ef4444" }, { label: "Risk", direction: "up", color: "#fbbf24" }],
  product_launch:    [{ label: "Revenue", direction: "up", color: "#34d399" }, { label: "Margin", direction: "neutral", color: "#fbbf24" }, { label: "Time", direction: "up", color: "#fbbf24" }],
  other:             [{ label: "Impact", direction: "neutral", color: "#94b4d6" }],
}

/* ── History card status colors ── */

function statusColor(status: string): string {
  if (status === "complete") return "#34d399"
  if (status === "running") return "#fbbf24"
  if (status === "failed") return "#ef4444"
  return "rgba(148,180,214,0.4)"
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts
  if (d < 60_000) return "just now"
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

/* ═════════════════════════════════════════════════════════
   COMPONENT
   ═════════════════════════════════════════════════════════ */

export default function DecisionPage() {
  const navigate = useNavigate()
  const baseline = useCanonicalBaseline()
  const createScenario = usePhase1ScenarioStore((s) => s.createScenario)
  const setActiveScenarioId = usePhase1ScenarioStore((s) => s.setActiveScenarioId)
  const runSimulation = usePhase1ScenarioStore((s) => s.runSimulation)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)

  // ── State ──
  const [promptText, setPromptText] = useState("")
  const [intentType, setIntentType] = useState<DecisionIntentType | null>(null)
  const [leverValues, setLeverValues] = useState<Record<string, number>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResponse, setShowResponse] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canRunRef = useRef(false)
  const handleRunRef = useRef<() => void>(() => {})

  // ── Rotating example placeholder ──
  const [exampleIdx, setExampleIdx] = useState(0)
  const [exampleVisible, setExampleVisible] = useState(true)

  useEffect(() => {
    if (promptText.length > 0) return
    const cycle = setInterval(() => {
      setExampleVisible(false)
      setTimeout(() => {
        setExampleIdx((prev) => (prev + 1) % ROTATING_EXAMPLES.length)
        setExampleVisible(true)
      }, 250)
    }, 4000)
    return () => clearInterval(cycle)
  }, [promptText])

  // ── Decision detection ──
  const detectedType = useMemo<DetectedType | null>(
    () => (promptText.trim().length >= 10 ? classifyDecision(promptText) : null),
    [promptText],
  )

  const impactState = useMemo(() => {
    if (!detectedType) return null
    return IMPACT_DOMAIN_MAP[detectedType]
  }, [detectedType])

  // ── Derived ──
  const activePill = useMemo(
    () => INTENT_PILLS.find((p) => p.intent === intentType) ?? null,
    [intentType],
  )

  const constraintLevers = useMemo(() => {
    if (!intentType) return []
    return (decisionLeverSchemas[intentType] ?? []).filter((l) => l.tier === "constraint")
  }, [intentType])

  const canRun = useMemo(
    () => !!baseline && promptText.trim().length > 5 && !isCreating && !isDone,
    [baseline, promptText, isCreating, isDone],
  )
  canRunRef.current = canRun

  // Reset levers when intent changes
  useEffect(() => {
    if (intentType) {
      setLeverValues(defaultLeverValues(intentType))
      setIsDone(false)
      setShowResponse(true)
    }
  }, [intentType])

  const updateLever = useCallback((id: string, value: number) => {
    setLeverValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  const resetLevers = useCallback(() => {
    if (intentType) setLeverValues(defaultLeverValues(intentType))
  }, [intentType])

  // ── Pill click → fill prompt + set intent ──
  const handlePill = useCallback((pill: IntentPill) => {
    setPromptText(pill.prompt)
    setIntentType(pill.intent)
    setIsDone(false)
    textareaRef.current?.focus()
  }, [])

  // ── Prompt submit → detect intent + show response zone ──
  const handlePromptSubmit = useCallback(() => {
    if (!promptText.trim()) return
    const dt = classifyDecision(promptText)
    setIntentType(detectedToIntent(dt))
    setShowResponse(true)
  }, [promptText])

  // ── Example chip click → prefill prompt ──
  const handleExampleChip = useCallback((idx: number) => {
    const text = ROTATING_EXAMPLES[idx]
    setPromptText(text)
    setShowResponse(false)
    textareaRef.current?.focus()
  }, [])

  // ── Run scenario ──
  async function handleRun() {
    setError(null)
    if (!baseline || !intentType || !promptText.trim()) return
    setIsCreating(true)
    try {
      const { intent } = await runDecisionPipeline(promptText, baseline)
      const scenarioId = createScenario({
        decision: promptText,
        intent,
        decisionIntentType: intentType,
        decisionIntentLabel: activePill?.label ?? "Other",
        leverValues,
        createdAt: Date.now(),
      })
      setActiveScenarioId(scenarioId)
      runSimulation(scenarioId)
      setIsDone(true)
      setSimulating(true)
    } catch (e) {
      setError("Failed to run decision pipeline. Check console for details.")
    } finally {
      setIsCreating(false)
    }
  }
  handleRunRef.current = handleRun

  // Simulating → navigate after 3.5s
  useEffect(() => {
    if (!simulating) return
    const timer = setTimeout(() => navigate("/position", { replace: true }), 3500)
    return () => clearTimeout(timer)
  }, [simulating, navigate])

  // Ctrl+Enter shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        if (canRunRef.current && showResponse) handleRunRef.current()
        else if (promptText.trim().length > 5) handlePromptSubmit()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showResponse, promptText, handlePromptSubmit])

  // ── History: recent scenarios ──
  const recentScenarios = useMemo(
    () => [...scenarios].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10),
    [scenarios],
  )

  // ── Impacts for detected intent ──
  const impacts = intentType ? (IMPACT_MAP[intentType] ?? []) : []

  /* ── Baseline guard ── */
  if (!baseline) {
    return (
      <div className={css.page}>
        <PortalNav />
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
      <PortalNav />
      <SimulationStatusWidget />
      <SimulationRunOverlay />
      <SimulationPipelineWidget />

      {/* ═══ SIMULATING OVERLAY ═══ */}
      {simulating && (
        <div className={css.simOverlay}>
          <div className={css.simInner}>
            <div className={css.simScanBar} />
            <div className={css.simLabel}>Simulating decision</div>
            <div className={css.simDots}><span /><span /><span /></div>
          </div>
        </div>
      )}

      {error && <div className={css.errorBanner}>{error}</div>}

      {/* ═══ PROMPT HERO ═══ */}
      <div className={css.promptHero}>
        <div className={css.heroLabel}>Stress Test Console</div>
        <h1 className={css.heroTitle}>Clarity for every decision.</h1>
        <p className={css.heroSubtitle}>
          Stress-test your decisions before execution — in minutes.
        </p>
        <div className={css.promptSectionLabel}>
          Describe the business decision you'd like to stress-test.
        </div>

        {/* Prompt card */}
        <div className={`${css.promptCard} ${simulating ? css.promptCardLocked : ""}`}>
          <div className={css.textareaWrap}>
            {/* Rotating example overlay (visible when textarea is empty) */}
            {promptText.length === 0 && (
              <div
                className={`${css.rotatingExample} ${exampleVisible ? "" : css.rotatingExampleHidden}`}
              >
                {ROTATING_EXAMPLES[exampleIdx]}
              </div>
            )}
            <textarea
              ref={textareaRef}
              className={css.textarea}
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value)
                if (showResponse) setShowResponse(false)
              }}
              placeholder=""
              rows={3}
              disabled={simulating}
            />
          </div>
          <div className={css.promptFooter}>
            <span className={css.charCount}>{promptText.length} chars</span>
            <div className={css.promptActions}>
              <span className={css.kbdHint}>
                <kbd className={css.kbd}>Ctrl</kbd>
                <span>+</span>
                <kbd className={css.kbd}>↵</kbd>
              </span>
              <button
                type="button"
                className={css.btnSimulate}
                disabled={promptText.trim().length < 6 || simulating}
                onClick={showResponse ? handleRun : handlePromptSubmit}
              >
                {isCreating ? (
                  <><span className={css.spinner} /> Running…</>
                ) : isDone ? (
                  "✓ Created"
                ) : showResponse ? (
                  "▶ Run Scenario"
                ) : (
                  "Analyse →"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick example chips */}
        <div className={css.exampleChips}>
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className={css.exampleChip}
              onClick={() => handleExampleChip(chip.exampleIdx)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Decision Detected + Impact Bar */}
        {detectedType && (
          <div className={css.detectedCard}>
            <div className={css.detectedHeader}>
              <span className={css.detectedDot} />
              <span className={css.detectedLabel}>Decision Detected</span>
              <span className={css.detectedType}>{detectedType}</span>
            </div>
            <div className={css.impactBar}>
              {IMPACT_DOMAINS.map((domain) => {
                const isLit = impactState?.lit.includes(domain)
                const isPrimary = impactState?.primary.includes(domain)
                return (
                  <div
                    key={domain}
                    className={`${css.impactPill} ${isPrimary ? css.impactPillPrimary : isLit ? css.impactPillLit : ""}`}
                  >
                    <span className={css.impactPillDot} />
                    {domain}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick-start intent pills (existing) */}
        <div className={css.pillsRow}>
          {INTENT_PILLS.map((pill) => (
            <button
              key={pill.intent}
              type="button"
              className={`${css.pill} ${intentType === pill.intent ? css.pillActive : ""}`}
              onClick={() => handlePill(pill)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ RESPONSE ZONE (appears after prompt analysis) ═══ */}
      {showResponse && intentType && (
        <div className={css.responseZone}>
          {/* ── Left: Intelligence Response ── */}
          <div className={css.responseMain}>
            <div className={css.sectionLabel}>Decision Classification</div>

            {/* Classification tags */}
            <div className={css.classificationStrip}>
              <div className={css.classTag}>
                <span className={css.classTagDot} style={{ background: "#22d3ee" }} />
                {activePill?.label ?? intentType}
              </div>
              {(activePill?.chips ?? []).map((ch) => (
                <div key={ch} className={css.classTag} style={{ color: "rgba(148,180,214,0.6)" }}>
                  {ch}
                </div>
              ))}
            </div>

            {/* Impact preview */}
            <div className={css.sectionLabel} style={{ marginTop: 12 }}>Pre-Flight Impact Signals</div>
            <div className={css.impactGrid}>
              {impacts.map((imp) => (
                <div key={imp.label} className={css.impactCell}>
                  <span className={css.impactLabel}>{imp.label}</span>
                  <span className={css.impactValue} style={{ color: imp.color }}>
                    {imp.direction === "up" ? "↑" : imp.direction === "down" ? "↓" : "→"}
                    <span className={css.impactArrow}>
                      {imp.direction === "up" ? " Increase" : imp.direction === "down" ? " Decrease" : " Neutral"}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {/* Constraint tuning */}
            {constraintLevers.length > 0 && (
              <>
                <div className={css.sectionLabel} style={{ marginTop: 12 }}>Decision Parameters</div>
                <div className={css.constraintCard}>
                  <div className={css.constraintHeader}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(226,240,255,0.6)" }}>
                      Adjust magnitude
                    </span>
                    <button type="button" className={css.resetBtn} onClick={resetLevers}>
                      Reset
                    </button>
                  </div>
                  <LeverSliderGroup
                    levers={constraintLevers}
                    values={leverValues}
                    onChange={updateLever}
                  />
                </div>
              </>
            )}

            {/* Run block */}
            <div className={css.runBlock}>
              <button
                type="button"
                className={css.btnPrimary}
                disabled={!canRun}
                onClick={handleRun}
              >
                {isCreating ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className={css.spinner} /> Running…
                  </span>
                ) : isDone ? (
                  "✓ Scenario Created"
                ) : (
                  "▶ Run Scenario"
                )}
              </button>
              <Link to="/studio" className={css.btnSecondary}>
                Open Studio
              </Link>
              <div className={css.runMicro}>
                Outputs are probability-weighted scenario signals — not predictions.
              </div>
            </div>
          </div>

          {/* ── Right: Decision History ── */}
          <div className={css.historyRail}>
            <div className={css.sectionLabel}>Recent Decisions</div>
            {recentScenarios.length === 0 && (
              <div className={css.historyEmpty}>
                No decisions yet. Your scenario history will appear here as you run simulations.
              </div>
            )}
            {recentScenarios.map((sc) => (
              <div
                key={sc.id}
                className={`${css.historyCard} ${sc.id === scenarios.find((s) => s.id === sc.id)?.id && isDone ? css.historyCardActive : ""}`}
                onClick={() => {
                  setActiveScenarioId(sc.id)
                  navigate("/position")
                }}
              >
                <div className={css.historyDecision}>{sc.decision}</div>
                <div className={css.historyMeta}>
                  <span className={css.historyDot} style={{ background: statusColor(sc.status) }} />
                  <span>{sc.status}</span>
                  <span>·</span>
                  <span>{timeAgo(sc.createdAt)}</span>
                  {sc.decisionIntentLabel && (
                    <>
                      <span>·</span>
                      <span style={{ color: "rgba(34,211,238,0.45)" }}>{sc.decisionIntentLabel}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal */}
      <div className={css.legal}>
        All projections, probabilities and scenario outcomes are generated by STRATFIT's simulation engine
        and do not constitute financial advice. Results are illustrative and based on user-supplied inputs.
      </div>
      <SystemProbabilityNotice />
    </div>
  )
}
