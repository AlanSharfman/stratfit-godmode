// ============================================================================
// PATH CONTRACT - Canonical TypeScript types for terrain path rendering
// ============================================================================

/**
 * Time axis unit for path progression
 */
export type PathTimeAxis = "MONTHS" | "WEEKS";

/**
 * Metric bindings that can drive path visual properties.
 * Each binding represents a causal relationship between data and visual.
 */
export type PathMetricBinding =
  | "riskIndex"
  | "survivalPct"
  | "runwayMonths"
  | "confidence"
  | "variance"
  | "cash";

/**
 * PathSpec defines the configuration for generating a path.
 * This is the "recipe" that produces geometry.
 *
 * RULES:
 * - Every visual property MUST be bound to a metric
 * - No decorative-only visuals allowed
 * - Must include intervention hash for reactivity
 */
export type PathSpec = {
  // ── Time anchoring ──
  timeAxis: PathTimeAxis;
  timeStart: number; // e.g. month 0
  timeEnd: number;   // e.g. month 36
  timePoints: number; // e.g. 37

  // ── Analytical bindings (no decorative-only visuals) ──
  curvatureFrom: PathMetricBinding;   // "why does it bend"
  envelopeFrom: PathMetricBinding;    // "why is it wide"
  shadingFrom: PathMetricBinding;     // "why is it red/green"

  // ── Must be causally linked to interventions ──
  interventionHash: string; // stable hash of active interventions/sliders

  // ── Traceability (debug / AI commentary) ──
  explanation: {
    curvature: string;
    envelope: string;
    shading: string;
  };
};

/**
 * PathGeometry is the output of buildPathGeometry().
 * This is the renderable data structure.
 *
 * RULES:
 * - Points are already terrain-following (y computed)
 * - Per-point arrays are synchronized in length
 * - Proof object enables debugging and validation
 */
export type PathGeometry = {
  // ── World-space points along terrain (already terrain-following) ──
  points: Array<{ x: number; y: number; z: number }>;

  // ── Per-point analytics (used for shading/envelope) ──
  risk: number[];       // 0..1
  envelope: number[];   // 0..1
  confidence: number[]; // 0..1

  // ── A single "proof" object for debugging ──
  proof: {
    timeAxis: PathTimeAxis;
    timeStart: number;
    timeEnd: number;
    interventionHash: string;
  };
};
