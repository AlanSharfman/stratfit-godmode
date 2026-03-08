import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePersistenceStore, type SavedScenario } from "@/stores/persistenceStore"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"

interface ScenarioLibraryProps {
  onLoadScenario: (forces: Partial<Record<KpiKey, number>>) => void
  currentForces?: Partial<Record<KpiKey, number>>
}

export default function ScenarioLibrary({ onLoadScenario, currentForces }: ScenarioLibraryProps) {
  const [expanded, setExpanded] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [showSaveForm, setShowSaveForm] = useState(false)

  const scenarios = usePersistenceStore((s) => s.scenarios)
  const saveScenario = usePersistenceStore((s) => s.saveScenario)
  const deleteScenario = usePersistenceStore((s) => s.deleteScenario)

  const handleSave = () => {
    if (!saveName.trim() || !currentForces) return
    saveScenario({
      name: saveName.trim(),
      description: `Saved ${new Date().toLocaleDateString()}`,
      forces: currentForces,
      tags: [],
    })
    setSaveName("")
    setShowSaveForm(false)
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "10px 14px",
          background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)",
          borderRadius: 8, cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          color: "rgba(200,220,240,0.6)", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.08em",
        }}
      >
        <span>Saved Scenarios ({scenarios.length})</span>
        <span style={{ fontSize: 10, color: "rgba(34,211,238,0.4)" }}>{expanded ? "▼" : "▶"}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "8px 0" }}>
              {/* Save button */}
              {currentForces && Object.keys(currentForces).length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {showSaveForm ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        placeholder="Scenario name..."
                        style={{
                          flex: 1, padding: "6px 10px", borderRadius: 4,
                          background: "rgba(200,220,240,0.04)", border: "1px solid rgba(200,220,240,0.08)",
                          color: "rgba(200,220,240,0.8)", fontSize: 11,
                          fontFamily: "'Inter', system-ui, sans-serif", outline: "none",
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        style={{
                          padding: "6px 12px", borderRadius: 4,
                          background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)",
                          color: "#22d3ee", fontSize: 10, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSaveForm(true)}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 6,
                        background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)",
                        color: "#22d3ee", fontSize: 10, fontWeight: 600, cursor: "pointer",
                        letterSpacing: "0.06em",
                      }}
                    >
                      + Save Current Scenario
                    </button>
                  )}
                </div>
              )}

              {/* Scenario list */}
              {scenarios.length === 0 ? (
                <div style={{ padding: "12px 0", textAlign: "center", fontSize: 11, color: "rgba(200,220,240,0.2)" }}>
                  No saved scenarios yet
                </div>
              ) : (
                scenarios.map((sc) => (
                  <div
                    key={sc.id}
                    style={{
                      padding: "8px 10px", marginBottom: 4, borderRadius: 6,
                      background: "rgba(200,220,240,0.02)",
                      border: "1px solid rgba(200,220,240,0.04)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(200,220,240,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sc.name}
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(200,220,240,0.2)" }}>
                        {new Date(sc.createdAt).toLocaleDateString()} · {Object.keys(sc.forces).length} forces
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => onLoadScenario(sc.forces)}
                        style={{
                          padding: "4px 10px", borderRadius: 4,
                          background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)",
                          color: "#22d3ee", fontSize: 9, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteScenario(sc.id)}
                        style={{
                          padding: "4px 8px", borderRadius: 4,
                          background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.08)",
                          color: "rgba(248,113,113,0.5)", fontSize: 9, cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
