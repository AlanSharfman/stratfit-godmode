// ============================================================================
// PATH FACADE - Public API for path rendering
// ============================================================================
//
// UI components MUST import from this module only.
// Direct imports from PathContract or buildPathGeometry are banned by ESLint.
//

export type {
  PathSpec,
  PathGeometry,
  PathTimeAxis,
  PathMetricBinding,
} from "./PathContract";

export { buildPathGeometry } from "./buildPathGeometry";
export type { PathBuilderInputs } from "./buildPathGeometry";
