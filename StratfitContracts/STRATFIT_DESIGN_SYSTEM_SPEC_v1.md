---

STRATFIT DESIGN SYSTEM SPEC v1

PURPOSE  
Define the reusable UI components, patterns, and styling conventions used across STRATFIT.  
This ensures consistency, scalability, and faster product development.

---

DESIGN SYSTEM GOALS  

Consistency across all screens  
Predictable user interactions  
Reusable components  
Visual coherence  
Reduced design and engineering ambiguity  

---

FOUNDATION TOKENS  

Spacing scale  
Typography scale  
Color palette  
Elevation/shadow levels  
Border radius values  

All components must reference these tokens.

---

CORE COMPONENTS  

BUTTONS  

Primary Button  
Used for main actions  
Visually prominent  

Secondary Button  
Used for supporting actions  

Tertiary Button  
Low emphasis, inline actions  

All buttons must support:

Hover state  
Active state  
Disabled state  
Loading state  

---

INPUT FIELDS  

Text Input  
Number Input  
Dropdown Select  
Toggle Switch  
Slider  

Inputs must include:

Label  
Validation feedback  
Focus state  
Error state  

---

CARDS  

Standard Card  
Used for grouped information  

Insight Card  
Used for key metrics or summaries  

Interactive Card  
Clickable container with hover feedback  

Cards must maintain consistent padding and spacing.

---

PANELS  

Side Panel  
Contextual details  

Modal Panel  
Focused interaction  

Expandable Panel  
Reveal additional information  

Panels must clearly indicate hierarchy and layering.

---

NAVIGATION COMPONENTS  

Primary Navigation  
Top or side layout  

Section Divider  
Visual grouping  

Breadcrumbs  
Optional contextual navigation  

Active state must be clear at all times.

---

DATA DISPLAY COMPONENTS  

Metric Display  
Single KPI  

Metric Group  
Multiple related KPIs  

Table  
Structured data  

Chart Container  
Wrapper for visualizations  

All data components must prioritize readability.

---

FEEDBACK COMPONENTS  

Loading Indicator  
Progress Feedback  

Success Message  
Error Message  
Warning Message  

Notifications must be subtle but visible.

---

SIMULATION VISUAL COMPONENTS  

Terrain Container  
Simulation Path  
Markers  
Probability Bands  

These components must share a unified visual language.

---

LAYOUT PATTERNS  

Dashboard Layout  
Two-column Layout  
Full-screen Analysis Layout  
Split View Comparison  

Layouts must be responsive and scalable.

---

STATES  

Every component must define:

Default state  
Hover state  
Active state  
Disabled state  
Loading state  
Error state  

No component should exist without state definitions.

---

ACCESSIBILITY PRINCIPLES  

Text must remain readable  
Contrast must be sufficient  
Interactions must be predictable  

Accessibility should be considered in all component designs.

---

EXTENSIBILITY RULE  

New components must:

Follow existing tokens  
Document states  
Be added to the design system before use  

No one-off UI patterns.

---

SUCCESS CRITERIA  

A developer or designer should be able to:

Build any screen using only system components  
Maintain visual consistency  
Understand component behaviour without guesswork  
