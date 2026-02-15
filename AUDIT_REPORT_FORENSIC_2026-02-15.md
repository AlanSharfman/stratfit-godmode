# STRATFIT — FULL FORENSIC AUDIT (ZERO ASSUMPTIONS / ZERO GUESSWORK)

**Date:** 2026-02-15  
**Mode:** AUDIT ONLY (no fixes applied)  
**OS:** Windows  

---

## 1) Scope & Constraints

- **Scope:** Codebase-level forensic audit focused on rendering/freezing risk, state persistence drift, and lifecycle hazards.
- **Constraints honored:** Audit-only (no refactors, no behavioral changes). Evidence is from static code + observed tooling output.
- **Evidence format:** Every P0/P1 includes exact `path:line` citations and a concrete failure mode.

---

## 2) Environment & Build Status

- **Node:** v24.11.1
- **npm:** 11.6.2
- **Typecheck:** `npm run typecheck` → **exit 0** (observed)
- **Dev server (`npm run dev`):** Observed starting successfully on `http://127.0.0.1:62001/` (ROLLDOWN-VITE v7.2.5). Historical context indicates repeated `exit 1` runs prior to this session.

---

## 3) Mandatory Search Evidence (Commands + Outputs)

The following are the mandatory “broad scans” re-run as evidence. (Outputs are truncated to the highest-signal hits to keep this report readable.)

### 3.1 Persistence / Storage

**Search:** `localStorage.|sessionStorage.|indexedDB|persist(|createJSONStorage`

Representative hits:
- `src/state/scenarioStore.ts:306` (`persist(`)
- `src/state/simulationStore.ts:161` (`persist(`)
- `src/state/leverStore.ts:46` (`persist(`)
- `src/state/decisionStore.ts:152` (`persist(`)
- `src/state/savedSimulationsStore.ts:79` (`persist(`)
- `src/state/valuationStore.ts:277` (`persist(`)
- `src/system/SystemBaselineProvider.tsx:70` (localStorage baseline key)
- `src/utils/openaiStrategicQa.ts:53` (localStorage `OPENAI_API_KEY` override)

### 3.2 Global event listeners / CustomEvent bus

**Search:** `addEventListener(|removeEventListener(|CustomEvent(|dispatchEvent(`

Representative hits:
- `src/ui/causalEvents.ts:23` (`dispatchEvent(new CustomEvent(...))`)
- `src/ui/causalEvents.ts:35-36` (add/remove listener)
- `src/system/SystemBaselineProvider.tsx:82-83` (`storage` event listener)
- `src/components/terrain/TerrainFallback2D.tsx:229-232` (`webglcontextlost` listener)

### 3.3 Timers / RAF

**Search:** `setInterval(|setTimeout(|requestAnimationFrame(|cancelAnimationFrame(`

Representative hits:
- `src/components/engine/MountainEngine.tsx:149,183,483,487,493` (`requestAnimationFrame` / `cancelAnimationFrame`)
- `src/hooks/useDebouncedValue.ts:30-46,85-95` (RAF + timeout)
- `src/components/compare/DivergenceField.tsx:41-44` (RAF)

### 3.4 R3F/Three Canvas mounts

**Search:** `<Canvas|useFrame(|frameloop=`

Representative hits:
- `src/scene/SceneHost.tsx:9` (declares “Exactly ONE <Canvas>” rule)
- `src/scene/SceneHost.tsx:54-66` (mounts `<Canvas frameloop="always">`)
- `src/components/mountain/ScenarioMountain.tsx:1826-1844` (mounts `<Canvas>`)
- `src/components/terrain/TerrainCanvas.tsx:11-33` (mounts `<Canvas>`)
- `src/components/tradeoffs/TradeOffsTab.tsx:318-356` (mounts `<Canvas>`)

### 3.5 Camera controls / makeDefault contention

**Search:** `OrbitControls|CameraControls|makeDefault`

Representative hits:
- `src/demo/DemoTourDirector.tsx:118-121` (`<CameraControls makeDefault />`)
- `src/components/mountain/ScenarioMountain.tsx:1880-1891` (`<OrbitControls ... />`)
- `src/components/tradeoffs/TradeOffsTab.tsx:319-321` (`<PerspectiveCamera makeDefault />` + OrbitControls)
- `src/components/terrain/TerrainStage.tsx:91-103` (`<OrbitControls ... />`)

---

## 4) Triage Summary (Top Risks)

### P0 candidates (highest confidence)

1) **“Single Canvas” invariant contradicted by multiple Canvas mounts** across app surfaces → multiple WebGL contexts, increased GPU/memory pressure, and inconsistent global listeners.
2) **Global `webglcontextlost` handler attached to all canvases** (not scoped) → one context loss can flip unrelated surfaces into 2D fallback.
3) **Competing camera-control defaults** (`makeDefault` in multiple trees) → control handoff instability, especially when multiple canvases exist.
4) **Persisted state includes `Date` objects** but Zustand persist serializes via JSON → Date hydration drift (strings vs Date), potential runtime errors or logic drift.

