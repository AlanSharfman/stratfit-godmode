import React, { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { hasOpenAIKey, synthesizeSpeech } from "@/voice/openaiTTS"

const LS_KEY = "OPENAI_API_KEY"

export default function VoiceSettingsPanel() {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState("")
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    setHasKey(hasOpenAIKey())
    try {
      const stored = localStorage.getItem(LS_KEY) ?? ""
      if (stored) setKey(stored.slice(0, 8) + "..." + stored.slice(-4))
    } catch {}
  }, [open])

  const handleSave = useCallback(() => {
    const trimmed = key.trim()
    if (!trimmed || trimmed.includes("...")) return
    try {
      localStorage.setItem(LS_KEY, trimmed)
      setSaved(true)
      setHasKey(true)
      setTestResult(null)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
  }, [key])

  const handleClear = useCallback(() => {
    try { localStorage.removeItem(LS_KEY) } catch {}
    setKey("")
    setHasKey(false)
    setTestResult(null)
  }, [])

  const handleTest = useCallback(async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await synthesizeSpeech("Voice system online. Ready for intelligence briefing.", { voice: "nova", speed: 1.0 })
      const audio = new Audio(result.url)
      audio.play().catch(() => {})
      audio.onended = () => URL.revokeObjectURL(result.url)
      setTestResult("success")
    } catch {
      setTestResult("error")
    }
    setTesting(false)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Voice Settings"
        style={{
          background: "rgba(200,220,240,0.04)",
          border: `1px solid ${hasKey ? "rgba(52,211,153,0.15)" : "rgba(200,220,240,0.06)"}`,
          borderRadius: 6, padding: "6px 10px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          color: hasKey ? "#34d399" : "rgba(200,220,240,0.4)",
          fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        {hasKey ? "AI Voice" : "Voice"}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.4)" }}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "fixed", top: 60, right: 20, zIndex: 1501,
                width: 360, padding: 20,
                background: "linear-gradient(145deg, rgba(10,18,32,0.98), rgba(12,20,34,0.99))",
                border: "1px solid rgba(34,211,238,0.12)",
                borderRadius: 12,
                boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(34,211,238,0.5)", textTransform: "uppercase", marginBottom: 12 }}>
                Voice Configuration
              </div>

              <div style={{ fontSize: 12, color: "rgba(200,220,240,0.7)", marginBottom: 16, lineHeight: 1.5 }}>
                Enter your OpenAI API key to enable AI voice (Nova) for intelligence briefings and KPI commentary.
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(200,220,240,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setSaved(false) }}
                  placeholder="sk-..."
                  style={{
                    width: "100%", padding: "8px 12px",
                    background: "rgba(0,0,0,0.4)", border: "1px solid rgba(200,220,240,0.1)",
                    borderRadius: 6, color: "rgba(200,220,240,0.8)", fontSize: 12,
                    fontFamily: "monospace", outline: "none",
                  }}
                  onFocus={(e) => {
                    if (e.target.value.includes("...")) setKey("")
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 6,
                    background: saved ? "rgba(52,211,153,0.15)" : "rgba(34,211,238,0.1)",
                    border: `1px solid ${saved ? "rgba(52,211,153,0.3)" : "rgba(34,211,238,0.2)"}`,
                    color: saved ? "#34d399" : "#22d3ee",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    cursor: "pointer", textTransform: "uppercase",
                  }}
                >
                  {saved ? "Saved" : "Save Key"}
                </button>
                <button
                  onClick={handleTest}
                  disabled={!hasKey || testing}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 6,
                    background: "rgba(200,220,240,0.04)",
                    border: "1px solid rgba(200,220,240,0.08)",
                    color: hasKey ? "rgba(200,220,240,0.6)" : "rgba(200,220,240,0.2)",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    cursor: hasKey ? "pointer" : "default", textTransform: "uppercase",
                    opacity: testing ? 0.5 : 1,
                  }}
                >
                  {testing ? "Testing..." : "Test Voice"}
                </button>
                <button
                  onClick={handleClear}
                  style={{
                    padding: "8px 12px", borderRadius: 6,
                    background: "rgba(248,113,113,0.05)",
                    border: "1px solid rgba(248,113,113,0.1)",
                    color: "rgba(248,113,113,0.6)",
                    fontSize: 10, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>

              {testResult === "success" && (
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)", color: "#34d399", fontSize: 10, marginBottom: 12 }}>
                  Voice test successful — Nova AI voice is active.
                </div>
              )}
              {testResult === "error" && (
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#f87171", fontSize: 10, marginBottom: 12 }}>
                  Voice test failed — check your API key and try again.
                </div>
              )}

              <div style={{ fontSize: 9, color: "rgba(200,220,240,0.2)", lineHeight: 1.5 }}>
                Key is stored in your browser's localStorage only. It is never sent to STRATFIT servers.
                Uses OpenAI's TTS-1 model with Nova voice at 0.95x speed.
              </div>

              {/* Status */}
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 6,
                background: hasKey ? "rgba(52,211,153,0.04)" : "rgba(200,220,240,0.02)",
                border: `1px solid ${hasKey ? "rgba(52,211,153,0.08)" : "rgba(200,220,240,0.04)"}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: hasKey ? "#34d399" : "rgba(200,220,240,0.2)",
                  boxShadow: hasKey ? "0 0 8px rgba(52,211,153,0.4)" : "none",
                }} />
                <span style={{ fontSize: 10, color: hasKey ? "#34d399" : "rgba(200,220,240,0.3)", fontWeight: 600 }}>
                  {hasKey ? "OpenAI Voice Active" : "Using Browser Voice (fallback)"}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
