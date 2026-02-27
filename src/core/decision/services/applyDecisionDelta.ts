export function applyDecisionDelta<TBaseline>(
  baseline: TBaseline,
  deltas: Record<string, any>
): TBaseline {
  // shallow clone first
  const updated = { ...baseline }

  for (const key of Object.keys(deltas)) {
    ;(updated as any)[key] = deltas[key]
  }

  return updated
}
