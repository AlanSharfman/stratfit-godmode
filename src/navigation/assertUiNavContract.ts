import { UI_NAV_FINGERPRINT, UI_NAV_ITEMS } from "./uiNavContract"

const EXPECTED_FINGERPRINT = UI_NAV_FINGERPRINT

export function assertUiNavContract() {
  // Key uniqueness
  const keys = new Set<string>()
  for (const item of UI_NAV_ITEMS) {
    if (keys.has(item.key))
      throw new Error(`[UI_NAV_CONTRACT] Duplicate nav key: ${item.key}`)
    keys.add(item.key)
  }

  // Href uniqueness
  const hrefs = new Set<string>()
  for (const item of UI_NAV_ITEMS) {
    if (hrefs.has(item.href))
      throw new Error(`[UI_NAV_CONTRACT] Duplicate href: ${item.href}`)
    hrefs.add(item.href)
  }

  // Fingerprint lock
  const actual = UI_NAV_ITEMS.map(
    (i) => `${i.key}|${i.label}|${i.href}`,
  ).join("::")
  if (actual !== EXPECTED_FINGERPRINT) {
    throw new Error(
      `[UI_NAV_CONTRACT] NAV DRIFT DETECTED.\n` +
        `Expected:\n${EXPECTED_FINGERPRINT}\n\nActual:\n${actual}\n\n` +
        `If you intended to change nav, you must explicitly UNLOCK NAV CONTRACT.`,
    )
  }
}
