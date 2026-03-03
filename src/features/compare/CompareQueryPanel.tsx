// src/features/compare/CompareQueryPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Controlled Q&A (Compare Context)
//
// Constrained "Ask about this comparison" panel.
// NOT a free ChatGPT search bar. Structured prompts + optional short
// custom question. Answers are STUBBED (deterministic templated
// responses from deltas). Grounded in compare data ONLY.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback, useMemo, useState } from "react"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { selectRiskScore } from "@/selectors/riskSelectors"
import type { HighlightState, HighlightTarget } from "./highlightContract"
import { CANONICAL_TARGETS } from "./highlightContract"

export interface CompareQueryPanelProps {
  kpisA: SimulationKpis | null
  kpisB: SimulationKpis | null
  labelA: string
  labelB: string
  onClose: () => void
  onHighlight?: (state: HighlightState) => void
}

/* ── Structured prompts ── */

interface QueryChip {
  id: string
  label: string
  icon: string
}

const QUERY_CHIPS: QueryChip[] = [
  { id: "outperform", label: "Why does one scenario outperform?", icon: "△" },
  { id: "risk-diverge", label: "Where does risk diverge most?", icon: "◈" },
  { id: "runway-delta", label: "What drives the runway delta?", icon: "⧫" },
  { id: "assumptions", label: "Which assumptions matter most?", icon: "◇" },
]

const MAX_CUSTOM_LEN = 160

/* ── Answer generation (deterministic, template-based) ── */

interface QueryAnswer {
  summary: string
  drivers: string[]
  examine: string
  highlightTarget?: HighlightTarget
}

