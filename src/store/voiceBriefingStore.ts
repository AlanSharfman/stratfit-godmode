import { create } from "zustand"

interface VoiceBriefingState {
  isSpeaking: boolean
  setSpeaking: (v: boolean) => void
}

export const useVoiceBriefingStore = create<VoiceBriefingState>((set) => ({
  isSpeaking: false,
  setSpeaking: (v) => set({ isSpeaking: v }),
}))
