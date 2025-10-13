PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  pluggy_account_id TEXT,
  pluggy_item_id TEXT,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_subtype TEXT,
  institution_name TEXT,
  balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'BRL',
  is_active INTEGER NOT NULL DEFAULT 1,
  sync_enabled INTEGER NOT NULL DEFAULT 1,
  last_sync_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  marketing_name TEXT,
  number TEXT,
  owner TEXT,
  tax_number TEXT,
  status TEXT,
  category TEXT,
  sub_category TEXT,
  pluggy_created_at DATETIME,
  pluggy_updated_at DATETIME,
  pluggy_last_updated_at DATETIME,
  transfer_number TEXT,
  closing_balance DECIMAL(18,2),
  automatically_invested_balance DECIMAL(18,2),
  overdraft_contracted_limit DECIMAL(18,2),
  overdraft_used_limit DECIMAL(18,2),
  unarranged_overdraft_amount DECIMAL(18,2),
  branch_code TEXT,
  account_digit TEXT,
  compe_code TEXT,
  credit_level TEXT,
  credit_brand TEXT,
  balance_close_date DATETIME,
  balance_due_date DATETIME,
  minimum_payment DECIMAL(18,2),
  credit_limit DECIMAL(18,2),
  available_credit_limit DECIMAL(18,2),
  is_limit_flexible INTEGER,
  total_installment_balance DECIMAL(18,2),
  interest_rate DECIMAL(10,4),
  fine_rate DECIMAL(10,4),
  annual_fee DECIMAL(18,2),
  card_network TEXT,
  card_type TEXT,
  contract_number TEXT,
  principal_amount DECIMAL(18,2),
  outstanding_balance DECIMAL(18,2),
  loan_interest_rate DECIMAL(10,4),
  installment_amount DECIMAL(18,2),
  installment_frequency TEXT,
  remaining_installments INTEGER,
  total_installments INTEGER,
  due_date DATETIME,
  maturity_date DATETIME,
  origination_date DATETIME,
  product_name TEXT,
  investment_type TEXT,
  portfolio_value DECIMAL(18,2),
  net_worth DECIMAL(18,2),
  gross_worth DECIMAL(18,2),
  last_movement_date DATETIME,
  investment_rate DECIMAL(10,4),
  rate_type TEXT,
  indexer TEXT,
  investment_maturity_date DATETIME,
  isin TEXT,
  quantity DECIMAL(18,6),
  unit_price DECIMAL(18,6)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

CREATE TRIGGER IF NOT EXISTS accounts_updated_at
AFTER UPDATE ON accounts
FOR EACH ROW
BEGIN
  UPDATE accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  account_id INTEGER,
  pluggy_transaction_id TEXT,
  transaction_hash TEXT,
  amount DECIMAL(18,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'expense',
  date DATETIME NOT NULL,
  balance_after DECIMAL(18,2),
  merchant_name TEXT,
  merchant_category TEXT,
  payment_method TEXT,
  tags TEXT,
  notes TEXT,
  reconciled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  provider_code TEXT,
  operation_type TEXT,
  pix_data TEXT,
  installment_data TEXT,
  location_data TEXT,
  foreign_exchange_data TEXT,
  fees_data TEXT,
  processed_at DATETIME,
  is_synced_from_bank INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

CREATE TRIGGER IF NOT EXISTS transactions_updated_at
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
  UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  spent DECIMAL(18,2) NOT NULL DEFAULT 0,
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  account_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category);

CREATE TRIGGER IF NOT EXISTS budgets_updated_at
AFTER UPDATE ON budgets
FOR EACH ROW
BEGIN
  UPDATE budgets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(18,2) NOT NULL,
  current_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  target_date DATETIME NOT NULL,
  category TEXT NOT NULL DEFAULT 'savings',
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  account_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