function generateAnswer(
  queryId: string,
  kpisA: SimulationKpis | null,
  kpisB: SimulationKpis | null,
  labelA: string,
  labelB: string,
  customQ?: string,
): QueryAnswer {
  if (!kpisA || !kpisB) {
    return {
      summary: "Cannot generate an answer without completed simulations for both scenarios.",
      drivers: ["Complete at least two simulations to enable comparison queries."],
      examine: "Return to the scenario builder and run simulations.",
    }
  }

  const revDelta = kpisB.revenue - kpisA.revenue
  const cashDelta = kpisB.cash - kpisA.cash
  const burnDelta = kpisB.monthlyBurn - kpisA.monthlyBurn
  const runwayA = kpisA.monthlyBurn > 0 ? kpisA.cash / kpisA.monthlyBurn : 999
  const runwayB = kpisB.monthlyBurn > 0 ? kpisB.cash / kpisB.monthlyBurn : 999
  const runwayDelta = runwayB - runwayA
  const riskA = selectRiskScore(kpisA)
  const riskB = selectRiskScore(kpisB)
  const riskDelta = riskB - riskA
  const marginDelta = (kpisB.grossMargin ?? 0) - (kpisA.grossMargin ?? 0)
  const growthDelta = (kpisB.growthRate ?? 0) - (kpisA.growthRate ?? 0)
  const churnDelta = (kpisB.churnRate ?? 0) - (kpisA.churnRate ?? 0)
  const revPct = kpisA.revenue > 0 ? (revDelta / kpisA.revenue) * 100 : 0
  const better = revDelta > 0 ? labelB : labelA
  const worse = revDelta > 0 ? labelA : labelB

  switch (queryId) {
    case "outperform":
      return {
        summary: `${better} outperforms primarily through ${Math.abs(revPct) > 10 ? "materially higher revenue generation" : "incremental revenue gains"} (${Math.abs(revPct).toFixed(1)}% delta). ${cashDelta > 0 === (revDelta > 0) ? "Cash position reinforces the revenue thesis." : "However, the cash position tells a different story — capital efficiency diverges from revenue performance."}`,
        drivers: [
          `Revenue delta: ${fmt(Math.abs(revDelta))} (${Math.abs(revPct).toFixed(1)}%)`,
          `Burn rate difference: ${fmt(Math.abs(burnDelta))}/mo`,
          Math.abs(growthDelta) > 0.01
            ? `Growth rate gap: ${(growthDelta * 100).toFixed(1)}pp`
            : `Margin delta: ${marginDelta.toFixed(1)}pp`,
        ],
        examine: "Validate whether the revenue assumption holds under downside stress testing.",
        highlightTarget: CANONICAL_TARGETS.revenueGrowth,
      }

    case "risk-diverge":
      return {
        summary: `Risk diverges by ${Math.abs(riskDelta).toFixed(0)}pts (${riskA.toFixed(0)} vs ${riskB.toFixed(0)}). ${Math.abs(riskDelta) > 10 ? "This is a material spread — the scenarios occupy fundamentally different risk corridors." : "The gap is modest — both scenarios share a similar risk profile."} ${riskDelta > 0 ? `${labelB} carries the higher risk load.` : `${labelA} carries the higher risk load.`}`,
        drivers: [
          `Burn differential: ${fmt(Math.abs(burnDelta))}/mo`,
          `Runway gap: ${Math.abs(runwayDelta).toFixed(1)} months`,
          Math.abs(churnDelta) > 0.005
            ? `Churn variance: ${Math.abs(churnDelta * 100).toFixed(1)}pp`
            : `Cash position delta: ${fmt(Math.abs(cashDelta))}`,
        ],
        examine: "Map the risk delta to specific assumption changes to isolate causal driver.",
        highlightTarget: CANONICAL_TARGETS.fundingRisk,
      }

    case "runway-delta":
      return {
        summary: `Runway differs by ${Math.abs(runwayDelta).toFixed(1)} months (${runwayA.toFixed(1)}mo vs ${runwayB.toFixed(1)}mo). ${Math.abs(runwayDelta) > 6 ? "This is decision-critical — one path may require a capital event the other avoids." : "Within a similar capital planning window, though the direction matters at the margin."}`,
        drivers: [
          `Cash delta: ${fmt(Math.abs(cashDelta))}`,
          `Monthly burn delta: ${fmt(Math.abs(burnDelta))}`,
          `Revenue offset: ${fmt(Math.abs(revDelta))}`,
        ],
        examine: "Model bridge financing scenarios for the shorter-runway path to assess feasibility.",
        highlightTarget: CANONICAL_TARGETS.runwayHorizon,
      }

    case "assumptions":
      return {
        summary: `The comparison is most sensitive to ${Math.abs(revPct) > 15 ? "revenue growth assumptions" : Math.abs(burnDelta) > 30_000 ? "operating expenditure levels" : Math.abs(churnDelta) > 0.015 ? "customer retention rates" : "the combination of growth and burn assumptions"}. Small changes in ${Math.abs(growthDelta) > 0.03 ? "growth rate" : "burn rate"} have outsized impact on the delta between ${labelA} and ${labelB}.`,
        drivers: [
          `Growth sensitivity: ${(growthDelta * 100).toFixed(1)}pp spread`,
          `Burn sensitivity: ${fmt(Math.abs(burnDelta))}/mo spread`,
          `Churn sensitivity: ${Math.abs(churnDelta * 100).toFixed(1)}pp spread`,
        ],
        examine: "Run Monte Carlo sensitivity sweeps on the highest-impact lever to establish confidence bounds.",
        highlightTarget: CANONICAL_TARGETS.demandVolatility,
      }

    default:
      // Custom question — provide a general delta summary
      return {
        summary: `Based on the comparison data: ${better} shows stronger performance with ${Math.abs(revPct).toFixed(1)}% revenue advantage. Risk differential is ${Math.abs(riskDelta).toFixed(0)}pts. Runway differs by ${Math.abs(runwayDelta).toFixed(1)} months. This answer is grounded only in the modelled comparison data.`,
        drivers: [
          `Revenue delta: ${fmt(Math.abs(revDelta))}`,
          `Risk delta: ${Math.abs(riskDelta).toFixed(0)}pts`,
          `Runway delta: ${Math.abs(runwayDelta).toFixed(1)}mo`,
        ],
        examine: "Refine your question using the structured prompts above for more targeted analysis.",
      }
  }
}

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

/* ── Component ── */

