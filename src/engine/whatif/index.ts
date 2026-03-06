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
