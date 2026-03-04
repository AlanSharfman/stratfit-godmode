import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"

import { useCanonicalBaseline } from "@/state/useCanonicalBaseline"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import type { DecisionIntentType } from "@/state/phase1ScenarioStore"
import { runDecisionPipeline } from "@/core/decision/runDecisionPipeline"
import { decisionLeverSchemas, defaultLeverValues } from "@/config/decisionLeverSchemas"
import LeverSliderGroup, { formatLeverValue } from "@/components/decision/LeverSliderGroup"
import SimulationStatusWidget from "@/components/system/SimulationStatusWidget"
import SimulationRunOverlay from "@/components/system/SimulationRunOverlay"
import SimulationPipelineWidget from "@/components/system/SimulationPipelineWidget"
import SystemProbabilityNotice from "@/components/system/ProbabilityNotice"
import css from "./DecisionPage.module.css"
import PortalNav from "@/components/nav/PortalNav"

/* ═══════════════════════════════════════════════════════════
   Strategic Decision Console — D-UX1 (Nuclear Infinity God Mode)
   Left: 8-card Strategic Grid (intent selection)
   Right: Constraint Console (Tier A levers only)
   Bottom: Scenario Summary + Institutional Run CTA
   ═══════════════════════════════════════════════════════════ */

/* ── Strategic intent card data ── */

interface IntentCard {
  intent: DecisionIntentType
  title: string
  description: string
  chips: string[]
}

const INTENT_CARDS: IntentCard[] = [
  {
    intent: "pricing",
    title: "PRICING STRATEGY",
    description: "Adjust pricing posture and test demand response.",
    chips: ["Revenue", "Margin", "Risk"],
  },
  {
    intent: "hiring",
    title: "HIRING PLAN",
    description: "Scale the team with controlled headcount expansion.",
    chips: ["Cost", "Runway", "Execution"],
  },
  {
    intent: "cost_reduction",
    title: "EFFICIENCY PROGRAM",
    description: "Reduce operating load and improve operating leverage.",
    chips: ["Cost", "Runway", "Margin"],
  },
  {
    intent: "fundraising",
    title: "CAPITAL RAISE",
    description: "Model runway extension, dilution pressure, and timing.",
    chips: ["Capital", "Runway", "Time"],
  },
  {
    intent: "growth_investment",
    title: "GROWTH INITIATIVE",
    description: "Increase growth investment within defined risk limits.",
    chips: ["Revenue", "Cost", "Risk"],
  },
  {
    intent: "acquisition",
    title: "ACQUISITION",
    description: "Simulate purchase cost, integration timeline, and synergies.",
    chips: ["Capital", "Revenue", "Execution"],
  },
  {
    intent: "market_entry",
    title: "MARKET ENTRY",
    description: "Expand into a new segment/region with controlled ramp.",
    chips: ["Revenue", "Capital", "Risk"],
  },
  {
    intent: "product_launch",
    title: "PRODUCT LAUNCH",
    description: "Introduce a product line and model adoption and margin.",
    chips: ["Revenue", "Margin", "Time"],
  },
]

/* ── Scenario summary builder ── */

function buildScenarioSummary(
  intent: DecisionIntentType,
  card: IntentCard | undefined,
  values: Record<string, number>,
): string {
  const schema = decisionLeverSchemas[intent] ?? []
  const constraints = schema.filter((l) => l.tier === "constraint")
  if (!card || constraints.length === 0) return ""

  const parts = constraints.map((l) => {
    const v = values[l.id] ?? l.default
    return `${l.label} ${formatLeverValue(v, l)}`
  })

  return `${card.title}: ${parts.join(" · ")}. (Explore sensitivity levers in Studio.)`
}

/* ── Component ── */

