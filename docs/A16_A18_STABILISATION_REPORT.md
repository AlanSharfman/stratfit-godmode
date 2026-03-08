# A16–A18 Stabilisation Sweep — Final Report

**Branch:** `checkpoint/a16-a18-stabilisation`  
**Base:** `e106a90` (checkpoint/overlay-fix-20260303-0050)  
**Date:** 2025-06-11  

---

## Commits

| Phase | Hash | Message | Files | +/− |
|-------|------|---------|-------|-----|
| A16 | `31d5b89` | enforce single terrain authority + single height pipeline | 12 | +389 / −57 |
| A17 | `6a1020e` | enforce single engineResults authority across routes | 2 | +18 / −1 |
| A18 | `a46d1c2` | purge dead files, fix routes, remove Next.js directives, connect CSS | 39 | +11 / −34 |

---

## A16 — Terrain Authority

### Single TerrainStage

- **Canonical:** `TerrainStage` (V1) — used by PositionPage, StudioPage, WelcomePage, SplitTerrainView.
- **V2 (`TerrainStageV2`):** used only by unrouted `PositionScene` → moved to `src/legacy/position-v2/`.
- No V2 terrain imports remain in any routed page.

### Shared Tuning Types

- Created `src/terrain/terrainTuning.ts` — single source for `TerrainTuningParams` type and `DEFAULT_TUNING` constants.
- `TerrainSurfaceV2.tsx` now re-exports from shared location instead of defining its own types.
- `TerrainTuningPanel` moved from `terrain/v2/` to `terrain/` (shared).

### Rig Consolidation

- `CameraCompositionRig` → `src/scene/camera/CameraCompositionRig.tsx`
- `SkyAtmosphere` → `src/scene/rigs/SkyAtmosphere.tsx`
- All 5 consumers updated. Original `pages/position-v2/rigs/` location cleared.

### Single Height Pipeline

- **Metrics:** `deriveTerrainMetrics()` in `terrainFromBaseline.ts` — single computation.
- **Mesh:** `buildTerrainWithMetrics()` + `heightfieldFromModel()` in `buildTerrain.ts` — scaling applied once.
- **Query:** `sampleTerrainHeight()` — single API, no secondary height sources.
- **Shaders:** Both `injectMorphing.ts` (TME) and `injectTopography.ts` (STM) are purely additive (`transformed.z += …`). No flatten, no overwrite.
- **Deleted:** `src/terrain/smooth.ts` — dead code, never imported.

---

## A17 — Store Authority

### Single engineResults Source

- **Canonical:** `phase1ScenarioStore` (`src/state/phase1ScenarioStore.ts`) — used by all routed pages (Position, Decision, Studio, Compare).
- **Legacy:** `scenarioStore` (`src/state/scenarioStore.ts`) — marked `@deprecated`. Used by ~67 legacy components, **none of which are imported by any routed page**.

### Actions Taken

- Added canonical header comment to `phase1ScenarioStore.ts`.
- Added `@deprecated` JSDoc header to `scenarioStore.ts`.
- No functional changes — store separation is clean at the route boundary.

---

## A18 — Hygiene Cleanup

### A18.1 — Dead File Purge

Moved **31 dead files** out of the active source tree:

| Destination | Files |
|-------------|-------|
| `src/legacy/position-dead/` | 23 files — PositionScene, PositionLeftRail, PositionRightRail, PositionPageV2, PositionDemoScrubber, useDemoScriptBridge, useDemoTourHooks, useRenderWatchdog, useOverlayPersistence, useNarrationListener, exportCanvasSnapshot, AIInsightPanel (+CSS), DiagnosticsStack, KPIOverlay, PositionBriefingPanel, TerrainLegend, TimeScaleControl, DiagnosticsSummary, ExecutiveNarrativeCard, PositionHeaderBar, PositionNarrative.module.css, PositionScene.module.css |
| `src/legacy/position-v2/` | 8 files — PositionPageV2 (+CSS), PositionScene (+CSS), rigs/CinematicLighting, HorizonAtmosphere, TerrainBreathRig, VolumetricHorizon |

`src/pages/position-v2/` directory fully removed.  
`positionState.ts` retained in `pages/position/` — still live (used by selectors/components).

### A18.2 — Dead Routes

- **LIVE_NAV:** reduced to Position, Studio, Compare (removed Compass, Assessment, Roadmap — no routes exist).
- **UI_NAV_ITEMS:** reduced to initiate, position, studio, compare (removed insights, risk, valuation, assessment, roadmap, coming).
- **ROUTE_CONTRACT:** locked to 5 paths: `/position`, `/studio`, `/compare`, `/initiate`, `/decision`.
- **MainNav.tsx:** removed invalid `item.key === "coming"` conditional class.

### A18.3 — Next.js Directive Removal

Removed `'use client'` from:
- `src/components/ui/Toaster.tsx`
- `src/components/impact/ImpactGodMode.tsx`
- `src/components/simulate/SimulateOverlay.tsx`

### A18.4 — Dead CSS Cleanup

- `src/index.css` (global reset, tokens, keyframes) was orphaned — never imported.
- Added `import "./index.css"` to `src/main.tsx` to connect the style chain.
- `src/styles/` directory (reset, tokens, base, layout, utilities) now reachable via this import.

---

## Build Gate

| Metric | Before (e106a90) | After (a46d1c2) |
|--------|-------------------|------------------|
| tsc --noEmit | ✅ clean | ✅ clean |
| Modules | 1,124 | 1,125 |
| JS bundle (gzip) | 438 KB | 438 KB |
| CSS bundle (gzip) | — | 39 KB (index) + 6 KB (InitializeBaselineV2) |

No regressions. CSS bundle now appears in output due to the reconnected `index.css` import chain.

---

## Known Remaining Items

| Item | Scope | Risk |
|------|-------|------|
| ~67 legacy components import `scenarioStore` | None in route graph | Low — quarantined by deprecated marker |
| `PositionPage.tsx` uses 66 hooks | Complexity debt | Low — functional, no dual-import |
| 6 `.current!` null assertions in terrain code | Minor type safety | Low — runtime-safe in R3F lifecycle |
| `src/legacy/` accumulating dead files | Disk only | None — excluded from bundle by tree-shaking |

---

## Done Criteria ✅

- [x] 3 atomic commits on `checkpoint/a16-a18-stabilisation`
- [x] tsc --noEmit clean
- [x] npm run build clean (438 KB gzip)
- [x] No dead routes in LIVE_NAV / UI_NAV_ITEMS
- [x] No V2 terrain imports in routed pages
- [x] Single height pipeline confirmed (no shader overwrite)
- [x] Single engineResults authority (phase1ScenarioStore canonical)
- [x] No Next.js directives
- [x] Orphaned CSS connected
