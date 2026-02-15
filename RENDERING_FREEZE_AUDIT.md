# RENDERING/FREEZING AUDIT REPORT
**Date:** February 12, 2026  
**Severity:** CRITICAL  
**Status:** ROOT CAUSES IDENTIFIED

## 🔴 CRITICAL ISSUES FOUND

### 1. **ARCHITECTURAL FLAW: Conditional Rendering Instead of React Router** (CRITICAL)
**File:** `src/App.tsx`  
**Lines:** 1298-1600+

**Problem:**
The App component uses **multiple conditional returns** based on `headerViewMode` instead of proper React Router routing:

```typescript
if (headerViewMode === "initialize") return <div>...</div>
if (headerViewMode === "objective") return <div>...</div>
if (headerViewMode === "compare") return <div>...</div>
// ... 8+ conditional branches
```

**Why This Causes Freezing:**
1. **Complete Component Tree Replacement:** When switching views, React unmounts the ENTIRE previous component tree and mounts a completely new one
2. **No Transition Period:** There's no graceful handoff - old components are destroyed while new ones mount simultaneously
3. **Cleanup Race Conditions:** If old components have running async operations, canvas loops, or timers that haven't completed cleanup, they continue executing while the new view tries to render
4. **Memory Accumulation:** Each navigation creates a new component tree while potentially leaving references to old ones

**Impact:**
- Tab highlights change but page content "sticks" from previous screen
- Eventually affects ALL pages as memory/references accumulate
- Classic symptom of improper component lifecycle management

---

### 2. **ANIMATION FRAME LEAK: MountainEngine RequestAnimationFrame** (HIGH)
**File:** `src/components/engine/MountainEngine.tsx`  
**Lines:** 128, 158, 451, 454

**Problem:**
The `draw()` function calls `requestAnimationFrame` recursively in MULTIPLE locations:

```typescript
function draw() {
  // ... drawing code ...
  if (!baseCurve.length) {
    frameId = requestAnimationFrame(draw); // ❌ Line 158
    return;
  }
  // ... more drawing ...
  frameId = requestAnimationFrame(draw);   // ❌ Line 451
}
frameId = requestAnimationFrame(draw);     // ❌ Line 454
```

**Why This Causes Issues:**
- `frameId` variable gets **overwritten** on each recursive call
- Cleanup only cancels the **LAST** frameId value
- If multiple frames are queued before unmount, only one gets canceled
- Results in "orphaned" animation frames continuing to execute

**Symptoms:**
- Canvas renders continue after component unmounts
- Increasing CPU usage over time
- UI becomes progressively more sluggish

---

### 3. **CANVAS RENDERING WITHOUT MOUNTING CHECKS** (MEDIUM)
**Files:**
- `src/components/compare/DivergenceField.tsx` (line 79-150)
- `src/components/compare/SpaghettiCanvas.tsx` (line 48-100)
- `src/components/compare/OutcomeHistogram.tsx` (line 119+)

**Problem:**
Canvas rendering useEffects don't check if component is still mounted before drawing:

```typescript
useEffect(() => {
  // No isMounted check
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  // ... expensive drawing code ...
  
  // ✅ No cleanup return for canvas drawing loops
}, [data, monthIndex, N]);
```

**Why This Causes Issues:**
- If data changes rapidly during unmounting, effect fires but component is gone
- Canvas operations execute on potentially detached DOM elements
- No abort mechanism for in-progress drawing operations

---

### 4. **CONTINUOUS ANIMATION LOOP: DivergenceField Breathing Effect** (MEDIUM)
**File:** `src/components/compare/DivergenceField.tsx`  
**Lines:** 35-46

**Problem:**
```typescript
useEffect(() => {
  let raf = 0;
  const start = performance.now();
  const tick = () => {
    const t = (performance.now() - start) / 1000;
    setBreath((Math.sin(t * 1.15) + 1) * 0.5);
    raf = requestAnimationFrame(tick);  // ✅ Properly cleaned up
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf); // ✅ HAS cleanup
}, []);
```

**Note:** This one actually HAS proper cleanup, but when combined with Issue #1 (complete tree replacement), the cleanup may not execute in time.

---

### 5. **EVENT LISTENER ACCUMULATION POTENTIAL** (LOW)
**Files:**
- `src/pages/initialize/InitializeBaselinePage.tsx` (line 525)
- `src/App.tsx` (line 702)

**Status:** ✅ PROPERLY CLEANED UP
Both have proper cleanup functions, but Issue #1 can prevent timely execution.

---

## 🎯 ROOT CAUSE SUMMARY

The **primary issue** is **Issue #1**: The app's routing architecture causes complete component tree destruction/recreation on every navigation, which:

1. Overwhelms React's reconciliation
2. Prevents proper cleanup of animation frames and canvases
3. Creates race conditions between unmounting and mounting components
4. Accumulates memory and references over time

Secondary issues (#2-4) exacerbate the problem by leaving active animation loops and canvas operations that continue after unmount.

---

## ✅ RECOMMENDED FIXES

### FIX 1: Convert to Proper React Router (CRITICAL)
**Implementation:** Replace conditional rendering in App.tsx with nested Routes

### FIX 2: Add Mounting Guards to Canvas Animation Loops (HIGH)
**Implementation:**
- Use useRef to track component mounting state
- Check `isMountedRef.current` before each requestAnimationFrame
- Store frameId in ref instead of local variable

### FIX 3: Add Canvas Drawing Abort Mechanisms (MEDIUM)
**Implementation:**
- Check if canvas parent exists before drawing
- Add try-catch around canvas operations
- Use AbortController pattern for canvas effects

### FIX 4: Add React.memo to Heavy Components (LOW)
**Implementation:**
- Wrap page components with React.memo
- Prevent unnecessary re-renders during transitions

---

## 📊 IMPACT ASSESSMENT

**Without Fixes:**
- Progressive performance degradation
- Eventually all pages become unresponsive
- Memory leaks accumulate
- Requires page refresh to recover

**With Fixes:**
- Smooth page transitions
- Stable memory usage
- Proper cleanup on navigation
- No animation frame leaks

---

## 🚀 NEXT STEPS

1. ✅ Audit complete - issues identified
2. ⏳ Implement Fix #1 (routing architecture)
3. ⏳ Implement Fix #2 (animation frame guards)
4. ⏳ Implement Fix #3 (canvas abort mechanisms)
5. ⏳ Test navigation flow across all pages
6. ⏳ Monitor for memory leaks and performance

---

**END OF AUDIT**