---

## 5) Risk Register (P0–P3)

| ID | Sev | Title | Primary location (evidence) | Failure mode | Minimal containment action |
|---:|:---:|---|---|---|---|
| R-001 | P0 | Single-Canvas invariant violated | `src/scene/SceneHost.tsx:9,54-66`; `src/components/mountain/ScenarioMountain.tsx:1826-1844`; `src/components/terrain/TerrainCanvas.tsx:11-33`; `src/components/tradeoffs/TradeOffsTab.tsx:318-356` | Multiple WebGL contexts, duplicated render loops, higher GPU memory pressure, inconsistent global listeners | Freeze additional Canvas mounts behind feature flags; ensure only one 3D surface is reachable at a time until unified |
| R-002 | P0 | Global context-loss listener attached to all canvases | `src/components/terrain/TerrainFallback2D.tsx:228-232` | Any canvas context loss triggers fallback state unrelated to the component tree that failed | Scope listener to the specific R3F canvas element only |
| R-003 | P0 | Competing control “defaults” | `src/demo/DemoTourDirector.tsx:118-121`; `src/components/tradeoffs/TradeOffsTab.tsx:319-321`; `src/components/mountain/ScenarioMountain.tsx:1880-1891` | Controls fight for pointer/camera ownership; unpredictable interaction/camera | Ensure only one `makeDefault` controller exists per canvas, and avoid multiple canvases |
| R-004 | P0 | Persisted `Date` objects without rehydration | `src/state/scenarioStore.ts:371-411` + `src/state/scenarioStore.ts:541-589` | JSON persist turns Dates into strings; code/types assume Dates; subtle logic drift / runtime errors | Store ISO strings, or add explicit hydration in `merge` before use |
| R-005 | P1 | LocalStorage API key override (`OPENAI_API_KEY`) | `src/utils/openaiStrategicQa.ts:53`; `src/utils/openaiScenarioQa.ts:28` | Environment key can be silently overridden by browser storage; unexpected behavior/security footgun | Disable LS override outside explicit dev builds |
| R-006 | P1 | Alias fields for active scenario | `src/state/scenarioStore.ts:263-270` + setters `src/state/scenarioStore.ts:345-346` | `activeScenarioId` and `scenario` can diverge if not consistently updated | Remove alias or strictly derive one from the other |

---

## 6) P0 Deep Dives (Evidence + Repro Steps)

### 6.1 R-001 — Single-Canvas invariant violated

**Declared invariant:**
- `src/scene/SceneHost.tsx:9-13` declares “Exactly ONE <Canvas> … No route component is allowed to mount a Canvas.”

**Actual Canvas mounts (evidence):**
- `src/scene/SceneHost.tsx:54-66` mounts global `<Canvas frameloop="always">`.
- `src/components/mountain/ScenarioMountain.tsx:1826-1844` mounts `<Canvas>` inside the component.
- `src/components/terrain/TerrainCanvas.tsx:11-33` mounts `<Canvas>`.
- `src/components/tradeoffs/TradeOffsTab.tsx:318-356` mounts `<Canvas>`.

**Observed failure mode:**
- Multiple WebGL contexts can coexist in one session. This increases GPU memory pressure and the chance of context loss; it also increases the risk of “competing default controls” and global listener coupling.

**Observation steps (no guesswork):**
1) Static: confirm multiple `<Canvas>` occurrences via search (see Section 3.4).
2) Runtime: navigate across surfaces that mount different canvases; observe multiple canvases in DOM (`document.querySelectorAll('canvas').length`).

### 6.2 R-002 — Global webglcontextlost listener attached to all canvases

**Evidence:**
- `src/components/terrain/TerrainFallback2D.tsx:228-232` calls `document.querySelectorAll("canvas")` and binds `webglcontextlost` to every canvas.

**Failure mode:**
- A context loss event from any canvas can cause unrelated “TerrainWithFallback” wrappers to flip to 2D fallback.

**Observation steps:**
1) Have multiple canvases mounted (R-001).
2) Trigger/observe a context loss in any canvas.
3) Note fallback toggling in other wrappers that did not lose their context.

### 6.3 R-003 — Competing camera-control defaults

**Evidence:**
- `src/demo/DemoTourDirector.tsx:118-121` sets `<CameraControls makeDefault />`.
- `src/components/tradeoffs/TradeOffsTab.tsx:319-321` sets `<PerspectiveCamera makeDefault />` inside a separate canvas.
- `src/components/mountain/ScenarioMountain.tsx:1880-1891` uses `<OrbitControls ...>`.

**Failure mode:**
- Within a single canvas tree, multiple controllers attempting to be “default” can steal pointer/camera control; across multiple canvases, user expectation of a single authoritative camera is violated.

### 6.4 R-004 — Persisted Date objects without rehydration

