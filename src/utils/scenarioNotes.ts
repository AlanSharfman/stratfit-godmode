// src/utils/scenarioNotes.ts
// STRATFIT — Scenario Notes persistence (UI-only; no engine/state mutations)

import type { ScenarioId } from "@/state/scenarioStore";
import type { OpenAIScenarioQaResponse } from "@/utils/openaiScenarioQa";

export type ScenarioQaNote = {
  id: string;
  scenarioId: ScenarioId;
  timestamp: number; // epoch ms
  question: string;
  compareToBase: boolean;
  openai: OpenAIScenarioQaResponse;
};

const STORAGE_KEY = "STRATFIT_SCENARIO_NOTES_V1";

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


