// src/strategy/index.ts
// STRATFIT — Strategy Module Exports

export type { 
  Strategy, 
  StrategyLevers, 
  StrategyKpis, 
  StrategyLabel,
  TimelinePoint,
} from "./Strategy";

export { 
  classifyStrategy,
  findBreakEven,
  calculateExitValue,
  STRATEGY_LABEL_COLORS,
} from "./Strategy";

export type { CapTable, ExitValue } from "./Strategy";

export { StrategyCompare } from "./StrategyCompare";
export { TimelineChart } from "./TimelineChart";

