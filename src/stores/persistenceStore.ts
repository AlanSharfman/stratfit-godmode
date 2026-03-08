import { create } from "zustand"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"

const STORAGE_KEY = "stratfit-persistence-v1"
const PROFILES_KEY = "stratfit-profiles-v1"

export interface SavedScenario {
  id: string
  name: string
  description: string
  createdAt: number
  forces: Partial<Record<KpiKey, number>>
  tags: string[]
}

export interface CompanyProfile {
  id: string
  name: string
  createdAt: number
  lastModified: number
  baselineData: Record<string, unknown>
}

interface PersistenceState {
  scenarios: SavedScenario[]
  activeProfileId: string | null
  profiles: CompanyProfile[]

  saveScenario: (scenario: Omit<SavedScenario, "id" | "createdAt">) => string
  deleteScenario: (id: string) => void
  updateScenario: (id: string, updates: Partial<SavedScenario>) => void

  createProfile: (name: string, baselineData: Record<string, unknown>) => string
  switchProfile: (id: string) => void
  deleteProfile: (id: string) => void
  updateProfile: (id: string, updates: Partial<CompanyProfile>) => void
  getActiveProfile: () => CompanyProfile | null
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn("[STRATFIT] Storage write failed:", e)
  }
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const usePersistenceStore = create<PersistenceState>((set, get) => {
  const stored = loadFromStorage<{ scenarios: SavedScenario[]; activeProfileId: string | null }>(
    STORAGE_KEY,
    { scenarios: [], activeProfileId: null }
  )
  const profiles = loadFromStorage<CompanyProfile[]>(PROFILES_KEY, [])

  function persist() {
    const s = get()
    saveToStorage(STORAGE_KEY, { scenarios: s.scenarios, activeProfileId: s.activeProfileId })
    saveToStorage(PROFILES_KEY, s.profiles)
  }

  return {
    scenarios: stored.scenarios,
    activeProfileId: stored.activeProfileId,
    profiles,

    saveScenario: (scenario) => {
      const id = genId()
      const saved: SavedScenario = { ...scenario, id, createdAt: Date.now() }
      set((s) => ({ scenarios: [saved, ...s.scenarios] }))
      setTimeout(persist, 0)
      return id
    },

    deleteScenario: (id) => {
      set((s) => ({ scenarios: s.scenarios.filter((sc) => sc.id !== id) }))
      setTimeout(persist, 0)
    },

    updateScenario: (id, updates) => {
      set((s) => ({
        scenarios: s.scenarios.map((sc) => sc.id === id ? { ...sc, ...updates } : sc),
      }))
      setTimeout(persist, 0)
    },

    createProfile: (name, baselineData) => {
      const id = genId()
      const profile: CompanyProfile = { id, name, createdAt: Date.now(), lastModified: Date.now(), baselineData }
      set((s) => ({ profiles: [profile, ...s.profiles], activeProfileId: id }))
      setTimeout(persist, 0)
      return id
    },

    switchProfile: (id) => {
      set({ activeProfileId: id })
      setTimeout(persist, 0)
    },

    deleteProfile: (id) => {
      set((s) => ({
        profiles: s.profiles.filter((p) => p.id !== id),
        activeProfileId: s.activeProfileId === id ? (s.profiles[0]?.id ?? null) : s.activeProfileId,
      }))
      setTimeout(persist, 0)
    },

    updateProfile: (id, updates) => {
      set((s) => ({
        profiles: s.profiles.map((p) => p.id === id ? { ...p, ...updates, lastModified: Date.now() } : p),
      }))
      setTimeout(persist, 0)
    },

    getActiveProfile: () => {
      const s = get()
      return s.profiles.find((p) => p.id === s.activeProfileId) ?? null
    },
  }
})
