import React from "react"
import { useFeatureFlags, type FeatureFlags } from "@/stores/featureFlagsStore"

interface Props {
  flag: keyof FeatureFlags
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function FeatureGate({ flag, children, fallback = null }: Props) {
  const enabled = useFeatureFlags((s) => s[flag])
  return <>{enabled ? children : fallback}</>
}
