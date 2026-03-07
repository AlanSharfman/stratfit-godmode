// src/data/metricsGlossary.ts
// STRATFIT — SaaS Metrics Glossary
// Plain-English definitions for business owners who aren't finance experts

export interface MetricDefinition {
  term: string;
  shortName: string;
  fullName: string;
  definition: string;
  formula?: string;
  example?: string;
  goodBad?: {
    good: string;
    bad: string;
  };
  category: 'revenue' | 'growth' | 'efficiency' | 'retention' | 'funding' | 'valuation' | 'operations';
}

export const METRICS_GLOSSARY: Record<string, MetricDefinition> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // REVENUE METRICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  arr: {
    term: 'arr',
    shortName: 'ARR',
    fullName: 'Annual Recurring Revenue',
    definition: 'The yearly value of your recurring subscriptions. This is your predictable revenue if nothing changes.',
    formula: 'MRR × 12',
    example: '$50K MRR = $600K ARR',
    goodBad: {
      good: 'Growing 50%+ year-over-year',
      bad: 'Flat or declining',
    },
    category: 'revenue',
  },
  
  mrr: {
    term: 'mrr',
    shortName: 'MRR',
    fullName: 'Monthly Recurring Revenue',
    definition: 'The monthly value of your recurring subscriptions. The heartbeat of a SaaS business.',
    formula: 'Sum of all monthly subscription fees',
    example: '100 customers × $500/mo = $50K MRR',
    goodBad: {
      good: 'Growing 10%+ month-over-month early stage',
      bad: 'Declining or high volatility',
    },
    category: 'revenue',
  },
  
  revenue: {
    term: 'revenue',
    shortName: 'Revenue',
    fullName: 'Total Revenue',
    definition: 'All money coming in, including one-time fees, services, and subscriptions.',
    category: 'revenue',
  },
  
  acv: {
    term: 'acv',
    shortName: 'ACV',
    fullName: 'Annual Contract Value',
    definition: 'The average yearly value of a customer contract. Higher ACV = fewer customers needed.',
    formula: 'Total contract value ÷ contract years',
    example: '$36K over 3 years = $12K ACV',
    category: 'revenue',
  },
  
  arpu: {
    term: 'arpu',
    shortName: 'ARPU',
    fullName: 'Average Revenue Per User',
    definition: 'How much revenue each customer generates on average. Key for pricing strategy.',
    formula: 'Total revenue ÷ total customers',
    example: '$100K MRR ÷ 200 customers = $500 ARPU',
    category: 'revenue',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GROWTH METRICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  'growth-rate': {
    term: 'growth-rate',
    shortName: 'Growth Rate',
    fullName: 'Revenue Growth Rate',
    definition: 'How fast your revenue is increasing, usually measured month-over-month or year-over-year.',
    formula: '(This period - Last period) ÷ Last period × 100',
    example: '($55K - $50K) ÷ $50K = 10% MoM growth',
    goodBad: {
      good: '15%+ MoM early stage, 100%+ YoY at scale',
      bad: 'Below 5% MoM with significant burn',
    },
    category: 'growth',
  },
  
  't2d3': {
    term: 't2d3',
    shortName: 'T2D3',
    fullName: 'Triple Triple Double Double Double',
    definition: 'The gold standard SaaS growth path: triple revenue for 2 years, then double for 3 years. Gets you from $1M to $100M ARR.',
    example: '$1M → $3M → $9M → $18M → $36M → $72M',
    category: 'growth',
  },
  
  nrr: {
    term: 'nrr',
    shortName: 'NRR',
    fullName: 'Net Revenue Retention',
    definition: 'Revenue from existing customers after accounting for upgrades, downgrades, and churn. Over 100% means you grow even without new customers.',
    formula: '(Starting MRR + Expansion - Contraction - Churn) ÷ Starting MRR',
    example: '($100K + $15K - $5K - $8K) ÷ $100K = 102% NRR',
    goodBad: {
      good: '120%+ (best-in-class)',
      bad: 'Below 90%',
    },
    category: 'growth',
  },
  
  grr: {
    term: 'grr',
    shortName: 'GRR',
    fullName: 'Gross Revenue Retention',
    definition: 'Revenue kept from existing customers, ignoring expansions. Shows your "floor" — how sticky is your product?',
    formula: '(Starting MRR - Contraction - Churn) ÷ Starting MRR',
    example: '($100K - $5K - $8K) ÷ $100K = 87% GRR',
    goodBad: {
      good: '90%+ (enterprise), 80%+ (SMB)',
      bad: 'Below 75%',
    },
    category: 'growth',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFICIENCY METRICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  cac: {
    term: 'cac',
    shortName: 'CAC',
    fullName: 'Customer Acquisition Cost',
    definition: 'How much you spend to get one new customer. Includes sales salaries, marketing, ads, tools — everything.',
    formula: 'Total sales & marketing spend ÷ new customers acquired',
    example: '$100K spend ÷ 50 new customers = $2,000 CAC',
    goodBad: {
      good: 'Recovered within 12 months',
      bad: 'Takes 24+ months to recover',
    },
    category: 'efficiency',
  },
  
  ltv: {
    term: 'ltv',
    shortName: 'LTV',
    fullName: 'Lifetime Value',
    definition: 'Total revenue you\'ll earn from a customer over their entire relationship with you. The higher, the more you can spend to acquire them.',
    formula: 'ARPU × Gross Margin × Customer Lifespan',
    example: '$500/mo × 80% margin × 36 months = $14,400 LTV',
    goodBad: {
      good: '3x+ higher than CAC',
      bad: 'Less than CAC',
    },
    category: 'efficiency',
  },
  
  'ltv-cac': {
    term: 'ltv-cac',
    shortName: 'LTV:CAC',
    fullName: 'LTV to CAC Ratio',
    definition: 'The holy grail of SaaS metrics. Shows if your business model works. For every $1 spent acquiring customers, how much do you get back?',
    formula: 'LTV ÷ CAC',
    example: '$14,400 LTV ÷ $2,000 CAC = 7.2x',
    goodBad: {
      good: '3x or higher',
      bad: 'Below 1x (you lose money on every customer)',
    },
    category: 'efficiency',
  },
  
  'cac-payback': {
    term: 'cac-payback',
    shortName: 'CAC Payback',
    fullName: 'CAC Payback Period',
    definition: 'How many months until a customer pays back what you spent to acquire them. Shorter = faster reinvestment.',
    formula: 'CAC ÷ (ARPU × Gross Margin)',
    example: '$2,000 ÷ ($500 × 80%) = 5 months',
    goodBad: {
      good: 'Under 12 months',
      bad: 'Over 24 months',
    },
    category: 'efficiency',
  },
  
  'magic-number': {
    term: 'magic-number',
    shortName: 'Magic Number',
    fullName: 'SaaS Magic Number',
    definition: 'Measures sales efficiency. How much ARR you generate for every dollar spent on sales & marketing.',
    formula: 'Net New ARR ÷ Sales & Marketing Spend (previous quarter)',
    example: '$500K new ARR ÷ $400K S&M = 1.25 magic number',
    goodBad: {
      good: 'Above 0.75 (invest more in S&M)',
      bad: 'Below 0.5 (fix efficiency first)',
    },
    category: 'efficiency',
  },
  
  'burn-multiple': {
    term: 'burn-multiple',
    shortName: 'Burn Multiple',
    fullName: 'Burn Multiple',
    definition: 'How much cash you burn to generate each dollar of new ARR. Lower = more efficient growth.',
    formula: 'Net Burn ÷ Net New ARR',
    example: '$2M burn ÷ $1M new ARR = 2x burn multiple',
    goodBad: {
      good: 'Under 1.5x',
      bad: 'Above 3x',
    },
    category: 'efficiency',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RETENTION METRICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  churn: {
    term: 'churn',
    shortName: 'Churn',
    fullName: 'Customer Churn Rate',
    definition: 'Percentage of customers who cancel each month. The silent killer of SaaS businesses.',
    formula: 'Customers lost ÷ Starting customers × 100',
    example: '5 cancellations ÷ 100 customers = 5% monthly churn',
    goodBad: {
      good: 'Under 2% monthly (enterprise), under 5% (SMB)',
      bad: 'Above 7% monthly',
    },
    category: 'retention',
  },
  
  'revenue-churn': {
    term: 'revenue-churn',
    shortName: 'Revenue Churn',
    fullName: 'Revenue Churn Rate',
    definition: 'Percentage of MRR lost to cancellations and downgrades. More important than customer churn if you have varied pricing.',
    formula: 'Lost MRR ÷ Starting MRR × 100',
    example: '$5K lost ÷ $100K MRR = 5% revenue churn',
    category: 'retention',
  },
  
  'logo-churn': {
    term: 'logo-churn',
    shortName: 'Logo Churn',
    fullName: 'Logo (Customer) Churn',
    definition: 'Number of customers (logos) lost, regardless of their size. Even losing small customers adds up.',
    formula: 'Customers lost ÷ Starting customers × 100',
    category: 'retention',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNDING & CASH METRICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  runway: {
    term: 'runway',
    shortName: 'Runway',
    fullName: 'Cash Runway',
    definition: 'How many months until you run out of cash at current burn rate. Your survival countdown.',
    formula: 'Cash balance ÷ Monthly burn rate',
    example: '$2M cash ÷ $100K burn = 20 months runway',
    goodBad: {
      good: '18+ months',
      bad: 'Under 6 months (danger zone)',
    },
    category: 'funding',
  },
  
  burn: {
    term: 'burn',
    shortName: 'Burn',
    fullName: 'Burn Rate',
    definition: 'How much cash you spend each month beyond what you earn. The speed you\'re consuming your runway.',
    formula: 'Monthly expenses - Monthly revenue',
    example: '$150K expenses - $50K revenue = $100K burn',
    category: 'funding',
  },
  
  'gross-burn': {
    term: 'gross-burn',
    shortName: 'Gross Burn',
    fullName: 'Gross Burn Rate',
    definition: 'Total monthly cash out, ignoring revenue. Shows your fixed cost structure.',
    formula: 'Total monthly expenses',
    example: '$150K/month gross burn',
    category: 'funding',
  },
  
  'net-burn': {
    term: 'net-burn',
    shortName: 'Net Burn',
    fullName: 'Net Burn Rate',
    definition: 'Monthly cash out minus cash in. The real drain on your bank account.',
    formula: 'Gross burn - Revenue collected',
    example: '$150K - $50K = $100K net burn',
    category: 'funding',
  },
  
  dilution: {
    term: 'dilution',
    shortName: 'Dilution',
    fullName: 'Equity Dilution',
    definition: 'How much your ownership percentage decreases when you raise money or issue options.',
    formula: 'New shares issued ÷ (Old shares + New shares)',
    example: 'Selling 20% to investors = 20% dilution',
    category: 'funding',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VALUATION METRICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  'arr-multiple': {
    term: 'arr-multiple',
    shortName: 'ARR Multiple',
    fullName: 'ARR Valuation Multiple',
    definition: 'How much investors value each dollar of ARR. Higher growth and retention = higher multiple.',
    formula: 'Company valuation ÷ ARR',
    example: '$30M valuation ÷ $3M ARR = 10x multiple',
    goodBad: {
      good: '10-20x for fast growers',
      bad: '2-5x signals concerns',
    },
    category: 'valuation',
  },
  
  'revenue-multiple': {
    term: 'revenue-multiple',
    shortName: 'Revenue Multiple',
    fullName: 'Revenue Valuation Multiple',
    definition: 'Company valuation divided by revenue. The simplest way to compare SaaS valuations.',
    formula: 'Valuation ÷ Annual Revenue',
    category: 'valuation',
  },
  
  'rule-of-40': {
    term: 'rule-of-40',
    shortName: 'Rule of 40',
    fullName: 'Rule of 40',
    definition: 'Growth rate + profit margin should exceed 40%. Balances growth vs. profitability.',
    formula: 'YoY Growth % + EBITDA Margin %',
    example: '60% growth + (-15%) margin = 45 (passing)',
    goodBad: {
      good: 'Above 40',
      bad: 'Below 20',
    },
    category: 'valuation',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATIONS METRICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  'gross-margin': {
    term: 'gross-margin',
    shortName: 'Gross Margin',
    fullName: 'Gross Margin',
    definition: 'Revenue minus direct costs (hosting, support, etc.) divided by revenue. Shows product profitability.',
    formula: '(Revenue - COGS) ÷ Revenue × 100',
    example: '($100K - $20K) ÷ $100K = 80% gross margin',
    goodBad: {
      good: '70%+ (SaaS standard)',
      bad: 'Below 50%',
    },
    category: 'operations',
  },
  
  cogs: {
    term: 'cogs',
    shortName: 'COGS',
    fullName: 'Cost of Goods Sold',
    definition: 'Direct costs to deliver your product: hosting, customer support, payment processing, etc.',
    category: 'operations',
  },
  
  opex: {
    term: 'opex',
    shortName: 'OpEx',
    fullName: 'Operating Expenses',
    definition: 'Day-to-day costs to run the business: salaries, rent, tools, marketing, etc.',
    category: 'operations',
  },
  
  ebitda: {
    term: 'ebitda',
    shortName: 'EBITDA',
    fullName: 'Earnings Before Interest, Taxes, Depreciation & Amortization',
    definition: 'Profit from operations before accounting adjustments. Shows core business profitability.',
    formula: 'Revenue - COGS - OpEx (excluding D&A)',
    category: 'operations',
  },
  
  dau: {
    term: 'dau',
    shortName: 'DAU',
    fullName: 'Daily Active Users',
    definition: 'Unique users who engage with your product each day. Key engagement metric.',
    category: 'operations',
  },
  
  mau: {
    term: 'mau',
    shortName: 'MAU',
    fullName: 'Monthly Active Users',
    definition: 'Unique users who engage with your product each month.',
    category: 'operations',
  },
  
  'dau-mau': {
    term: 'dau-mau',
    shortName: 'DAU/MAU',
    fullName: 'Daily to Monthly Active User Ratio',
    definition: 'Stickiness metric. What percentage of monthly users come back daily?',
    formula: 'DAU ÷ MAU × 100',
    example: '5K DAU ÷ 20K MAU = 25% (users come back ~7.5 days/month)',
    goodBad: {
      good: '20%+ (sticky product)',
      bad: 'Below 10%',
    },
    category: 'operations',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getMetric(term: string): MetricDefinition | undefined {
  return METRICS_GLOSSARY[term.toLowerCase()];
}

export function getMetricsByCategory(category: MetricDefinition['category']): MetricDefinition[] {
  return Object.values(METRICS_GLOSSARY).filter(m => m.category === category);
}

export function searchMetrics(query: string): MetricDefinition[] {
  const q = query.toLowerCase();
  return Object.values(METRICS_GLOSSARY).filter(m => 
    m.shortName.toLowerCase().includes(q) ||
    m.fullName.toLowerCase().includes(q) ||
    m.definition.toLowerCase().includes(q)
  );
}

export const METRIC_CATEGORIES = {
  revenue: { label: 'Revenue', icon: '💰', color: '#10b981' },
  growth: { label: 'Growth', icon: '📈', color: '#22d3ee' },
  efficiency: { label: 'Efficiency', icon: '⚡', color: '#fbbf24' },
  retention: { label: 'Retention', icon: '🔄', color: '#F87171' },
  funding: { label: 'Funding & Cash', icon: '🏦', color: '#f97316' },
  valuation: { label: 'Valuation', icon: '💎', color: '#ec4899' },
  operations: { label: 'Operations', icon: '⚙️', color: '#64748b' },
};

