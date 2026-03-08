/**
 * AI Force Mapper — PERMANENTLY DISABLED
 *
 * This module previously asked OpenAI to generate numeric KPI deltas.
 * This violates the STRATFIT safety architecture:
 *   - AI must NEVER produce numeric KPI deltas
 *   - All KPI forces must come from the deterministic simulation engine
 *   - AI is an interpreter of simulation results, not a simulator
 *
 * Use the deterministic pipeline instead:
 *   prompt → intent parser → scenario template → impact matrix → simulation engine
 *
 * See: engine/safety/runScenarioSimulation.ts
 * See: engine/scenarioImpactMatrix.ts
 * See: engine/scenarioIntentDetector.ts
 */

export interface AIForceResponse {
  forces: Record<string, never>
  reasoning: string
  confidence: number
}

export async function mapWithAI(): Promise<never> {
  throw new Error(
    "DISABLED: AI force mapping is permanently disabled. " +
    "KPI deltas must come from the deterministic simulation engine. " +
    "Use runScenarioSimulation() from engine/safety instead.",
  )
}

export function getStoredAIKey(): null {
  return null
}

export function storeAIKey(): void {
  /* disabled */
}

export function clearAIKey(): void {
  try { localStorage.removeItem("stratfit-ai-key") } catch { /* noop */ }
}
