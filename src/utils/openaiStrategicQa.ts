// src/utils/openaiStrategicQa.ts
// STRATFIT — Strategic Questions (OpenAI-backed, STRICT JSON)
// UI-only layer: no engine math changes. Deterministic answers remain the fallback.

export type ScenarioLabel = "base" | "upside" | "downside" | "extreme";
export type DeltaDir = "up" | "down" | "flat";

export type StrategicQuestionId =
  | "capital_timing"
  | "growth_sustainability"
  | "risk_concentration"
  | "assumption_fragility"
  | "custom";

export type AIQAResponse = {
  version: "1.0";
  scenarioId: string;
  scenarioLabel: ScenarioLabel;
  compareToBase: boolean;
  items: Array<{
    id: StrategicQuestionId;
    question: string;
    answer: string;
    confidence: "low" | "medium" | "high";
    tags: string[];
  }>;
  disclaimers?: string[];
};

export type StrategicQaPromptInput = {
  scenarioId: string;
  scenarioLabel: ScenarioLabel;
  compareToBase: boolean;
  observation: string[]; // 0–2 lines
  assumptionFlags: string[]; // 0–2 lines
  systemState: { financial: string; operational: string; execution: string };
  topRisks: Array<{ severity: string; title: string; driver: string; impact: string }>; // max 2
  deltas: {
    runway: DeltaDir;
    burn: DeltaDir;
    growth: DeltaDir;
    margin: DeltaDir;
    risk: DeltaDir;
    valuation: DeltaDir;
  };
  strategicQuestions: Array<{ id: StrategicQuestionId; question: string }>; // 0–2
};

function getApiKey(): string | null {
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
  if (typeof payload?.output_text === "string") return payload.output_text;
  const out0 = payload?.output?.[0]?.content?.[0];
  if (out0?.type === "output_text" && typeof out0?.text === "string") return out0.text;
  if (typeof out0?.text === "string") return out0.text;
  const cc = payload?.choices?.[0]?.message?.content;
  if (typeof cc === "string") return cc;
  return null;
}

function fnv1a32Hex(input: string): string {
  // Deterministic, fast, non-crypto hash for cache keys.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function computeScenarioHash(input: StrategicQaPromptInput): string {
  // Canonical stringify: stable key order via object literal construction.
  const canonical = {
    scenarioId: String(input.scenarioId),
    scenarioLabel: input.scenarioLabel,
    compareToBase: !!input.compareToBase,
    observation: (input.observation ?? []).slice(0, 2).map(String),
    assumptionFlags: (input.assumptionFlags ?? []).slice(0, 2).map(String),
    systemState: {
      financial: String(input.systemState?.financial ?? ""),
      operational: String(input.systemState?.operational ?? ""),
      execution: String(input.systemState?.execution ?? ""),
    },
    topRisks: (input.topRisks ?? [])
      .slice(0, 2)
      .map((r) => ({
        severity: String(r?.severity ?? ""),
        title: String(r?.title ?? ""),
        driver: String(r?.driver ?? ""),
        impact: String(r?.impact ?? ""),
      })),
    deltas: {
      runway: input.deltas.runway,
      burn: input.deltas.burn,
      growth: input.deltas.growth,
      margin: input.deltas.margin,
      risk: input.deltas.risk,
      valuation: input.deltas.valuation,
    },
    strategicQuestions: (input.strategicQuestions ?? [])
      .slice(0, 2)
      .map((q) => ({ id: q.id, question: String(q.question ?? "") })),
  };
  return fnv1a32Hex(JSON.stringify(canonical));
}

function hasDigits(s: string) {
  return /[0-9]/.test(s);
}

function hasImperatives(s: string) {
  return /\b(must|should|recommend|need to|you should|we should)\b/i.test(s);
}

function needsBaselineClause(compareToBase: boolean, answer: string) {
  if (!compareToBase) return true;
  return /(baseline|base|compared to base|versus base|vs base|relative to base)/i.test(answer);
}

