import { useEffect } from "react"

export default function useRenderWatchdog() {
  useEffect(() => {
    if (import.meta.env.PROD) return

    let frameCount = 0
    let last = performance.now()

    const loop = () => {
      frameCount++
      const now = performance.now()

      if (now - last >= 2000) {
        if (frameCount < 10) {
          console.warn("[STRATFIT] Low frame activity detected")
        }
        frameCount = 0
        last = now
      }

      requestAnimationFrame(loop)
    }

    const id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
}
