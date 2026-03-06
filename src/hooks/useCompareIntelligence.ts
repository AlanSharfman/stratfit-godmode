/**
 * STRATFIT — Compare Intelligence Hook
 *
 * Calls OpenAI with the compare system prompt when scenario pair KPIs
 * are available. Caches results by a hash of the input KPIs to prevent
 * redundant API calls.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import {
  STRATFIT_COMPARE_PROMPT,
  COMPARE_JSON_SCHEMA,
  type CompareAnalysis,
} from "@/engine/whatif"
import { getOpenAIApiKey, hasOpenAIApiKey } from "@/lib/openai/apiKey"

interface UseCompareIntelligenceResult {
  analysis: CompareAnalysis | null
  loading: boolean
  error: string | null
  retry: () => void
}

function hashKpis(a: SimulationKpis, b: SimulationKpis, lA: string, lB: string): string {
  return `${lA}|${lB}|${JSON.stringify(a)}|${JSON.stringify(b)}`
}

function buildUserMessage(
  kpisL: SimulationKpis,
  kpisR: SimulationKpis,
  labelL: string,
  labelR: string,
): string {
  return [
    `Compare these two scenarios and recommend the strongest strategic position.`,
    ``,
    `═══ SCENARIO A: ${labelL} ═══`,
    JSON.stringify(kpisL, null, 2),
    ``,
    `═══ SCENARIO B: ${labelR} ═══`,
    JSON.stringify(kpisR, null, 2),
    ``,
    `Return STRICT JSON matching the schema. No markdown. No extra text.`,
  ].join("\n")
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

export function useCompareIntelligence(
  kpisL: SimulationKpis | null,
  kpisR: SimulationKpis | null,
  labelL: string,
  labelR: string,
): UseCompareIntelligenceResult {
  const [analysis, setAnalysis] = useState<CompareAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<Map<string, CompareAnalysis>>(new Map())
  const lastHashRef = useRef<string>("")
  const abortRef = useRef<AbortController | null>(null)

  const fetchAnalysis = useCallback(async () => {
    if (!kpisL || !kpisR) return
    if (!hasOpenAIApiKey()) {
      setError("No OpenAI API key configured.")
      return
    }

    const hash = hashKpis(kpisL, kpisR, labelL, labelR)
    if (hash === lastHashRef.current && analysis) return

    const cached = cacheRef.current.get(hash)
    if (cached) {
      lastHashRef.current = hash
      setAnalysis(cached)
      setError(null)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const apiKey = getOpenAIApiKey()!
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.15,
          input: [
            { role: "system", content: STRATFIT_COMPARE_PROMPT },
            { role: "user", content: buildUserMessage(kpisL, kpisR, labelL, labelR) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "stratfit_compare_analysis",
              schema: COMPARE_JSON_SCHEMA,
              strict: true,
            },
          },
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const json = await res.json()
      const text = extractText(json)
      if (!text) throw new Error("No text in response")

      const parsed = JSON.parse(text) as CompareAnalysis
      cacheRef.current.set(hash, parsed)
      lastHashRef.current = hash
      setAnalysis(parsed)
    } catch (e: any) {
      if (e.name === "AbortError") return
      setError(e.message ?? "Failed to generate analysis")
    } finally {
      setLoading(false)
    }
  }, [kpisL, kpisR, labelL, labelR, analysis])

  useEffect(() => {
    if (!kpisL || !kpisR) return
    const hash = hashKpis(kpisL, kpisR, labelL, labelR)
    if (hash !== lastHashRef.current) {
      fetchAnalysis()
    }
  }, [kpisL, kpisR, labelL, labelR, fetchAnalysis])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return { analysis, loading, error, retry: fetchAnalysis }
}
