// src/components/compare/index.ts
// Barrel exports for the Compare module

export { default as ComparePage } from './ComparePage';
export { default as GodModeTerrain } from './GodModeTerrain';
export { default as MonteCarloViz } from './MonteCarloViz';
export { CompareHybridPanel } from './CompareHybridPanel';
export { SpaghettiCanvas } from './SpaghettiCanvas';
export { HeatmapDrivers } from './HeatmapDrivers';
export { MetricCard } from './MetricCard';
export { GodModeMountain } from './GodModeMountain';
export { ViewToggle } from './ViewToggle';
export { FinancialGridSafetyNet } from './FinancialGridSafetyNet';
export { StrategicAutopilotPanel, type ScenarioData } from './StrategicAutopilotPanel';

// God Mode Compare
export { CompareGodMode } from './CompareGodMode';
export { DivergenceField } from './DivergenceField';
export { DriverHeatmapPanel } from './DriverHeatmapPanel';
export { makeMockCompareData, makeMockHeatmap } from './mockData';
export type { CompareDataset, CompareMetric, QuantileSeries, DriverHeatmap, DriverKey } from './types';

// Multi-View Compare
export { DivergenceStage } from './DivergenceStage';
export { OutcomeHistogram } from './OutcomeHistogram';
export { ValueWaterfall } from './ValueWaterfall';

