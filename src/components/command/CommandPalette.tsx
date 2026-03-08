import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ROUTES } from "@/routes/routeContract"
import { SCENARIO_TEMPLATES } from "@/engine/scenarioTemplates"

interface CommandItem {
  id: string
  label: string
  description: string
  category: "navigate" | "scenario" | "action"
  handler: () => void
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const navItems: CommandItem[] = useMemo(() => [
    { id: "nav-position", label: "Position", description: "View your business terrain", category: "navigate", handler: () => navigate(ROUTES.POSITION) },
    { id: "nav-whatif", label: "What If", description: "Ask your mountain a question", category: "navigate", handler: () => navigate(ROUTES.WHAT_IF) },
    { id: "nav-actions", label: "Actions", description: "Highest leverage moves", category: "navigate", handler: () => navigate(ROUTES.ACTIONS) },
    { id: "nav-timeline", label: "Timeline", description: "12-month projection", category: "navigate", handler: () => navigate(ROUTES.TIMELINE) },
    { id: "nav-risk", label: "Risk", description: "Risk decomposition & stress test", category: "navigate", handler: () => navigate(ROUTES.RISK) },
    { id: "nav-compare", label: "Compare", description: "Side-by-side terrain comparison", category: "navigate", handler: () => navigate(ROUTES.COMPARE) },
    { id: "nav-studio", label: "Studio", description: "Manual force builder", category: "navigate", handler: () => navigate(ROUTES.STUDIO) },
    { id: "nav-valuation", label: "Valuation", description: "Enterprise value & funding readiness", category: "navigate", handler: () => navigate(ROUTES.VALUATION) },
    { id: "nav-boardroom", label: "Boardroom", description: "Board pack & executive report", category: "navigate", handler: () => navigate(ROUTES.BOARDROOM) },
    { id: "nav-pulse", label: "Pulse", description: "Weekly terrain digest", category: "navigate", handler: () => navigate(ROUTES.PULSE) },
    { id: "nav-initiate", label: "Initiate", description: "Set up or edit your baseline", category: "navigate", handler: () => navigate(ROUTES.INITIATE) },
  ], [navigate])

  const scenarioItems: CommandItem[] = useMemo(() =>
    SCENARIO_TEMPLATES.slice(0, 20).map((t) => ({
      id: `scenario-${t.id}`,
      label: t.question,
      description: `${t.category} · ${t.description}`,
      category: "scenario" as const,
      handler: () => navigate(ROUTES.WHAT_IF),
    }))
  , [navigate])

  const allItems = useMemo(() => [...navItems, ...scenarioItems], [navItems, scenarioItems])

  const filtered = useMemo(() => {
    if (!query.trim()) return navItems
    const q = query.toLowerCase()
    return allItems
      .filter((item) => item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q))
      .slice(0, 10)
  }, [query, navItems, allItems])

  useEffect(() => { setSelectedIdx(0) }, [filtered])

  const execute = useCallback((item: CommandItem) => {
    item.handler()
    setOpen(false)
    setQuery("")
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape" && open) {
        setOpen(false)
        setQuery("")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === "Enter" && filtered[selectedIdx]) { execute(filtered[selectedIdx]) }
  }, [filtered, selectedIdx, execute])

  const categoryColors = { navigate: "rgba(34,211,238,0.6)", scenario: "rgba(168,85,247,0.6)", action: "rgba(52,211,153,0.6)" }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => { setOpen(false); setQuery("") }}
            style={{
              position: "fixed", inset: 0, zIndex: 2000,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            }}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={{
              position: "fixed", top: "18%", left: "50%", transform: "translateX(-50%)",
              width: 520, maxHeight: 440,
              background: "linear-gradient(135deg, rgba(10,18,32,0.98) 0%, rgba(6,14,28,0.99) 100%)",
              border: "1px solid rgba(34,211,238,0.15)",
              borderRadius: 14,
              boxShadow: "0 16px 64px rgba(0,0,0,0.7), 0 0 48px rgba(34,211,238,0.05)",
              zIndex: 2001, display: "flex", flexDirection: "column",
              overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {/* Input */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(34,211,238,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "rgba(34,211,238,0.4)", fontSize: 14, flexShrink: 0 }}>⌘</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Navigate, search scenarios, ask..."
                style={{
                  flex: 1, background: "none", border: "none",
                  color: "rgba(200,220,240,0.9)", fontSize: 14,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 9, color: "rgba(200,220,240,0.2)", padding: "2px 6px", border: "1px solid rgba(200,220,240,0.08)", borderRadius: 4 }}>ESC</span>
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "24px 18px", color: "rgba(200,220,240,0.25)", fontSize: 13, textAlign: "center" }}>
                  No results found
                </div>
              ) : (
                filtered.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    style={{
                      padding: "10px 18px", cursor: "pointer",
                      background: i === selectedIdx ? "rgba(34,211,238,0.06)" : "transparent",
                      display: "flex", alignItems: "center", gap: 12,
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: categoryColors[item.category],
                      minWidth: 48,
                    }}>
                      {item.category === "navigate" ? "Go to" : item.category === "scenario" ? "Ask" : "Run"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: i === selectedIdx ? "rgba(200,220,240,0.95)" : "rgba(200,220,240,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(200,220,240,0.25)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.description}
                      </div>
                    </div>
                    {i === selectedIdx && (
                      <span style={{ fontSize: 10, color: "rgba(34,211,238,0.4)" }}>↵</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "8px 18px", borderTop: "1px solid rgba(34,211,238,0.06)",
              display: "flex", justifyContent: "space-between",
              fontSize: 9, color: "rgba(200,220,240,0.15)",
            }}>
              <span>↑↓ navigate · ↵ select · esc close</span>
              <span>Ctrl+K</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