CREATE TRIGGER IF NOT EXISTS goals_updated_at
AFTER UPDATE ON goals
FOR EACH ROW
BEGIN
  UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS credit_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  linked_account_id INTEGER,
  name TEXT NOT NULL,
  credit_limit DECIMAL(18,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL DEFAULT 1,
  closing_day INTEGER,
  issuer TEXT,
  brand TEXT,
  is_virtual INTEGER DEFAULT 0,
  status TEXT,
  last_synced_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(linked_account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON credit_cards(user_id);

CREATE TRIGGER IF NOT EXISTS credit_cards_updated_at
AFTER UPDATE ON credit_cards
FOR EACH ROW
BEGIN
  UPDATE credit_cards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS investments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  account_id INTEGER,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  purchase_date DATETIME,
  current_value DECIMAL(18,2),
  expected_return_rate DECIMAL(10,4),
  risk_level TEXT,
  institution_name TEXT,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);

CREATE TRIGGER IF NOT EXISTS investments_updated_at
AFTER UPDATE ON investments
FOR EACH ROW
BEGIN
  UPDATE investments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  account_id INTEGER,
  name TEXT NOT NULL,
  principal_amount DECIMAL(18,2) NOT NULL,
  interest_rate DECIMAL(10,4) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME,
  monthly_payment DECIMAL(18,2) NOT NULL,
  remaining_balance DECIMAL(18,2) NOT NULL,
  lender TEXT,
  status TEXT,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);

CREATE TRIGGER IF NOT EXISTS loans_updated_at
AFTER UPDATE ON loans
FOR EACH ROW
BEGIN
  UPDATE loans SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS credit_card_bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  account_id INTEGER,
  pluggy_bill_id TEXT,
  closing_date DATETIME,
  due_date DATETIME,
  total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  minimum_payment DECIMAL(18,2) NOT NULL DEFAULT 0,
  previous_bill_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  payment_date DATETIME,
  is_fully_paid INTEGER NOT NULL DEFAULT 0,
  interest_rate DECIMAL(10,4),
  late_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
  annual_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
  international_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
  bill_status TEXT,
  currency_code TEXT NOT NULL DEFAULT 'BRL',
  bill_month INTEGER,
  bill_year INTEGER,
  pluggy_created_at DATETIME,
  pluggy_updated_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credit_card_bills_user ON credit_card_bills(user_id);

CREATE TRIGGER IF NOT EXISTS credit_card_bills_updated_at
AFTER UPDATE ON credit_card_bills
FOR EACH ROW
BEGIN
  UPDATE credit_card_bills SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS transaction_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  description TEXT,
  keywords TEXT,
  parent_id INTEGER,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_categories_user ON transaction_categories(user_id);

CREATE TRIGGER IF NOT EXISTS transaction_categories_updated_at
AFTER UPDATE ON transaction_categories
FOR EACH ROW
BEGIN
  UPDATE transaction_categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATETIME NOT NULL,
  pluggy_transaction_id TEXT,
  is_synced_from_bank INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, pluggy_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(user_id, category);

CREATE TRIGGER IF NOT EXISTS expenses_updated_at
AFTER UPDATE ON expenses
FOR EACH ROW
BEGIN
  UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS user_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_configs_user_key ON user_configs(user_id, config_key);

CREATE TABLE IF NOT EXISTS pluggy_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  pluggy_item_id TEXT NOT NULL,
  institution_name TEXT,
  connection_status TEXT,
  last_sync_at TEXT,
  client_user_id TEXT,
  connector_id TEXT,
  connector_name TEXT,
  connector_image_url TEXT,
  connector_primary_color TEXT,
  org_id TEXT,
  org_name TEXT,
  org_domain TEXT,
  status_detail TEXT,
  execution_status TEXT,
  last_sync_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, pluggy_item_id)
);

CREATE INDEX IF NOT EXISTS idx_pluggy_connections_user ON pluggy_connections(user_id);

CREATE TABLE IF NOT EXISTS webhook_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  events TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id TEXT NOT NULL,
  success INTEGER NOT NULL,
  error_message TEXT,
  attempt_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
