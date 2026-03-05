import React, { useCallback, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "@/engine/kpiDependencyGraph"
import { SCENARIO_TEMPLATES } from "@/engine/scenarioTemplates"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel } from "@/pages/position/overlays/positionState"
import { useTypewriterHint } from "@/hooks/useTypewriterHint"
import { ROUTES } from "@/routes/routeContract"

type Tab = "ask" | "insights" | "alerts"

interface Insight {
  title: string
  body: string
  action?: { label: string; route: string }
  severity: "info" | "warning" | "critical" | "success"
}

function generateInsights(kpis: ReturnType<typeof buildPositionViewModel>["kpis"] | null): Insight[] {
  if (!kpis) return [{ title: "No Baseline", body: "Complete the Initiate step to unlock Mentor insights.", action: { label: "Go to Initiate", route: ROUTES.INITIATE }, severity: "info" }]

  const insights: Insight[] = []
  const criticals = KPI_KEYS.filter((k) => getHealthLevel(k, kpis) === "critical")
  const strongs = KPI_KEYS.filter((k) => getHealthLevel(k, kpis) === "strong")

  if (criticals.length >= 3) {
    insights.push({
      title: "Multiple Critical Zones",
      body: `${criticals.map((k) => KPI_ZONE_MAP[k].label).join(", ")} are all in critical state. This combination creates compounding risk — address the highest-leverage zone first.`,
      action: { label: "View Actions", route: ROUTES.ACTIONS },
      severity: "critical",
    })
  }

  if (kpis.runwayMonths < 6) {
    insights.push({
      title: `Runway: ${kpis.runwayMonths.toFixed(1)} months`,
      body: "Less than 6 months of runway is a survival-level concern. Consider fundraising, cutting burn, or accelerating revenue immediately.",
      action: { label: "Stress Test", route: ROUTES.RISK },
      severity: "critical",
    })
  } else if (kpis.runwayMonths < 12) {
    insights.push({
      title: `Runway: ${kpis.runwayMonths.toFixed(1)} months`,
      body: "Under 12 months. Begin fundraising preparations now — it typically takes 3-6 months to close a round.",
      action: { label: "Check Valuation", route: ROUTES.VALUATION },
      severity: "warning",
    })
  }

  if (kpis.churnPct > 8) {
    insights.push({
      title: `Churn at ${kpis.churnPct.toFixed(1)}%`,
      body: "High churn is silently destroying growth. Each percentage point of churn reduction has outsized impact on ARR compound growth.",
      action: { label: "Simulate Reduction", route: ROUTES.WHAT_IF },
      severity: "warning",
    })
  }

  if (kpis.burnMonthly > kpis.revenueMonthly * 1.5) {
    insights.push({
      title: "Burn Exceeds 1.5x Revenue",
      body: "Your burn rate is significantly higher than revenue. Focus on unit economics before scaling.",
      action: { label: "Open Studio", route: ROUTES.STUDIO },
      severity: "warning",
    })
  }

  if (kpis.grossMarginPct < 50) {
    insights.push({
      title: `Gross Margin: ${kpis.grossMarginPct.toFixed(0)}%`,
      body: "Below 50% makes it hard to build a scalable business. Investors expect 60%+ for SaaS, 40%+ for marketplace.",
      severity: "warning",
    })
  }

  if (strongs.length >= 6) {
    insights.push({
      title: "Strong Foundation",
      body: `${strongs.length} of 10 zones are strong. This is a solid position — focus on converting the remaining watch zones.`,
      action: { label: "View Timeline", route: ROUTES.TIMELINE },
      severity: "success",
    })
  }

  if (kpis.growthRatePct > 20) {
    insights.push({
      title: `Growth: ${kpis.growthRatePct.toFixed(0)}%`,
      body: "Strong growth rate. Make sure unit economics are healthy before pouring fuel on this fire.",
      severity: "success",
    })
  }

  if (insights.length === 0) {
    insights.push({
      title: "Steady State",
      body: "No critical alerts. Your terrain is stable. Use the What If engine to explore growth scenarios.",
      action: { label: "Explore Scenarios", route: ROUTES.WHAT_IF },
      severity: "info",
    })
  }

  return insights
}

const PAGE_CONTEXT: Record<string, { title: string; hints: string[] }> = {
  "/position": { title: "Position", hints: ["Which zone should I focus on?", "Is my business healthy?", "Where am I most vulnerable?"] },
  "/what-if": { title: "What If", hints: ["What if we lose our biggest client?", "What if we double marketing spend?", "What if churn drops to 2%?"] },
  "/actions": { title: "Actions", hints: ["What's my highest leverage move?", "Which action is fastest to execute?", "How do I improve margin?"] },
  "/timeline": { title: "Timeline", hints: ["When do I run out of money?", "What does the bull case look like?", "Where's my first cliff?"] },
  "/risk": { title: "Risk", hints: ["What's my biggest risk?", "How concentrated is my revenue?", "What breaks me fastest?"] },
  "/compare": { title: "Compare", hints: ["How does my terrain compare to optimal?", "What's the delta between scenarios?"] },
  "/studio": { title: "Studio", hints: ["What happens if I move this slider?", "How do forces propagate?"] },
  "/valuation": { title: "Valuation", hints: ["What's my enterprise value?", "Am I ready for fundraising?", "What multiple am I getting?"] },
  "/boardroom": { title: "Boardroom", hints: ["What will the board ask?", "Generate my executive summary", "Download the board pack"] },
  "/pulse": { title: "Pulse", hints: ["What changed this week?", "What should I focus on today?"] },
}

