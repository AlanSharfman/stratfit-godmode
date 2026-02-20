---

SOURCE OF TRUTH — STRATFIT PRODUCT CONTRACT (FULL SPEC)
If any product, design, or engineering decision conflicts with this document, this document prevails.

This document defines the complete STRATFIT product architecture, feature set, workflow, and behavioural expectations until MVP completion.

---

SECTION 1 — PRODUCT PURPOSE

STRATFIT is a scenario intelligence platform that allows businesses to understand their current position, explore strategic scenarios, evaluate risk and value, and receive an actionable roadmap.

The product must deliver a continuous journey:

Understanding → Exploration → Comparison → Insight → Action

---

SECTION 2 — CORE PRODUCT FLOW

The product must follow this exact order:

Initiate → Position → Objectives → Strategy Studio → Compare → Risk → Valuation → Strategic Assessment → Roadmap

No steps may be skipped or reordered.

---

SECTION 3 — INITIATE MODULE (ONBOARDING)

Purpose:
Capture the minimum viable dataset required to generate a baseline simulation.

Inputs:
User profile
Company details
Financial metrics (ARR, revenue, costs, burn, cash)
High-level goals (12 / 24 / 36 months)
Strategic direction selection (growth, exit, stability, turnaround)

Behaviour:
The module must remain lightweight and not overwhelm the user.
Questions should be minimal but sufficient for a baseline simulation.

Output:
Baseline dataset stored for simulation engine.

---

SECTION 4 — POSITION MODULE

Purpose:
Provide a visual representation of the company's current strategic position.

Features:
3D terrain visualization (mountain metaphor)
Timeline overlay
Strategic markers (ARR, growth trajectory, risk indicators)
Diagnostics toggle panel
Educational interpretation layer

Behaviour:
Must help the user understand "where they are" and "why."
No scenario manipulation occurs here.

Output:
User comprehension of current state.

---

SECTION 5 — OBJECTIVES MODULE

Purpose:
Define strategic intent separate from scenario mechanics.

Features:
Target metrics (revenue, growth, runway, value)
Priority sliders or selections
Time horizon definitions
Strategic outcome selection

Behaviour:
Focus on WHAT success looks like, not how to achieve it.

Output:
Strategic intent dataset used by simulation engine.

---

SECTION 6 — STRATEGY STUDIO MODULE

Purpose:
Enable exploration and creation of scenarios.

Features:
Interactive lever controls (growth, hiring, pricing, costs, capital)
Real-time recalculation
Liquidity impact preview
Scenario save and labeling

Behaviour:
User experimentation environment.
System must visibly respond to lever changes.

Output:
Scenario datasets.

---

SECTION 7 — COMPARE MODULE

Purpose:
Provide analytical comparison across scenarios.

Features:
Baseline vs Scenario A vs Scenario B vs AI Scenario
Metric tables
Variance visualization
Probability bands
Toggle visibility of scenarios

Behaviour:
Strictly analytical.
No narrative interpretation.

Output:
Decision clarity through comparative insight.

---

SECTION 8 — AI OPTIMIZED SCENARIO

Purpose:
Provide a system-generated strategic scenario.

Inputs:
Baseline data
User scenarios
Objectives
Simulation outputs

Behaviour:
Must represent an optimized pathway aligned with objectives.

Output:
AI scenario available in Compare and Assessment.

---

SECTION 9 — RISK MODULE

Purpose:
Quantify uncertainty and downside exposure.

Features:
Probability distributions
Stress scenarios
Sensitivity analysis indicators
Risk markers on terrain

Behaviour:
Risk must be framed as ranges, not absolutes.

Output:
Risk profile.

---

SECTION 10 — VALUATION MODULE

Purpose:
Translate scenarios into enterprise value ranges.

Features:
Simulation-based valuation
Scenario-specific value outcomes
Confidence intervals

Behaviour:
Valuation must reflect scenario dynamics, not static multiples.

Output:
Forward-looking value insight.

---

SECTION 11 — STRATEGIC ASSESSMENT MODULE

Purpose:
Synthesize insights into executive-level understanding.

Features:
Narrative summary
Strategic strengths
Key risks
Capital and liquidity implications
Scenario implications

Behaviour:
Interpretation only.
No action planning here.

Output:
Strategic understanding.

---

SECTION 12 — ROADMAP MODULE

Purpose:
Translate insights into actionable plan.

Features:
12-month priorities
24-month trajectory
36-month milestones
Capital strategy guidance

Behaviour:
Action oriented.
Clear and practical.

Output:
Execution roadmap.

---

SECTION 13 — LIQUIDITY FRAMEWORK

Liquidity must be present across all modules.

Metrics:
Runway
Cash trajectory
Funding requirements
Survival probability

---

SECTION 14 — PROBABILITY FRAMEWORK

All outputs must include uncertainty indicators.

Includes:
Confidence bands
Likelihood ranges
Simulation variability

---

SECTION 15 — SIMULATION ENGINE VISIBILITY

System must show when simulations are running.

Indicators:
Processing state
Recalculation indicator
Simulation progress feedback

---

SECTION 16 — UX PRINCIPLES

Insight first
Low cognitive load
Cinematic clarity
Progressive disclosure
No unnecessary complexity

---

SECTION 17 — OUT OF SCOPE UNTIL MVP

Integrations
Collaboration
External benchmarks
Automation features
Advanced AI coaching

---

SECTION 18 — BUILD ORDER

Position → Objectives → Studio → Compare → Risk → Valuation → Assessment → Roadmap

---

SECTION 19 — MVP COMPLETION DEFINITION

MVP is complete when:
Full journey functions end to end
Scenarios simulate
AI scenario works
Compare functions
Assessment generates insight
Roadmap generates actions

---

SECTION 20 — POST MVP PHASE

Visual refinement
Marker enhancements
Advanced AI
Integrations
Collaboration
