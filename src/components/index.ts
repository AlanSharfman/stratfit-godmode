// src/components/index.ts
// STRATFIT — Main Components Export Hub
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  LandingPage,
  PersonaGrid,
  PersonaDetail,
  ThreeFutures,
  FlowDiagram,
  ConceptDiagrams,
  DecisionArchitecture,
  PERSONAS,
  FUTURES,
  getPersonaById,
  getPersonasByCategory,
} from './landing';

export type {
  Persona,
  Future,
  FlowStep,
} from './landing';

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  OnboardingPage,
} from './onboarding';

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  DecisionTab,
  ActionCard,
  DEMO_RESULTS,
} from './tabs';

export type {
  SimulationResults,
  PathAnalysis,
  DecisionTabProps,
} from './tabs';
