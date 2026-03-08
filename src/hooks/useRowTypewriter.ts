// src/hooks/useRowTypewriter.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Row-by-Row Typewriter Hook (GOD MODE)
//
// Prints rows one-by-one: each row types char-by-char, pauses, next row.
// rAF-driven for smooth main-thread performance.
// StrictMode-safe: full cleanup on unmount and reset.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from "react"

interface UseRowTypewriterOptions {
  /** Milliseconds per character (default 18) */
  charDelayMs?: number
  /** Pause between rows in ms (default 340) */
  rowPauseMs?: number
  /** Only starts typing when true */
  start?: boolean
  /** Called when all rows have finished */
  onComplete?: () => void
}

interface UseRowTypewriterResult {
  /** Array matching input length — completed rows are full text, current row is partial, future rows are "" */
  renderedRows: string[]
  /** True when all rows have been fully typed */
  isDone: boolean
  /** Reset to beginning */
  reset: () => void
}

export function useRowTypewriter(
  rows: string[],
  opts?: UseRowTypewriterOptions,
): UseRowTypewriterResult {
  const {
    charDelayMs = 18,
    rowPauseMs = 340,
    start = true,
    onComplete,
  } = opts ?? {}

  const [renderedRows, setRenderedRows] = useState<string[]>(() => rows.map(() => ""))
  const [isDone, setIsDone] = useState(false)

  // Stable refs
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  // Typing state refs (avoid state churn)
  const rowIdxRef = useRef(0)
  const charIdxRef = useRef(0)
  const lastTickRef = useRef(0)
  const pausingRef = useRef(false)
  const pauseStartRef = useRef(0)
  const rafRef = useRef(0)
  const doneRef = useRef(false)

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rowIdxRef.current = 0
    charIdxRef.current = 0
    lastTickRef.current = 0
    pausingRef.current = false
    pauseStartRef.current = 0
    doneRef.current = false
    setRenderedRows(rowsRef.current.map(() => ""))
    setIsDone(false)
  }, [])

  useEffect(() => {
    // Reset when rows array changes
    reset()
  }, [rows.length, rows.join("\x00"), reset])

  useEffect(() => {
    if (!start || rows.length === 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    if (doneRef.current) return

    // Reset timing on start
    lastTickRef.current = 0
    pausingRef.current = false

    const tick = (now: number) => {
      if (doneRef.current) return

      const currentRows = rowsRef.current
      const ri = rowIdxRef.current

      // All rows done?
      if (ri >= currentRows.length) {
        doneRef.current = true
        setIsDone(true)
        onCompleteRef.current?.()
        return
      }

      // Inter-row pause
      if (pausingRef.current) {
        if (now - pauseStartRef.current >= rowPauseMs) {
          pausingRef.current = false
          lastTickRef.current = now
        } else {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
      }

      // Init timing
      if (!lastTickRef.current) lastTickRef.current = now

      const elapsed = now - lastTickRef.current
      const currentRow = currentRows[ri]

      if (elapsed >= charDelayMs) {
        const charsToAdd = Math.min(
          Math.floor(elapsed / charDelayMs),
          currentRow.length - charIdxRef.current,
        )
        charIdxRef.current += charsToAdd
        lastTickRef.current = now

        // Update only the current row in rendered output
        setRenderedRows((prev) => {
          const next = [...prev]
          next[ri] = currentRow.slice(0, charIdxRef.current)
          return next
        })

        // Row complete?
        if (charIdxRef.current >= currentRow.length) {
          rowIdxRef.current++
          charIdxRef.current = 0
          lastTickRef.current = 0

          if (rowIdxRef.current >= currentRows.length) {
            // All done
            doneRef.current = true
            setIsDone(true)
            onCompleteRef.current?.()
            return
          }

          // Start inter-row pause
          pausingRef.current = true
          pauseStartRef.current = now
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [start, charDelayMs, rowPauseMs, rows.length])

  return { renderedRows, isDone, reset }
}