export default function DecisionPage() {
  const navigate = useNavigate()

  const baseline = useCanonicalBaseline()

  const createScenario = usePhase1ScenarioStore((s) => s.createScenario)
  const setActiveScenarioId = usePhase1ScenarioStore((s) => s.setActiveScenarioId)
  const runSimulation = usePhase1ScenarioStore((s) => s.runSimulation)

  const [intentType, setIntentType] = useState<DecisionIntentType | null>(null)
  const [leverValues, setLeverValues] = useState<Record<string, number>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeCard = useMemo(
    () => INTENT_CARDS.find((c) => c.intent === intentType) ?? null,
    [intentType],
  )

  const constraintLevers = useMemo(() => {
    if (!intentType) return []
    return (decisionLeverSchemas[intentType] ?? []).filter((l) => l.tier === "constraint")
  }, [intentType])

  const constraintCount = useMemo(() => {
    if (!intentType) return 0
    return (decisionLeverSchemas[intentType] ?? []).filter((l) => l.tier === "constraint").length
  }, [intentType])

  const canRun = useMemo(
    () => !!baseline && intentType !== null && !isCreating && !isDone,
    [baseline, intentType, isCreating, isDone],
  )

  const canRunRef = useRef(false)
  canRunRef.current = canRun

  // Reset lever values when intent changes
  useEffect(() => {
    if (intentType) {
      setLeverValues(defaultLeverValues(intentType))
      setIsDone(false)
    }
  }, [intentType])

  const updateLever = useCallback((id: string, value: number) => {
    setLeverValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  const resetLevers = useCallback(() => {
    if (intentType) setLeverValues(defaultLeverValues(intentType))
  }, [intentType])

  const scenarioSummary = useMemo(
    () => intentType ? buildScenarioSummary(intentType, activeCard ?? undefined, leverValues) : "",
    [intentType, activeCard, leverValues],
  )

  /* ── Run trigger ── */
  async function handleRun() {
    setError(null)
    if (!baseline || !intentType) return

    setIsCreating(true)
    try {
      const decisionText = activeCard?.description ?? "Custom scenario"
      const { intent } = await runDecisionPipeline(decisionText, baseline)

      const scenarioId = createScenario({
        decision: decisionText,
        intent,
        decisionIntentType: intentType,
        decisionIntentLabel: activeCard?.title ?? "Other",
        leverValues,
        createdAt: Date.now(),
      })

      setActiveScenarioId(scenarioId)
      runSimulation(scenarioId)
      setIsDone(true)
      setSimulating(true)
    } catch (e) {
      console.error("[DecisionPage] run failed", e)
      setError("Failed to run decision pipeline. Check console for details.")
    } finally {
      setIsCreating(false)
    }
  }

  // Simulating cinematic → navigate to position after 3.5s
  useEffect(() => {
    if (!simulating) return
    const timer = setTimeout(() => navigate("/position", { replace: true }), 3500)
    return () => clearTimeout(timer)
  }, [simulating, navigate])

  // Ctrl+Enter / Cmd+Enter shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        if (canRunRef.current) handleRun()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Portal navigation */}
      <PortalNav />

      {/* Simulation engine overlays */}
      <SimulationStatusWidget />
      <SimulationRunOverlay />
      <SimulationPipelineWidget />

      {/* ═══ Simulating cinematic overlay ═══ */}
      {simulating && (
        <div className={css.simCinematic}>
          <div className={css.simCinematicInner}>
            <div className={css.simScanBar} />
            <div className={css.simCinematicLabel}>Simulating scenario</div>
            <div className={css.simCinematicDots}>
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}

      {/* ═══ Header block ═══ */}
      <div className={css.headerBlock}>
        <h1 className={css.pageTitle}>Strategic Decision</h1>
        <p className={css.pageSubtitle}>
          Select a strategic move. Set constraints. Run the scenario.
        </p>
        <p className={css.pageMicrocopy}>
          Constraints define the move. Sensitivities are explored in Studio.
        </p>
        <div className={css.headerDivider} />
      </div>

      {error && <div className={css.errorBanner}>{error}</div>}

      {/* ═══ Main 2-column grid ═══ */}
      <div className={css.mainGrid}>

        {/* ── LEFT: Strategic Grid (8 cards) ── */}
        <div className={css.strategicGrid}>
          {INTENT_CARDS.map((card) => {
            const isSelected = intentType === card.intent
            const numConstraints = (decisionLeverSchemas[card.intent] ?? []).filter((l) => l.tier === "constraint").length
            return (
              <button
                key={card.intent}
                type="button"
                className={`${css.card} ${isSelected ? css.cardSelected : ""}`}
                onClick={() => setIntentType(card.intent)}
                disabled={isCreating}
              >
                <div className={css.cardIndicator}>
                  {isSelected ? (
                    <div className={css.cardCheckmark}>✓</div>
                  ) : (
                    <div className={css.cardDot} />
                  )}
                </div>
                <div className={css.cardTitle}>{card.title}</div>
                <div className={css.cardDesc}>{card.description}</div>
                <div className={css.cardMeta}>
                  <div className={css.cardChips}>
                    {card.chips.map((ch) => (
                      <span key={ch} className={css.chip}>{ch}</span>
                    ))}
                  </div>
                  <span className={css.cardConstraintTag}>
                    {numConstraints} constraint{numConstraints !== 1 ? "s" : ""}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── RIGHT: Constraint Console ── */}
        <div className={css.consolePanel}>
          <div className={css.consoleSectionTitle}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 3v10M8 3v10M12 3v10" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="4" cy="6" r="1.5" fill="rgba(34,211,238,0.3)" stroke="rgba(34,211,238,0.5)" strokeWidth="0.8"/>
              <circle cx="8" cy="10" r="1.5" fill="rgba(34,211,238,0.3)" stroke="rgba(34,211,238,0.5)" strokeWidth="0.8"/>
              <circle cx="12" cy="7" r="1.5" fill="rgba(34,211,238,0.3)" stroke="rgba(34,211,238,0.5)" strokeWidth="0.8"/>
            </svg>
            Constraints
          </div>
          <p className={css.consoleSubtext}>
            Define the decision magnitude. Assumptions and sensitivities live in Studio.
          </p>

          {constraintLevers.length > 0 ? (
            <>
              <LeverSliderGroup
                levers={constraintLevers}
                values={leverValues}
                onChange={updateLever}
              />
              <button type="button" className={css.consoleResetBtn} onClick={resetLevers}>
                Reset to defaults
              </button>
            </>
          ) : (
            <div className={css.consolePlaceholder}>
              <div className={css.consolePlaceholderIcon}>▸</div>
              {intentType
                ? "No constraint levers for this intent."
                : "Select a strategic move to configure constraints."}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Scenario Summary Strip ═══ */}
      {scenarioSummary && (
        <div className={css.summaryStrip}>
          <div className={css.summaryDot} />
          <div className={css.summaryText}>
            <strong>{activeCard?.title ?? ""}: </strong>
            {scenarioSummary.replace(`${activeCard?.title ?? ""}: `, "")}
          </div>
        </div>
      )}

      {/* ═══ Run CTA block ═══ */}
      <div className={css.runBlock}>
        <button
          type="button"
          className={css.btnPrimary}
          disabled={!canRun}
          onClick={handleRun}
        >
          {isCreating ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className={css.spinner} />
              Running&hellip;
            </span>
          ) : isDone ? (
            "\u2713 Scenario Created"
          ) : (
            "Run Scenario"
          )}
        </button>

        <Link to="/studio" className={css.btnSecondary}>
          Open Studio
        </Link>

        {canRun && (
          <span className={css.kbdHint}>
            <kbd className={css.kbd}>Ctrl</kbd>
            {" + "}
            <kbd className={css.kbd}>&crarr;</kbd>
          </span>
        )}

        <div className={css.runMicro}>
          Outputs are probability-weighted scenario signals — not predictions.
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className={css.legalDisclaimer}>
        All projections, probabilities and scenario outcomes are generated by STRATFIT's simulation engine
        and do not constitute financial advice. Results are illustrative and based on user-supplied inputs.
      </div>
      <SystemProbabilityNotice />
    </div>
  )
}
