// src/utils/scenarioNotes.ts
// STRATFIT — Scenario Notes persistence (UI-only; no engine/state mutations)

import type { ScenarioId } from "@/state/scenarioStore";
import type { OpenAIScenarioQaResponse } from "@/utils/openaiScenarioQa";
import type { AIQAResponse } from "@/utils/openaiStrategicQa";

export type ScenarioQaNote = {
  id: string;
  scenarioId: ScenarioId;
  timestamp: number; // epoch ms
  question: string;
  compareToBase: boolean;
  openai: OpenAIScenarioQaResponse;
};

const STORAGE_KEY = "STRATFIT_SCENARIO_NOTES_V1";
const STORAGE_KEY_V2 = "STRATFIT_SCENARIO_NOTES_V2";

function safeParse(raw: string | null): ScenarioQaNote[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScenarioQaNote[];
  } catch {
    return [];
  }
}

function safeStringify(notes: ScenarioQaNote[]): string {
  return JSON.stringify(notes);
}

export function getScenarioNotes(scenarioId: ScenarioId): ScenarioQaNote[] {
  if (typeof window === "undefined") return [];
  const all = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return all.filter((n) => n && n.scenarioId === scenarioId);
}

export function saveScenarioQaNote(params: {
  scenarioId: ScenarioId;
  question: string;
  compareToBase: boolean;
  openai: OpenAIScenarioQaResponse;
}): ScenarioQaNote | null {
  if (typeof window === "undefined") return null;

  const note: ScenarioQaNote = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    scenarioId: params.scenarioId,
    timestamp: Date.now(),
    question: params.question,
    compareToBase: params.compareToBase,
    openai: params.openai,
  };

  const all = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const next = [note, ...all].slice(0, 200); // hard cap: prevent unbounded growth
  window.localStorage.setItem(STORAGE_KEY, safeStringify(next));
  return note;
}


// ============================================================================
// V2 — Structured notes with provenance (used for Strategic Questions AI Q&A)
// ============================================================================

export type ScenarioAiQaNote = {
  type: "ai_qa";
  id: string;
  scenarioId: ScenarioId;
  createdAt: number; // epoch ms
  compareToBase: boolean;
  model: string;
  inputHash: string;
  payload: AIQAResponse;
};

function safeParseV2(raw: string | null): ScenarioAiQaNote[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n: any) => n && n.type === "ai_qa") as ScenarioAiQaNote[];
  } catch {
    return [];
  }
}

export function getScenarioNotesV2(scenarioId: ScenarioId): ScenarioAiQaNote[] {
  if (typeof window === "undefined") return [];
  const all = safeParseV2(window.localStorage.getItem(STORAGE_KEY_V2));
  return all.filter((n) => n && n.scenarioId === scenarioId);
}

export function appendScenarioNote(note: Omit<ScenarioAiQaNote, "id" | "createdAt"> & { createdAt?: number }): ScenarioAiQaNote | null {
  if (typeof window === "undefined") return null;

  const entry: ScenarioAiQaNote = {
    ...note,
    type: "ai_qa",
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: typeof note.createdAt === "number" ? note.createdAt : Date.now(),
  };

  const all = safeParseV2(window.localStorage.getItem(STORAGE_KEY_V2));
  const next = [entry, ...all].slice(0, 200);
  window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(next));
  return entry;
}

