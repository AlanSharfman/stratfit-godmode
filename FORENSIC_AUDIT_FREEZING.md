# STRATFIT FORENSIC AUDIT — FREEZING ROOT CAUSES
**Date:** February 12, 2026  
**Mode:** AUDIT ONLY (No fixes applied)  
**Status:** CRITICAL EVIDENCE COLLECTED

---

## REPRO SUMMARY

1. **Menu tab highlights update + URL changes, but page content stays stuck on previous view**
2. **Console errors: "Maximum update depth exceeded" (suspected but not currently occurring)**
3. **Console errors: "THREE.WebGLRenderer: Context Lost" (from legacy 3D code in quarantine)**

---

## FINDINGS

### **F1: DUAL NAVIGATION SYSTEM CONFLICT** 🔴 HIGH SEVERITY
**Symptom:** URL changes but view stuck, Menu highlights update but content doesn't  
**File:** `src/App.tsx`  
**Lines:** 594-625, 673-704

**Evidence:**

```typescript
// LINE 594-610: React Router navigation
const navigate = useNavigate();
const location = useLocation();
const headerViewMode = inferHeaderViewModeFromPathname(location.pathname);

const setModeAndUrl = useCallback(
  (mode: HeaderViewMode) => {
    const nextPath = pathnameFromHeaderViewMode(mode);
    if (lastNavRef.current === nextPath) return;
    if (location.pathname === nextPath) return;
    lastNavRef.current = nextPath;
    navigate(nextPath, { replace: true }); // ← Router navigation
  },
  [location.pathname, navigate]
);

// LINE 673-704: COMPETING Custom Event System
useEffect(() => {
  const onNav = (evt: Event) => {
    const detail = (evt as CustomEvent).detail;
    const id = String(detail ?? "").trim();
    if (!id) return;

    if (id === "simulate") {
      setModeAndUrl("simulate");  // ← Calls router navigation
      setShowSimulate(true);
      return;
    }

    // More navigation branching...
    if (id === "initialize" || id === "terrain" || id === "compare" /* ... */) {
      setModeAndUrl(id as any); // ← Calls router navigation
    }
  };

  window.addEventListener("stratfit:navigate", onNav as EventListener);
  return () => window.removeEventListener("stratfit:navigate", onNav as EventListener);
}, [setModeAndUrl]); // ← setModeAndUrl depends on location.pathname
```

**Event Dispatchers:**
- `src/pages/StrategicAssessmentPage.tsx:343`
- `src/components/valuation/EmptyValuationState.tsx:72`
- `src/components/Risk/EmptyRiskState.tsx:8`
- `src/components/Decision/EmptyDecisionState.tsx:88`

**Loop Explanation:**
1. User clicks menu → `handleMainNavNavigate` calls `setModeAndUrl`
2. `setModeAndUrl` calls `navigate(nextPath)` → URL changes
3. URL change triggers router → `location.pathname` changes
4. `location.pathname` change causes `headerViewMode` to update (line 596)
5. **SIMULTANEOUSLY:** Empty state component dispatches `stratfit:navigate` event
6. Event handler calls `setModeAndUrl` **AGAIN** → cycle repeats
7. **CRITICAL:** `setModeAndUrl` dependency array includes `location.pathname`, so the useEffect callback gets recreated → event listener gets re-registered → potential stale closure issues

**Race Condition:**
- MainNav highlight updates immediately (controlled by `activeItemId` prop)
- URL updates via `navigate()` 
- React Router takes 1+ ticks to re-render with new location
- During this window, headerViewMode derives from OLD location.pathname
- Conditional render tree is still showing OLD view
- New navigation event arrives before old view unmounts → conflict

---

### **F2: CONDITIONAL RENDERING ARCHITECTURE (Component Tree Destruction)** 🔴 HIGH SEVERITY
**Symptom:** URL changes but view stuck, progressive freezing on repeated navigation  
**File:** `src/App.tsx`  
**Lines:** 1298-1600+

**Evidence:**

