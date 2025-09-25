-- CreateTable accounts
CREATE TABLE "accounts" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" TEXT NOT NULL,
  "pluggy_account_id" TEXT,
  "pluggy_item_id" TEXT,
  "name" TEXT NOT NULL,
  "account_type" TEXT NOT NULL,
  "account_subtype" TEXT,
  "institution_name" TEXT,
  "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "currency_code" TEXT NOT NULL DEFAULT 'BRL',
  "is_active" BOOLEAN NOT NULL DEFAULT 1,
  "sync_enabled" BOOLEAN NOT NULL DEFAULT 1,
  "last_sync_at" DATETIME,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "marketing_name" TEXT,
  "number" TEXT,
  "owner" TEXT,
  "tax_number" TEXT,
  "status" TEXT,
  "category" TEXT,
  "sub_category" TEXT,
  "pluggy_created_at" DATETIME,
  "pluggy_updated_at" DATETIME,
  "pluggy_last_updated_at" DATETIME,
  "transfer_number" TEXT,
  "closing_balance" DECIMAL(18,2),
  "automatically_invested_balance" DECIMAL(18,2),
  "overdraft_contracted_limit" DECIMAL(18,2),
  "overdraft_used_limit" DECIMAL(18,2),
  "unarranged_overdraft_amount" DECIMAL(18,2),
  "branch_code" TEXT,
  "account_digit" TEXT,
  "compe_code" TEXT,
  "credit_level" TEXT,
  "credit_brand" TEXT,
  "balance_close_date" DATETIME,
  "balance_due_date" DATETIME,
  "minimum_payment" DECIMAL(18,2),
  "credit_limit" DECIMAL(18,2),
  "available_credit_limit" DECIMAL(18,2),
  "is_limit_flexible" BOOLEAN,
  "total_installment_balance" DECIMAL(18,2),
  "interest_rate" DECIMAL(10,4),
  "fine_rate" DECIMAL(10,4),
  "annual_fee" DECIMAL(18,2),
  "card_network" TEXT,
  "card_type" TEXT,
  "contract_number" TEXT,
  "principal_amount" DECIMAL(18,2),
  "outstanding_balance" DECIMAL(18,2),
  "loan_interest_rate" DECIMAL(10,4),
  "installment_amount" DECIMAL(18,2),
  "installment_frequency" TEXT,
  "remaining_installments" INTEGER,
  "total_installments" INTEGER,
  "due_date" DATETIME,
  "maturity_date" DATETIME,
  "origination_date" DATETIME,
  "product_name" TEXT,
  "investment_type" TEXT,
  "portfolio_value" DECIMAL(18,2),
  "net_worth" DECIMAL(18,2),
  "gross_worth" DECIMAL(18,2),
  "last_movement_date" DATETIME,
  "investment_rate" DECIMAL(10,4),
  "rate_type" TEXT,
  "indexer" TEXT,
  "investment_maturity_date" DATETIME,
  "isin" TEXT,
  "quantity" DECIMAL(18,6),
  "unit_price" DECIMAL(18,6)
);

CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateTable transactions
CREATE TABLE "transactions" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" TEXT NOT NULL,
  "account_id" INTEGER,
  "pluggy_transaction_id" TEXT,
  "transaction_hash" TEXT,
  "amount" DECIMAL(18,2) NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "transaction_type" TEXT NOT NULL DEFAULT 'expense',
  "date" DATETIME NOT NULL,
  "balance_after" DECIMAL(18,2),
  "merchant_name" TEXT,
  "merchant_category" TEXT,
  "payment_method" TEXT,
  "tags" TEXT,
  "notes" TEXT,
  "reconciled" BOOLEAN NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "provider_code" TEXT,
  "operation_type" TEXT,
  "pix_data" TEXT,
  "installment_data" TEXT,
  "location_data" TEXT,
  "foreign_exchange_data" TEXT,
  "fees_data" TEXT,
  "processed_at" DATETIME,
  "is_synced_from_bank" BOOLEAN NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");
CREATE INDEX "transactions_account_id_idx" ON "transactions"("account_id");
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");

-- CreateTable budgets
CREATE TABLE "budgets" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "spent" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "period_start" DATETIME NOT NULL,
  "period_end" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "notes" TEXT,
  "account_id" INTEGER,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "budgets_account_id_fkey" FOREIGN KEY("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "budgets_user_id_idx" ON "budgets"("user_id");
CREATE INDEX "budgets_user_id_category_idx" ON "budgets"("user_id", "category");

-- CreateTable goals
CREATE TABLE "goals" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "target_amount" DECIMAL(18,2) NOT NULL,
  "current_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "target_date" DATETIME NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'savings',
  "status" TEXT NOT NULL DEFAULT 'active',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "account_id" INTEGER,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goals_account_id_fkey" FOREIGN KEY("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "goals_user_id_idx" ON "goals"("user_id");

-- Trigger to update updated_at columns on modification
CREATE TRIGGER IF NOT EXISTS "accounts_updated_at"
AFTER UPDATE ON "accounts"
FOR EACH ROW
BEGIN
  UPDATE "accounts" SET "updated_at" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

CREATE TRIGGER IF NOT EXISTS "transactions_updated_at"
AFTER UPDATE ON "transactions"
FOR EACH ROW
BEGIN
  UPDATE "transactions" SET "updated_at" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

CREATE TRIGGER IF NOT EXISTS "budgets_updated_at"
AFTER UPDATE ON "budgets"
FOR EACH ROW
BEGIN
  UPDATE "budgets" SET "updated_at" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

CREATE TRIGGER IF NOT EXISTS "goals_updated_at"
AFTER UPDATE ON "goals"
FOR EACH ROW
BEGIN
  UPDATE "goals" SET "updated_at" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;
