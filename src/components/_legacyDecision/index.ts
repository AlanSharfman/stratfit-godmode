// src/components/Decision/index.ts
// STRATFIT — Decision Intelligence Component Exports

// Main Tab
export { default as DecisionTab } from './DecisionTab';

// View Components
export { CommandCenter } from './CommandCenter';
export { ThreatRadarView } from './ThreatRadarView';
export { OpportunityScanner } from './OpportunityScanner';
export { ActionMatrix } from './ActionMatrixView';
export { BlindSpotsView } from './BlindSpotsView';
export { DecisionLogView } from './DecisionLogView';
export { ReadinessCheck } from './ReadinessCheck';

// Types
export type * from './types';

// Legacy exports (for backwards compatibility)
export { default as DecisionHeader } from './DecisionHeader';
export { default as DecisionSummary } from './DecisionSummary';
export { default as DecisionMatrix } from './DecisionMatrix';
export { default as DecisionTimeline } from './DecisionTimeline';
export { default as DecisionList } from './DecisionList';
export { default as DecisionDetail } from './DecisionDetail';
export { default as EmptyDecisionState } from './EmptyDecisionState';
