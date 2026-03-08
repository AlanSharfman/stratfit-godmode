import React, { useCallback, useRef, useState } from "react"
import type { ScenarioTemplate, ScenarioCategory } from "@/engine/scenarioTemplates"
import { SCENARIO_TEMPLATES } from "@/engine/scenarioTemplates"
import styles from "./StrategicMoveConsole.module.css"

const PROMPT_ASSIST: { category: ScenarioCategory; label: string; example: string }[] = [
  { category: "hiring", label: "Hiring", example: "Increase sales headcount by 6" },
  { category: "pricing", label: "Pricing", example: "Raise product pricing by 8%" },
  { category: "efficiency", label: "Efficiency", example: "Reduce burn by 15%" },
  { category: "growth", label: "Growth", example: "Enter the US market with a $1M launch" },
  { category: "capital", label: "Capital", example: "Raise a $5M Series A round" },
  { category: "risk", label: "Risk", example: "What if we lose our largest customer?" },
]

interface StrategicMoveConsoleProps {
  query: string
  onQueryChange: (q: string) => void
  onSubmit: () => void
  onSelectTemplate: (template: ScenarioTemplate) => void
  /** True while an AI API call is in progress */
  loading?: boolean
  /** True while the canonical runSimulation() is executing */
  simRunning?: boolean
  hasStack?: boolean
  onSave?: () => void
  onClear?: () => void
  onBrowse?: () => void
  stackCount?: number
}

export default function StrategicMoveConsole({
  query,
  onQueryChange,
  onSubmit,
  onSelectTemplate,
  loading = false,
  simRunning = false,
  hasStack = false,
  onSave,
  onClear,
  onBrowse,
  stackCount = 0,
}: StrategicMoveConsoleProps) {
  const isBusy = loading || simRunning
  const btnLabel = simRunning ? "Running…" : loading ? "Analysing…" : "Run Scenario"
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = React.useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return SCENARIO_TEMPLATES
      .filter((t) => t.question.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.includes(q))
      .slice(0, 6)
  }, [query])

  const handlePillClick = useCallback((pill: typeof PROMPT_ASSIST[number]) => {
    onQueryChange(pill.example)
    inputRef.current?.focus()
  }, [onQueryChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSubmit()
  }, [onSubmit])

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Scenario Command</span>
      </div>

      <div className={styles.inputRow} style={{ position: "relative" }}>
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          onChange={(e) => { onQueryChange(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="What strategic move do you want to simulate?"
        />
        <button
          className={styles.runBtn}
          onClick={onSubmit}
          disabled={!query.trim() || isBusy}
        >
          {btnLabel}
        </button>

        {showSuggestions && suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestions.map((t) => (
              <div
                key={t.id}
                className={styles.suggestionItem}
                onMouseDown={() => { onSelectTemplate(t); setShowSuggestions(false) }}
              >
                <div className={styles.suggestionQuestion}>{t.question}</div>
                <div className={styles.suggestionMeta}>{t.category} · {t.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.pillRow}>
        <span className={styles.pillLabel}>Quick scenarios</span>
        {PROMPT_ASSIST.map((pill) => (
          <button
            key={pill.category}
            className={styles.pill}
            onClick={() => handlePillClick(pill)}
          >
            {pill.label}
          </button>
        ))}
        {hasStack && (
          <>
            <span style={{ flex: 1 }} />
            {onSave && (
              <button className={styles.pill} onClick={onSave} style={{ borderColor: "rgba(52,211,153,0.15)", color: "rgba(52,211,153,0.6)" }}>
                Save
              </button>
            )}
            {onClear && (
              <button className={styles.pill} onClick={onClear} style={{ borderColor: "rgba(110,91,255,0.20)", color: "rgba(110,91,255,0.65)" }}>
                Clear ({stackCount})
              </button>
            )}
            {onBrowse && (
              <button className={styles.pill} onClick={onBrowse} style={{ borderColor: "rgba(167,139,250,0.15)", color: "rgba(167,139,250,0.6)" }}>
                Browse
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
