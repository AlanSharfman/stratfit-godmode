// src/components/scenarios/ScenarioGallery.tsx
// STRATFIT — Scenario Templates Gallery (9B)
// Browsable card gallery of 50+ pre-built "What If" scenarios.

import React, { useCallback, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  SCENARIO_TEMPLATES,
  SCENARIO_CATEGORIES,
  type ScenarioTemplate,
  type ScenarioCategory,
} from "@/engine/scenarioTemplates"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"

interface Props {
  onSelect: (template: ScenarioTemplate) => void
  onClose: () => void
}

const CATEGORY_COLORS: Record<ScenarioCategory, string> = {
  capital: "rgba(34,211,238,0.8)",
  hiring: "rgba(167,139,250,0.8)",
  pricing: "rgba(250,204,21,0.8)",
  growth: "rgba(40,255,190,0.8)",
  efficiency: "rgba(96,165,250,0.8)",
  market: "rgba(251,146,60,0.8)",
  risk: "rgba(255,78,128,0.8)",
}

function formatForce(kpi: KpiKey, v: number): string {
  const abs = Math.abs(v)
  const sign = v > 0 ? "+" : "-"
  if (["cash", "revenue", "burn", "arr", "enterpriseValue"].includes(kpi)) {
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`
    return `${sign}$${abs}`
  }
  if (["churn", "growth", "grossMargin"].includes(kpi)) return `${v > 0 ? "+" : ""}${v}%`
  return `${v > 0 ? "+" : ""}${v}`
}

export default function ScenarioGallery({ onSelect, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<ScenarioCategory | "all">("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    let list = SCENARIO_TEMPLATES
    if (activeCategory !== "all") list = list.filter((t) => t.category === activeCategory)
    if (search.length >= 2) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.question.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      )
    }
    return list
  }, [activeCategory, search])

  const handleSelect = useCallback(
    (t: ScenarioTemplate) => {
      onSelect(t)
      onClose()
    },
    [onSelect, onClose],
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={S.overlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={S.panel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={S.header}>
          <div>
            <h2 style={S.title}>Scenario Templates</h2>
            <p style={S.subtitle}>
              {SCENARIO_TEMPLATES.length} pre-built scenarios across {SCENARIO_CATEGORIES.length} categories
            </p>
          </div>
          <button type="button" onClick={onClose} style={S.closeBtn} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div style={S.searchRow}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scenarios..."
            style={S.searchInput}
            autoFocus
          />
        </div>

        {/* Category filters */}
        <div style={S.categoryRow}>
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            style={activeCategory === "all" ? S.categoryBtnActive : S.categoryBtn}
          >
            All ({SCENARIO_TEMPLATES.length})
          </button>
          {SCENARIO_CATEGORIES.map((cat) => {
            const count = SCENARIO_TEMPLATES.filter((t) => t.category === cat.key).length
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                style={
                  activeCategory === cat.key
                    ? { ...S.categoryBtnActive, color: CATEGORY_COLORS[cat.key], borderColor: CATEGORY_COLORS[cat.key] }
                    : S.categoryBtn
                }
              >
                {cat.icon} {cat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Cards grid */}
        <div style={S.grid}>
          <AnimatePresence mode="popLayout">
            {filtered.map((t, i) => (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t)}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.02 } }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02, borderColor: CATEGORY_COLORS[t.category] }}
                style={S.card}
              >
                <div style={S.cardHeader}>
                  <span
                    style={{
                      ...S.cardCategory,
                      color: CATEGORY_COLORS[t.category],
                      background: CATEGORY_COLORS[t.category].replace("0.8)", "0.08)"),
                    }}
                  >
                    {t.category}
                  </span>
                </div>
                <div style={S.cardQuestion}>{t.question}</div>
                <div style={S.cardDesc}>{t.description}</div>
                <div style={S.cardForces}>
                  {Object.entries(t.forces).map(([k, v]) => (
                    <span
                      key={k}
                      style={{
                        ...S.forceBadge,
                        color: (v as number) > 0 ? "rgba(40,255,190,0.9)" : "rgba(255,78,128,0.9)",
                        background: (v as number) > 0 ? "rgba(40,255,190,0.08)" : "rgba(255,78,128,0.08)",
                      }}
                    >
                      {k} {formatForce(k as KpiKey, v as number)}
                    </span>
                  ))}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div style={S.empty}>No scenarios match your search.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

const FONT = "'Inter', system-ui, sans-serif"

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(2, 6, 14, 0.75)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    width: "100%",
    maxWidth: 860,
    maxHeight: "85vh",
    background: "linear-gradient(180deg, rgba(10,15,25,0.98) 0%, rgba(6,10,20,0.99) 100%)",
    border: "1px solid rgba(34,211,238,0.12)",
    borderRadius: 16,
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    fontFamily: FONT,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "20px 24px 0",
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "rgba(148,180,214,0.5)",
    fontWeight: 500,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(200,220,240,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  searchRow: {
    padding: "12px 24px",
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid rgba(34,211,238,0.12)",
    background: "rgba(0,0,0,0.3)",
    color: "rgba(200,220,240,0.9)",
    fontSize: 13,
    fontFamily: FONT,
    outline: "none",
  },
  categoryRow: {
    display: "flex",
    gap: 6,
    padding: "0 24px 12px",
    overflowX: "auto",
    flexShrink: 0,
  },
  categoryBtn: {
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(200,220,240,0.5)",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: FONT,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  },
  categoryBtnActive: {
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid rgba(34,211,238,0.3)",
    background: "rgba(34,211,238,0.08)",
    color: "rgba(34,211,238,0.9)",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  grid: {
    flex: 1,
    overflowY: "auto",
    padding: "0 24px 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 10,
    alignContent: "start",
  },
  card: {
    textAlign: "left" as const,
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    cursor: "pointer",
    fontFamily: FONT,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    transition: "border-color 0.2s, background 0.2s",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardCategory: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    padding: "2px 8px",
    borderRadius: 4,
  },
  cardQuestion: {
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(200,220,240,0.9)",
    lineHeight: 1.35,
  },
  cardDesc: {
    fontSize: 11,
    color: "rgba(148,180,214,0.5)",
    lineHeight: 1.5,
  },
  cardForces: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 4,
    marginTop: 2,
  },
  forceBadge: {
    fontSize: 9,
    fontWeight: 600,
    fontFamily: "ui-monospace, monospace",
    padding: "2px 6px",
    borderRadius: 4,
    letterSpacing: "0.02em",
  },
  empty: {
    gridColumn: "1 / -1",
    textAlign: "center" as const,
    padding: "40px 0",
    color: "rgba(148,180,214,0.35)",
    fontSize: 14,
  },
}
