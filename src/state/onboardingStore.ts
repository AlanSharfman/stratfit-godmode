import { create } from "zustand"

export interface OnboardingState {
  cash: number
  netBurn: number
  arr: number
  growth: number
  churn: number
  headcount: number
  showAdvanced: boolean
  setField: (field: keyof Omit<OnboardingState, "setField" | "toggleAdvanced">, value: number | boolean) => void
  toggleAdvanced: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  cash: 0,
  netBurn: 0,
  arr: 0,
  growth: 0,
  churn: 0,
  headcount: 0,
  showAdvanced: false,

  setField: (field, value) =>
    set(() => ({
      [field]: value
    })),

  toggleAdvanced: () =>
    set((state) => ({
      showAdvanced: !state.showAdvanced
    }))
}))
