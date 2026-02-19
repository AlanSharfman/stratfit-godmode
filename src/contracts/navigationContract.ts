// src/contracts/navigationContract.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Navigation Architecture Contract (LOCKED v1)
// This file defines the canonical page order, responsibilities, and
// non-overlap rules for the entire STRATFIT platform.
//
// ANY new feature must comply with these rules.
// Violations will cause data corruption, rendering drift, or UX confusion.
// ═══════════════════════════════════════════════════════════════════════════

// ── NAV ORDER (locked) ──────────────────────────────────────────────────

export enum NavRoute {
  Initiate = "/initiate",
  Objectives = "/objectives",
  Position = "/position",
  Studio = "/studio",
  Scenarios = "/scenarios",
  Risk = "/risk",
  Capital = "/capital",
  Valuation = "/valuation",
  Assessment = "/assessment",
}

// ── PAGE RESPONSIBILITIES ───────────────────────────────────────────────
//
// Initiate        INPUT LAYER — persisted current-state inputs.
//                 The ONLY page that writes current-state financial data.
//                 Canonical store: SystemBaselineProvider (localStorage).
//                 Key: "stratfit.baseline.v1"
//
// Objectives      INTENT LAYER — targets, constraints, priority mode.
//                 Reads Initiate snapshot (read-only).
//                 Does NOT modify terrain, seed, or relief.
//                 Does NOT run simulation.
//
// Position        REALITY VISUALIZATION — terrain, P50 trajectory,
//                 markers, timeline, liquidity particles.
//                 Renders from Initiate snapshot only.
//                 Does NOT accept Objectives input (overlays may come later,
//                 but must never reshape terrain or path).
//
// Studio          SIMULATION ENGINE — lever-based what-if modeling.
//                 The ONLY page that runs simulation.
//                 Reads Initiate + Objectives as inputs.
//
// Scenarios       COMPARISON — side-by-side scenario evaluation.
//                 Reads saved simulation outputs from Studio.
//                 Does NOT run its own simulations.
//
// Risk            EXPOSURE SURFACES — risk decomposition and heatmaps.
//                 Reads simulation + baseline data.
//                 Does NOT mutate baseline or run simulation.
//
// Capital         CAPITAL IMPACT — funding, dilution, debt modeling.
//                 Reads baseline + simulation outputs.
//
// Valuation       VALUE MODELING — enterprise value, multiples, comps.
//                 Reads baseline + simulation outputs.
//
// Assessment      NARRATIVE SYNTHESIS — AI-driven strategic summary.
//                 Reads everything, writes nothing.
//

// ── NON-OVERLAP RULES ──────────────────────────────────────────────────
//
// RULE 1  Position renders from Initiate ONLY.
//         No Objectives dependency. No simulation dependency.
//
// RULE 2  Objectives does NOT modify terrain, seed, relief, or path.
//         It defines intent — overlays can reference it later, but
//         terrain shape is Initiate-derived only.
//
// RULE 3  Simulation only runs in Studio.
//         No page other than Studio may call runSimulation() or
//         mutate simulation stores.
//
// RULE 4  Initiate is the ONLY page that writes current-state inputs.
//         No other page may call setBaseline() or write to the
//         baseline localStorage key.
//
// RULE 5  No duplicated stores across pages.
//         Each domain has ONE canonical store.
//         Components read from the store; they do not maintain
//         parallel local state that shadows the store.
//
// RULE 6  Water/liquidity particles belong to Position.
//         They are a visual layer gated by toggle, NOT an Initiate
//         or Objectives concern.
//

// ── CANONICAL STORES ────────────────────────────────────────────────────
//
// Baseline        → SystemBaselineProvider   (src/system/)
// Objectives      → objectiveStore           (src/state/)
// Simulation      → SimulationStore          (src/sim/)
// Scenarios       → scenarioStore            (src/state/)
// Risk            → (derived, no dedicated store)
// Decisions       → decisionStore            (src/state/)
// Diagnostics     → DiagnosticsStore         (src/diagnostics/)
//

export default NavRoute;