export function parseAndValidateAIQAResponse(params: {
  jsonText: string;
  expectedScenarioId: string;
  expectedScenarioLabel: ScenarioLabel;
  expectedCompareToBase: boolean;
  expectedQuestionIds: StrategicQuestionId[];
}): AIQAResponse {
  const parsed = JSON.parse(params.jsonText) as any;
  if (!parsed || typeof parsed !== "object") throw new Error("invalid");

  if (parsed.version !== "1.0") throw new Error("invalid_version");
  if (String(parsed.scenarioId) !== String(params.expectedScenarioId)) throw new Error("scenarioId_mismatch");
  if (parsed.scenarioLabel !== params.expectedScenarioLabel) throw new Error("scenarioLabel_mismatch");
  if (parsed.compareToBase !== params.expectedCompareToBase) throw new Error("compareToBase_mismatch");
  if (!Array.isArray(parsed.items)) throw new Error("items_missing");
  if (parsed.items.length > 2) throw new Error("too_many_items");

  const allowedIds: StrategicQuestionId[] = [
    "capital_timing",
    "growth_sustainability",
    "risk_concentration",
    "assumption_fragility",
    "custom",
  ];

  const expected = new Set(params.expectedQuestionIds);
  for (const it of parsed.items) {
    if (!it || typeof it !== "object") throw new Error("bad_item");
    if (!allowedIds.includes(it.id)) throw new Error("bad_item_id");
    if (it.id !== "custom" && expected.size > 0 && !expected.has(it.id)) throw new Error("unexpected_item_id");
    if (typeof it.question !== "string" || typeof it.answer !== "string") throw new Error("bad_strings");
    if (!["low", "medium", "high"].includes(it.confidence)) throw new Error("bad_confidence");
    if (!Array.isArray(it.tags) || !it.tags.every((t: any) => typeof t === "string")) throw new Error("bad_tags");

    // Hard content constraints
    if (hasDigits(it.question) || hasDigits(it.answer) || it.tags.some((t: string) => hasDigits(t))) throw new Error("digits");
    if (hasImperatives(it.answer)) throw new Error("imperative");
    if (!needsBaselineClause(params.expectedCompareToBase, it.answer)) throw new Error("missing_baseline_clause");
  }

  if (parsed.disclaimers !== undefined) {
    if (!Array.isArray(parsed.disclaimers) || !parsed.disclaimers.every((d: any) => typeof d === "string")) {
      throw new Error("bad_disclaimers");
    }
    if (parsed.disclaimers.some((d: string) => hasDigits(d) || hasImperatives(d))) throw new Error("bad_disclaimers_content");
  }

  return parsed as AIQAResponse;
}

export async function askStrategicQuestionsOpenAI(args: {
  input: StrategicQaPromptInput;
  model?: string;
}): Promise<AIQAResponse | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const input = args.input;
  if (!input || !input.strategicQuestions?.length) return null;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      version: { type: "string", enum: ["1.0"] },
      scenarioId: { type: "string" },
      scenarioLabel: { type: "string", enum: ["base", "upside", "downside", "extreme"] },
      compareToBase: { type: "boolean" },
      items: {
        type: "array",
        maxItems: 2,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              enum: ["capital_timing", "growth_sustainability", "risk_concentration", "assumption_fragility", "custom"],
            },
            question: { type: "string" },
            answer: { type: "string" },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["id", "question", "answer", "confidence", "tags"],
        },
      },
      disclaimers: { type: "array", items: { type: "string" } },
    },
    required: ["version", "scenarioId", "scenarioLabel", "compareToBase", "items"],
  } as const;

  const system = [
    "You are STRATFIT Strategic Q&A for board/investor-safe scenario assessment.",
    "You will be given qualitative signals only (no KPI values).",
    "Answer neutrally with no imperatives or recommendations.",
    "If compareToBase is true, each answer MUST include a short baseline-relative clause WITHOUT numbers.",
    "If compareToBase is false, you MUST NOT mention Base or baseline.",
    "NO RAW NUMBERS: do not output any digits in any question/answer/tag/disclaimer.",
    "Return STRICT JSON ONLY that matches the provided JSON schema. No markdown. No extra text.",
  ].join("\n");

  const user = {
    scenarioId: input.scenarioId,
    scenarioLabel: input.scenarioLabel,
    compareToBase: input.compareToBase,
    observation: input.observation,
    assumptionFlags: input.assumptionFlags,
    systemState: input.systemState,
    topRisks: input.topRisks,
    deltas: input.deltas,
    strategicQuestions: input.strategicQuestions,
  };

  const body = {
    model: args.model ?? "gpt-4o-mini",
    temperature: 0.2,
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content: "Return STRICT JSON ONLY.\n\n" + JSON.stringify(user),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "stratfit_strategic_questions",
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

    return parseAndValidateAIQAResponse({
      jsonText: text,
      expectedScenarioId: input.scenarioId,
      expectedScenarioLabel: input.scenarioLabel,
      expectedCompareToBase: input.compareToBase,
      expectedQuestionIds: input.strategicQuestions.map((q) => q.id),
    });
  } catch {
    return null;
  }
}

export function createStrategicQaCache() {
  const cache = new Map<string, AIQAResponse>();
  const inflight = new Map<string, Promise<AIQAResponse>>();
  return {
    get(hash: string) {
      return cache.get(hash) ?? null;
    },
    has(hash: string) {
      return cache.has(hash);
    },
    async getOrFetch(hash: string, fetcher: () => Promise<AIQAResponse>): Promise<AIQAResponse> {
      const cached = cache.get(hash);
      if (cached) return cached;
      const pending = inflight.get(hash);
      if (pending) return pending;
      const p = fetcher()
        .then((resp) => {
          cache.set(hash, resp);
          inflight.delete(hash);
          return resp;
        })
        .catch((e) => {
          inflight.delete(hash);
          throw e;
        });
      inflight.set(hash, p);
      return p;
    },
    clear() {
      cache.clear();
      inflight.clear();
    },
  };
}

export async function fetchStrategicQaCached(params: {
  cache: ReturnType<typeof createStrategicQaCache>;
  hash: string;
  fetcher: () => Promise<AIQAResponse>;
}): Promise<AIQAResponse | null> {
  try {
    return await params.cache.getOrFetch(params.hash, params.fetcher);
  } catch {
    return null;
  }
}



