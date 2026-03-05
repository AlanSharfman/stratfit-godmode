import React, { useCallback, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

const STORAGE_KEY = "stratfit-explainers-seen"

interface ExplainerConfig {
  path: string
  title: string
  body: string
}

const EXPLAINERS: ExplainerConfig[] = [
  {
    path: "/position",
    title: "This Is Your Mountain",
    body: "High zones = strong. Valleys = vulnerable. Watch your business terrain build in real time as each KPI zone reveals itself. Hover any zone to see its health.",
  },
  {
    path: "/what-if",
    title: "What If — The Differentiator",
    body: "Ask your mountain a question. Stack decisions. Watch forces cascade through the terrain in real time. Every KPI is connected — one change ripples through everything.",
  },
  {
    path: "/actions",
    title: "Highest Leverage Moves",
    body: "Reverse physics identifies which lever produces the biggest terrain shift. Ranked by downstream impact. One change can elevate multiple zones.",
  },
  {
    path: "/timeline",
    title: "Strategic Timeline",
    body: "Scrub from now to 12 months. Bear, base, and bull cases. The mountain morphs to show your projected future. Red markers show where tipping points hit.",
  },
  {
    path: "/risk",
    title: "Risk Intelligence",
    body: "Five risk categories decomposed. Heat map shows hot zones. Auto stress-test runs the five worst-case scenarios and shows what breaks you fastest.",
  },
  {
    path: "/compare",
    title: "Side by Side",
    body: "Compare scenarios against each other or see your current terrain vs AI-optimized. The differences tell the story.",
  },
  {
    path: "/studio",
    title: "The Force Builder",
    body: "Drag a slider, watch the terrain respond instantly. Every force propagates through the dependency graph in real time. Build custom scenarios by hand.",
  },
  {
    path: "/valuation",
    title: "Investor Lens",
    body: "Enterprise value calculated from your terrain shape. Funding readiness scored against investor benchmarks. Bear, base, and bull valuation ranges.",
  },
  {
    path: "/boardroom",
    title: "Board Pack",
    body: "Cinematic terrain presentation or downloadable executive report. AI anticipates what the board will ask based on your terrain weaknesses.",
  },
  {
    path: "/pulse",
    title: "Weekly Pulse",
    body: "How your terrain shifted this week. Three AI-suggested questions to ask your mountain. One priority action before next Monday.",
  },
]

function getSeenPaths(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function markSeen(path: string) {
  try {
    const seen = getSeenPaths()
    seen.add(path)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
  } catch {}
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(4,8,16,0.7)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
    animation: "fadeIn 0.3s ease-out",
  },
  card: {
    maxWidth: 440,
    background: "linear-gradient(135deg, rgba(10,18,32,0.98) 0%, rgba(6,14,28,0.99) 100%)",
    border: "1px solid rgba(34,211,238,0.15)",
    borderRadius: 14,
    padding: "36px 32px 28px",
    boxShadow: "0 8px 48px rgba(0,0,0,0.5), 0 0 60px rgba(34,211,238,0.06)",
    textAlign: "center" as const,
  },
  title: {
    fontSize: 20,
    fontWeight: 300,
    letterSpacing: "0.1em",
    color: "rgba(200,220,240,0.95)",
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(200,220,240,0.6)",
    marginBottom: 24,
  },
  dismissBtn: {
    background: "linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0.06) 100%)",
    border: "1px solid rgba(34,211,238,0.25)",
    borderRadius: 8,
    padding: "12px 36px",
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    transition: "all 0.2s",
  },
}

export default function FirstVisitExplainer() {
  const location = useLocation()
  const [active, setActive] = useState<ExplainerConfig | null>(null)

  useEffect(() => {
    const seen = getSeenPaths()
    const match = EXPLAINERS.find((e) => e.path === location.pathname && !seen.has(e.path))
    if (match) {
      const timer = setTimeout(() => setActive(match), 600)
      return () => clearTimeout(timer)
    }
    setActive(null)
  }, [location.pathname])

  const dismiss = useCallback(() => {
    if (active) markSeen(active.path)
    setActive(null)
  }, [active])

  if (!active) return null

  return (
    <div style={S.overlay} onClick={dismiss}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={S.title}>{active.title}</div>
        <div style={S.body}>{active.body}</div>
        <button style={S.dismissBtn} onClick={dismiss}>Got It</button>
      </div>
    </div>
  )
}
