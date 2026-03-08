import { useSystemBaseline } from "@/system/SystemBaselineProvider"

/** Returns the canonical BaselineV1 (null if not yet established). */
export function useCanonicalBaseline() {
  const { baseline } = useSystemBaseline()
  return baseline
}
