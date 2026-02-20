// src/contracts/navigationContract.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Navigation Architecture Contract (LOCKED v2)
// Canonical page order + responsibilities
// ═══════════════════════════════════════════════════════════════════════════

// ── NAV ORDER (locked v2) ───────────────────────────────────────────────

export enum NavRoute {
  Initiate = "/initiate",
  Position = "/position",
  Objectives = "/objectives",
  Studio = "/studio",
  Scenarios = "/scenarios",
  Risk = "/risk",
  Capital = "/capital",
  Valuation = "/valuation",
  Assessment = "/assessment",
  Roadmap = "/roadmap",
}

// ── PAGE RESPONSIBILITIES ───────────────────────────────────────────────
//
// Initiate        INPUT LAYER — persisted current-state inputs.
//                 The ONLY page that writes current-state financial data.
//                 Canonical store: SystemBaselineProvider (localStorage).
//                 Key: "stratfit.baseline.v1"
//
// Position        REALITY VISUALISATION — terrain, trajectory, liquidity signals.
//                 Renders baseline only.
//                 Does NOT accept Objectives input (overlays may come later,
//                 but must never reshape terrain or path).
//
// Objectives      INTENT LAYER — targets, constraints, priority.
//                 Defines strategic intent after user sees reality.
//                 Reads Initiate snapshot (read-only).
//                 Does NOT modify terrain, seed, or relief.
//                 Does NOT run simulation.
//
// Studio          SIMULATION ENGINE — lever-based what-if modelling.
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
// Capital         CAPITAL IMPACT — funding, dilution, debt modelling.
//                 Reads baseline + simulation outputs.
//
// Valuation       VALUE MODELLING — enterprise value, multiples, comps.
//                 Reads baseline + simulation outputs.
//
// Assessment      STRATEGIC SYNTHESIS — AI-driven narrative summary.
//                 Reads everything, writes nothing.
//
// Roadmap         EXECUTION LAYER — actionable plan derived from
//                 selected scenario. Reads Assessment + Scenarios.
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
// RULE 7  Roadmap reads from Assessment + selected Scenario.
//         It does NOT run simulation or modify baseline.
//

// ── CANONICAL STORES ────────────────────────────────────────────────────
//
// Baseline        → SystemBaselineProvider   (src/system/)
// Objectives      → objectiveStore           (src/state/)
// Simulation      → simulationStore          (src/state/simulationStore.ts)
// SimPhase        → simPhaseStore            (src/state/simPhaseStore.ts)
// Scenarios       → scenarioStore            (src/state/)
// Risk            → (derived, no dedicated store)
// Decisions       → decisionStore            (src/state/)
// Diagnostics     → DiagnosticsStore         (src/diagnostics/)
// RenderFlags     → renderFlagsStore         (src/state/renderFlagsStore.ts)
//

export default NavRoute;
