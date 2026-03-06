// src/engine/whatif/service.ts
// STRATFIT — What-If OpenAI Service
// Client-side (follows existing codebase pattern — see openaiScenarioQa.ts).
// Calls OpenAI Responses API with strict JSON schema enforcement.

import type { WhatIfAnswer } from "./types"
import { WHATIF_JSON_SCHEMA, validateWhatIfAnswer, safeErrorAnswer } from "./types"
import { buildSystemPrompt, buildUserMessage, PROMPT_VERSION, type WhatIfContext } from "./prompt"
import { pushWhatIfLog, nextLogId, type WhatIfLogEntry } from "./debugStore"

const MODEL = "gpt-4o-mini"
const TEMPERATURE = 0.15
const MAX_RETRIES = 1

function getApiKey(): string | null {
  const fromEnv = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (fromEnv?.trim()) return fromEnv.trim()
  try {
    const fromLs = window.localStorage.getItem("OPENAI_API_KEY")
    return fromLs?.trim() || null
  } catch { return null }
}

export function hasWhatIfApiKey(): boolean {
  return getApiKey() !== null
}

function extractText(payload: any): string | null {
  if (typeof payload?.output_text === "string") return payload.output_text
  const out0 = payload?.output?.[0]?.content?.[0]
  if (out0?.type === "output_text" && typeof out0?.text === "string") return out0.text
  if (typeof out0?.text === "string") return out0.text
  const cc = payload?.choices?.[0]?.message?.content
  if (typeof cc === "string") return cc
  return null
}

function extractUsage(payload: any): WhatIfLogEntry["tokenUsage"] {
  const u = payload?.usage
  if (!u) return null
  return {
    prompt_tokens: u.prompt_tokens ?? u.input_tokens,
    completion_tokens: u.completion_tokens ?? u.output_tokens,
    total_tokens: u.total_tokens,
  }
}

export interface AskWhatIfArgs {
  question: string
  context: WhatIfContext
  dryRun?: boolean
}

export interface AskWhatIfResult {
  answer: WhatIfAnswer
  logId: string
  fromCache: boolean
}

export async function askWhatIf(args: AskWhatIfArgs): Promise<AskWhatIfResult> {
  const { question, context, dryRun = false } = args
  const logId = nextLogId()
  const t0 = performance.now()

  const systemPrompt = buildSystemPrompt()
  const userMessage = buildUserMessage(question, context)

  if (dryRun) {
    const entry: WhatIfLogEntry = {
      id: logId,
      timestamp: Date.now(),
      promptVersion: PROMPT_VERSION,
      model: MODEL,
      question,
      systemPrompt,
      userMessage,
      rawResponse: "[DRY RUN — no API call]",
      parsedAnswer: null,
      parseSuccess: false,
      parseErrors: ["dry_run"],
      tokenUsage: null,
      latencyMs: 0,
      retryCount: 0,
      error: null,
    }
    pushWhatIfLog(entry)
    return { answer: safeErrorAnswer("Dry run — no API call made. Review debug log for prompt details."), logId, fromCache: false }
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    const entry: WhatIfLogEntry = {
      id: logId, timestamp: Date.now(), promptVersion: PROMPT_VERSION, model: MODEL,
      question, systemPrompt, userMessage,
      rawResponse: null, parsedAnswer: null, parseSuccess: false,
      parseErrors: ["no_api_key"], tokenUsage: null, latencyMs: performance.now() - t0,
      retryCount: 0, error: "No OpenAI API key found (VITE_OPENAI_API_KEY or localStorage.OPENAI_API_KEY)",
    }
    pushWhatIfLog(entry)
    return { answer: safeErrorAnswer("OpenAI API key not configured. Set VITE_OPENAI_API_KEY or localStorage.OPENAI_API_KEY."), logId, fromCache: false }
  }

  let lastError: string | null = null
  let rawResponse: string | null = null
  let tokenUsage: WhatIfLogEntry["tokenUsage"] = null
  let retryCount = 0

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    retryCount = attempt

    const isRetry = attempt > 0
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: isRetry
          ? userMessage + "\n\nPREVIOUS ATTEMPT RETURNED INVALID JSON. You MUST return valid JSON matching the schema exactly. No markdown wrapping."
          : userMessage,
      },
    ]

    const body = {
      model: MODEL,
      temperature: TEMPERATURE,
      input: messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "stratfit_whatif_answer",
          schema: WHATIF_JSON_SCHEMA,
          strict: true,
        },
      },
    }

    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        lastError = `HTTP ${res.status}: ${await res.text().catch(() => "unknown")}`
        continue
      }

      const json = await res.json()
      tokenUsage = extractUsage(json)
      rawResponse = extractText(json)

      if (!rawResponse) {
        lastError = "No text content in OpenAI response"
        continue
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(rawResponse)
      } catch (e) {
        lastError = `JSON parse failed: ${(e as Error).message}`
        continue
      }

      const validation = validateWhatIfAnswer(parsed)
      if (!validation.valid || !validation.answer) {
        lastError = `Validation failed: ${validation.errors.join("; ")}`
        continue
      }

      const entry: WhatIfLogEntry = {
        id: logId, timestamp: Date.now(), promptVersion: PROMPT_VERSION, model: MODEL,
        question, systemPrompt, userMessage,
        rawResponse, parsedAnswer: validation.answer, parseSuccess: true,
        parseErrors: [], tokenUsage, latencyMs: performance.now() - t0,
        retryCount, error: null,
      }
      pushWhatIfLog(entry)
      return { answer: validation.answer, logId, fromCache: false }

    } catch (e) {
      lastError = `Network error: ${(e as Error).message}`
    }
  }

  const entry: WhatIfLogEntry = {
    id: logId, timestamp: Date.now(), promptVersion: PROMPT_VERSION, model: MODEL,
    question, systemPrompt, userMessage,
    rawResponse, parsedAnswer: null, parseSuccess: false,
    parseErrors: [lastError ?? "unknown"], tokenUsage, latencyMs: performance.now() - t0,
    retryCount, error: lastError,
  }
  pushWhatIfLog(entry)
  return { answer: safeErrorAnswer(), logId, fromCache: false }
}
