import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePersistenceStore, type CompanyProfile } from "@/stores/persistenceStore"

interface ProfileSwitcherProps {
  onSwitch?: (profileId: string) => void
}

export default function ProfileSwitcher({ onSwitch }: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  const profiles = usePersistenceStore((s) => s.profiles)
  const activeProfileId = usePersistenceStore((s) => s.activeProfileId)
  const switchProfile = usePersistenceStore((s) => s.switchProfile)
  const createProfile = usePersistenceStore((s) => s.createProfile)
  const deleteProfile = usePersistenceStore((s) => s.deleteProfile)

  const activeProfile = profiles.find((p) => p.id === activeProfileId)

  const handleCreate = () => {
    if (!newName.trim()) return
    const id = createProfile(newName.trim(), {})
    setNewName("")
    setShowCreate(false)
    onSwitch?.(id)
  }

  const handleSwitch = (id: string) => {
    switchProfile(id)
    setOpen(false)
    onSwitch?.(id)
  }

  return (
    <div style={{ position: "relative", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px", borderRadius: 6,
          background: "rgba(200,220,240,0.03)",
          border: "1px solid rgba(200,220,240,0.08)",
          color: "rgba(200,220,240,0.6)", fontSize: 11,
          cursor: "pointer", fontWeight: 500,
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: activeProfile ? "#34d399" : "rgba(200,220,240,0.2)",
        }} />
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {activeProfile?.name ?? "No Profile"}
        </span>
        <span style={{ fontSize: 8, color: "rgba(200,220,240,0.2)" }}>▼</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0,
              width: 240, zIndex: 100,
              background: "linear-gradient(135deg, rgba(10,18,32,0.98), rgba(6,14,28,0.99))",
              border: "1px solid rgba(34,211,238,0.12)",
              borderRadius: 8, overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ padding: "8px 12px 6px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(34,211,238,0.4)", textTransform: "uppercase" }}>
              Company Profiles
            </div>

            {profiles.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSwitch(p.id)}
                style={{
                  padding: "8px 12px", cursor: "pointer",
                  background: p.id === activeProfileId ? "rgba(34,211,238,0.06)" : "transparent",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: p.id === activeProfileId ? "rgba(200,220,240,0.9)" : "rgba(200,220,240,0.6)", fontWeight: p.id === activeProfileId ? 600 : 400 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(200,220,240,0.2)" }}>
                    {new Date(p.lastModified).toLocaleDateString()}
                  </div>
                </div>
                {profiles.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProfile(p.id) }}
                    style={{
                      padding: "2px 6px", borderRadius: 3, background: "transparent",
                      border: "1px solid rgba(248,113,113,0.1)", color: "rgba(248,113,113,0.4)",
                      fontSize: 9, cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <div style={{ borderTop: "1px solid rgba(34,211,238,0.06)", padding: "8px 12px" }}>
              {showCreate ? (
                <div style={{ display: "flex", gap: 4 }}>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="Company name..."
                    autoFocus
                    style={{
                      flex: 1, padding: "4px 8px", borderRadius: 4,
                      background: "rgba(200,220,240,0.04)", border: "1px solid rgba(200,220,240,0.08)",
                      color: "rgba(200,220,240,0.8)", fontSize: 10,
                      fontFamily: "'Inter', system-ui, sans-serif", outline: "none",
                    }}
                  />
                  <button
                    onClick={handleCreate}
                    style={{
                      padding: "4px 10px", borderRadius: 4,
                      background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)",
                      color: "#22d3ee", fontSize: 9, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    width: "100%", padding: "6px 10px", borderRadius: 4,
                    background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)",
                    color: "rgba(34,211,238,0.5)", fontSize: 10, fontWeight: 600,
                    cursor: "pointer", letterSpacing: "0.04em",
                  }}
                >
                  + New Profile
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
