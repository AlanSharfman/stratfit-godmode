// src/dev/decisionFlowLog.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — DEV Decision Flow Logger
// Proves: decision → scenarioInputs → engineResults linkage
//
// Only logs in development mode. No-op in production builds.
// ═══════════════════════════════════════════════════════════════════════════

const IS_DEV = import.meta.env.DEV;

const PREFIX = "[STRATFIT:DecisionFlow]";

/**
 * Log a decision flow event with structured payload.
 *
 * Events:
 *   createScenario     — decision submitted, ScenarioIdentity generated
 *   simulationComplete — engineResults ready, terrain + KPIs computed
 */
export function logDecisionFlow(
  event: "createScenario" | "simulationComplete",
  payload: Record<string, unknown>,
): void {
  if (!IS_DEV) return;

  const ts = new Date().toISOString();

  switch (event) {
    case "createScenario":
      console.group(`${PREFIX} 🎯 DECISION SUBMITTED — ${ts}`);

      console.groupEnd();
      break;

    case "simulationComplete":
      console.group(`${PREFIX} ⚡ SIMULATION COMPLETE — ${ts}`);

      console.groupEnd();
      break;

    default:

  }
}
