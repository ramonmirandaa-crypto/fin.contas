import z from "zod";

export const ExpenseSchema = z.object({
  id: z.number(),
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.string().min(1),
  date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.string().min(1),
  date: z.string(),
});

export const AIInsightSchema = z.object({
  summary: z.string(),
  tips: z.array(z.string()),
  categoryBreakdown: z.record(z.string(), z.number()),
  spendingTrend: z.enum(['increasing', 'decreasing', 'stable']),
});

export type Expense = z.infer<typeof ExpenseSchema>;
export type CreateExpense = z.infer<typeof CreateExpenseSchema>;
export type AIInsight = z.infer<typeof AIInsightSchema>;

// Credit Card schemas
export const CreditCardSchema = z.object({
  id: z.number(),
  name: z.string(),
  credit_limit: z.number().positive(),
  current_balance: z.number().min(0),
  due_day: z.number().min(1).max(31),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCreditCardSchema = z.object({
  name: z.string().min(1),
  credit_limit: z.number().positive(),
  current_balance: z.number().min(0).default(0),
  due_day: z.number().min(1).max(31),
});

// Investment schemas
export const InvestmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  amount: z.number().positive(),
  purchase_date: z.string(),
  current_value: z.number().nullable(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateInvestmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  amount: z.number().positive(),
  purchase_date: z.string(),
  current_value: z.number().positive().nullable().default(null),
});

// Loan schemas
export const LoanSchema = z.object({
  id: z.number(),
  name: z.string(),
  principal_amount: z.number().positive(),
  interest_rate: z.number().min(0),
  start_date: z.string(),
  end_date: z.string(),
  monthly_payment: z.number().positive(),
  remaining_balance: z.number().min(0),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateLoanSchema = z.object({
  name: z.string().min(1),
  principal_amount: z.number().positive(),
  interest_rate: z.number().min(0),
  start_date: z.string(),
  end_date: z.string(),
  monthly_payment: z.number().positive(),
  remaining_balance: z.number().positive(),
});

// Type exports
export type CreditCard = z.infer<typeof CreditCardSchema>;
export type CreateCreditCard = z.infer<typeof CreateCreditCardSchema>;
export type Investment = z.infer<typeof InvestmentSchema>;
export type CreateInvestment = z.infer<typeof CreateInvestmentSchema>;
export type Loan = z.infer<typeof LoanSchema>;
export type CreateLoan = z.infer<typeof CreateLoanSchema>;

// Account schemas
export const AccountSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  pluggy_account_id: z.string().nullable(),
  pluggy_item_id: z.string().nullable(),
  name: z.string(),
  account_type: z.enum(['checking', 'savings', 'credit_card', 'loan', 'investment']),
  account_subtype: z.string().nullable(),
  institution_name: z.string().nullable(),
  balance: z.number().default(0),
  currency_code: z.string().default('BRL'),
  is_active: z.boolean().default(true),
  sync_enabled: z.boolean().default(true),
  last_sync_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  
  // Additional Pluggy fields
  marketing_name: z.string().nullable(),
  number: z.string().nullable(),
  owner: z.string().nullable(),
  tax_number: z.string().nullable(),
  status: z.string().nullable(),
  category: z.string().nullable(),
  sub_category: z.string().nullable(),
  pluggy_created_at: z.string().nullable(),
  pluggy_updated_at: z.string().nullable(),
  pluggy_last_updated_at: z.string().nullable(),
  
  // Bank account specific fields
  transfer_number: z.string().nullable(),
  closing_balance: z.number().nullable(),
  automatically_invested_balance: z.number().nullable(),
  overdraft_contracted_limit: z.number().nullable(),
  overdraft_used_limit: z.number().nullable(),
  unarranged_overdraft_amount: z.number().nullable(),
  branch_code: z.string().nullable(),
  account_digit: z.string().nullable(),
  compe_code: z.string().nullable(),
  
  // Credit card specific fields
  credit_level: z.string().nullable(),
  credit_brand: z.string().nullable(),
  balance_close_date: z.string().nullable(),
  balance_due_date: z.string().nullable(),
  minimum_payment: z.number().nullable(),
  credit_limit: z.number().nullable(),
  available_credit_limit: z.number().nullable(),
  is_limit_flexible: z.boolean().nullable(),
  total_installment_balance: z.number().nullable(),
  interest_rate: z.number().nullable(),
  fine_rate: z.number().nullable(),
  annual_fee: z.number().nullable(),
  card_network: z.string().nullable(),
  card_type: z.string().nullable(),
  
  // Loan specific fields
  contract_number: z.string().nullable(),
  principal_amount: z.number().nullable(),
  outstanding_balance: z.number().nullable(),
  loan_interest_rate: z.number().nullable(),
  installment_amount: z.number().nullable(),
  installment_frequency: z.string().nullable(),
  remaining_installments: z.number().nullable(),
  total_installments: z.number().nullable(),
  due_date: z.string().nullable(),
  maturity_date: z.string().nullable(),
  origination_date: z.string().nullable(),
  
  // Investment specific fields
  product_name: z.string().nullable(),
  investment_type: z.string().nullable(),
  portfolio_value: z.number().nullable(),
  net_worth: z.number().nullable(),
  gross_worth: z.number().nullable(),
  last_movement_date: z.string().nullable(),
  investment_rate: z.number().nullable(),
  rate_type: z.string().nullable(),
  indexer: z.string().nullable(),
  investment_maturity_date: z.string().nullable(),
  isin: z.string().nullable(),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
});

export const CreateAccountSchema = z.object({
  name: z.string().min(1),
  account_type: z.enum(['checking', 'savings', 'credit_card', 'loan', 'investment']),
  account_subtype: z.string().optional(),
  institution_name: z.string().optional(),
  balance: z.number().default(0),
  sync_enabled: z.boolean().default(true),
});

// Enhanced Transaction schemas with all Pluggy API fields
export const TransactionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  account_id: z.number().nullable(),
  pluggy_transaction_id: z.string().nullable(),
  transaction_hash: z.string().nullable(),
  amount: z.number(),
  description: z.string(),
  category: z.string(),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  date: z.string(),
  balance_after: z.number().nullable(),
  merchant_name: z.string().nullable(),
  merchant_category: z.string().nullable(),
  payment_method: z.string().nullable(), // PIX, TED, DOC, etc.
  tags: z.string().nullable(), // JSON array of tags
  notes: z.string().nullable(),
  reconciled: z.boolean().default(false),
  status: z.string().default('completed'), // pending, completed, failed
  provider_code: z.string().nullable(),
  operation_type: z.string().nullable(),
  pix_data: z.string().nullable(), // JSON PIX data
  installment_data: z.string().nullable(), // JSON installment data
  location_data: z.string().nullable(), // JSON location data
  foreign_exchange_data: z.string().nullable(), // JSON FX data
  fees_data: z.string().nullable(), // JSON fees data
  processed_at: z.string().nullable(),
  is_synced_from_bank: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateTransactionSchema = z.object({
  account_id: z.number().optional(),
  amount: z.number(),
  description: z.string().min(1),
  category: z.string().min(1),
  transaction_type: z.enum(['income', 'expense', 'transfer']).default('expense'),
  date: z.string(),
  merchant_name: z.string().optional(),
  merchant_category: z.string().optional(),
  payment_method: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  reconciled: z.boolean().default(false),
});

// Transaction Category schemas
export const TransactionCategorySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  parent_id: z.number().nullable(),
  description: z.string().nullable(),
  keywords: z.string().nullable(), // JSON array
  rules: z.string().nullable(), // JSON array of rules
  is_default: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateTransactionCategorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  parent_id: z.number().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  rules: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.string()
  })).optional(),
});

