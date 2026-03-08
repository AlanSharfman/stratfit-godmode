import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const ROUTE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "STRATFIT — Business Physics Engine",
    description: "Your business has a shape. STRATFIT visualises strategic forces as living 3D terrain.",
  },
  "/initiate": {
    title: "Initiate — STRATFIT",
    description: "Enter your business KPIs to generate your strategic terrain.",
  },
  "/position": {
    title: "Position — STRATFIT",
    description: "View your business terrain — 10 KPI zones mapped to 3D elevation.",
  },
  "/what-if": {
    title: "What If — STRATFIT",
    description: "Ask strategic questions and watch your terrain morph in real time.",
  },
  "/actions": {
    title: "Actions — STRATFIT",
    description: "Ranked action recommendations based on terrain sensitivity analysis.",
  },
  "/timeline": {
    title: "Timeline — STRATFIT",
    description: "Project your business trajectory forward 24 months with tipping point detection.",
  },
  "/risk": {
    title: "Risk — STRATFIT",
    description: "Risk decomposition, cascade network, and stress test scenarios.",
  },
  "/compare": {
    title: "Compare — STRATFIT",
    description: "Side-by-side scenario comparison with ghost terrain overlay.",
  },
  "/studio": {
    title: "Studio — STRATFIT",
    description: "Fine-tune KPI forces manually and explore terrain sensitivity.",
  },
  "/valuation": {
    title: "Valuation — STRATFIT",
    description: "Enterprise value estimation with scenario-based sensitivity.",
  },
  "/boardroom": {
    title: "Boardroom — STRATFIT",
    description: "Cinematic board report with AI-narrated intelligence briefing.",
  },
  "/pulse": {
    title: "Pulse — STRATFIT",
    description: "Real-time business health monitoring and trend detection.",
  },
}

const DEFAULT_META = {
  title: "STRATFIT — Business Physics Engine",
  description: "Strategic foresight engine. Your business has a shape.",
}

export default function DocumentHead() {
  const location = useLocation()

  useEffect(() => {
    const meta = ROUTE_META[location.pathname] ?? DEFAULT_META
    document.title = meta.title

    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!descTag) {
      descTag = document.createElement("meta")
      descTag.name = "description"
      document.head.appendChild(descTag)
    }
    descTag.content = meta.description

    setOgTag("og:title", meta.title)
    setOgTag("og:description", meta.description)
    setOgTag("og:type", "website")
    setOgTag("og:site_name", "STRATFIT")
    setOgTag("og:url", window.location.href)

    setOgTag("twitter:card", "summary")
    setOgTag("twitter:title", meta.title)
    setOgTag("twitter:description", meta.description)
  }, [location.pathname])

  return null
}

function setOgTag(property: string, content: string) {
  const isOg = property.startsWith("og:")
  const selector = isOg
    ? `meta[property="${property}"]`
    : `meta[name="${property}"]`

  let tag = document.querySelector(selector) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement("meta")
    if (isOg) {
      tag.setAttribute("property", property)
    } else {
      tag.name = property
    }
    document.head.appendChild(tag)
  }
  tag.content = content
}
