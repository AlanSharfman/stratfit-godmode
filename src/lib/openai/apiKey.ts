const LS_KEY = "OPENAI_API_KEY"

export function getOpenAIApiKey(): string | null {
  const fromEnv = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (fromEnv?.trim()) return fromEnv.trim()
  try {
    const fromLs = typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null
    return fromLs?.trim() || null
  } catch {
    return null
  }
}

export function hasOpenAIApiKey(): boolean {
  return getOpenAIApiKey() !== null
}

export function getOpenAIEndpoint(): string {
  const fromEnv = import.meta.env.VITE_OPENAI_ENDPOINT as string | undefined
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/+$/, "")
  return "https://api.openai.com/v1"
}

export function getOpenAIChatEndpoint(): string {
  return `${getOpenAIEndpoint()}/responses`
}

export function getOpenAITTSEndpoint(): string {
  return `${getOpenAIEndpoint()}/audio/speech`
}
