// src/components/terrain/TerrainShareButton.tsx
// STRATFIT — Terrain Screenshot & Share UI (9A)

import React, { useCallback, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { downloadTerrainPng, copyTerrainToClipboard } from "@/utils/terrainScreenshot"

type Status = "idle" | "capturing" | "copied" | "downloaded" | "error"

export default function TerrainShareButton() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const flash = useCallback((s: Status) => {
    setStatus(s)
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => setStatus("idle"), 2200)
  }, [])

  const handleCopy = useCallback(async () => {
    setStatus("capturing")
    const ok = await copyTerrainToClipboard()
    flash(ok ? "copied" : "error")
  }, [flash])

  const handleDownload = useCallback(async () => {
    setStatus("capturing")
    const ok = await downloadTerrainPng()
    flash(ok ? "downloaded" : "error")
  }, [flash])

  return (
    <div style={S.wrapper}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={S.trigger}
        title="Share terrain"
        aria-label="Share terrain"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={S.menu}
          >
            <button type="button" onClick={handleCopy} style={S.menuItem} disabled={status === "capturing"}>
              <span style={S.menuIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </span>
              Copy to clipboard
            </button>
            <button type="button" onClick={handleDownload} style={S.menuItem} disabled={status === "capturing"}>
              <span style={S.menuIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </span>
              Download PNG
            </button>

            <AnimatePresence>
              {status !== "idle" && status !== "capturing" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={S.feedback}
                >
                  {status === "copied" && "Copied to clipboard"}
                  {status === "downloaded" && "Saved to downloads"}
                  {status === "error" && "Failed — try download instead"}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const CYAN = "rgba(34, 211, 238, 0.85)"
const FONT = "'Inter', system-ui, sans-serif"

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    zIndex: 30,
  },
  trigger: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid rgba(34,211,238,0.15)",
    background: "rgba(12, 20, 34, 0.7)",
    backdropFilter: "blur(12px)",
    color: CYAN,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
  },
  menu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    minWidth: 180,
    background: "rgba(10, 15, 25, 0.95)",
    border: "1px solid rgba(34,211,238,0.12)",
    borderRadius: 10,
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    padding: "4px",
    fontFamily: FONT,
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 12px",
    border: "none",
    borderRadius: 7,
    background: "transparent",
    color: "rgba(200, 220, 240, 0.8)",
    fontSize: 12,
    fontWeight: 500,
    fontFamily: FONT,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  menuIcon: {
    display: "flex",
    alignItems: "center",
    color: "rgba(34,211,238,0.6)",
  },
  feedback: {
    padding: "6px 12px",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: "rgba(40,255,190,0.9)",
    textAlign: "center" as const,
    overflow: "hidden",
  },
}
