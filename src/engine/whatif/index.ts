// src/engine/whatif/index.ts
export { askWhatIf, hasWhatIfApiKey, type AskWhatIfArgs, type AskWhatIfResult } from "./service"
export { whatIfAnswerToForces, whatIfAnswerToTemplate, kpiLabelToKey } from "./adapter"
export { getWhatIfLog, clearWhatIfLog, subscribeWhatIfLog, type WhatIfLogEntry } from "./debugStore"
export { PROMPT_VERSION, KPI_ANCHOR_MAP, ALLOWED_COLORS } from "./prompt"
export type {
  WhatIfAnswer, WhatIfKpiImpact, WhatIfTerrainOverlay,
  WhatIfIntent, WhatIfKpiLabel, WhatIfConfidence,
  WhatIfMissingInput, WhatIfRecommendedSimulation,
  ValidateResult,
} from "./types"
export { validateWhatIfAnswer, safeErrorAnswer } from "./types"

// ── New modular architecture ──
export { STRATFIT_SYSTEM_PROMPT } from "./prompts/stratfitSystemPrompt"
export { buildDeveloperPrompt } from "./prompts/stratfitDeveloperPrompt"
export {
  buildStratfitContext,
  formatContextAsMessage,
  type StratfitContext,
  type CompanyStage,
  type ScenarioContext,
} from "./utils/buildStratfitContext"
export {
  parseScenarioIntent,
  type ScenarioIntelligence,
  type AffectedZone,
} from "./utils/parseScenarioIntent"
export {
  STRATFIT_COMPARE_PROMPT,
  COMPARE_JSON_SCHEMA,
  type CompareAnalysis,
} from "./prompts/stratfitComparePrompt"
