import { create } from "zustand"

export interface FeatureFlags {
  collaboration: boolean
  aiForceMapper: boolean
  webhooks: boolean
  networkIntelligence: boolean
}

interface FeatureFlagsState extends FeatureFlags {
  setFlag: (key: keyof FeatureFlags, value: boolean) => void
  isEnabled: (key: keyof FeatureFlags) => boolean
}

function readEnvFlag(key: string, fallback = false): boolean {
  try {
    const val = import.meta.env[key]
    if (val === "true" || val === "1") return true
    if (val === "false" || val === "0") return false
    return fallback
  } catch {
    return fallback
  }
}

function readLocalOverrides(): Partial<FeatureFlags> {
  try {
    const raw = localStorage.getItem("stratfit:feature-flags")
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function persistOverrides(flags: FeatureFlags) {
  try {
    localStorage.setItem("stratfit:feature-flags", JSON.stringify(flags))
  } catch { /* ignore */ }
}

const envDefaults: FeatureFlags = {
  collaboration: readEnvFlag("VITE_FF_COLLABORATION", false),
  aiForceMapper: false, // PERMANENTLY DISABLED — AI must never produce KPI deltas
  webhooks: readEnvFlag("VITE_FF_WEBHOOKS", false),
  networkIntelligence: readEnvFlag("VITE_FF_NETWORK_INTELLIGENCE", true),
}

const localOverrides = readLocalOverrides()
const initialFlags: FeatureFlags = { ...envDefaults, ...localOverrides, aiForceMapper: false }

export const useFeatureFlags = create<FeatureFlagsState>((set, get) => ({
  ...initialFlags,

  setFlag: (key, value) => {
    if (key === "aiForceMapper") return // permanently disabled
    set({ [key]: value })
    const state = get()
    persistOverrides({
      collaboration: state.collaboration,
      aiForceMapper: false,
      webhooks: state.webhooks,
      networkIntelligence: state.networkIntelligence,
    })
  },

  isEnabled: (key) => get()[key],
}))
