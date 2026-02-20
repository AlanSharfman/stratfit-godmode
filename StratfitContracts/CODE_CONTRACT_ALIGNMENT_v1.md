---

STRATFIT — CODE CONTRACT ALIGNMENT v1

PURPOSE  
Mirror executable contracts in src/contracts and clarify influence rules.

CANONICAL NAV ORDER (CODE)
Initiate
Objectives
Position
Studio
Scenarios
Risk
Capital
Valuation
Assessment

OBJECTIVES INFLUENCE MATRIX

Position → NO  
Objectives → Source  
Studio → YES  
Compare/Scenarios → YES  
Risk → INDIRECT (via simulation)  
Valuation → INDIRECT (via simulation)  
Assessment → YES  
AI Scenario → YES  

PRINCIPLE  
Objectives define intent, not reality.
Position must remain a baseline-only visualization.

NON-OVERLAP SUMMARY  
• Initiate writes baseline  
• Position reads baseline only  
• Studio runs simulation  
• Compare reads simulation outputs  
• Assessment interprets  

ALIGNMENT RULE  
If product flow changes, navigationContract.ts must be updated and versioned.
