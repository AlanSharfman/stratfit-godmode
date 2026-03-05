import React, { useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { exportKpisCSV, exportKpisJSON, exportAsCSV, copyToClipboard } from "@/engine/dataExport"

interface ExportMenuProps {
  kpis: PositionKpis | null
}

export default function ExportMenu({ kpis }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCSV = useCallback(() => {
    if (!kpis) return
    exportKpisCSV(kpis)
    setOpen(false)
  }, [kpis])

  const handleJSON = useCallback(() => {
    if (!kpis) return
    exportKpisJSON(kpis)
    setOpen(false)
  }, [kpis])

  const handleClipboard = useCallback(async () => {
    if (!kpis) return
    const csv = exportAsCSV(kpis)
    const ok = await copyToClipboard(csv)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    setOpen(false)
  }, [kpis])

  if (!kpis) return null

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "6px 12px", borderRadius: 6,
          background: "rgba(200,220,240,0.03)",
          border: "1px solid rgba(200,220,240,0.08)",
          color: "rgba(200,220,240,0.4)", fontSize: 10,
          fontWeight: 600, cursor: "pointer",
          fontFamily: "'Inter', system-ui, sans-serif",
          letterSpacing: "0.04em",
        }}
      >
        {copied ? "Copied!" : "Export"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0,
              width: 180, zIndex: 100,
              background: "linear-gradient(135deg, rgba(10,18,32,0.98), rgba(6,14,28,0.99))",
              border: "1px solid rgba(34,211,238,0.12)",
              borderRadius: 8, overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <div style={{ padding: "6px 10px 4px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(34,211,238,0.4)", textTransform: "uppercase" }}>
              Export Data
            </div>
            {[
              { label: "Download CSV", action: handleCSV },
              { label: "Download JSON", action: handleJSON },
              { label: "Copy to Clipboard", action: handleClipboard },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  display: "block", width: "100%", padding: "9px 12px",
                  background: "transparent", border: "none", textAlign: "left",
                  color: "rgba(200,220,240,0.6)", fontSize: 11, cursor: "pointer",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(34,211,238,0.06)" }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent" }}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