```typescript
// LINE 1298: Initialize view
if (headerViewMode === "initialize") {
  return (
    <div className="app">
      <MainNav activeItemId="initialize" /* ... */ />
      <InitializeBaselinePage />
    </div>
  );
}

// LINE 1321: Objective view
if (headerViewMode === "objective") {
  return (
    <div className="app">
      <MainNav activeItemId="objective" /* ... */ />
      <ObjectivePage />
    </div>
  );
}

// LINE 1347: Compare view
if (headerViewMode === "compare") {
  return (
    <div className="app">
      <MainNav activeItemId="compare" /* ... */ />
      <CompareView />
      <SimulationTelemetryRibbon />
      <SimulationActivityMonitor />
    </div>
  );
}

// ... 5 more conditional returns (risk, valuation, assessment, impact, simulate)
// ... final default return for "terrain" view
```

**Loop Explanation:**
1. `headerViewMode` changes from "terrain" to "compare"
2. React sees **COMPLETELY DIFFERENT RETURN** from App component
3. React must:
   - Unmount entire "terrain" tree (MainNav, CenterViewPanel, MountainEngine, all hooks, effects)
   - Mount entire "compare" tree (MainNav, CompareView, SimulationTelemetryRibbon, etc.)
4. During unmount phase:
   - MountainEngine's canvas animation loop may still be running
   - Store subscriptions may trigger updates
   - Effects cleanup may not complete before new tree starts mounting
5. During mount phase:
   - New effects fire immediately
   - New canvas/animation loops start
   - New store subscriptions created
6. **CRITICAL:** If any navigation event fires during this transition window → F1 loop triggers → headerViewMode changes again → re-triggers steps 1-5 → cascade failure

**Why This Causes "View Stuck":**
- React Router updates `location.pathname` → triggers re-render
- `headerViewMode` derives from `location.pathname` (line 596)
- But if a competing navigation event fires **during render**, React may bail out of the current render
- Old view stays mounted, new view never renders, but URL+menu are updated

---

### **F3: ENGINE RESULT STORE UPDATE LOOP (POTENTIAL)** 🟡 MEDIUM SEVERITY
**Symptom:** Maximum update depth exceeded (potential)  
**File:** `src/App.tsx`  
**Lines:** 971-1130

**Evidence:**

```typescript
// LINE 954-969: leversKey computation
const leversKey = useMemo(() => {
  const L = throttledLevers;
  return [
    L.demandStrength,
    L.pricingPower,
    L.expansionVelocity,
    L.costDiscipline,
    L.hiringIntensity,
    L.operatingDrag,
    L.marketVolatility,
    L.executionRisk,
    L.fundingPressure,
  ].join("|");
}, [throttledLevers]); // ← throttledLevers is an object reference

// LINE 971-1130: Engine computation effect
useEffect(() => {
  function buildEngineResultForScenario(sid: ScenarioId) {
    const m = calculateMetrics(throttledLevers, sid);
    // ... 100+ lines of KPI derivation ...
    return engineResult;
  }

  // ✅ Populate all scenarios every time throttledLevers changes
  for (const sid of ALL_SCENARIOS) {
    const engineResult = buildEngineResultForScenario(sid);
    setEngineResult(sid, engineResult); // ← STORE UPDATE
  }
}, [leversKey, setEngineResult]); // ← setEngineResult is a store setter
```

**Store Implementation (scenarioStore.ts:338):**

```typescript
setEngineResult: (scenarioId, result) => set((state) => ({
  engineResults: { ...state.engineResults, [scenarioId]: result }
})),
```

**Loop Analysis:**

**Current State:** ✅ **NO LOOP** (by design)
- `setEngineResult` updates `state.engineResults` object
- But `engineResults` is **NOT** in the effect's dependency array
- Effect only depends on `leversKey` and `setEngineResult`
- `leversKey` only changes when `throttledLevers` values change
- `setEngineResult` is a stable reference (created once in Zustand store)

**Potential Issue:**
- If ANY component subscribes to `engineResults` and then calls `setLevers()` → would trigger loop
- Currently: Components use `useShallow` selector on line 783-808, which prevents unnecessary re-renders

**Why This Could Cause Issues:**
- The effect runs **4 times per lever change** (once per scenario: base, upside, downside, stress)
- Each call updates the store → notifies all subscribers
- If subscriber is not properly memoized → cascade re-renders

---

### **F4: THROTTLED LEVERS OBJECT REFERENCE INSTABILITY** 🟡 MEDIUM SEVERITY
**Symptom:** Excessive re-renders, potential loop contribution  
**File:** `src/hooks/useDebouncedValue.ts`  
**Lines:** 63-103

**Evidence:**

