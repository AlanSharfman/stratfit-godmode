export type Confidence = "low" | "medium" | "high"

export type MarkerAIInsight = {
  summary: string
  whyItMatters: string
  driver: string
  recommendation: string
  confidence: Confidence
}

export type AnchorKey = "now" | "constraint" | "stability" | "target" | "cliff"

export type AnchorDef = {
  key: AnchorKey
  label: string
}

export const POSITION_ANCHORS: AnchorDef[] = [
  { key: "now",        label: "NOW" },
  { key: "constraint", label: "CONSTRAINT" },
  { key: "stability",  label: "STABILITY" },
  { key: "target",     label: "TARGET" },
  { key: "cliff",      label: "CLIFF" },
]

export type NarrativeSelection = {
  mode: "anchor" | "marker"
  title: string
  markerId?: string
  anchorKey?: AnchorKey
  insight?: MarkerAIInsight
}

/** @deprecated use createAnchorInsights().now instead */
export function defaultAnchorSelection(): NarrativeSelection {
  return {
    mode: "anchor",
    title: "NOW — Current Position",
    insight: {
      summary: "Baseline reality view across finance, ops, and strategy.",
      whyItMatters:
        "This page is the reference state. Everything in Studio compares against this terrain and these signals.",
      driver: "Current operating profile + constraints.",
      recommendation: "Identify the first constraint and choose one lever to move it.",
      confidence: "high",
    },
  }
}

export function createDefaultInsights(): Record<string, MarkerAIInsight> {
  return {
    "m-runway": {
      summary: "Runway is the first hard boundary if current burn persists.",
      whyItMatters:
        "If the trajectory remains unchanged, decision freedom compresses quickly and choices become reactive.",
      driver: "Net burn + cash buffer + collections volatility.",
      recommendation: "Stabilise burn and tighten cash conversion before scaling spend.",
      confidence: "medium",
    },
    "m-breakeven": {
      summary: "Breakeven is reachable, but requires disciplined execution sequencing.",
      whyItMatters:
        "Breakeven shifts the terrain from survival to optionality (funding becomes strategic, not urgent).",
      driver: "Margin profile + operating leverage + delivery capacity.",
      recommendation: "Protect gross margin and enforce cost-to-serve discipline.",
      confidence: "medium",
    },
    "m-constraint": {
      summary: "CAC is approaching a ceiling where growth becomes inefficient.",
      whyItMatters:
        "Once acquisition efficiency breaks, the model requires either price/margin improvement or channel change.",
      driver: "Paid channel saturation + conversion efficiency + payback drift.",
      recommendation: "Rebalance channels and tighten payback targets.",
      confidence: "low",
    },
    "m-opportunity": {
      summary: "Expansion is the cleanest upside path if retention stays strong.",
      whyItMatters:
        "Expansion lifts ARR without the same CAC burden, improving both runway and valuation sensitivity.",
      driver: "NRR + product attach + pricing architecture.",
      recommendation: "Prioritise expansion levers with low implementation friction.",
      confidence: "medium",
    },
    "m-signal": {
      summary: "A risk signal indicates instability in one underlying driver.",
      whyItMatters:
        "Small instability early becomes nonlinear later; the path becomes steeper and more volatile.",
      driver: "Volatility in conversion, churn, or operating cost drift.",
      recommendation: "Pinpoint the driver and set a guardrail metric for 30 days.",
      confidence: "low",
    },
  }
}

export function createAnchorInsights(): Record<AnchorKey, MarkerAIInsight> {
  return {
    now: {
      summary: "Baseline reality view across finance, ops, and strategy.",
      whyItMatters:
        "This is the reference state. Studio and Scenarios compare against this terrain and these signals.",
      driver: "Current operating profile + constraints.",
      recommendation: "Identify the first constraint and choose one lever to move it.",
      confidence: "high",
    },
    constraint: {
      summary: "The first binding constraint defines your next 90 days.",
      whyItMatters:
        "Until the first constraint is relieved, other improvements have diminishing returns.",
      driver: "Usually liquidity, CAC efficiency, or delivery capacity.",
      recommendation: "Move one constraint with one disciplined intervention sequence.",
      confidence: "medium",
    },
    stability: {
      summary: "Stability is where volatility compresses and decisions become repeatable.",
      whyItMatters:
        "Once stable, you can scale with fewer surprises and less emergency capital pressure.",
      driver: "Guardrails: churn, margin, cash conversion, delivery tempo.",
      recommendation: "Set explicit guardrails and enforce weekly variance control.",
      confidence: "medium",
    },
    target: {
      summary: "Target gate aligns the trajectory to objectives (growth, margin, or survival).",
      whyItMatters:
        "Targets without gating become wishful thinking; gating turns them into execution checkpoints.",
      driver: "Objective clarity + measurable leading indicators.",
      recommendation: "Define 2–3 lead KPIs that must improve before scaling spend.",
      confidence: "medium",
    },
    cliff: {
      summary: "Cliff is the failure boundary if risk compounds unchecked.",
      whyItMatters:
        "Approaching the cliff forces unfavourable choices (down rounds, cuts, or stalled growth).",
      driver: "Runway compression + volatility + dependency risk.",
      recommendation: "Reduce volatility first; then reduce burn; then re-accelerate.",
      confidence: "low",
    },
  }
}
