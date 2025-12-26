# Responsive Layout Testing Checklist

## Test Environments
- ✅ 1920x1080 (Full HD Desktop)
- ✅ 1440x900 (MacBook Pro 15")
- ✅ 1280x800 (MacBook Air 13")

## Components to Verify

### Header (All Screens)
- [ ] Logo + STRATFIT text visible
- [ ] System Status indicator not wrapping
- [ ] View Toggle centered
- [ ] Header actions aligned right

### Command Band
**1920x1080:**
- [ ] Scenario Selector (left): Full width, no wrapping
- [ ] KPI Console (center): 4 KPIs in single row
- [ ] System Controls (right): Save/Export buttons visible

**1440x900:**
- [ ] KPI Console: Check if 4 KPIs fit or need wrapping
- [ ] Scenario selector remains readable
- [ ] System controls may need icon-only mode

**1280x800:**
- [ ] KPI Console: May need 2x2 grid or horizontal scroll
- [ ] Scenario selector: Check text truncation
- [ ] System controls: Icon-only required

### Left Panel: ControlDeck
**All Screens:**
- [ ] 3 slider boxes (Growth, Efficiency, Risk) stack vertically
- [ ] Slider labels not truncating
- [ ] Tooltip positioning: Verify tooltips don't overflow left edge
- [ ] Value indicators visible

**1280x800:**
- [ ] Consider reducing slider padding/spacing
- [ ] Tooltips may need to appear on right side instead

### Center Panel: Terrain Stage
**1920x1080:**
- [ ] Full 3D terrain visible
- [ ] Tabs (Terrain/Variances/Actuals) centered
- [ ] Adequate padding around stage

**1440x900:**
- [ ] Terrain scaled appropriately
- [ ] No clipping on edges

**1280x800:**
- [ ] Terrain may need reduced height
- [ ] Check tab overflow
- [ ] Verify Help button placement

### Right Panel: AI Intelligence
**All Screens:**
- [ ] Insights stream readable
- [ ] Strategic questions not cut off
- [ ] Scroll behavior works
- [ ] Time indicators visible

**1280x800:**
- [ ] Consider collapsible mode
- [ ] Check if width needs reduction

### Bottom: KPI Grid (if visible)
**All Screens:**
- [ ] Cards grid responsively (4 → 2 → 1 column)
- [ ] Sparklines render correctly
- [ ] Card spacing appropriate

## Critical Issues Found
_Document any breaking layouts:_

### 1920x1080
- Status: ✅ Expected to work perfectly

### 1440x900
- Status: ⚠️ Test KPI console wrapping
- Fix: May need `flex-wrap` or reduce KPI card width

### 1280x800
- Status: ⚠️ Likely needs responsive mode
- Fix: Consider hiding AI Intelligence panel by default
- Fix: Reduce ControlDeck slider widths
- Fix: Add hamburger menu for system controls

## Recommended Breakpoints
```css
/* Tailwind breakpoints used */
sm: 640px   /* Not primary target */
md: 768px   /* Tablet (not target) */
lg: 1024px  /* Small laptop */
xl: 1280px  /* Standard laptop ✅ */
2xl: 1536px /* Desktop ✅ */
```

## Implementation Priority
1. **Critical:** Command Band wrapping on xl (1280px)
2. **High:** ControlDeck tooltip positioning on small screens
3. **Medium:** AI Intelligence panel collapse toggle
4. **Low:** System controls icon-only mode

## Testing Commands
```bash
# Open browser with DevTools
# 1. Press F12
# 2. Click Responsive Design Mode (Ctrl+Shift+M)
# 3. Test presets:
#    - Desktop: 1920x1080
#    - Laptop: 1440x900
#    - Small Laptop: 1280x800
```

## Pass Criteria
- [ ] No horizontal scroll at any breakpoint
- [ ] All interactive elements clickable (no overlaps)
- [ ] Text remains readable (no truncation without ellipsis)
- [ ] Terrain stage maintains aspect ratio
- [ ] Tooltips never overflow viewport
- [ ] Onboarding sequence positioned correctly on all screens
