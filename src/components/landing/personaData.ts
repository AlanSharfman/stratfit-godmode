// src/components/landing/personaData.ts
// STRATFIT — Persona Data for Landing Page
// 8 target personas with challenges, benefits, and CTAs

export interface PersonaHelp {
  title: string;
  description: string;
}

export type PersonaCategory = 'primary' | 'secondary';

export interface Persona {
  id: string;
  icon: string;
  title: string;
  shortTitle: string;
  painQuestion: string;
  description: string;
  challenges: string[];
  stratfitHelps: PersonaHelp[];
  ctaText: string;
  color: string;
  gradient: string;
  category: PersonaCategory;
}

export const PERSONAS: Persona[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY PERSONAS (Top Row)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'founder',
    icon: '🚀',
    title: 'Startup Founders',
    shortTitle: 'Founders',
    painQuestion: '"Should I raise now or bootstrap longer?"',
    description: 'You\'re navigating the most critical decisions of your company\'s life. Every choice about hiring, spending, and fundraising could make or break your runway. You need clarity on which strategic path gives you the best odds of success.',
    challenges: [
      'Spreadsheet models give false confidence with single-point estimates',
      'Board wants answers but you\'re flying blind on real probabilities',
      'Burn rate decisions feel like educated guesses',
      'Can\'t quantify the risk of aggressive vs conservative strategies',
    ],
    stratfitHelps: [
      { title: '10,000 Scenario Analysis', description: 'See the full probability distribution of outcomes, not just one forecast' },
      { title: 'Survival Probability', description: 'Know your actual odds of making it to profitability or next round' },
      { title: 'Kill-Switch Detection', description: 'Identify the single metric that tips you from viable to death spiral' },
      { title: 'Strategic Path Clarity', description: 'Get a clear verdict: Growth, Stability, or Survival mode' },
    ],
    ctaText: 'Test My Strategy',
    color: '#22d3ee',
    gradient: 'linear-gradient(135deg, #22d3ee, #0891b2)',
    category: 'primary',
  },
  {
    id: 'cfo',
    icon: '📊',
    title: 'CFOs & Finance Teams',
    shortTitle: 'CFOs',
    painQuestion: '"What do I tell the board about our runway?"',
    description: 'You own the numbers, but you know single-point forecasts hide massive uncertainty. You need probabilistic models to communicate real risk to the board while maintaining credibility.',
    challenges: [
      'Excel models take weeks to build and are instantly outdated',
      'Presenting single-point forecasts when reality has wide variance',
      'Board asks "what if" questions you can\'t answer quickly',
      'Sensitivity analysis is manual and incomplete',
    ],
    stratfitHelps: [
      { title: 'Monte Carlo in Minutes', description: 'Replace 2-week Excel builds with 2-minute probability models' },
      { title: 'Board-Ready Outputs', description: 'Professional visualizations showing survival rates and risk factors' },
      { title: 'What-If Explorer', description: 'Answer board questions in real-time by adjusting scenario levers' },
      { title: 'Risk Dashboard', description: 'DEFCON-style threat assessment across 6 critical dimensions' },
    ],
    ctaText: 'Build My Model',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    category: 'primary',
  },
  {
    id: 'fractional-cfo',
    icon: '💼',
    title: 'Fractional CFOs',
    shortTitle: 'Fractional CFOs',
    painQuestion: '"How do I show clients their real risks?"',
    description: 'You serve multiple clients who each think their spreadsheet is the truth. You need a scalable way to deliver sophisticated scenario analysis without building custom models for each engagement.',
    challenges: [
      'Building custom models for each client is time-consuming',
      'Clients don\'t understand probability—they want simple answers',
      'Hard to scale your practice beyond a few clients',
      'No standard framework for strategic planning discussions',
    ],
    stratfitHelps: [
      { title: 'Client-Ready Templates', description: 'SaaS-specific models with industry benchmarks built in' },
      { title: 'Visual Storytelling', description: 'Mountain terrain makes probability intuitive for non-technical clients' },
      { title: '2-Minute Setup', description: 'Input client numbers and get comprehensive analysis instantly' },
      { title: 'White-Label Quality', description: 'Professional outputs that enhance your credibility' },
    ],
    ctaText: 'Demo for Clients',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    category: 'primary',
  },
  {
    id: 'investor',
    icon: '💎',
    title: 'Investors & VCs',
    shortTitle: 'Investors',
    painQuestion: '"Is this deal worth the risk?"',
    description: 'You see hundreds of decks with hockey-stick projections. You need a way to stress-test those assumptions and understand the real probability distribution of outcomes before writing a check.',
    challenges: [
      'Founder projections are optimistic by design',
      'No standardized way to compare risk across deals',
      'Portfolio companies give incomplete visibility into runway',
      'Post-investment surprises erode trust and returns',
    ],
    stratfitHelps: [
      { title: 'Deal Stress Testing', description: 'Run founder assumptions through 10,000 scenarios instantly' },
      { title: 'Risk Comparison', description: 'Standardized risk scores across your pipeline and portfolio' },
      { title: 'Valuation Scenarios', description: 'See the probability distribution of exit outcomes' },
      { title: 'Portfolio Monitoring', description: 'Early warning when portfolio companies hit trouble zones' },
    ],
    ctaText: 'Stress Test a Deal',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    category: 'primary',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECONDARY PERSONAS (Bottom Row)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'smb-owner',
    icon: '🏪',
    title: 'SMB Owners',
    shortTitle: 'SMB Owners',
    painQuestion: '"Can I afford to expand or hire?"',
    description: 'Growth decisions feel risky without big company resources. You need a simple way to understand if you can afford to make the next big move—whether that\'s a new location, a key hire, or a major investment.',
    challenges: [
      'Growth feels like gambling without proper analysis',
      'Can\'t afford expensive consultants or FP&A software',
      'Accountant gives historical data, not future scenarios',
      'Decisions made on gut feel, not data',
    ],
    stratfitHelps: [
      { title: 'Simple Inputs', description: 'Just 5-10 numbers to get comprehensive scenario analysis' },
      { title: 'Plain English Results', description: 'Clear verdict on whether your business can support growth' },
      { title: 'Cash Flow Clarity', description: 'See when you\'ll run out of money under different scenarios' },
      { title: 'Confidence to Act', description: 'Make expansion decisions with probability backing you up' },
    ],
    ctaText: 'Check My Capacity',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    category: 'secondary',
  },
  {
    id: 'ma-team',
    icon: '🤝',
    title: 'M&A Teams',
    shortTitle: 'M&A Teams',
    painQuestion: '"What\'s the real value here?"',
    description: 'You\'re evaluating targets where the numbers look good on paper, but you need to understand the full range of outcomes and integration risks before recommending a deal.',
    challenges: [
      'Target projections are aspirational, not probabilistic',
      'Integration risks are hard to quantify',
      'Due diligence timelines don\'t allow for deep modeling',
      'Post-close surprises damage credibility',
    ],
    stratfitHelps: [
      { title: 'Rapid Due Diligence', description: 'Stress-test target projections in minutes, not weeks' },
      { title: 'Probability-Weighted Valuation', description: 'See the full distribution of fair value outcomes' },
      { title: 'Risk Surface Mapping', description: 'Identify the scenarios where the deal goes wrong' },
      { title: 'Integration Scenarios', description: 'Model optimistic, realistic, and pessimistic integration paths' },
    ],
    ctaText: 'Analyze a Target',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    category: 'secondary',
  },
  {
    id: 'lender',
    icon: '🏦',
    title: 'Banks & Lenders',
    shortTitle: 'Lenders',
    painQuestion: '"What\'s the real loan risk?"',
    description: 'Credit decisions require understanding repayment probability under various scenarios. You need a way to stress-test borrower projections and understand the full risk profile.',
    challenges: [
      'Borrower projections are inherently optimistic',
      'Covenant scenarios are hard to model quickly',
      'Default probability is estimated, not calculated',
      'Portfolio risk requires aggregating diverse borrowers',
    ],
    stratfitHelps: [
      { title: 'Repayment Probability', description: 'Monte Carlo analysis of loan servicing under 10,000 scenarios' },
      { title: 'Covenant Stress Testing', description: 'See probability of covenant breach over loan term' },
      { title: 'Early Warning System', description: 'Identify loans heading toward trouble before they default' },
      { title: 'Portfolio Analytics', description: 'Aggregate risk view across your lending book' },
    ],
    ctaText: 'Assess Credit Risk',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    category: 'secondary',
  },
  {
    id: 'board-member',
    icon: '🎯',
    title: 'Board Members',
    shortTitle: 'Board Members',
    painQuestion: '"What are the real options here?"',
    description: 'You\'re asked to advise on critical strategic decisions but often get incomplete information. You need a tool that shows you the full range of outcomes so you can provide informed governance.',
    challenges: [
      'Management presents optimistic scenarios only',
      'Hard to challenge assumptions without your own models',
      'Risk factors are qualitative, not quantified',
      'Limited time to deep-dive into company financials',
    ],
    stratfitHelps: [
      { title: 'Independent Analysis', description: 'Run your own scenarios on company inputs' },
      { title: 'Risk Quantification', description: 'See probability-weighted risk across 6 dimensions' },
      { title: 'Strategic Options Clarity', description: 'Compare Growth vs Stability vs Survival paths with data' },
      { title: 'Governance Confidence', description: 'Ask better questions with probability backing you up' },
    ],
    ctaText: 'Run My Analysis',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    category: 'secondary',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const getPersonaById = (id: string): Persona | undefined => {
  return PERSONAS.find(p => p.id === id);
};

export const getPersonasByCategory = (category: 'primary' | 'secondary'): Persona[] => {
  return PERSONAS.filter(p => p.category === category);
};

export const getPrimaryPersonas = (): Persona[] => getPersonasByCategory('primary');
export const getSecondaryPersonas = (): Persona[] => getPersonasByCategory('secondary');

export default PERSONAS;
