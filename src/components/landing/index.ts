// src/components/landing/index.ts
// STRATFIT — Landing Page Components Export

// Main Landing Page
export { default as LandingPage } from './LandingPage';

// Persona System
export { default as PersonaGrid } from './PersonaGrid';
export { default as PersonaDetail } from './PersonaDetail';
export { 
  PERSONAS, 
  getPersonaById, 
  getPersonasByCategory 
} from './personaData';
export type { Persona, PersonaCategory } from './personaData';

// 3 Futures Framework
export { default as ThreeFutures, FUTURES } from './ThreeFutures';
export type { Future } from './ThreeFutures';

// Flow Diagram (Gemini-style)
export { default as FlowDiagram, FLOW_STEPS } from './FlowDiagram';
export type { FlowStep } from './FlowDiagram';

// Concept Diagrams
export { 
  default as ConceptDiagrams,
  BeforeAfterWorkflow,
  ProbabilityCone,
  SensitivityMatrix,
  LivingModelArchitecture
} from './ConceptDiagrams';

// Decision Architecture
export { 
  default as DecisionArchitecture,
  DATA_INPUTS,
  ENGINE_LAYERS,
  OUTPUTS
} from './DecisionArchitecture';
export type { DataFlow, EngineLayer, OutputCard } from './DecisionArchitecture';