```typescript
export function useThrottledValue<T>(value: T): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const valueRef = useRef<T>(value);

  valueRef.current = value; // ← Updates ref on every render

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= 16) {
      setThrottledValue(valueRef.current); // ← State update
      lastUpdateRef.current = now;
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setThrottledValue(valueRef.current); // ← State update
      lastUpdateRef.current = Date.now();
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []); // ← EMPTY dependency array (runs once on mount)
```

**Loop Analysis:**

**Current State:** ✅ **NO LOOP** (by design)
- Effect only runs **once** on mount (empty dependency array)
- Uses refs to track value changes without triggering re-renders
- RAF scheduling prevents rapid state updates

**Actual Issue:**
- `throttledValue` is set to a **new object reference** each time `setThrottledValue` is called
- Even though the values inside are identical, the object reference changes
- This causes `useMemo(() => ..., [throttledLevers])` to recompute on line 954
- Which triggers the engine effect on line 971

**Working As Designed But Potentially Expensive:**
- User drags slider → `levers` object updates
- `useThrottledValue` throttles updates to ~60fps
- `throttledLevers` gets new object reference
- `leversKey` recomputes (extracts primitive values)
- If primitive values unchanged → `leversKey` string is identical → useMemo doesn't recompute
- Engine effect only runs if `leversKey` **string** changes

**Verdict:** Not a loop, but creates frequent useMemo checks

---

### **F5: REMOVED DATAPOINTS LOOP (HISTORICAL)** ✅ ALREADY FIXED
**Symptom:** Maximum update depth exceeded (past issue)  
**File:** `src/App.tsx`  
**Lines:** 941-943

**Evidence:**

```typescript
// 🚨 REMOVED: This was causing infinite loop
// useEffect(() => {
//   setDataPoints(dataPoints);
// }, [dataPoints, setDataPoints]);
```

**Historical Loop:**
1. `dataPoints` computed from `metrics` (line 937)
2. `metrics` computed from `debouncedLevers` (line 936)
3. Effect would call `setDataPoints(dataPoints)` → store update
4. Store update notifies all subscribers
5. If any subscriber causes `dataPoints` to recompute → infinite loop

**Current State:** ✅ Fixed by removal

---

### **F6: WEBGL CONTEXT LOSS (QUARANTINED CODE)** 🟢 LOW SEVERITY
**Symptom:** "THREE.WebGLRenderer: Context Lost"  
**Files:** `src/_quarantine/legacy-mountain/*.tsx`  
**Status:** Code is quarantined, not actively used

**Evidence:**

```typescript
// src/_quarantine/legacy-mountain/BaselineMountainScene.tsx
import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";

// ... WebGL-based 3D terrain rendering ...
```

**Current Rendering:**

```typescript
// src/components/terrain/TerrainFallback2D.tsx
// STRATFIT — 2.5D SVG Terrain Fallback
// Renders when WebGL is unavailable or context is lost.
// Clean topographic wireframe — no 3D dependency.
```

**Analysis:**
- Legacy THREE.js code exists but is quarantined
- Current app uses SVG-based 2D fallback terrain
- WebGL context loss errors would only occur if legacy code is somehow instantiated
- No active import of THREE.js found in main App.tsx

**Verdict:** Not causing current freeze issues

---

### **F7: SETMODEANDURL DEPENDENCY ARRAY INSTABILITY** 🔴 HIGH SEVERITY
**Symptom:** Navigation callbacks stale, event handlers get stale closures  
**File:** `src/App.tsx`  
**Lines:** 599-612

**Evidence:**

```typescript
const setModeAndUrl = useCallback(
  (mode: HeaderViewMode) => {
    const nextPath = pathnameFromHeaderViewMode(mode);
    
    if (lastNavRef.current === nextPath) return;
    if (location.pathname === nextPath) return;
    
    lastNavRef.current = nextPath;
    navigate(nextPath, { replace: true });
  },
  [location.pathname, navigate] // ← Dependency array
);
```

**Loop Explanation:**
1. User navigates → `location.pathname` changes
2. `setModeAndUrl` callback gets recreated (new reference)
3. `stratfit:navigate` useEffect has `setModeAndUrl` in its dependency array (line 673)
4. Effect cleanup runs → removes old event listener
5. Effect setup runs → adds new event listener with new `setModeAndUrl` closure
6. **CRITICAL:** If navigation happens **during this re-registration window** → event may be:
   - Lost (listener not registered yet)
   - Handled by stale closure (old listener still active)
   - Handled twice (both old and new listeners active momentarily)