const SEVERITY_COLORS = {
  info: "rgba(34,211,238,0.7)",
  warning: "#fbbf24",
  critical: "#f87171",
  success: "#34d399",
}

export default function QAFloatingPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("ask")
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const location = useLocation()

  const { baseline } = useSystemBaseline()
  const kpis = useMemo(() => baseline ? buildPositionViewModel(baseline as any).kpis : null, [baseline])

  const pageCtx = PAGE_CONTEXT[location.pathname] ?? null

  const placeholder = useTypewriterHint({
    phrases: pageCtx?.hints ?? [
      "What if we raise a Series A?",
      "What happens if churn doubles?",
      "How do I extend runway?",
    ],
  })

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return SCENARIO_TEMPLATES
      .filter((t) => t.question.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.includes(q))
      .slice(0, 5)
      .map((tmpl) => {
        const forces = Object.entries(tmpl.forces).map(([k, v]) => {
          const prefix = v > 0 ? "+" : ""
          return `${k} ${prefix}${v}`
        })
        const allAffected = new Map<KpiKey, number>()
        for (const [kpi, delta] of Object.entries(tmpl.forces) as [KpiKey, number][]) {
          const { affected } = propagateForce(KPI_GRAPH, kpi, delta)
          for (const [k, d] of affected) {
            if (k !== kpi) allAffected.set(k, (allAffected.get(k) ?? 0) + d)
          }
        }
        const affectedZones = Array.from(allAffected.keys()).slice(0, 4).map((k) => KPI_ZONE_MAP[k].label)
        return { template: tmpl, forces, affectedZones }
      })
  }, [query])

  const insights = useMemo(() => generateInsights(kpis), [kpis])
  const alertCount = insights.filter((i) => i.severity === "critical" || i.severity === "warning").length

  const handleNavigate = useCallback((route: string) => {
    navigate(route)
    setOpen(false)
  }, [navigate])

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Mentor" : "Open Mentor"}
        title="Mentor Mode"
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 52, height: 52, borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0.12) 100%)"
            : "linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(34,211,238,0.08) 100%)",
          border: "1px solid rgba(34,211,238,0.3)",
          color: "#22d3ee", fontSize: open ? 18 : 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 32px rgba(34,211,238,0.1)",
          zIndex: 1000, transition: "all 0.25s",
          fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700,
        }}
      >
        {open ? "×" : "M"}
        {!open && alertCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 18, height: 18, borderRadius: "50%",
            background: "#f87171", color: "#fff",
            fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {alertCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24,
          width: 420, maxHeight: 560,
          background: "linear-gradient(135deg, rgba(10,18,32,0.98) 0%, rgba(6,14,28,0.99) 100%)",
          border: "1px solid rgba(34,211,238,0.15)",
          borderRadius: 14,
          boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 40px rgba(34,211,238,0.05)",
          zIndex: 1001, display: "flex", flexDirection: "column",
          overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid rgba(34,211,238,0.08)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(34,211,238,0.6)" }}>
                Mentor Mode
              </div>
              {pageCtx && (
                <div style={{ fontSize: 9, color: "rgba(200,220,240,0.25)", marginTop: 2, letterSpacing: "0.06em" }}>
                  Context: {pageCtx.title}
                </div>
              )}
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(200,220,240,0.4)", fontSize: 16, cursor: "pointer" }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
            {(["ask", "insights", "alerts"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: "10px 0",
                  background: tab === t ? "rgba(34,211,238,0.06)" : "transparent",
                  borderBottom: tab === t ? "2px solid rgba(34,211,238,0.5)" : "2px solid transparent",
                  border: "none", borderLeft: "none", borderRight: "none",
                  color: tab === t ? "#22d3ee" : "rgba(200,220,240,0.3)",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", cursor: "pointer",
                  transition: "all 0.15s", position: "relative",
                }}
              >
                {t === "alerts" && alertCount > 0 ? `Alerts (${alertCount})` : t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
            {/* ASK tab */}
            {tab === "ask" && (
              <>
                <div style={{ padding: "8px 0 12px" }}>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    autoFocus
                    style={{
                      width: "100%", background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(34,211,238,0.1)", borderRadius: 8,
                      padding: "10px 14px", color: "rgba(200,220,240,0.9)",
                      fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif", outline: "none",
                    }}
                  />
                </div>

                {query.trim() === "" ? (
                  <div style={{ color: "rgba(200,220,240,0.25)", fontSize: 12, lineHeight: 1.6, padding: "12px 0" }}>
                    Ask your mountain a question. The Mentor searches 50+ scenario templates and shows force previews with terrain impact analysis.
                    {pageCtx && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(34,211,238,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Suggested for this page</div>
                        {pageCtx.hints.map((h, i) => (
                          <div
                            key={i}
                            onClick={() => setQuery(h)}
                            style={{
                              padding: "8px 10px", marginBottom: 4,
                              background: "rgba(15,25,45,0.5)",
                              border: "1px solid rgba(34,211,238,0.04)",
                              borderRadius: 6, fontSize: 12,
                              color: "rgba(200,220,240,0.5)",
                              cursor: "pointer", transition: "border-color 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(34,211,238,0.15)")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(34,211,238,0.04)")}
                          >
                            {h}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : results.length === 0 ? (
                  <div style={{ color: "rgba(200,220,240,0.3)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>
                    No matching scenarios. Try different keywords.
                  </div>
                ) : (
                  results.map((r) => (
                    <div
                      key={r.template.id}
                      onClick={() => handleNavigate(ROUTES.WHAT_IF)}
                      style={{
                        padding: "12px 14px", marginBottom: 8,
                        background: "rgba(15,25,45,0.6)",
                        border: "1px solid rgba(34,211,238,0.06)",
                        borderRadius: 8, cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(34,211,238,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(34,211,238,0.06)")}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(200,220,240,0.85)", marginBottom: 6 }}>{r.template.question}</div>
                      <div style={{ fontSize: 11, color: "rgba(200,220,240,0.4)", lineHeight: 1.5 }}>{r.template.description}</div>
                      <div style={{ marginTop: 8 }}>
                        {r.forces.map((f, i) => (
                          <span key={i} style={{
                            display: "inline-block", padding: "2px 6px", marginRight: 4,
                            borderRadius: 3, fontSize: 10, fontWeight: 600,
                            background: "rgba(34,211,238,0.06)", color: "rgba(34,211,238,0.7)",
                          }}>{f}</span>
                        ))}
                      </div>
                      {r.affectedZones.length > 0 && (
                        <div style={{ fontSize: 10, color: "rgba(200,220,240,0.3)", marginTop: 6 }}>
                          Cascade → {r.affectedZones.join(", ")}
                        </div>
                      )}
                      <div style={{ fontSize: 9, color: "rgba(34,211,238,0.4)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Click to simulate in What If →
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* INSIGHTS tab */}
            {tab === "insights" && (
              <>
                {insights.filter((i) => i.severity === "success" || i.severity === "info").map((insight, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", marginBottom: 8,
                    background: "rgba(15,25,45,0.5)",
                    borderLeft: `3px solid ${SEVERITY_COLORS[insight.severity]}`,
                    borderRadius: "0 8px 8px 0",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: SEVERITY_COLORS[insight.severity], marginBottom: 4 }}>{insight.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(200,220,240,0.5)", lineHeight: 1.6 }}>{insight.body}</div>
                    {insight.action && (
                      <button
                        onClick={() => handleNavigate(insight.action!.route)}
                        style={{
                          marginTop: 8, background: "none",
                          border: `1px solid ${SEVERITY_COLORS[insight.severity]}40`,
                          borderRadius: 4, padding: "4px 10px",
                          color: SEVERITY_COLORS[insight.severity],
                          fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                          textTransform: "uppercase", cursor: "pointer",
                        }}
                      >
                        {insight.action.label} →
                      </button>
                    )}
                  </div>
                ))}
                {insights.filter((i) => i.severity === "success" || i.severity === "info").length === 0 && (
                  <div style={{ color: "rgba(200,220,240,0.25)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>No positive insights to show right now.</div>
                )}
              </>
            )}

            {/* ALERTS tab */}
            {tab === "alerts" && (
              <>
                {insights.filter((i) => i.severity === "critical" || i.severity === "warning").length === 0 ? (
                  <div style={{ color: "rgba(52,211,153,0.5)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>
                    No alerts. Your terrain is in good shape.
                  </div>
                ) : (
                  insights.filter((i) => i.severity === "critical" || i.severity === "warning").map((insight, i) => (
                    <div key={i} style={{
                      padding: "12px 14px", marginBottom: 8,
                      background: insight.severity === "critical" ? "rgba(248,113,113,0.04)" : "rgba(251,191,36,0.04)",
                      borderLeft: `3px solid ${SEVERITY_COLORS[insight.severity]}`,
                      borderRadius: "0 8px 8px 0",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: SEVERITY_COLORS[insight.severity], marginBottom: 4 }}>{insight.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(200,220,240,0.5)", lineHeight: 1.6 }}>{insight.body}</div>
                      {insight.action && (
                        <button
                          onClick={() => handleNavigate(insight.action!.route)}
                          style={{
                            marginTop: 8, background: "none",
                            border: `1px solid ${SEVERITY_COLORS[insight.severity]}40`,
                            borderRadius: 4, padding: "4px 10px",
                            color: SEVERITY_COLORS[insight.severity],
                            fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                            textTransform: "uppercase", cursor: "pointer",
                          }}
                        >
                          {insight.action.label} →
                        </button>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
