# Phase 2: Simulation Lifecycle Contract

**Branch:** `exec/godmode-phase-1`  
**Commit:** `a8e6981` - phase2: simulation lifecycle contract - deterministic state machine  
**Date:** February 15, 2026

## Implementation Complete

### Files Created

1. **[src/sim/types.ts](src/sim/types.ts)**
   - `SimPhase` type: 8 lifecycle states (Idle → Stable)
   - `SimRunMeta` type: Run metadata (runId, progress, CI width, error)
   - `SimulationState` type: Store state contract

2. **[src/sim/SimulationStore.ts](src/sim/SimulationStore.ts)**
   - Zustand store for simulation state
   - Actions: `setPhase`, `startRun`, `setProgress`, `setConvergence`, `finishRun`, `failRun`
   - Generates unique runId per execution
   - Progress clamped 0..1

3. **[src/sim/SimulationEngine.ts](src/sim/SimulationEngine.ts)**
   - `runSimulation(args)` - Deterministic lifecycle orchestrator
   - Stub Monte Carlo (10 iterations @ 40ms each)
   - Convergence check with configurable threshold
   - Automatic retry if not converged
   - Phase transitions: `ScenarioMutating` → `MonteCarloRunning` → `ConvergenceCheck` → `ProjectionUpdate` → `Stable`

4. **[src/sim/ProjectionEngine.ts](src/sim/ProjectionEngine.ts)**
   - Pure function: `project(input) → output`
   - No side effects, no store mutations
   - Determines stability from CI width
   - Ready for Phase 4/5 business math integration

### Files Modified

5. **[src/AppShell.tsx](src/AppShell.tsx)**
   - Added dev-only probe panel (bottom-right, fixed position)
   - Imports: `useSimulationStore` (aliased as `useSimStore`), `runSimulation`
   - Displays: Phase, Progress %, CI Width, Error state
   - Button: "Run Simulation" (disabled during runs)
   - Trigger: `runSimulation({ convergenceThreshold: 0.08 })`

6. **[scripts/smoke-render.mjs](scripts/smoke-render.mjs)**
   - Fixed lint: `/* eslint-env node */` → `/* global document */`

## Lifecycle Flow

```
Idle
  ↓ (user clicks "Run Simulation")
ScenarioMutating
  ↓
MonteCarloRunning (progress 0→100%)
  ↓
ConvergenceCheck (CI width checked)
  ↓ (if converged)
ProjectionUpdate
  ↓
Stable
```

**If not converged:**
```
ConvergenceCheck (CI > threshold)
  ↓
MonteCarloRunning (additional pass)
  ↓
ConvergenceCheck (CI recalculated)
  ↓
ProjectionUpdate
  ↓
Stable
```

## Verification Steps

### 1. Build/Lint/Type Check
```bash
npm run typecheck  # ✅ Pass
npm run lint       # ✅ 0 errors, 0 warnings
npm run build      # ✅ Success (2.03s)
```

### 2. Dev Server Test
```bash
npm run dev
```

**Expected Behavior:**
- Navigate to any route (`/`, `/baseline`, `/studio`, etc.)
- Dev probe panel appears bottom-right (only in DEV mode)
- Click "Run Simulation"
- Observe phase transitions in order:
  1. `Idle` → `ScenarioMutating`
  2. `MonteCarloRunning` (progress bar 0→100%)
  3. `ConvergenceCheck` (CI width displays ~0.05-0.06)
  4. `ProjectionUpdate`
  5. `Stable`
- Button re-enables after completion
- Total runtime: ~500-600ms

### 3. Verify No Circular Dependencies
```bash
# No import cycles between sim/* files
src/sim/types.ts           → (no imports)
src/sim/SimulationStore.ts → types.ts
src/sim/SimulationEngine.ts → SimulationStore.ts
src/sim/ProjectionEngine.ts → (no imports)
```

## Phase 2 Contract Guarantees

✅ **Deterministic Lifecycle** - All phase transitions follow defined state machine  
✅ **No Circular Deps** - Clean dependency graph (types → store → engine)  
✅ **Pure Projection** - ProjectionEngine has no side effects  
✅ **Store Authority** - SimulationStore is single source of truth  
✅ **Error Handling** - Lifecycle includes Error state with recovery  
✅ **UI Isolation** - Dev probe is read-only observer + trigger  
✅ **No Terrain Coupling** - Phase 2 stub doesn't update terrain/projections  

## Next Steps (Phase 3)

**Wire Business Logic:**
1. Replace stub Monte Carlo with real `runMonteCarlo()` from existing simulation worker
2. Compute actual CI width from simulation results
3. Connect ProjectionEngine to real projection calculations
4. Update terrain/KPIs only when phase === "Stable"
5. Remove dev probe UI (or keep behind feature flag)

**Integration Points:**
- `src/workers/simulation.worker.ts` - Monte Carlo implementation
- `src/state/scenarioStore.ts` - Scenario results storage
- `src/components/mountain/TerrainSurface.tsx` - Terrain updates
- KPI display components - Update from stable results only

## Testing Recommendations

**Unit Tests:**
```typescript
// src/sim/__tests__/SimulationEngine.test.ts
describe('runSimulation', () => {
  it('transitions through all phases', async () => {
    await runSimulation({ convergenceThreshold: 0.08 });
    const state = useSimulationStore.getState();
    expect(state.phase).toBe('Stable');
    expect(state.meta?.progress).toBe(1);
  });

  it('retries if not converged', async () => {
    // Mock high CI width to trigger retry
  });

  it('enters Error state on failure', async () => {
    // Mock exception in Monte Carlo
  });
});
```

**Integration Tests:**
```typescript
// tests/simulation-lifecycle.test.ts
describe('Simulation Lifecycle Integration', () => {
  it('maintains deterministic order across routes', async () => {
    // Navigate between routes during simulation
    // Verify phase state persists and completes
  });
});
```
