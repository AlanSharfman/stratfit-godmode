import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useCollaborationStore } from "@/engine/collaboration"

export default function CollaborationPanel() {
  const [open, setOpen] = useState(false)
  const [nameInput, setNameInput] = useState("")

  const isConnected = useCollaborationStore((s) => s.isConnected)
  const participants = useCollaborationStore((s) => s.participants)
  const sessionId = useCollaborationStore((s) => s.sessionId)
  const startSession = useCollaborationStore((s) => s.startSession)
  const endSession = useCollaborationStore((s) => s.endSession)
  const events = useCollaborationStore((s) => s.events)

  const participantList = Array.from(participants.values())
  const recentEvents = events.slice(-5).reverse()

  return (
    <div style={{ position: "fixed", bottom: 80, right: 24, zIndex: 1500, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 40, height: 40, borderRadius: "50%",
          background: isConnected ? "rgba(52,211,153,0.15)" : "rgba(200,220,240,0.05)",
          border: `1px solid ${isConnected ? "rgba(52,211,153,0.3)" : "rgba(200,220,240,0.1)"}`,
          color: isConnected ? "#34d399" : "rgba(200,220,240,0.3)",
          fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}
      >
        {isConnected && (
          <span style={{
            position: "absolute", top: -2, right: -2,
            width: 12, height: 12, borderRadius: "50%",
            background: "#34d399", border: "2px solid #0B1520",
            fontSize: 7, color: "#000", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {participantList.length}
          </span>
        )}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", bottom: 50, right: 0,
              width: 280,
              background: "linear-gradient(135deg, rgba(10,18,32,0.98), rgba(6,14,28,0.99))",
              border: "1px solid rgba(34,211,238,0.12)",
              borderRadius: 12, overflow: "hidden",
              boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.5)" }}>
                Collaboration
              </div>
            </div>

            <div style={{ padding: 16 }}>
              {!isConnected ? (
                <div>
                  <div style={{ fontSize: 12, color: "rgba(200,220,240,0.5)", marginBottom: 12, lineHeight: 1.5 }}>
                    Start a shared session. Open this page in another tab to collaborate in real-time.
                  </div>
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && nameInput.trim() && startSession(nameInput.trim())}
                    placeholder="Your name..."
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 6,
                      background: "rgba(200,220,240,0.04)", border: "1px solid rgba(200,220,240,0.08)",
                      color: "rgba(200,220,240,0.8)", fontSize: 12,
                      fontFamily: "'Inter', system-ui, sans-serif", outline: "none",
                      marginBottom: 8, boxSizing: "border-box",
                    }}
                  />
                  <button
                    onClick={() => nameInput.trim() && startSession(nameInput.trim())}
                    disabled={!nameInput.trim()}
                    style={{
                      width: "100%", padding: "8px 14px", borderRadius: 6,
                      background: nameInput.trim() ? "rgba(52,211,153,0.1)" : "rgba(200,220,240,0.03)",
                      border: `1px solid ${nameInput.trim() ? "rgba(52,211,153,0.2)" : "rgba(200,220,240,0.06)"}`,
                      color: nameInput.trim() ? "#34d399" : "rgba(200,220,240,0.2)",
                      fontSize: 11, fontWeight: 600, cursor: nameInput.trim() ? "pointer" : "default",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Start Session
                  </button>
                </div>
              ) : (
                <div>
                  {/* Session info */}
                  <div style={{ marginBottom: 12, padding: "8px 10px", borderRadius: 6, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.08)" }}>
                    <div style={{ fontSize: 9, color: "rgba(52,211,153,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Session Active</div>
                    <div style={{ fontSize: 10, color: "rgba(200,220,240,0.3)", marginTop: 2, fontFamily: "ui-monospace, monospace" }}>{sessionId}</div>
                  </div>

                  {/* Participants */}
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(200,220,240,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
                    Participants ({participantList.length})
                  </div>
                  {participantList.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "rgba(200,220,240,0.7)", flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: 9, color: "rgba(200,220,240,0.2)" }}>{p.currentPage}</span>
                    </div>
                  ))}

                  {/* Recent activity */}
                  {recentEvents.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(200,220,240,0.3)", textTransform: "uppercase", marginBottom: 6 }}>Activity</div>
                      {recentEvents.map((e, i) => (
                        <div key={i} style={{ fontSize: 9, color: "rgba(200,220,240,0.2)", padding: "3px 0" }}>
                          {e.type.replace(/_/g, " ")}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* End session */}
                  <button
                    onClick={endSession}
                    style={{
                      width: "100%", marginTop: 12, padding: "8px 14px", borderRadius: 6,
                      background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)",
                      color: "rgba(248,113,113,0.6)", fontSize: 10, fontWeight: 600,
                      cursor: "pointer", letterSpacing: "0.06em",
                    }}
                  >
                    End Session
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