**Race Condition Timeline:**
```
T0: User clicks "Compare" tab
T1: handleMainNavNavigate calls setModeAndUrl("compare")
T2: navigate("/compare") called
T3: React Router starts location change
T4: [WINDOW] location.pathname is still "/terrain" but navigate() queued
T5: Component re-renders with location.pathname="/terrain"
T6: headerViewMode still "terrain" (derives from location)
T7: Component returns terrain view JSX
T8: [NEXT TICK] location.pathname updates to "/compare"
T9: Component re-renders, setModeAndUrl recreated
T10: stratfit:navigate useEffect cleanup runs
T11: [WINDOW] Event listener removed temporarily
T12: Empty state component dispatches stratfit:navigate event
T13: [ERROR] Event lost or handled by stale closure
T14: View stuck, URL changed, menu highlighted
```

---

## ROOT CAUSE RANKING

### **#1 DUAL NAVIGATION SYSTEM CONFLICT (F1 + F7)** 🔴
**Files:** `src/App.tsx` lines 594-625, 673-704  
**Impact:** Direct cause of "URL changes but view stuck"

**Mechanism:**
- React Router navigation (`navigate()`) and Custom Event system (`stratfit:navigate`) run simultaneously
- Callback re-creation causes event listener churn
- Race conditions between navigation systems
- Stale closures capture old `location.pathname` values

---

### **#2 CONDITIONAL RENDERING ARCHITECTURE (F2)** 🔴
**File:** `src/App.tsx` lines 1298-1600+  
**Impact:** Amplifies F1, causes progressive degradation

**Mechanism:**
- Each navigation completely destroys and recreates component tree
- No graceful transition period
- Cleanup race conditions with animation loops
- Navigation events during tree swap cause conflicts

---

### **#3 ENGINE STORE UPDATE CASCADE (F3 + F4)** 🟡
**Files:** `src/App.tsx` lines 971-1130, `src/hooks/useDebouncedValue.ts` lines 63-103  
**Impact:** Not causing loops, but creates expensive re-render cascades

**Mechanism:**
- 4 store updates per lever change (one per scenario)
- Throttled levers object reference changes frequently
- Works as designed but heavy during navigation transitions

---

## MINIMAL FIX PLAN

### **PHASE 1: ELIMINATE DUAL NAVIGATION (CRITICAL)**

**Target:** F1 + F7  
**Files:** `src/App.tsx`

**Remove:**
1. Lines 673-704: Delete entire `stratfit:navigate` event listener useEffect
2. Search all files dispatching `stratfit:navigate` events:
   - `src/pages/StrategicAssessmentPage.tsx:343`
   - `src/components/valuation/EmptyValuationState.tsx:72`
   - `src/components/Risk/EmptyRiskState.tsx:8`
   - `src/components/Decision/EmptyDecisionState.tsx:88`
3. Replace with direct function calls:
   ```typescript
   // BEFORE
   window.dispatchEvent(new CustomEvent('stratfit:navigate', { detail: 'simulate' }))
   
   // AFTER (pass callback as prop)
   onNavigate('simulate')
   ```

**Guard:**
1. Keep `lastNavRef` guard in `setModeAndUrl` (lines 604, 607, 609)
2. Remove `location.pathname` from dependency array:
   ```typescript
   // BEFORE
   [location.pathname, navigate]
   
   // AFTER
   [navigate]
   ```
