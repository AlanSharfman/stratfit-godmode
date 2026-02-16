# STRATFIT FORENSIC AUDIT REPORT
**Date:** February 16, 2026  
**Mode:** GOD MODE FORENSIC AUDIT  
**Role:** Principal React + R3F + State Integrity Engineer

---

## SYSTEM HEALTH SCORE: 72/100

---

## 🔴 CRITICAL ISSUES (Render Blockers / Broken Logic)

### 1. DUPLICATE SIMULATION STORES
**Severity:** CRITICAL  
**Impact:** State desync, undefined behavior, data corruption risk

Two separate `useSimulationStore` definitions exist:

| Store | Location | Purpose |
|-------|----------|---------|
| Full Store | `src/state/simulationStore.ts` | MonteCarloResult, persistence, verdict |
| Phase Store | `src/sim/SimulationStore.ts` | Lightweight phase/progress tracking |

**Files importing INCORRECT store:**
- [DiagnosticsOverlay.tsx](src/diagnostics/DiagnosticsOverlay.tsx#L4)
- [DiagnosticsBootstrap.tsx](src/diagnostics/DiagnosticsBootstrap.tsx#L5)
- [SimulationStatusBeacon.tsx](src/components/simulation/SimulationStatusBeacon.tsx#L2)
- [SimulationEngine.ts](src/sim/SimulationEngine.ts#L1)

**CRITICAL:** [AppShell.tsx](src/AppShell.tsx#L8-L9) imports BOTH stores with aliasing — state desync guaranteed.

### 2. UNGUARDED CANVAS MOUNT
**Severity:** CRITICAL  
**Impact:** Multiple WebGL contexts, memory leak, render contract violation

| File | Line | Guard? |
|------|------|--------|
| `TerrainStage.tsx` | L26 | ✅ `__STRATFIT_CANVAS__` |
| `ScenarioMountain.tsx` | L1826 | ❌ **NO GUARD** |
| `TradeOffsTab.tsx` | L318 | ❌ (separate page, acceptable) |

`ScenarioMountain.tsx` can mount Canvas without guard — if rendered alongside TerrainStage, contract violated.

---

## 🟠 HIGH PRIORITY (Bugs / Instability)

### 3. ORPHANED STATE STORES
**Severity:** HIGH  
**Impact:** Dead code, maintenance burden, import confusion

| Store | File | Usage |
|-------|------|-------|
| `useObjectiveStore` | `src/state/objectiveStore.ts` | Only in definition |
| `useWorkingLeversStore` | `src/state/workingLeversStore.ts` | Only in definition |
| `useOnboardingStore` | `src/state/onboardingStore.ts` | Only in definition |
| `useViewTogglesStore` | `src/state/viewTogglesStore.ts` | Self-referencing only |

### 4. SHADER INJECTION CHAIN RISK
**Severity:** HIGH  
**Impact:** Shader compilation failures, z-fighting, displacement conflicts

8 separate shader injection systems found:
- `injectTopography.ts` (STM)
- `injectRiskField.ts` (RPF)
- `injectConfidenceField.ts` (CF)
- `injectTemporalFlow.ts` (TFL)
- `injectMorphing.ts` (TME)
- `injectResonance.ts` (SRL)
- `injectDecisionHeat.ts` (DHL)
- `injectMarkerPedestals.ts` (MPL)

All use idempotent guards (`*_INJECTED_KEY`) — **SAFE**  
However, uniform namespace conflicts possible if same keys used.

### 5. TYPE SAFETY DEGRADATION
**Severity:** HIGH  
**Impact:** Runtime errors, undefined behavior

30+ `as any` casts detected:
- [DiagnosticsOverlay.tsx](src/diagnostics/DiagnosticsOverlay.tsx#L16-L20)
- [StudioPage.tsx](src/pages/studio/StudioPage.tsx#L82-L86)
- [ScenarioMountain.tsx](src/components/mountain/ScenarioMountain.tsx#L1679)

---

## 🟡 MEDIUM (Cleanup)

### 6. POTENTIALLY STALE MEMOIZATION
**Severity:** MEDIUM  
**Impact:** Stale renders, incorrect data

91 instances of empty dependency arrays `[]` with `useMemo`/`useEffect`:

| File | Count |
|------|-------|
| `StudioPage.tsx` | 4 |
| `ScenarioMountain.tsx` | 2 |
| `TerrainSurface.tsx` | 3 |
| `StrategyStudioPage.tsx` | 2 |

**Notable:**
- [P50Path.tsx#L57](src/paths/P50Path.tsx#L57): `useMemo(() => generateP50Nodes(), [])` — nodes never regenerate

### 7. FULL-STORE SELECTORS
**Severity:** MEDIUM  
**Impact:** Excessive re-renders

Components pulling entire store without selector:
- [StrategicAssessmentPage.tsx#L286](src/pages/StrategicAssessmentPage.tsx#L286)
- [SimulateOverlayWired.tsx#L76](src/components/simulate/SimulateOverlayWired.tsx#L76)
- [ImpactGodMode.tsx#L60](src/components/impact/ImpactGodMode.tsx#L60)

### 8. TINY/EMPTY CSS MODULES
**Severity:** LOW  
**Impact:** Bundle bloat

- `src/components/TopBar.module.css` (< 100 bytes)
- `src/components/scenario/ActiveScenario.module.css` (< 100 bytes)

---

## ✅ SAFE TO IGNORE

1. **TradeOffsTab Canvas** — Isolated page, acceptable
2. **Navigation pattern** — `useNavigate` used correctly throughout
3. **Shader uniforms** — All use proper key merging with `for...of`
4. **Build output** — 2.08s build, warning on chunk size but acceptable

---

## 📁 FILES REQUIRING FIX

### CRITICAL — Must Fix Immediately
1. `src/AppShell.tsx` — Remove dual store imports, consolidate
2. `src/sim/SimulationStore.ts` — Delete or integrate into main store
3. `src/components/mountain/ScenarioMountain.tsx` — Add Canvas guard

### HIGH — Fix This Sprint
4. `src/state/objectiveStore.ts` — Wire up or delete
5. `src/state/workingLeversStore.ts` — Wire up or delete
6. `src/state/onboardingStore.ts` — Wire up or delete
7. `src/state/viewTogglesStore.ts` — Audit selectors

### MEDIUM — Tech Debt
8. `src/paths/P50Path.tsx` — Add proper dependencies to useMemo
9. `src/pages/studio/StudioPage.tsx` — Remove `as any` casts
10. `src/diagnostics/DiagnosticsOverlay.tsx` — Fix type imports

---

## 📊 SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Canvas Mounts | 3 (1 unguarded) | ⚠️ |
| State Stores | 22 (4 orphaned) | ⚠️ |
| Shader Injectors | 8 (all guarded) | ✅ |
| Routing Endpoints | 11 | ✅ |
| Type Casts | 30+ | ⚠️ |
| Empty Deps | 91 | ⚠️ |
| Build Status | Passing | ✅ |

---

## 📦 ARCHIVE GENERATED

`FORENSIC_AUDIT_2026-02-16.zip` created with:
- `src/pages/`
- `src/components/`
- `src/state/`
- `src/hooks/`
- `src/engine/`
- `src/lib/`
- `src/routes/`
- `src/terrain/`
- `src/render/`
- `src/sim/`
- `src/logic/`
- `src/workers/`
- `public/`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`

---

**END OF AUDIT REPORT**
