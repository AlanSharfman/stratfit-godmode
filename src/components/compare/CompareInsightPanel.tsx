// src/components/compare/CompareInsightPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare AI Insight Panel (Bottom-Right Analytics)
//
// Delta narrative, key drivers, risk commentary, and next investigations.
// Structured for future AI wiring. Uses simulation summary + heuristics.
//
// Insight items can reference terrain targets — hover/click fires
// onHighlight(target) so the parent can drive TerrainHighlightFX.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback, useMemo, useState } from "react"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { selectRiskScore } from "@/selectors/riskSelectors"
import type { ComparePair } from "@/store/compareStore"
import type { HighlightTarget, HighlightState } from "@/features/compare/highlightContract"
import { CANONICAL_TARGETS } from "@/features/compare/highlightContract"

export interface CompareInsightPanelProps {
  kpisA: SimulationKpis | null
  kpisB: SimulationKpis | null
  labelA: string
  labelB: string
  summaryA?: string
  summaryB?: string
  activePair: ComparePair
  /** Callback to drive terrain highlight FX */
  onHighlight?: (state: HighlightState) => void
}

// ── Insight Item (text + optional terrain target) ──

interface InsightItem {
  id: string
  text: string
  target?: HighlightTarget
}

// ── Insight Generation ──

interface Insights {
  executive: string
  drivers: InsightItem[]
  risk: string
  riskTarget?: HighlightTarget
  pathToAchievement: InsightItem[]
  nextInvestigation: InsightItem[]
}