// Transaction enrichment schemas
export const TransactionEnrichmentSchema = z.object({
  suggestedCategory: z.string(),
  tags: z.array(z.string()),
  notes: z.string().nullable(),
  isRecurring: z.boolean(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  merchantInfo: z.object({
    name: z.string().nullable(),
    category: z.string().nullable(),
    mcc: z.string().nullable(),
  }).nullable(),
  paymentInfo: z.object({
    method: z.string().nullable(),
    pixKey: z.string().nullable(),
    endToEndId: z.string().nullable(),
  }).nullable(),
});

// Bulk operation schemas
export const BulkTransactionOperationSchema = z.object({
  operation: z.enum(['categorize', 'tag', 'reconcile', 'delete']),
  transactionIds: z.array(z.string()),
  params: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    reconciled: z.boolean().optional(),
  }).optional(),
});

// Type exports
export type Account = z.infer<typeof AccountSchema>;
export type CreateAccount = z.infer<typeof CreateAccountSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;
export type CreateTransactionCategory = z.infer<typeof CreateTransactionCategorySchema>;
export type TransactionEnrichment = z.infer<typeof TransactionEnrichmentSchema>;
export type BulkTransactionOperation = z.infer<typeof BulkTransactionOperationSchema>;

// Budget schemas
export const BudgetSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
  category: z.string(),
  amount: z.number(),
  spent: z.number(),
  period_start: z.string(),
  period_end: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  account_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  account_name: z.string().nullable().optional(),
});

