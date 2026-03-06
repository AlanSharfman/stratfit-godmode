const LS_KEY = "OPENAI_API_KEY"

export function getOpenAIApiKey(): string | null {
  const fromEnv = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (fromEnv?.trim()) return fromEnv.trim()
  try {
    const fromLs = window.localStorage.getItem(LS_KEY)
    return fromLs?.trim() || null
  } catch {
    return null
  }
}

export function hasOpenAIApiKey(): boolean {
  return getOpenAIApiKey() !== null
}
