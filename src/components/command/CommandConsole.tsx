import React, { memo, useCallback, useRef, useState } from "react"

const EXAMPLE_COMMANDS = [
  "Hire CTO",
  "Raise prices 15%",
  "Cut burn 20%",
  "Raise funding",
  "Improve liquidity",
]

interface Props {
  onSubmit: (command: string) => void
  loading?: boolean
}

const CommandConsole: React.FC<Props> = memo(({ onSubmit, loading }) => {
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setValue("")
  }, [value, loading, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const handleExampleClick = useCallback(
    (cmd: string) => {
      setValue(cmd)
      inputRef.current?.focus()
    },
    [],
  )

  return (
    <div style={S.root}>
      <div style={{ ...S.console, ...(focused ? S.consoleFocused : {}) }}>
        {/* Input row */}
        <div style={S.inputRow}>
          <span style={S.promptIcon}>▸</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Test a decision or ask a strategic question…"
            style={S.input}
            disabled={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || loading}
            style={{
              ...S.runBtn,
              opacity: value.trim() && !loading ? 1 : 0.35,
              cursor: value.trim() && !loading ? "pointer" : "default",
            }}
          >
            {loading ? "Running…" : "Run"}
          </button>
        </div>

        {/* Example commands */}
        <div style={S.examplesRow}>
          <span style={S.examplesLabel}>Try:</span>
          {EXAMPLE_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleExampleClick(cmd)}
              style={S.exampleChip}
              onMouseEnter={(e) => {
                ;(e.currentTarget.style.background = "rgba(34,211,238,0.10)")
                ;(e.currentTarget.style.borderColor = "rgba(34,211,238,0.25)")
                ;(e.currentTarget.style.color = "rgba(34,211,238,0.9)")
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget.style.background = "rgba(34,211,238,0.03)")
                ;(e.currentTarget.style.borderColor = "rgba(34,211,238,0.10)")
                ;(e.currentTarget.style.color = "rgba(200,220,240,0.45)")
              }}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

CommandConsole.displayName = "CommandConsole"
export default CommandConsole

/* ═══════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"

const S: Record<string, React.CSSProperties> = {
  root: {
    position: "fixed",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 900,
    pointerEvents: "auto",
  },

  console: {
    width: 600,
    background:
      "linear-gradient(135deg, rgba(10,18,32,0.88) 0%, rgba(6,14,28,0.92) 100%)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(34,211,238,0.12)",
    borderRadius: 14,
    boxShadow:
      "0 8px 40px rgba(0,0,0,0.55), 0 0 32px rgba(34,211,238,0.04)",
    padding: "10px 16px 8px",
    fontFamily: FONT,
    transition: "border-color 250ms ease, box-shadow 250ms ease",
  },

  consoleFocused: {
    borderColor: "rgba(34,211,238,0.28)",
    boxShadow:
      "0 8px 40px rgba(0,0,0,0.55), 0 0 48px rgba(34,211,238,0.08)",
  },

  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  promptIcon: {
    color: "rgba(34,211,238,0.45)",
    fontSize: 14,
    flexShrink: 0,
    userSelect: "none" as const,
  },

  input: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "rgba(200,220,240,0.9)",
    fontSize: 13,
    fontFamily: FONT,
    letterSpacing: "0.01em",
    lineHeight: "20px",
    padding: "6px 0",
  },

  runBtn: {
    flexShrink: 0,
    padding: "5px 16px",
    borderRadius: 7,
    border: "1px solid rgba(34,211,238,0.20)",
    background: "rgba(34,211,238,0.08)",
    color: "rgba(34,211,238,0.85)",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: FONT,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    transition: "background 180ms ease, opacity 180ms ease",
  },

  examplesRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap" as const,
  },

  examplesLabel: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "rgba(200,220,240,0.2)",
    marginRight: 2,
    userSelect: "none" as const,
  },

  exampleChip: {
    padding: "3px 10px",
    borderRadius: 5,
    border: "1px solid rgba(34,211,238,0.10)",
    background: "rgba(34,211,238,0.03)",
    color: "rgba(200,220,240,0.45)",
    fontSize: 10,
    fontFamily: FONT,
    cursor: "pointer",
    transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
    lineHeight: "16px",
  },
}
