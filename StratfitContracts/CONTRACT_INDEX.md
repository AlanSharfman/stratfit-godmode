---

STRATFIT — CONTRACT INDEX (SOURCE OF TRUTH MAP)

PURPOSE  
This index links governance contracts (StratfitContracts) and executable code contracts (src/contracts).
Both layers must remain aligned.

DRIFT RULE  
If a governance spec conflicts with code contracts, either update the code deliberately OR update the spec.
Never allow silent divergence.

OBJECTIVES INFLUENCE RULE  
Objectives define strategic intent and must influence:
• Strategy Studio
• Compare
• AI Scenario generation
• Strategic Assessment

Objectives must NOT influence:
• Position (reality layer)

Position renders strictly from Initiate baseline data.

HUMAN GOVERNANCE CONTRACTS  
- STRATFIT_PRODUCT_CONTRACT_v1_FULL.md  
- STRATFIT_ARCHITECTURE_SPEC_v1.md  
- STRATFIT_SIMULATION_LOGIC_SPEC_v1.md  
- STRATFIT_DATA_MODEL_SPEC_v1.md  
- STRATFIT_BUILD_RULES_v1.md  
- STRATFIT_UX_INTERACTION_SPEC_v1.md  
- STRATFIT_INVESTOR_NARRATIVE_SPEC_v1.md  
- STRATFIT_DEMO_FLOW_SPEC_v1.md  

EXECUTABLE CODE CONTRACTS  
- src/contracts/navigationContract.ts  
- src/contracts/positionObjectivesContract.ts  

NAV TRUTH  
The navigation order is currently enforced by navigationContract.ts.
Any change must update BOTH the code and governance spec.
