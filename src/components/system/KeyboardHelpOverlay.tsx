import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], desc: "Command Palette" },
  { keys: ["Alt", "1–0"], desc: "Navigate to page (Position → Pulse)" },
  { keys: ["M"], desc: "Toggle Mentor Mode" },
  { keys: ["?"], desc: "Toggle this help" },
  { keys: ["Esc"], desc: "Close any open panel" },
]

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function KeyboardHelpOverlay() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onToggle() { setOpen((o) => !o) }
    function onEscape() { setOpen(false) }
    window.addEventListener("stratfit:toggle-help", onToggle)
    window.addEventListener("stratfit:escape", onEscape)
    return () => {
      window.removeEventListener("stratfit:toggle-help", onToggle)
      window.removeEventListener("stratfit:escape", onEscape)
    }
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 2500,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400, zIndex: 2501,
              background: "linear-gradient(135deg, rgba(10,18,32,0.98), rgba(6,14,28,0.99))",
              border: "1px solid rgba(34,211,238,0.15)",
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <div style={{
              padding: "16px 20px 12px",
              borderBottom: "1px solid rgba(34,211,238,0.08)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(200,220,240,0.8)", letterSpacing: "0.04em" }}>
                Keyboard Shortcuts
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none", border: "none", color: "rgba(200,220,240,0.3)",
                  fontSize: 14, cursor: "pointer", padding: "2px 6px",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "12px 20px 20px" }}>
              {SHORTCUTS.map(({ keys, desc }) => (
                <div
                  key={desc}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(200,220,240,0.03)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "rgba(200,220,240,0.6)" }}>{desc}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        style={{
                          padding: "3px 8px", borderRadius: 4,
                          background: "rgba(200,220,240,0.04)",
                          border: "1px solid rgba(200,220,240,0.1)",
                          fontSize: 10, fontFamily: "ui-monospace, monospace",
                          color: "rgba(200,220,240,0.5)", fontWeight: 500,
                        }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              padding: "8px 20px 12px",
              fontSize: 9, color: "rgba(200,220,240,0.15)",
              textAlign: "center",
            }}>
              Press ? to toggle this overlay
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
