# Phase 2.5: Diagnostics Core

**Branch:** `exec/godmode-phase-1`  
**Commit:** `f3b7f7b` - phase2.5: diagnostics core - global error capture + overlay  
**Date:** February 15, 2026

## Implementation Complete

### Files Created

1. **[src/diagnostics/diagTypes.ts](src/diagnostics/diagTypes.ts)**
   - `DiagLevel` type: "info" | "warn" | "error"
   - `DiagEvent` type: Event structure (ts, level, topic, msg, data)

2. **[src/diagnostics/DiagnosticsStore.ts](src/diagnostics/DiagnosticsStore.ts)**
   - Zustand store with ring buffer (max 200 events)
   - Actions: `setEnabled`, `log`, `clear`
   - `diag()` helper function for flight recorder logging
   - Events always recorded, even when overlay disabled

3. **[src/diagnostics/diagEnable.ts](src/diagnostics/diagEnable.ts)**
   - `shouldEnableDiagnostics()` - Checks URL query `?diag=1` OR localStorage `STRATFIT_DIAG=1`
   - Safe: Catches SSR/non-browser exceptions

4. **[src/diagnostics/GlobalErrorCapture.tsx](src/diagnostics/GlobalErrorCapture.tsx)**
   - Captures `window.onerror` events → logs to diag store
   - Captures `unhandledrejection` promise rejections → logs to diag store
   - Includes stack traces and error metadata
   - Mounts/unmounts event listeners via useEffect

5. **[src/diagnostics/StratfitErrorBoundary.tsx](src/diagnostics/StratfitErrorBoundary.tsx)**
   - React class component error boundary
   - Logs render errors to diag store via `componentDidCatch`
   - Minimal fallback UI with reload button
   - Wraps entire app shell

6. **[src/diagnostics/DiagnosticsOverlay.tsx](src/diagnostics/DiagnosticsOverlay.tsx)**
   - Fixed position overlay (bottom-right, z-index: 999999)
   - Displays last 20 events (reversed, newest first)
   - Shows: RenderStore state (activeViewId, isContextLost)
   - Shows: SimulationStore state (phase, progress, CI width)
   - Actions: Clear events, Hide overlay
   - Visible only when `enabled === true`

7. **[src/diagnostics/DiagnosticsBootstrap.tsx](src/diagnostics/DiagnosticsBootstrap.tsx)**
   - Initializes diagnostics on mount
   - Checks `shouldEnableDiagnostics()` and sets store state
   - Subscribes to RenderStore and SimulationStore
   - Logs state changes to diag store (no console spam)

### Files Modified

8. **[src/AppShell.tsx](src/AppShell.tsx)**
   - Wrapped entire app in `<StratfitErrorBoundary>`
   - Added siblings to app content:
     - `<GlobalErrorCapture />`
     - `<DiagnosticsBootstrap />`
     - `<DiagnosticsOverlay />`
   - Structure: ErrorBoundary → (Capture/Bootstrap/Overlay) → App Content

## Architecture

### Event Flow
```
Error Source → diag(level, topic, msg, data) → DiagnosticsStore (ring buffer)
                                                        ↓
                                               DiagnosticsOverlay (if enabled)
```

### Error Sources
1. **Global JavaScript Errors:** `window.onerror` → GlobalErrorCapture
2. **Unhandled Promise Rejections:** `window.unhandledrejection` → GlobalErrorCapture
3. **React Render Errors:** `componentDidCatch` → StratfitErrorBoundary
4. **Store State Changes:** RenderStore/SimulationStore → DiagnosticsBootstrap

### Ring Buffer
- Max 200 events in memory
- FIFO eviction when full
- Always recording (flight recorder pattern)
- Overlay shows last 20 events

### Enabling Diagnostics

**Method 1: URL Query**
```
http://localhost:5173/?diag=1
http://localhost:5173/baseline?diag=1
```

**Method 2: localStorage**
```javascript
localStorage.setItem('STRATFIT_DIAG', '1');
// Then reload page
```

**Disabling:**
- Click "Hide" button in overlay
- Remove `?diag=1` from URL
- Remove localStorage key: `localStorage.removeItem('STRATFIT_DIAG')`

## Verification