**Evidence:**
- `src/state/scenarioStore.ts:371-411` creates scenarios with `createdAt: new Date()`, `updatedAt: new Date()`, and `simulation.simulatedAt: new Date()`.
- `src/state/scenarioStore.ts:541-556` persists `baseline` and `savedScenarios`.

**Failure mode:**
- JSON persistence converts `Date` objects to strings; after hydration, fields typed as `Date` may be strings. Any code calling `toLocaleDateString()`, comparisons, or date math may behave incorrectly.

---

## 7) P1 Deep Dives (Evidence + Repro Steps)

### 7.1 R-005 — localStorage `OPENAI_API_KEY` override

**Evidence:**
- `src/utils/openaiStrategicQa.ts:53` reads `window.localStorage.getItem("OPENAI_API_KEY")`.
- `src/utils/openaiScenarioQa.ts:28` reads the same override.

**Failure mode:**
- Browser state overrides environment configuration; behavior changes cross-session and cross-user. If screenshots/logs are shared, it’s easy to misattribute results to code changes.

### 7.2 R-006 — alias scenario fields

**Evidence:**
- `src/state/scenarioStore.ts:263-270` declares both `activeScenarioId` and `scenario`.
- `src/state/scenarioStore.ts:345-346` setter sets both.
- `src/state/scenarioStore.ts:569-579` `merge` hard-resets both to `'base'` on hydration.

**Failure mode:**
- Divergence risk if any setter updates only one field (including future code).

---

## 8) Dirty State / Persistence Inventory

Zustand persisted stores (high-level inventory):
- `src/state/scenarioStore.ts:306+` name `stratfit-scenarios`, version 2, persists baseline/savedScenarios/strategies/compareViewMode/objective/derivedKPIs.
- `src/state/simulationStore.ts:161+` persisted simulation status/results (separate store).
- `src/state/leverStore.ts:46+` persisted lever history/config.
- `src/state/decisionStore.ts:152+` persisted decisions.
- `src/state/savedSimulationsStore.ts:79+` persisted simulation saves.
- `src/state/valuationStore.ts:277+` persisted valuation config.

Non-Zustand localStorage usage:
- Baseline truth layer: `src/system/SystemBaselineProvider.tsx:70+`
- Scenario notes: `src/utils/scenarioNotes.ts:37+`
- AI panel mode: `src/components/AIIntelligence.tsx:345+`

---

## 9) Rendering / Canvas / Controls Inventory

Known R3F Canvas mount sites:
- `src/scene/SceneHost.tsx:54-66`
- `src/components/mountain/ScenarioMountain.tsx:1826-1844`
- `src/components/terrain/TerrainCanvas.tsx:11-33`
- `src/components/tradeoffs/TradeOffsTab.tsx:318-356`

Known control systems:
- `OrbitControls`: `src/components/mountain/ScenarioMountain.tsx:1880+`, `src/components/terrain/TerrainStage.tsx:91+`, `src/components/tradeoffs/TradeOffsTab.tsx:320+`
- `CameraControls makeDefault`: `src/demo/DemoTourDirector.tsx:118-121`

Transparency/tone-mapping risk hotspots:
- `src/components/mountain/ScenarioMountain.tsx:593-613` uses `transparent`, `depthWrite={godMode}`, `toneMapped={godMode}` (mode-dependent rendering flags).
- `src/components/terrain/TerrainCanvas.tsx:16-30` sets `alpha:false`, ACES filmic tone mapping.

---

## 10) Containment Checklist (Minimal / No Refactor)

P0 containment (do first):
- Enforce a single active 3D surface per session (feature-flag or route-gate extra canvases).
- Scope `webglcontextlost` listener to the owning canvas only (not `querySelectorAll('canvas')`).
- Ensure only one controller is `makeDefault` per canvas.
- Eliminate persisted `Date` objects (store ISO strings) or add explicit hydration in persist `merge`.

P1 containment:
- Disable localStorage API key overrides outside explicit dev.
- Remove/lock alias fields in persisted state to prevent drift.

---

## 11) Appendix (File Index / Notes)

Top high-risk files inspected / referenced in this audit:
1) `src/components/mountain/ScenarioMountain.tsx`
2) `src/scene/SceneHost.tsx`
3) `src/components/terrain/TerrainFallback2D.tsx`
4) `src/demo/DemoTourDirector.tsx`
5) `src/state/scenarioStore.ts`
6) `src/components/terrain/TerrainCanvas.tsx`
7) `src/components/terrain/TerrainStage.tsx`
8) `src/components/tradeoffs/TradeOffsTab.tsx`
9) `src/components/compare/CompareView.tsx`
10) `src/components/simulate/SimulateOverlay.tsx`

Notes:
- Additional audit material already exists in-repo (e.g. `FORENSIC_AUDIT_FREEZING.md`, `RENDERING_FREEZE_AUDIT.md`). This report is a fresh, evidence-driven snapshot dated 2026-02-15.
