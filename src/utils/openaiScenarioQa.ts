// src/utils/openaiScenarioQa.ts
// STRATFIT — Scenario Intelligence Q&A (OpenAI-backed, STRICT JSON)
// UI-only wiring. No engine math/state changes. Deterministic fallback lives in the panel.

export type OpenAIScenarioQaResponse = {
  headline: string; // max 12 words (validated softly)
  answer: string; // 2–4 short sentences (validated softly)
  key_metrics: Array<{ name: string; value: string }>;
  drivers: string[];
  confidence: "high" | "medium" | "low";
};

type AskArgs = {
  userQuestion: string;
  activeScenario: string;
  engineResultsSnapshot: unknown;
  baseScenarioResults?: unknown;
  compareToBase: boolean;
};

function getApiKey(): string | null {
  // Prefer Vite env. Optional localStorage override for dev.
  // - VITE_OPENAI_API_KEY="..." (recommended for local dev only)
  // - localStorage.OPENAI_API_KEY="..." (optional)
  const fromEnv = (import.meta as any)?.env?.VITE_OPENAI_API_KEY as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    const fromLs = window.localStorage.getItem("OPENAI_API_KEY");
    return fromLs && fromLs.trim() ? fromLs.trim() : null;
  } catch {
    return null;
  }
}

function extractText(payload: any): string | null {
  // Responses API shape
  if (typeof payload?.output_text === "string") return payload.output_text;

  // Some responses return structured output array
  const out0 = payload?.output?.[0]?.content?.[0];
  if (out0?.type === "output_text" && typeof out0?.text === "string") return out0.text;
  if (typeof out0?.text === "string") return out0.text;

  // Chat Completions fallback shape
  const cc = payload?.choices?.[0]?.message?.content;
  if (typeof cc === "string") return cc;

  return null;
}

function isValid(resp: any): resp is OpenAIScenarioQaResponse {
  if (!resp || typeof resp !== "object") return false;
  if (typeof resp.headline !== "string") return false;
  if (typeof resp.answer !== "string") return false;
  if (!Array.isArray(resp.key_metrics)) return false;
  if (!Array.isArray(resp.drivers)) return false;
  if (!["high", "medium", "low"].includes(resp.confidence)) return false;
  if (
    !resp.key_metrics.every(
      (m: any) => m && typeof m.name === "string" && typeof m.value === "string"
    )
  ) {
    return false;
  }
  if (!resp.drivers.every((d: any) => typeof d === "string")) return false;
  return true;
}

export async function askScenarioOpenAI(args: AskArgs): Promise<OpenAIScenarioQaResponse | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const { userQuestion, activeScenario, engineResultsSnapshot, baseScenarioResults, compareToBase } = args;
  const q = (userQuestion ?? "").trim();
  if (!q) return null;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      headline: { type: "string", description: "Max 12 words" },
      answer: { type: "string", description: "2–4 short sentences" },
      key_metrics: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            value: { type: "string" },
          },
          required: ["name", "value"],
        },
      },
      drivers: { type: "array", items: { type: "string" } },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
    },
    required: ["headline", "answer", "key_metrics", "drivers", "confidence"],
  } as const;

  const system = [
    "You are STRATFIT Scenario Intelligence.",
    "This is NOT chat. Answer one executive question about the CURRENT scenario.",
    "Ground strictly in provided data. No speculation. No generic advice. No filler.",
    "Return STRICT JSON ONLY that matches the provided JSON schema. No markdown. No extra text.",
  ].join("\n");

  const user = {
    userQuestion: q,
    activeScenario,
    compareToBase,
    engineResultsSnapshot,
    baseScenarioResults: compareToBase ? baseScenarioResults ?? null : null,
  };

  // Prefer the Responses API with strict JSON schema enforcement.
  const body = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content:
          "Answer using ONLY the provided data.\n" +
          "If compareToBase is true and baseScenarioResults is provided, you MUST reference differences vs Base (deltas) where relevant.\n" +
          "If compareToBase is false, you MUST NOT mention Base or any deltas vs Base.\n" +
          "Return STRICT JSON ONLY.\n\n" +
          JSON.stringify(user),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "stratfit_scenario_qa",
        schema,
        strict: true,
      },
    },
  };

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const text = extractText(json);
    if (!text) return null;

    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      return null;
    }

    if (!isValid(parsed)) return null;

    // Soft constraints (don’t fail hard; schema already enforced)
    parsed.headline = String(parsed.headline).trim();
    parsed.answer = String(parsed.answer).trim();
    parsed.drivers = parsed.drivers.map((d: string) => d.trim()).filter(Boolean).slice(0, 6);
    parsed.key_metrics = parsed.key_metrics
      .map((m: any) => ({ name: String(m.name).trim(), value: String(m.value).trim() }))
      .filter((m: any) => m.name && m.value)
      .slice(0, 6);

    return parsed as OpenAIScenarioQaResponse;
  } catch {
    return null;
  }
}