### Build/Lint/Type Check
```bash
npm run typecheck  # ✅ Pass
npm run lint       # ✅ 0 errors, 0 warnings
npm run build      # ✅ Success (2.02s)
```

### Functional Testing

**Test 1: Normal Operation (Overlay Hidden)**
```bash
npm run dev
# Navigate to http://localhost:5173/
# Expected: No overlay visible
# Events still recorded in background
```

**Test 2: Enable via URL Query**
```bash
npm run dev
# Navigate to http://localhost:5173/?diag=1
# Expected: Overlay appears bottom-right
# Shows: Initial bootstrap events
# Shows: RenderStore/SimulationStore state
```

**Test 3: Enable via localStorage**
```javascript
// In browser console:
localStorage.setItem('STRATFIT_DIAG', '1');
location.reload();
// Expected: Overlay appears on reload
```

**Test 4: Error Capture**
```javascript
// In browser console (with ?diag=1):
throw new Error('Test error');
// Expected: Error appears in overlay
// Topic: global:error
// Includes stack trace
```

**Test 5: Unhandled Promise Rejection**
```javascript
// In browser console (with ?diag=1):
Promise.reject('Test rejection');
// Expected: Rejection appears in overlay
// Topic: global:unhandledrejection
```

**Test 6: Clear Events**
```bash
# With overlay visible:
# Click "Clear" button
# Expected: Event list clears
```

**Test 7: Hide Overlay**
```bash
# With overlay visible:
# Click "Hide" button
# Expected: Overlay disappears
# Events still recording in background
```

## Integration Points

### RenderStore Hooks
```typescript
const isContextLost = useRenderStore((s) => (s as any).isContextLost);
const activeViewId = useRenderStore((s) => (s as any).activeViewId);
```
**Logs:** "render" topic with { activeViewId, isContextLost }

### SimulationStore Hooks
```typescript
const simPhase = useSimulationStore((s) => (s as any).phase);
const simMeta = useSimulationStore((s) => (s as any).meta);
```
**Logs:** "sim" topic with { phase, meta }

### Future Integration (Phase 3+)
```typescript
// In any component or service:
import { diag } from '@/diagnostics/DiagnosticsStore';

// Log info event
diag('info', 'myFeature', 'Feature initialized', { config });

// Log warning
diag('warn', 'myFeature', 'Deprecated API used', { api: 'oldMethod' });

// Log error
diag('error', 'myFeature', 'Operation failed', { error: e.message });
```

## Phase 2.5 Guarantees

✅ **Flight Recorder Pattern** - All events recorded, even when overlay disabled  
✅ **Ring Buffer** - Max 200 events, FIFO eviction, no memory leaks  
✅ **No Console Spam** - Only logs to diag store, not console  
✅ **Global Error Capture** - window.onerror + unhandledrejection  
✅ **React Error Boundary** - Catches render errors at app shell level  
✅ **Minimal UI** - Simple overlay with clear/hide actions  
✅ **Opt-in Only** - Requires explicit activation via URL or localStorage  
✅ **SSR Safe** - diagEnable catches non-browser exceptions  

## Known Limitations

1. **No Persistence** - Events cleared on page reload (by design)
2. **No Export** - No download/copy functionality (future enhancement)
3. **Fixed Size** - 200 events max (configurable via store.max)
4. **No Filtering** - Shows all events (future: filter by level/topic)
5. **No Timestamps** - Shows time-of-day only (future: relative timestamps)

## Next Steps (Phase 3)

**Enhanced Diagnostics:**
1. Add export to JSON/CSV
2. Add filtering by level/topic
3. Add relative timestamps (e.g., "+234ms since start")
4. Add search/highlight
5. Add performance metrics (FPS, memory usage)
6. Add network request logging

**Store Integrations:**
7. Hook into all Zustand stores for state change auditing
8. Log Three.js render loop iterations
9. Log WebGL context creation/loss events
10. Log route navigation events

**Testing:**
11. Unit tests for DiagnosticsStore (ring buffer behavior)
12. Integration tests for error capture
13. E2E tests with Playwright (trigger errors, verify logging)

## Documentation Updates

- Update README.md with ?diag=1 usage
- Add troubleshooting guide referencing diagnostics overlay
- Document diag() API for developers
