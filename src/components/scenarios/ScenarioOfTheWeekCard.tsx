import React, { memo, useMemo, useCallback } from "react"
import { SCENARIO_TEMPLATES, type ScenarioTemplate } from "@/engine/scenarioTemplates"

/**
 * Curated featured scenarios — hand-picked for high visual and
 * strategic impact when demonstrated on the terrain engine.
 */
const FEATURED_SCENARIOS: {
  templateId: string
  headline: string
  description: string
}[] = [
  {
    templateId: "raise-prices-20",
    headline: "Raise prices by 15%",
    description:
      "Test how pricing power affects revenue growth, liquidity, and enterprise value trajectory.",
  },
  {
    templateId: "raise-series-a",
    headline: "Raise a $5M Series A",
    description:
      "Inject growth capital and see how burn, runway, and valuation shift across the mountain.",
  },
  {
    templateId: "cut-to-profitability",
    headline: "Cut to profitability",
    description:
      "Slash burn rate and watch the terrain reshape as survival probability climbs.",
  },
  {
    templateId: "product-led-growth",
    headline: "Go product-led",
    description:
      "Invest in self-serve growth loops and see how churn drops while expansion accelerates.",
  },
  {
    templateId: "key-customer-loss",
    headline: "Lose your biggest customer",
    description:
      "Stress-test concentration risk — see the revenue crater and cascading KPI impact.",
  },
  {
    templateId: "international-expansion",
    headline: "Expand into a new market",
    description:
      "Model the cost of geographic expansion against the long-term growth upside.",
  },
  {
    templateId: "hire-sales-team",
    headline: "Build a sales team",
    description:
      "Scale revenue through dedicated sales reps — see burn rise but growth follow.",
  },
  {
    templateId: "enterprise-tier",
    headline: "Launch enterprise pricing",
    description:
      "Introduce high-value contracts and watch margins expand across the terrain.",
  },
]

function getSessionSeed(): number {
  const key = "stratfit-sotw-seed"
  const stored = sessionStorage.getItem(key)
  if (stored) return parseInt(stored, 10)
  const seed = Math.floor(Math.random() * FEATURED_SCENARIOS.length)
  sessionStorage.setItem(key, String(seed))
  return seed
}

interface Props {
  onRunScenario: (template: ScenarioTemplate, promptText: string) => void
}

const S = {
  card: {
    width: "100%",
    maxWidth: 1500,
    margin: "0 auto",
    padding: "10px 20px",
    borderRadius: 10,
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(6,14,24,0.92) 40%, rgba(10,31,51,0.95) 100%)",
    border: "1px solid rgba(16,185,129,0.15)",
    boxShadow:
      "0 0 12px rgba(16,185,129,0.04), 0 2px 12px rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    gap: 16,
    fontFamily: "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,
  accent: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
    background: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
    flexShrink: 0,
  } as React.CSSProperties,
  body: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  eyebrow: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#10b981",
    marginBottom: 4,
  } as React.CSSProperties,
  headline: {
    fontSize: 13,
    fontWeight: 700,
    color: "#e2e8f0",
    lineHeight: 1.3,
    marginBottom: 2,
  } as React.CSSProperties,
  desc: {
    fontSize: 11,
    lineHeight: 1.45,
    color: "#94a3b8",
  } as React.CSSProperties,
  btn: {
    flexShrink: 0,
    padding: "7px 16px",
    borderRadius: 8,
    border: "1px solid rgba(16,185,129,0.3)",
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)",
    color: "#10b981",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'Inter', system-ui, sans-serif",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
} as const

const ScenarioOfTheWeekCard: React.FC<Props> = memo(({ onRunScenario }) => {
  const featured = useMemo(() => {
    const idx = getSessionSeed()
    const pick = FEATURED_SCENARIOS[idx % FEATURED_SCENARIOS.length]
    const template = SCENARIO_TEMPLATES.find((t) => t.id === pick.templateId)
    return template ? { ...pick, template } : null
  }, [])

  const handleClick = useCallback(() => {
    if (!featured) return
    onRunScenario(featured.template, featured.headline)
  }, [featured, onRunScenario])

  if (!featured) return null

  return (
    <div style={S.card}>
      <div style={S.accent} />
      <div style={S.body}>
        <div style={S.eyebrow}>Scenario of the Week</div>
        <div style={S.headline}>{featured.headline}</div>
        <div style={S.desc}>{featured.description}</div>
      </div>
      <button
        style={S.btn}
        onClick={handleClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.10) 100%)"
          e.currentTarget.style.boxShadow = "0 0 16px rgba(16,185,129,0.2)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = S.btn.background as string
          e.currentTarget.style.boxShadow = "none"
        }}
      >
        Run Simulation
      </button>
    </div>
  )
})

ScenarioOfTheWeekCard.displayName = "ScenarioOfTheWeekCard"
export default ScenarioOfTheWeekCard
