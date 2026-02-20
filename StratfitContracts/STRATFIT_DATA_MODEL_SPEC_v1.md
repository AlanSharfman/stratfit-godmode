---

STRATFIT DATA MODEL SPEC v1

DATA ENTITIES

User
Company
Financial Snapshot
Scenario
Simulation Result
Objective
Valuation Result
Risk Profile
Roadmap

RELATIONSHIPS
User → Company
Company → Financial Snapshot
Company → Scenario
Scenario → Simulation Result
Simulation Result → Risk & Valuation
Scenario → Roadmap

DATA PRINCIPLE
Single source of truth
Immutable simulation outputs
Scenario versioning required