export const CreateBudgetSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  amount: z.number(),
  spent: z.number().optional(),
  period_start: z.string(),
  period_end: z.string(),
  status: z.string().optional(),
  notes: z.string().optional(),
  account_id: z.number().optional(),
});

export const GoalSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  target_amount: z.number(),
  current_amount: z.number(),
  target_date: z.string(),
  category: z.enum(['savings', 'investment', 'expense_reduction', 'debt_payment', 'other']),
  status: z.enum(['active', 'completed', 'paused']),
  priority: z.enum(['low', 'medium', 'high']),
  account_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  account_name: z.string().nullable().optional(),
});

export const CreateGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  target_amount: z.number(),
  current_amount: z.number().optional(),
  target_date: z.string(),
  category: z.enum(['savings', 'investment', 'expense_reduction', 'debt_payment', 'other']).optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  account_id: z.number().optional(),
});

export type Budget = z.infer<typeof BudgetSchema>;
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type CreateGoal = z.infer<typeof CreateGoalSchema>;

// Credit Card Bill schemas
export const CreditCardBillSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  account_id: z.number().nullable(),
  pluggy_bill_id: z.string().nullable(),
  
  // Basic bill information
  closing_date: z.string().nullable(),
  due_date: z.string().nullable(),
  total_amount: z.number().default(0),
  minimum_payment: z.number().default(0),
  previous_bill_balance: z.number().default(0),
  
  // Payment information
  paid_amount: z.number().default(0),
  payment_date: z.string().nullable(),
  is_fully_paid: z.boolean().default(false),
  
  // Interest and fees
  interest_rate: z.number().nullable(),
  late_fee: z.number().default(0),
  annual_fee: z.number().default(0),
  international_fee: z.number().default(0),
  
  // Bill status and metadata
  bill_status: z.string().nullable(),
  currency_code: z.string().default('BRL'),
  bill_month: z.number().nullable(),
  bill_year: z.number().nullable(),
  
  // Pluggy metadata
  pluggy_created_at: z.string().nullable(),
  pluggy_updated_at: z.string().nullable(),
  
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCreditCardBillSchema = z.object({
  account_id: z.number().optional(),
  closing_date: z.string().optional(),
  due_date: z.string().optional(),
  total_amount: z.number().default(0),
  minimum_payment: z.number().default(0),
  previous_bill_balance: z.number().default(0),
  paid_amount: z.number().default(0),
  payment_date: z.string().optional(),
  is_fully_paid: z.boolean().default(false),
  bill_status: z.string().optional(),
  bill_month: z.number().optional(),
  bill_year: z.number().optional(),
});

// Credit Card Transaction schemas
export const CreditCardTransactionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  bill_id: z.number().nullable(),
  account_id: z.number().nullable(),
  pluggy_transaction_id: z.string().nullable(),
  
  // Transaction details
  amount: z.number(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  date: z.string().nullable(),
  
  // Credit card specific fields
  installment_number: z.number().nullable(),
  total_installments: z.number().nullable(),
  merchant_name: z.string().nullable(),
  merchant_category: z.string().nullable(),
  
  // Transaction metadata
  transaction_type: z.string().nullable(),
  currency_code: z.string().default('BRL'),
  
  // Pluggy metadata
  pluggy_created_at: z.string().nullable(),
  pluggy_updated_at: z.string().nullable(),
  
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCreditCardTransactionSchema = z.object({
  bill_id: z.number().optional(),
  account_id: z.number().optional(),
  amount: z.number(),
  description: z.string().optional(),
  category: z.string().optional(),
  date: z.string().optional(),
  installment_number: z.number().optional(),
  total_installments: z.number().optional(),
  merchant_name: z.string().optional(),
  merchant_category: z.string().optional(),
  transaction_type: z.string().optional(),
});

// Type exports
export type CreditCardBill = z.infer<typeof CreditCardBillSchema>;
export type CreateCreditCardBill = z.infer<typeof CreateCreditCardBillSchema>;
export type CreditCardTransaction = z.infer<typeof CreditCardTransactionSchema>;
export type CreateCreditCardTransaction = z.infer<typeof CreateCreditCardTransactionSchema>;

export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Compras',
  'Entretenimento',
  'Contas e Serviços',
  'Saúde',
  'Viagem',
  'Educação',
  'Cuidados Pessoais',
  'Outros'
] as const;

export const INVESTMENT_TYPES = [
  'Ações',
  'Fundos Imobiliários',
  'Tesouro Direto',
  'CDB',
  'LCI/LCA',
  'Poupança',
  'Fundos de Investimento',
  'Criptomoedas',
  'Outros'
] as const;
