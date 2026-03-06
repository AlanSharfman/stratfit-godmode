// src/utils/terrainScreenshot.ts
// STRATFIT — Terrain Screenshot & Social Share (9A)
// Captures the active terrain canvas as a branded PNG.

const WATERMARK_HEIGHT = 40
const WATERMARK_BG = "rgba(12, 20, 34, 0.85)"
const BRAND_COLOR = "#22d3ee"
const FONT = "600 11px 'Inter', system-ui, sans-serif"

function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const y = height - WATERMARK_HEIGHT
  ctx.fillStyle = WATERMARK_BG
  ctx.fillRect(0, y, width, WATERMARK_HEIGHT)

  ctx.fillStyle = "rgba(255,255,255,0.06)"
  ctx.fillRect(0, y, width, 1)

  ctx.font = "700 12px 'Inter', system-ui, sans-serif"
  ctx.fillStyle = BRAND_COLOR
  ctx.textBaseline = "middle"
  ctx.fillText("STRATFIT", 16, y + WATERMARK_HEIGHT / 2)

  ctx.font = FONT
  ctx.fillStyle = "rgba(200, 220, 240, 0.5)"
  ctx.fillText("Business Physics Engine", 90, y + WATERMARK_HEIGHT / 2)

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  ctx.font = "500 10px 'Inter', system-ui, sans-serif"
  ctx.fillStyle = "rgba(200, 220, 240, 0.3)"
  ctx.textAlign = "right"
  ctx.fillText(dateStr, width - 16, y + WATERMARK_HEIGHT / 2)
  ctx.textAlign = "left"
}

function findTerrainCanvas(): HTMLCanvasElement | null {
  const canvases = document.querySelectorAll("canvas")
  for (const c of canvases) {
    if (c.width > 100 && c.height > 100) return c
  }
  return null
}

export async function captureTerrainPng(): Promise<Blob | null> {
  const sourceCanvas = findTerrainCanvas()
  if (!sourceCanvas) return null

  const w = sourceCanvas.width
  const h = sourceCanvas.height + WATERMARK_HEIGHT

  const offscreen = document.createElement("canvas")
  offscreen.width = w
  offscreen.height = h
  const ctx = offscreen.getContext("2d")
  if (!ctx) return null

  ctx.fillStyle = "#0B1520"
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(sourceCanvas, 0, 0)
  drawWatermark(ctx, w, h - 0)

  return new Promise<Blob | null>((resolve) => {
    offscreen.toBlob((blob) => resolve(blob), "image/png")
  })
}

export async function downloadTerrainPng(filename = "stratfit-terrain.png") {
  const blob = await captureTerrainPng()
  if (!blob) return false

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return true
}

export async function copyTerrainToClipboard(): Promise<boolean> {
  const blob = await captureTerrainPng()
  if (!blob) return false

  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ])
    return true
  } catch {
    return false
  }
}
