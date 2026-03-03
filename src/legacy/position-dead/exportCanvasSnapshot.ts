export function exportCanvasSnapshot(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    console.warn("[STRATFIT] Snapshot export failed: canvas not available")
    return
  }

  try {
    const dataUrl = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .replace("Z", "")
    a.href = dataUrl
    a.download = `stratfit_position_snapshot_${ts}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch (e) {
    console.warn("[STRATFIT] Snapshot export failed", e)
  }
}
