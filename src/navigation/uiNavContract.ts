export const UI_NAV_CONTRACT_VERSION = "v1" as const

export const UI_NAV_ITEMS = [
  { key: "position", label: "POSITION", href: "/position" },
  { key: "studio", label: "STUDIO", href: "/studio" },
  { key: "compare", label: "COMPARE", href: "/compare" },
  { key: "insights", label: "INSIGHTS", href: "/insights" },
  { key: "risk", label: "RISK", href: "/risk" },
  { key: "valuation", label: "VALUATION", href: "/valuation" },
  { key: "assessment", label: "ASSESSMENT", href: "/assessment" },
  { key: "roadmap", label: "ROADMAP", href: "/roadmap" },
  { key: "coming", label: "COMING FEATURES", href: "/coming-features" },
] as const

export type UiNavKey = (typeof UI_NAV_ITEMS)[number]["key"]
export type UiNavItem = (typeof UI_NAV_ITEMS)[number]

/**
 * Hard-locked fingerprint for tests/runtime asserts.
 * If this changes, tests MUST fail unless contract is explicitly unlocked.
 */
export const UI_NAV_FINGERPRINT: string = UI_NAV_ITEMS.map(
  (i) => `${i.key}|${i.label}|${i.href}`,
).join("::")
