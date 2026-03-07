import React from "react"
import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import TerrainFallback2D from "@/components/terrain/TerrainFallback2D"

describe("TerrainFallback2D", () => {
  it("renders the fallback terrain SVG", () => {
    const html = renderToStaticMarkup(
      <TerrainFallback2D dataPoints={[0.2, 0.4, 0.6, 0.7, 0.5]} />,
    )

    expect(html).toContain("<svg")
    expect(html).toContain("2.5D FALLBACK")
    expect(html).toContain("terrainFallbackGrad")
  })
})
