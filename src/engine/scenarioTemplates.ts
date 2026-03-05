import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"

export interface ScenarioTemplate {
  id: string
  question: string
  category: ScenarioCategory
  forces: Partial<Record<KpiKey, number>>
  description: string
}

export type ScenarioCategory =
  | "capital"
  | "hiring"
  | "pricing"
  | "growth"
  | "efficiency"
  | "market"
  | "risk"

export const SCENARIO_CATEGORIES: { key: ScenarioCategory; label: string; icon: string }[] = [
  { key: "capital", label: "Capital", icon: "💰" },
  { key: "hiring", label: "Hiring", icon: "👥" },
  { key: "pricing", label: "Pricing", icon: "🏷️" },
  { key: "growth", label: "Growth", icon: "📈" },
  { key: "efficiency", label: "Efficiency", icon: "⚡" },
  { key: "market", label: "Market", icon: "🌍" },
  { key: "risk", label: "Risk", icon: "⚠️" },
]

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  // ── Capital ──
  { id: "raise-seed", question: "Raise a $1M seed round", category: "capital", forces: { cash: 1_000_000, burn: 15_000, growth: 5 }, description: "Inject $1M cash, slightly increase burn for growth hiring" },
  { id: "raise-series-a", question: "Raise $5M Series A", category: "capital", forces: { cash: 5_000_000, burn: 80_000, growth: 15 }, description: "Major cash injection with scaling burn rate" },
  { id: "raise-series-b", question: "Raise $15M Series B", category: "capital", forces: { cash: 15_000_000, burn: 200_000, growth: 25 }, description: "Growth-stage funding round" },
  { id: "bridge-round", question: "Close a $500K bridge round", category: "capital", forces: { cash: 500_000 }, description: "Emergency capital with no growth commitment" },
  { id: "revenue-financing", question: "Take on revenue-based financing", category: "capital", forces: { cash: 300_000, burn: 8_000 }, description: "Non-dilutive capital at a monthly cost" },
  { id: "cut-to-profitability", question: "Cut burn to reach profitability", category: "capital", forces: { burn: -50_000, growth: -8 }, description: "Aggressive cost reduction for cash flow positive" },
  { id: "government-grant", question: "Secure a $200K government grant", category: "capital", forces: { cash: 200_000 }, description: "Non-dilutive funding without burn impact" },

  // ── Hiring ──
  { id: "hire-sales-team", question: "Hire 3 sales reps", category: "hiring", forces: { burn: 30_000, growth: 12, revenue: 25_000, headcount: 3 }, description: "Scale sales team for revenue acceleration" },
  { id: "hire-senior-eng", question: "Hire a senior engineer", category: "hiring", forces: { burn: 15_000, headcount: 1 }, description: "Improve product velocity and reliability" },
  { id: "hire-cto", question: "Hire a CTO", category: "hiring", forces: { burn: 22_000, growth: 5, headcount: 1 }, description: "Strategic technical leadership hire" },
  { id: "hire-marketing", question: "Build a marketing team (2 hires)", category: "hiring", forces: { burn: 20_000, growth: 10, headcount: 2 }, description: "Dedicated demand generation capacity" },
  { id: "outsource-dev", question: "Outsource development offshore", category: "hiring", forces: { burn: -10_000 }, description: "Lower cost, potential quality tradeoff" },
  { id: "hire-cs-team", question: "Hire 2 customer success managers", category: "hiring", forces: { burn: 16_000, churn: -3, headcount: 2 }, description: "Reduce churn through dedicated support" },
  { id: "lay-off-20pct", question: "Reduce headcount by 20%", category: "hiring", forces: { burn: -40_000, growth: -10, headcount: -5 }, description: "Significant cost reduction with velocity impact" },

  // ── Pricing ──
  { id: "raise-prices-20", question: "Raise prices by 20%", category: "pricing", forces: { revenue: 15_000, churn: 2, grossMargin: 5 }, description: "Higher ARPU with some churn risk" },
  { id: "lower-prices-15", question: "Lower prices by 15%", category: "pricing", forces: { revenue: -10_000, growth: 8, churn: -2 }, description: "Volume play — sacrifice margin for growth" },
  { id: "freemium-tier", question: "Launch a freemium tier", category: "pricing", forces: { growth: 20, burn: 5_000, churn: 3, grossMargin: -8 }, description: "Massive top-of-funnel with conversion challenge" },
  { id: "annual-plans", question: "Introduce annual pricing (20% discount)", category: "pricing", forces: { cash: 50_000, churn: -4, revenue: -3_000 }, description: "Cash upfront, lower churn, modest revenue reduction" },
  { id: "enterprise-tier", question: "Launch enterprise pricing tier", category: "pricing", forces: { revenue: 30_000, burn: 10_000, grossMargin: 8 }, description: "High-value contracts with longer sales cycle" },
  { id: "usage-based", question: "Switch to usage-based pricing", category: "pricing", forces: { revenue: 10_000, churn: -3, growth: 5 }, description: "Align revenue with customer value delivery" },

  // ── Growth ──
  { id: "product-led-growth", question: "Invest in product-led growth", category: "growth", forces: { burn: 15_000, growth: 18, churn: -2 }, description: "Self-serve onboarding and viral loops" },
  { id: "launch-referral", question: "Launch a referral program", category: "growth", forces: { burn: 3_000, growth: 8 }, description: "Low-cost organic acquisition channel" },
  { id: "double-marketing", question: "Double marketing spend", category: "growth", forces: { burn: 25_000, growth: 15, revenue: 20_000 }, description: "Aggressive demand generation push" },
  { id: "international-expansion", question: "Expand to a new market", category: "growth", forces: { burn: 40_000, growth: 10, revenue: 15_000 }, description: "New geography with setup costs" },
  { id: "strategic-partnership", question: "Sign a strategic distribution partnership", category: "growth", forces: { growth: 12, revenue: 20_000, grossMargin: -3 }, description: "Channel partner with margin share" },
  { id: "content-marketing", question: "Launch content marketing engine", category: "growth", forces: { burn: 8_000, growth: 6 }, description: "SEO-driven long-term growth channel" },
  { id: "paid-acquisition", question: "Scale paid acquisition 3x", category: "growth", forces: { burn: 30_000, growth: 20, grossMargin: -5 }, description: "Rapid growth at higher CAC" },
  { id: "launch-marketplace", question: "Build an integration marketplace", category: "growth", forces: { burn: 20_000, growth: 8, churn: -2 }, description: "Platform ecosystem for stickiness and reach" },

  // ── Efficiency ──
  { id: "automate-ops", question: "Automate manual operations", category: "efficiency", forces: { burn: -12_000 }, description: "Tooling investment to reduce headcount needs" },
  { id: "improve-onboarding", question: "Redesign customer onboarding", category: "efficiency", forces: { burn: 5_000, churn: -4 }, description: "Better first experience reduces early churn" },
  { id: "consolidate-tools", question: "Consolidate SaaS tools", category: "efficiency", forces: { burn: -8_000 }, description: "Reduce tool sprawl and overhead" },
  { id: "implement-ai", question: "Implement AI for customer support", category: "efficiency", forces: { burn: -5_000, churn: -1 }, description: "AI-powered support reduces cost per ticket" },
  { id: "tech-debt", question: "Invest in reducing tech debt", category: "efficiency", forces: { burn: 8_000, growth: -3 }, description: "Short-term velocity hit for long-term gains" },
  { id: "switch-cloud", question: "Migrate to cheaper cloud infrastructure", category: "efficiency", forces: { burn: -15_000, grossMargin: 4 }, description: "Infrastructure cost optimization" },

  // ── Market ──
  { id: "competitor-exits", question: "Major competitor exits the market", category: "market", forces: { growth: 15, revenue: 25_000, churn: -3 }, description: "Market share opportunity from competitor failure" },
  { id: "market-downturn", question: "Economic downturn hits our market", category: "market", forces: { growth: -15, revenue: -20_000, churn: 5 }, description: "Recession pressure on customer budgets" },
  { id: "new-regulation", question: "New regulation requires compliance investment", category: "market", forces: { burn: 15_000 }, description: "Mandatory compliance spend" },
  { id: "viral-moment", question: "Product goes viral on social media", category: "market", forces: { growth: 40, burn: 10_000 }, description: "Unexpected demand spike requiring rapid scaling" },
  { id: "market-expansion", question: "Addressable market doubles due to industry shift", category: "market", forces: { growth: 10, enterpriseValue: 500_000 }, description: "TAM expansion improves long-term outlook" },
  { id: "platform-risk", question: "Key platform changes API terms", category: "market", forces: { growth: -8, burn: 10_000, churn: 3 }, description: "Platform dependency risk materializes" },

  // ── Risk ──
  { id: "key-customer-loss", question: "Lose your largest customer", category: "risk", forces: { revenue: -30_000, arr: -360_000, churn: 5, growth: -5 }, description: "Critical customer concentration risk" },
  { id: "security-breach", question: "Major security breach occurs", category: "risk", forces: { burn: 50_000, churn: 8, growth: -10, revenue: -15_000 }, description: "Trust damage and remediation costs" },
  { id: "cofounder-leaves", question: "Co-founder departs", category: "risk", forces: { growth: -5, burn: -10_000 }, description: "Leadership disruption" },
  { id: "patent-lawsuit", question: "Receive a patent infringement lawsuit", category: "risk", forces: { burn: 30_000, growth: -3 }, description: "Legal costs and management distraction" },
  { id: "supply-disruption", question: "Critical vendor raises prices 40%", category: "risk", forces: { burn: 20_000, grossMargin: -8 }, description: "Supply chain cost shock" },
  { id: "cash-crunch", question: "Fundraising fails — extend runway with current cash", category: "risk", forces: { burn: -30_000, growth: -15 }, description: "Survival mode: cut everything non-essential" },
]

export function getTemplatesByCategory(category: ScenarioCategory): ScenarioTemplate[] {
  return SCENARIO_TEMPLATES.filter((t) => t.category === category)
}

export function getTemplateById(id: string): ScenarioTemplate | undefined {
  return SCENARIO_TEMPLATES.find((t) => t.id === id)
}