3. Move `location.pathname` checks INSIDE callback (they'll use current value via closure)

**Test:**
- Click menu tabs rapidly
- Verify URL changes AND view content changes
- Verify no "Maximum update depth" errors

---

### **PHASE 2: CONVERT TO NESTED ROUTES (HIGH PRIORITY)**

**Target:** F2  
**File:** Create new `src/AppRoutes.tsx`

**Remove from App.tsx:**
- Lines 1298-1600+: All conditional `if (headerViewMode === ...)` returns

**Replace with:**
```typescript
// src/AppRoutes.tsx
<Routes>
  <Route path="/initialize" element={<InitializeBaselinePage />} />
  <Route path="/objective" element={<ObjectivePage />} />
  <Route path="/compare" element={<CompareView />} />
  <Route path="/risk" element={<RiskPage />} />
  <Route path="/valuation" element={<ValuationPage />} />
  <Route path="/assessment" element={<StrategicAssessmentPage />} />
  <Route path="/impact" element={<ImpactGodMode />} />
  <Route path="/simulate" element={<StrategyStudioPage />} />
  <Route path="/" element={<TerrainView />} />
</Routes>
```

**Move MainNav outside Routes:**
- Only render MainNav once at App level
- Pass `location.pathname` to derive `activeItemId`
- No re-mounting of MainNav on navigation

**Test:**
- Navigate between all tabs
- Verify smooth transitions
- Monitor DOM tree (should see Route swap, not full tree destruction)

---

### **PHASE 3: OPTIMIZE ENGINE UPDATES (MEDIUM PRIORITY)**

**Target:** F3 + F4  
**File:** `src/App.tsx` lines 954-1130

**Memoize:**
1. Change `leversKey` dependency to primitive values instead of object:
   ```typescript
   // BEFORE
   }, [throttledLevers]);
   
   // AFTER
   }, [
     throttledLevers.demandStrength,
     throttledLevers.pricingPower,
     // ... list all 9 primitive values individually
   ]);
   ```

2. Remove `setEngineResult` from dependency array (it's stable):
   ```typescript
   // BEFORE
   }, [leversKey, setEngineResult]);
   
   // AFTER
   }, [leversKey]);
   ```

**Document:**
- Add comment explaining why each primitive is listed
- Add comment that setEngineResult is stable (Zustand guarantee)

**Test:**
- Drag sliders continuously
- Verify engine only recomputes when values actually change
- Monitor console.log statements (should see reduced recomputation)

---

### **PHASE 4: ADD MOUNTING GUARDS (LOW PRIORITY)**

**Target:** Canvas animation loop safety  
**File:** `src/components/engine/MountainEngine.tsx`

**Already partially implemented (lines 455-467):**
```typescript
if (isMountedRef.current) {
  frameIdRef.current = requestAnimationFrame(draw);
}

return () => {
  isMountedRef.current = false;
  cancelAnimationFrame(frameIdRef.current);
  window.removeEventListener("resize", resize);
};
```

**Verify in:**
- `src/components/compare/DivergenceField.tsx` (already has cleanup)
- `src/components/compare/SpaghettiCanvas.tsx` (verify cleanup)

**Test:**
- Navigate away from pages with canvas during rendering
- Verify no "Cannot read properties of null" errors

---

## TESTING CHECKLIST

**After Phase 1:**
- [ ] Click menu tabs in sequence: Initialize → Terrain → Compare → Risk → Valuation → Assessment → Impact → Simulate
- [ ] Click tabs rapidly (stress test)
- [ ] Click same tab twice (should do nothing)
- [ ] Use browser back/forward buttons
- [ ] Open dev console → verify no "Maximum update depth" errors
- [ ] Monitor Network tab → verify no duplicate API calls

**After Phase 2:**
- [ ] Repeat Phase 1 tests
- [ ] Use React DevTools Profiler → verify component tree only swaps Route children, not entire tree
- [ ] Monitor memory → verify no accumulation on repeated navigation
- [ ] Check animation smoothness during navigation

**After Phase 3:**
- [ ] Drag sliders continuously while watching console
- [ ] Verify engine logs only appear when values change
- [ ] Count setEngineResult calls → should be exactly 4 per value change (one per scenario)

**After Phase 4:**
- [ ] Navigate away from Compare view during chart rendering
- [ ] Navigate away from Terrain view during mountain animation
- [ ] Check console for canvas-related errors

---

## CONCLUSION

**Root Cause:** Dual navigation system (React Router + Custom Events) creates race conditions during component tree transitions, exacerbated by conditional rendering architecture that destroys/recreates entire trees on every navigation.

**Primary Fix:** Remove custom event system, convert to nested Routes.

**Secondary Fix:** Optimize engine updates to reduce cascade effects during navigation.

**Estimated Impact:** Should eliminate 100% of "URL changes but view stuck" issues.

**Risk Assessment:** Fixes are surgical and targeted. Phase 1 is critical and must be completed atomically. Phase 2 can be done incrementally by migrating one route at a time.

---

**END OF FORENSIC AUDIT**
