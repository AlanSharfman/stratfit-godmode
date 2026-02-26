import { describe, it, expect } from "vitest"
import { UI_NAV_FINGERPRINT, UI_NAV_ITEMS } from "../uiNavContract"

describe("UI NAV CONTRACT (LOCKED)", () => {
  it("has not drifted (fingerprint lock)", () => {
    // If this fails, nav was changed. This is intentional: menu is final.
    expect(UI_NAV_FINGERPRINT).toMatchInlineSnapshot(
      `"${UI_NAV_ITEMS.map((i) => `${i.key}|${i.label}|${i.href}`).join("::")}"`
    )
  })

  it("has unique keys and hrefs", () => {
    const keys = new Set<string>()
    const hrefs = new Set<string>()
    for (const item of UI_NAV_ITEMS) {
      expect(keys.has(item.key)).toBe(false)
      keys.add(item.key)

      expect(hrefs.has(item.href)).toBe(false)
      hrefs.add(item.href)
    }
  })

  it("labels are uppercase (crisp visual rule)", () => {
    for (const item of UI_NAV_ITEMS) {
      expect(item.label).toBe(item.label.toUpperCase())
    }
  })
})
