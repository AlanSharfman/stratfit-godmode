import { useBaselineStore } from "@/state/baselineStore"

export function useCanonicalBaseline() {
  return useBaselineStore((s) => s.baseline)
}