function generateInsights(
  kpisA: SimulationKpis | null,
  kpisB: SimulationKpis | null,
  labelA: string,
  labelB: string,
  summaryA?: string,
  summaryB?: string,
): Insights {
  if (!kpisA || !kpisB) {
    return {
      executive: "Select two completed scenarios to see which path looks stronger.",
      drivers: [{ id: "d-wait", text: "Awaiting scenario data…" }],
      risk: "There is no useful risk read until both scenarios have finished simulating.",
      pathToAchievement: [{ id: "p-wait", text: "Run at least two scenarios to see practical next steps." }],
      nextInvestigation: [{ id: "n-wait", text: "Finish two scenarios to unlock comparison intelligence." }],
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

  const revPct = kpisA.revenue > 0 ? ((revDelta / kpisA.revenue) * 100) : 0
  const bIsBetter = revDelta > 0

  // ── Executive summary ──
  let executive: string
  if (Math.abs(revPct) < 2 && Math.abs(riskDelta) < 5) {
    executive = `${labelA} and ${labelB} land in almost the same place. Revenue is only ${Math.abs(revPct).toFixed(1)}% apart and risk barely moves, so the real question is which path feels more aligned with how you want to build.`
  } else if (bIsBetter) {
    executive = `${labelB} comes out ahead with ${Math.abs(revPct).toFixed(1)}% more revenue and ${riskDelta > 3 ? "more" : riskDelta < -3 ? "less" : "similar"} risk. ${cashDelta > 0 ? "It also leaves you with a stronger cash position." : "The trade-off is that it burns more of your cushion."}`
  } else {
    executive = `${labelA} wins on revenue by ${Math.abs(revPct).toFixed(1)}%. ${labelB} ${riskDelta < -3 ? "is safer, so this becomes a growth-versus-safety call" : "does not buy enough extra safety to justify giving up the upside"}.`
  }

  // ── Key drivers (with terrain targets) ──
  const drivers: InsightItem[] = []
  if (Math.abs(revDelta) > 0) {
    drivers.push({
      id: "d-rev",
      text: `Revenue ${revDelta > 0 ? "moves up" : "drops"} by ${fmtCurrency(Math.abs(revDelta))} (${Math.abs(revPct).toFixed(1)}%) — ${Math.abs(revPct) > 20 ? "a real change in the company story" : "a smaller but still noticeable shift"}.`,
      target: CANONICAL_TARGETS.revenueGrowth,
    })
  }
  if (Math.abs(burnDelta) > 0) {
    drivers.push({
      id: "d-burn",
      text: `Burn ${burnDelta > 0 ? "goes up" : "comes down"} by ${fmtCurrency(Math.abs(burnDelta))}/mo${burnDelta > 0 ? ", which gives you less room for error" : ", which buys you more breathing room"}.`,
      target: CANONICAL_TARGETS.burnEfficiency,
    })
  }
  if (Math.abs(marginDelta) > 1) {
    drivers.push({
      id: "d-margin",
      text: `Gross margin ${marginDelta > 0 ? "improves" : "falls"} by ${Math.abs(marginDelta).toFixed(1)}pp — ${Math.abs(marginDelta) > 5 ? "enough to change how scalable the model feels" : "a moderate move, but worth watching"}.`,
      target: CANONICAL_TARGETS.revenueGrowth,
    })
  }
  if (Math.abs(growthDelta) > 0.01) {
    drivers.push({
      id: "d-growth",
      text: `Growth changes by ${(growthDelta * 100).toFixed(1)}pp — ${Math.abs(growthDelta) > 0.05 ? "this meaningfully changes the pace of the climb" : "it's a smaller adjustment, but still directionally important"}.`,
      target: CANONICAL_TARGETS.revenueGrowth,
    })
  }
  if (Math.abs(churnDelta) > 0.005) {
    drivers.push({
      id: "d-churn",
      text: `Churn ${churnDelta > 0 ? "gets worse" : "improves"} by ${Math.abs(churnDelta * 100).toFixed(1)}pp — ${Math.abs(churnDelta) > 0.02 ? "retention becomes a real founder issue here" : "nothing fatal, but worth keeping an eye on"}.`,
      target: CANONICAL_TARGETS.demandVolatility,
    })
  }
  if (drivers.length === 0) drivers.push({ id: "d-none", text: "Neither scenario changes the shape enough to create a clear winner." })

  // ── Risk commentary ──
  let risk: string
  let riskTarget: HighlightTarget | undefined
  if (Math.abs(riskDelta) < 3) {
    risk = `Risk is basically the same in both paths (${riskA.toFixed(0)} vs ${riskB.toFixed(0)}). Neither option really changes how exposed the company feels.`
  } else if (riskDelta > 0) {
    risk = `${labelB} raises risk by ${riskDelta.toFixed(0)}pts (${riskA.toFixed(0)}→${riskB.toFixed(0)}). ${riskDelta > 15 ? "That is a meaningful jump, so you would want a stronger buffer and a clearer plan before committing." : "It's a manageable increase if the upside is worth it, but you should watch burn closely."}`
    riskTarget = CANONICAL_TARGETS.fundingRisk
  } else {
    risk = `${labelB} lowers risk by ${Math.abs(riskDelta).toFixed(0)}pts (${riskA.toFixed(0)}→${riskB.toFixed(0)}). ${Math.abs(riskDelta) > 15 ? "That is real de-risking and gives the company more room to operate." : "It is a modest improvement, but still a healthier position."}`
    riskTarget = CANONICAL_TARGETS.runwayHorizon
  }

  // ── Path to Achievement — actionable steps to reach the target terrain ──
  const pathToAchievement: InsightItem[] = []
  const better = bIsBetter ? labelB : labelA
  const weaker = bIsBetter ? labelA : labelB

  if (Math.abs(revDelta) > 0) {
    const revTarget = Math.max(kpisA.revenue, kpisB.revenue)
    pathToAchievement.push({
      id: "p-rev",
      text: `Get to ${fmtCurrency(revTarget)}/mo revenue — ${Math.abs(revPct) > 10 ? "that likely means improving conversion and pushing deal size harder" : "you can likely get there through steadier pipeline growth and better pricing"}.`,
      target: CANONICAL_TARGETS.revenueGrowth,
    })
  }

  if (Math.abs(burnDelta) > 0) {
    const targetBurn = Math.min(kpisA.monthlyBurn, kpisB.monthlyBurn)
    if (targetBurn > 0) {
      pathToAchievement.push({
        id: "p-burn",
        text: `Bring burn down to ${fmtCurrency(targetBurn)} — protect the highest-leverage spend, slow non-critical hiring, and cut anything that is not moving the company forward.`,
        target: CANONICAL_TARGETS.burnEfficiency,
      })
    }
  }

  if (Math.abs(marginDelta) > 1) {
    const targetMargin = Math.max(kpisA.grossMargin ?? 0, kpisB.grossMargin ?? 0)
    pathToAchievement.push({
      id: "p-margin",
      text: `Push gross margin toward ${(targetMargin * 100).toFixed(0)}% — improve pricing, reduce delivery cost, and make the model easier to scale.`,
    })
  }

  if (Math.abs(churnDelta) > 0.005) {
    const targetChurn = Math.min(kpisA.churnRate ?? 0, kpisB.churnRate ?? 0)
    pathToAchievement.push({
      id: "p-churn",
      text: `Drive churn below ${(targetChurn * 100).toFixed(1)}% — invest in onboarding, proactive health scoring, and expansion plays to offset at-risk accounts.`,
      target: CANONICAL_TARGETS.demandVolatility,
    })
  }

  if (runwayDelta !== 0) {
    const targetRunway = Math.max(runwayA, runwayB)
    if (targetRunway < 999) {
      pathToAchievement.push({
        id: "p-runway",
        text: `Extend runway to ${Math.round(targetRunway)} months — balance growth investment with capital preservation to widen the survival corridor.`,
        target: CANONICAL_TARGETS.runwayHorizon,
      })
    }
  }

  if (pathToAchievement.length === 0) {
    pathToAchievement.push({
      id: "p-maintain",
      text: `Maintain current trajectory — both scenarios produce similar terrain profiles. Focus on execution consistency and operational discipline.`,
    })
  }

  // ── Next investigation ──
  const nextInvestigation: InsightItem[] = []
  if (Math.abs(revPct) > 15) {
    nextInvestigation.push({
      id: "n-rev",
      text: "Validate revenue assumptions with cohort-level data — top-line variance of this magnitude warrants bottom-up verification.",
      target: CANONICAL_TARGETS.revenueGrowth,
    })
  }
  if (runwayDelta < -3) {
    nextInvestigation.push({
      id: "n-runway",
      text: "Model capital raise timing under the shorter-runway scenario — assess whether bridge or extension is required.",
      target: CANONICAL_TARGETS.runwayHorizon,
    })
  }
  if (Math.abs(churnDelta) > 0.015) {
    nextInvestigation.push({
      id: "n-churn",
      text: "Examine churn drivers by segment — determine whether the delta is concentration-driven or systemic.",
      target: CANONICAL_TARGETS.demandVolatility,
    })
  }
  if (Math.abs(marginDelta) > 5) {
    nextInvestigation.push({
      id: "n-margin",
      text: "Decompose gross margin shift into COGS components — identify whether driven by pricing, mix, or cost structure.",
    })
  }
  if (burnDelta > 50_000) {
    nextInvestigation.push({
      id: "n-burn",
      text: "Audit incremental burn against hiring plan — ensure spend aligns with revenue-generating capacity.",
      target: CANONICAL_TARGETS.burnEfficiency,
    })
  }
  if (nextInvestigation.length === 0) {
    nextInvestigation.push({ id: "n-sens", text: "Run sensitivity analysis on key assumptions to identify which lever most affects the variance." })
    nextInvestigation.push({ id: "n-3rd", text: "Consider adding a third scenario to test an alternative strategic path." })
  }

  return { executive, drivers, risk, riskTarget, pathToAchievement, nextInvestigation }
}

function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

// ── Component ──

const CompareInsightPanel: React.FC<CompareInsightPanelProps> = memo(({
  kpisA,
  kpisB,
  labelA,
  labelB,
  summaryA,
  summaryB,
  activePair,
  onHighlight,
}) => {
  const insights = useMemo(
    () => generateInsights(kpisA, kpisB, labelA, labelB, summaryA, summaryB),
    [kpisA, kpisB, labelA, labelB, summaryA, summaryB],
  )

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const fireHighlight = useCallback(
    (item: InsightItem) => {
      if (!onHighlight || !item.target) return
      onHighlight({ active: item.target, sourceId: item.id, ts: Date.now() })
    },
    [onHighlight],
  )

  const clearHighlight = useCallback(() => {
    onHighlight?.({ active: undefined, sourceId: undefined, ts: Date.now() })
    setHoveredId(null)
  }, [onHighlight])

  const handleItemEnter = useCallback(
    (item: InsightItem) => {
      setHoveredId(item.id)
      fireHighlight(item)
    },
    [fireHighlight],
  )

  const handleRiskEnter = useCallback(() => {
    if (!onHighlight || !insights.riskTarget) return
    setHoveredId("risk")
    onHighlight({ active: insights.riskTarget, sourceId: "risk", ts: Date.now() })
  }, [onHighlight, insights.riskTarget])

  return (
    <div style={S.panel}>
      {/* ── Header ── */}
      <div style={S.header}>
        <span style={S.headerIcon}>◇</span>
        <span style={S.headerTitle}>AI Delta Insights</span>
        <span style={S.pairBadge}>{activePair[0]}↔{activePair[1]}</span>
      </div>

      {/* ── Scrollable content ── */}
      <div style={S.content}>
        {/* Executive */}
        <section style={S.section}>
          <h4 style={S.sectionHead}>Executive Summary</h4>
          <p style={S.bodyText}>{insights.executive}</p>
        </section>

        {/* Drivers */}
        <section style={S.section}>
          <h4 style={S.sectionHead}>Key Drivers</h4>
          <ul style={S.list}>
            {insights.drivers.map((d) => (
              <li
                key={d.id}
                style={{
                  ...S.listItem,
                  ...(d.target ? S.listItemHoverable : {}),
                  ...(hoveredId === d.id ? S.listItemHovered : {}),
                }}
                onMouseEnter={() => handleItemEnter(d)}
                onMouseLeave={clearHighlight}
                onClick={() => fireHighlight(d)}
              >
                <span style={S.bullet}>{d.target ? "⬡" : "▸"}</span>
                <span style={S.bodyText}>{d.text}</span>
                {d.target && <span style={S.linkIcon}>⌖</span>}
              </li>
            ))}
          </ul>
        </section>

        {/* Risk */}
        <section style={S.section}>
          <h4 style={S.sectionHead}>Risk Commentary</h4>
          <p
            style={{
              ...S.bodyText,
              ...(insights.riskTarget ? S.textHoverable : {}),
              ...(hoveredId === "risk" ? S.textHovered : {}),
            }}
            onMouseEnter={handleRiskEnter}
            onMouseLeave={clearHighlight}
          >
            {insights.risk}
          </p>
        </section>

        {/* Path to Achievement */}
        <section style={S.section}>
          <h4 style={S.sectionHeadAccent}>Path to Achievement</h4>
          <p style={S.pathIntro}>What you need to do to reach this mountain position:</p>
          <ul style={S.list}>
            {insights.pathToAchievement.map((p) => (
              <li
                key={p.id}
                style={{
                  ...S.listItem,
                  ...(p.target ? S.listItemHoverable : {}),
                  ...(hoveredId === p.id ? S.listItemHovered : {}),
                }}
                onMouseEnter={() => handleItemEnter(p)}
                onMouseLeave={clearHighlight}
                onClick={() => fireHighlight(p)}
              >
                <span style={S.bulletAccent}>{p.target ? "◆" : "▹"}</span>
                <span style={S.bodyText}>{p.text}</span>
                {p.target && <span style={S.linkIcon}>⌖</span>}
              </li>
            ))}
          </ul>
        </section>

        {/* Next */}
        <section style={S.section}>
          <h4 style={S.sectionHead}>Next Signals to Examine</h4>
          <ul style={S.list}>
            {insights.nextInvestigation.map((n) => (
              <li
                key={n.id}
                style={{
                  ...S.listItem,
                  ...(n.target ? S.listItemHoverable : {}),
                  ...(hoveredId === n.id ? S.listItemHovered : {}),
                }}
                onMouseEnter={() => handleItemEnter(n)}
                onMouseLeave={clearHighlight}
                onClick={() => fireHighlight(n)}
              >
                <span style={S.bullet}>{n.target ? "⬡" : "→"}</span>
                <span style={S.bodyText}>{n.text}</span>
                {n.target && <span style={S.linkIcon}>⌖</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
})

CompareInsightPanel.displayName = "CompareInsightPanel"
export default CompareInsightPanel

/* ── Styles ── */
const FONT = "'Inter', system-ui, sans-serif"
const CYAN = "rgba(34,211,238,0.85)"

const S: Record<string, React.CSSProperties> = {
  panel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    background: "rgba(2,8,20,0.92)",
    borderRadius: 6,
    border: "1px solid rgba(182,228,255,0.08)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderBottom: "1px solid rgba(34,211,238,0.1)",
    background: "rgba(0,0,0,0.4)",
    flexShrink: 0,
  },

  headerIcon: {
    fontSize: 12,
    color: CYAN,
  },

  headerTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "rgba(148,180,214,0.7)",
    fontFamily: FONT,
    flex: 1,
  },

  pairBadge: {
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 3,
    background: "rgba(34,211,238,0.08)",
    color: CYAN,
    fontFamily: FONT,
    letterSpacing: "0.06em",
  },

  content: {
    flex: 1,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    padding: "12px 14px",
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(34,211,238,0.08) transparent",
  },

  section: {
    marginBottom: 16,
  },

  sectionHead: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(34,211,238,0.5)",
    fontFamily: FONT,
    margin: "0 0 6px",
    padding: 0,
  },

  sectionHeadAccent: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "rgba(16,185,129,0.75)",
    fontFamily: FONT,
    margin: "0 0 4px",
    padding: 0,
  },

  pathIntro: {
    fontSize: 10,
    fontWeight: 500,
    color: "rgba(148,180,214,0.45)",
    fontFamily: FONT,
    lineHeight: 1.4,
    margin: "0 0 8px",
    fontStyle: "italic" as const,
  },

  bulletAccent: {
    fontSize: 9,
    color: "rgba(16,185,129,0.6)",
    flexShrink: 0,
    marginTop: 2,
  },

  bodyText: {
    fontSize: 11,
    fontWeight: 400,
    color: "rgba(148,180,214,0.6)",
    fontFamily: FONT,
    lineHeight: 1.6,
    letterSpacing: "0.01em",
    margin: 0,
  },

  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  listItem: {
    display: "flex",
    gap: 6,
    alignItems: "flex-start",
  },

  bullet: {
    fontSize: 10,
    color: "rgba(34,211,238,0.4)",
    flexShrink: 0,
    marginTop: 1,
  },

  /* ── Highlight-linked items ── */
  listItemHoverable: {
    cursor: "pointer",
    borderRadius: 4,
    padding: "3px 4px",
    margin: "-3px -4px",
    transition: "background 180ms ease, border-color 180ms ease",
    borderLeft: "2px solid transparent",
  },

  listItemHovered: {
    background: "rgba(34,211,238,0.06)",
    borderLeftColor: "rgba(34,211,238,0.5)",
  },

  textHoverable: {
    cursor: "pointer",
    borderRadius: 4,
    padding: "3px 4px",
    transition: "background 180ms ease",
  },

  textHovered: {
    background: "rgba(34,211,238,0.06)",
  },

  linkIcon: {
    fontSize: 10,
    color: "rgba(34,211,238,0.3)",
    marginLeft: "auto",
    flexShrink: 0,
    paddingLeft: 4,
  },
}