const CompareQueryPanel: React.FC<CompareQueryPanelProps> = memo(
  ({ kpisA, kpisB, labelA, labelB, onClose, onHighlight }) => {
    const [selectedChip, setSelectedChip] = useState<string | null>(null)
    const [customText, setCustomText] = useState("")
    const [activeQuery, setActiveQuery] = useState<string | null>(null)

    const answer = useMemo<QueryAnswer | null>(() => {
      if (!activeQuery) return null
      return generateAnswer(activeQuery, kpisA, kpisB, labelA, labelB, customText)
    }, [activeQuery, kpisA, kpisB, labelA, labelB, customText])

    const handleChipClick = useCallback((chipId: string) => {
      setSelectedChip(chipId)
      setActiveQuery(chipId)
    }, [])

    const handleCustomSubmit = useCallback(() => {
      if (customText.trim().length < 5) return
      setSelectedChip(null)
      setActiveQuery("custom")
    }, [customText])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          handleCustomSubmit()
        }
      },
      [handleCustomSubmit],
    )

    // When answer has a highlight target, fire it
    const handleAnswerHighlight = useCallback(() => {
      if (answer?.highlightTarget && onHighlight) {
        onHighlight({
          active: answer.highlightTarget,
          sourceId: `qa-${activeQuery}`,
          ts: Date.now(),
        })
      }
    }, [answer, activeQuery, onHighlight])

    return (
      <div style={P.overlay} onClick={onClose}>
        <div style={P.panel} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={P.header}>
            <span style={P.headerIcon}>◈</span>
            <span style={P.headerTitle}>Ask About This Comparison</span>
            <button type="button" onClick={onClose} style={P.closeBtn}>×</button>
          </div>

          {/* Instruction */}
          <div style={P.instruction}>
            Answers are grounded in the comparison data only. Select a structured prompt or ask a short question.
          </div>

          {/* Chips */}
          <div style={P.chipGrid}>
            {QUERY_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                style={selectedChip === chip.id ? P.chipActive : P.chip}
                onClick={() => handleChipClick(chip.id)}
              >
                <span style={P.chipIcon}>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div style={P.customRow}>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value.slice(0, MAX_CUSTOM_LEN))}
              onKeyDown={handleKeyDown}
              placeholder="Or ask a short question about the delta…"
              maxLength={MAX_CUSTOM_LEN}
              style={P.customInput}
            />
            <button
              type="button"
              onClick={handleCustomSubmit}
              disabled={customText.trim().length < 5}
              style={customText.trim().length >= 5 ? P.submitBtn : P.submitBtnDisabled}
            >
              Ask
            </button>
          </div>
          <div style={P.charCount}>{customText.length}/{MAX_CUSTOM_LEN}</div>

          {/* Answer area */}
          {answer && (
            <div style={P.answerArea}>
              <div style={P.answerDivider} />

              <p style={P.answerSummary}>{answer.summary}</p>

              <div style={P.answerDriversLabel}>Key Factors</div>
              <ul style={P.answerList}>
                {answer.drivers.map((d, i) => (
                  <li key={i} style={P.answerListItem}>
                    <span style={P.answerBullet}>▸</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>

              <div
                style={P.answerExamine}
                onClick={handleAnswerHighlight}
                role={answer.highlightTarget ? "button" : undefined}
                tabIndex={answer.highlightTarget ? 0 : undefined}
              >
                <span style={P.examineIcon}>→</span>
                <span>{answer.examine}</span>
                {answer.highlightTarget && <span style={P.linkTag}>⌖ terrain</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },
)

CompareQueryPanel.displayName = "CompareQueryPanel"
export default CompareQueryPanel

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"
const CYAN = "rgba(34,211,238,0.85)"

const P: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
  },

  panel: {
    width: 520,
    maxHeight: "80vh",
    background: "rgba(2,8,20,0.97)",
    border: "1px solid rgba(34,211,238,0.12)",
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: FONT,
    color: "#e2e8f0",
    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    borderBottom: "1px solid rgba(34,211,238,0.08)",
    background: "rgba(0,0,0,0.4)",
  },

  headerIcon: {
    fontSize: 14,
    color: CYAN,
  },

  headerTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "rgba(148,180,214,0.7)",
    flex: 1,
  },

  closeBtn: {
    width: 24,
    height: 24,
    border: "none",
    borderRadius: 4,
    background: "rgba(255,255,255,0.06)",
    color: "rgba(148,180,214,0.5)",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FONT,
  },

  instruction: {
    padding: "10px 16px",
    fontSize: 10,
    color: "rgba(148,180,214,0.4)",
    letterSpacing: "0.02em",
    lineHeight: 1.5,
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },

  chipGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    padding: "12px 16px",
  },

  chip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid rgba(182,228,255,0.08)",
    background: "rgba(0,0,0,0.3)",
    color: "rgba(148,180,214,0.6)",
    fontSize: 10,
    fontWeight: 500,
    fontFamily: FONT,
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "background 180ms ease, border-color 180ms ease",
  },

  chipActive: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid rgba(34,211,238,0.3)",
    background: "rgba(34,211,238,0.08)",
    color: CYAN,
    fontSize: 10,
    fontWeight: 600,
    fontFamily: FONT,
    cursor: "pointer",
    textAlign: "left" as const,
  },

  chipIcon: {
    fontSize: 12,
    flexShrink: 0,
  },

  customRow: {
    display: "flex",
    gap: 6,
    padding: "0 16px 6px",
  },

  customInput: {
    flex: 1,
    padding: "7px 10px",
    borderRadius: 6,
    border: "1px solid rgba(182,228,255,0.08)",
    background: "rgba(0,0,0,0.4)",
    color: "#e2e8f0",
    fontSize: 11,
    fontFamily: FONT,
    outline: "none",
  },

  submitBtn: {
    padding: "7px 14px",
    borderRadius: 6,
    border: "1px solid rgba(34,211,238,0.2)",
    background: "rgba(34,211,238,0.1)",
    color: CYAN,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },

  submitBtnDisabled: {
    padding: "7px 14px",
    borderRadius: 6,
    border: "1px solid rgba(182,228,255,0.05)",
    background: "rgba(0,0,0,0.2)",
    color: "rgba(148,180,214,0.25)",
    fontSize: 10,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "not-allowed",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },

  charCount: {
    padding: "0 16px 8px",
    fontSize: 9,
    color: "rgba(148,180,214,0.2)",
    textAlign: "right" as const,
  },

  answerArea: {
    overflowY: "auto" as const,
    padding: "0 16px 16px",
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(34,211,238,0.08) transparent",
  },

  answerDivider: {
    height: 1,
    background: "rgba(34,211,238,0.1)",
    marginBottom: 12,
  },

  answerSummary: {
    fontSize: 11,
    fontWeight: 400,
    color: "rgba(226,240,255,0.7)",
    lineHeight: 1.65,
    margin: "0 0 10px",
  },

  answerDriversLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(34,211,238,0.4)",
    marginBottom: 6,
  },

  answerList: {
    listStyle: "none",
    margin: "0 0 10px",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },

  answerListItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 6,
    fontSize: 11,
    color: "rgba(148,180,214,0.6)",
  },

  answerBullet: {
    color: "rgba(34,211,238,0.35)",
    flexShrink: 0,
    marginTop: 1,
  },

  answerExamine: {
    display: "flex",
    alignItems: "flex-start",
    gap: 6,
    padding: "8px 10px",
    borderRadius: 6,
    background: "rgba(34,211,238,0.04)",
    border: "1px solid rgba(34,211,238,0.08)",
    fontSize: 10,
    color: "rgba(148,180,214,0.55)",
    lineHeight: 1.5,
    cursor: "pointer",
    transition: "background 180ms ease",
  },

  examineIcon: {
    color: "rgba(34,211,238,0.4)",
    flexShrink: 0,
    marginTop: 1,
  },

  linkTag: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "rgba(34,211,238,0.35)",
    background: "rgba(34,211,238,0.06)",
    padding: "2px 5px",
    borderRadius: 3,
    marginLeft: "auto",
    flexShrink: 0,
    textTransform: "uppercase" as const,
  },
}
