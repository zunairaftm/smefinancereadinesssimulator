/* =========================================================
   fields.js - the single list of questions on the form.
   Each "key" is the name the scoring engine (Phase 3) will use,
   and each one matches a row on the Inputs sheet of your Excel file.
   "required: false" means context only (not used in the score).
   ========================================================= */

var SME_SECTIONS = [
  {
    id: 'business',
    title: '1. Business information',
    intro: 'Annual amounts in Pakistani rupees (PKR). Fields marked "context only" are not used in the score.',
    fields: [
      { key: 'businessAge',        label: 'Business age',                   type: 'number', unit: 'Years',  step: '1',   required: false },
      { key: 'employees',          label: 'Number of employees',            type: 'number', unit: 'People', step: '1',   required: false },
      { key: 'revenue',            label: 'Annual revenue',                 type: 'number', unit: 'PKR',    required: true },
      { key: 'operatingExpenses',  label: 'Annual operating expenses',      type: 'number', unit: 'PKR',    required: true },
      { key: 'totalAssets',        label: 'Total assets',                   type: 'number', unit: 'PKR',    required: true },
      { key: 'currentAssets',      label: 'Current assets',                 type: 'number', unit: 'PKR',    required: true },
      { key: 'currentLiabilities', label: 'Current liabilities',            type: 'number', unit: 'PKR',    required: true },
      { key: 'totalDebt',          label: 'Total debt',                     type: 'number', unit: 'PKR',    required: true },
      { key: 'interestExpense',    label: 'Annual interest expense',        type: 'number', unit: 'PKR',    required: false },
      { key: 'principalRepayment', label: 'Annual principal repayment',     type: 'number', unit: 'PKR',    required: false },
      { key: 'cash',               label: 'Cash & cash equivalents',        type: 'number', unit: 'PKR',    required: false }
    ]
  },
  {
    id: 'cashflow',
    title: '2. Cash-flow management',
    intro: 'Monthly averages in PKR.',
    fields: [
      { key: 'monthlyInflow',      label: 'Average monthly cash inflow',    type: 'number', unit: 'PKR',    required: true },
      { key: 'monthlyOutflow',     label: 'Average monthly cash outflow',   type: 'number', unit: 'PKR',    required: true },
      { key: 'monthlyDebtPayment', label: 'Average monthly debt payment',   type: 'number', unit: 'PKR',    required: true },
      { key: 'cashReserveMonths',  label: 'Cash reserve',                   type: 'number', unit: 'Months', step: 'any', required: true },
      { key: 'monitoringFrequency', label: 'Cash-flow monitoring frequency', type: 'select', required: true,
        options: ['Monthly', 'Quarterly', 'Less often'] }
    ]
  },
  {
    id: 'records',
    title: '3. Financial records',
    intro: 'Does your business do the following?',
    fields: [
      { key: 'recFormalRecords', label: 'Formal accounting records maintained',            type: 'yesno', required: true },
      { key: 'recStatements',    label: 'Financial statements prepared',                   type: 'yesno', required: true },
      { key: 'recBankAccount',   label: 'Business bank account used',                      type: 'yesno', required: true },
      { key: 'recSeparation',    label: 'Business and personal finances separated',        type: 'yesno', required: true },
      { key: 'recUpdated',       label: 'Records updated regularly',                       type: 'yesno', required: true },
      { key: 'recSoftware',      label: 'Accounting software used',                        type: 'yesno', required: true },
      { key: 'recTwoYears',      label: 'At least 2 years of financial records available', type: 'yesno', required: true }
    ]
  },
  {
    id: 'planning',
    title: '4. Financial planning',
    intro: 'Does your business do the following?',
    fields: [
      { key: 'planBudget',          label: 'Annual budget prepared',        type: 'yesno', required: true },
      { key: 'planRevenueForecast', label: 'Revenue forecast prepared',     type: 'yesno', required: true },
      { key: 'planExpenseForecast', label: 'Expense forecast prepared',     type: 'yesno', required: true },
      { key: 'planVariance',        label: 'Actual vs. budget reviewed',    type: 'yesno', required: true },
      { key: 'planTargets',         label: 'Financial targets established', type: 'yesno', required: true },
      { key: 'planEmergency',       label: 'Emergency financial plan exists', type: 'yesno', required: true }
    ]
  }
];

/* Demo values copied from the Inputs sheet of your Excel file.
   Expected result in Excel: 86.24, "Ready". */
var SME_DEMO_DATA = {
  businessAge: 5,
  employees: 12,
  revenue: 12000000,
  operatingExpenses: 9000000,
  totalAssets: 8000000,
  currentAssets: 3000000,
  currentLiabilities: 2000000,
  totalDebt: 2500000,
  interestExpense: 300000,
  principalRepayment: 500000,
  cash: 1200000,
  monthlyInflow: 1000000,
  monthlyOutflow: 750000,
  monthlyDebtPayment: 67000,
  cashReserveMonths: 2,
  monitoringFrequency: 'Monthly',
  recFormalRecords: 'Yes',
  recStatements: 'Yes',
  recBankAccount: 'Yes',
  recSeparation: 'Yes',
  recUpdated: 'Yes',
  recSoftware: 'No',
  recTwoYears: 'Yes',
  planBudget: 'Yes',
  planRevenueForecast: 'Yes',
  planExpenseForecast: 'Yes',
  planVariance: 'No',
  planTargets: 'Yes',
  planEmergency: 'No'
};
